---
type: "flow"
id: "flow:heed"
title: "The Captain's Heed"
standing: "built"
standing_source: "derived"
source_path: "data/flows.json"
source_line: 66
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "flow:heed"
---

# The Captain's Heed

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

The hinge between the two halves of the game, and the reason the court exists. An order does not arrive and happen. It arrives and is JUDGED, by a man with his own opinion of you, and it comes out the other side as one of seven things. Only one of them is doing what you said. The other six each have a political cause you could have seen coming — a grudge you never settled, a seat you gave to his rival, a season of pay you never sent — which is why every disobedience in this game is heralded with its reason. You are never told 'the order failed'. You are told why.

*Verified verbatim against `data/flows.json`:66 on every lint — no quote, no object.*

## The machine

*A `one order, at the moment it reaches a captain` moves through this, stepped every **event**.*

```text
▶ Weighing It
   └─▶ Obey   — "At once."  [1 guard]
   └─▶ Obey, His Way   — "I'll see it done."  [1 guard]
   └─▶ Drag   — "Presently."  [1 guard]
   └─▶ Hedge   — "Some of us, then."  [1 guard]
   └─▶ Overreach   — "Follow me!"  [1 guard]
   └─▶ Hard Hedge   — A gesture, and nothing more  [1 guard]
   └─▶ Defy   — "No."  [1 guard]
■ Obey
      (rests here)
■ Obey, His Way
      (rests here)
■ Drag
      (rests here)
■ Hedge
      (rests here)
■ Overreach
      (rests here)
■ Hard Hedge
      (rests here)
■ Defy
      (rests here)
```

*▶ where a case enters  ·  ■ where it comes to rest and never leaves  ·  · everywhere else*

## Every state it can be in

| state | in the engine | what you would see | role |
|---|---|---|---|
| [[Weighing It]] | *no single named value in the tree yet* | A captain reading a scrap of paper, then looking at the ground in front of him, then at his own men. | **entry** |
| [[Obey]] | `OBEY` | It simply happens. | **rests here** |
| [[Obey, His Way]] | `OBEY-HIS-WAY` | The thing you asked for, arriving from a direction you did not pick. | **rests here** |
| [[Drag]] | `DRAG` | Nothing, for a while. Then the thing you asked for, too late to matter. | **rests here** |
| [[Hedge]] | `HEDGE` | Half the contingent moves. The other half stays exactly where it was. | **rests here** |
| [[Overreach]] | `OVERREACH` | More than you asked for, going further than you meant, and not stopping. | **rests here** |
| [[Hard Hedge]] | `HARD-HEDGE` | A token gesture in the direction of the order, and no real movement at all. | **rests here** |
| [[Defy]] | `DEFY` | The courier rides back alone. | **rests here** |

## Every way it can move

| from | to | on | must be true | what it costs |
|---|---|---|---|---|
| [[Weighing It]] | [[Obey]] | the heed being computed, on arrival | [[Heed high enough to simply obey]] | none |
| [[Weighing It]] | [[Obey, His Way]] | the heed being computed, on arrival | [[Heed enough to comply, not to conform]] | you do not choose the method |
| [[Weighing It]] | [[Drag]] | the heed being computed, on arrival | [[Heed low enough to stall]] | the moment |
| [[Weighing It]] | [[Hedge]] | the heed being computed, on arrival | [[Heed low enough to stall]] | half the contingent stays home |
| [[Weighing It]] | [[Overreach]] | the heed being computed, on arrival | [[Heed low enough to be a problem]] | control |
| [[Weighing It]] | [[Hard Hedge]] | the heed being computed, on arrival | [[Heed low enough to be a problem]] | the contingent, in all but name |
| [[Weighing It]] | [[Defy]] | the heed being computed, on arrival | [[Heed gone entirely]] | the contingent, and the watching army's opinion of you |

## The numbers

| field | meaning | value |
|---|---|---|
| `carries` | WHAT MOVES through this machine — the case. A battle flow carries the battle; a nerve flow carries one unit. Naming the case is what stops a flow from quietly becoming a list of topics. | `one order, at the moment it reaches a captain` |
| `entry` | The place a case is in the moment it enters the machine. Exactly one per flow. | `heed-weighing` |
| `terminals` | The places a case can come to rest in and never leave. A flow with no terminal never ends, which is a bug in the design, not in the code. | `heed-obey`, `heed-obey-his-way`, `heed-drag`, `heed-hedge`, `heed-overreach`, `heed-hard-hedge`, `heed-defy` |
| `runsEvery` | How often the machine is stepped. 'tick' means twenty times a game-second; 'day' and 'season' are the court's clocks; 'event' means it only moves when something happens to it. | `event` |
| `sourcePath` | The file that IS this machine — where the states are actually assigned. The lint reads it off disk and requires the quote below to appear in it. | `src/battle/types.ts` |
| `quote` | A verbatim line from sourcePath proving the machine is real and not a hopeful diagram. No quote, no object. | `export type Interpretation =` |

*Shelf: `flows` in `data/flows.json`.*

## Modules

- [[src/battle/index.ts]] — *this page names `Interpretation`*
- [[src/battle/types.ts]] — *this page names `Interpretation`*

## place

- [[Defy]] — *its `terminals` names `heed-defy` by id*
- [[Drag]] — *its `terminals` names `heed-drag` by id*
- [[Hard Hedge]] — *its `terminals` names `heed-hard-hedge` by id*
- [[Hedge]] — *its `terminals` names `heed-hedge` by id*
- [[Obey]] — *its `terminals` names `heed-obey` by id*
- [[Obey, His Way]] — *its `terminals` names `heed-obey-his-way` by id*
- [[Overreach]] — *its `terminals` names `heed-overreach` by id*
- [[Weighing It]] — *its `entry` names `heed-weighing` by id*

## Backlinks

### guard

- [[Heed enough to comply, not to conform]] — *its `flow` names `heed` by id*
- [[Heed gone entirely]] — *its `flow` names `heed` by id*
- [[Heed high enough to simply obey]] — *its `flow` names `heed` by id*
- [[Heed low enough to be a problem]] — *its `flow` names `heed` by id*
- [[Heed low enough to stall]] — *its `flow` names `heed` by id*

### place

- [[Defy]] — *its `flow` names `heed` by id*
- [[Drag]] — *its `flow` names `heed` by id*
- [[Hard Hedge]] — *its `flow` names `heed` by id*
- [[Hedge]] — *its `flow` names `heed` by id*
- [[Obey]] — *its `flow` names `heed` by id*
- [[Obey, His Way]] — *its `flow` names `heed` by id*
- [[Overreach]] — *its `flow` names `heed` by id*
- [[Weighing It]] — *its `flow` names `heed` by id*

### transition

- [["At once."]] — *its `flow` names `heed` by id*
- [["Follow me!"]] — *its `flow` names `heed` by id*
- [["I'll see it done."]] — *its `flow` names `heed` by id*
- [["No."]] — *its `flow` names `heed` by id*
- [["Presently."]] — *its `flow` names `heed` by id*
- [["Some of us, then."]] — *its `flow` names `heed` by id*
- [[A gesture, and nothing more]] — *its `flow` names `heed` by id*

## Sources this page cites

*Files this page names by path. Again: a citation of the file, nothing more.*

- [[src/battle/types.ts]]

---

*Generated by `tools/codex/emit.mjs` from `data/flows.json`:66. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
