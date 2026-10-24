import {
  processAudioForWhisper,
  initFFmpeg,
  isFFmpegReady,
  AudioProcessingResult,
  encodeWavBlob,
  decodeWavToFloat32Sync,
} from './audioProcessor';
import { initWhisperModel, transcribeOfflineAudio, isWhisperReady, getWhisperStatus } from './whisperEngine';
import { InventoryProduct, VoiceItemMatch, VoiceParseResult } from '../types';
import { parseVoicePhrase } from '../utils/voiceParser';

export interface VoiceRecognitionResult {
  rawText: string;
  modeUsed: 'ONLINE_GEMINI' | 'OFFLINE_WHISPER_WASM';
  engineAudio: 'FFMPEG_WASM' | 'WEB_AUDIO_FALLBACK' | 'SERVER_STREAM';
  parseResult: VoiceParseResult;
  recognizedItems: VoiceItemMatch[];
  processingTimeMs: number;
}

let activeStream: MediaStream | null = null;
let activeAudioCtx: AudioContext | null = null;
let activeSourceNode: MediaStreamAudioSourceNode | null = null;
let activeProcessorNode: ScriptProcessorNode | null = null;
let recordedFloatChunks: Float32Array[] = [];
let lastRecordedFloat32: Float32Array | null = null;
let mediaRecorder: MediaRecorder | null = null;
let mediaRecorderChunks: Blob[] = [];
let recordingStartTime = 0;
let activeSpeechRec: any = null;
let lastWebSpeechTranscript = '';

/**
 * Rééchantillonne un tableau de float32 à 16kHz mono (interpolation linéaire)
 */
function resampleTo16k(input: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === 16000 || input.length === 0) return input;
  const ratio = inputSampleRate / 16000;
  const newLength = Math.max(1, Math.round(input.length / ratio));
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const origIndex = i * ratio;
    const index1 = Math.floor(origIndex);
    const index2 = Math.min(index1 + 1, input.length - 1);
    const fraction = origIndex - index1;
    result[i] = input[index1] * (1 - fraction) + input[index2] * fraction;
  }
  return result;
}

/**
 * Préchargement discret en arrière-plan des moteurs WebAssembly (FFmpeg.wasm & Whisper Tiny)
 * dès le lancement de la PWA pour garantir le 100% hors-ligne.
 */
export async function preloadOfflineVoice(
  onProgress?: (step: string, percent?: number) => void
): Promise<void> {
  try {
    if (onProgress) onProgress('Initialisation FFmpeg.wasm...', 10);
    initFFmpeg().catch((e) => console.warn('[Preload] FFmpeg.wasm warning:', e));

    if (onProgress) onProgress('Mise en cache du modèle Whisper WASM...', 30);
    initWhisperModel((event) => {
      if (onProgress && typeof event.progress === 'number') {
        onProgress(`Modèle Whisper: ${Math.round(event.progress)}%`, event.progress);
      }
    }).catch((e) => console.warn('[Preload] Whisper warning:', e));
  } catch (err) {
    console.warn('[Preload] Erreur préchargement audio hors-ligne :', err);
  }
}

/**
 * Démarre la capture microphone avec capture double :
 * 1. Flux direct AudioContext Float32Array (garantit un WAV 16kHz parfait, sans corruption de conteneur)
 * 2. MediaRecorder standard comme flux auxiliaire
 */
