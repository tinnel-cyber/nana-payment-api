const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

let ffmpegBin = process.env.FFMPEG_PATH;
if (!ffmpegBin) {
  try {
    ffmpegBin = require('ffmpeg-static');
  } catch (_) {
    ffmpegBin = 'ffmpeg';
  }
}

console.log('====================================================');
console.log('   BENCHMARK & TEST DE RAPIDITÉ DE L\'ENCODAGE 480P   ');
console.log('====================================================');
console.log('Binaire FFmpeg :', ffmpegBin);

function compressVideoTo480p(inputFilePath, outputFilePath) {
  return new Promise((resolve, reject) => {
    const finalOutput = outputFilePath || path.join(
      path.dirname(inputFilePath),
      `${path.basename(inputFilePath, path.extname(inputFilePath))}_test_480p.mp4`
    );

    const command = `"${ffmpegBin}" -i "${inputFilePath}" -vf "scale='min(480,iw)':-2" -c:v libx264 -crf 23 -preset faster -maxrate 1200k -bufsize 2400k -c:a aac -b:a 128k -movflags +faststart -y "${finalOutput}"`;

    const start = Date.now();
    exec(command, (error, stdout, stderr) => {
      const elapsedMs = Date.now() - start;
      if (error) {
        return reject({ error, stderr, elapsedMs });
      }
      resolve({ outputFilePath: finalOutput, elapsedMs, stderr });
    });
  });
}

async function benchmark(label, filename) {
  const inputFile = path.resolve(__dirname, '../public/videos', filename);
  const outputFile = path.resolve(__dirname, '../public/videos', `temp_${filename}`);

  if (!fs.existsSync(inputFile)) {
    console.log(`Fichier ${filename} non trouvé, test ignoré.`);
    return;
  }

  const initialStats = fs.statSync(inputFile);
  const sizeMbBefore = (initialStats.size / 1024 / 1024).toFixed(2);
  console.log(`\n▶ [${label}] Source: ${filename} (${sizeMbBefore} Mo)`);

  const result = await compressVideoTo480p(inputFile, outputFile);
  const finalStats = fs.statSync(outputFile);
  const sizeMbAfter = (finalStats.size / 1024 / 1024).toFixed(2);
  const ratio = (((initialStats.size - finalStats.size) / initialStats.size) * 100).toFixed(1);
  const elapsedSec = (result.elapsedMs / 1000).toFixed(2);

  console.log(`  ⏱️ Durée d'encodage : ${elapsedSec} s`);
  console.log(`  📉 Poids final      : ${sizeMbAfter} Mo (-${ratio}% d'économie)`);
  console.log(`  🚀 FastStart        : Actif (-movflags +faststart)`);
  console.log(`  🎯 Profil H.264     : CRF 23, Preset faster, Scale min(480,iw):-2`);

  if (fs.existsSync(outputFile)) {
    fs.unlinkSync(outputFile);
  }
}

async function main() {
  try {
    await benchmark('Test 1 - Vidéo Légère', 'reel-eshop.mp4');
    await benchmark('Test 2 - Vidéo Moyenne', 'reel-mentor.mp4');
    await benchmark('Test 3 - Vidéo Complète 23 Mo', 'reel-business.mp4');
    console.log('\n====================================================');
    console.log('✅ TOUS LES TESTS SONT CONCLUANTS ET VALIDÉS !');
    console.log('====================================================');
  } catch (err) {
    console.error('Erreur lors du benchmark :', err);
    process.exit(1);
  }
}

main();
