---
type: "flow"
id: "flow:seat"
title: "A Seat at Court"
standing: "built"
standing_source: "derived"
source_path: "data/flows.json"
source_line: 224
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "flow:seat"
---

# A Seat at Court

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

The court is seven jobs, and every one of them does something you can feel on the battlefield — most sharply the Marshal, who decides how many contingents you can direct at once. Leave the Marshalcy empty and you fight the entire war two orders at a time. What makes seats a machine rather than a list is TIME: a man who holds a seat long enough begins to think of it as his, and longer still and his son thinks so too. Taking back a seat that has become customary is one of the deepest grudges in the game, and you did it to yourself by leaving him there.

*Verified verbatim against `data/flows.json`:224 on every lint — no quote, no object.*

## The machine

*A `one of the seven seats` moves through this, stepped every **season**.*

```text
▶ Vacant
   └─▶ Held   — You invest someone
· Held
   └─▶ Customary   — It becomes customary  [1 guard]
   └─▶ Taken Back   — You take it back  [2 guards]
   └─▶ Vacant   — The holder dies
· Customary
   └─▶ Held by Right   — His son expects it (transition)  [1 guard]
   └─▶ Taken Back   — You take it back  [2 guards]
   └─▶ Vacant   — The holder dies
· Taken Back
   └─▶ Vacant   — The chair stands empty
· Held by Right
   └─▶ Taken Back   — You take it back  [2 guards]
   └─▶ Vacant   — The holder dies
```

*▶ where a case enters  ·  ■ where it comes to rest and never leaves  ·  · everywhere else*

## Every state it can be in

| state | in the engine | what you would see | role |
|---|---|---|---|
| [[Vacant]] | *no single named value in the tree yet* | An empty chair at a council table. | **entry** |
| [[Held]] | *no single named value in the tree yet* | A man doing a job, well or badly. | — |
| [[Customary]] | *no single named value in the tree yet* | A man who no longer thanks you for it. | — |
| [[Taken Back]] | *no single named value in the tree yet* | A man riding home from court without saying goodbye. | — |
| [[Held by Right]] | *no single named value in the tree yet* | A son who expects the chair his father sat in. | — |

## Every way it can move

| from | to | on | must be true | what it costs |
|---|---|---|---|---|
| [[Vacant]] | [[Held]] | an investiture going onto the record | *nothing — it fires on the event alone* | days at court, a stipend, and every rival's opinion |
| [[Held]] | [[Customary]] | enough years in the chair | [[It starts to feel like his]] | nothing today; a great deal if you ever want it back |
| [[Held]] | [[Taken Back]] | removing the holder | [[It starts to feel like his]]; [[His son expects it]] | a grievance scaled by how established he had become — and from an hereditary seat, fear in every other house |
| [[Held]] | [[Vacant]] | the holder's death | *nothing — it fires on the event alone* | the seat's effect, immediately |
| [[Customary]] | [[Held by Right]] | enough years again | [[His son expects it]] | nothing today; ruinous later |
| [[Customary]] | [[Taken Back]] | removing the holder | [[It starts to feel like his]]; [[His son expects it]] | a grievance scaled by how established he had become — and from an hereditary seat, fear in every other house |
| [[Customary]] | [[Vacant]] | the holder's death | *nothing — it fires on the event alone* | the seat's effect, immediately |
| [[Taken Back]] | [[Vacant]] | the removal taking effect | *nothing — it fires on the event alone* | the seat's whole effect, until you fill it |
| [[Held by Right]] | [[Taken Back]] | removing the holder | [[It starts to feel like his]]; [[His son expects it]] | a grievance scaled by how established he had become — and from an hereditary seat, fear in every other house |
| [[Held by Right]] | [[Vacant]] | the holder's death | *nothing — it fires on the event alone* | the seat's effect, immediately |

## The numbers

| field | meaning | value |
|---|---|---|
| `carries` | WHAT MOVES through this machine — the case. A battle flow carries the battle; a nerve flow carries one unit. Naming the case is what stops a flow from quietly becoming a list of topics. | `one of the seven seats` |
| `entry` | The place a case is in the moment it enters the machine. Exactly one per flow. | `seat-vacant` |
| `terminals` | The places a case can come to rest in and never leave. A flow with no terminal never ends, which is a bug in the design, not in the code. | *none* |
| `runsEvery` | How often the machine is stepped. 'tick' means twenty times a game-second; 'day' and 'season' are the court's clocks; 'event' means it only moves when something happens to it. | `season` |
| `sourcePath` | The file that IS this machine — where the states are actually assigned. The lint reads it off disk and requires the quote below to appear in it. | `src/court/seats.ts` |
| `quote` | A verbatim line from sourcePath proving the machine is real and not a hopeful diagram. No quote, no object. | `export function readSeat(` |
| `implementsLaw` | The numbered law in `docs/KINGDOM.md` this machine exists to carry out. Claimed only where the machine IS the law's mechanism, not merely consistent with it — law 10 ('there is no player character') is a constraint on what the game leaves out, so no flow implements it and none pretends to. | `1`, `11` |

*Shelf: `flows` in `data/flows.json`.*

## Rules that govern it

- [[Law 1 — Records in, readings out]] — *its `implementsLaw` names `1` by id*
- [[Law 11 — A spiral may exist, but never without a visible exit]] — *its `implementsLaw` names `11` by id*

## Seats

- [[The Marshal]] — *this page names "The Marshal" literally*

## Modules

- [[src/court/index.ts]] — *this page names `readSeat`*
- [[src/court/seats.ts]] — *this page names `readSeat`*

## place

- [[Vacant]] — *its `entry` names `seat-vacant` by id*

## Backlinks

### guard

- [[His son expects it]] — *its `flow` names `seat` by id*
- [[It starts to feel like his]] — *its `flow` names `seat` by id*

### place

- [[Customary]] — *its `flow` names `seat` by id*
- [[Held]] — *its `flow` names `seat` by id*
- [[Held by Right]] — *its `flow` names `seat` by id*
- [[Taken Back]] — *its `flow` names `seat` by id*
- [[Vacant]] — *its `flow` names `seat` by id*

### transition

- [[His son expects it (transition)]] — *its `flow` names `seat` by id*
- [[It becomes customary]] — *its `flow` names `seat` by id*
- [[The chair stands empty]] — *its `flow` names `seat` by id*
- [[The holder dies]] — *its `flow` names `seat` by id*
- [[You invest someone]] — *its `flow` names `seat` by id*
- [[You take it back]] — *its `flow` names `seat` by id*

## Sources this page cites

*Files this page names by path. Again: a citation of the file, nothing more.*

- [[src/court/seats.ts]]

---

*Generated by `tools/codex/emit.mjs` from `data/flows.json`:224. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
