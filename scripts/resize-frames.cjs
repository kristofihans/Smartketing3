const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const inputDir = path.join(__dirname, '../public/final');
const outputDir = path.join(__dirname, '../public/final_mobile');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.readdir(inputDir, async (err, files) => {
  if (err) {
    console.error('Error reading input directory:', err);
    process.exit(1);
  }

  const webpFiles = files.filter(f => f.endsWith('.webp'));
  console.log(`Found ${webpFiles.length} frames to resize.`);

  // Process in batches of 15 to avoid excessive memory usage
  const batchSize = 15;
  for (let i = 0; i < webpFiles.length; i += batchSize) {
    const batch = webpFiles.slice(i, i + batchSize);
    await Promise.all(batch.map(file => {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, file);
      return sharp(inputPath)
        .resize({ width: 960 }) // auto height
        .webp({ quality: 75 })
        .toFile(outputPath)
        .catch(e => {
          console.error(`Error resizing ${file}:`, e);
        });
    }));
    console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(webpFiles.length / batchSize)}`);
  }
  console.log('All frames resized successfully!');
});
