# Day 02 — author's three pillars (2026-09-14) + verified Formoria facts

## Author's words (paraphrase into zh-TW; keep the stance)

Opener (author-final, already in the file): Occam's razor — use the simplest way that solves the problem, not AI for AI's sake; today = translate the business problem into technical needs, compare a few solutions, and clarify where AI adds real value.

Pillar 1 — the AI agents that power the curation worker. Without AI agents we need deterministic steps, different crawlers, lots of edge cases since everyone builds their site differently. AI helps generalize the solution more easily and simply, and we improve it with the hill-climbing idea (run → measure → fix → re-run).

Pillar 2 — the search problem. The simplest search is a name match or text match. But people search for scenarios and ideas, not categories: 「露營要帶、可以裝熱水的杯子」「送給剛滿 30 歲、喜歡有點特別的東西的朋友」. It is about scenarios and taste. Most search sits on text matching or category filtering and maximizes click-through; we focus on relevance instead.

Pillar 3 — the exploration/discovery problem. Search relies on people knowing what they are looking for; a Google search bar needs you to type something and know how to type it. Often people do not know; they browse, see something, click, learn, and only then realize "this exists and it matches what I need". Search works but is not the best. Pinkoi, Pinterest, Faire, Amazon, Shopee all have a discovery layer that shows information proactively without you typing. Most build it to sell: newest product, promotion campaign, live streaming; top sellers, still maximizing revenue. If our discovery layer does not maximize revenue, what does it do? Maximize relevance, show things by scenario, and design data schemas that serve both the search layer and the discovery layer.

## Verified facts from the Formoria repo (use sparingly; the reader is outside — no file paths, ticket IDs, ADR names)

Curation worker, URL in → brand profile out. Stages that are deterministic code: fetching and HTML extraction, platform adapters (nine of them: Pinkoi, Shopee, myship, Shopline, 91App, Cyberbiz, …), catalog/sitemap walk, link and same-host verification, image ranking and score gate, persistence. Stages that are LLM: brand detection/classification (batched, only writes at high confidence), name arbitration, image classification (vision model returns keep/reject + tag + reasons), product proposal (agent: select → read → propose → verify-in-code → repair once), editorial text (descriptions, facts, FAQ; generated, then code-validated, one repair turn).

The orchestrating agent (the "configurator"): given a brand URL and what the first probes return, it plans per surface: fetch statically, render with a browser, or skip; which strategy (official site, social, e-commerce storefront, deep multi-page, single page); at most 6 fetch targets; logs every skip as a decision. A critique step judges the result sufficient / thin / fail and can trigger recovery (fan out, search, render). Agentic because the next fetch depends on what the last fetch returned.

Why rules broke (evidence):
- The old router was a domain list + a three-signal score + nine adapters; every unknown host returned an empty result. 41 of 298 approved brands are Instagram-only and got an empty scrape.
- Coverage only grew by adding list entries. Each platform quirk became one more rule: Pinkoi tracking parameters in product URLs, Pinkoi product images lost, listing pages hiding nested product URLs, Shopline/91App evidence recovery.
- No string algorithm settles brand identity: S'MORE vs smore.com scores 1.0 similarity and is wrong; Chinese-only brand names have no Latin string to compare at all. 91 of 109 Han-only-named brands had an unchecked purchase website.
- 1,048 proposed products, 93% ticked by moderators, 0 link-checked, 0 origin-confirmed, 40 without an image → products became a propose/verify/repair loop.
- About 350 lines of heuristic fallback were deleted once the agent proved out.

Improvement loop (exists): every model call is audited (payload, response, latency, cost per model) and traced in Langfuse; golden replay with pure scorers, and blinded pairwise A/B with human votes. Hill-climb loop: 30-brand optimization set + 10 frozen holdouts, one hypothesis per change, baseline 28/30 → 29/30, holdout 9/10, ~US$0.02 per brand for the eval run. Drift monitoring is planned, not built.

Search (exists): hybrid product search — pgvector embeddings + lexical full-text/trigram, with rerank; corpus is published curated products only, brands are context inside the product document. Trail: ilike → pg_trgm → FTS first with trigram fallback → CJK bigrams. Taxonomy: 12 L1 categories × 164 L2 subcategories (use axis), a material axis, a gifting facet; story tags.

Discovery surfaces (exist): brand directory with filters; categories; /discover search + grid; Discovery Trails (narrative pages joined to hand-curated product selections with a written rationale per pick); stories; homepage masonry wall with rotation cadence and eligibility rules; favorites.

## Day ownership (preview only in Day 02)
Day 03 taxonomy · Day 04 wireframing · Day 05 data thesis · Day 06 one agent vs lego bricks · Day 07 code vs LLM · Day 08 pipeline walkthrough · Day 09–10 configurator agent · Day 11 structured output · Day 12 brand-feel scoring · Day 13 eval golden datasets · Day 14 cross-model eval · Day 15 hill climbing · Day 16 tracing · Day 17 cost · Day 18 semantic search · Day 19 retrieval eval · Day 22–24 SEO/AEO (being found from outside) · Day 27–28 instrumentation and weekly review.
