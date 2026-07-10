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
const maxItems = Number.parseInt(process.env.BITE_BACK_NEWS_LIMIT ?? '24', 10);
const minScore = Number.parseInt(process.env.BITE_BACK_NEWS_MIN_SCORE ?? '8', 10);
const earliestDate = process.env.BITE_BACK_NEWS_EARLIEST ?? '2024-01-01';
const maxAgeDays = Number.parseInt(process.env.BITE_BACK_NEWS_MAX_AGE_DAYS ?? '180', 10);
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

const weightedTerms = new Map([
  ['animal welfare', 9],
  ['animal cruelty', 9],
  ['cruelty charges', 10],
  ['animal protection', 8],
  ['animal law', 8],
  ['animal rescue', 7],
  ['sentience', 9],
  ['live export', 8],
  ['livestock', 5],
  ['abattoir', 8],
  ['piggery', 8],
  ['pigs', 4],
  ['cattle', 4],
  ['sheep', 4],
  ['poultry', 5],
  ['chickens', 4],
  ['greyhound', 8],
  ['horse racing', 7],
  ['puppy farm', 8],
  ['dog breeding', 7],
  ['wildlife', 5],
  ['monkey', 4],
  ['orangutan', 4],
  ['kangaroo', 6],
  ['koala', 5],
  ['sanctuary', 4],
  ['biosecurity', 4],
  ['inspectorate', 6],
  ['prosecution', 8],
  ['investigation', 6],
  ['enforcement', 8],
  ['standards', 5],
  ['regulator', 7]
]);

const animalAnchorTerms = [
  'animal',
  'animals',
  'wildlife',
  'livestock',
  'farmed',
  'abattoir',
  'live export',
  'piggery',
  'pig',
  'pigs',
  'cattle',
  'sheep',
  'poultry',
  'chicken',
  'chickens',
  'greyhound',
  'horse',
  'dog',
  'dogs',
  'cat',
  'cats',
  'puppy',
  'kangaroo',
  'koala',
  'monkey',
  'orangutan',
  'bird',
  'avian'
];

const excludedTitlePatterns = [
  /\bpodcast\b/i,
  /\bepisode\b/i,
  /\bseason\s+\d+\b/i,
  /\bpet insurance\b/i,
  /\badopt a pet\b/i,
  /\bnational pet adoption month\b/i,
  /\bbranding\b/i,
  /\bcertification trade mark\b/i,
  /\bapplications open\b/i,
  /\bscholarship\b/i,
  /\bassessors\b/i,
  /\bfamily day care\b/i,
  /\bchildcare\b/i,
  /\bchild care\b/i,
  /\bAFL\b/i,
  /\bMRO\b/i,
  /\bPies\b/i,
  /\bMagpies\b/i,
  /\bCollingwood\b/i
];

const topicRules = [
  { topic: 'law reform', terms: ['law', 'legislation', 'reform', 'statute', 'sentience', 'protection laws'] },
  { topic: 'enforcement', terms: ['charges', 'prosecution', 'investigation', 'inspectorate', 'enforcement', 'regulator'] },
  { topic: 'farmed animals', terms: ['piggery', 'pigs', 'cattle', 'sheep', 'poultry', 'chickens', 'livestock', 'abattoir'] },
  { topic: 'racing', terms: ['greyhound', 'horse racing', 'racing'] },
  { topic: 'companion animals', terms: ['puppy farm', 'dog breeding', 'dogs', 'cats'] },
  { topic: 'wildlife', terms: ['wildlife', 'kangaroo', 'koala'] },
  { topic: 'transparency', terms: ['data', 'reporting', 'public record', 'regulator', 'audit'] },
  { topic: 'biosecurity', terms: ['biosecurity', 'avian influenza', 'bird flu'] }
];

const googlePublisherAllowlist = [
  /abc news/i,
  /australian broadcasting corporation/i,
  /guardian australia/i,
  /rspca australia/i,
  /the conversation/i,
  /reuters/i,
  /bbc/i,
  /world animal protection/i,
  /animals australia/i,
  /humane society international/i,
  /eurogroup for animals/i,
  /the australia institute/i
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
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00e2\u20ac\u2122/g, "'")
    .replace(/\u00e2\u20ac\u0153|\u00e2\u20ac\u009d/g, '"')
    .replace(/\u00e2\u20ac\u201c|\u00e2\u20ac\u201d/g, '-')
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

function isExcludedTitle(title) {
  return excludedTitlePatterns.some((pattern) => pattern.test(title));
}

function isTooOld(dateValue) {
  if (!dateValue || maxAgeDays <= 0) return false;
  const ageDays = (Date.now() - new Date(`${dateValue}T00:00:00Z`).getTime()) / 86400000;
  return ageDays > maxAgeDays;
}

