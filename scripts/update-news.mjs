import { readdirSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import sharp from 'sharp';

const root = process.cwd();
const contentDir = path.join(root, 'src', 'content');
const newsDir = path.join(contentDir, 'news');
const sourceDir = path.join(contentDir, 'news-sources');
const imageDir = path.join(root, 'public', 'images', 'news');
const maxItems = Number.parseInt(process.env.BITE_BACK_NEWS_LIMIT ?? '14', 10);
const fetchedAt = new Date().toISOString();

const excludedDomains = new Set([
  'news.com.au',
  'www.news.com.au',
  'theaustralian.com.au',
  'www.theaustralian.com.au',
  'dailytelegraph.com.au',
  'www.dailytelegraph.com.au',
  'heraldsun.com.au',
  'www.heraldsun.com.au',
  'couriermail.com.au',
  'www.couriermail.com.au',
  'adelaidenow.com.au',
  'www.adelaidenow.com.au',
  'skynews.com.au',
  'www.skynews.com.au'
]);

const keywords = [
  'animal welfare',
  'animal cruelty',
  'inspectorate',
  'livestock',
  'live export',
  'abattoir',
  'piggery',
  'pigs',
  'cattle',
  'sheep',
  'poultry',
  'chickens',
  'greyhound',
  'horse racing',
  'puppy farm',
  'dog breeding',
  'wildlife',
  'kangaroo',
  'koala',
  'sentience',
  'biosecurity',
  'animal law',
  'cruelty charges'
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  cdataPropName: '#cdata'
});

function arrayOf(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function stripHtml(value = '') {
  return String(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\u00e2\u20ac\u2122/g, "'")
    .replace(/\u00e2\u20ac\u0153|\u00e2\u20ac\u009d/g, '"')
    .replace(/\u00e2\u20ac\u201c|\u00e2\u20ac\u201d/g, '-')
    .replace(/â€™/g, "'")
    .replace(/â€œ|â€�/g, '"')
    .replace(/â€“|â€”/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value, length = 260) {
  if (value.length <= length) return value;
  return `${value.slice(0, length - 1).trim()}...`;
}

function safeSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 84);
}

function dateOnly(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function isAllowedUrl(value) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return !excludedDomains.has(hostname);
  } catch {
    return false;
  }
}

function matchesAnimalWelfare(item) {
  const haystack = `${item.title} ${item.summary}`.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
}

function itemText(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    return value['#cdata'] ?? value['#text'] ?? '';
  }
  return '';
}

function imageFromRssItem(item) {
  const media = arrayOf(item['media:content']).find((entry) => entry?.['@_url']);
  if (media?.['@_url']) return media['@_url'];

  const thumbnail = arrayOf(item['media:thumbnail']).find((entry) => entry?.['@_url']);
  if (thumbnail?.['@_url']) return thumbnail['@_url'];

  const enclosure = arrayOf(item.enclosure).find((entry) => {
    const type = entry?.['@_type'] ?? '';
    return entry?.['@_url'] && String(type).startsWith('image/');
  });

  return enclosure?.['@_url'];
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'BiteBackNewsBot/0.1 (+https://bitebackproject.au)',
      accept: 'application/rss+xml, application/atom+xml, text/xml, text/html;q=0.9, */*;q=0.1'
    }
  });
  if (!response.ok) {
    throw new Error(`${url} responded ${response.status}`);
  }
  return response.text();
}

