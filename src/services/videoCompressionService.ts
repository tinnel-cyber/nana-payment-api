/**
 * @file videoCompressionService.ts
 * @description Moteur d'encodage vidéo client turbo (Poids cible : 8 à 12 Mo pour une source de 70-80 Mo, < 20s)
 *
 * Réglages d'encodage appliqués :
 * 1. Seuil intelligent (Bypass direct) :
 *    - Si `file.size <= 12 * 1024 * 1024` (12 Mo), passage direct au transfert S3 sans ré-encodage inutile.
 * 2. Moteur 1 — WebCodecs matériel GPU (Worker ou Direct) :
 *    - Résolution plafonnée à 480p vertical (`scale=480:-2` -> 480x854)
 *    - Framerate : 22 fps (`-r 22`)
 *    - Zéro B-frames (`-bf 0`, via `codec: 'avc1.42001e'` Baseline Profile Level 3.0 + `latencyMode: 'realtime'`)
 *    - Équivalent CRF 32 en 480p @ 22fps : ~650 kbps (plafonné dynamiquement pour viser 10 à 12 Mo)
 *    - Copie directe de l'audio (`copy: { mode: 'preferred' }`)
 * 3. Moteur 2 — Commande FFmpeg finale rapide :
 *    - `-preset ultrafast -tune zerolatency -r 22 -bf 0 -vf scale=480:-2 -c:v libx264 -crf 32 -c:a copy -movflags +faststart`
 *
 * Terminologie UI :
 * - Barre 1 : "Encodage vidéo optimisé... (X%)"
 * - Barre 2 : "Transfert sécurisé vers le serveur... (X%)"
 * - Aucun mot "compression" sur l'écran utilisateur.
 */

import type { FFmpeg } from '@ffmpeg/ffmpeg';
import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  Conversion,
  Input,
  Mp4OutputFormat,
  Output,
  Quality,
  VideoSample,
  VideoSampleSource,
  canEncodeVideo,
  registerVideoSampleTransformer
} from 'mediabunny';
import type { ConversionAudioOptions, ConversionVideoOptions } from 'mediabunny';
import type { WorkerEncodeSettings, WorkerResponse } from '../workers/videoEncoder.worker';

export interface VideoOverlayConfig {
  filterCss?: string;
  text?: string;
  textPosition?: 'top' | 'center' | 'bottom';
  textColor?: string;
}

export interface VideoEncodeExtraOptions {
  overlay?: VideoOverlayConfig;
  targetWidth?: number;
  targetHeight?: number;
  videoBitsPerSecond?: number;
  fps?: number;
  maxDurationSec?: number;
}

export interface VideoCompressionResult {
  compressedFile: File;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  savingsRatioPercent: number;
  engineUsed:
    | 'webcodecs-hardware'
    | 'ffmpeg-wasm-ultrafast'
    | 'canvas-mediarecorder-30fps'
    | 'passthrough';
  durationSec: number;
  elapsedMs: number;
}

/**
 * Formate une taille en octets vers une chaîne lisible (Ko / Mo)
 */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 Mo';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(2)} Mo`;
  return `${(bytes / 1024).toFixed(0)} Ko`;
}

const toEven = (n: number) => Math.max(2, Math.round(n / 2) * 2);

const resolvedMainAvcMap = new Map<string, string>();
let mainWebCodecsPatched = false;

