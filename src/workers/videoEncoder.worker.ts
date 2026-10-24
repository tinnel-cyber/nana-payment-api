/// <reference lib="webworker" />
/**
 * @file videoEncoder.worker.ts
 * @description Worker dédié d'encodage vidéo accéléré matériellement (WebCodecs + Mediabunny).
 *
 * Réglages optimisés pour un poids cible de 8 à 12 Mo (sur une source de 70-80 Mo) et < 20s :
 * - Plafonnement strict à 480p vertical (`scale=480:-2`, ex: 480x854)
 * - Framerate : 22 fps (`-r 22`)
 * - Zéro B-frames (`-bf 0` via profil H.264 Baseline `avc1.42001e` + `latencyMode: 'realtime'`)
 * - Équivalent CRF 32 en 480p 22fps : ~650 kbps (plafonné dynamiquement pour viser 10-12 Mo)
 * - Copie directe de la piste audio (`copy: { mode: 'preferred' }`, équivalent `-c:a copy`)
 */

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

export interface WorkerOverlayOptions {
  filterCss?: string;
  text?: string;
  textPosition?: 'top' | 'center' | 'bottom';
  textColor?: string;
}

export interface WorkerEncodeSettings {
  maxLongSide: number;
  maxShortSide: number;
  targetBitrate: number;
  maxDurationSec: number;
  maxFrameRate: number;
  passThroughBelowBytes: number;
}

export interface WorkerMessageIn {
  file: File;
  targetWidth?: number;
  targetHeight?: number;
  targetBitrate?: number;
}

export type WorkerMessageOut =
  | { type: 'PROGRESS'; progress: number }
  | { type: 'COMPLETE'; blob: Blob; mimeType: string }
  | { type: 'FALLBACK'; file: File; reason: string }
  | { type: 'ERROR'; error: string };

export type WorkerRequest =
  | { type: 'encode'; file: Blob; settings: WorkerEncodeSettings; overlay?: WorkerOverlayOptions }
  | { type: 'cancel' }
  | WorkerMessageIn;

export type WorkerResponse =
  | { type: 'progress'; pct: number }
  | {
      type: 'done';
      buffer: ArrayBuffer;
      width: number;
      height: number;
      durationSec: number;
      transcoded: boolean;
    }
  | { type: 'error'; message: string; unsupported?: boolean };

const ctxWorker = self as unknown as DedicatedWorkerGlobalScope;

let activeConversion: Conversion | null = null;
let cancelled = false;

const post = (msg: WorkerResponse | WorkerMessageOut, transfer: Transferable[] = []) =>
  ctxWorker.postMessage(msg, transfer);

const toEven = (n: number) => Math.max(2, Math.round(n / 2) * 2);

const resolvedAvcCodecMap = new Map<string, string>();
let webCodecsPatched = false;

/**
 * Garantit que Mediabunny utilise systématiquement `avc1.42001e` (Baseline Level 3.0, 0 B-frame)
 * + `latencyMode: 'realtime'` + `framerate: 22`.
 */
