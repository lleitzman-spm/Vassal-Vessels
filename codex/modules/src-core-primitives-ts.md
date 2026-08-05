---
type: "module"
id: "module:src/core/primitives.ts"
title: "src/core/primitives.ts"
standing: "built"
standing_source: "derived"
source_path: "src/core/primitives.ts"
source_line: 1
origin: "derived"
generator: "tools/codex/emit.mjs"
aliases:
  - "module:src/core/primitives.ts"
---

# src/core/primitives.ts

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

268 lines · 34 exported symbols.

## What the file says of itself

> WHY THIS FILE EXISTS. Everything in Vassal Vessels is counted in whole
> numbers, and this is where the whole numbers are defined. The constitution
> (law: determinism and the replay) puts it plainly — not one floating-point
> number anywhere in the simulation, because two machines are allowed to
> disagree about the last digit of a fraction, and a battle that disagrees
> about the last digit will, ten thousand ticks later, disagree about who won.
> 
> So there is exactly ONE division in the engine and it lives below, wrapped in
> `idiv`, which always rounds DOWN — including for negative numbers, where
> JavaSc

## Shape

- **Lines:** 268
- **Exported symbols (34):** `CONTRACT`, `ContractVersion`, `Crowns`, `Fraction`, `Leagues`, `Men`, `PRODUCT_BOUND_NARROW`, `PRODUCT_BOUND_WIDE`, `Quirk`, `RngState`, `Sacks`, `Score`, `SeasonId`, `Stamp`, `Tally`, `Term`, `absi`, `assertWide`, `bitLength`, `clamp`, `hashSeed`, `idiv`, `imul32`, `isqrt`, `makeRng`, `maxi`, `mini`, `next`, `permille`, `permillion`, `rnd`, `rollPermille`, `splitmix32`, `sq`

## Governing numbers

- [[Battle: Integer Law]] — *this module names `battle.integerLaw` literally*

## Backlinks

### Writs that specify it

- [[WRIT — THE BATTLE]] — *this writ names `bitLength`; this writ names `rollPermille`*
- [[WRIT — THE COURT]] — *this writ names `ContractVersion`; this writ names `SeasonId`*

### Modules

- [[src/battle/aftermath.ts]] — *imported by this file*
- [[src/battle/engine.ts]] — *imported by this file*
- [[src/battle/geometry.ts]] — *imported by this file*
- [[src/battle/herald.ts]] — *imported by this file*
- [[src/battle/los.ts]] — *imported by this file*
- [[src/battle/phase-army.ts]] — *imported by this file*
- [[src/battle/phase-command.ts]] — *imported by this file*
- [[src/battle/phase-fight.ts]] — *imported by this file*
- [[src/battle/phase-morale.ts]] — *imported by this file*
- [[src/battle/phase-move.ts]] — *imported by this file*
- [[src/battle/setup.ts]] — *imported by this file*
- [[src/battle/terrain.ts]] — *imported by this file*
- [[src/battle/tide.ts]] — *imported by this file*
- [[src/core/contract.ts]] — *imported by this file*
- [[src/core/rng.ts]] — *imported by this file*
- [[src/core/trig.ts]] — *imported by this file*
- [[src/court/absorb.ts]] — *imported by this file*
- [[src/court/answer.ts]] — *imported by this file*
- [[src/court/cabals.ts]] — *imported by this file*
- [[src/court/calendar.ts]] — *imported by this file*
- [[src/court/codex.ts]] — *imported by this file*
- [[src/court/contract.ts]] — *imported by this file*
- [[src/court/crown.ts]] — *imported by this file*
- [[src/court/distance.ts]] — *imported by this file*
- [[src/court/favours.ts]] — *imported by this file*
- [[src/court/forecast.ts]] — *imported by this file*
- [[src/court/founding.ts]] — *imported by this file*
- [[src/court/grievances.ts]] — *imported by this file*
- [[src/court/host.ts]] — *imported by this file*
- [[src/court/house.ts]] — *imported by this file*
- [[src/court/index.ts]] — *imported by this file*
- [[src/court/kin.ts]] — *imported by this file*
- [[src/court/land.ts]] — *imported by this file*
- [[src/court/loyalty.ts]] — *imported by this file*
- [[src/court/price.ts]] — *imported by this file*
- [[src/court/records.ts]] — *imported by this file*
- [[src/court/seats.ts]] — *imported by this file*
- [[src/court/tally.ts]] — *imported by this file*
- [[src/court/tenure.ts]] — *imported by this file*
- [[src/court/tracks.ts]] — *imported by this file*
- [[src/court/types.ts]] — *imported by this file*
- [[src/court/vessel.ts]] — *imported by this file*
- [[src/court/world.ts]] — *imported by this file*

### Invariants that enforce it

*These roads come from a shared source FILE, not from a semantic claim: the test file imports the module. Read it as "stands near", never as "proves".*

- [[A SIDEARM IS WORTH MORE THAN ANY STAT: spear and sword wins the clash AND survives the press]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[a step of a thousand millimetres lands within a millimetre of where it should]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[a unit's stream depends on its index and on nothing else]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[angles fold the way a compass folds]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[armour is a wall, not a slope — the cube law, against the worked numbers]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[atan2B points where it was pointed, in every octant]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[backing out of a melee is paid for in blood]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[clamp, permille and bitLength do the obvious thing]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[cloning a stream reads it without moving it]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[different seeds give different sequences]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[idiv floors, including on the negative side of the field]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[isqrt is exact, and stays exact at the sizes the field uses]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[long weapons drop to one fighting rank in the press]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[reproduces K.melee.verifiedRatios for pikes against company swords]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[rnd stays inside its bounds and jitter8 is -8..+8]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[sha256 agrees with the published test vectors]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[the arcs are worth what the manual says: flank and rear beat the front]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[THE INVERSION: a knife-carrying spear line's whole fortune turns at the six-second mark]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[the quarter turns are exact]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[the same seed gives the same sequence, forever]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[the signs are right in every quadrant, and the curve is symmetric]] — *imported by the test FILE (shared source, not a claim about this one test)*

---

*Generated by `tools/codex/emit.mjs` from `src/core/primitives.ts`:1. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
