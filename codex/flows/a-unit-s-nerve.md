---
type: "flow"
id: "flow:nerve"
title: "A Unit's Nerve"
standing: "built"
standing_source: "derived"
source_path: "data/flows.json"
source_line: 34
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "flow:nerve"
---

# A Unit's Nerve

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

The machine the whole battle is really about. Men do not fight until they are dead; they fight until they are frightened, and then they leave. A unit slides down through STEADY, SHAKEN and WAVERING as its nerve goes, and the slide is sticky in both directions — it takes a real change to move a unit up or down a step, so a line does not flicker between brave and terrified on a single lucky arrow. Below the breaking point there is no stickiness at all: breaking is breaking, and it happens the instant the number is reached. A broken unit may turn and stand ONCE. Twice-broken men are done for the day, and no amount of shouting brings them back.

*Verified verbatim against `data/flows.json`:34 on every lint — no quote, no object.*

## The machine

*A `one unit` moves through this, stepped every **tick**.*

```text
▶ Steady
   └─▶ Shaken   — They begin to feel it  [1 guard]
   └─▶ Routing   — They break  [1 guard]
   └─▶ Destroyed   — They are destroyed where they stood  [1 guard]
· Shaken
   └─▶ Wavering   — The back ranks start to drift  [1 guard]
   └─▶ Steady   — They are themselves again  [1 guard]
   └─▶ Routing   — They break  [1 guard]
   └─▶ Destroyed   — They are destroyed where they stood  [1 guard]
· Routing
   └─▶ Rallying   — They turn and stand  [4 guards]
   └─▶ Fled   — They are gone  [1 guard]
   └─▶ Destroyed   — They are destroyed where they stood  [1 guard]
■ Destroyed
      (rests here)
· Wavering
   └─▶ Shaken   — They get a grip  [1 guard]
   └─▶ Routing   — They break  [1 guard]
   └─▶ Destroyed   — They are destroyed where they stood  [1 guard]
· Rallying
   └─▶ Shaken   — They re-form  [1 guard]
   └─▶ Destroyed   — They are destroyed where they stood  [1 guard]
■ Fled
      (rests here)
```

*▶ where a case enters  ·  ■ where it comes to rest and never leaves  ·  · everywhere else*

## Every state it can be in

| state | in the engine | what you would see | role |
|---|---|---|---|
| [[Steady]] | `STEADY` | A straight line, level weapons, men looking forward. | **entry** |
| [[Shaken]] | `SHAKEN` | The line thickens and loses its edge; men glance sideways at each other rather than forward. | — |
| [[Routing]] | `ROUTING` | The unit stops being a unit. Men drop shields and run, and they run faster than they ever moved forward. | — |
| [[Destroyed]] | `DESTROYED` | A shape on the ground where a unit used to be. | **rests here** |
| [[Wavering]] | `WAVERING` | The back ranks start drifting rearward while the front ranks are still swinging. The unit gets visibly deeper and narrower. | — |
| [[Rallying]] | `RALLYING` | The running stops. Men turn round, out of breath, and start finding each other again. | — |
| [[Fled]] | `FLED` | Gone. Dust on the road out. | **rests here** |

## Every way it can move

| from | to | on | must be true | what it costs |
|---|---|---|---|---|
| [[Steady]] | [[Shaken]] | the morale check, every tick | [[Nerve starts to go]] | the unit fights and moves slightly worse |
| [[Steady]] | [[Routing]] | the morale check, every tick | [[Nerve gives out]] | all cohesion, the current order, and any posture — thrown away at once |
| [[Steady]] | [[Destroyed]] | the strength check, before anything else in the machine | [[Nothing left to break]] | the unit, permanently |
| [[Shaken]] | [[Wavering]] | the morale check, every tick | [[About to go]] | the unit is one bad moment from breaking |
| [[Shaken]] | [[Steady]] | the morale check, every tick | [[Nerve comes back]] | none |
| [[Shaken]] | [[Routing]] | the morale check, every tick | [[Nerve gives out]] | all cohesion, the current order, and any posture — thrown away at once |
| [[Shaken]] | [[Destroyed]] | the strength check, before anything else in the machine | [[Nothing left to break]] | the unit, permanently |
| [[Routing]] | [[Rallying]] | the rally check | [[Has a second chance left]]; [[Nerve back, and held there]]; [[Nobody close enough to kill them]]; [[A captain, or home ground]] | the unit's one and only second chance |
| [[Routing]] | [[Fled]] | running long enough with no rally left | [[Has a second chance left]] | the unit, for the rest of the day |
| [[Routing]] | [[Destroyed]] | the strength check, before anything else in the machine | [[Nothing left to break]] | the unit, permanently |
| [[Wavering]] | [[Shaken]] | the morale check, every tick | [[Nerve starts to go]] | none |
| [[Wavering]] | [[Routing]] | the morale check, every tick | [[Nerve gives out]] | all cohesion, the current order, and any posture — thrown away at once |
| [[Wavering]] | [[Destroyed]] | the strength check, before anything else in the machine | [[Nothing left to break]] | the unit, permanently |
| [[Rallying]] | [[Shaken]] | the rally hold completing | [[Nerve back, and held there]] | the second chance is now spent |
| [[Rallying]] | [[Destroyed]] | the strength check, before anything else in the machine | [[Nothing left to break]] | the unit, permanently |

