---
type: "module"
id: "module:src/core/contract.ts"
title: "src/core/contract.ts"
standing: "built"
standing_source: "derived"
source_path: "src/core/contract.ts"
source_line: 1
origin: "derived"
generator: "tools/codex/emit.mjs"
aliases:
  - "module:src/core/contract.ts"
---

# src/core/contract.ts

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

344 lines · 38 exported symbols.

## What the file says of itself

> WHY THIS FILE EXISTS. There are two games in this repository — the court and
> the battle — and they are meant to be buildable blind to each other. This file
> is the whole of what passes between them: a Host goes in, an Aftermath comes
> back, and neither side is allowed to know how the other works.
> 
> The shapes are transcribed from `docs/WRIT-THE-COURT.md` §0, §4 and §5. Where
> that document is the law, this file is only its restatement in TypeScript, so
> if the two ever disagree the writ wins.
> 
> TYPES ONLY. Nothing here executes. The court computes these; the battle reads
> them and never computes one 

## Shape

- **Lines:** 344
- **Exported symbols (38):** `Absence`, `Aftermath`, `AnswerKind`, `CONTRACT`, `CaptainFate`, `Captive`, `Command`, `ContingentFate`, `ContingentSource`, `ContractVersion`, `Crowns`, `Deed`, `Disposition`, `Fraction`, `Ground`, `GroundResult`, `Host`, `HostCaptain`, `HostContingent`, `HostStanding`, `HostUnit`, `Latecomer`, `Leagues`, `Men`, `Occasion`, `Quirk`, `ReachBand`, `Sacks`, `Score`, `SeasonId`, `Spoils`, `Stamp`, `Supply`, `Tally`, `Term`, `TroopKind`, `UnitFate`, `WeightBand`

## Modules

- [[src/core/primitives.ts]] — *imported by this file*

## Backlinks

### Writs that specify it

- [[OPEN QUESTIONS]] — *this writ names `AnswerKind`; this writ names `CaptainFate`; +1 more*
- [[WRIT — THE COURT]] — *this writ names `AnswerKind`; this writ names `CaptainFate`; +10 more*

### Modules

- [[src/battle/aftermath.ts]] — *imported by this file*
- [[src/battle/engine.ts]] — *imported by this file*
- [[src/battle/herald.ts]] — *imported by this file*
- [[src/battle/setup.ts]] — *imported by this file*
- [[src/battle/terrain.ts]] — *imported by this file*
- [[src/battle/types.ts]] — *imported by this file*

### Invariants that enforce it

*These roads come from a shared source FILE, not from a semantic claim: the test file imports the module. Read it as "stands near", never as "proves".*

- [[1. thirty stored battles, each fought twice, byte for byte the same]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[2. walking the units BACKWARDS changes nothing]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[3. the header alone refights the battle]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[4. the Tide recomputed from the log's own lines equals every logged value]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[a broken unit that gets clear of the enemy RALLIES, once and only once]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[a grudge the court recorded is a tactic that does not happen]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[a horn is a trigger the player pulls by hand]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[a plan fires with NO heed check — the loophole in the politics, deliberately left open]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[A SIDEARM IS WORTH MORE THAN ANY STAT: spear and sword wins the clash AND survives the press]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[a standing plan fires the instant its trigger does; a courier takes nine seconds]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[a unit that can see the Crown Banner takes the signal in one second and spends no rider]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[an interpretation logs every term of the heed, so a defeat can be read]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[an oath clamps outright refusal into foot-dragging]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[armour is a wall, not a slope — the cube law, against the worked numbers]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[backing out of a melee is paid for in blood]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[braced and steady, the horses stop and almost nobody dies]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[COURIER SCARCITY IS THE COURT'S HAND ON YOUR THROAT: with the riders out, the word never leaves]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[every captain gets a fate and a word the court will use about him]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[every morale event carries the terms that made it]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[every one of the six is reachable, and each names its political cause]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[every shock event says the speed the refusal took away]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[going over a captain's head is an order obeyed and an insult remembered]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[long weapons drop to one fighting rank in the press]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[MORALE LIVES INSIDE THE COUNTER: braced but frightened and ragged is far worse]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[OBEY and OBEY-HIS-WAY count as obeyed; the rest do not]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[only one side holds the field, or neither]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[reproduces K.melee.verifiedRatios for pikes against company swords]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[rout, pursuit and an end to the day are all reachable]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[the arcs are worth what the manual says: flank and rear beat the front]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[the charger's own dead follow the same order — a stalled charge kills nobody, including its own]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[the engine names no blame — the court computes its own]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[THE FIVE NUMBERS SUM TO THE MUSTER, EXACTLY, for every unit of every battle]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[THE INVERSION: a knife-carrying spear line's whole fortune turns at the six-second mark]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[the log reads as a chronicle: the heralds tell the day without a picture]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[the number of riders IS the Host's orderCapacity]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[the ordering the arithmetic actually produces, asserted whole]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[the physicians tilt dead toward wounded, and nothing else moves]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[the receipts the court reads: ordersGiven and ordersObeyed]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[the ruleset hash is stable and is carried in the header]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[the same charge, told twice, gives the same answer]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[the SUPPORT veto: he looks upon a rival hard-pressed, and looks away]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[turning the log off does not change one value]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[unbraced, the same spears take materially more]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*
- [[veterancy is earned by time in contact and capped where the court expects]] — *reached by the test FILE through its helper `test/fixtures.ts` (shared source, not a claim about this one test)*

---

*Generated by `tools/codex/emit.mjs` from `src/core/contract.ts`:1. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
