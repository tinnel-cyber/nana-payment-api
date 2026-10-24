import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface ExportPdfOptions {
  filename?: string;
  quality?: number; // 1 to 4 (scale multiplier)
  onProgress?: (step: 'PREPARING' | 'RENDERING' | 'SAVING' | 'DONE') => void;
}

export interface ExportPdfResult {
  success: boolean;
  error?: string;
}

/**
 * Nettoyage et assainissement des styles bloquants pour html2canvas :
 * - Convertit les couleurs CSS non supportées (oklch, oklab, color-mix) en HEX/RGB standards
 * - Supprime les ombres complexes (box-shadow) et filtres (filter, backdrop-filter)
 * - Force des styles stricts HEX/RGB sur le conteneur du CV
 */
function sanitizeCssColors(text: string): string {
  if (!text || !text.toLowerCase().includes('oklch')) return text;

  let canvasCtx: CanvasRenderingContext2D | null = null;
  try {
    const cvs = document.createElement('canvas');
    cvs.width = 1;
    cvs.height = 1;
    canvasCtx = cvs.getContext('2d');
  } catch (_) {}

  return text.replace(/oklch\([^)]+\)/gi, (match) => {
    if (canvasCtx) {
      try {
        canvasCtx.fillStyle = '#000000';
        canvasCtx.fillStyle = match;
        const converted = canvasCtx.fillStyle;
        if (converted && !converted.toLowerCase().includes('oklch')) {
          return converted;
        }
      } catch (_) {}
    }
    return '#1e293b'; // Fallback HEX standard
  });
}

/**
 * Moteur d'exportation PDF Haute Définition (HD - 300 DPI)
 * Capture le conteneur du CV avec un scale élevé et l'intègre au format A4 normalisé.
 * Intègre un bloc try/catch robuste, validation de taille du canvas, et repli (fallback).
 */
