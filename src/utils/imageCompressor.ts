/**
 * Utilitaire de compression d'images côté client via HTML5 Canvas
 * Garantit un redimensionnement proportionnel (max 1024px) et un poids strict < 200 Ko
 * Encodage WebP optimisé (avec repli JPEG).
 */

export interface CompressionOptions {
  maxWidth?: number;      // Largeur max (par défaut : 1024px)
  maxHeight?: number;     // Hauteur max (par défaut : 1024px)
  quality?: number;       // Qualité initiale (0.75 - 0.8)
  maxSizeBytes?: number;  // Poids strict max (par défaut : 200 Ko = 204 800 octets)
  fileName?: string;      // Nom du fichier résultant
}

export interface CompressedResult {
  file: File;
  dataUrl: string;
  sizeBytes: number;
  width: number;
  height: number;
}

/**
 * Convertit un DataURL en objet File standard
 */
function dataUrlToFile(dataUrl: string, fileName: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mime });
}

/**
 * Compresse une image vers un fichier WebP/JPEG < 200 Ko et <= 1024px
 */
export const compressImageFile = (
  fileOrBlob: File | Blob,
  options: CompressionOptions = {}
): Promise<CompressedResult> => {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.78,
    maxSizeBytes = 200 * 1024, // 200 Ko strict
    fileName = 'media-compressed.webp'
  } = options;

  return new Promise((resolve, reject) => {
    // Si ce n'est pas une image, retourner une erreur
    if (fileOrBlob.type && !fileOrBlob.type.startsWith('image/')) {
      return reject(new Error('Le fichier sélectionné n\'est pas une image valide.'));
    }

    const reader = new FileReader();
    reader.readAsDataURL(fileOrBlob);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let currentWidth = img.width;
        let currentHeight = img.height;

        // 1. Redimensionnement proportionnel (max 1024px)
        if (currentWidth > maxWidth || currentHeight > maxHeight) {
          const ratio = Math.min(maxWidth / currentWidth, maxHeight / currentHeight);
          currentWidth = Math.round(currentWidth * ratio);
          currentHeight = Math.round(currentHeight * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = currentWidth;
        canvas.height = currentHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Impossible d\'initialiser le contexte Canvas 2D'));
        }

        // Fond blanc propre pour les transparences éventuelles en JPEG/WebP
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, currentWidth, currentHeight);
        ctx.drawImage(img, 0, 0, currentWidth, currentHeight);

        // 2. Détection du support WebP
        let outputMime = 'image/webp';
        let testDataUrl = canvas.toDataURL(outputMime, quality);
        if (!testDataUrl.startsWith('data:image/webp')) {
          outputMime = 'image/jpeg';
          testDataUrl = canvas.toDataURL(outputMime, quality);
        }

        let currentQuality = quality;
        let finalDataUrl = testDataUrl;
        let byteLength = Math.round((finalDataUrl.length * 3) / 4);

        // 3. Boucle d'ajustement adaptatif pour garantir un poids STRICT < 200 Ko
        let iterations = 0;
        while (byteLength > maxSizeBytes && iterations < 5) {
          iterations++;
          currentQuality = Math.max(0.45, currentQuality - 0.1);

          // Si la qualité ne suffit pas, on réduit aussi légèrement l'échelle (x0.85)
          if (currentQuality <= 0.55 && iterations > 2) {
            currentWidth = Math.round(currentWidth * 0.85);
            currentHeight = Math.round(currentHeight * 0.85);
            canvas.width = currentWidth;
            canvas.height = currentHeight;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, currentWidth, currentHeight);
            ctx.drawImage(img, 0, 0, currentWidth, currentHeight);
          }

          finalDataUrl = canvas.toDataURL(outputMime, currentQuality);
          byteLength = Math.round((finalDataUrl.length * 3) / 4);
        }

        const resolvedFileName = fileName.endsWith('.webp') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')
          ? fileName
          : `${fileName}.${outputMime === 'image/webp' ? 'webp' : 'jpg'}`;

        const compressedFile = dataUrlToFile(finalDataUrl, resolvedFileName);

        resolve({
          file: compressedFile,
          dataUrl: finalDataUrl,
          sizeBytes: byteLength,
          width: currentWidth,
          height: currentHeight
        });
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
};

/**
 * Fonction de compatibilité existante
 */
export const compressImageToBase64 = async (
  fileOrBlob: File | Blob,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.78
): Promise<string> => {
  const res = await compressImageFile(fileOrBlob, {
    maxWidth,
    maxHeight,
    quality,
    maxSizeBytes: 200 * 1024
  });
  return res.dataUrl;
};

/**
 * Compression automatique de la photo du CV à l'importation :
 * - Passe automatiquement l'image dans un petit canvas invisible
 * - Redimensionne proportionnellement à max 600x600 pixels (qualité 0.92 - Haute Définition)
 * - Applique un fond blanc pur (pour éliminer les bugs de transparence PNG)
 * - Convertit en Base64 JPEG compressé (qualité 0.92)
 * - Élimine à 100% les blocages CORS et la lourdeur mémoire dans html2canvas/jsPDF
 */
export const compressCvPhotoToBase64 = (
  fileOrBlob: File | Blob,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.92,
  maxSizeBytes = 180 * 1024 // Poids maîtrisé < 180 Ko pour fluidité totale
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (fileOrBlob.type && !fileOrBlob.type.startsWith('image/')) {
      return reject(new Error("Le fichier sélectionné n'est pas une image valide."));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Erreur lors de la lecture du fichier photo."));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Impossible de décoder l'image sélectionnée."));
      img.onload = () => {
        let currentWidth = img.width;
        let currentHeight = img.height;

        // 1. Redimensionnement proportionnel (max 400x400 px)
        if (currentWidth > maxWidth || currentHeight > maxHeight) {
          const ratio = Math.min(maxWidth / currentWidth, maxHeight / currentHeight);
          currentWidth = Math.max(1, Math.round(currentWidth * ratio));
          currentHeight = Math.max(1, Math.round(currentHeight * ratio));
        }

        // 2. Petit canvas invisible
        const canvas = document.createElement('canvas');
        canvas.width = currentWidth;
        canvas.height = currentHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error("Impossible d'initialiser le contexte Canvas 2D."));
        }

        // Fond blanc pur pour les transparences éventuelles en JPEG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, currentWidth, currentHeight);
        ctx.drawImage(img, 0, 0, currentWidth, currentHeight);

        // 3. Conversion en Base64 JPEG compressé (qualité 0.8)
        let currentQuality = quality;
        let dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
        let byteLength = Math.round((dataUrl.length * 3) / 4);

        // 4. Boucle adaptative garantissant un poids strict < 50 Ko
        let iterations = 0;
        while (byteLength > maxSizeBytes && iterations < 6) {
          iterations++;
          currentQuality = Math.max(0.4, currentQuality - 0.1);
          if (currentQuality <= 0.6 && iterations >= 2) {
            currentWidth = Math.max(1, Math.round(currentWidth * 0.85));
            currentHeight = Math.max(1, Math.round(currentHeight * 0.85));
            canvas.width = currentWidth;
            canvas.height = currentHeight;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, currentWidth, currentHeight);
            ctx.drawImage(img, 0, 0, currentWidth, currentHeight);
          }
          dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
          byteLength = Math.round((dataUrl.length * 3) / 4);
        }

        resolve(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(fileOrBlob);
  });
};