async function getOpenGraphImage(url) {
  try {
    const html = await fetchText(url);
    const match = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["'][^>]*>/i)
      ?? html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["'][^>]*>/i);
    if (!match?.[1]) return undefined;
    return new URL(match[1], url).toString();
  } catch {
    return undefined;
  }
}

async function downloadImage(imageUrl, slug, title) {
  if (!imageUrl || !isAllowedUrl(imageUrl)) return undefined;

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'user-agent': 'BiteBackNewsBot/0.1 (+https://bitebackproject.au)',
        accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });
    if (!response.ok) return undefined;
    const input = Buffer.from(await response.arrayBuffer());
    const fileName = `auto-${slug}.webp`;
    const outputPath = path.join(imageDir, fileName);
    await sharp(input)
      .resize({ width: 960, height: 540, fit: 'cover', withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(outputPath);
    return {
      src: `/images/news/${fileName}`,
      alt: `News image for ${title}`,
      sourceUrl: imageUrl
    };
  } catch {
    return undefined;
  }
}

function parseRss(xml, source) {
  const document = parser.parse(xml);
  const channel = document.rss?.channel;
  const rssItems = arrayOf(channel?.item).map((item) => {
    const title = stripHtml(itemText(item.title));
    const link = itemText(item.link) || item.guid?.['#text'] || item.guid;
    const summary = stripHtml(itemText(item.description) || itemText(item.summary));
    const publishedDate = dateOnly(item.pubDate ?? item.published ?? item.updated);
    return {
      title,
      outlet: source.name,
      url: link,
      publishedDate,
      summary: truncate(summary || title),
      imageUrl: imageFromRssItem(item)
    };
  });

  const atomItems = arrayOf(document.feed?.entry).map((item) => {
    const title = stripHtml(itemText(item.title));
    const linkEntry = arrayOf(item.link).find((entry) => entry?.['@_href']) ?? item.link;
    const link = typeof linkEntry === 'string' ? linkEntry : linkEntry?.['@_href'];
    const summary = stripHtml(itemText(item.summary) || itemText(item.content));
    const publishedDate = dateOnly(item.published ?? item.updated);
    return {
      title,
      outlet: source.name,
      url: link,
      publishedDate,
      summary: truncate(summary || title),
      imageUrl: undefined
    };
  });

  return [...rssItems, ...atomItems];
}

function parseHtmlLinks(html, source) {
  const items = [];
  const matches = html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);

  for (const match of matches) {
    const url = new URL(match[1], source.feedUrl).toString();
    const title = stripHtml(match[2]);
    if (!new URL(url).pathname.startsWith('/latest-news/')) continue;
    if (title.length < 16) continue;
    const dateMatch = title.match(/\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})$/);
    const cleanTitle = dateMatch ? title.slice(0, dateMatch.index).trim() : title;
    if (!dateMatch) continue;
    const publishedDate = dateOnly(dateMatch[1]);
    items.push({
      title: cleanTitle,
      outlet: source.name,
      url,
      publishedDate,
      summary: truncate(cleanTitle),
      imageUrl: undefined
    });
  }

  return items;
}

async function loadSources() {
  const files = readdirSync(sourceDir).filter((file) => file.endsWith('.json'));
  const sources = [];
  for (const file of files) {
    const source = JSON.parse(await readFile(path.join(sourceDir, file), 'utf8'));
    if (source.enabled !== false) {
      sources.push(source);
    }
  }
  return sources;
}

async function clearGeneratedFiles() {
  await mkdir(newsDir, { recursive: true });
  await mkdir(imageDir, { recursive: true });

  for (const file of readdirSync(newsDir)) {
    if (file.startsWith('auto-') && file.endsWith('.json')) {
      await rm(path.join(newsDir, file));
    }
  }

  for (const file of readdirSync(imageDir)) {
    if (file.startsWith('auto-')) {
      await rm(path.join(imageDir, file));
    }
  }
}

async function main() {
  const sources = await loadSources();
  const items = [];

  for (const source of sources) {
    try {
      const text = await fetchText(source.feedUrl);
      const parsedItems = source.fetchMode === 'html'
        ? parseHtmlLinks(text, source)
        : parseRss(text, source);
      for (const item of parsedItems) {
        if (!item.title || !item.url || !item.publishedDate) continue;
        if (!isAllowedUrl(item.url)) continue;
        if (!matchesAnimalWelfare(item)) continue;
        items.push(item);
      }
    } catch (error) {
      console.warn(`Skipping ${source.name}: ${error.message}`);
    }
  }

  const unique = new Map();
  for (const item of items) {
    unique.set(item.url, item);
  }

  const selected = [...unique.values()]
    .sort((a, b) => b.publishedDate.localeCompare(a.publishedDate))
    .slice(0, maxItems);

  await clearGeneratedFiles();

  for (const item of selected) {
    const slug = safeSlug(`${item.publishedDate}-${item.outlet}-${item.title}`);
    const ogImage = item.imageUrl ?? await getOpenGraphImage(item.url);
    const image = await downloadImage(ogImage, slug, item.title);
    const data = {
      title: item.title,
      outlet: item.outlet,
      url: item.url,
      publishedDate: item.publishedDate,
      summary: item.summary,
      campaignIds: [],
      topics: ['animal welfare'],
      image,
      automated: true,
      fetchedAt,
      reviewStatus: 'review-needed'
    };

    if (!image) {
      delete data.image;
    }

    await writeFile(path.join(newsDir, `auto-${slug}.json`), `${JSON.stringify(data, null, 2)}\n`);
  }

  console.log(`Wrote ${selected.length} automated news entries from ${sources.length} sources.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
