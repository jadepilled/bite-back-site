import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { writePsdBuffer, readPsd } from 'ag-psd';
import sharp from 'sharp';

const outDir = path.join(process.cwd(), 'public', 'templates');
const outPath = path.join(outDir, 'bite-back-campaign-image-template.psd');
const width = 1600;
const height = 1000;

function rgba(r, g, b, a = 255) {
  return { r, g, b, a };
}

function units(value) {
  return { units: 'Pixels', value };
}

function textLayer(name, text, left, top, right, bottom, size, color, font = 'Whyte Black') {
  return {
    name,
    left,
    top,
    right,
    bottom,
    text: {
      text,
      left,
      top,
      right,
      bottom,
      shapeType: 'box',
      boxBounds: [top, left, bottom, right],
      bounds: {
        top: units(top),
        left: units(left),
        right: units(right),
        bottom: units(bottom)
      },
      style: {
        font: { name: font },
        fontSize: size,
        fauxBold: font.includes('Black') || font.includes('Bold'),
        fillColor: color,
        tracking: 40
      },
      paragraphStyle: {
        justification: 'left'
      }
    }
  };
}

async function imageDataFromSvg(svg) {
  const { data, info } = await sharp(Buffer.from(svg)).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  return {
    width: info.width,
    height: info.height,
    data: new Uint8ClampedArray(data)
  };
}

const backgroundSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#030303"/>
  <g opacity="0.18" fill="none" stroke="#ffffff" stroke-width="3">
    <rect x="86" y="78" width="1428" height="844"/>
    <rect x="118" y="112" width="1364" height="776"/>
  </g>
  <g opacity="0.14" stroke="#ffffff" stroke-width="2">
    <path d="M122 190 H1490" stroke-dasharray="18 22"/>
    <path d="M122 785 H1490" stroke-dasharray="18 22"/>
    <path d="M242 120 V880" stroke-dasharray="18 22"/>
    <path d="M1358 120 V880" stroke-dasharray="18 22"/>
  </g>
  <g opacity="0.28" fill="#d71920">
    <rect x="121" y="602" width="360" height="16"/>
    <rect x="1118" y="602" width="210" height="16"/>
  </g>
</svg>`;

const arrowSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <path d="M750 462 H1038 M1008 402 L1086 462 L1008 522" fill="none" stroke="#d71920" stroke-width="28" stroke-linecap="square" stroke-linejoin="miter"/>
</svg>`;

const silhouetteSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <g opacity="0.70" fill="#ffffff">
    <path d="M168 720 c46 -36 100 -45 155 -27 l42 -48 16 52 c39 16 63 43 72 80 h-56 c-18 -23 -41 -36 -70 -39 l-64 39 h-95 z"/>
    <path d="M578 750 c26 -62 85 -92 178 -92 82 0 141 24 177 72 14 19 22 39 24 59 h-64 c-16 -37 -57 -55 -123 -55 -60 0 -100 18 -120 55 h-82 c0 -13 3 -26 10 -39 z"/>
    <path d="M1130 772 c18 -55 65 -91 139 -108 26 -6 52 -8 78 -7 19 -34 43 -57 72 -69 l10 72 c32 18 52 43 60 76 h-54 c-22 -29 -54 -43 -96 -43 -52 0 -94 15 -126 44 -14 13 -25 25 -32 35 h-51 z"/>
  </g>
</svg>`;

await mkdir(outDir, { recursive: true });

const psd = {
  width,
  height,
  children: [
    {
      name: 'Background grid and red rules',
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      imageData: await imageDataFromSvg(backgroundSvg)
    },
    {
      name: 'Animal silhouettes raster',
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      imageData: await imageDataFromSvg(silhouetteSvg)
    },
    {
      name: 'Editable text',
      children: [
        textLayer('Top strapline - editable', "WRITE 1080 OUT OF AUSTRALIA'S ANIMAL WELFARE FUTURE", 130, 116, 1400, 168, 36, rgba(255, 255, 255), 'Whyte Bold'),
        textLayer('Main number - editable', '1080', 120, 332, 760, 590, 250, rgba(255, 255, 255), 'Whyte Black'),
        textLayer('Final zero - editable', '0', 1110, 332, 1330, 590, 250, rgba(215, 25, 32), 'Whyte Black'),
        textLayer('Footer line - editable', 'AAWS 2027 / ENDPOINT 2030 / FUND THE TRANSITION', 130, 820, 1120, 870, 30, rgba(215, 25, 32), 'Whyte Bold')
      ]
    },
    {
      name: 'Red arrow raster',
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      imageData: await imageDataFromSvg(arrowSvg)
    }
  ],
  imageResources: {
    resolutionInfo: {
      horizontalResolution: 72,
      horizontalResolutionUnit: 'PPI',
      widthUnit: 'inches',
      verticalResolution: 72,
      verticalResolutionUnit: 'PPI',
      heightUnit: 'inches'
    }
  }
};

const buffer = writePsdBuffer(psd);
await writeFile(outPath, buffer);

const roundTrip = readPsd(buffer, { skipCompositeImageData: true, skipLayerImageData: true });
const textLayers = [];
function collect(layer) {
  if (layer.text) textLayers.push(layer.name);
  layer.children?.forEach(collect);
}
roundTrip.children?.forEach(collect);
console.log(`Wrote ${outPath}`);
console.log(`Editable text layers: ${textLayers.join(', ')}`);
