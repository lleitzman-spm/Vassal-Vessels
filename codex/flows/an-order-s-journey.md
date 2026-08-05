---
type: "flow"
id: "flow:order"
title: "An Order's Journey"
standing: "built"
standing_source: "derived"
source_path: "data/flows.json"
source_line: 85
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "flow:order"
---

# An Order's Journey

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

Orders are not instant and they are not guaranteed. An order is written, handed to a courier, and the courier RIDES — through the battle, at a real speed, and he can be killed on the way. If he arrives, the captain judges it (see the Heed). If it survives that, it becomes the contingent's active job until it is finished, replaced, or given up on. The whole machine exists so that 'I told them to wheel' and 'they wheeled' are different sentences separated by distance, time, danger and a man's opinion of you.

*Verified verbatim against `data/flows.json`:85 on every lint — no quote, no object.*

## The machine

*A `one improvised order` moves through this, stepped every **tick**.*

```text
▶ Issued
   └─▶ Riding   — The courier goes
· Riding
   └─▶ Arrived   — He reaches the banner  [2 guards]
   └─▶ Never Arrived   — He does not arrive  [1 guard]
· Arrived
   └─▶ In Force   — It becomes their job  [3 guards]
   └─▶ Abandoned (place)   — It is refused  [1 guard]
■ Never Arrived
      (rests here)
· In Force
   └─▶ Carried Out   — It is carried out
   └─▶ Abandoned (place)   — It stops mattering
■ Abandoned (place)
      (rests here)
■ Carried Out
      (rests here)
```

*▶ where a case enters  ·  ■ where it comes to rest and never leaves  ·  · everywhere else*

## Every state it can be in

| state | in the engine | what you would see | role |
|---|---|---|---|
| [[Issued]] | *no single named value in the tree yet* | A commander turning to speak to a rider. | **entry** |
| [[Riding]] | *no single named value in the tree yet* | A single horseman crossing the field at a gallop, taking the shortest line and not the safest one. | — |
| [[Arrived]] | *no single named value in the tree yet* | A rider reining in beside a banner. | — |
| [[Never Arrived]] | *no single named value in the tree yet* | Nothing. Which is exactly the problem. | **rests here** |
| [[In Force]] | *no single named value in the tree yet* | A contingent doing a thing on purpose. | — |
| [[Abandoned (place)]] | *no single named value in the tree yet* | A contingent giving up on something mid-way and doing something else. | **rests here** |
| [[Carried Out]] | *no single named value in the tree yet* | The thing you wanted, done. | **rests here** |

## Every way it can move

| from | to | on | must be true | what it costs |
|---|---|---|---|---|
| [[Issued]] | [[Riding]] | you issuing the order | *nothing — it fires on the event alone* | one of your limited orders in flight |
| [[Riding]] | [[Arrived]] | the ride completing | [[The courier lives]]; [[The horn is heard]] | the time it took, which is the whole problem |
| [[Riding]] | [[Never Arrived]] | the courier being caught | [[The courier lives]] | the order, silently |
| [[Arrived]] | [[In Force]] | the heed resolving to any form of compliance | [[Heed high enough to simply obey]]; [[Heed enough to comply, not to conform]]; [[Heed low enough to stall]] | whatever the interpretation cost you |
| [[Arrived]] | [[Abandoned (place)]] | the heed resolving to defiance | [[Heed gone entirely]] | the order, and a great deal of face |
| [[In Force]] | [[Carried Out]] | the objective being met | *nothing — it fires on the event alone* | none |
| [[In Force]] | [[Abandoned (place)]] | a newer order arriving, the target being gone, or the unit breaking | *nothing — it fires on the event alone* | none |

## The numbers

| field | meaning | value |
|---|---|---|
| `carries` | WHAT MOVES through this machine — the case. A battle flow carries the battle; a nerve flow carries one unit. Naming the case is what stops a flow from quietly becoming a list of topics. | `one improvised order` |
| `entry` | The place a case is in the moment it enters the machine. Exactly one per flow. | `order-issued` |
| `terminals` | The places a case can come to rest in and never leave. A flow with no terminal never ends, which is a bug in the design, not in the code. | `order-done`, `order-abandoned`, `order-lost` |
| `runsEvery` | How often the machine is stepped. 'tick' means twenty times a game-second; 'day' and 'season' are the court's clocks; 'event' means it only moves when something happens to it. | `tick` |
| `sourcePath` | The file that IS this machine — where the states are actually assigned. The lint reads it off disk and requires the quote below to appear in it. | `src/battle/phase-command.ts` |
| `quote` | A verbatim line from sourcePath proving the machine is real and not a hopeful diagram. No quote, no object. | `export function computeHeed(` |

*Shelf: `flows` in `data/flows.json`.*

## Modules

- [[src/battle/index.ts]] — *this page names `computeHeed`*
- [[src/battle/phase-command.ts]] — *this page names `computeHeed`*

## place

- [[Abandoned (place)]] — *its `terminals` names `order-abandoned` by id*
- [[Carried Out]] — *its `terminals` names `order-done` by id*
- [[Issued]] — *its `entry` names `order-issued` by id*
- [[Never Arrived]] — *its `terminals` names `order-lost` by id*

## Backlinks

### guard

- [[The courier lives]] — *its `flow` names `order` by id*
- [[The horn is heard]] — *its `flow` names `order` by id*

### place

- [[Abandoned (place)]] — *its `flow` names `order` by id*
- [[Arrived]] — *its `flow` names `order` by id*
- [[Carried Out]] — *its `flow` names `order` by id*
- [[In Force]] — *its `flow` names `order` by id*
- [[Issued]] — *its `flow` names `order` by id*
- [[Never Arrived]] — *its `flow` names `order` by id*
- [[Riding]] — *its `flow` names `order` by id*

### token

- [[Orders You Can Have Out]] — *its `flow` names `order` by id*

### transition

- [[He does not arrive]] — *its `flow` names `order` by id*
- [[He reaches the banner]] — *its `flow` names `order` by id*
- [[It becomes their job]] — *its `flow` names `order` by id*
- [[It is carried out]] — *its `flow` names `order` by id*
- [[It is refused]] — *its `flow` names `order` by id*
- [[It stops mattering]] — *its `flow` names `order` by id*
- [[The courier goes]] — *its `flow` names `order` by id*

## Sources this page cites

*Files this page names by path. Again: a citation of the file, nothing more.*

- [[src/battle/phase-command.ts]]

---

*Generated by `tools/codex/emit.mjs` from `data/flows.json`:85. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
