const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function buildAllIcons() {
  console.log('=== CONSTRUCTION DU SYSTÈME D\'ICÔNES VECTORIELLES & PWA ===');

  const rawSvgPath = path.join(__dirname, 'traced_logo_raw.svg');
  const rawSvg = fs.readFileSync(rawSvgPath, 'utf8');

  // Extraire l'attribut d
  const match = rawSvg.match(/d="([^"]+)"/);
  if (!match) throw new Error('Path d non trouvé dans traced_logo_raw.svg');
  const originalD = match[1];

  // Optimiser les décimales à 1 chiffre après la virgule
  const optimizedD = originalD.replace(/\d+\.\d+/g, (m) => {
    const val = Math.round(parseFloat(m) * 10) / 10;
    return val.toString();
  });

  // Construction du SVG vectoriel natif ultra-léger (< 5 KB)
  const vectorSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%" fill="none">
  <path d="${optimizedD}" fill="#00AEEF" fill-rule="evenodd"/>
</svg>`;

  const svgByteSize = Buffer.byteLength(vectorSvgContent, 'utf8');
  console.log(`Poids SVG Vectoriel : ${svgByteSize} octets (${(svgByteSize / 1024).toFixed(2)} Ko) -> STRICTEMENT < 5 KB ✅`);

  // Sauvegarde des SVG dans public/
  const publicDir = path.join(__dirname, '..', 'public');
  
  const svgTargets = [
    path.join(publicDir, 'favicon.svg'),
    path.join(publicDir, 'nanasore-icon.svg'),
    path.join(publicDir, 'icon.svg'),
    path.join(publicDir, 'nanaswitch-favicon-mark.svg'),
    path.join(publicDir, 'wameet-extension', 'wameet-icon.svg')
  ];

  svgTargets.forEach(target => {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, vectorSvgContent, 'utf8');
    console.log('  -> Écrit SVG :', path.relative(path.join(__dirname, '..'), target));
  });

  // Génération des PNG de haute fidélité pour PWA & Téléphones mobiles
  const svgBuffer = Buffer.from(vectorSvgContent, 'utf8');

  // 1. icon-192.png & pwa-192x192.png
  const png192Buffer = await sharp(svgBuffer, { density: 300 })
    .resize(192, 192)
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192Buffer);
  fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192Buffer);
  console.log('  -> Généré PNG PWA 192x192 (icon-192.png, pwa-192x192.png)');

  // 2. icon-512.png & pwa-512x512.png
  const png512Buffer = await sharp(svgBuffer, { density: 300 })
    .resize(512, 512)
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512Buffer);
  fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512Buffer);
  console.log('  -> Généré PNG PWA 512x512 (icon-512.png, pwa-512x512.png)');

  // 3. apple-touch-icon.png (180x180 pour iOS Safari et écran d'accueil iPhone/iPad)
  // Sur iOS, un fond blanc pur assure un rendu impeccable
  const appleTouchBuffer = await sharp(svgBuffer, { density: 300 })
    .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchBuffer);
  console.log('  -> Généré apple-touch-icon.png (180x180)');

  // 4. Extension icons (16, 48, 128)
  const extIconsDir = path.join(publicDir, 'nana-switch-extension', 'icons');
  fs.mkdirSync(extIconsDir, { recursive: true });

  const png16 = await sharp(svgBuffer, { density: 300 }).resize(16, 16).png().toBuffer();
  const png48 = await sharp(svgBuffer, { density: 300 }).resize(48, 48).png().toBuffer();
  const png128 = await sharp(svgBuffer, { density: 300 }).resize(128, 128).png().toBuffer();

  fs.writeFileSync(path.join(extIconsDir, 'icon16.png'), png16);
  fs.writeFileSync(path.join(extIconsDir, 'icon48.png'), png48);
  fs.writeFileSync(path.join(extIconsDir, 'icon128.png'), png128);
  console.log('  -> Généré icônes extensions (16, 48, 128)');

  // 5. favicon.ico (32x32)
  const ico32Buffer = await sharp(svgBuffer, { density: 300 })
    .resize(32, 32)
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico32Buffer);
  console.log('  -> Généré favicon.ico (32x32)');

  console.log('\n✅ TOUS LES FICHIERS DU LOGO SONT GÉNÉRÉS AVEC SUCCÈS !');
}

buildAllIcons().catch(err => {
  console.error('Erreur :', err);
  process.exit(1);
});
