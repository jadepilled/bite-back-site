import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contentDir = path.join(root, 'src', 'content');

function readJsonDir(name) {
  const dir = path.join(contentDir, name);
  if (!existsSync(dir)) {
    throw new Error(`Missing content directory: ${name}`);
  }
  return readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      const fullPath = path.join(dir, file);
      const data = JSON.parse(readFileSync(fullPath, 'utf8'));
      return { file, id: path.basename(file, '.json'), data };
    });
}

function requireText(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required text: ${label}`);
  }
}

function idsFor(entries) {
  return new Set(entries.map((entry) => entry.id));
}

const campaigns = readJsonDir('campaigns');
const sources = readJsonDir('sources');
const images = readJsonDir('images');
const news = readJsonDir('news');
const progress = readJsonDir('progress');
const products = readJsonDir('products');
const friends = readJsonDir('friends');
const newsSources = readJsonDir('news-sources');

const sourceIds = idsFor(sources);
const imageIds = idsFor(images);
const newsIds = idsFor(news);
const progressIds = idsFor(progress);
const campaignIds = new Set(campaigns.map((entry) => entry.data.id));
const severityValues = new Set(['low', 'medium', 'high', 'extreme']);

function requirePublicAsset(src, label) {
  if (!src.startsWith('/')) return;
  const assetPath = path.join(root, 'public', src.replace(/^\//, ''));
  if (!existsSync(assetPath)) {
    throw new Error(`${label}: asset does not exist at public${src}`);
  }
}

function validateImageReference(image, label) {
  if (!image) return;
  requireText(image.src, `${label}.src`);
  requireText(image.alt, `${label}.alt`);
  requirePublicAsset(image.src, `${label}.src`);
}

for (const entry of images) {
  const { data } = entry;
  if (data.graphicContent !== false) {
    throw new Error(`${entry.file}: graphicContent must be false for launch assets`);
  }
  requireText(data.src, `${entry.file}.src`);
  requireText(data.alt, `${entry.file}.alt`);
  const assetPath = path.join(root, 'public', data.src.replace(/^\//, ''));
  if (!existsSync(assetPath)) {
    throw new Error(`${entry.file}: image asset does not exist at public${data.src}`);
  }
}

for (const entry of campaigns) {
  const { data } = entry;
  requireText(data.id, `${entry.file}.id`);
  requireText(data.slug, `${entry.file}.slug`);
  requireText(data.title, `${entry.file}.title`);
  requireText(data.desiredOutcome, `${entry.file}.desiredOutcome`);
  requireText(data.measurableEndpoint, `${entry.file}.measurableEndpoint`);
  requireText(data.legalPathway, `${entry.file}.legalPathway`);
  requireText(data.evidenceSummary, `${entry.file}.evidenceSummary`);
  if (!severityValues.has(data.severity)) {
    throw new Error(`${entry.file}: severity must be low, medium, high or extreme`);
  }

  if (!Array.isArray(data.decisionMakers) || data.decisionMakers.length === 0) {
    throw new Error(`${entry.file}: decisionMakers must identify at least one target`);
  }
  if (!data.primaryAction?.consentNote) {
    throw new Error(`${entry.file}: primaryAction.consentNote is required`);
  }
  if (!Array.isArray(data.correctionHistory)) {
    throw new Error(`${entry.file}: correctionHistory must be present`);
  }

  for (const id of data.sourceIds ?? []) {
    if (!sourceIds.has(id)) throw new Error(`${entry.file}: unknown sourceId ${id}`);
  }
  for (const id of data.images ?? []) {
    if (!imageIds.has(id)) throw new Error(`${entry.file}: unknown image id ${id}`);
  }
  for (const id of data.newsIds ?? []) {
    if (!newsIds.has(id)) throw new Error(`${entry.file}: unknown news id ${id}`);
  }
  for (const id of data.progressIds ?? []) {
    if (!progressIds.has(id)) throw new Error(`${entry.file}: unknown progress id ${id}`);
  }
}

for (const entry of news) {
  validateImageReference(entry.data.image, `${entry.file}.image`);
  for (const id of entry.data.campaignIds ?? []) {
    if (!campaignIds.has(id)) throw new Error(`${entry.file}: unknown campaignId ${id}`);
  }
}

for (const entry of products) {
  for (const image of entry.data.images ?? []) {
    validateImageReference(image, `${entry.file}.images`);
  }
}

for (const entry of friends) {
  validateImageReference(entry.data.logo, `${entry.file}.logo`);
}

const publicText = JSON.stringify({ campaigns, sources, images, news, progress, products, friends, newsSources });
const secretPatterns = [
  /api[_-]?key/i,
  /bearer\s+[a-z0-9._-]{20,}/i,
  /sk-[a-z0-9]{20,}/i,
  /actionnetwork\.org\/api/i
];

for (const pattern of secretPatterns) {
  if (pattern.test(publicText)) {
    throw new Error(`Potential secret or private API reference found: ${pattern}`);
  }
}

console.log(`Validated ${campaigns.length} campaigns, ${sources.length} sources, ${images.length} images, ${news.length} news entries, ${progress.length} progress updates, ${products.length} products, ${friends.length} friends, and ${newsSources.length} news sources.`);