function scoreItem(item, source) {
  const title = `${item.title}`.toLowerCase();
  const summary = `${item.summary} ${item.keywords ?? ''}`.toLowerCase();
  const haystack = `${title} ${summary}`;
  if (!animalAnchorTerms.some((term) => haystack.includes(term))) return 0;
  let termScore = 0;
  for (const [term, weight] of weightedTerms) {
    if (title.includes(term)) termScore += weight * 2;
    if (summary.includes(term)) termScore += weight;
  }
  if (termScore === 0) return 0;
  let score = termScore + Number(source.qualityWeight ?? 5);
  if (item.publishedDate) {
    const ageDays = Math.max(0, (Date.now() - new Date(item.publishedDate).getTime()) / 86400000);
    if (ageDays <= 14) score += 8;
    else if (ageDays <= 45) score += 5;
    else if (ageDays <= 120) score += 2;
  }
  return Math.min(100, Math.round(score));
}

function classifyTopics(item) {
  const haystack = `${item.title} ${item.summary} ${item.keywords ?? ''}`.toLowerCase();
  const topics = topicRules
    .filter((rule) => rule.terms.some((term) => haystack.includes(term)))
    .map((rule) => rule.topic);
  return [...new Set(topics.length > 0 ? topics : ['animal welfare'])];
}

function normalizeOutletName(outlet) {
  if (/abc news|australian broadcasting corporation/i.test(outlet)) return 'ABC News';
  if (/guardian/i.test(outlet)) return 'Guardian Australia';
  if (/rspca/i.test(outlet)) return 'RSPCA Australia';
  if (/conversation/i.test(outlet)) return 'The Conversation';
  if (/reuters/i.test(outlet)) return 'Reuters';
  if (/bbc/i.test(outlet)) return 'BBC';
  if (/world animal protection/i.test(outlet)) return 'World Animal Protection';
  if (/animals australia/i.test(outlet)) return 'Animals Australia';
  if (/humane society international/i.test(outlet)) return 'Humane Society International';
  if (/eurogroup for animals/i.test(outlet)) return 'Eurogroup for Animals';
  if (/australia institute/i.test(outlet)) return 'The Australia Institute';
  return stripHtml(outlet);
}

function campaignIdsForTopics(topics) {
  const ids = new Set();
  if (topics.some((topic) => ['law reform', 'farmed animals', 'racing', 'companion animals', 'wildlife'].includes(topic))) {
    ids.add('sentience-statute');
  }
  if (topics.some((topic) => ['enforcement', 'transparency', 'biosecurity'].includes(topic))) {
    ids.add('open-welfare-data');
  }
  return [...ids];
}

function itemText(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    return value['#cdata'] ?? value['#text'] ?? '';
  }
  return '';
}

function sourceText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value['#text'] ?? value['@_url'] ?? '';
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

