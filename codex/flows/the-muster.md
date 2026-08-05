---
type: "flow"
id: "flow:muster"
title: "The Muster"
standing: "built"
standing_source: "derived"
source_path: "data/flows.json"
source_line: 153
origin: "mined"
generator: "tools/codex/emit.mjs"
aliases:
  - "flow:muster"
---

# The Muster

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

The road from 'I want a war' to 'here is my army, such as it is'. You name a cause, you call your houses, each one decides for itself what to send, and then they have to physically GET there — over real leagues, at a real pace, arriving tired. Every step of it is a place where the army you imagined becomes smaller than the army you get. The gap between the two is the whole point of the court half of the game, and the muster is where you find out what all that politics was worth.

*Verified verbatim against `data/flows.json`:153 on every lint — no quote, no object.*

## The machine

*A `one campaign` moves through this, stepped every **day**.*

```text
▶ No War Yet
   └─▶ Cause Proclaimed   — You name your cause
· Cause Proclaimed
   └─▶ Houses Summoned   — The call goes out
   └─▶ Called Off   — You send them home
· Houses Summoned
   └─▶ Answers In   — The answers come back  [2 guards]
   └─▶ Called Off   — You send them home
■ Called Off
      (rests here)
· Answers In
   └─▶ Gathering   — Lords collect their men  [1 guard]
   └─▶ Called Off   — You send them home
· Gathering
   └─▶ On the Road   — They take the road
   └─▶ Called Off   — You send them home
· On the Road
   └─▶ The Host Stands   — The host stands  [1 guard]
   └─▶ Called Off   — You send them home
· The Host Stands
   └─▶ Fought   — The battle is fought
   └─▶ Called Off   — You send them home
· Fought
   └─▶ Absorbed   — It goes into the record
■ Absorbed
      (rests here)
```

*▶ where a case enters  ·  ■ where it comes to rest and never leaves  ·  · everywhere else*

## Every state it can be in

| state | in the engine | what you would see | role |
|---|---|---|---|
| [[No War Yet]] | *no single named value in the tree yet* | A realm going about its business. | **entry** |
| [[Cause Proclaimed]] | *no single named value in the tree yet* | Criers at every market cross. | — |
| [[Houses Summoned]] | *no single named value in the tree yet* | Riders leaving in every direction with sealed letters. | — |
| [[Called Off]] | *no single named value in the tree yet* | Men going home, unimpressed. | **rests here** |
| [[Answers In]] | *no single named value in the tree yet* | Replies coming back, some of them thinner than you hoped. | — |
| [[Gathering]] | *no single named value in the tree yet* | Men trickling in from farms and villages to a lord's hall. | — |
| [[On the Road]] | *no single named value in the tree yet* | Columns on bad roads, getting slower. | — |
| [[The Host Stands]] | *no single named value in the tree yet* | An army, in a field, smaller than the one you imagined. | — |
| [[Fought]] | *no single named value in the tree yet* | A field with the fighting over it. | — |
| [[Absorbed]] | *no single named value in the tree yet* | Clerks writing, and a great many people finding out things they will not forget. | **rests here** |

## Every way it can move

| from | to | on | must be true | what it costs |
|---|---|---|---|---|
| [[No War Yet]] | [[Cause Proclaimed]] | a proclamation going onto the record | *nothing — it fires on the event alone* | days at court |
| [[Cause Proclaimed]] | [[Houses Summoned]] | a summons naming houses, a place and a day | *nothing — it fires on the event alone* | days at court, more for a whole realm |
| [[Cause Proclaimed]] | [[Called Off]] | abandoning the campaign | *nothing — it fires on the event alone* | every day already drawn from every vessel, and the goodwill |
| [[Houses Summoned]] | [[Answers In]] | each house's willingness being read | [[The cup is empty]]; [[Called anyway]] | willingness, wherever a cup was dry |
| [[Houses Summoned]] | [[Called Off]] | abandoning the campaign | *nothing — it fires on the event alone* | every day already drawn from every vessel, and the goodwill |
| [[Answers In]] | [[Gathering]] | each house beginning to assemble | [[The men are together]] | days, before a single league is walked |
| [[Answers In]] | [[Called Off]] | abandoning the campaign | *nothing — it fires on the event alone* | every day already drawn from every vessel, and the goodwill |
| [[Gathering]] | [[On the Road]] | a gathered contingent setting off | *nothing — it fires on the event alone* | fatigue, every day, all the way |
| [[Gathering]] | [[Called Off]] | abandoning the campaign | *nothing — it fires on the event alone* | every day already drawn from every vessel, and the goodwill |
| [[On the Road]] | [[The Host Stands]] | arrival at the appointed place | [[They reach the field]] | whatever the roads took |
| [[On the Road]] | [[Called Off]] | abandoning the campaign | *nothing — it fires on the event alone* | every day already drawn from every vessel, and the goodwill |
| [[The Host Stands]] | [[Fought]] | the host meeting another one | *nothing — it fires on the event alone* | men |
| [[The Host Stands]] | [[Called Off]] | abandoning the campaign | *nothing — it fires on the event alone* | every day already drawn from every vessel, and the goodwill |
| [[Fought]] | [[Absorbed]] | the aftermath being absorbed | *nothing — it fires on the event alone* | none — and everything, later |

