import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const input = path.join(root, 'bite_back_logo.png');
const outDir = path.join(root, 'public', 'brand');
const publicDir = path.join(root, 'public');
const threshold = 92;
const marginRatio = 0.12;

function icoFromPngs(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  const directories = [];
  const images = [];
  let offset = 6 + entries.length * 16;

  for (const entry of entries) {
    const directory = Buffer.alloc(16);
    directory.writeUInt8(entry.size === 256 ? 0 : entry.size, 0);
    directory.writeUInt8(entry.size === 256 ? 0 : entry.size, 1);
    directory.writeUInt8(0, 2);
    directory.writeUInt8(0, 3);
    directory.writeUInt16LE(1, 4);
    directory.writeUInt16LE(32, 6);
    directory.writeUInt32LE(entry.buffer.length, 8);
    directory.writeUInt32LE(offset, 12);
    directories.push(directory);
    images.push(entry.buffer);
    offset += entry.buffer.length;
  }

  return Buffer.concat([header, ...directories, ...images]);
}

function boxedForeground(raw, width, height, channels) {
  let left = width;
  let top = height;
  let right = 0;
  let bottom = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * channels;
      const alpha = channels === 4 ? raw[index + 3] : 255;
      const luminance = (raw[index] + raw[index + 1] + raw[index + 2]) / 3;
      if (alpha > 8 && luminance >= threshold) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }

  if (left > right || top > bottom) {
    throw new Error('No light foreground pixels found in bite_back_logo.png');
  }

  const widthBox = right - left + 1;
  const heightBox = bottom - top + 1;
  const side = Math.ceil(Math.max(widthBox, heightBox) * (1 + marginRatio));
  const centerX = left + widthBox / 2;
  const centerY = top + heightBox / 2;

  return {
    left: Math.max(0, Math.round(centerX - side / 2)),
    top: Math.max(0, Math.round(centerY - side / 2)),
    side: Math.min(side, width, height)
  };
}

async function createMask() {
  const source = sharp(input).ensureAlpha();
  const { data, info } = await source.raw().toBuffer({ resolveWithObject: true });
  const box = boxedForeground(data, info.width, info.height, info.channels);

  const cropped = await sharp(input)
    .ensureAlpha()
    .extract({ left: box.left, top: box.top, width: box.side, height: box.side })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = cropped.data;
  const rgba = Buffer.alloc(cropped.info.width * cropped.info.height * 4);

  for (let i = 0; i < cropped.info.width * cropped.info.height; i += 1) {
    const sourceIndex = i * cropped.info.channels;
    const targetIndex = i * 4;
    const alpha = cropped.info.channels === 4 ? pixels[sourceIndex + 3] : 255;
    const luminance = (pixels[sourceIndex] + pixels[sourceIndex + 1] + pixels[sourceIndex + 2]) / 3;
    const foreground = alpha > 8 && luminance >= threshold;

    rgba[targetIndex] = 255;
    rgba[targetIndex + 1] = 255;
    rgba[targetIndex + 2] = 255;
    rgba[targetIndex + 3] = foreground ? 255 : 0;
  }

  return sharp(rgba, {
    raw: {
      width: cropped.info.width,
      height: cropped.info.height,
      channels: 4
    }
  });
}

async function renderVariant(mask, size, variant) {
  const whiteMark = mask.clone().resize(size, size, { kernel: 'nearest', fit: 'contain' });

  if (variant === 'transparent') {
    return whiteMark.png().toBuffer();
  }

  if (variant === 'black') {
    return sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: '#000000ff'
      }
    })
      .composite([{ input: await whiteMark.png().toBuffer() }])
      .png()
      .toBuffer();
  }

  const blackMark = await whiteMark.negate({ alpha: false }).png().toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: '#ffffffff'
    }
  })
    .composite([{ input: blackMark }])
    .png()
    .toBuffer();
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const metadata = await sharp(input).metadata();
  const mask = await createMask();

  const sizes = [16, 32, 48, 64, 96, 180, 192, 512];
  for (const size of sizes) {
    for (const variant of ['transparent', 'black', 'white']) {
      const buffer = await renderVariant(mask, size, variant);
      await writeFile(path.join(outDir, `bite-mark-${variant}-${size}.png`), buffer);
    }
  }

  for (const variant of ['transparent', 'black', 'white']) {
    const buffer = await renderVariant(mask, 512, variant);
    await writeFile(path.join(outDir, `bite-mark-${variant}.png`), buffer);
  }

  await writeFile(path.join(publicDir, 'favicon-16x16.png'), await renderVariant(mask, 16, 'black'));
  await writeFile(path.join(publicDir, 'favicon-32x32.png'), await renderVariant(mask, 32, 'black'));
  await writeFile(path.join(publicDir, 'apple-touch-icon.png'), await renderVariant(mask, 180, 'black'));
  await writeFile(path.join(publicDir, 'icon-192.png'), await renderVariant(mask, 192, 'black'));
  await writeFile(path.join(publicDir, 'icon-512.png'), await renderVariant(mask, 512, 'black'));

  const svgPng = (await renderVariant(mask, 512, 'black')).toString('base64');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" shape-rendering="crispEdges"><image href="data:image/png;base64,${svgPng}" width="512" height="512"/></svg>\n`;
  await writeFile(path.join(publicDir, 'favicon.svg'), svg);

  const ico = icoFromPngs([
    { size: 16, buffer: await renderVariant(mask, 16, 'black') },
    { size: 32, buffer: await renderVariant(mask, 32, 'black') },
    { size: 48, buffer: await renderVariant(mask, 48, 'black') }
  ]);
  await writeFile(path.join(publicDir, 'favicon.ico'), ico);

  await writeFile(
    path.join(publicDir, 'site.webmanifest'),
    `${JSON.stringify(
      {
        name: 'Bite Back',
        short_name: 'Bite Back',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ],
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone'
      },
      null,
      2
    )}\n`
  );

  console.log(`Processed ${input} from ${metadata.width}x${metadata.height} into ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
