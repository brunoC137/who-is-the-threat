// PWA / favicon / social image generation.
//
// Sources:
//   public/icon.svg              vector master for every icon
//   assets/general-icon-1.png    painting, used for the social share card
//
// Run from frontend/:  node scripts/generate-icons.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '../public');
const ASSETS = path.join(__dirname, '../assets');

const NAVY = '#01102C';
const GOLD = '#F8B208';
const MUTED = '#8FA0C0';

// icon.svg has rounded corners and transparent outside them. Android maskable
// icons must instead bleed to the edges, because the launcher applies its own
// mask - so the maskable variant is the same emblem on a full-bleed square.
const maskableSvg = () =>
  Buffer.from(
    fs
      .readFileSync(path.join(PUBLIC, 'icon.svg'), 'utf8')
      .replace('<rect width="512" height="512" rx="79"', '<rect width="512" height="512"')
  );

// sharp has no .ico encoder. An .ico is a small directory followed by image
// payloads, and PNG payloads are valid, so assemble the container by hand.
function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(pngs.length, 4);

  let offset = 6 + pngs.length * 16;
  const entries = pngs.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // width  (0 means 256)
    e.writeUInt8(size >= 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // palette size
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });

  return Buffer.concat([header, ...entries, ...pngs.map(p => p.data)]);
}

async function socialCard() {
  const W = 1200, H = 630, ART = 540, M = 45;

  // The painting ships with its corners already rounded off to black. Re-cut
  // them as transparent so the navy shows through instead of a black square.
  const radius = Math.round(ART * 0.154);
  const corners = Buffer.from(
    `<svg width="${ART}" height="${ART}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect width="${ART}" height="${ART}" rx="${radius}" fill="#fff"/></svg>`
  );

  const art = await sharp(path.join(ASSETS, 'general-icon-1.png'))
    .resize(ART, ART)
    .composite([{ input: corners, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Only fonts installed on the machine running this script will resolve, so
  // stick to a family that is present by default rather than a webfont.
  const FONT = 'Georgia, serif';
  const textX = M + ART + 55;
  const canvas = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${NAVY}"/>
    <text x="${textX}" y="268" fill="#F2F5FA" font-family="${FONT}" font-size="52" font-weight="bold">Guerreiros do</text>
    <text x="${textX}" y="330" fill="#F2F5FA" font-family="${FONT}" font-size="52" font-weight="bold">Segundo Lugar</text>
    <rect x="${textX}" y="360" width="88" height="4" fill="${GOLD}"/>
    <text x="${textX}" y="412" fill="${MUTED}" font-family="${FONT}" font-size="27">Commander (EDH) game tracker</text>
  </svg>`);

  await sharp(canvas)
    .composite([{ input: art, left: M, top: (H - ART) / 2 }])
    .png()
    .toFile(path.join(PUBLIC, 'og-image.png'));

  console.log('  og-image.png              1200x630');
}

async function main() {
  const svg = path.join(PUBLIC, 'icon.svg');
  const render = (src, size) => sharp(src, { density: 512 }).resize(size, size).png();

  console.log('\nRounded icons (favicon + PWA "any")');
  for (const [name, size] of [
    ['favicon-16x16.png', 16],
    ['favicon-32x32.png', 32],
    ['icon-192.png', 192],
    ['icon-512.png', 512],
  ]) {
    await render(svg, size).toFile(path.join(PUBLIC, name));
    console.log(`  ${name.padEnd(25)} ${size}x${size}`);
  }

  console.log('\nFull-bleed icons (Android maskable + iOS)');
  const bleed = maskableSvg();
  for (const [name, size] of [
    ['icon-maskable-192.png', 192],
    ['icon-maskable-512.png', 512],
    ['apple-touch-icon.png', 180], // iOS applies its own mask, so no rounding here
  ]) {
    await render(bleed, size).toFile(path.join(PUBLIC, name));
    console.log(`  ${name.padEnd(25)} ${size}x${size}`);
  }

  console.log('\nfavicon.ico');
  const ico = [];
  for (const size of [16, 32, 48]) {
    ico.push({ size, data: await render(svg, size).toBuffer() });
  }
  fs.writeFileSync(path.join(PUBLIC, 'favicon.ico'), buildIco(ico));
  console.log('  favicon.ico               16 + 32 + 48');

  console.log('\nSocial share card');
  await socialCard();

  console.log('\nDone.\n');
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
