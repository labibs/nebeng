import sharp from "sharp";

const sizes = [64, 192, 256, 384, 512];

for (const size of sizes) {
  await sharp("public/logo.svg")
    .resize(size, size)
    .toFile(`public/pwa-${size}x${size}.png`);
  console.log(`✅ Generated ${size}x${size}`);
}

console.log("🎉 Semua icon berhasil dibuat!");