function ensureMainFastWebCodecsPatch() {
  if (mainWebCodecsPatched) return;
  mainWebCodecsPatched = true;

  if (typeof VideoEncoder !== 'undefined') {
    const origIsSupported = VideoEncoder.isConfigSupported.bind(VideoEncoder);
    const origConfigure = VideoEncoder.prototype.configure;

    VideoEncoder.isConfigSupported = async (config: VideoEncoderConfig) => {
      if (config && typeof config.codec === 'string' && config.codec.startsWith('avc1.')) {
        const levelHex = config.codec.slice(7) || '1e';
        const candidates = [
          'avc1.42001e',
          'avc1.42E01e',
          `avc1.4200${levelHex}`,
          `avc1.42E0${levelHex}`,
          'avc1.42001f',
          'avc1.42E01f',
          config.codec
        ];
        for (const codecStr of candidates) {
          try {
            const testCfg: VideoEncoderConfig = {
              ...config,
              codec: codecStr,
              framerate: config.framerate || 22,
              latencyMode: 'realtime'
            };
            const res = await origIsSupported(testCfg);
            if (res && res.supported) {
              resolvedMainAvcMap.set(config.codec, codecStr);
              return res;
            }
          } catch {}
        }
      }
      return origIsSupported({
        ...config,
        framerate: config.framerate || 22,
        latencyMode: 'realtime'
      });
    };

    VideoEncoder.prototype.configure = function (config: VideoEncoderConfig) {
      const fastCfg: VideoEncoderConfig = {
        ...config,
        framerate: config.framerate || 22,
        latencyMode: 'realtime'
      };
      if (typeof fastCfg.codec === 'string' && fastCfg.codec.startsWith('avc1.')) {
        fastCfg.codec =
          resolvedMainAvcMap.get(fastCfg.codec) ||
          'avc1.42001e';
      }
      try {
        return origConfigure.call(this, fastCfg);
      } catch {
        try {
          return origConfigure.call(this, {
            ...fastCfg,
            codec: fastCfg.codec.replace(/^avc1\.6400/i, 'avc1.4200')
          });
        } catch {
          return origConfigure.call(this, config);
        }
      }
    };
  }

  if (typeof VideoDecoder !== 'undefined') {
    const origDecConfigure = VideoDecoder.prototype.configure;
    VideoDecoder.prototype.configure = function (config: VideoDecoderConfig) {
      try {
        return origDecConfigure.call(this, { ...config, optimizeForLatency: true });
      } catch {
        return origDecConfigure.call(this, config);
      }
    };
  }

  // Décimation directe à 22 fps (`-r 22`) AVANT transformation Canvas et encodage
  const origSourceAdd = VideoSampleSource.prototype.add;
  const lastKeptTimestampMap = new WeakMap<VideoSampleSource, number>();
  const minFrameDeltaSec = 1 / 22 - 0.004;

  VideoSampleSource.prototype.add = function (videoSample: VideoSample, encodeOptions?: any) {
    const prevTs = lastKeptTimestampMap.get(this);
    if (
      prevTs !== undefined &&
      videoSample.timestamp > prevTs &&
      videoSample.timestamp - prevTs < minFrameDeltaSec
    ) {
      return Promise.resolve();
    }
    lastKeptTimestampMap.set(this, videoSample.timestamp);
    return origSourceAdd.call(this, videoSample, encodeOptions);
  };

  if (typeof OffscreenCanvas !== 'undefined') {
    let sharedCanvas: OffscreenCanvas | null = null;
    let sharedCtx: OffscreenCanvasRenderingContext2D | null = null;

    registerVideoSampleTransformer((sample, desc) => {
      if (!sharedCanvas || sharedCanvas.width !== desc.width || sharedCanvas.height !== desc.height) {
        sharedCanvas = new OffscreenCanvas(desc.width, desc.height);
        sharedCtx = sharedCanvas.getContext('2d', { alpha: false, willReadFrequently: false });
      }
      if (!sharedCtx) return null;

      sharedCtx.imageSmoothingEnabled = false;
      sharedCtx.fillStyle = '#000000';
      sharedCtx.fillRect(0, 0, desc.width, desc.height);
      sample.drawWithFit(sharedCtx, {
        fit: desc.fit,
        rotation: desc.rotation,
        flip: desc.flip,
        crop: desc.crop
      });

      return new VideoSample(sharedCanvas, {
        timestamp: sample.timestamp,
        duration: sample.duration,
        rotation: 0,
        flip: false
      });
    });
  }
}

/**
 * Plafonnement de la résolution à 480p vertical (`scale=480:-2`).
 */
