// Runtime WASM / ONNX pour la transcription vocale hors-ligne (chargement différé pour alléger le démarrage mobile)
let transformersModule: any = null;

async function getTransformers() {
  if (!transformersModule) {
    transformersModule = await import('@xenova/transformers');
    // Configuration du runtime WASM / ONNX pour le navigateur hors-ligne
    transformersModule.env.allowLocalModels = false;
    transformersModule.env.useBrowserCache = true;
    // Limiter à 1 thread pour éviter le besoin de SharedArrayBuffer / en-têtes COOP/COEP stricts
    if (transformersModule.env.backends?.onnx?.wasm) {
      transformersModule.env.backends.onnx.wasm.numThreads = 1;
    }
  }
  return transformersModule;
}


export type WhisperModelStatus = 'IDLE' | 'DOWNLOADING' | 'READY' | 'ERROR';

export interface WhisperProgressEvent {
  status: string;
  progress?: number;
  file?: string;
  loaded?: number;
  total?: number;
}

const MODEL_NAME = 'Xenova/whisper-tiny';

let whisperPipeline: any = null;
let whisperLoadingPromise: Promise<any> | null = null;
let currentStatus: WhisperModelStatus = 'IDLE';
let downloadProgress = 0;
let statusMessage = 'Non chargé';

const listeners: Array<(status: WhisperModelStatus, progress: number, message: string) => void> = [];

function notifyListeners() {
  listeners.forEach((fn) => fn(currentStatus, downloadProgress, statusMessage));
}

export function subscribeWhisperStatus(
  callback: (status: WhisperModelStatus, progress: number, message: string) => void
): () => void {
  listeners.push(callback);
  callback(currentStatus, downloadProgress, statusMessage);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export function getWhisperStatus(): {
  status: WhisperModelStatus;
  progress: number;
  message: string;
} {
  return {
    status: currentStatus,
    progress: downloadProgress,
    message: statusMessage,
  };
}

export function isWhisperReady(): boolean {
  return currentStatus === 'READY' && whisperPipeline !== null;
}

/**
 * Initialise ou précharge le modèle Whisper Tiny WASM dans CacheStorage / IndexedDB.
 */
export async function initWhisperModel(
  onProgress?: (event: WhisperProgressEvent) => void
): Promise<boolean> {
  if (whisperPipeline) {
    currentStatus = 'READY';
    downloadProgress = 100;
    statusMessage = 'Modèle Whisper prêt';
    notifyListeners();
    return true;
  }

  if (whisperLoadingPromise) {
    return whisperLoadingPromise;
  }

  currentStatus = 'DOWNLOADING';
  statusMessage = 'Téléchargement du modèle Whisper (WASM)...';
  notifyListeners();

  whisperLoadingPromise = (async () => {
    try {
      console.log(`[Whisper.wasm] Tentative d'initialisation du pipeline ${MODEL_NAME}...`);
      
      const { pipeline } = await getTransformers();
      const loadPromise = (pipeline as any)(
        'automatic-speech-recognition',
        MODEL_NAME,
        {
          progress_callback: (event: WhisperProgressEvent) => {
            if (event.status === 'progress' && typeof event.progress === 'number') {
              downloadProgress = Math.round(event.progress);
              statusMessage = `Téléchargement du modèle : ${downloadProgress}% (${event.file || ''})`;
            } else if (event.status === 'initiate') {
              statusMessage = `Initialisation de ${event.file || 'fichiers modèle'}...`;
            } else if (event.status === 'done') {
              statusMessage = `Fichier ${event.file || ''} mis en cache locale.`;
            }

            notifyListeners();
            if (onProgress) onProgress(event);
          },
        }
      );

      // Timeout de sécurité (8 secondes max) pour éviter de bloquer indéfiniment si le CDN est inaccessible
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Délai dépassé (réseau distant indisponible)')), 8000)
      );

      whisperPipeline = await Promise.race([loadPromise, timeoutPromise]);

      currentStatus = 'READY';
      downloadProgress = 100;
      statusMessage = 'Modèle Whisper WASM prêt (100% Hors-ligne)';
      notifyListeners();
      console.log('[Whisper.wasm] Pipeline prêt pour la transcription vocale locale.');
      return true;
    } catch (err: any) {
      console.warn('[Whisper.wasm] Modèle distant non disponible (mode hors-ligne ou réseau restreint) :', err?.message || err);
      currentStatus = 'ERROR';
      statusMessage = 'Modèle Whisper non chargé (mode hors-ligne actif)';
      notifyListeners();
      return false;
    } finally {
      whisperLoadingPromise = null;
    }
  })();

  return whisperLoadingPromise;
}

/**
 * Transcrit un flux audio (Float32Array 16kHz) directement en local via WebAssembly
 */
export async function transcribeOfflineAudio(
  audioSamples: Float32Array,
  language = 'french'
): Promise<string> {
  if (!whisperPipeline) {
    const success = await initWhisperModel();
    if (!success || !whisperPipeline) {
      console.warn('[Whisper.wasm] Whisper non disponible, bascule vers reconnaissance vocale alternative.');
      return '';
    }
  }

  try {
    console.log('[Whisper.wasm] Lancement transcription vocale locale (WASM)...');
    
    const result = await whisperPipeline(audioSamples, {
      chunk_length_s: 30,
      stride_length_s: 5,
      language,
      task: 'transcribe',
      return_timestamps: false,
    });

    const rawText = typeof result === 'string' ? result : (result?.text || '');
    console.log('[Whisper.wasm] Résultat transcription locale :', rawText);
    return rawText.trim();
  } catch (err: any) {
    console.warn('[Whisper.wasm] Erreur transcription locale :', err?.message || err);
    return '';
  }
}