export async function exportResumeToHdPdf(
  element: HTMLElement,
  options: ExportPdfOptions = {}
): Promise<ExportPdfResult> {
  const {
    filename = 'CV_Professionnel.pdf',
    quality = 3, // Multiplicateur Haute Définition 300 DPI (scale: 3 requis)
    onProgress
  } = options;

  try {
    if (!element) {
      throw new Error("Le conteneur DOM du CV est introuvable ou non monté.");
    }

    if (onProgress) onProgress('PREPARING');

    // Vérifier et attendre le chargement complet des polices de caractères
    if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
      try {
        await (document as any).fonts.ready;
      } catch (fontErr) {
        console.warn('[CV EXPORT HD] Avertissement polices :', fontErr);
      }
    }

    // Petite temporisation pour s'assurer que les images base64 et styles sont peints
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Sauvegarde des styles temporaires pour éviter les déformations
    const originalShadow = element.style.boxShadow;
    const originalTransform = element.style.transform;
    element.style.boxShadow = 'none';
    element.style.transform = 'none';

    if (onProgress) onProgress('RENDERING');

    // Fonction interne de rendu canvas avec démasquage complet dans l'arbre cloné
    const renderCanvas = async (scaleMultiplier: number) => {
      return await html2canvas(element, {
        scale: scaleMultiplier, // Configuré obligatoirement à 2 (ou fallback 1.5)
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // 1. Nettoyer les balises <style> contenant du oklch issu de Tailwind v4
          try {
            const styleTags = clonedDoc.querySelectorAll('style');
            styleTags.forEach((tag) => {
              if (tag.textContent && tag.textContent.toLowerCase().includes('oklch')) {
                tag.textContent = sanitizeCssColors(tag.textContent);
              }
            });
          } catch (e) {
            console.warn('[CV EXPORT HD] Nettoyage balises style non bloquant :', e);
          }

          const targetId = element.id || 'printable-cv-document';
          const clonedElement = (clonedDoc.getElementById(targetId) ||
            clonedDoc.getElementById('printable-cv-document') ||
            clonedDoc.querySelector('#printable-cv-document') ||
            clonedDoc.querySelector('.cv-preview-wrapper > div')) as HTMLElement | null;
          if (clonedElement) {
            // Démasquer et libérer tous les parents du conteneur cloné pour éviter display: none ou scale
            let parentNode: HTMLElement | null = clonedElement.parentElement;
            while (parentNode && parentNode !== clonedDoc.body) {
              parentNode.style.display = 'block';
              parentNode.style.visibility = 'visible';
              parentNode.style.transform = 'none';
              parentNode.style.width = 'auto';
              parentNode.style.height = 'auto';
              parentNode.style.overflow = 'visible';
              parentNode.style.margin = '0';
              parentNode.style.padding = '0';
              parentNode = parentNode.parentElement;
            }

            // Réinitialiser le corps cloné
            clonedDoc.body.style.overflow = 'visible';
            clonedDoc.body.style.width = 'auto';
            clonedDoc.body.style.height = 'auto';

            // 2. Nettoyage des styles bloquants : supprimer ombres complexes, filtres et oklch
            const allNodes = [clonedElement, ...Array.from(clonedElement.querySelectorAll('*'))] as HTMLElement[];
            allNodes.forEach((node) => {
              if (!node || !node.style) return;

              // Suppression des ombres et filtres qui font planter ou rendent noir dans html2canvas
              node.style.boxShadow = 'none';
              node.style.textShadow = 'none';
              node.style.filter = 'none';
              (node.style as any).backdropFilter = 'none';

              // Nettoyer style inline s'il y a du oklch
              const inlineStyle = node.getAttribute('style');
              if (inlineStyle && inlineStyle.toLowerCase().includes('oklch')) {
                node.setAttribute('style', sanitizeCssColors(inlineStyle));
              }

              // Remplacer les couleurs calculées oklch par des couleurs HEX/RGB standards
              try {
                const computed = window.getComputedStyle(node);
                ['color', 'backgroundColor', 'borderColor'].forEach((prop) => {
                  const val = computed.getPropertyValue(prop);
                  if (val && val.toLowerCase().includes('oklch')) {
                    node.style.setProperty(prop, sanitizeCssColors(val), 'important');
                  }
                });
              } catch (_) {}
            });

            // 3. Forcer des couleurs HEX/RGB standards et format strict A4 sur le conteneur du CV
            clonedElement.style.display = 'block';
            clonedElement.style.visibility = 'visible';
            clonedElement.style.transform = 'none';
            clonedElement.style.boxShadow = 'none';
            clonedElement.style.filter = 'none';
            clonedElement.style.backgroundColor = '#ffffff';
            clonedElement.style.color = '#0f172a';
            clonedElement.style.margin = '0 auto';
            clonedElement.style.width = '794px';
            clonedElement.style.minHeight = '1123px';
            clonedElement.style.maxHeight = '1123px';
            clonedElement.style.position = 'static';
            (clonedElement.style as any).webkitPrintColorAdjust = 'exact';
            (clonedElement.style as any).printColorAdjust = 'exact';
          }
        }
      });
    };

    // Tentative de capture Haute Définition 300 DPI (scale: 3) avec repli adaptatif
    let canvas: HTMLCanvasElement;
    try {
      canvas = await renderCanvas(quality);
    } catch (primaryError) {
      console.warn('[CV EXPORT HD] Échec scale: 3, bascule de secours scale: 2 :', primaryError);
      try {
        canvas = await renderCanvas(2);
      } catch (secondaryError) {
        console.warn('[CV EXPORT HD] Échec scale: 2, bascule de secours scale: 1.5 :', secondaryError);
        canvas = await renderCanvas(1.5);
      }
    }

    // Rétablissement des styles initiaux de l'élément d'origine
    element.style.boxShadow = originalShadow;
    element.style.transform = originalTransform;

    // Validation stricte du résultat graphique pour éviter les pages blanches
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error("La capture graphique a produit une image vide (0x0). Assurez-vous que le CV est visible à l'écran.");
    }

    if (onProgress) onProgress('SAVING');

    // 2. Conversion en image JPEG Haute Définition (qualité 0.95 pour netteté maximale et téléchargement rapide)
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    if (!imgData || imgData === 'data:,' || imgData.length < 100) {
      throw new Error("L'extraction de l'image du CV a échoué.");
    }

    // Création du document PDF A4 strict
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // Dimensions exactes A4 en millimètres (210 x 297 mm)
    const pdfWidth = 210;
    const pdfHeight = 297;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

    // Téléchargement sécurisé avec fallback automatique sur window.print() si le navigateur mobile bloque le download
    try {
      pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    } catch (saveError: any) {
      console.warn('[CV EXPORT HD] Le navigateur mobile a bloqué le téléchargement direct, déclenchement du fallback d\'impression native :', saveError);
      if (typeof window !== 'undefined') {
        window.focus();
        window.print();
        if (onProgress) onProgress('DONE');
        return { success: true };
      }
      throw saveError;
    }

    if (onProgress) onProgress('DONE');
    return { success: true };
  } catch (error: any) {
    // Rétablissement des styles si exception avant le bloc de réinitialisation
    if (element) {
      element.style.boxShadow = '';
      element.style.transform = '';
    }
    const message = error?.message || 'Erreur inconnue lors de la génération PDF.';
    console.error('[CV EXPORT HD] Erreur critique lors de la génération du PDF :', error);
    return { success: false, error: message };
  }
}

/**
 * Déclenchement de l'impression système optimisée A4 (Ctrl+P / Impression Vectorielle)
 */
export function printResumeDocument(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    window.focus();
    window.print();
    return true;
  } catch (err) {
    console.error('[CV PRINT] Erreur lors du déclenchement de l\'impression :', err);
    return false;
  }
}