function ensureFastWebCodecsPatch() {
  if (webCodecsPatched) return;
  webCodecsPatched = true;

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
              resolvedAvcCodecMap.set(config.codec, codecStr);
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
          resolvedAvcCodecMap.get(fastCfg.codec) ||
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

  // Transformateur Canvas mono-passe rapide (`scale=480:-2` sans mipmapping multi-passes)
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

function hasOverlay(o?: WorkerOverlayOptions): boolean {
  if (!o) return false;
  return Boolean((o.filterCss && o.filterCss !== 'none') || (o.text && o.text.trim()));
}

function buildOverlayProcessor(o: WorkerOverlayOptions, width: number, height: number) {
  if (typeof OffscreenCanvas === 'undefined') return undefined;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d', { alpha: false }) as OffscreenCanvasRenderingContext2D | null;
  if (!ctx) return undefined;

  const filter = o.filterCss && o.filterCss !== 'none' ? o.filterCss : 'none';
  const text = (o.text || '').trim();

  return (sample: { draw: (c: OffscreenCanvasRenderingContext2D, x: number, y: number, w: number, h: number) => void }) => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    ctx.filter = filter;
    sample.draw(ctx, 0, 0, width, height);
    ctx.filter = 'none';

    if (text) {
      const fontSize = Math.max(20, Math.round(width * 0.052));
      ctx.font = `bold ${fontSize}px Inter, system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let y = height * 0.5;
      if (o.textPosition === 'top') y = height * 0.16;
      if (o.textPosition === 'bottom') y = height * 0.84;

      const padX = 20;
      const padY = 12;
      const boxW = ctx.measureText(text).width + padX * 2;
      const boxH = fontSize + padY * 2;
      const boxX = (width - boxW) / 2;
      const boxY = y - boxH / 2;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') ctx.roundRect(boxX, boxY, boxW, boxH, 16);
      else ctx.rect(boxX, boxY, boxW, boxH);
      ctx.fill();
      ctx.strokeStyle = '#4169E1';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = o.textColor || '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 8;
      ctx.fillText(text, width / 2, y);
      ctx.shadowBlur = 0;
    }
    return canvas;
  };
}

/**
 * Redimensionnement direct divisible par 2 plafonné à 480p (`scale=480:-2`).
 * Largeur 480 px (ou côté court <= 480 px), hauteur automatique proportionnelle paire.
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

async function runEncode(
  file: Blob,
  s: WorkerEncodeSettings,
  overlay?: WorkerOverlayOptions,
  legacyFormat = false
) {
  if (typeof VideoEncoder === 'undefined' || typeof VideoDecoder === 'undefined') {
    if (legacyFormat && file instanceof File) {
      post({ type: 'FALLBACK', file, reason: 'WebCodecs indisponible' });
    } else {
      post({ type: 'error', message: 'WebCodecs indisponible', unsupported: true });
    }
    return;
  }

  ensureFastWebCodecsPatch();

  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });

  try {
    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack) {
      if (legacyFormat && file instanceof File) {
        post({ type: 'FALLBACK', file, reason: 'Aucune piste vidéo détectée' });
      } else {
        post({ type: 'error', message: 'Aucune piste vidéo détectée dans ce fichier.', unsupported: true });
      }
      return;
    }
    if (!(await videoTrack.canDecode())) {
      if (legacyFormat && file instanceof File) {
        post({ type: 'FALLBACK', file, reason: 'Codec vidéo source non décodable' });
      } else {
        post({ type: 'error', message: 'Codec vidéo source non décodable par cet appareil.', unsupported: true });
      }
      return;
    }

    // 1. Lecture instantanée de la durée depuis les métadonnées (< 2ms)
    const metaDuration = await input.getDurationFromMetadata();
    const sourceDuration =
      metaDuration && Number.isFinite(metaDuration) && metaDuration >= 0.5
        ? metaDuration
        : Math.max((await input.computeDuration()) || 0, metaDuration || 0, 0.1);

    const allTracks = await input.getTracks();
    for (const t of allTracks) {
      t.getDurationFromMetadata = async () => sourceDuration;
    }

    const trimEnd = s.maxDurationSec > 0 && sourceDuration > s.maxDurationSec ? s.maxDurationSec : undefined;
    const effectiveDuration = trimEnd !== undefined ? trimEnd : sourceDuration;

    // 2. Plafonnement strict de la résolution à 480p vertical (`scale=480:-2`, ex: 480x854)
    const rotation = await videoTrack.getRotation();
    const rawW = (await videoTrack.getSquarePixelWidth()) || videoTrack.displayWidth || 480;
    const rawH = (await videoTrack.getSquarePixelHeight()) || videoTrack.displayHeight || 854;
    const srcW = rotation % 180 === 0 ? rawW : rawH;
    const srcH = rotation % 180 === 0 ? rawH : rawW;

    const withOverlay = hasOverlay(overlay);

    const { width: outWidth, height: outHeight, needsResize } = computeScale480Dimensions(
      srcW,
      srcH,
      Math.min(s.maxShortSide || 480, 480),
      Math.min(s.maxLongSide || 854, 854)
    );

    // 3. Bitrate équivalent à CRF 32 en 480p @ 22fps (~650 kbps), plafonné pour qu'une vidéo de 70-80 Mo sorte à ~10-12 Mo
    const requestedBitrate = s.targetBitrate || 650_000;
    const maxBitrateFor11MB =
      effectiveDuration > 10
        ? Math.max(350_000, Math.floor((9.5 * 1024 * 1024 * 8) / effectiveDuration))
        : requestedBitrate;
    const bitrate = Math.min(requestedBitrate, maxBitrateFor11MB);

    const encoderConfig: VideoEncoderConfig = {
      codec: 'avc1.42001e', // Baseline Profile Level 3.0 (0 B-frames = -bf 0, compatibilité maximale)
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

    let lastError: unknown = null;
    let highestPctReported = 1;

    for (const attempt of attempts) {
      if (cancelled) return;

      const videoOptions: ConversionVideoOptions = {
        ...(needsResize || withOverlay
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
        ...(avcOk ? { codec: 'avc' as const } : {}),
        ...(withOverlay
          ? {
              process: buildOverlayProcessor(overlay!, outWidth, outHeight) as ConversionVideoOptions['process'],
              processedWidth: outWidth,
              processedHeight: outHeight
            }
          : {})
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
        lastError = new Error('conversion invalide : ' + conversion.discardedTracks.map(t => t.reason).join(', '));
        continue;
      }

      activeConversion = conversion;
      conversion.onProgress = (p: number, processedTime?: number) => {
        const ratio =
          typeof processedTime === 'number' && effectiveDuration > 0
            ? processedTime / effectiveDuration
            : p;
        const rawPct = Math.min(99, Math.max(1, Math.round(ratio * 100)));
        if (rawPct >= highestPctReported) {
          highestPctReported = rawPct;
          if (legacyFormat) {
            post({ type: 'PROGRESS', progress: rawPct });
          } else {
            post({ type: 'progress', pct: rawPct });
          }
        }
      };

      try {
        await conversion.execute();
      } catch (err) {
        if (cancelled) return;
        lastError = err;
        continue;
      } finally {
        activeConversion = null;
      }

      const buffer = (output.target as BufferTarget).buffer;
      if (!buffer || buffer.byteLength === 0) {
        lastError = new Error("Aucune donnée n'a été produite par l'encodeur.");
        continue;
      }

      if (legacyFormat) {
        post({ type: 'PROGRESS', progress: 100 });
        post({
          type: 'COMPLETE',
          blob: new Blob([buffer], { type: 'video/mp4' }),
          mimeType: 'video/mp4'
        });
      } else {
        post(
          {
            type: 'done',
            buffer,
            width: outWidth,
            height: outHeight,
            durationSec: effectiveDuration,
            transcoded: true
          },
          [buffer]
        );
      }
      return;
    }

    const errMsg = lastError instanceof Error ? lastError.message : "Échec de l'encodage vidéo.";
    if (legacyFormat && file instanceof File) {
      post({ type: 'FALLBACK', file, reason: errMsg });
    } else {
      post({ type: 'error', message: errMsg, unsupported: true });
    }
  } catch (err) {
    if (cancelled) return;
    const errMsg = err instanceof Error ? err.message : "Échec de l'encodage vidéo.";
    if (legacyFormat && file instanceof File) {
      post({ type: 'FALLBACK', file, reason: errMsg });
    } else {
      post({ type: 'error', message: errMsg, unsupported: true });
    }
  } finally {
    input.dispose();
  }
}

ctxWorker.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data as any;
  if (!msg) return;

  if (msg.type === 'cancel') {
    cancelled = true;
    activeConversion?.cancel().catch(() => {});
    return;
  }

  if (msg.type === 'encode') {
    cancelled = false;
    void runEncode(msg.file, msg.settings, msg.overlay, false);
    return;
  }

  if (msg.file instanceof Blob) {
    cancelled = false;
    const settings: WorkerEncodeSettings = {
      maxShortSide: msg.targetWidth || 480,
      maxLongSide: msg.targetHeight || 854,
      targetBitrate: msg.targetBitrate || 650_000,
      maxDurationSec: 0,
      maxFrameRate: 22,
      passThroughBelowBytes: 12 * 1024 * 1024
    };
    void runEncode(msg.file, settings, undefined, true);
  }
};
