import { useState, useRef, useCallback, useEffect } from 'react';
import { playTapBeep, playValidationBeep, playCancelSound } from '../utils/audio';

export interface UseLocalScreenRecorderOptions {
  /** Préfixe du nom de fichier téléchargé automatiquement */
  filenamePrefix?: string;
  /** Callback optionnel lors du démarrage de l'enregistrement */
  onStart?: () => void;
  /** Callback optionnel lors de l'arrêt avec accès au Blob généré */
  onStop?: (blob: Blob, downloadUrl: string) => void;
  /** Callback d'erreur pour affichage de Toast */
  onError?: (message: string, error?: unknown) => void;
  /** Callback de recommandation pour fallback natif (notamment mobile) */
  onFallbackRecommended?: (message: string) => void;
}

export interface UseLocalScreenRecorderReturn {
  /** Indique si un enregistrement est activement en cours */
  isRecording: boolean;
  /** Durée d'enregistrement écoulée en secondes */
  durationSeconds: number;
  /** Durée formatée MM:SS */
  formattedDuration: string;
  /** Indique si l'API Screen Capture est supportée par le navigateur actuel */
  isSupported: boolean;
  /** Message d'erreur éventuel */
  errorMessage: string | null;
  /** Démarrer la capture d'écran locale */
  startRecording: () => Promise<boolean>;
  /** Arrêter l'enregistrement et déclencher le téléchargement automatique */
  stopRecording: () => Promise<Blob | null>;
}

/**
 * HOOK useLocalScreenRecorder (Prompt 52 : Enregistrement d'Écran Local Zéro Coût Serveur)
 * 
 * Directives Techniques :
 * - Capture locale via navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
 * - Encodage via MediaRecorder API avec sélection du meilleur codec supporté (MP4 / WebM)
 * - Téléchargement silencieux et automatique sur la mémoire locale de l'appareil (zéro bande passante serveur)
 * - Gestion fine des exceptions mobiles (iOS Safari, Android WebViews sans DisplayMedia) avec toast clair
 */