async function getArticleMeta(url) {
  try {
    const html = await fetchText(url);
    const imageMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["'][^>]*>/i)
      ?? html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["'][^>]*>/i);
    const descriptionMatch = html.match(/<meta\s+(?:property|name)=["']og:description["']\s+content=["']([^"']+)["'][^>]*>/i)
      ?? html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["'][^>]*>/i)
      ?? html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:description["'][^>]*>/i);
    const publishedMatch = html.match(/<meta\s+(?:property|name)=["']article:published_time["']\s+content=["']([^"']+)["'][^>]*>/i)
      ?? html.match(/<time[^>]+datetime=["']([^"']+)["']/i);
    return {
      imageUrl: imageMatch?.[1] ? new URL(imageMatch[1], url).toString() : undefined,
      description: descriptionMatch?.[1] ? truncate(stripHtml(descriptionMatch[1])) : undefined,
      publishedDate: publishedMatch?.[1] ? dateOnly(publishedMatch[1]) : undefined
    };
  } catch {
    return {};
  }
}

async function downloadImage(imageUrl, slug, title) {
  if (!imageUrl || !isAllowedUrl(imageUrl)) return undefined;
  const imageHost = new URL(imageUrl).hostname.toLowerCase();
  if (imageHost.includes('googleusercontent.com') || imageHost.includes('gstatic.com')) return undefined;

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

function parseGoogleNews(xml, source) {
  const document = parser.parse(xml);
  const channel = document.rss?.channel;
  return arrayOf(channel?.item)
    .map((item) => {
      const rawPublisher = stripHtml(sourceText(item.source));
      const publisher = normalizeOutletName(rawPublisher);
      const rawTitle = stripHtml(itemText(item.title));
      const escapedRawPublisher = rawPublisher.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedPublisher = publisher.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const title = rawTitle
        .replace(new RegExp(`\\s+-\\s+${escapedRawPublisher}$`, 'i'), '')
        .replace(new RegExp(`\\s+-\\s+${escapedPublisher}$`, 'i'), '');
      const summary = stripHtml(itemText(item.description));
      return {
        title,
        outlet: publisher || source.name,
        url: itemText(item.link),
        publishedDate: dateOnly(item.pubDate),
        summary: truncate(summary || title),
        imageUrl: undefined,
        discoverySource: source.name
      };
    })
    .filter((item) => googlePublisherAllowlist.some((pattern) => pattern.test(item.outlet)));
}

function parseRspcaHtmlLinks(html, source) {
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

function parseWorldAnimalProtectionHtml(html, source) {
  const items = [];
  const matches = html.matchAll(/<div class=["']promoBlockWrap["'][^>]*>([\s\S]*?)<h3 class=["']promoBlockTitle["'][^>]*>\s*<a href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>\s*<\/h3>[\s\S]*?<time[^>]+datetime=["']([^"']+)["'][^>]*>[\s\S]*?<\/time>[\s\S]*?<p class=["']promoBlockSummary["'][^>]*>([\s\S]*?)<\/p>/gi);

  for (const match of matches) {
    const block = match[1];
    const url = new URL(match[2], source.feedUrl).toString();
    const title = stripHtml(match[3]);
    const publishedDate = dateOnly(match[4]);
    const summary = truncate(stripHtml(match[5]) || title);
    const topics = [...block.matchAll(/<li class=["']topicsItem["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/gi)]
      .map((topicMatch) => stripHtml(topicMatch[1]))
      .filter(Boolean);
    const imageMatch = block.match(/<img[^>]+src=["']([^"']+)["']/i);
    const imageUrl = imageMatch?.[1] ? new URL(imageMatch[1], source.feedUrl).toString() : undefined;
    items.push({
      title,
      outlet: source.name,
      url,
      publishedDate,
      summary,
      keywords: topics.join(' '),
      imageUrl
    });
  }

  return items;
}

function parseHtmlLinks(html, source) {
  if (source.parser === 'world-animal-protection-news') {
    return parseWorldAnimalProtectionHtml(html, source);
  }
  return parseRspcaHtmlLinks(html, source);
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

async function loadManualNews() {
  const entries = [];
  for (const file of readdirSync(newsDir).filter((item) => item.endsWith('.json') && !item.startsWith('auto-'))) {
    try {
      const data = JSON.parse(await readFile(path.join(newsDir, file), 'utf8'));
      const topics = data.topics?.length ? data.topics : classifyTopics(data);
      entries.push({
        outlet: normalizeOutletName(data.outlet ?? ''),
        publishedDate: data.publishedDate,
        topics
      });
    } catch {
      // A malformed manual entry will be caught by content validation.
    }
  }
  return entries;
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
  const manualNews = await loadManualNews();
  const items = [];

  for (const source of sources) {
    try {
      const text = await fetchText(source.feedUrl);
      const parsedItems = source.fetchMode === 'html'
        ? parseHtmlLinks(text, source)
        : source.fetchMode === 'google-news'
          ? parseGoogleNews(text, source)
          : parseRss(text, source);
      for (const item of parsedItems) {
        if (!item.title || !item.url || !item.publishedDate) continue;
        if (!isAllowedUrl(item.url)) continue;
        if (item.publishedDate < earliestDate) continue;
        if (isTooOld(item.publishedDate)) continue;
        if (isExcludedTitle(item.title)) continue;
        const relevanceScore = scoreItem(item, source);
        if (relevanceScore < minScore) continue;
        const topics = classifyTopics(item);
        const duplicateManual = manualNews.some((manual) =>
          manual.publishedDate === item.publishedDate
          && manual.outlet === normalizeOutletName(item.outlet)
          && manual.topics.some((topic) => topics.includes(topic))
        );
        if (duplicateManual) continue;
        items.push({
          ...item,
          relevanceScore,
          topics,
          campaignIds: campaignIdsForTopics(topics)
        });
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
    .sort((a, b) => (b.relevanceScore - a.relevanceScore) || b.publishedDate.localeCompare(a.publishedDate))
    .slice(0, maxItems);

  await clearGeneratedFiles();

  for (const item of selected) {
    const slug = safeSlug(`${item.publishedDate}-${item.outlet}-${item.title}`);
    const meta = await getArticleMeta(item.url);
    const summary = meta.description && meta.description.length > item.summary.length ? meta.description : item.summary;
    const image = await downloadImage(item.imageUrl ?? meta.imageUrl, slug, item.title);
    const data = {
      title: item.title,
      outlet: item.outlet,
      url: item.url,
      publishedDate: meta.publishedDate ?? item.publishedDate,
      summary,
      campaignIds: item.campaignIds,
      topics: item.topics,
      image,
      automated: true,
      fetchedAt,
      relevanceScore: item.relevanceScore,
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