function computeScale480Dimensions(
  srcW: number,
  srcH: number,
  maxShortSide = 480,
  maxLongSide = 854
): { width: number; height: number; needsResize: boolean } {
  const isPortrait = srcH >= srcW;
  const longSide = isPortrait ? srcH : srcW;
  const shortSide = isPortrait ? srcW : srcH;

  if (
    shortSide <= maxShortSide &&
    longSide <= maxLongSide &&
    srcW % 2 === 0 &&
    srcH % 2 === 0
  ) {
    return { width: srcW, height: srcH, needsResize: false };
  }

  const scale = Math.min(1, maxShortSide / Math.max(1, shortSide), maxLongSide / Math.max(1, longSide));
  return {
    width: toEven(srcW * scale),
    height: toEven(srcH * scale),
    needsResize: true
  };
}

/**
 * Moteur 1A : Encodage WebCodecs matériel via Web Worker dédié (480x854, 22 fps, équivalent CRF 32)
 */
async function encodeWithWebCodecsWorker(
  file: File,
  onProgress: (pct: number) => void,
  extra: VideoEncodeExtraOptions = {}
): Promise<{ blob: Blob; durationSec: number } | null> {
  if (
    typeof window === 'undefined' ||
    typeof Worker === 'undefined' ||
    typeof VideoEncoder === 'undefined' ||
    typeof VideoDecoder === 'undefined'
  ) {
    return null;
  }

  const targetWidth = toEven(extra.targetWidth || 480);
  const targetHeight = toEven(extra.targetHeight || 854);
  const targetBitrate = extra.videoBitsPerSecond || 650_000;
  const maxFrameRate = extra.fps || 22;

  return new Promise((resolve) => {
    let settled = false;
    let worker: Worker | null = null;

    const finish = (res: { blob: Blob; durationSec: number } | null) => {
      if (settled) return;
      settled = true;
      try {
        worker?.terminate();
      } catch {}
      resolve(res);
    };

    try {
      worker = new Worker(new URL('../workers/videoEncoder.worker.ts', import.meta.url), {
        type: 'module'
      });
    } catch {
      finish(null);
      return;
    }

    const settings: WorkerEncodeSettings = {
      maxShortSide: targetWidth,
      maxLongSide: targetHeight,
      targetBitrate,
      maxDurationSec: extra.maxDurationSec || 0,
      maxFrameRate,
      passThroughBelowBytes: 12 * 1024 * 1024
    };

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      if (!msg) return;

      if (msg.type === 'progress') {
        onProgress(msg.pct);
        return;
      }

      if (msg.type === 'done') {
        const blob = new Blob([msg.buffer], { type: 'video/mp4' });
        if (blob.size > 0) {
          finish({ blob, durationSec: msg.durationSec });
        } else {
          finish(null);
        }
        return;
      }

      if (msg.type === 'error') {
        finish(null);
      }
    };

    worker.onerror = () => {
      finish(null);
    };

    worker.postMessage({
      type: 'encode',
      file,
      settings,
      overlay: extra.overlay
    });
  });
}

/**
 * Moteur 1B : Encodage WebCodecs matériel direct (480x854, 22 fps, équivalent CRF 32)
 */
