---
type: "flow"
id: "flow:footing"
title: "A Unit's Footing"
standing: "built"
standing_source: "derived"
source_path: "data/flows.json"
source_line: 52
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "flow:footing"
---

# A Unit's Footing

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

What a unit is DOING with its weapons, as distinct from where it is standing. This is the smallest machine in the game and one of the most punishing, because bracing is the single thing that stops a horse and it is not free: it takes time to set, it only works to the front, and it is lost the moment the unit moves. Nearly every cavalry disaster in this game is a spear line that was caught in NONE, and nearly every cavalry disaster on the other side is a commander who charged one that was in BRACED.

*Verified verbatim against `data/flows.json`:52 on every lint — no quote, no object.*

## The machine

*A `one unit` moves through this, stepped every **tick**.*

```text
▶ Loose Footing
   └─▶ Braced   — Set!
   └─▶ Shooting   — Loose!
   └─▶ Staked   — Stakes in
· Braced
   └─▶ Loose Footing   — They come off the brace
· Shooting
   └─▶ Loose Footing   — Hold!
· Staked
   └─▶ Loose Footing   — They leave the stakes
```

*▶ where a case enters  ·  ■ where it comes to rest and never leaves  ·  · everywhere else*

## Every state it can be in

| state | in the engine | what you would see | role |
|---|---|---|---|
| [[Loose Footing]] | `NONE` | Weapons carried, not set. Men shifting their feet. | **entry** |
| [[Braced]] | `BRACED` | Butts in the earth, points level, absolutely still. | — |
| [[Shooting]] | `SHOOTING` | Volleys going out on a rhythm; men reaching for the quiver between them. | — |
| [[Staked]] | `STAKED` | A hedge of sharpened poles in the ground, angled outward at a horse's chest. | — |

## Every way it can move

| from | to | on | must be true | what it costs |
|---|---|---|---|---|
| [[Loose Footing]] | [[Braced]] | a brace order, or a standing plan firing on cavalry closing | *nothing — it fires on the event alone* | the unit must be stationary, and stays stationary |
| [[Loose Footing]] | [[Shooting]] | a shoot order, or a plan with a target in range | *nothing — it fires on the event alone* | ammunition, which does not come back |
| [[Loose Footing]] | [[Staked]] | a plant-stakes order | *nothing — it fires on the event alone* | a long stretch of doing nothing else |
| [[Braced]] | [[Loose Footing]] | the unit moving, or being ordered elsewhere | *nothing — it fires on the event alone* | all refusal, immediately |
| [[Shooting]] | [[Loose Footing]] | a cease order, running dry, or nothing left worth shooting at | *nothing — it fires on the event alone* | none |
| [[Staked]] | [[Loose Footing]] | the unit advancing off its position | *nothing — it fires on the event alone* | the stakes, which stay where they are |

## The numbers

| field | meaning | value |
|---|---|---|
| `carries` | WHAT MOVES through this machine — the case. A battle flow carries the battle; a nerve flow carries one unit. Naming the case is what stops a flow from quietly becoming a list of topics. | `one unit` |
| `entry` | The place a case is in the moment it enters the machine. Exactly one per flow. | `footing-none` |
| `terminals` | The places a case can come to rest in and never leave. A flow with no terminal never ends, which is a bug in the design, not in the code. | *none* |
| `runsEvery` | How often the machine is stepped. 'tick' means twenty times a game-second; 'day' and 'season' are the court's clocks; 'event' means it only moves when something happens to it. | `tick` |
| `sourcePath` | The file that IS this machine — where the states are actually assigned. The lint reads it off disk and requires the quote below to appear in it. | `src/battle/types.ts` |
| `quote` | A verbatim line from sourcePath proving the machine is real and not a hopeful diagram. No quote, no object. | `export type Posture = "NONE" | "BRACED" | "SHOOTING" | "STAKED";` |
| `implementsLaw` | The numbered law in `docs/KINGDOM.md` this machine exists to carry out. Claimed only where the machine IS the law's mechanism, not merely consistent with it — law 10 ('there is no player character') is a constraint on what the game leaves out, so no flow implements it and none pretends to. | `5`, `6` |

*Shelf: `flows` in `data/flows.json`.*

## Rules that govern it

- [[Law 5 — Physics, not tables]] — *its `implementsLaw` names `5` by id*
- [[Law 6 — Everything is legible on the field]] — *its `implementsLaw` names `6` by id*

## place

- [[Loose Footing]] — *its `entry` names `footing-none` by id*

## Backlinks

### place

- [[Braced]] — *its `flow` names `footing` by id*
- [[Loose Footing]] — *its `flow` names `footing` by id*
- [[Shooting]] — *its `flow` names `footing` by id*
- [[Staked]] — *its `flow` names `footing` by id*

### token

- [[Arrows]] — *its `flow` names `footing` by id*

### transition

- [[Hold!]] — *its `flow` names `footing` by id*
- [[Loose!]] — *its `flow` names `footing` by id*
- [[Set!]] — *its `flow` names `footing` by id*
- [[Stakes in]] — *its `flow` names `footing` by id*
- [[They come off the brace]] — *its `flow` names `footing` by id*
- [[They leave the stakes]] — *its `flow` names `footing` by id*

## Sources this page cites

*Files this page names by path. Again: a citation of the file, nothing more.*

- [[src/battle/types.ts]]

---

*Generated by `tools/codex/emit.mjs` from `data/flows.json`:52. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
