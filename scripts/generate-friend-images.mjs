import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const outDir = path.join(process.cwd(), 'public', 'images', 'friends');

const friends = [
  ['coalition-against-1080-poison', 'Coalition Against 1080 Poison', '1080 phase-out', 'https://images.squarespace-cdn.com/content/v1/612ee136efc1241e1fcc567e/6147d324-c495-412a-ac99-a200635fb9b6/1080-homepage-logo-white.png'],
  ['australian-democracy-network', 'Australian Democracy Network', 'Democracy reform', 'https://raisely-images.imgix.net/australian-democracy-network/uploads/favicon-png-cf663d.png'],
  ['defend-the-wild', 'Defend The Wild', 'Wildlife advocacy', 'https://images.squarespace-cdn.com/content/v1/61650aeb5493ee36748270a5/c1b3809f-7441-4c95-ad81-9d2b5adc6c6b/Defend+the+Wild_Horizontal_Black.png?format=1500w'],
  ['alliance-for-animals', 'Australian Alliance for Animals', 'Law reform', 'https://images.squarespace-cdn.com/content/v1/61c2724e42bafd1109690e02/a4f42e94-613b-45b3-b87c-4f102c0c4730/AFA_Logo_COLOUR+AND+BLACK.png?format=1500w'],
  ['peta-australia', 'PETA Australia', 'Animal rights', ''],
  ['rspca-australia', 'RSPCA Australia', 'Animal welfare', 'https://www.rspca.org.au/_resources/themes/rspca/icons/logo.svg'],
  ['voiceless', 'Voiceless', 'Animal law education', 'https://voiceless.org.au/wp-content/uploads/logo.png'],
  ['animal-rights-rescue-group', 'Animal Rights & Rescue Group', 'Rescue and advocacy', 'https://animalrights.org.au/wp-content/uploads/2025/02/logopic-long-banner.png'],
  ['four-paws-australia', 'FOUR PAWS Australia', 'Global welfare', 'https://media.4-paws.org/1/f/4/4/1f441f9e573923ef15edf3818bd431579ab6ac72/four-paws-logo.svg'],
  ['humane-world-for-animals-australia', 'Humane World for Animals Australia', 'Wildlife and welfare', 'https://hsi.org.au/wp-content/uploads/2025/02/HWA-Favicon.png'],
  ['farm-transparency-project', 'Farm Transparency Project', 'Transparency', 'https://www.farmtransparency.org/images/logo-white.png'],
  ['animal-defenders-office', 'Animal Defenders Office', 'Animal law', 'https://static.wixstatic.com/media/a64856_fcd50faab7bf4535a6134a778d1922ce.jpg/v1/fill/w_192,h_192,lg_1,usm_0.66_1.00_0.01/a64856_fcd50faab7bf4535a6134a778d1922ce.jpg'],
  ['animal-free-science-advocacy', 'Animal-Free Science Advocacy', 'Research reform', 'https://animalfreescienceadvocacy.org.au/wp-content/uploads/2025/05/Favicon-AFSA-3-300x300.png'],
  ['sydney-fox-and-dingo-rescue', 'Sydney Fox and Dingo Rescue', 'Rescue', ''],
  ['wires', 'WIRES', 'Wildlife rescue', 'https://www.wires.org.au/hubfs/logo-1.svg'],
  ['australian-animal-protection', 'Australian Animal Protection Society', 'Animal sheltering', 'https://aaps.org.au/wp-content/uploads/2023/02/AAPS-Logo-Horizontal-Blue.png'],
  ['wildlife-victoria', 'Wildlife Victoria', 'Wildlife emergency response', 'https://wildlifevictoria.org.au/wp-content/themes/wildlife-victoria/assets/images/favicon.png'],
  ['wildlife-rescue-australia', 'Wildlife Rescue Australia', 'National rescue line', 'https://wildliferescue.net.au/wp-content/uploads/2024/09/logo.jpg'],
  ['wildlife-rescuers', 'The Wildlife Rescuers', 'Melbourne rescue', 'https://wildliferescuers.org.au/wp-content/uploads/2019/07/Logo-on-Transparent-Background-PNG-e1577496549761.png'],
  ['aware-wildlife', 'AWARE Wildlife Rescue', 'Wildlife rescue', 'https://www.awarewildlife.org.au/wp-content/uploads/2018/10/awareWebLogo2.png']
];

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fetchLogo(url) {
  if (!url) return '';
  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 BiteBackAssetBuilder/1.0'
      }
    });
    if (!response.ok) return '';
    const input = Buffer.from(await response.arrayBuffer());
    const png = await sharp(input, { animated: false }).resize(360, 150, { fit: 'inside', withoutEnlargement: true }).png().toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    return '';
  }
}

function wrapName(name) {
  if (name.length <= 20) return [name];
  const words = name.split(' ');
  const lines = [''];
  for (const word of words) {
    const current = lines[lines.length - 1];
    const next = current ? `${current} ${word}` : word;
    if (next.length > 20 && lines.length < 3) lines.push(word);
    else lines[lines.length - 1] = next;
  }
  return lines;
}

await mkdir(outDir, { recursive: true });

for (const [id, name, label, logoUrl] of friends) {
  const logo = await fetchLogo(logoUrl);
  const nameLines = wrapName(name);
  const titleLines = nameLines.map((line, index) => (
    `<text x="76" y="${328 + index * 62}" font-size="54" fill="#fff" font-family="Arial Black, Impact, sans-serif" font-weight="900">${escapeXml(line)}</text>`
  )).join('');
  const logoMarkup = logo
    ? `<rect x="76" y="96" width="424" height="156" fill="#fff"/><image href="${logo}" x="104" y="122" width="368" height="104" preserveAspectRatio="xMidYMid meet"/>`
    : `<text x="76" y="208" font-size="118" fill="#fff" font-family="Arial Black, Impact, sans-serif" font-weight="900">${escapeXml(name.split(' ').map((word) => word[0]).join('').slice(0, 6))}</text>`;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">
  <rect width="1200" height="720" fill="#030303"/>
  <g opacity="0.16" stroke="#fff" stroke-width="2" fill="none">
    <rect x="42" y="42" width="1116" height="636"/>
    <path d="M42 258 H1158 M42 548 H1158 M258 42 V678 M942 42 V678" stroke-dasharray="18 22"/>
  </g>
  <g opacity="0.32" fill="#d71920">
    <rect x="76" y="570" width="346" height="14"/>
    <rect x="776" y="104" width="290" height="14"/>
  </g>
  ${logoMarkup}
  <text x="76" y="292" font-size="22" fill="#d71920" font-family="Arial, Helvetica, sans-serif" font-weight="800" letter-spacing="3">${escapeXml(label.toUpperCase())}</text>
  ${titleLines}
  <text x="76" y="650" font-size="24" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-weight="700" letter-spacing="3">FRIENDS / BITE BACK</text>
  <path d="M784 350 H1024 M994 292 L1074 350 L994 408" fill="none" stroke="#d71920" stroke-width="24" stroke-linejoin="miter" stroke-linecap="square"/>
</svg>`;

  const out = path.join(outDir, `${id}.webp`);
  await sharp(Buffer.from(svg)).webp({ quality: 88, effort: 6 }).toFile(out);
  console.log(out);
}
