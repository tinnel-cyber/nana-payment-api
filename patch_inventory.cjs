const fs = require('fs');
let code = fs.readFileSync('src/components/InventoryView.tsx', 'utf-8');

code = code.replace(/import \{ uploadMediaToStorage \} from '\.\.\/firebase';/, "import { compressImageToBase64 } from '../utils/imageCompressor';");

const oldHandlePhotoUploadRegex = /const handlePhotoUpload = async \([^]+\n    \}\n  \};/m;
const newHandlePhotoUpload = `const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playTapBeep();
    setIsUploadingPhoto(true);

    try {
      const base64 = await compressImageToBase64(file, 400, 400, 0.7);
      setEditingProduct((prev) => (prev ? { ...prev, imageUrl: base64 } : null));
      playValidationBeep();
    } catch (error) {
      console.error('Erreur photo :', error);
      alert('Erreur lors de la compression de la photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };`;

code = code.replace(oldHandlePhotoUploadRegex, newHandlePhotoUpload);

fs.writeFileSync('src/components/InventoryView.tsx', code);
