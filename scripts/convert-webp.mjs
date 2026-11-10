import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'images');
const MAX_BYTES = 96 * 1024;

fs.mkdirSync(outDir, { recursive: true });

function collectHtmlFiles() {
  return fs
    .readdirSync(root)
    .filter((f) => f.endsWith('.html'))
    .map((f) => path.join(root, f));
}

function extractUnsplashUrls(html) {
  const re = /https:\/\/images\.unsplash\.com\/[^"'>\s]+/g;
  return html.match(re) || [];
}

function photoKey(url) {
  const u = new URL(url);
  const id = u.pathname.split('/').pop(); // photo-xxxxx
  const w = u.searchParams.get('w') || 'full';
  const h = u.searchParams.get('h') || '';
  return h ? `${id}-w${w}-h${h}` : `${id}-w${w}`;
}

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function toWebpUnderLimit(input, outPath, { maxWidth } = {}) {
  let quality = 82;
  let width = maxWidth || null;
  let lastBuf = null;

  for (let attempt = 0; attempt < 18; attempt++) {
    let pipeline = sharp(input, { failOn: 'none' }).rotate();
    if (width) pipeline = pipeline.resize({ width, withoutEnlargement: true });
    const buf = await pipeline.webp({ quality, effort: 6 }).toBuffer();
    lastBuf = buf;
    if (buf.length <= MAX_BYTES) {
      fs.writeFileSync(outPath, buf);
      return { bytes: buf.length, quality, width };
    }
    if (quality > 40) {
      quality -= 8;
    } else if (!width) {
      const meta = await sharp(input).metadata();
      width = Math.min(meta.width || 1600, 1400);
      quality = 75;
    } else {
      width = Math.max(480, Math.round(width * 0.85));
      quality = Math.max(35, quality - 2);
    }
  }

  fs.writeFileSync(outPath, lastBuf);
  return { bytes: lastBuf.length, quality, width, over: lastBuf.length > MAX_BYTES };
}

function replaceAll(str, find, replace) {
  return str.split(find).join(replace);
}

const htmlFiles = collectHtmlFiles();
const urlSet = new Map(); // key -> { url, maxW }

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  for (const url of extractUnsplashUrls(html)) {
    const key = photoKey(url);
    const u = new URL(url);
    const w = Number(u.searchParams.get('w')) || 1600;
    const prev = urlSet.get(key);
    if (!prev || w > prev.maxW) urlSet.set(key, { url, maxW: w });
  }
}

console.log(`Unique remote images: ${urlSet.size}`);

const urlToLocal = new Map();
let i = 0;
for (const [key, { url, maxW }] of urlSet) {
  i += 1;
  const fileName = `${key}.webp`;
  const outPath = path.join(outDir, fileName);
  const localRef = `images/${fileName}`;
  process.stdout.write(`[${i}/${urlSet.size}] ${fileName} ... `);
  try {
    const buf = await download(url);
    const targetW = Math.min(maxW, 1600);
    const result = await toWebpUnderLimit(buf, outPath, { maxWidth: targetW });
    const kb = (result.bytes / 1024).toFixed(1);
    console.log(`${kb}KB q=${result.quality}${result.over ? ' OVER!' : ''}`);
    urlToLocal.set(url, localRef);
  } catch (err) {
    console.log('FAIL', err.message);
  }
}

// Also map every original URL variant in HTML to the converted file of same key
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  for (const url of extractUnsplashUrls(html)) {
    const key = photoKey(url);
    const local = `images/${key}.webp`;
    if (fs.existsSync(path.join(outDir, `${key}.webp`))) {
      urlToLocal.set(url, local);
    }
  }
}

// Convert local logo PNG
const logoPng = path.join(outDir, 'stackly-green.png');
if (fs.existsSync(logoPng)) {
  const logoOut = path.join(outDir, 'stackly-green.webp');
  const result = await toWebpUnderLimit(fs.readFileSync(logoPng), logoOut);
  console.log(`logo stackly-green.webp ${(result.bytes / 1024).toFixed(1)}KB`);
}

// Rewrite HTML
for (const file of htmlFiles) {
  let html = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const [remote, local] of urlToLocal) {
    if (html.includes(remote)) {
      html = replaceAll(html, remote, local);
      changed = true;
    }
  }
  if (html.includes('images/stackly-green.png')) {
    html = replaceAll(html, 'images/stackly-green.png', 'images/stackly-green.webp');
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(file, html);
    console.log('updated', path.basename(file));
  }
}

// Report
const webps = fs.readdirSync(outDir).filter((f) => f.endsWith('.webp'));
const overs = [];
for (const f of webps) {
  const size = fs.statSync(path.join(outDir, f)).size;
  if (size > MAX_BYTES) overs.push({ f, size });
}
console.log(`\nDone. ${webps.length} webp files. Over 96KB: ${overs.length}`);
if (overs.length) console.log(overs);
