import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const status = z.enum(['draft', 'testing', 'active', 'paused', 'closed']);
const reviewStatus = z.enum(['draft', 'review-needed', 'legal-review-needed', 'scientific-review-needed', 'reviewed', 'approved']);
const confidenceLabel = z.enum(['strong', 'moderate', 'limited', 'emerging', 'unverified']);
const severity = z.enum(['low', 'medium', 'high', 'extreme']);
const actionType = z.enum(['petition', 'mp-letter', 'submission', 'volunteer', 'donate', 'share']);
const actionProvider = z.enum(['action-network', 'external', 'internal']);
const imageReference = z.object({
  src: z.string().min(2),
  alt: z.string().min(8),
  caption: z.string().optional(),
  credit: z.string().optional(),
  sourceUrl: z.url().optional()
});

const reviewOrStatus = z.enum(['draft', 'review-needed', 'legal-review-needed', 'scientific-review-needed', 'reviewed', 'approved']);

const actionSchema = z.object({
  type: actionType,
  label: z.string().min(2),
  provider: actionProvider,
  url: z.string().min(1),
  embedUrl: z.url().optional(),
  requiresAddress: z.boolean(),
  consentNote: z.string().min(10),
  status
});

const campaigns = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/campaigns' }),
  schema: z.object({
    id: z.string().min(2),
    slug: z.string().min(2),
    title: z.string().min(2),
    status,
    issueType: z.string().min(2),
    affectedAnimals: z.array(z.string().min(2)).min(1),
    jurisdiction: z.string().min(2),
    decisionMakers: z.array(z.string().min(2)).min(1),
    desiredOutcome: z.string().min(10),
    measurableEndpoint: z.string().min(10),
    summary: z.string().min(20),
    problem: z.string().min(20),
    legalPathway: z.string().min(20),
    evidenceSummary: z.string().min(20),
    severity,
    primaryAction: actionSchema,
    secondaryActions: z.array(actionSchema).default([]),
    images: z.array(z.string()).min(1),
    sourceIds: z.array(z.string()).min(1),
    newsIds: z.array(z.string()).default([]),
    progressIds: z.array(z.string()).default([]),
    legalReviewStatus: reviewStatus,
    scientificReviewStatus: reviewStatus,
    confidenceLabel,
    launchDate: dateString.optional(),
    closeDate: dateString.optional(),
    correctionHistory: z.array(z.object({
      date: dateString.optional(),
      summary: z.string().min(2),
      status: z.enum(['none', 'minor', 'major', 'pending'])
    })).default([])
  })
});

const actions = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/actions' }),
  schema: actionSchema.extend({
    campaignId: z.string().optional(),
    description: z.string().min(10),
    testGate: z.array(z.string()).default([])
  })
});

const sources = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/sources' }),
  schema: z.object({
    title: z.string().min(2),
    publisher: z.string().min(2),
    url: z.url(),
    sourceType: z.enum(['academic', 'government', 'legal', 'platform-doc', 'regulator', 'media', 'report', 'guidance']),
    claimCategory: z.enum(['scientific', 'legal', 'policy', 'campaign', 'privacy', 'technical']),
    datePublished: dateString.optional(),
    dateAccessed: dateString,
    confidenceLabel,
    jurisdiction: z.string().optional(),
    notes: z.string().optional()
  })
});

const images = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/images' }),
  schema: z.object({
    src: z.string().min(2),
    alt: z.string().min(10),
    caption: z.string().optional(),
    credit: z.string().optional(),
    license: z.string().optional(),
    sourceUrl: z.url().optional(),
    reviewStatus,
    graphicContent: z.literal(false)
  })
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/news' }),
  schema: z.object({
    title: z.string().min(2),
    outlet: z.string().min(2),
    url: z.url(),
    publishedDate: dateString,
    summary: z.string().min(10),
    sourceIds: z.array(z.string()).default([]),
    campaignIds: z.array(z.string()).default([]),
    topics: z.array(z.string()).default([]),
    image: imageReference.optional(),
    automated: z.boolean().default(false),
    fetchedAt: z.string().optional(),
    relevanceScore: z.number().min(0).max(100).optional(),
    reviewStatus
  })
});

const newsSources = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/news-sources' }),
  schema: z.object({
    name: z.string().min(2),
    publisher: z.string().min(2),
    url: z.url(),
    feedUrl: z.url(),
    fetchMode: z.enum(['rss', 'html', 'google-news']).default('rss'),
    sourceType: z.enum(['public-broadcaster', 'independent-media', 'government', 'ngo', 'aggregator']),
    country: z.string().min(2),
    qualityWeight: z.number().min(0).max(10).default(5),
    notes: z.string().optional(),
    enabled: z.boolean().default(true)
  })
});

const products = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/products' }),
  schema: z.object({
    id: z.string().min(2),
    slug: z.string().min(2),
    name: z.string().min(2),
    category: z.enum(['bumper-sticker', 'sticker', 'print', 'apparel', 'donation']),
    status: z.enum(['draft', 'preview', 'available', 'sold-out']),
    priceAud: z.number().nonnegative(),
    summary: z.string().min(10),
    description: z.string().min(10),
    stickerText: z.string().min(2).optional(),
    colours: z.array(z.string()).min(1),
    sku: z.string().min(2).optional(),
    materials: z.array(z.string()).default([]),
    dimensions: z.string().optional(),
    variants: z.array(z.object({
      name: z.string().min(2),
      sku: z.string().min(2).optional(),
      priceAud: z.number().nonnegative().optional(),
      status: z.enum(['draft', 'preview', 'available', 'sold-out']).optional()
    })).default([]),
    impactNote: z.string().optional(),
    checkoutUrl: z.string().optional(),
    availableFrom: dateString.optional(),
    fundraisingReviewStatus: reviewOrStatus.default('review-needed'),
    fulfillmentStatus: z.enum(['not-started', 'supplier-review', 'sample-ordered', 'ready', 'paused']).default('not-started'),
    images: z.array(imageReference).default([]),
    tags: z.array(z.string()).default([]),
    fulfillmentNote: z.string().optional()
  })
});

const friends = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/friends' }),
  schema: z.object({
    id: z.string().min(2),
    name: z.string().min(2),
    url: z.url(),
    region: z.string().min(2),
    organisationType: z.string().min(2),
    summary: z.string().min(10),
    alignment: z.string().min(10),
    logo: imageReference.optional(),
    relationship: z.enum(['listed-resource', 'campaign-ally', 'formal-partner']).default('listed-resource'),
    tags: z.array(z.string()).default([])
  })
});

const progress = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/progress' }),
  schema: z.object({
    campaignId: z.string().min(2),
    date: dateString,
    title: z.string().min(2),
    summary: z.string().min(10),
    status: z.enum(['foundation', 'testing', 'published', 'paused', 'won', 'closed']),
    sourceIds: z.array(z.string()).default([])
  })
});

const platformUpdates = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/platform-updates' }),
  schema: z.object({
    date: dateString,
    title: z.string().min(2),
    summary: z.string().min(10),
    status: z.enum(['planned', 'testing', 'published', 'paused']),
    area: z.enum(['site', 'news', 'shop', 'campaigns', 'governance']),
    sourceIds: z.array(z.string()).default([])
  })
});

export const collections = {
  campaigns,
  actions,
  sources,
  images,
  news,
  newsSources,
  products,
  friends,
  progress,
  platformUpdates
};
