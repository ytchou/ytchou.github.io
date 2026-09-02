# iThome Ironman — sources

**Compass first.** Before a drafting session, fetch:

    https://app.notion.com/p/3b50d2d793cf818fb7dfd0885ff8f1ca   (the plan, v5.1)

That page holds the per-day briefs. The skeletons in `content/ironman/` carry
them as a top comment, and `series.md` caches the day map — Notion is newer
whenever the two differ.

The per-day Notion page (frontmatter `notion:`) is the mirror target, and the
Calendar data source `collection://3960d2d7-93cf-8026-9568-000b3fc28900` holds
publish / start / due dates.

Evidence:

    repo:    ~/project/formoria — git log, docs/, src/, docs/decisions/, docs/designs/
    tickets: Linear DEV-1612, 1629, 1644, 1678–1685 (each ticket's description is the design record)
    series:  content/ironman/series.md

Days whose implementation ticket has not landed cannot be drafted past section 3
without inventing results — leave `<!-- TODO -->` markers and say so. Days 27
and 28 draw on live Formoria analytics at publication time, not on anything
committed. Day 21 needs the saved Google snippet screenshot; Day 24 needs the
recorded AEO citation tests.

