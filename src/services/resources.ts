import type { CollectionEntry } from 'astro:content';

export const resourceCategories = ['typography', 'components', 'motion', 'icons', 'accessibility', 'reference'] as const;
export type ResourceCategory = typeof resourceCategories[number];
export type ResourceEntry = CollectionEntry<'resources'>;

const typographyTiers = ['foundation', 'personality', 'display', 'special-use'] as const;

export function sortResources(resources: ResourceEntry[]): ResourceEntry[] {
  return [...resources].sort((a, b) => {
    const categoryOrder = resourceCategories.indexOf(a.data.category) - resourceCategories.indexOf(b.data.category);
    if (categoryOrder !== 0) return categoryOrder;

    if (a.data.category === 'typography' && b.data.category === 'typography') {
      const aTier = a.data.typographyTier ? typographyTiers.indexOf(a.data.typographyTier) : typographyTiers.length;
      const bTier = b.data.typographyTier ? typographyTiers.indexOf(b.data.typographyTier) : typographyTiers.length;
      if (aTier !== bTier) return aTier - bTier;
    }

    return 0;
  });
}

export function groupResources(resources: ResourceEntry[]): Map<ResourceCategory, ResourceEntry[]> {
  const sorted = sortResources(resources);
  return new Map(resourceCategories.map(category => [
    category,
    sorted.filter(resource => resource.data.category === category),
  ]));
}

export function getCollectionFreshness(resources: ResourceEntry[]): Date | undefined {
  if (resources.length === 0) return undefined;
  return new Date(Math.min(...resources.map(resource => resource.data.lastCheckedDate.valueOf())));
}
