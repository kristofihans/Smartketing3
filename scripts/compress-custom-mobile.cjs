const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const mobileDir = path.join(__dirname, '../public/final_mobile');

fs.readdir(mobileDir, async (err, files) => {
  if (err) {
    console.error('Error reading mobile directory:', err);
    process.exit(1);
  }

  const jpgFiles = files.filter(f => f.endsWith('.jpg'));
  console.log(`Found ${jpgFiles.length} custom mobile JPG frames to compress to WebP.`);

  // Process in batches of 15
  const batchSize = 15;
  for (let i = 0; i < jpgFiles.length; i += batchSize) {
    const batch = jpgFiles.slice(i, i + batchSize);
    await Promise.all(batch.map(async (file) => {
      const inputPath = path.join(mobileDir, file);
      const outputName = file.replace(/\.jpg$/, '.webp');
      const outputPath = path.join(mobileDir, outputName);
      
      try {
        await sharp(inputPath)
          .webp({ quality: 80 }) // High quality WebP conversion (maintains crisp details)
          .toFile(outputPath);
        
        // Delete the original JPG after successful WebP generation
        fs.unlinkSync(inputPath);
      } catch (e) {
        console.error(`Error processing ${file}:`, e);
      }
    }));
    console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(jpgFiles.length / batchSize)}`);
  }
  console.log('All custom mobile frames successfully compressed to WebP!');
});
