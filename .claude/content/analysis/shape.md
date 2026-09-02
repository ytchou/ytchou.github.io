# Portfolio analysis — shape

length_unit: auto
length_min_cjk: 1500
length_max_cjk: 6000
length_min_words: 900
length_max_words: 5000
images_min: 0
images_max: 10

Data-heavy pieces carry more charts than the Ironman line and have no upper
cadence pressure. Length is wide because a methodology write-up and a
sabermetrics argument are different sizes.

`length_unit: auto` resolves per article from its `lang` frontmatter — CJK
characters for `zh`, words for `en`. This line publishes in both, so a fixed
unit would fail every article in the other language.

Bounds are declared per unit because the same article runs roughly 1.7 CJK
characters per English word — one shared range would be wrong for one language
whichever way it was set. `length_min`/`length_max` remain available as a
fallback for single-language lines (the Ironman pack uses them).

## Expected sections

Hook → the claim being tested → method → results → what complicates the result
→ what it means → what remains open. Reorder freely; do not skip method.
