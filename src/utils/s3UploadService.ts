/**
 * Service de téléversement sécurisé direct brut vers AWS S3 via Presigned URL
 * avec suivi de la progression en pourcentage réel.
 * Destiné au pipeline brut wa-videos/ -> transcodage AWS Lambda serverless (compressed-reels/...)
 */
import {
  getPresignedUploadUrl,
  uploadFileToS3,
  compressImageToWebp,
  uploadImageToS3,
  checkCompressedVideoReady,
  buildHlsUrl,
  buildPosterUrl,
  resolvePosterFromVideoUrl,
} from '../services/s3UploadService';

export interface PresignedUrlResponse {
  uploadUrl: string;
  finalPublicUrl: string;
  hlsUrl?: string;
  posterUrl?: string;
  rawVideoUrl?: string;
  fileKey?: string;
  compressedKey?: string;
  reelNom?: string;
}

export const requestPresignedUrl = async (fileName: string, mimeType: string = 'video/mp4'): Promise<PresignedUrlResponse> => {
  try {
    const response = await fetch('/api/media/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, mimeType })
    });

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const data = await response.json();
      if (data?.uploadUrl) {
        return {
          uploadUrl: data.uploadUrl,
          finalPublicUrl: data.hlsUrl || data.finalVideoUrl || data.finalPublicUrl,
          hlsUrl: data.hlsUrl || data.finalVideoUrl || data.finalPublicUrl,
          posterUrl: data.posterUrl,
          rawVideoUrl: data.rawVideoUrl,
          fileKey: data.fileKey,
          compressedKey: data.compressedKey,
          reelNom: data.reelNom,
        };
      }
    }
  } catch {
    // Repli transparent vers le presigner S3 universel (supporte Firebase Hosting statique)
  }

  try {
    const fallback = await getPresignedUploadUrl(fileName, mimeType);
    return {
      uploadUrl: fallback.uploadUrl,
      finalPublicUrl: fallback.hlsUrl || fallback.finalVideoUrl,
      hlsUrl: fallback.hlsUrl,
      posterUrl: fallback.posterUrl,
      rawVideoUrl: fallback.rawVideoUrl,
      fileKey: fallback.fileKey,
      compressedKey: fallback.compressedKey,
      reelNom: fallback.reelNom,
    };
  } catch (err: any) {
    throw new Error(err?.message || "Impossible d'obtenir l'URL d'upload sécurisée.");
  }
};

export const uploadToS3WithProgress = (
  uploadUrl: string,
  data: Blob | File,
  mimeType: string,
  onProgress: (percent: number) => void
): Promise<void> => {
  return uploadFileToS3(uploadUrl, data, onProgress);
};

export {
  compressImageToWebp,
  uploadImageToS3,
  checkCompressedVideoReady,
  buildHlsUrl,
  buildPosterUrl,
  resolvePosterFromVideoUrl,
};