export async function startAudioRecording(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    activeStream = stream;
    recordedFloatChunks = [];
    mediaRecorderChunks = [];
    recordingStartTime = Date.now();

    // 1. Initialiser la capture brute via AudioContext
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      try {
        activeAudioCtx = new AudioCtx();
        if (activeAudioCtx.state === 'suspended') {
          await activeAudioCtx.resume().catch(() => {});
        }
        activeSourceNode = activeAudioCtx.createMediaStreamSource(stream);
        activeProcessorNode = activeAudioCtx.createScriptProcessor(4096, 1, 1);
        activeProcessorNode.onaudioprocess = (e) => {
          const channelData = e.inputBuffer.getChannelData(0);
          recordedFloatChunks.push(new Float32Array(channelData));
        };
        activeSourceNode.connect(activeProcessorNode);
        activeProcessorNode.connect(activeAudioCtx.destination);
      } catch (audioCtxErr) {
        console.warn('[AudioContext] Initialisation ScriptProcessor :', audioCtxErr);
      }
    }

    // 2. Initialiser MediaRecorder
    try {
      let mimeType = 'audio/webm;codecs=opus';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
          else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
          else mimeType = '';
        }
        mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            mediaRecorderChunks.push(event.data);
          }
        };
        mediaRecorder.start(100);
      }
    } catch (mrErr) {
      console.warn('[MediaRecorder] Initialisation :', mrErr);
    }

    // 3. Initialiser Web Speech API natif en parallèle pour transcription instantanée
    try {
      lastWebSpeechTranscript = '';
      const SpeechRec =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        activeSpeechRec = new SpeechRec();
        activeSpeechRec.lang = 'fr-FR';
        activeSpeechRec.continuous = true;
        activeSpeechRec.interimResults = true;
        activeSpeechRec.onresult = (event: any) => {
          let str = '';
          for (let i = 0; i < event.results.length; i++) {
            str += event.results[i][0].transcript + ' ';
          }
          if (str.trim()) {
            lastWebSpeechTranscript = str.trim();
          }
        };
        activeSpeechRec.onerror = () => {};
        activeSpeechRec.start();
      }
    } catch (speechErr) {
      // Tolérer le refus ou non-support Web Speech en mode iframe/bac à sable
    }

    return true;
  } catch (err) {
    console.error('Erreur accès microphone :', err);
    throw err;
  }
}

/**
 * Arrête la capture microphone et renvoie un Blob WAV 16kHz Mono garanti propre
 */
export async function stopAudioRecording(): Promise<Blob | null> {
  try {
    // Arrêter SpeechRecognition si actif
    if (activeSpeechRec) {
      try {
        activeSpeechRec.stop();
      } catch {}
      activeSpeechRec = null;
    }

    // 1. Nettoyer AudioContext et ScriptProcessor
    if (activeProcessorNode) {
      try {
        activeProcessorNode.disconnect();
      } catch {}
      activeProcessorNode = null;
    }
    if (activeSourceNode) {
      try {
        activeSourceNode.disconnect();
      } catch {}
      activeSourceNode = null;
    }

    const inputSampleRate = activeAudioCtx?.sampleRate || 16000;
    if (activeAudioCtx && activeAudioCtx.state !== 'closed') {
      await activeAudioCtx.close().catch(() => {});
    }
    activeAudioCtx = null;

    // 2. Arrêter MediaRecorder si actif
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.stop();
      } catch {}
      mediaRecorder = null;
    }

    // 3. Fermer les pistes du micro
    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop());
      activeStream = null;
    }

    // 4. Concaténer les échantillons Float32 capturés directement
    let totalLength = 0;
    for (const chunk of recordedFloatChunks) {
      totalLength += chunk.length;
    }

    if (totalLength > 0) {
      const mergedSamples = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of recordedFloatChunks) {
        mergedSamples.set(chunk, offset);
        offset += chunk.length;
      }
      recordedFloatChunks = [];

      // Rééchantillonner en 16kHz
      const samples16k = resampleTo16k(mergedSamples, inputSampleRate);
      lastRecordedFloat32 = samples16k;

      // Encoder en fichier WAV standard 16kHz Mono PCM
      const wavBlob = encodeWavBlob(samples16k, 16000);
      return wavBlob;
    }

    // Si les chunks directs étaient vides mais que MediaRecorder a des données
    if (mediaRecorderChunks.length > 0) {
      const fallbackBlob = new Blob(mediaRecorderChunks, { type: 'audio/webm' });
      mediaRecorderChunks = [];
      return fallbackBlob;
    }

    return null;
  } catch (err) {
    console.warn('Erreur arrêt enregistrement vocal :', err);
    return null;
  }
}

/**
 * Convertit un Blob en chaîne Base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const base64 = base64data.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Envoie l'enregistrement vocal au serveur pour transcription rapide par Gemini en ligne
 */
