import type { CollectionEntry } from 'astro:content';

export const resourceGroups = [
  'interface-web-inspiration',
  'brand-editorial-social',
  'typography',
  'component-discovery',
  'foundations',
  'motion-expressive-ui',
  'visualization-diagramming',
  'icons-supporting-tools',
  'agentic-security',
] as const;
export type ResourceGroup = typeof resourceGroups[number];
export const resourceTopics = ['design', 'security'] as const;
export type ResourceTopic = typeof resourceTopics[number];
export type ResourceEntry = CollectionEntry<'resources'>;

export function groupResources(resources: ResourceEntry[]): Map<ResourceGroup, ResourceEntry[]> {
  return new Map(resourceGroups.map(group => [
    group,
    resources.filter(resource => resource.data.group === group),
  ]));
}

export function getCollectionFreshness(resources: ResourceEntry[]): Date | undefined {
  if (resources.length === 0) return undefined;
  return new Date(Math.min(...resources.map(resource => resource.data.lastCheckedDate.valueOf())));
}
