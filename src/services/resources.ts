import type { CollectionEntry } from 'astro:content';

export const resourceGroups = [
  'inspiration',
  'components-motion',
  'type-icons-diagrams',
  'design-engineering',
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
