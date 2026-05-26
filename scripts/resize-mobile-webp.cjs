const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Disable sharp cache to prevent EBUSY/file locking errors on Windows
sharp.cache(false);

const MOBILE_DIR = path.join(__dirname, '../public/Donemobile');

async function run() {
  if (!fs.existsSync(MOBILE_DIR)) {
    console.error(`Mobile directory not found at ${MOBILE_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(MOBILE_DIR).filter(f => f.toLowerCase().endsWith('.webp'));
  console.log(`Found ${files.length} WebP files in Donemobile. Checking dimensions and downscaling if needed...`);

  let processedCount = 0;
  let skippedCount = 0;

  // Process sequentially to be extremely safe with file system locks on Windows
  for (const file of files) {
    const filePath = path.join(MOBILE_DIR, file);
    const tempPath = filePath + '.temp.webp';

    try {
      const metadata = await sharp(filePath).metadata();
      
      // Only downscale if the width is greater than 540 (e.g. original 1080x1920)
      if (metadata.width > 540) {
        await sharp(filePath)
          .resize(540, 960)
          .webp({ quality: 75 })
          .toFile(tempPath);

        // Safely replace original
        fs.unlinkSync(filePath);
        fs.renameSync(tempPath, filePath);
        processedCount++;
      } else {
        skippedCount++;
      }
    } catch (e) {
      console.error(`Error processing ${file}:`, e.message);
      if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch (_) {}
      }
    }
  }

  console.log(`\n=== Resize Summary ===`);
  console.log(`Total files checked: ${files.length}`);
  console.log(`Files downscaled: ${processedCount}`);
  console.log(`Files already optimized: ${skippedCount}`);
}

run().catch(err => {
  console.error('Fatal error during resizing:', err);
  process.exit(1);
});
