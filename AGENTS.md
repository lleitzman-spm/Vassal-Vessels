# AGENTS.md — Codex harness adapter, not a second authority

Codex auto-loads `AGENTS.md`; Claude Code auto-loads `CLAUDE.md`. This file exists
only to bridge those harnesses.

**`CLAUDE.md` is the sole tracked source of standing project rules. Read it
completely before acting and follow its reading order.** In generic workflow
language, “the active primary agent” means whichever harness is running this
session. Named models and tools are capability choices only when the current
harness actually exposes them.

Do not copy standing rules, task priorities, project structure, design law, or
status into this file. A copied rule can drift and become another competing
standard. If this adapter ever disagrees with `CLAUDE.md`, `CLAUDE.md` wins.
