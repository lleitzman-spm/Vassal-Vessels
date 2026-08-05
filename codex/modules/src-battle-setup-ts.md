---
type: "module"
id: "module:src/battle/setup.ts"
title: "src/battle/setup.ts"
standing: "built"
standing_source: "derived"
source_path: "src/battle/setup.ts"
source_line: 1
origin: "derived"
generator: "tools/codex/emit.mjs"
aliases:
  - "module:src/battle/setup.ts"
---

# src/battle/setup.ts

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

573 lines · 6 exported symbols.

## What the file says of itself

> WHY THIS FILE EXISTS. Everything the battle needs is decided here, once, and
> then the tick loop only ever changes numbers. A Host is a political document;
> this module turns it into bodies on ground: how brave they start, how well
> dressed their ranks are, how many riders you have, and where they stand.
> 
> THE MAPPINGS FROM THE COURT'S SCALE TO THE FIELD'S ARE THIS CANON'S OWN.
> Neither source design carried both scales, so the four bridges below —
> resolve into a morale ceiling, social cohesion into a cohesion bar, hunger
> into ceiling loss, arrears into a morale floor — are choices, written down in

## Shape

- **Lines:** 573
- **Exported symbols (6):** `BattleInput`, `bindPlan`, `initState`, `sideStrength`, `tickFraction`, `unitFormation`

## Governing numbers

- [[Battle: Cohesion]] — *this module names `K.cohesion` literally*
- [[Battle: Command]] — *this module names `K.command` literally*
- [[Battle: Morale]] — *this module names `K.morale` literally*
- [[Battle: Scales]] — *this module names `K.scales` literally*

## Modules

- [[src/battle/catalog.ts]] — *imported by this file*
- [[src/battle/geometry.ts]] — *imported by this file*
- [[src/battle/rules.ts]] — *imported by this file*
- [[src/battle/terrain.ts]] — *imported by this file*
- [[src/battle/types.ts]] — *imported by this file*
- [[src/core/contract.ts]] — *imported by this file*
- [[src/core/primitives.ts]] — *imported by this file*
- [[src/core/rng.ts]] — *imported by this file*

## Backlinks

### Modules

- [[src/battle/engine.ts]] — *imported by this file*
- [[src/battle/index.ts]] — *imported by this file*
- [[src/battle/phase-command.ts]] — *imported by this file*

### Invariants that enforce it

*These roads come from a shared source FILE, not from a semantic claim: the test file imports the module. Read it as "stands near", never as "proves".*

- [[a grudge the court recorded is a tactic that does not happen]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[A SIDEARM IS WORTH MORE THAN ANY STAT: spear and sword wins the clash AND survives the press]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[an interpretation logs every term of the heed, so a defeat can be read]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[an oath clamps outright refusal into foot-dragging]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[armour is a wall, not a slope — the cube law, against the worked numbers]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[backing out of a melee is paid for in blood]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[braced and steady, the horses stop and almost nobody dies]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[every one of the six is reachable, and each names its political cause]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[going over a captain's head is an order obeyed and an insult remembered]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[long weapons drop to one fighting rank in the press]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[MORALE LIVES INSIDE THE COUNTER: braced but frightened and ragged is far worse]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[OBEY and OBEY-HIS-WAY count as obeyed; the rest do not]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[reproduces K.melee.verifiedRatios for pikes against company swords]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[the arcs are worth what the manual says: flank and rear beat the front]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[the charger's own dead follow the same order — a stalled charge kills nobody, including its own]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[THE INVERSION: a knife-carrying spear line's whole fortune turns at the six-second mark]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[the ordering the arithmetic actually produces, asserted whole]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[the same charge, told twice, gives the same answer]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[the SUPPORT veto: he looks upon a rival hard-pressed, and looks away]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[unbraced, the same spears take materially more]] — *imported by the test FILE (shared source, not a claim about this one test)*

---

*Generated by `tools/codex/emit.mjs` from `src/battle/setup.ts`:1. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
