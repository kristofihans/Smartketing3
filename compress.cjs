const ffmpeg = require('ffmpeg-static');
const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log("Compressing video...");
  execSync(`"${ffmpeg}" -i public/herobackgroundvideo.mp4 -vf scale=1920:-2 -vcodec libx264 -crf 28 public/herobackgroundvideo_compressed.mp4 -y`);
  
  const originalStats = fs.statSync('public/herobackgroundvideo.mp4');
  const compressedStats = fs.statSync('public/herobackgroundvideo_compressed.mp4');
  
  console.log(`Original size: ${(originalStats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Compressed size: ${(compressedStats.size / 1024 / 1024).toFixed(2)} MB`);
  
  // Replace the original file
  fs.renameSync('public/herobackgroundvideo_compressed.mp4', 'public/herobackgroundvideo.mp4');
  console.log("Replaced original video with the compressed version.");
} catch (e) {
  console.error("Error:", e.message);
}
