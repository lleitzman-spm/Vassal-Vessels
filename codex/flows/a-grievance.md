---
type: "flow"
id: "flow:grievance"
title: "A Grievance"
standing: "built"
standing_source: "derived"
source_path: "data/flows.json"
source_line: 149
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "flow:grievance"
---

# A Grievance

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

How the past reaches forward and takes hold of your army. Every grudge in this game began as a specific thing you did on a specific day, and it is never stored as a number — it is COMPUTED from the record of the act, every time anyone asks. That matters more than it sounds: it means a grievance can be answered. Make amends and the record of the amends is read alongside the record of the wrong. It also means a grudge you never knew about does nothing at all until the wronged house finds out, and finding out is its own event with its own date.

*Verified verbatim against `data/flows.json`:149 on every lint — no quote, no object.*

## The machine

*A `one wrong you did` moves through this, stepped every **day**.*

```text
▶ Done
   └─▶ Known   — They find out
· Known
   └─▶ Burning   — It takes hold
   └─▶ Amended   — You make it right
· Burning
   └─▶ Cooling   — It cools  [1 guard]
   └─▶ Amended   — You make it right
   └─▶ Inherited   — The son takes it up  [1 guard]
■ Amended
      (rests here)
· Cooling
   └─▶ Cold   — It goes cold  [1 guard]
   └─▶ Amended   — You make it right
   └─▶ Inherited   — The son takes it up  [1 guard]
■ Inherited
      (rests here)
■ Cold
      (rests here)
```

*▶ where a case enters  ·  ■ where it comes to rest and never leaves  ·  · everywhere else*

## Every state it can be in

| state | in the engine | what you would see | role |
|---|---|---|---|
| [[Done]] | *no single named value in the tree yet* | Nothing at all, yet. | **entry** |
| [[Known]] | *no single named value in the tree yet* | A messenger arriving somewhere you are not. | — |
| [[Burning]] | *no single named value in the tree yet* | A house that sends the minimum, late, and does not look at you. | — |
| [[Amended]] | *no single named value in the tree yet* | A public act of restitution, and a house that turns up next time. | **rests here** |
| [[Cooling]] | *no single named value in the tree yet* | Civility, of a slightly stiff kind. | — |
| [[Inherited]] | *no single named value in the tree yet* | A young lord who dislikes you for reasons that predate him. | **rests here** |
| [[Cold]] | *no single named value in the tree yet* | Nothing you would notice. Which is not the same as nothing. | **rests here** |

## Every way it can move

| from | to | on | must be true | what it costs |
|---|---|---|---|---|
| [[Done]] | [[Known]] | word reaching the wronged house | *nothing — it fires on the event alone* | none — the cost starts now |
| [[Known]] | [[Burning]] | the grievance being read at full weight | *nothing — it fires on the event alone* | willingness, resolve, obedience and treachery, all at once |
| [[Known]] | [[Amended]] | an act of amends going onto the record | *nothing — it fires on the event alone* | coin, land, a judgement, or your pride in public |
| [[Burning]] | [[Cooling]] | enough years passing | [[Time takes the heat out]] | none |
| [[Burning]] | [[Amended]] | an act of amends going onto the record | *nothing — it fires on the event alone* | coin, land, a judgement, or your pride in public |
| [[Burning]] | [[Inherited]] | the wronged man dying | [[The son picks it up]] | a share of the weight, carried by someone new |
| [[Cooling]] | [[Cold]] | the decay running its course | [[Time takes the heat out]] | none |
| [[Cooling]] | [[Amended]] | an act of amends going onto the record | *nothing — it fires on the event alone* | coin, land, a judgement, or your pride in public |
| [[Cooling]] | [[Inherited]] | the wronged man dying | [[The son picks it up]] | a share of the weight, carried by someone new |

## The numbers

| field | meaning | value |
|---|---|---|
| `carries` | WHAT MOVES through this machine — the case. A battle flow carries the battle; a nerve flow carries one unit. Naming the case is what stops a flow from quietly becoming a list of topics. | `one wrong you did` |
| `entry` | The place a case is in the moment it enters the machine. Exactly one per flow. | `grievance-done` |
| `terminals` | The places a case can come to rest in and never leave. A flow with no terminal never ends, which is a bug in the design, not in the code. | `grievance-cold`, `grievance-amended`, `grievance-inherited` |
| `runsEvery` | How often the machine is stepped. 'tick' means twenty times a game-second; 'day' and 'season' are the court's clocks; 'event' means it only moves when something happens to it. | `day` |
| `sourcePath` | The file that IS this machine — where the states are actually assigned. The lint reads it off disk and requires the quote below to appear in it. | `src/court/grievances.ts` |
| `quote` | A verbatim line from sourcePath proving the machine is real and not a hopeful diagram. No quote, no object. | `export function readGrievances(c: Chronicle, houseId: string, at: Stamp): Grievance[] {` |

*Shelf: `flows` in `data/flows.json`.*

## Modules

- [[src/court/grievances.ts]] — *this page names `readGrievances`*
- [[src/court/index.ts]] — *this page names `readGrievances`*

## place

- [[Amended]] — *its `terminals` names `grievance-amended` by id*
- [[Cold]] — *its `terminals` names `grievance-cold` by id*
- [[Done]] — *its `entry` names `grievance-done` by id*
- [[Inherited]] — *its `terminals` names `grievance-inherited` by id*

## Backlinks

### guard

- [[The son picks it up]] — *its `flow` names `grievance` by id*
- [[Time takes the heat out]] — *its `flow` names `grievance` by id*

### place

- [[Amended]] — *its `flow` names `grievance` by id*
- [[Burning]] — *its `flow` names `grievance` by id*
- [[Cold]] — *its `flow` names `grievance` by id*
- [[Cooling]] — *its `flow` names `grievance` by id*
- [[Done]] — *its `flow` names `grievance` by id*
- [[Inherited]] — *its `flow` names `grievance` by id*
- [[Known]] — *its `flow` names `grievance` by id*

### token

- [[The Weight of a Grudge]] — *its `flow` names `grievance` by id*

### transition

- [[It cools]] — *its `flow` names `grievance` by id*
- [[It goes cold]] — *its `flow` names `grievance` by id*
- [[It takes hold]] — *its `flow` names `grievance` by id*
- [[The son takes it up]] — *its `flow` names `grievance` by id*
- [[They find out]] — *its `flow` names `grievance` by id*
- [[You make it right]] — *its `flow` names `grievance` by id*

## Sources this page cites

*Files this page names by path. Again: a citation of the file, nothing more.*

- [[src/court/grievances.ts]]

---

*Generated by `tools/codex/emit.mjs` from `data/flows.json`:149. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
