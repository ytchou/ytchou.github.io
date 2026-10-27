export function includePost({ data }: { data: { draft: boolean } }): boolean {
  return !data.draft || import.meta.env.PREVIEW_DRAFTS === '1';
}