## The numbers

| field | meaning | value |
|---|---|---|
| `carries` | WHAT MOVES through this machine — the case. A battle flow carries the battle; a nerve flow carries one unit. Naming the case is what stops a flow from quietly becoming a list of topics. | `one unit` |
| `entry` | The place a case is in the moment it enters the machine. Exactly one per flow. | `nerve-steady` |
| `terminals` | The places a case can come to rest in and never leave. A flow with no terminal never ends, which is a bug in the design, not in the code. | `nerve-fled`, `nerve-destroyed` |
| `runsEvery` | How often the machine is stepped. 'tick' means twenty times a game-second; 'day' and 'season' are the court's clocks; 'event' means it only moves when something happens to it. | `tick` |
| `sourcePath` | The file that IS this machine — where the states are actually assigned. The lint reads it off disk and requires the quote below to appear in it. | `src/battle/phase-morale.ts` |
| `quote` | A verbatim line from sourcePath proving the machine is real and not a hopeful diagram. No quote, no object. | `function transition(state: BattleState, log: LogWriter, u: Unit): void {` |
| `implementsLaw` | The numbered law in `docs/KINGDOM.md` this machine exists to carry out. Claimed only where the machine IS the law's mechanism, not merely consistent with it — law 10 ('there is no player character') is a constraint on what the game leaves out, so no flow implements it and none pretends to. | `5`, `6` |

*Shelf: `flows` in `data/flows.json`.*

## Rules that govern it

- [[Law 5 — Physics, not tables]] — *its `implementsLaw` names `5` by id*
- [[Law 6 — Everything is legible on the field]] — *its `implementsLaw` names `6` by id*

## Quirks

- [[May Turn]] — *this page names "May Turn" literally*

## Modules

- [[src/battle/index.ts]] — *this page names `BattleState`*
- [[src/battle/log.ts]] — *this page names `LogWriter`*
- [[src/battle/types.ts]] — *this page names `BattleState`*

## place

- [[Destroyed]] — *its `terminals` names `nerve-destroyed` by id*
- [[Fled]] — *its `terminals` names `nerve-fled` by id*
- [[Steady]] — *its `entry` names `nerve-steady` by id*

## Backlinks

### guard

- [[A captain, or home ground]] — *its `flow` names `nerve` by id*
- [[About to go]] — *its `flow` names `nerve` by id*
- [[Has a second chance left]] — *its `flow` names `nerve` by id*
- [[Nerve back, and held there]] — *its `flow` names `nerve` by id*
- [[Nerve comes back]] — *its `flow` names `nerve` by id*
- [[Nerve gives out]] — *its `flow` names `nerve` by id*
- [[Nerve starts to go]] — *its `flow` names `nerve` by id*
- [[Nobody close enough to kill them]] — *its `flow` names `nerve` by id*
- [[Nothing left to break]] — *its `flow` names `nerve` by id*

### place

- [[Destroyed]] — *its `flow` names `nerve` by id*
- [[Fled]] — *its `flow` names `nerve` by id*
- [[Rallying]] — *its `flow` names `nerve` by id*
- [[Routing]] — *its `flow` names `nerve` by id*
- [[Shaken]] — *its `flow` names `nerve` by id*
- [[Steady]] — *its `flow` names `nerve` by id*
- [[Wavering]] — *its `flow` names `nerve` by id*

### token

- [[Men Standing]] — *its `flow` names `nerve` by id*
- [[Nerve]] — *its `flow` names `nerve` by id*
- [[The Ceiling on Nerve]] — *its `flow` names `nerve` by id*
- [[The Floor Under Nerve]] — *its `flow` names `nerve` by id*
- [[The Second Chance]] — *its `flow` names `nerve` by id*

### transition

- [[The back ranks start to drift]] — *its `flow` names `nerve` by id*
- [[They are destroyed where they stood]] — *its `flow` names `nerve` by id*
- [[They are gone]] — *its `flow` names `nerve` by id*
- [[They are themselves again]] — *its `flow` names `nerve` by id*
- [[They begin to feel it]] — *its `flow` names `nerve` by id*
- [[They break]] — *its `flow` names `nerve` by id*
- [[They get a grip]] — *its `flow` names `nerve` by id*
- [[They re-form]] — *its `flow` names `nerve` by id*
- [[They turn and stand]] — *its `flow` names `nerve` by id*

## Sources this page cites

*Files this page names by path. Again: a citation of the file, nothing more.*

- [[src/battle/phase-morale.ts]]

---

*Generated by `tools/codex/emit.mjs` from `data/flows.json`:34. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
