import type { CollectionEntry } from 'astro:content';

export function entryId(entry: { id: string }) {
  return entry.id.replace(/\.json$/, '').replace(/\\/g, '/');
}

export function mapEntries<T extends { id: string }>(entries: T[]) {
  return new Map(entries.map((entry) => [entryId(entry), entry]));
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: 'Draft',
    testing: 'Testing gate',
    active: 'Active',
    paused: 'Paused',
    closed: 'Closed',
    preview: 'Preview',
    available: 'Available',
    'sold-out': 'Sold out',
    foundation: 'Foundation',
    published: 'Published',
    won: 'Won'
  };

  return labels[status] ?? status;
}

export function confidenceLabel(confidence: string) {
  const labels: Record<string, string> = {
    strong: 'Strong evidence',
    moderate: 'Moderate evidence',
    limited: 'Limited evidence',
    emerging: 'Emerging evidence',
    unverified: 'Unverified'
  };

  return labels[confidence] ?? confidence;
}

export function severityLabel(severity: string) {
  const labels: Record<string, string> = {
    low: 'Low severity',
    medium: 'Medium severity',
    high: 'High severity',
    extreme: 'Extreme severity'
  };

  return labels[severity] ?? severity;
}

export function severityRank(severity: string) {
  const ranks: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    extreme: 4
  };

  return ranks[severity] ?? 0;
}

export function reviewLabel(review: string) {
  const labels: Record<string, string> = {
    draft: 'Draft',
    'review-needed': 'Review needed',
    'legal-review-needed': 'Legal review needed',
    'scientific-review-needed': 'Scientific review needed',
    reviewed: 'Reviewed',
    approved: 'Approved'
  };

  return labels[review] ?? review;
}

export function sortCampaigns(
  campaigns: CollectionEntry<'campaigns'>[]
) {
  return [...campaigns].sort((a, b) => a.data.title.localeCompare(b.data.title));
}

export function sortCampaignsByDate(
  campaigns: CollectionEntry<'campaigns'>[]
) {
  return [...campaigns].sort((a, b) => {
    const dateA = a.data.launchDate ?? '0000-00-00';
    const dateB = b.data.launchDate ?? '0000-00-00';
    return dateB.localeCompare(dateA);
  });
}

export function campaignPath(campaign: CollectionEntry<'campaigns'>) {
  return `/campaigns/${campaign.data.slug}/`;
}

export function formatList(items: string[]) {
  if (items.length <= 1) return items[0] ?? '';
  const last = items[items.length - 1];
  return `${items.slice(0, -1).join(', ')} and ${last}`;
}
