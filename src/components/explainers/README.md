# Explainer demos

- Put each topic's React components in `src/components/explainers/<slug>/`.
- Give each demo's root element `data-asset="<id>"`, using its asset ID.
- Import from a post with `@explainers/<slug>/<Component>` and hydrate with `client:visible`:

  ```mdx
  import Example from '@explainers/_example/Example';

  <Example client:visible />
  ```

- Pass every claim-derived value as a prop; do not embed researched numbers in component code.
- Make no network fetches. Use only the supplied props and local interaction state.
- Render a default state that communicates the takeaway without JavaScript; use SSR, not `client:only`.
- Use native keyboard-operable controls, label every input, expose toggle state with `aria-pressed`, and preserve visible keyboard focus. Touch targets must be at least 48px.
- Reuse the site's semantic color tokens and Tailwind spacing scale. Keep body-text contrast at least 4.5:1 and never communicate information through color alone.
- Honor `prefers-reduced-motion`: disable nonessential animation and transitions. Prefer no motion when it adds no meaning.
- Keep each demo's JavaScript within **60 KB gzip**; the pipeline's render check enforces this budget.
- Keep posts marked `draft: true` while reviewing. Use `PREVIEW_DRAFTS=1 npm run dev` or `PREVIEW_DRAFTS=1 npm run build` locally; leave the switch unset for production builds.
