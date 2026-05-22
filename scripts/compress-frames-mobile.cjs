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

  const jpgFiles = files.filter(f => f.endsWith('.jpg'));
  console.log(`Found ${jpgFiles.length} JPG frames to compress for mobile.`);

  // Process in batches of 10 to avoid excessive memory usage at 4K resolution
  const batchSize = 10;
  for (let i = 0; i < jpgFiles.length; i += batchSize) {
    const batch = jpgFiles.slice(i, i + batchSize);
    await Promise.all(batch.map(file => {
      const inputPath = path.join(inputDir, file);
      // Output as .webp with same base name but new extension
      const outputName = file.replace(/\.jpg$/, '.webp');
      const outputPath = path.join(outputDir, outputName);
      
      return sharp(inputPath)
        .webp({ quality: 65 }) // Compress to WebP at quality 65 to keep size low but preserve details
        .toFile(outputPath)
        .catch(e => {
          console.error(`Error compressing ${file}:`, e);
        });
    }));
    console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(jpgFiles.length / batchSize)}`);
  }
  console.log('All frames compressed for mobile successfully!');
});
