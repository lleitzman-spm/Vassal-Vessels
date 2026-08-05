---
type: "flow"
id: "flow:vessel"
title: "A House's Vessel"
standing: "built"
standing_source: "derived"
source_path: "data/flows.json"
source_line: 172
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "flow:vessel"
---

# A House's Vessel

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

The game's name, and its central bargain. Every house owes you a fixed number of man-days a year — a cup of service, filled at the turn of the service year and drawn down every day its men are standing in your army. An empty cup is not a rule that stops you; it is a rule that COSTS you. Call a house whose vessel is dry and they can still come, but they will resent it, and the resentment compounds the second and third time. Manage twelve cups at once, across a war that does not care what month it is, and you have the whole strategic layer of the game.

*Verified verbatim against `data/flows.json`:172 on every lint — no quote, no object.*

## The machine

*A `one house's yearly service` moves through this, stepped every **day**.*

```text
▶ Full
   └─▶ Drawn Down   — The first day is served
· Drawn Down
   └─▶ Dry   — The cup runs out  [1 guard]
   └─▶ Full   — The service year turns  [1 guard]
· Dry
   └─▶ Beyond the Vessel   — You call them anyway  [1 guard]
   └─▶ Full   — The service year turns  [1 guard]
· Beyond the Vessel
   └─▶ Full   — The service year turns  [1 guard]
```

*▶ where a case enters  ·  ■ where it comes to rest and never leaves  ·  · everywhere else*

## Every state it can be in

| state | in the engine | what you would see | role |
|---|---|---|---|
| [[Full]] | *no single named value in the tree yet* | A house that answers cheerfully. | **entry** |
| [[Drawn Down]] | *no single named value in the tree yet* | A house that answers, and mentions how long it has been out. | — |
| [[Dry]] | *no single named value in the tree yet* | A very long pause before the answer comes back. | — |
| [[Beyond the Vessel]] | *no single named value in the tree yet* | Men who are here because they were told to be, and want you to know it. | — |

## Every way it can move

| from | to | on | must be true | what it costs |
|---|---|---|---|---|
| [[Full]] | [[Drawn Down]] | a house's men standing in your army for a day | *nothing — it fires on the event alone* | one day of the year's service |
| [[Drawn Down]] | [[Dry]] | the last owed day being served | [[The cup is empty]] | none, yet |
| [[Drawn Down]] | [[Full]] | the year rolling over | [[Ninety days pass]] | none |
| [[Dry]] | [[Beyond the Vessel]] | a summons to a dry house | [[Called anyway]] | willingness now, and a grievance that compounds |
| [[Dry]] | [[Full]] | the year rolling over | [[Ninety days pass]] | none |
| [[Beyond the Vessel]] | [[Full]] | the year rolling over | [[Ninety days pass]] | none |

## The numbers

| field | meaning | value |
|---|---|---|
| `carries` | WHAT MOVES through this machine — the case. A battle flow carries the battle; a nerve flow carries one unit. Naming the case is what stops a flow from quietly becoming a list of topics. | `one house's yearly service` |
| `entry` | The place a case is in the moment it enters the machine. Exactly one per flow. | `vessel-full` |
| `terminals` | The places a case can come to rest in and never leave. A flow with no terminal never ends, which is a bug in the design, not in the code. | *none* |
| `runsEvery` | How often the machine is stepped. 'tick' means twenty times a game-second; 'day' and 'season' are the court's clocks; 'event' means it only moves when something happens to it. | `day` |
| `sourcePath` | The file that IS this machine — where the states are actually assigned. The lint reads it off disk and requires the quote below to appear in it. | `src/court/vessel.ts` |
| `quote` | A verbatim line from sourcePath proving the machine is real and not a hopeful diagram. No quote, no object. | `export function readVessel(` |
| `implementsLaw` | The numbered law in `docs/KINGDOM.md` this machine exists to carry out. Claimed only where the machine IS the law's mechanism, not merely consistent with it — law 10 ('there is no player character') is a constraint on what the game leaves out, so no flow implements it and none pretends to. | `1` |

*Shelf: `flows` in `data/flows.json`.*

## Rules that govern it

- [[Law 1 — Records in, readings out]] — *its `implementsLaw` names `1` by id*

## Modules

- [[src/court/index.ts]] — *this page names `readVessel`*
- [[src/court/vessel.ts]] — *this page names `readVessel`*

## place

- [[Full]] — *its `entry` names `vessel-full` by id*

## Backlinks

### guard

- [[Called anyway]] — *its `flow` names `vessel` by id*
- [[The cup is empty]] — *its `flow` names `vessel` by id*

### place

- [[Beyond the Vessel]] — *its `flow` names `vessel` by id*
- [[Drawn Down]] — *its `flow` names `vessel` by id*
- [[Dry]] — *its `flow` names `vessel` by id*
- [[Full]] — *its `flow` names `vessel` by id*

### token

- [[Days in the Cup]] — *its `flow` names `vessel` by id*

### transition

- [[The cup runs out]] — *its `flow` names `vessel` by id*
- [[The first day is served]] — *its `flow` names `vessel` by id*
- [[The service year turns]] — *its `flow` names `vessel` by id*
- [[You call them anyway]] — *its `flow` names `vessel` by id*

## Sources this page cites

*Files this page names by path. Again: a citation of the file, nothing more.*

- [[src/court/vessel.ts]]

---

*Generated by `tools/codex/emit.mjs` from `data/flows.json`:172. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
