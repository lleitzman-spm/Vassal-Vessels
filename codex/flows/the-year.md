---
type: "flow"
id: "flow:year"
title: "The Year"
standing: "built"
standing_source: "derived"
source_path: "data/flows.json"
source_line: 139
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "flow:year"
---

# The Year

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

Four seasons of ninety days, turning forever. The year is a machine rather than a backdrop because WHEN you call your men is one of the sharpest decisions in the game: calling in seedtime costs the sowing and a sixth of the year's food, calling in harvest makes farmers hate you, and calling in wolfmoon means arriving tired on bad roads. There is no season that is good for everything. Highsun is the obvious one, which is exactly why an idle summer costs you standing — the host wanted to be led, and you did not lead it.

*Verified verbatim against `data/flows.json`:139 on every lint — no quote, no object.*

## The machine

*A `the realm` moves through this, stepped every **season**.*

```text
▶ Seedtime
   └─▶ Highsun   — The roads dry  [1 guard]
· Highsun
   └─▶ Harvest   — The fields come in  [1 guard]
· Harvest
   └─▶ Wolfmoon   — The cold comes  [1 guard]
· Wolfmoon
   └─▶ Seedtime   — The year turns  [1 guard]
```

*▶ where a case enters  ·  ■ where it comes to rest and never leaves  ·  · everywhere else*

## Every state it can be in

| state | in the engine | what you would see | role |
|---|---|---|---|
| [[Seedtime]] | `seedtime` | Mud, empty barns, and men who want to be planting. | **entry** |
| [[Highsun]] | `highsun` | Dry roads, long days, and everyone expecting a war. | — |
| [[Harvest]] | `harvest` | Full fields and men looking at them instead of at you. | — |
| [[Wolfmoon]] | `wolfmoon` | Short days, hard ground, and nothing at all to eat off the land. | — |

## Every way it can move

| from | to | on | must be true | what it costs |
|---|---|---|---|---|
| [[Seedtime]] | [[Highsun]] | ninety days passing | [[Ninety days pass]] | none |
| [[Highsun]] | [[Harvest]] | ninety days passing | [[Ninety days pass]] | an idle summer costs standing |
| [[Harvest]] | [[Wolfmoon]] | ninety days passing | [[Ninety days pass]] | none |
| [[Wolfmoon]] | [[Seedtime]] | ninety days passing | [[Ninety days pass]] | none |

## The numbers

| field | meaning | value |
|---|---|---|
| `carries` | WHAT MOVES through this machine — the case. A battle flow carries the battle; a nerve flow carries one unit. Naming the case is what stops a flow from quietly becoming a list of topics. | `the realm` |
| `entry` | The place a case is in the moment it enters the machine. Exactly one per flow. | `year-seedtime` |
| `terminals` | The places a case can come to rest in and never leave. A flow with no terminal never ends, which is a bug in the design, not in the code. | *none* |
| `runsEvery` | How often the machine is stepped. 'tick' means twenty times a game-second; 'day' and 'season' are the court's clocks; 'event' means it only moves when something happens to it. | `season` |
| `sourcePath` | The file that IS this machine — where the states are actually assigned. The lint reads it off disk and requires the quote below to appear in it. | `src/court/calendar.ts` |
| `quote` | A verbatim line from sourcePath proving the machine is real and not a hopeful diagram. No quote, no object. | `export function seasonAt(index: number): SeasonId {` |
| `implementsLaw` | The numbered law in `docs/KINGDOM.md` this machine exists to carry out. Claimed only where the machine IS the law's mechanism, not merely consistent with it — law 10 ('there is no player character') is a constraint on what the game leaves out, so no flow implements it and none pretends to. | `1` |

*Shelf: `flows` in `data/flows.json`.*

## Rules that govern it

- [[Law 1 — Records in, readings out]] — *its `implementsLaw` names `1` by id*

## Seasons

- [[Harvest (season)]] — *this page names "Harvest" literally*
- [[Highsun (season)]] — *this page names "Highsun" literally*
- [[Seedtime (season)]] — *this page names "Seedtime" literally*
- [[Wolfmoon (season)]] — *this page names "Wolfmoon" literally*

## Modules

- [[src/core/contract.ts]] — *this page names `SeasonId`*
- [[src/core/primitives.ts]] — *this page names `SeasonId`*
- [[src/court/calendar.ts]] — *this page names `seasonAt`*
- [[src/court/index.ts]] — *this page names `seasonAt`; this page names `SeasonId`*

## place

- [[Seedtime]] — *its `entry` names `year-seedtime` by id*

## Backlinks

### guard

- [[Ninety days pass]] — *its `flow` names `year` by id*

### place

- [[Harvest]] — *its `flow` names `year` by id*
- [[Highsun]] — *its `flow` names `year` by id*
- [[Seedtime]] — *its `flow` names `year` by id*
- [[Wolfmoon]] — *its `flow` names `year` by id*

### transition

- [[The cold comes]] — *its `flow` names `year` by id*
- [[The fields come in]] — *its `flow` names `year` by id*
- [[The roads dry]] — *its `flow` names `year` by id*
- [[The year turns]] — *its `flow` names `year` by id*

## Sources this page cites

*Files this page names by path. Again: a citation of the file, nothing more.*

- [[src/court/calendar.ts]]

---

*Generated by `tools/codex/emit.mjs` from `data/flows.json`:139. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
