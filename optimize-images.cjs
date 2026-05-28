const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(__dirname, 'public');
const FRAMES_DIR = path.join(PUBLIC_DIR, 'final');

async function optimizeImage(filePath, options = {}) {
  const ext = path.extname(filePath);
  const dir = path.dirname(filePath);
  const base = path.basename(filePath, ext);
  const outPath = path.join(dir, `${base}.webp`);

  if (!fs.existsSync(filePath)) {
    console.log(`Skipping (file not found): ${filePath}`);
    return;
  }

  const originalSize = fs.statSync(filePath).size;
  let pipeline = sharp(filePath);

  if (options.width) {
    pipeline = pipeline.resize(options.width);
  }

  await pipeline
    .webp({ quality: options.quality || 80 })
    .toFile(outPath);

  const compressedSize = fs.statSync(outPath).size;
  const savings = ((originalSize - compressedSize) / 1024 / 1024).toFixed(2);
  console.log(`Optimized ${base}${ext} -> ${base}.webp:`);
  console.log(`  Size: ${(originalSize / 1024 / 1024).toFixed(2)} MB -> ${(compressedSize / 1024 / 1024).toFixed(2)} MB (Saved ${savings} MB)`);

  // Remove the original file
  fs.unlinkSync(filePath);
}

async function run() {
  console.log('--- Starting Image Optimization (Option 1) ---');
  let totalOriginal = 0;
  let totalCompressed = 0;

  // 1. Optimize large product images and web previews
  const mainImages = [
    { name: 'productimage1.jpg', width: 1920, quality: 80 },
    { name: 'productimage2.jpg', width: 1920, quality: 80 },
    { name: 'productimage3.jpg', width: 1920, quality: 80 },
    { name: 'web1.png', width: 1920, quality: 80 },
    { name: 'web2.png', width: 1920, quality: 80 },
    { name: 'logo.png', width: null, quality: 90 }, // Higher quality for logo
    { name: 'portfolio_bg.jpg', width: null, quality: 80 },
    { name: 'heroposter.jpg', width: null, quality: 80 },
  ];

  for (const img of mainImages) {
    const fullPath = path.join(PUBLIC_DIR, img.name);
    if (fs.existsSync(fullPath)) {
      totalOriginal += fs.statSync(fullPath).size;
      await optimizeImage(fullPath, img);
      const webpPath = fullPath.replace(/\.(jpg|png)$/, '.webp');
      totalCompressed += fs.statSync(webpPath).size;
    }
  }

  // 2. Optimize canvas frames in huh/ and huhmobile/
  const folders = ['huh', 'huhmobile'];
  for (const folder of folders) {
    const dirPath = path.join(PUBLIC_DIR, folder);
    if (fs.existsSync(dirPath)) {
      console.log(`\nOptimizing canvas animation frames in ${folder}...`);
      const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.jpg'));
      console.log(`Found ${files.length} frames to process in ${folder}.`);

      let frameCount = 0;
      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        totalOriginal += fs.statSync(fullPath).size;
        
        // Convert to webp with quality 80
        await optimizeImage(fullPath, { quality: 80 });
        
        const webpPath = fullPath.replace(/\.jpg$/, '.webp');
        totalCompressed += fs.statSync(webpPath).size;
        
        frameCount++;
        if (frameCount % 50 === 0 || frameCount === files.length) {
          console.log(`Processed ${frameCount}/${files.length} frames in ${folder}...`);
        }
      }
    }
  }

  const totalSaved = ((totalOriginal - totalCompressed) / 1024 / 1024).toFixed(2);
  console.log('\n--- Optimization Summary ---');
  console.log(`Total Original Size: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total Compressed Size: ${(totalCompressed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total Bytes Saved: ${totalSaved} MB (${((totalOriginal - totalCompressed) / totalOriginal * 100).toFixed(1)}% reduction)`);
}

run().catch(err => {
  console.error('Error during image optimization:', err);
  process.exit(1);
});
