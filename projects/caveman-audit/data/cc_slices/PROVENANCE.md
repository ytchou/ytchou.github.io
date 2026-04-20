# CC System Prompt Slices — Provenance

## Source

Reconstructed from Claude Code v2.1.x system prompt content, informed by:

- [Piebald-AI/claude-code-system-prompts](https://github.com/Piebald-AI/claude-code-system-prompts) — canonical extraction from CC's compiled JS source, 110+ files
- [How Claude Code Builds a System Prompt](https://www.dbreunig.com/2026/04/04/how-claude-code-builds-a-system-prompt.html) — Breunig (2026)
- Direct observation of CC's system prompt in active sessions

## Structure

| File | Content | Role |
|---|---|---|
| `behavioral_block.txt` | Identity, rules, coding philosophy, safety, tone, output style | Always-present baseline (slices 1-8 combined) |
| `tooldef_01.txt` | Bash tool definition | Shuffled tool-def chunk |
| `tooldef_02.txt` | Git commit/PR instructions | Shuffled tool-def chunk |
| `tooldef_03.txt` | Edit, Write, Glob tools | Shuffled tool-def chunk |
| `tooldef_04.txt` | Grep, Read tools | Shuffled tool-def chunk |
| `tooldef_05.txt` | Agent tool (subagent launcher) | Shuffled tool-def chunk |
| `tooldef_06.txt` | EnterPlanMode, ExitPlanMode | Shuffled tool-def chunk |
| `tooldef_07.txt` | Skill, ScheduleWakeup, ToolSearch | Shuffled tool-def chunk |
| `tooldef_08.txt` | WebFetch, WebSearch, LSP | Shuffled tool-def chunk |
| `tooldef_09.txt` | Monitor, NotebookEdit, Worktree tools | Shuffled tool-def chunk |
| `tooldef_10.txt` | Task tools, AskUserQuestion, CronCreate, PushNotification | Shuffled tool-def chunk |

## Notes

- Content is representative, not byte-identical to any single CC session's prompt
- CC's actual prompt is dynamically assembled and varies by session (available tools, plugins, user config)
- Tool definition schemas are simplified (description + parameters, no full JSON schema)
- The behavioral block combines CC's instructional sections into a single file for experimental convenience
- Snapshot date: 2026-04-19
