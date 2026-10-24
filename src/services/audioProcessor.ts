import type { FFmpeg } from '@ffmpeg/ffmpeg';

export interface AudioProcessingResult {
  wavBlob: Blob;
  float32Array: Float32Array;
  durationSeconds: number;
  engineUsed: 'FFMPEG_WASM' | 'WEB_AUDIO_FALLBACK';
}

let ffmpegModule: any = null;
let ffmpegUtilModule: any = null;

async function getFFmpegModules() {
  if (!ffmpegModule || !ffmpegUtilModule) {
    const [ffmpegMod, utilMod] = await Promise.all([
      import('@ffmpeg/ffmpeg'),
      import('@ffmpeg/util'),
    ]);
    ffmpegModule = ffmpegMod;
    ffmpegUtilModule = utilMod;
  }
  return {
    FFmpeg: ffmpegModule.FFmpeg,
    toBlobURL: ffmpegUtilModule.toBlobURL,
    fetchFile: ffmpegUtilModule.fetchFile,
  };
}

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadingPromise: Promise<boolean> | null = null;
let ffmpegReady = false;

/**
 * Charge et prépare FFmpeg.wasm pour l'exécution locale 100 % hors-ligne
 */
export async function initFFmpeg(
  onProgress?: (ratio: number) => void
): Promise<boolean> {
  if (ffmpegReady && ffmpegInstance) return true;
  if (ffmpegLoadingPromise) return ffmpegLoadingPromise;

  ffmpegLoadingPromise = (async () => {
    try {
      const { FFmpeg, toBlobURL } = await getFFmpegModules();
      if (!ffmpegInstance) {
        ffmpegInstance = new FFmpeg();
      }

      if (onProgress && ffmpegInstance && typeof (ffmpegInstance as any).on === 'function') {
        ffmpegInstance.on('progress', ({ progress }) => {
          onProgress(Math.min(1, Math.max(0, progress)));
        });
      }


      // Utiliser les URL ESM officielles mises en cache par le Service Worker
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
      const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');

      await ffmpegInstance.load({
        coreURL,
        wasmURL,
      });

      ffmpegReady = true;
      console.log('[FFmpeg.wasm] Moteur audio WebAssembly initialisé avec succès.');
      return true;
    } catch (err) {
      console.warn('[FFmpeg.wasm] Initialisation non disponible, utilisation du Web Audio API :', err);
      ffmpegReady = false;
      return false;
    } finally {
      ffmpegLoadingPromise = null;
    }
  })();

  return ffmpegLoadingPromise;
}

export function isFFmpegReady(): boolean {
  return ffmpegReady && ffmpegInstance !== null;
}

/**
 * Décode de façon synchrone et sans AudioContext un ArrayBuffer WAV PCM 16-bit
 * Cela évite tout bug "Unable to decode audio data" sur Safari et Chromium.
 */
export function decodeWavToFloat32Sync(arrayBuffer: ArrayBuffer): Float32Array {
  try {
    const view = new DataView(arrayBuffer);
    if (view.byteLength < 44) return new Float32Array(0);

    // Chercher le chunk "data"
    let offset = 12;
    while (offset < view.byteLength - 8) {
      const c1 = String.fromCharCode(view.getUint8(offset));
      const c2 = String.fromCharCode(view.getUint8(offset + 1));
      const c3 = String.fromCharCode(view.getUint8(offset + 2));
      const c4 = String.fromCharCode(view.getUint8(offset + 3));
      const chunkId = c1 + c2 + c3 + c4;
      const chunkSize = view.getUint32(offset + 4, true);

      if (chunkId === 'data') {
        const dataOffset = offset + 8;
        const availableBytes = Math.min(chunkSize, view.byteLength - dataOffset);
        const sampleCount = Math.floor(availableBytes / 2);
        const float32 = new Float32Array(sampleCount);
        for (let i = 0; i < sampleCount; i++) {
          const int16 = view.getInt16(dataOffset + i * 2, true);
          float32[i] = int16 < 0 ? int16 / 32768 : int16 / 32767;
        }
        return float32;
      }
      offset += 8 + chunkSize;
    }

    // Si le chunk "data" n'est pas trouvé explicitement, supposer l'en-tête standard de 44 octets
    const sampleCount = Math.max(0, Math.floor((view.byteLength - 44) / 2));
    const float32 = new Float32Array(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
      const int16 = view.getInt16(44 + i * 2, true);
      float32[i] = int16 < 0 ? int16 / 32768 : int16 / 32767;
    }
    return float32;
  } catch (err) {
    console.warn('[WAV Decoder] Erreur décodage synchrone WAV :', err);
    return new Float32Array(0);
  }
}

/**
 * Convertit un Blob audio (ex: WAV / WebM / OGG) en WAV 16kHz Mono PCM
 * avec détection native WAV, repli Web Audio et FFmpeg.wasm.
 */
