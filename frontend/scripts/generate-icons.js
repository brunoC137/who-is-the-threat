// PWA Icon Generation Script
const sharp = require('sharp');
const path = require('path');

async function generateIcons() {
  console.log('='.repeat(60));
  console.log('PWA Icon Generator');
  console.log('='.repeat(60));
  console.log('');

  const svgPath = path.join(__dirname, '../public/icon.svg');
  const sizes = [192, 512];

  console.log('Converting SVG to PNG...');
  console.log('');

  for (const size of sizes) {
    const outputPath = path.join(__dirname, `../public/icon-${size}.png`);
    
    try {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Created: icon-${size}.png (${size}x${size})`);
    } catch (err) {
      console.error(`✗ Failed to create icon-${size}.png:`, err.message);
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('Icons generated successfully!');
  console.log('Deploy these changes to enable PWA installation.');
  console.log('='.repeat(60));
}

generateIcons().catch(console.error);