async function encodeWithWebCodecsDirect(
  file: File,
  onProgress: (pct: number) => void,
  extra: VideoEncodeExtraOptions = {}
): Promise<{ blob: Blob; durationSec: number } | null> {
  if (typeof VideoEncoder === 'undefined' || typeof VideoDecoder === 'undefined') {
    return null;
  }

  ensureMainFastWebCodecsPatch();

  const maxShortSide = toEven(extra.targetWidth || 480);
  const maxLongSide = toEven(extra.targetHeight || 854);
  const requestedBitrate = extra.videoBitsPerSecond || 650_000;

  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });

  try {
    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack || !(await videoTrack.canDecode())) {
      return null;
    }

    const metaDuration = await input.getDurationFromMetadata();
    const sourceDuration =
      metaDuration && Number.isFinite(metaDuration) && metaDuration >= 0.5
        ? metaDuration
        : Math.max((await input.computeDuration()) || 0, metaDuration || 0, 0.1);

    const allTracks = await input.getTracks();
    for (const t of allTracks) {
      t.getDurationFromMetadata = async () => sourceDuration;
    }

    const trimEnd =
      extra.maxDurationSec && extra.maxDurationSec > 0 && sourceDuration > extra.maxDurationSec
        ? extra.maxDurationSec
        : undefined;
    const effectiveDuration = trimEnd !== undefined ? trimEnd : sourceDuration;

    const rotation = await videoTrack.getRotation();
    const rawW = (await videoTrack.getSquarePixelWidth()) || videoTrack.displayWidth || 480;
    const rawH = (await videoTrack.getSquarePixelHeight()) || videoTrack.displayHeight || 854;
    const srcW = rotation % 180 === 0 ? rawW : rawH;
    const srcH = rotation % 180 === 0 ? rawH : rawW;

    const { width: outWidth, height: outHeight, needsResize } = computeScale480Dimensions(
      srcW,
      srcH,
      Math.min(maxShortSide, 480),
      Math.min(maxLongSide, 854)
    );

    const maxBitrateFor11MB =
      effectiveDuration > 10
        ? Math.max(350_000, Math.floor((9.5 * 1024 * 1024 * 8) / effectiveDuration))
        : requestedBitrate;
    const bitrate = Math.min(requestedBitrate, maxBitrateFor11MB);

    const encoderConfig: VideoEncoderConfig = {
      codec: 'avc1.42001e', // Baseline Profile Level 3.0 (0 B-frames = -bf 0)
      width: outWidth,
      height: outHeight,
      bitrate,
      framerate: 22,
      hardwareAcceleration: 'prefer-hardware',
      latencyMode: 'realtime'
    };

    const hwSupport = await VideoEncoder.isConfigSupported(encoderConfig).catch(() => ({ supported: false }));
    const avcOk =
      Boolean(hwSupport?.supported) ||
      (await canEncodeVideo('avc', {
        width: outWidth,
        height: outHeight,
        bitrate
      }).catch(() => false));

    const aacAudioOption: ConversionAudioOptions = {
      codec: 'aac',
      forceTranscode: true,
      numberOfChannels: 2,
      sampleRate: 44100
    };

    const attempts: Array<{
      hardwareAcceleration: 'prefer-hardware' | 'no-preference';
      audioOptions: ConversionAudioOptions;
    }> = hwSupport?.supported
      ? [
          { hardwareAcceleration: 'prefer-hardware', audioOptions: aacAudioOption },
          { hardwareAcceleration: 'no-preference', audioOptions: aacAudioOption },
          { hardwareAcceleration: 'prefer-hardware', audioOptions: {} },
          { hardwareAcceleration: 'no-preference', audioOptions: { discard: true } }
        ]
      : [
          { hardwareAcceleration: 'no-preference', audioOptions: aacAudioOption },
          { hardwareAcceleration: 'no-preference', audioOptions: {} },
          { hardwareAcceleration: 'no-preference', audioOptions: { discard: true } }
        ];

    let highestPct = 2;

    for (const attempt of attempts) {
      const videoOptions: ConversionVideoOptions = {
        ...(needsResize
          ? {
              width: outWidth,
              height: outHeight,
              fit: 'fill' as const
            }
          : {}),
        forceTranscode: true,
        hardwareAcceleration: attempt.hardwareAcceleration,
        quality: new Quality({ bitrate, bitrateMode: 'variable' }),
        keyFrameInterval: 5,
        ...(avcOk ? { codec: 'avc' as const } : {})
      };

      const output = new Output({
        format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
        target: new BufferTarget()
      });

      const conversion = await Conversion.init({
        input,
        output,
        video: videoOptions,
        audio: attempt.audioOptions,
        copy: { mode: 'preferred', shiftTolerance: Infinity },
        trim: trimEnd !== undefined ? { start: 0, end: trimEnd } : undefined,
        showWarnings: false
      });

      if (!conversion.isValid) {
        continue;
      }

      conversion.onProgress = (p: number, processedTime?: number) => {
        const ratio =
          typeof processedTime === 'number' && effectiveDuration > 0
            ? processedTime / effectiveDuration
            : p;
        const pct = Math.min(99, Math.max(2, Math.round(ratio * 100)));
        if (pct > highestPct) {
          highestPct = pct;
          onProgress(pct);
        }
      };

      try {
        await conversion.execute();
      } catch {
        continue;
      }

      const buffer = (output.target as BufferTarget).buffer;
      if (buffer && buffer.byteLength > 0) {
        return {
          blob: new Blob([buffer], { type: 'video/mp4' }),
          durationSec: effectiveDuration
        };
      }
    }

    return null;
  } catch {
    return null;
  } finally {
    input.dispose();
  }
}

