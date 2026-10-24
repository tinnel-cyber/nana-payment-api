/**
 * UTILITAIRE D'ENCODAGE NANO-VIDÉO CÔTÉ CLIENT (WAMEET CHAT)
 * -----------------------------------------------------------------
 * Directive stricte Anti-Coûts Firebase :
 * 1. Résolution maximale plafonnée à 480p (ex: 854x480 ou 480x854 pour les vidéos verticales).
 * 2. Durée coupée à 30 secondes maximum.
 * 3. Débit binaire réduit (~600 kbps) pour ramener 50 Mo à < 2-3 Mo.
 * 4. Blocage anti-abus si le fichier dépasse strictement 5 Mo après encodage.
 *
 * Moteur : WebCodecs (VideoEncoder/VideoDecoder matériels) dans un Web Worker dédié
 * — voir `services/videoEncoderService.ts`. Plus aucune lecture en temps réel.
 */

import { encodeVideo } from '../services/videoEncoderService';

export interface VideoCompressionOptions {
  maxDurationSec?: number; // 30 secondes par défaut
  targetMaxDimension?: number; // 854px max (480p)
  targetBitrate?: number; // 600 kbps par défaut
  maxSizeLimitBytes?: number; // 5 Mo strict
  onProgress?: (progressPct: number) => void;
}

export interface CompressedVideoResult {
  file: File;
  blob: Blob;
  sizeBytes: number;
  durationSec: number;
  width: number;
  height: number;
  reductionRatio: string;
}

/**
 * Détermine les dimensions proportionnelles avec plafond 480p (max 854x480 ou 480x854)
 */
export function calculate480pDimensions(
  originalWidth: number,
  originalHeight: number,
  targetMaxDim = 854
): { width: number; height: number } {
  let w = originalWidth;
  let h = originalHeight;

  if (w <= 0 || h <= 0) {
    return { width: 480, height: 854 }; // Défaut vertical mobile
  }

  const isPortrait = h >= w;
  const maxAllowed = isPortrait ? 854 : targetMaxDim;
  const maxShortSide = 480;

  if (isPortrait) {
    if (w > maxShortSide || h > maxAllowed) {
      const scale = Math.min(maxShortSide / w, maxAllowed / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
  } else if (h > maxShortSide || w > maxAllowed) {
    const scale = Math.min(maxAllowed / w, maxShortSide / h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  // Les dimensions doivent être paires pour l'encodage vidéo (H.264)
  w = w % 2 === 0 ? w : w - 1;
  h = h % 2 === 0 ? h : h - 1;

  return { width: Math.max(240, w), height: Math.max(240, h) };
}

/**
 * Encode et coupe une vidéo côté client (WebCodecs matériel, Worker dédié).
 * Ramène les vidéos de 50 Mo à moins de 2-3 Mo en 480p / 30 s.
 * (Nom historique conservé pour compatibilité des imports.)
 */
export async function compressAndTrimVideo(
  videoFile: File | Blob,
  options: VideoCompressionOptions = {}
): Promise<CompressedVideoResult> {
  const {
    maxDurationSec = 30,
    targetMaxDimension = 854,
    targetBitrate = 600_000,
    maxSizeLimitBytes = 5 * 1024 * 1024,
    onProgress
  } = options;

  const result = await encodeVideo(videoFile, {
    preset: 'chat',
    maxDurationSec,
    overrides: { maxLongSide: targetMaxDimension, targetBitrate },
    onProgress
  });

  // Règle anti-abus stricte : au-delà de la limite, on bloque
  if (result.encodedSizeBytes > maxSizeLimitBytes) {
    throw new Error('Vidéo trop longue pour le chat rapide. Veuillez raccourcir la vidéo.');
  }

  const reductionRatio =
    result.engine === 'passthrough' || result.savingsPercent <= 0
      ? 'Optimisé direct'
      : `${result.savingsPercent}% de réduction`;

  return {
    file: result.file,
    blob: result.file,
    sizeBytes: result.encodedSizeBytes,
    durationSec: Math.round(result.durationSec),
    width: result.width,
    height: result.height,
    reductionRatio
  };
}