async function transcribeWithOnlineGemini(
  audioBlob: Blob
): Promise<{ text: string; success: boolean }> {
  try {
    const base64Audio = await blobToBase64(audioBlob);
    const mimeType = audioBlob.type || 'audio/wav';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 secondes max pour rapidité caisse

    const res = await fetch('/api/ai/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64: base64Audio,
        mimeType,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const contentType = res.headers.get("content-type") || "";
    if (!res.ok || !contentType.includes("application/json")) {
      return { text: '', success: false };
    }

    const data = await res.json();
    if (data && typeof data.text === 'string' && data.text.trim()) {
      return { text: data.text.trim(), success: true };
    }
    return { text: '', success: false };
  } catch (err) {
    return { text: '', success: false };
  }
}

/**
 * Processus unifié : Reçoit le Blob audio du micro, décide intelligemment
 * (En ligne -> Gemini, Hors-ligne -> Web Speech API / Whisper WASM),
 * extrait les articles et renvoie le ticket structuré.
 */
export async function processVoiceCommand(
  rawAudioBlob: Blob,
  inventory: InventoryProduct[],
  onStatusUpdate?: (status: string, mode: 'ONLINE' | 'OFFLINE') => void
): Promise<VoiceRecognitionResult> {
  const startTime = Date.now();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;

  let rawText = '';
  let modeUsed: 'ONLINE_GEMINI' | 'OFFLINE_WHISPER_WASM' = 'ONLINE_GEMINI';
  let engineAudio: 'FFMPEG_WASM' | 'WEB_AUDIO_FALLBACK' | 'SERVER_STREAM' = 'SERVER_STREAM';

  // 1. Tenter en priorité Gemini en ligne si la connexion est active
  if (isOnline) {
    try {
      if (onStatusUpdate) onStatusUpdate('Transcription rapide en ligne (Gemini)...', 'ONLINE');
      const onlineResult = await transcribeWithOnlineGemini(rawAudioBlob);
      if (onlineResult.text && onlineResult.text.trim()) {
        rawText = onlineResult.text.trim();
        modeUsed = 'ONLINE_GEMINI';
        engineAudio = 'SERVER_STREAM';
      }
    } catch (err) {
      console.log('[Voix] Bascule automatique vers le moteur local (Hors-ligne / Échec en ligne) :', err);
    }
  }

  // 2. Si Gemini n'a rien renvoyé ou hors-ligne, vérifier la reconnaissance native Web Speech API
  if (!rawText && lastWebSpeechTranscript) {
    rawText = lastWebSpeechTranscript;
    modeUsed = 'OFFLINE_WHISPER_WASM';
    engineAudio = 'WEB_AUDIO_FALLBACK';
  }

  // 3. Si toujours aucun texte : Exécution locale Whisper WASM
  if (!rawText) {
    modeUsed = 'OFFLINE_WHISPER_WASM';
    if (onStatusUpdate) onStatusUpdate('🎙️ Traitement audio local (Hors-ligne)...', 'OFFLINE');

    try {
      // Obtenir les échantillons Float32Array 16kHz
      let float32Samples = lastRecordedFloat32;
      if (!float32Samples || float32Samples.length === 0) {
        const processedAudio: AudioProcessingResult = await processAudioForWhisper(
          rawAudioBlob,
          (step) => {
            if (onStatusUpdate) onStatusUpdate(step, 'OFFLINE');
          }
        );
        float32Samples = processedAudio.float32Array;
        engineAudio = processedAudio.engineUsed;
      } else {
        engineAudio = 'WEB_AUDIO_FALLBACK';
      }

      // Reconnaissance vocale locale avec le modèle Whisper WASM si des échantillons sont présents
      if (float32Samples && float32Samples.length > 0) {
        if (onStatusUpdate) onStatusUpdate('Transcription locale en cours...', 'OFFLINE');
        rawText = await transcribeOfflineAudio(float32Samples, 'french');
      }
    } catch (offlineErr) {
      console.warn('[Voix] Moteur local Whisper/WASM non disponible :', offlineErr);
    }
  }

  // 3. Traitement local de la commande de caisse (Parsing NLP / Regex)
  console.log(`[Commande Voix] Texte transcrit (${modeUsed}) : "${rawText}"`);
  const parseResult = parseVoicePhrase(rawText, inventory);

  const processingTimeMs = Date.now() - startTime;

  return {
    rawText,
    modeUsed,
    engineAudio,
    parseResult,
    recognizedItems: parseResult.recognizedItems,
    processingTimeMs,
  };
}