let cachedFFmpeg: FFmpeg | null = null;
let ffmpegLoadPromise: Promise<FFmpeg | null> | null = null;

/**
 * Charge l'instance FFmpeg.wasm de manière paresseuse et réutilisable
 */
async function getLoadedFFmpeg(): Promise<FFmpeg | null> {
  if (cachedFFmpeg) return cachedFFmpeg;
  if (ffmpegLoadPromise) return ffmpegLoadPromise;

  ffmpegLoadPromise = (async () => {
    try {
      const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
        import('@ffmpeg/ffmpeg'),
        import('@ffmpeg/util')
      ]);

      const ffmpeg = new FFmpeg();
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      const [coreURL, wasmURL] = await Promise.all([
        toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
      ]);

      await ffmpeg.load({ coreURL, wasmURL });
      cachedFFmpeg = ffmpeg;
      return ffmpeg;
    } catch (err) {
      console.warn('[VideoEngine] FFmpeg.wasm non disponible, bascule sur moteur suivant :', err);
      cachedFFmpeg = null;
      return null;
    } finally {
      ffmpegLoadPromise = null;
    }
  })();

  return ffmpegLoadPromise;
}

/**
 * Moteur 2 : Commande FFmpeg finale rapide (cible 8 à 12 Mo pour une source de 70-80 Mo)
 * -preset ultrafast -tune zerolatency -r 22 -bf 0 -vf scale=480:-2 -c:v libx264 -crf 32 -c:a copy -movflags +faststart
 */
async function encodeWithFFmpegUltrafast(
  file: File,
  onProgress: (pct: number) => void
): Promise<Blob | null> {
  const ffmpeg = await getLoadedFFmpeg();
  if (!ffmpeg) return null;

  const { fetchFile } = await import('@ffmpeg/util');
  const id = Date.now();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
  const inputName = `in_${id}.${ext}`;
  const outputName = `out_${id}.mp4`;

  const progressHandler = ({ progress }: { progress: number }) => {
    const pct = Math.min(99, Math.max(5, Math.round((progress || 0) * 100)));
    onProgress(pct);
  };

  ffmpeg.on('progress', progressHandler);

  try {
    onProgress(5);
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // Commande stricte H.264 Main/Baseline + Audio AAC + Faststart (100% compatible décodeurs mobiles & navigateurs)
    let exitCode = await ffmpeg.exec([
      '-i',
      inputName,
      '-preset',
      'ultrafast',
      '-tune',
      'zerolatency',
      '-r',
      '22',
      '-bf',
      '0',
      '-vf',
      'scale=480:-2',
      '-c:v',
      'libx264',
      '-profile:v',
      'main',
      '-pix_fmt',
      'yuv420p', // INDISPENSABLE : évite les erreurs de décodage et écrans noirs
      '-crf',
      '28',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-ar',
      '44100',
      '-movflags',
      '+faststart',
      '-y',
      outputName
    ]);

    // Repli de secours sans audio si la piste audio source est corrompue
    if (exitCode !== 0) {
      exitCode = await ffmpeg.exec([
        '-i',
        inputName,
        '-preset',
        'ultrafast',
        '-tune',
        'zerolatency',
        '-r',
        '22',
        '-bf',
        '0',
        '-vf',
        'scale=480:-2',
        '-c:v',
        'libx264',
        '-profile:v',
        'baseline',
        '-pix_fmt',
        'yuv420p',
        '-crf',
        '30',
        '-an',
        '-movflags',
        '+faststart',
        '-y',
        outputName
      ]);
    }

    if (exitCode !== 0) {
      throw new Error(`FFmpeg exited with code ${exitCode}`);
    }

    const data = await ffmpeg.readFile(outputName);
    const uint8 =
      data instanceof Uint8Array ? data : new Uint8Array(data as unknown as ArrayBuffer);
    if (uint8.byteLength === 0) {
      throw new Error('Fichier de sortie FFmpeg vide');
    }

    return new Blob([uint8], { type: 'video/mp4' });
  } finally {
    try {
      ffmpeg.off('progress', progressHandler);
    } catch {}
    try {
      await ffmpeg.deleteFile(inputName);
    } catch {}
    try {
      await ffmpeg.deleteFile(outputName);
    } catch {}
  }
}