## The numbers

| field | meaning | value |
|---|---|---|
| `carries` | WHAT MOVES through this machine — the case. A battle flow carries the battle; a nerve flow carries one unit. Naming the case is what stops a flow from quietly becoming a list of topics. | `one campaign` |
| `entry` | The place a case is in the moment it enters the machine. Exactly one per flow. | `muster-unproclaimed` |
| `terminals` | The places a case can come to rest in and never leave. A flow with no terminal never ends, which is a bug in the design, not in the code. | `muster-absorbed`, `muster-abandoned` |
| `runsEvery` | How often the machine is stepped. 'tick' means twenty times a game-second; 'day' and 'season' are the court's clocks; 'event' means it only moves when something happens to it. | `day` |
| `sourcePath` | The file that IS this machine — where the states are actually assigned. The lint reads it off disk and requires the quote below to appear in it. | `src/court/host.ts` |
| `quote` | A verbatim line from sourcePath proving the machine is real and not a hopeful diagram. No quote, no object. | `export function readHost(c: Chronicle, campaignId: string, at: Stamp): Host {` |
| `implementsLaw` | The numbered law in `docs/KINGDOM.md` this machine exists to carry out. Claimed only where the machine IS the law's mechanism, not merely consistent with it — law 10 ('there is no player character') is a constraint on what the game leaves out, so no flow implements it and none pretends to. | `1`, `2`, `4` |

*Shelf: `flows` in `data/flows.json`.*

## Rules that govern it

- [[Law 1 — Records in, readings out]] — *its `implementsLaw` names `1` by id*
- [[Law 2 — The muster never rolls dice]] — *its `implementsLaw` names `2` by id*
- [[Law 4 — Every reading shows its working]] — *its `implementsLaw` names `4` by id*

## Modules

- [[src/court/host.ts]] — *this page names `readHost`*
- [[src/court/index.ts]] — *this page names `readHost`*

## place

- [[Absorbed]] — *its `terminals` names `muster-absorbed` by id*
- [[Called Off]] — *its `terminals` names `muster-abandoned` by id*
- [[No War Yet]] — *its `entry` names `muster-unproclaimed` by id*

## Backlinks

### guard

- [[The men are together]] — *its `flow` names `muster` by id*
- [[They reach the field]] — *its `flow` names `muster` by id*

### place

- [[Absorbed]] — *its `flow` names `muster` by id*
- [[Answers In]] — *its `flow` names `muster` by id*
- [[Called Off]] — *its `flow` names `muster` by id*
- [[Cause Proclaimed]] — *its `flow` names `muster` by id*
- [[Fought]] — *its `flow` names `muster` by id*
- [[Gathering]] — *its `flow` names `muster` by id*
- [[Houses Summoned]] — *its `flow` names `muster` by id*
- [[No War Yet]] — *its `flow` names `muster` by id*
- [[On the Road]] — *its `flow` names `muster` by id*
- [[The Host Stands]] — *its `flow` names `muster` by id*

### token

- [[Crowns]] — *its `flow` names `muster` by id*
- [[Experience]] — *its `flow` names `muster` by id*
- [[Grain]] — *its `flow` names `muster` by id*
- [[Standing]] — *its `flow` names `muster` by id*

### transition

- [[It goes into the record]] — *its `flow` names `muster` by id*
- [[Lords collect their men]] — *its `flow` names `muster` by id*
- [[The answers come back]] — *its `flow` names `muster` by id*
- [[The battle is fought]] — *its `flow` names `muster` by id*
- [[The call goes out]] — *its `flow` names `muster` by id*
- [[The host stands]] — *its `flow` names `muster` by id*
- [[They take the road]] — *its `flow` names `muster` by id*
- [[You name your cause]] — *its `flow` names `muster` by id*
- [[You send them home]] — *its `flow` names `muster` by id*

## Sources this page cites

*Files this page names by path. Again: a citation of the file, nothing more.*

- [[src/court/host.ts]]

---

*Generated by `tools/codex/emit.mjs` from `data/flows.json`:153. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
