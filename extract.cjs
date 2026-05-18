const ffmpeg = require('ffmpeg-static');
const { execSync } = require('child_process');
try {
  execSync(`"${ffmpeg}" -i public/herobackgroundvideo.mp4 -vframes 1 -q:v 2 public/heroposter.jpg`);
  console.log("Extracted frame successfully.");
} catch (e) {
  console.error("Error:", e.message);
}
