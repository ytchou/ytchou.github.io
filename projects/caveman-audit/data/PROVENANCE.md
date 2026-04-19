# Track C Fixtures — Provenance

Snapshot of upstream Caveman benchmark materials.

- Repo: https://github.com/JuliusBrussee/caveman
- Upstream commit: `84cc3c14fa1e` (2026-04-18)
- Snapshot date: 2026-04-19

## Files

| File | sha256 | Source |
|------|--------|--------|
| `prompts.json` | `773e557f9187363c44e7e5aae2d27268720bcd8772865e119825078b06da93d7` | `benchmarks/prompts.json` |
| `SKILL.md` | `f9c83a2b20fc3b3503af9d1ae1cf2098c9f8c3d326c203c236b160ebe81ac8f0` | `skills/caveman/SKILL.md` |

## Author's baseline system prompt

`"You are a helpful assistant."` — hardcoded in `benchmarks/run.py` as `NORMAL_SYSTEM`.

## Author's benchmark config

- `max_tokens=4096`
- `temperature=0`
- `trials=3` per prompt per mode (median reported)
- Model: `claude-sonnet-4-20250514`