/**
 * Moteur 3 : Enregistrement Canvas 480x854 + MediaRecorder optimisé (22 fps, 650 kbps)
 */
async function encodeWithCanvasMediaRecorder(
  file: File,
  onProgress: (pct: number) => void,
  extra: VideoEncodeExtraOptions = {}
): Promise<{ blob: Blob; durationSec: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    const targetWidth = toEven(extra.targetWidth || 480);
    const targetHeight = toEven(extra.targetHeight || 854);
    const fps = extra.fps || 22;
    const videoBitsPerSecond = extra.videoBitsPerSecond || 650_000;

    const cleanup = () => {
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
      } catch {}
      URL.revokeObjectURL(objectUrl);
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Impossible de décoder la vidéo source.'));
    };

    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 15;
      const srcW = video.videoWidth || targetWidth;
      const srcH = video.videoHeight || targetHeight;

      const scale = Math.min(1, targetWidth / Math.max(1, srcW), targetHeight / Math.max(1, srcH));
      const drawW = toEven(srcW * scale);
      const drawH = toEven(srcH * scale);

      const canvas = document.createElement('canvas');
      canvas.width = drawW;
      canvas.height = drawH;
      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx || typeof MediaRecorder === 'undefined') {
        cleanup();
        reject(new Error('Canvas ou MediaRecorder non supporté.'));
        return;
      }

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, drawW, drawH);

      const canvasStream = canvas.captureStream(fps);

      const mimeCandidates = [
        'video/mp4;codecs=avc1.42001e',
        'video/mp4;codecs=avc1.42E01E',
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=vp8',
        'video/webm'
      ];
      const selectedMime =
        mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || '';

      let recorder: MediaRecorder;
      try {
        recorder = selectedMime
          ? new MediaRecorder(canvasStream, {
              mimeType: selectedMime,
              videoBitsPerSecond
            })
          : new MediaRecorder(canvasStream, {
              videoBitsPerSecond
            });
      } catch (err) {
        cleanup();
        reject(err);
        return;
      }

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      let animFrameId = 0;
      const renderLoop = () => {
        if (video.paused || video.ended) return;

        if (extra.overlay?.filterCss && extra.overlay.filterCss !== 'none') {
          ctx.filter = extra.overlay.filterCss;
        } else {
          ctx.filter = 'none';
        }

        ctx.drawImage(video, 0, 0, drawW, drawH);

        if (extra.overlay?.text && extra.overlay.text.trim()) {
          ctx.filter = 'none';
          const text = extra.overlay.text.trim();
          const fontSize = Math.max(18, Math.round(drawW * 0.05));
          ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          let yPos = drawH * 0.5;
          if (extra.overlay.textPosition === 'top') yPos = drawH * 0.16;
          if (extra.overlay.textPosition === 'bottom') yPos = drawH * 0.84;
          ctx.fillStyle = extra.overlay.textColor || '#ffffff';
          ctx.fillText(text, drawW / 2, yPos);
        }

        const pct = Math.min(98, Math.max(5, Math.round((video.currentTime / duration) * 100)));
        onProgress(pct);

        animFrameId = requestAnimationFrame(renderLoop);
      };

      recorder.onstop = () => {
        cancelAnimationFrame(animFrameId);
        cleanup();
        const finalType = recorder.mimeType || selectedMime || 'video/mp4';
        const recordedBlob = new Blob(chunks, { type: finalType });
        if (recordedBlob.size > 0) {
          resolve({
            blob: recordedBlob,
            durationSec: duration
          });
        } else {
          reject(new Error('Enregistrement MediaRecorder vide.'));
        }
      };

      recorder.onerror = (ev) => {
        cancelAnimationFrame(animFrameId);
        cleanup();
        reject(new Error(`Erreur MediaRecorder: ${(ev as any)?.error?.message || 'inconnue'}`));
      };

      try {
        recorder.start(250);
      } catch (startErr) {
        cleanup();
        reject(startErr);
        return;
      }

      video
        .play()
        .then(() => {
          animFrameId = requestAnimationFrame(renderLoop);
        })
        .catch((playErr) => {
          try {
            if (recorder.state !== 'inactive') recorder.stop();
          } catch {}
          cleanup();
          reject(playErr);
        });

      video.onended = () => {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      };
    };
  });
}

