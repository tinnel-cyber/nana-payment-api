const fs = require('fs');
let code = fs.readFileSync('src/components/BarcodeSelfieScanner.tsx', 'utf-8');

// Ensure proper cleanup of MediaDevices
const stopScannerReplace = `
  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner', err);
      }
      html5QrCodeRef.current = null;
    }
    // Force stop all tracks
    if (navigator.mediaDevices) {
       navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(stream => {
          stream.getTracks().forEach(t => t.stop());
       }).catch(() => {});
    }
    setIsScanning(false);
  };
`;

code = code.replace(/const stopScanner = async \(\) => \{[^]+\n  \};\n/m, stopScannerReplace + '\n');

// Add toggle button to UI
const toggleButton = `
        {/* Toggle Camera Button */}
        <button
          onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
          className="absolute top-4 left-4 bg-slate-800/80 p-2 rounded-full text-white z-50 border border-slate-700 shadow-xl"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
`;
if (!code.includes('Toggle Camera Button')) {
  code = code.replace(/\{isScanning && \(\s*<div className="absolute inset-0 border-2/, toggleButton + '\n        {isScanning && (\n          <div className="absolute inset-0 border-2');
}

fs.writeFileSync('src/components/BarcodeSelfieScanner.tsx', code);
