import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// Minimal PNG generator using standard node:zlib
function createPng(width, height, getPixelRgba) {
  // RGBA buffer: height rows, each row has 1 filter byte (0) + width * 4 bytes
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixelRgba(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // Helper to write a chunk
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = crc32(typeAndData);

    const crcBuf = Buffer.alloc(4);
    crcBuf.writeInt32BE(crc, 0);

    return Buffer.concat([len, typeAndData, crcBuf]);
  }

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC-32 table generator
function crc32(buf) {
  let table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) | 0;
}

// Generate icon pixel: blue background (#1a73e8), rounded square, with a white 'POS' cash-box emblem
function getPosIconPixel(x, y, w, h) {
  const normX = x / w;
  const normY = y / h;

  // Background: #1a73e8 (r: 26, g: 115, b: 232)
  const bgR = 26;
  const bgG = 115;
  const bgB = 232;

  // Center symbol bounds
  const cx = 0.5;
  const cy = 0.5;
  const dx = normX - cx;
  const dy = normY - cy;

  // Outer circle / rounded box check for emblem
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Bag / Box emblem in center
  const inBagBody = normX >= 0.28 && normX <= 0.72 && normY >= 0.38 && normY <= 0.76;
  const inBagHandle = (normX >= 0.38 && normX <= 0.62 && normY >= 0.22 && normY <= 0.38 &&
                      !(normX >= 0.44 && normX <= 0.56 && normY >= 0.28 && normY <= 0.38));
  
  // Cross / Check / Dollar bar in center
  const inAccent = (normX >= 0.46 && normX <= 0.54 && normY >= 0.46 && normY <= 0.66) ||
                   (normX >= 0.38 && normX <= 0.62 && normY >= 0.53 && normY <= 0.59);

  if (inBagHandle) {
    return [255, 255, 255, 255];
  }

  if (inBagBody) {
    if (inAccent) {
      return [26, 115, 232, 255]; // blue cutout
    }
    return [255, 255, 255, 255]; // white bag
  }

  // Gradient shimmer on background
  const shimmer = Math.floor((1 - dist) * 20);
  return [
    Math.min(255, bgR + shimmer),
    Math.min(255, bgG + shimmer),
    Math.min(255, bgB + shimmer),
    255
  ];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate 192x192
const png192 = createPng(192, 192, getPosIconPixel);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

// 2. Generate 512x512
const png512 = createPng(512, 512, getPosIconPixel);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

// 3. Apple Touch Icon 180x180
const pngApple = createPng(180, 180, getPosIconPixel);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple);

// 4. SVG Icon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#1a73e8"/>
  <!-- Bag Handle -->
  <path d="M192 192 C 192 128, 320 128, 320 192" fill="none" stroke="#ffffff" stroke-width="32" stroke-linecap="round"/>
  <!-- Bag Body -->
  <rect x="144" y="192" width="224" height="192" rx="28" fill="#ffffff"/>
  <!-- Center symbol -->
  <circle cx="256" cy="288" r="44" fill="#1a73e8"/>
  <path d="M256 264 L256 312 M240 288 L272 288" stroke="#ffffff" stroke-width="12" stroke-linecap="round"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg);

console.log('Icons generated successfully: pwa-192x192.png, pwa-512x512.png, apple-touch-icon.png, icon.svg');
