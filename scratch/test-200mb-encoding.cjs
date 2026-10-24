const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ffmpegBin = 'C:\\ffmpeg\\bin\\ffmpeg.exe';
const inputVideoPath = path.join(__dirname, 'test_source_200mb_real.mp4');
const outputVideoPath = path.join(__dirname, 'test_output_480p_real.mp4');

console.log('=== TEST D\'ENCODAGE 480p SUR UN VRAI FICHIER DE ~200 MO ===');

if (fs.existsSync(inputVideoPath)) fs.unlinkSync(inputVideoPath);
if (fs.existsSync(outputVideoPath)) fs.unlinkSync(outputVideoPath);

// Générer une vidéo avec du bruit réel haute fréquence pour forcer la taille à atteindre ~190-200 Mo
console.log('1. Création d\'une vidéo haute densité de ~195 Mo (40s)...');
const genStart = Date.now();
// 1920x1080 avec filtre bruit dynamique pour empêcher la compression triviale
const genCmd = `"${ffmpegBin}" -f lavfi -i "nullsrc=s=1920x1080:d=30:r=30,noise=alls=80:allf=t+u" -f lavfi -i "sine=frequency=440:duration=30" -c:v libx264 -preset ultrafast -b:v 50M -minrate 45M -maxrate 55M -bufsize 80M -c:a aac -b:a 192k -y "${inputVideoPath}"`;

execSync(genCmd, { stdio: 'pipe' });
const genDuration = ((Date.now() - genStart) / 1000).toFixed(1);

const statsIn = fs.statSync(inputVideoPath);
const sizeInMB = (statsIn.size / (1024 * 1024)).toFixed(2);
console.log(`-> Fichier source créé en ${genDuration}s : ${sizeInMB} Mo (${statsIn.size} octets)`);

// 2. Tester compressVideoTo480p
console.log('\n2. Encodage avec la commande officielle 480p FastStart...');
const encodeStart = Date.now();
const compressCmd = `"${ffmpegBin}" -i "${inputVideoPath}" -vf "scale='min(480,iw)':-2" -c:v libx264 -crf 23 -preset faster -maxrate 1200k -bufsize 2400k -c:a aac -b:a 128k -movflags +faststart -y "${outputVideoPath}"`;

execSync(compressCmd, { stdio: 'inherit' });
const encodeDuration = ((Date.now() - encodeStart) / 1000).toFixed(2);

const statsOut = fs.statSync(outputVideoPath);
const sizeOutMB = (statsOut.size / (1024 * 1024)).toFixed(2);
const savingsPercent = (((statsIn.size - statsOut.size) / statsIn.size) * 100).toFixed(1);

// 3. Vérification du Moov Atom (FastStart)
const buffer = Buffer.alloc(4096);
const fd = fs.openSync(outputVideoPath, 'r');
fs.readSync(fd, buffer, 0, 4096, 0);
fs.closeSync(fd);
const isFastStart = buffer.includes('moov');

console.log('\n================ RÉSULTATS DU BENCHMARK ================');
console.log(`- Taille vidéo d'origine (limite client) : ${sizeInMB} Mo`);
console.log(`- Taille finale vidéo 480p               : ${sizeOutMB} Mo`);
console.log(`- Économie de poids / bande passante     : -${savingsPercent} %`);
console.log(`- Durée totale de l'encodage             : ${encodeDuration} secondes`);
console.log(`- FastStart (lecture instantanée)        : ${isFastStart ? 'OUI (moov atom en début de fichier)' : 'NON'}`);
console.log('========================================================\n');

fs.unlinkSync(inputVideoPath);
fs.unlinkSync(outputVideoPath);
console.log('Fichiers de test nettoyés.');
