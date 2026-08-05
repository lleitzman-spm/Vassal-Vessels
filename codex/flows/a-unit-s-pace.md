---
type: "flow"
id: "flow:pace"
title: "A Unit's Pace"
standing: "built"
standing_source: "derived"
source_path: "data/flows.json"
source_line: 55
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "flow:pace"
---

# A Unit's Pace

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

How fast a unit is going, which decides three things at once: how quickly it arrives, how fast it tires, and — the one that decides battles — how hard it hits. Shock scales with the SQUARE of closing speed, so the difference between arriving at a run and arriving at a charge is not a little more damage, it is roughly double. ROUT is the odd one out: it is the fastest tier and nobody chooses it.

*Verified verbatim against `data/flows.json`:55 on every lint — no quote, no object.*

## The machine

*A `one unit` moves through this, stepped every **tick**.*

```text
▶ Halted
   └─▶ Walking   — They step off
   └─▶ Fleeing   — They run the other way  [1 guard]
· Walking
   └─▶ Advancing   — They pick it up
   └─▶ Halted   — Halt
   └─▶ Fleeing   — They run the other way  [1 guard]
· Fleeing
   └─▶ Halted   — The running stops  [1 guard]
· Advancing
   └─▶ Running   — They run
   └─▶ Halted   — Halt
   └─▶ Fleeing   — They run the other way  [1 guard]
· Running
   └─▶ Charging   — Charge!
   └─▶ Halted   — Halt
   └─▶ Fleeing   — They run the other way  [1 guard]
· Charging
   └─▶ Halted   — Halt
   └─▶ Fleeing   — They run the other way  [1 guard]
```

*▶ where a case enters  ·  ■ where it comes to rest and never leaves  ·  · everywhere else*

## Every state it can be in

| state | in the engine | what you would see | role |
|---|---|---|---|
| [[Halted]] | `STOP` | Standing. | **entry** |
| [[Walking]] | `WALK` | An ordinary marching pace, ranks intact. | — |
| [[Fleeing]] | `ROUT` | Faster than any of them ever moved toward the enemy. | — |
| [[Advancing]] | `ADVANCE` | Purposeful, faster than a walk, the line still recognisably a line. | — |
| [[Running]] | `RUN` | The line frays at the edges; the fit men pull ahead of the tired ones. | — |
| [[Charging]] | `CHARGE` | Everything committed, at speed, aimed at one thing. | — |

## Every way it can move

| from | to | on | must be true | what it costs |
|---|---|---|---|---|
| [[Halted]] | [[Walking]] | any movement order | *nothing — it fires on the event alone* | cohesion recovery stops |
| [[Halted]] | [[Fleeing]] | the unit's nerve giving out | [[Nerve gives out]] | everything |
| [[Walking]] | [[Advancing]] | an advance order | *nothing — it fires on the event alone* | a little cohesion and fatigue |
| [[Walking]] | [[Halted]] | a halt order, reaching the objective, or contact | *nothing — it fires on the event alone* | none — and standing still is where cohesion comes back |
| [[Walking]] | [[Fleeing]] | the unit's nerve giving out | [[Nerve gives out]] | everything |
| [[Fleeing]] | [[Halted]] | the unit rallying | [[Nerve back, and held there]] | none |
| [[Advancing]] | [[Running]] | an urgent order, or a plan firing | *nothing — it fires on the event alone* | real cohesion and real fatigue |
| [[Advancing]] | [[Halted]] | a halt order, reaching the objective, or contact | *nothing — it fires on the event alone* | none — and standing still is where cohesion comes back |
| [[Advancing]] | [[Fleeing]] | the unit's nerve giving out | [[Nerve gives out]] | everything |
| [[Running]] | [[Charging]] | a charge order, inside charging distance | *nothing — it fires on the event alone* | the most expensive move on the table, whether it lands or not |
| [[Running]] | [[Halted]] | a halt order, reaching the objective, or contact | *nothing — it fires on the event alone* | none — and standing still is where cohesion comes back |
| [[Running]] | [[Fleeing]] | the unit's nerve giving out | [[Nerve gives out]] | everything |
| [[Charging]] | [[Halted]] | a halt order, reaching the objective, or contact | *nothing — it fires on the event alone* | none — and standing still is where cohesion comes back |
| [[Charging]] | [[Fleeing]] | the unit's nerve giving out | [[Nerve gives out]] | everything |

## The numbers

| field | meaning | value |
|---|---|---|
| `carries` | WHAT MOVES through this machine — the case. A battle flow carries the battle; a nerve flow carries one unit. Naming the case is what stops a flow from quietly becoming a list of topics. | `one unit` |
| `entry` | The place a case is in the moment it enters the machine. Exactly one per flow. | `pace-stop` |
| `terminals` | The places a case can come to rest in and never leave. A flow with no terminal never ends, which is a bug in the design, not in the code. | *none* |
| `runsEvery` | How often the machine is stepped. 'tick' means twenty times a game-second; 'day' and 'season' are the court's clocks; 'event' means it only moves when something happens to it. | `tick` |
| `sourcePath` | The file that IS this machine — where the states are actually assigned. The lint reads it off disk and requires the quote below to appear in it. | `src/battle/types.ts` |
| `quote` | A verbatim line from sourcePath proving the machine is real and not a hopeful diagram. No quote, no object. | `export type SpeedTier = "STOP" | "WALK" | "ADVANCE" | "RUN" | "CHARGE" | "ROUT";` |

*Shelf: `flows` in `data/flows.json`.*

## Orders

- [[Advance]] — *this page names "Advance" literally*
- [[Charge]] — *this page names "Charge" literally*

## Modules

- [[src/battle/types.ts]] — *this page names `SpeedTier`*

## place

- [[Halted]] — *its `entry` names `pace-stop` by id*

## Backlinks

### place

- [[Advancing]] — *its `flow` names `pace` by id*
- [[Charging]] — *its `flow` names `pace` by id*
- [[Fleeing]] — *its `flow` names `pace` by id*
- [[Halted]] — *its `flow` names `pace` by id*
- [[Running]] — *its `flow` names `pace` by id*
- [[Walking]] — *its `flow` names `pace` by id*

### token

- [[Cohesion]] — *its `flow` names `pace` by id*
- [[Fatigue]] — *its `flow` names `pace` by id*

### transition

- [[Charge!]] — *its `flow` names `pace` by id*
- [[Halt]] — *its `flow` names `pace` by id*
- [[The running stops]] — *its `flow` names `pace` by id*
- [[They pick it up]] — *its `flow` names `pace` by id*
- [[They run]] — *its `flow` names `pace` by id*
- [[They run the other way]] — *its `flow` names `pace` by id*
- [[They step off]] — *its `flow` names `pace` by id*

## Sources this page cites

*Files this page names by path. Again: a citation of the file, nothing more.*

- [[src/battle/types.ts]]

---

*Generated by `tools/codex/emit.mjs` from `data/flows.json`:55. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
