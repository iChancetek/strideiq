// Generate PWA PNG icons from icon.svg using sharp
import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "..", "public");
const svgBuffer = readFileSync(resolve(publicDir, "icon.svg"));

const sizes = [192, 512];

for (const size of sizes) {
    await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(resolve(publicDir, `icon-${size}x${size}.png`));
    console.log(`✓ Generated icon-${size}x${size}.png`);
}

// Also generate apple-touch-icon (180x180)
await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(resolve(publicDir, "apple-touch-icon.png"));
console.log("✓ Generated apple-touch-icon.png");

console.log("Done!");