export function useLocalScreenRecorder(
  options: UseLocalScreenRecorderOptions = {}
): UseLocalScreenRecorderReturn {
  const {
    filenamePrefix = 'Wameet_Live_Capture',
    onStart,
    onStop,
    onError,
    onFallbackRecommended
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Vérification de compatibilité de l'API DisplayMedia dans le navigateur
  const isSupported = typeof window !== 'undefined' &&
    !!(navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') &&
    typeof MediaRecorder !== 'undefined';

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  // Formatage chronomètre MM:SS
  const formattedDuration = formatSeconds(durationSeconds);

  // Nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  /**
   * Arrêt effectif de l'enregistrement et génération du téléchargement local
   */
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!isRecording && !mediaRecorderRef.current) {
      return null;
    }

    return new Promise<Blob | null>((resolve) => {
      const recorder = mediaRecorderRef.current;
      const stream = mediaStreamRef.current;

      // Arrêt du chronomètre
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      if (!recorder || recorder.state === 'inactive') {
        setIsRecording(false);
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        try {
          // Détection du mimeType ou fallback
          const mimeType = recorder.mimeType || 'video/mp4';
          const extension = mimeType.toLowerCase().includes('mp4') ? 'mp4' : 'webm';
          const blob = new Blob(recordedChunksRef.current, { type: mimeType });

          // Téléchargement automatique et silencieux sur la mémoire locale
          if (blob.size > 0) {
            const downloadUrl = URL.createObjectURL(blob);
            const hiddenAnchor = document.createElement('a');
            hiddenAnchor.style.display = 'none';
            hiddenAnchor.href = downloadUrl;

            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10);
            const timeStr = `${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;
            hiddenAnchor.download = `${filenamePrefix}_${dateStr}_${timeStr}.${extension}`;

            document.body.appendChild(hiddenAnchor);
            hiddenAnchor.click();

            // Nettoyage de l'ancre et de l'URL objet
            window.setTimeout(() => {
              if (hiddenAnchor.parentNode) {
                hiddenAnchor.parentNode.removeChild(hiddenAnchor);
              }
              URL.revokeObjectURL(downloadUrl);
            }, 2000);

            playValidationBeep();
            if (onStop) {
              onStop(blob, downloadUrl);
            }
            resolve(blob);
          } else {
            resolve(null);
          }
        } catch (err) {
          console.error('[SCREEN RECORDER] Erreur lors de la création du Blob :', err);
          resolve(null);
        } finally {
          // Arrêt de tous les flux vidéo/audio du stream
          if (stream) {
            stream.getTracks().forEach((t) => t.stop());
            mediaStreamRef.current = null;
          }
          mediaRecorderRef.current = null;
          recordedChunksRef.current = [];
          setIsRecording(false);
          setDurationSeconds(0);
        }
      };

      try {
        recorder.stop();
      } catch (err) {
        console.warn('[SCREEN RECORDER] recorder.stop() exception :', err);
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
        setIsRecording(false);
        resolve(null);
      }
    });
  }, [isRecording, filenamePrefix, onStop]);

  /**
   * Démarrage de la capture d'écran locale
   */
  const startRecording = useCallback(async (): Promise<boolean> => {
    setErrorMessage(null);

    // 1. Détection de support navigateur (Mobile vs Desktop)
    if (!isSupported) {
      const msg = "L'enregistrement d'écran web n'est pas supporté sur ce navigateur. Utilisez la fonction d'enregistrement native de votre téléphone.";
      setErrorMessage(msg);
      playCancelSound();
      if (onFallbackRecommended) {
        onFallbackRecommended(msg);
      } else if (onError) {
        onError(msg);
      }
      return false;
    }

    try {
      playTapBeep();

      // 2. Demande de permission native de capture d'écran (avec audio si possible)
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: 'browser'
          } as any,
          audio: true
        });
      } catch (audioVideoErr: any) {
        // Fallback sans audio si le navigateur bloque la capture du son système
        if (
          audioVideoErr.name === 'NotFoundError' ||
          audioVideoErr.name === 'NotSupportedError' ||
          audioVideoErr.name === 'TypeError'
        ) {
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: true
          });
        } else {
          throw audioVideoErr;
        }
      }

      mediaStreamRef.current = stream;
      recordedChunksRef.current = [];

      // Si l'utilisateur clique sur le bouton natif "Arrêter le partage" du navigateur
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener('ended', () => {
          stopRecording();
        });
      }

      // 3. Sélection du meilleur format vidéo supporté par l'appareil
      const preferredMimeTypes = [
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ];

      let chosenMimeType: string | undefined = undefined;
      for (const mime of preferredMimeTypes) {
        if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(mime)) {
          chosenMimeType = mime;
          break;
        }
      }

      const recorderOptions: MediaRecorderOptions = {};
      if (chosenMimeType) {
        recorderOptions.mimeType = chosenMimeType;
      }

      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;

      // Réception des morceaux de vidéo (chunks)
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      // Démarrage de l'enregistrement avec écriture continue (timeslice 1000ms)
      recorder.start(1000);
      setIsRecording(true);
      setDurationSeconds(0);

      // Chronomètre
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
      }
      timerIntervalRef.current = window.setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);

      if (onStart) {
        onStart();
      }

      return true;
    } catch (err: any) {
      console.warn('[SCREEN RECORDER] Erreur de capture d’écran :', err);

      // Si l'utilisateur a simplement refusé / annulé la popup de capture
      if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
        const cancelMsg = "Autorisation de capture d'écran refusée ou annulée.";
        setErrorMessage(cancelMsg);
        if (onError) onError(cancelMsg, err);
        return false;
      }

      // Incompatibilité mobile (iOS Safari, Android Webview)
      const mobileMsg = "L'enregistrement d'écran web n'est pas supporté sur ce navigateur. Utilisez la fonction d'enregistrement native de votre téléphone.";
      setErrorMessage(mobileMsg);
      playCancelSound();

      if (onFallbackRecommended) {
        onFallbackRecommended(mobileMsg);
      } else if (onError) {
        onError(mobileMsg, err);
      }
      return false;
    }
  }, [isSupported, onStart, onError, onFallbackRecommended, stopRecording]);

  return {
    isRecording,
    durationSeconds,
    formattedDuration,
    isSupported,
    errorMessage,
    startRecording,
    stopRecording
  };
}

/** Formate des secondes en MM:SS */
function formatSeconds(totalSecs: number): string {
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default useLocalScreenRecorder;
