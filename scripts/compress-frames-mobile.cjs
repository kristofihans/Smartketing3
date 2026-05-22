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
  console.log(`Found ${jpgFiles.length} JPG frames to resize and compress for mobile.`);

  // Process in batches of 15
  const batchSize = 15;
  for (let i = 0; i < jpgFiles.length; i += batchSize) {
    const batch = jpgFiles.slice(i, i + batchSize);
    await Promise.all(batch.map(file => {
      const inputPath = path.join(inputDir, file);
      const outputName = file.replace(/\.jpg$/, '.webp');
      const outputPath = path.join(outputDir, outputName);
      
      return sharp(inputPath)
        .resize({ width: 1920 }) // Downscale to 1080p (1920x1080) to significantly boost mobile decoding speed
        .webp({ quality: 75 }) // Save as WebP at quality 75 for optimal visual fidelity
        .toFile(outputPath)
        .catch(e => {
          console.error(`Error compressing ${file}:`, e);
        });
    }));
    console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(jpgFiles.length / batchSize)}`);
  }
  console.log('All frames scaled and compressed for mobile successfully!');
});
