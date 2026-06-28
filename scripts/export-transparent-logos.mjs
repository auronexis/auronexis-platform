/**
 * Strip baked dark backgrounds and build light/dark surface variants.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const BRANDING_DIR = path.resolve("public/branding");
const LUMINANCE_THRESHOLD = 42;
const NAVY = { r: 10, g: 22, b: 40 };

async function loadRgba(inputName) {
  const inputPath = path.join(BRANDING_DIR, inputName);
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { pixels: Buffer.from(data), info };
}

function stripDarkBackground(pixels) {
  for (let i = 0; i < pixels.length; i += 4) {
    const maxChannel = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]);
    if (maxChannel <= LUMINANCE_THRESHOLD) {
      pixels[i + 3] = 0;
    }
  }
}

/** White wordmark pixels on the right half → navy for light surfaces. */
function recolorWordmarkForLightBackground(pixels, width, height) {
  const wordmarkStartX = Math.floor(width * 0.28);
  for (let y = 0; y < height; y += 1) {
    for (let x = wordmarkStartX; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      if (a === 0) continue;
      if (r > 210 && g > 210 && b > 210) {
        pixels[i] = NAVY.r;
        pixels[i + 1] = NAVY.g;
        pixels[i + 2] = NAVY.b;
      }
    }
  }
}

async function writePng(pixels, info, outputName) {
  const outputPath = path.join(BRANDING_DIR, outputName);
  await sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);
  console.log(`✓ ${outputName} (${info.width}×${info.height})`);
}

async function exportComposite(inputName, outputName) {
  const { pixels, info } = await loadRgba(inputName);
  stripDarkBackground(pixels);
  await writePng(pixels, info, outputName);
  return { pixels, info };
}

const { pixels, info } = await exportComposite("logo-horizontal.png", "logo-horizontal-transparent.png");

const lightPixels = Buffer.from(pixels);
recolorWordmarkForLightBackground(lightPixels, info.width, info.height);
await writePng(lightPixels, info, "logo-horizontal-on-light.png");

await exportComposite("logo-light.png", "logo-light-transparent.png");
await exportComposite("logo-dark.png", "logo-dark-transparent.png");
await exportComposite("icon-512.png", "icon-512-transparent.png");
