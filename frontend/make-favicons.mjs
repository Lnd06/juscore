import sharp from "sharp";
import fs from "fs";

async function makeFavicons() {
  const svgBuffer = fs.readFileSync("./public/favicon.svg");

  // Custom transparent background PNG, let's create it 64x64
  await sharp(svgBuffer).resize(64, 64).png().toFile("./public/icone.png");

  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile("./public/icone-192.png");

  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile("./public/icone-512.png");

  console.log("PNG icons generated!");
}

makeFavicons();
