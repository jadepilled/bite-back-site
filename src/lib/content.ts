import type { CollectionEntry } from 'astro:content';

export type OrganisationType =
  | 'political-organisation'
  | 'advocacy-group'
  | 'charity'
  | 'outreach-group'
  | 'animal-rescue'
  | 'think-tank';

export function entryId(entry: { id: string }) {
  return entry.id.replace(/\.json$/, '').replace(/\\/g, '/');
}

export function mapEntries<T extends { id: string }>(entries: T[]) {
  return new Map(entries.map((entry) => [entryId(entry), entry]));
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: 'Draft',
    'pre-launch': 'Pre-launch',
    testing: 'Testing gate',
    active: 'Active',
    paused: 'Paused',
    closed: 'Closed',
    preview: 'Preview',
    available: 'Available',
    'sold-out': 'Sold out',
    'not-started': 'Not started',
    'supplier-review': 'Supplier review',
    'sample-ordered': 'Sample ordered',
    ready: 'Ready',
    planned: 'Planned',
    none: 'No corrections',
    minor: 'Minor correction',
    major: 'Major correction',
    pending: 'Pending',
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

export const organisationTypeMeta: Record<OrganisationType, { label: string; className: string }> = {
  'political-organisation': {
    label: 'Political organisation',
    className: 'label-chip--political'
  },
  'advocacy-group': {
    label: 'Advocacy group',
    className: 'label-chip--advocacy'
  },
  charity: {
    label: 'Charity',
    className: 'label-chip--charity'
  },
  'outreach-group': {
    label: 'Outreach group',
    className: 'label-chip--outreach'
  },
  'animal-rescue': {
    label: 'Animal rescue',
    className: 'label-chip--rescue'
  },
  'think-tank': {
    label: 'Think tank',
    className: 'label-chip--think-tank'
  }
};

export function organisationTypeLabel(type: string) {
  return organisationTypeMeta[type as OrganisationType]?.label ?? type;
}

export function organisationTypeClass(type: string) {
  return organisationTypeMeta[type as OrganisationType]?.className ?? 'label-chip--default';
}

export function formatDisplayDate(dateValue: string) {
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return dateValue;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const suffix = day >= 11 && day <= 13
    ? 'th'
    : day % 10 === 1
      ? 'st'
      : day % 10 === 2
        ? 'nd'
        : day % 10 === 3
        ? 'rd'
        : 'th';
  const monthLabel = months[month - 1] ?? new Intl.DateTimeFormat('en-AU', { month: 'short', timeZone: 'UTC' }).format(date);
  return `${day}${suffix} ${monthLabel}. ${year}`;
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
