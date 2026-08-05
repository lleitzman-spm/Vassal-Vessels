---
type: "flow"
id: "flow:treachery"
title: "Turning"
standing: "built"
standing_source: "derived"
source_path: "data/flows.json"
source_line: 100
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "flow:treachery"
---

# Turning

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

The worst thing that can happen to you, and it is never a surprise if you were paying attention. A contingent whose treachery number is high enough will first stop pulling its weight, then act against you outright, and finally change sides — but only when the day is already going badly, because a traitor is a coward with arithmetic. Every point of that number came from something on the record: a grudge, a season of unpaid wages, a cousin on the other side. There is no dice roll anywhere in it. If you are betrayed, you could have read it that morning.

*Verified verbatim against `data/flows.json`:100 on every lint — no quote, no object.*

## The machine

*A `one contingent` moves through this, stepped every **tick**.*

```text
▶ True
   └─▶ Grudging   — Something changes in them  [1 guard]
· Grudging
   └─▶ Acting Against You   — They start working against you  [1 guard]
   └─▶ True   — You settle with them
· Acting Against You
   └─▶ Turned   — The banner turns  [1 guard]
   └─▶ True   — You settle with them
■ Turned
      (rests here)
```

*▶ where a case enters  ·  ■ where it comes to rest and never leaves  ·  · everywhere else*

## Every state it can be in

| state | in the engine | what you would see | role |
|---|---|---|---|
| [[True]] | *no single named value in the tree yet* | A contingent fighting your battle. | **entry** |
| [[Grudging]] | *no single named value in the tree yet* | Present, engaged, and somehow always the last to close. | — |
| [[Acting Against You]] | *no single named value in the tree yet* | Orders quietly ignored, a flank left open that did not need to be, a withdrawal nobody sanctioned. | — |
| [[Turned]] | *no single named value in the tree yet* | A banner going down and coming back up facing the other way. | **rests here** |

## Every way it can move

| from | to | on | must be true | what it costs |
|---|---|---|---|---|
| [[True]] | [[Grudging]] | the treachery reading crossing its first line | [[High enough to work against you]] | nothing yet, which is the trap |
| [[Grudging]] | [[Acting Against You]] | the treachery check, on its own clock | [[High enough to work against you]] | orders quietly failing, and a flank you thought was held |
| [[Grudging]] | [[True]] | amends, coin, a favour, or a grudge cooling | *nothing — it fires on the event alone* | whatever it took — and it is always cheaper than the alternative |
| [[Acting Against You]] | [[Turned]] | the treachery check, with the day going badly | [[High enough to change sides]] | the contingent, and everything behind where it was standing |
| [[Acting Against You]] | [[True]] | amends, coin, a favour, or a grudge cooling | *nothing — it fires on the event alone* | whatever it took — and it is always cheaper than the alternative |

## The numbers

| field | meaning | value |
|---|---|---|
| `carries` | WHAT MOVES through this machine — the case. A battle flow carries the battle; a nerve flow carries one unit. Naming the case is what stops a flow from quietly becoming a list of topics. | `one contingent` |
| `entry` | The place a case is in the moment it enters the machine. Exactly one per flow. | `treachery-true` |
| `terminals` | The places a case can come to rest in and never leave. A flow with no terminal never ends, which is a bug in the design, not in the code. | `treachery-defected` |
| `runsEvery` | How often the machine is stepped. 'tick' means twenty times a game-second; 'day' and 'season' are the court's clocks; 'event' means it only moves when something happens to it. | `tick` |
| `sourcePath` | The file that IS this machine — where the states are actually assigned. The lint reads it off disk and requires the quote below to appear in it. | `src/court/host.ts` |
| `quote` | A verbatim line from sourcePath proving the machine is real and not a hopeful diagram. No quote, no object. | `export function computeTreachery(` |

*Shelf: `flows` in `data/flows.json`.*

## Modules

- [[src/court/host.ts]] — *this page names `computeTreachery`*
- [[src/court/index.ts]] — *this page names `computeTreachery`*

## place

- [[True]] — *its `entry` names `treachery-true` by id*
- [[Turned]] — *its `terminals` names `treachery-defected` by id*

## Backlinks

### guard

- [[High enough to change sides]] — *its `flow` names `treachery` by id*
- [[High enough to work against you]] — *its `flow` names `treachery` by id*

### place

- [[Acting Against You]] — *its `flow` names `treachery` by id*
- [[Grudging]] — *its `flow` names `treachery` by id*
- [[True]] — *its `flow` names `treachery` by id*
- [[Turned]] — *its `flow` names `treachery` by id*

### token

- [[Back Pay]] — *its `flow` names `treachery` by id*

### transition

- [[Something changes in them]] — *its `flow` names `treachery` by id*
- [[The banner turns]] — *its `flow` names `treachery` by id*
- [[They start working against you]] — *its `flow` names `treachery` by id*
- [[You settle with them]] — *its `flow` names `treachery` by id*

## Sources this page cites

*Files this page names by path. Again: a citation of the file, nothing more.*

- [[src/court/host.ts]]

---

*Generated by `tools/codex/emit.mjs` from `data/flows.json`:100. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
