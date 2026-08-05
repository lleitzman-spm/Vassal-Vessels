---
type: "flow"
id: "flow:captive"
title: "A Captive"
standing: "built"
standing_source: "derived"
source_path: "data/flows.json"
source_line: 206
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "flow:captive"
---

# A Captive

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

What happens to the men who do not die and do not get away. Capture is the reason a won battle is worth more than a bloodbath: a lord taken alive is a ransom, and a ransom is coin you did not have to tax anyone for. It cuts both ways — your own men in someone else's hands are a bill with a date on it, and letting that date pass without paying is a grievance the whole realm will hear about. Sell out your own captured vassals once and watch what the next muster looks like.

*Verified verbatim against `data/flows.json`:206 on every lint — no quote, no object.*

## The machine

*A `one captured man` moves through this, stepped every **day**.*

```text
▶ Taken
   └─▶ Ransom Set   — A price is named  [2 guards]
   └─▶ Died in Captivity   — He dies in captivity
· Ransom Set
   └─▶ Ransomed Home   — The ransom is paid
   └─▶ Overdue   — The date passes  [1 guard]
   └─▶ Died in Captivity   — He dies in captivity
■ Died in Captivity
      (rests here)
■ Ransomed Home
      (rests here)
· Overdue
   └─▶ Ransomed Home   — You pay late
   └─▶ Abandoned   — You leave him
   └─▶ Died in Captivity   — He dies in captivity
■ Abandoned
      (rests here)
```

*▶ where a case enters  ·  ■ where it comes to rest and never leaves  ·  · everywhere else*

## Every state it can be in

| state | in the engine | what you would see | role |
|---|---|---|---|
| [[Taken]] | *no single named value in the tree yet* | A man being pulled off a horse and not killed. | **entry** |
| [[Ransom Set]] | *no single named value in the tree yet* | A letter naming a price and a date. | — |
| [[Died in Captivity]] | *no single named value in the tree yet* | A short letter. | **rests here** |
| [[Ransomed Home]] | *no single named value in the tree yet* | A lord riding back through his own gate, poorer and alive. | **rests here** |
| [[Overdue]] | *no single named value in the tree yet* | A date passing with nothing happening. | — |
| [[Abandoned]] | *no single named value in the tree yet* | A house that will never fight for you again. | **rests here** |

## Every way it can move

| from | to | on | must be true | what it costs |
|---|---|---|---|---|
| [[Taken]] | [[Ransom Set]] | the aftermath being built | [[Taken alive rather than killed]]; [[The bill has a date on it]] | none to the captor |
| [[Taken]] | [[Died in Captivity]] | death while held | *nothing — it fires on the event alone* | no ransom to anyone, and an heir with a grudge |
| [[Ransom Set]] | [[Ransomed Home]] | payment before the due date | *nothing — it fires on the event alone* | coin — a great deal of it |
| [[Ransom Set]] | [[Overdue]] | the due date arriving unpaid | [[The bill has a date on it]] | the realm's opinion, daily |
| [[Ransom Set]] | [[Died in Captivity]] | death while held | *nothing — it fires on the event alone* | no ransom to anyone, and an heir with a grudge |
| [[Overdue]] | [[Ransomed Home]] | payment after the due date | *nothing — it fires on the event alone* | coin, and some of the credit you would have had |
| [[Overdue]] | [[Abandoned]] | the debt being written off | *nothing — it fires on the event alone* | one of the deepest grudges available, spread to everyone watching |
| [[Overdue]] | [[Died in Captivity]] | death while held | *nothing — it fires on the event alone* | no ransom to anyone, and an heir with a grudge |

## The numbers

| field | meaning | value |
|---|---|---|
| `carries` | WHAT MOVES through this machine — the case. A battle flow carries the battle; a nerve flow carries one unit. Naming the case is what stops a flow from quietly becoming a list of topics. | `one captured man` |
| `entry` | The place a case is in the moment it enters the machine. Exactly one per flow. | `captive-taken` |
| `terminals` | The places a case can come to rest in and never leave. A flow with no terminal never ends, which is a bug in the design, not in the code. | `captive-ransomed`, `captive-attainted`, `captive-died` |
| `runsEvery` | How often the machine is stepped. 'tick' means twenty times a game-second; 'day' and 'season' are the court's clocks; 'event' means it only moves when something happens to it. | `day` |
| `sourcePath` | The file that IS this machine — where the states are actually assigned. The lint reads it off disk and requires the quote below to appear in it. | `src/court/absorb.ts` |
| `quote` | A verbatim line from sourcePath proving the machine is real and not a hopeful diagram. No quote, no object. | `export function ransomDueBy(taken: Stamp): number {` |
| `implementsLaw` | The numbered law in `docs/KINGDOM.md` this machine exists to carry out. Claimed only where the machine IS the law's mechanism, not merely consistent with it — law 10 ('there is no player character') is a constraint on what the game leaves out, so no flow implements it and none pretends to. | `9` |

*Shelf: `flows` in `data/flows.json`.*

## Rules that govern it

- [[Law 9 — The battle writes the next season's politics]] — *its `implementsLaw` names `9` by id*

## Modules

- [[src/court/absorb.ts]] — *this page names `ransomDueBy`*

## place

- [[Abandoned]] — *its `terminals` names `captive-attainted` by id*
- [[Died in Captivity]] — *its `terminals` names `captive-died` by id*
- [[Ransomed Home]] — *its `terminals` names `captive-ransomed` by id*
- [[Taken]] — *its `entry` names `captive-taken` by id*

## Backlinks

### guard

- [[Taken alive rather than killed]] — *its `flow` names `captive` by id*
- [[The bill has a date on it]] — *its `flow` names `captive` by id*

### place

- [[Abandoned]] — *its `flow` names `captive` by id*
- [[Died in Captivity]] — *its `flow` names `captive` by id*
- [[Overdue]] — *its `flow` names `captive` by id*
- [[Ransom Set]] — *its `flow` names `captive` by id*
- [[Ransomed Home]] — *its `flow` names `captive` by id*
- [[Taken]] — *its `flow` names `captive` by id*

### transition

- [[A price is named]] — *its `flow` names `captive` by id*
- [[He dies in captivity]] — *its `flow` names `captive` by id*
- [[The date passes]] — *its `flow` names `captive` by id*
- [[The ransom is paid]] — *its `flow` names `captive` by id*
- [[You leave him]] — *its `flow` names `captive` by id*
- [[You pay late]] — *its `flow` names `captive` by id*

## Sources this page cites

*Files this page names by path. Again: a citation of the file, nothing more.*

- [[src/court/absorb.ts]]

---

*Generated by `tools/codex/emit.mjs` from `data/flows.json`:206. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