export async function processAudioForWhisper(
  rawBlob: Blob,
  onStatusUpdate?: (status: string) => void
): Promise<AudioProcessingResult> {
  const arrayBuffer = await rawBlob.arrayBuffer();

  // 1. Si le Blob est déjà au format WAV (détectable par le préfixe RIFF), décodage synchrone immédiat
  if (arrayBuffer.byteLength >= 44) {
    const view = new DataView(arrayBuffer);
    const isRiff =
      view.getUint8(0) === 0x52 && // 'R'
      view.getUint8(1) === 0x49 && // 'I'
      view.getUint8(2) === 0x46 && // 'F'
      view.getUint8(3) === 0x46;   // 'F'

    if (isRiff) {
      if (onStatusUpdate) onStatusUpdate('Traitement WAV direct...');
      const float32Array = decodeWavToFloat32Sync(arrayBuffer);
      return {
        wavBlob: rawBlob.type === 'audio/wav' ? rawBlob : new Blob([arrayBuffer], { type: 'audio/wav' }),
        float32Array,
        durationSeconds: float32Array.length / 16000,
        engineUsed: 'WEB_AUDIO_FALLBACK',
      };
    }
  }

  // 2. Tenter la conversion via FFmpeg.wasm si disponible
  if (isFFmpegReady() && ffmpegInstance) {
    try {
      if (onStatusUpdate) onStatusUpdate('Conversion audio via FFmpeg.wasm (16kHz Mono)...');
      
      const { fetchFile } = await getFFmpegModules();
      const inputData = await fetchFile(rawBlob);
      const inputName = 'input_mic.webm';
      const outputName = 'clean_16k.wav';

      await ffmpegInstance.writeFile(inputName, inputData);

      // Convertir en 16 000 Hz, 1 canal (Mono), PCM 16-bit
      await ffmpegInstance.exec([
        '-i', inputName,
        '-vn',
        '-ar', '16000',
        '-ac', '1',
        '-c:a', 'pcm_s16le',
        outputName,
      ]);

      const outputData = await ffmpegInstance.readFile(outputName);
      // Nettoyer les fichiers virtuels
      try {
        await ffmpegInstance.deleteFile(inputName);
        await ffmpegInstance.deleteFile(outputName);
      } catch {
        // Ignorer l'erreur de suppression
      }

      const wavBuffer = outputData instanceof Uint8Array ? outputData.buffer : new Uint8Array(outputData as any).buffer;
      const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });

      // Décoder les échantillons Float32Array nécessaires pour Whisper
      const float32Array = decodeWavToFloat32Sync(wavBuffer);

      return {
        wavBlob,
        float32Array,
        durationSeconds: float32Array.length / 16000,
        engineUsed: 'FFMPEG_WASM',
      };
    } catch (err) {
      console.warn('[FFmpeg.wasm] Erreur lors de la conversion, bascule sur Web Audio API :', err);
    }
  }

  // 3. Repli rapide et garanti : Web Audio API natif (Resampler 16kHz)
  if (onStatusUpdate) onStatusUpdate('Traitement audio natif 16kHz (Web Audio)...');
  return await convertAudioUsingWebAudio(rawBlob);
}

/**
 * Convertit n'importe quel enregistrement audio en Float32Array 16kHz et Blob WAV
 * directement dans le navigateur via l'AudioContext natif avec protection contre "Unable to decode audio data".
 */
async function convertAudioUsingWebAudio(blob: Blob): Promise<AudioProcessingResult> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) {
    const empty = new Float32Array(0);
    return {
      wavBlob: encodeWavBlob(empty, 16000),
      float32Array: empty,
      durationSeconds: 0,
      engineUsed: 'WEB_AUDIO_FALLBACK',
    };
  }

  let audioCtx: AudioContext | null = null;
  try {
    audioCtx = new AudioCtx();
    let audioBuffer: AudioBuffer;

    try {
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } catch (decodeErr) {
      console.warn('[Web Audio] Impossible de décoder le flux WebM/OGG brut :', decodeErr);
      // Éviter le crash brutal : renvoyer un tableau vide pour que l'app continue normalement
      const empty = new Float32Array(0);
      return {
        wavBlob: encodeWavBlob(empty, 16000),
        float32Array: empty,
        durationSeconds: 0,
        engineUsed: 'WEB_AUDIO_FALLBACK',
      };
    }
    
    // Rééchantillonner en 16kHz Mono
    const targetLength = Math.max(1, Math.ceil(audioBuffer.duration * 16000));
    const offlineCtx = new OfflineAudioContext(1, targetLength, 16000);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    const float32Array = renderedBuffer.getChannelData(0);

    // Créer un Blob WAV standard 16-bit PCM 16kHz
    const wavBlob = encodeWavBlob(float32Array, 16000);

    return {
      wavBlob,
      float32Array,
      durationSeconds: renderedBuffer.duration,
      engineUsed: 'WEB_AUDIO_FALLBACK',
    };
  } catch (err) {
    console.warn('[Web Audio] Erreur traitement audio global :', err);
    const empty = new Float32Array(0);
    return {
      wavBlob: encodeWavBlob(empty, 16000),
      float32Array: empty,
      durationSeconds: 0,
      engineUsed: 'WEB_AUDIO_FALLBACK',
    };
  } finally {
    if (audioCtx && audioCtx.state !== 'closed') {
      await audioCtx.close().catch(() => {});
    }
  }
}

/**
 * Extrait les échantillons Float32Array d'un Blob WAV 16kHz
 */
async function decodeWavToFloat32(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();
  return decodeWavToFloat32Sync(arrayBuffer);
}

/**
 * Encode un Float32Array 1 canal 16kHz vers un fichier WAV 16-bit PCM standard
 */
export function encodeWavBlob(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = mono)
  view.setUint32(24, sampleRate, true); // SampleRate (16000)
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Write PCM 16-bit samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
