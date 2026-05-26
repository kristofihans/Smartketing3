const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(__dirname, '../public');
const DESKTOP_DIR = path.join(PUBLIC_DIR, 'Donedesktop');
const MOBILE_DIR = path.join(PUBLIC_DIR, 'Donemobile');

async function processDirectory(dirPath, name) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory ${name} not found at ${dirPath}, skipping.`);
    return;
  }

  const files = fs.readdirSync(dirPath).filter(f => f.toLowerCase().endsWith('.jpg'));
  console.log(`Found ${files.length} JPG files in ${name}. Starting conversion to WebP...`);

  const batchSize = 10;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    await Promise.all(batch.map(async (file) => {
      const inputPath = path.join(dirPath, file);
      const outputName = file.replace(/\.(jpg|jpeg)$/i, '.webp');
      const outputPath = path.join(dirPath, outputName);

      try {
        await sharp(inputPath)
          .webp({ quality: 80 }) // 80 quality WebP gives extreme size reduction with visual preservation
          .toFile(outputPath);

        // Delete the original JPG
        fs.unlinkSync(inputPath);
      } catch (e) {
        console.error(`Error converting ${file} in ${name}:`, e.message);
      }
    }));

    if ((i + batchSize) % 50 === 0 || (i + batchSize) >= files.length) {
      console.log(`  Processed ${Math.min(i + batchSize, files.length)}/${files.length} files in ${name}...`);
    }
  }

  console.log(`Finished WebP conversion for ${name}!\n`);
}

async function run() {
  console.log('=== Starting WebP Frame Conversion ===\n');
  await processDirectory(DESKTOP_DIR, 'Donedesktop');
  await processDirectory(MOBILE_DIR, 'Donemobile');
  console.log('=== All conversions complete! ===');
}

run().catch(err => {
  console.error('Fatal error during conversion:', err);
  process.exit(1);
});
