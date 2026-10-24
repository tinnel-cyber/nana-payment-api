const fs = require('fs');
let code = fs.readFileSync('src/components/ProfilePhotoUpload.tsx', 'utf-8');

// Replace uploadMediaToStorage with compressImageToBase64
code = code.replace(/import \{ uploadMediaToStorage \} from '\.\.\/firebase';/, "import { compressImageToBase64 } from '../utils/imageCompressor';");

const oldHandleFileChangeRegex = /const handleFileChange = async \([^]+\n    \}\n  \};/m;
const newHandleFileChange = `const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playTapBeep();
    setIsUploading(true);
    try {
      const maxD = category === 'seller' || category === 'manager' ? 200 : 400;
      const base64 = await compressImageToBase64(file, maxD, maxD, 0.7);
      setPhotoUrl(base64);
      onPhotoUpdated(base64);
      playValidationBeep();
    } catch (error) {
      console.error('Image compression error:', error);
      alert('Erreur lors du redimensionnement de l\\'image.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };`;

code = code.replace(oldHandleFileChangeRegex, newHandleFileChange);

const oldCapturePhotoRegex = /const capturePhoto = async \([^]+\n    \}\n  \};/m;
const newCapturePhoto = `const capturePhoto = async () => {
    if (!videoRef.current || !streamRef.current) return;
    setIsUploading(true);
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      // Crop square
      const size = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - size) / 2;
      const startY = (video.videoHeight - size) / 2;
      
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
        canvas.toBlob(async (blob) => {
          if (!blob) throw new Error('Canvas empty');
          const maxD = category === 'seller' || category === 'manager' ? 200 : 400;
          const base64 = await compressImageToBase64(blob, maxD, maxD, 0.7);
          setPhotoUrl(base64);
          onPhotoUpdated(base64);
          playValidationBeep();
          stopCamera();
          setIsUploading(false);
        }, 'image/jpeg', 0.8);
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      alert('Erreur lors de la capture.');
      setIsUploading(false);
    }
  };`;
  
code = code.replace(oldCapturePhotoRegex, newCapturePhoto);

fs.writeFileSync('src/components/ProfilePhotoUpload.tsx', code);