/**
 * Pipeline d'encodage vidéo optimisé (Cible : 8 à 12 Mo pour 70-80 Mo, < 20s) :
 * 0) Bypass direct si fichier <= 12 Mo
 * 1) WebCodecs Matériel (Worker ou Direct — avc1.42001e, scale=480:-2, 22 fps, ~650 kbps / CRF 32, realtime)
 * 2) FFmpeg.wasm (-preset ultrafast -tune zerolatency -r 22 -bf 0 -vf scale=480:-2 -c:v libx264 -crf 32 -c:a copy)
 * 3) Canvas + MediaRecorder (480x854, 22 fps, 650 kbps)
 */
export async function encodeVideoOptimized(
  input: File | Blob,
  onProgress: (pct: number) => void,
  extra: VideoEncodeExtraOptions = {}
): Promise<VideoCompressionResult> {
  const startedAt = performance.now();
  const file: File =
    input instanceof File
      ? input
      : new File([input], `video-${Date.now()}.mp4`, { type: input.type || 'video/mp4' });

  // Log de vérification du moteur actif exigé au tout début
  console.log(
    '--> Moteur actif :',
    typeof VideoEncoder !== 'undefined' ? 'WebCodecs Hardware' : 'FFmpeg WASM'
  );

  let maxProgress = 0;
  const reportProgress = (pct: number) => {
    const clamped = Math.min(100, Math.max(0, Math.round(pct)));
    if (clamped > maxProgress) {
      maxProgress = clamped;
      onProgress(clamped);
    }
  };

  reportProgress(2);

  const hasCanvasOverlay =
    Boolean(extra.overlay?.text?.trim()) ||
    Boolean(extra.overlay?.filterCss && extra.overlay.filterCss !== 'none');

  // 0. Bypass intelligent : si le fichier est déjà léger (<= 8 Mo) et au format MP4 sans overlay, bypass instantané
  if (
    file.size <= 8 * 1024 * 1024 &&
    (file.type.includes('mp4') || file.name.toLowerCase().endsWith('.mp4')) &&
    !hasCanvasOverlay
  ) {
    reportProgress(100);
    return {
      compressedFile: file,
      originalSizeBytes: file.size,
      compressedSizeBytes: file.size,
      savingsRatioPercent: 0,
      engineUsed: 'passthrough',
      durationSec: 0,
      elapsedMs: Math.round(performance.now() - startedAt)
    };
  }

  let optimizedBlob: Blob | null = null;
  let engineUsed: VideoCompressionResult['engineUsed'] = 'webcodecs-hardware';
  let durationSec = 0;

  // 1. Moteur primaire ultra-rapide : WebCodecs matériel (Worker puis Direct) en 480p @ 22fps
  try {
    const workerRes = await encodeWithWebCodecsWorker(file, reportProgress, {
      ...extra,
      targetWidth: extra.targetWidth || 480,
      targetHeight: extra.targetHeight || 854,
      videoBitsPerSecond: extra.videoBitsPerSecond || 650_000,
      fps: extra.fps || 22
    });
    if (workerRes && workerRes.blob.size > 0) {
      optimizedBlob = workerRes.blob;
      durationSec = workerRes.durationSec;
      engineUsed = 'webcodecs-hardware';
    }
  } catch (workerErr) {
    console.warn('[VideoEngine] Worker WebCodecs indisponible :', workerErr);
  }

  if (!optimizedBlob && !hasCanvasOverlay) {
    try {
      const directRes = await encodeWithWebCodecsDirect(file, reportProgress, {
        ...extra,
        targetWidth: extra.targetWidth || 480,
        targetHeight: extra.targetHeight || 854,
        videoBitsPerSecond: extra.videoBitsPerSecond || 650_000,
        fps: extra.fps || 22
      });
      if (directRes && directRes.blob.size > 0) {
        optimizedBlob = directRes.blob;
        durationSec = directRes.durationSec;
        engineUsed = 'webcodecs-hardware';
      }
    } catch (directErr) {
      console.warn('[VideoEngine] WebCodecs direct indisponible :', directErr);
    }
  }

  // 2. Moteur secondaire : FFmpeg.wasm (-preset ultrafast -tune zerolatency -r 22 -bf 0 -vf scale=480:-2 -c:v libx264 -profile:v main -c:a aac)
  if (!optimizedBlob && !hasCanvasOverlay) {
    try {
      const ffmpegBlob = await encodeWithFFmpegUltrafast(file, reportProgress);
      if (ffmpegBlob && ffmpegBlob.size > 0) {
        optimizedBlob = ffmpegBlob;
        engineUsed = 'ffmpeg-wasm-ultrafast';
      }
    } catch (ffmpegErr) {
      console.warn('[VideoEngine] Repli de FFmpeg vers Canvas/MediaRecorder :', ffmpegErr);
    }
  }

  // 3. Moteur tertiaire : Canvas / MediaRecorder (480x854, 22 fps, 650 kbps)
  if (!optimizedBlob) {
    try {
      const canvasRes = await encodeWithCanvasMediaRecorder(file, reportProgress, {
        ...extra,
        targetWidth: extra.targetWidth || 480,
        targetHeight: extra.targetHeight || 854,
        fps: 22,
        videoBitsPerSecond: 650_000
      });
      if (canvasRes.blob.size > 0) {
        optimizedBlob = canvasRes.blob;
        durationSec = canvasRes.durationSec;
        engineUsed = 'canvas-mediarecorder-30fps';
      }
    } catch (canvasErr) {
      console.warn('[VideoEngine] Repli vers fichier direct :', canvasErr);
      optimizedBlob = file;
      engineUsed = 'passthrough';
    }
  }

  if (!optimizedBlob) {
    optimizedBlob = file;
    engineUsed = 'passthrough';
  }

  // Log de vérification dans la console exigé
  console.log(
    `[ENCODAGE H.264/AAC] Poids initial: ${(file.size / (1024 * 1024)).toFixed(2)} Mo -> Poids optimisé: ${(optimizedBlob.size / (1024 * 1024)).toFixed(2)} Mo | Moteur: ${engineUsed}`
  );

  const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_') || 'reel';
  const compressedFile = new File([optimizedBlob], `${baseName}-optimized.mp4`, {
    type: 'video/mp4'
  });

  const savingsRatioPercent = Math.max(
    0,
    Math.round((1 - compressedFile.size / Math.max(1, file.size)) * 100)
  );

  reportProgress(100);

  return {
    compressedFile,
    originalSizeBytes: file.size,
    compressedSizeBytes: compressedFile.size,
    savingsRatioPercent,
    engineUsed,
    durationSec,
    elapsedMs: Math.round(performance.now() - startedAt)
  };
}

/** Alias conservé pour tous les composants du projet */
export const compressVideoUniversally = encodeVideoOptimized;
