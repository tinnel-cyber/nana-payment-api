import React, { useState } from 'react';
import { requestPresignedUrl, uploadToS3WithProgress } from '../../utils/s3UploadService';

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (videoUrl: string, previewUrl: string) => void;
}

export const VideoUploadModal: React.FC<VideoUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [stage, setStage] = useState<'idle' | 'encoding' | 'uploading' | 'completed' | 'error'>('idle');
  const [encodeProgress, setEncodeProgress] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  if (!isOpen) return null;

  const resetState = () => {
    setStage('idle');
    setEncodeProgress(0);
    setUploadProgress(0);
    setErrorMessage(null);
    setPreviewThumbnail(null);
    setSelectedFileName('');
  };

  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validation du format
    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v|mkv|avi)$/i.test(file.name);
    if (!isVideo) {
      setErrorMessage("Format non supporté. Veuillez sélectionner un fichier vidéo valide (MP4, MOV, WebM).");
      setStage('error');
      return;
    }

    // 2. Limite stricte : 200 Mo maximum
    if (file.size > 200 * 1024 * 1024) {
      setErrorMessage("La vidéo est trop lourde (maximum 200 Mo).");
      setStage('error');
      return;
    }

    setSelectedFileName(file.name);
    setErrorMessage(null);

    // Génération instantanée de la vignette de prévisualisation locale
    const localVideoUrl = URL.createObjectURL(file);
    generateVideoThumbnail(localVideoUrl, (thumbnail) => {
      setPreviewThumbnail(thumbnail);
    });

    // Démarrage immédiat de l'upload direct vers S3 (wa-videos/)
    await startUpload(file, file.type || 'video/mp4');
  };

  const generateVideoThumbnail = (videoSrc: string, callback: (thumbUrl: string) => void) => {
    const video = document.createElement('video');
    video.src = videoSrc;
    video.crossOrigin = 'anonymous';
    video.currentTime = 0.5; // Première demi-seconde
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      video.play().catch(() => {});
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 180;
      canvas.height = 320;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL('image/jpeg', 0.8));
      }
      video.pause();
      URL.revokeObjectURL(videoSrc);
    };
  };

  const startUpload = async (fileBlob: Blob, mimeType: string) => {
    setStage('uploading');
    setUploadProgress(0);

    try {
      // 1. Récupération de l'URL signée S3 (wa-videos/{timestamp}_{filename}.mp4)
      const { uploadUrl, finalPublicUrl } = await requestPresignedUrl(selectedFileName || 'reel.mp4', mimeType);

      // 2. Transfert direct vers S3 avec progression temps réel
      await uploadToS3WithProgress(uploadUrl, fileBlob, mimeType, (percent) => {
        setUploadProgress(percent);
      });

      // 3. Suivi UX : upload 100% terminé -> optimisation en cours
      setStage('encoding'); // Réutilise l'étape visuelle pour "Traitement et optimisation du Reel en cours..."
      setEncodeProgress(100);

      setTimeout(() => {
        setStage('completed');
        setTimeout(() => {
          onSuccess(finalPublicUrl, previewThumbnail || '');
          onClose();
          resetState();
        }, 600);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err?.message || "Échec du transfert vers le serveur S3.");
      setStage('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 flex flex-col gap-5">
        
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Publier une Vitrine Immersive</h2>
            <p className="text-xs text-gray-400 mt-0.5">Format vertical 9:16 (jusqu'à 200 Mo)</p>
          </div>
          {stage === 'idle' && (
            <button
              onClick={() => { resetState(); onClose(); }}
              className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Écran d'accueil / Sélection de fichier */}
        {stage === 'idle' && (
          <div className="border-2 border-dashed border-[#4169E1]/30 hover:border-[#4169E1] rounded-2xl p-8 text-center transition-all bg-blue-50/20">
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              id="wameet-video-input"
              className="hidden"
              onChange={handleFileSelection}
            />
            <label htmlFor="wameet-video-input" className="cursor-pointer flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-[#4169E1]/10 text-[#4169E1] flex items-center justify-center mb-3 shadow-inner">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-800">Choisir une vidéo</span>
              <span className="text-xs text-gray-400 mt-1">Traitement matériel rapide & sécurisé</span>
            </label>
          </div>
        )}

        {/* Prévisualisation dynamique (aucune URL brute) */}
        {previewThumbnail && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-2xl">
            <div className="w-12 h-16 rounded-lg bg-black overflow-hidden flex-shrink-0 shadow-sm">
              <img src={previewThumbnail} alt="Aperçu vidéo" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{selectedFileName}</p>
              <span className="inline-block mt-1 text-[10px] font-bold text-[#4169E1] bg-[#4169E1]/10 px-2 py-0.5 rounded-full">
                Prêt pour diffusion 9:16
              </span>
            </div>
          </div>
        )}

        {/* Barre de Progression Direct Upload S3 & Optimisation Lambda */}
        {(stage === 'encoding' || stage === 'uploading' || stage === 'completed') && (
          <div className="space-y-4 pt-1">
            {/* Barre 1 : Transfert direct S3 */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1.5">
                <span>Envoi direct vers S3 (wa-videos)... ({uploadProgress}%)</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4169E1] transition-all duration-150 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>

            {/* Indicateur : Optimisation Reel */}
            {(stage === 'encoding' || stage === 'completed') && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center animate-pulse">
                <p className="text-xs text-[#4169E1] font-bold">
                  Traitement et optimisation du Reel en cours...
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Génération automatique 480p FastStart dans compressed-reels/
                </p>
              </div>
            )}
          </div>
        )}

        {/* Message d'erreur et option pour réinitialiser */}
        {stage === 'error' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
            <p className="text-xs text-red-600 font-medium">{errorMessage}</p>
            <button
              onClick={resetState}
              className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"
            >
              Recommencer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
