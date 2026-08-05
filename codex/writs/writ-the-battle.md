---
type: "writ"
id: "writ:docs/WRIT-THE-BATTLE.md"
title: "WRIT — THE BATTLE"
standing: "proposed"
standing_source: "docs/WRIT-THE-BATTLE.md"
source_path: "docs/WRIT-THE-BATTLE.md"
source_line: 1
origin: "derived"
generator: "tools/codex/emit.mjs"
aliases:
  - "writ:docs/WRIT-THE-BATTLE.md"
---

# WRIT — THE BATTLE

> **STANDING — PROPOSED ⚠**  
> NOT BUILT. A design in `data/` with no engine reading it yet. This page may NEVER be cited as evidence that the game plays this way.  
> *Declared in `docs/WRIT-THE-BATTLE.md`.*

The implementable specification of the battle simulation. Someone must be able to build the engine from this document and `data/*.json` without asking a question. Every formula, every mutation, every ordering. Constants are referenced as `K.<path>` and live in `data/constants.json` under the `battle

## The source, verbatim

> The implementable specification of the battle simulation. Someone must be able to build
> the engine from this document and `data/*.json` without asking a question. Every formula,
> every mutation, every ordering. Constants are referenced as `K.<path>` and live in
> `data/constants.json` under the `battle` key. Where a choice between the two source
> battle designs was made, the choice is stated inline.

*Verified against `docs/WRIT-THE-BATTLE.md`:1 on every lint — no quote, no object.*

## Outline

- 0. LAWS OF ARITHMETIC
  - 0.1 The Integer Law (design A — chosen over design B's doubles because the spine
  - 0.2 Units of measure
  - 0.3 Trigonometry
  - 0.4 Random numbers
  - 0.5 Double buffering
- 1. STATE
  - 1.1 `BattleState`
  - 1.2 `Unit`
  - 1.3 `Contingent` and `Captain`
  - 1.4 `Courier`, `Volley`, `StandingPlan`, `Army`
- 2. INITIALISATION
  - 2.1 Terrain
  - 2.2 Units from the Host
  - 2.3 Command
- 3. GEOMETRY HELPERS (design A, unchanged)
  - 3.1 `recomputeGeometry(u)`
  - 3.2 Front line, arcs, overlap, gaps
  - 3.3 Terrain sampling and line of sight
  - 3.4 Spatial hash
- 4. THE TICK
  - PHASE 1 — COMMAND
  - PHASE 2 — PERCEPTION
  - PHASE 3 — INTENT
  - PHASE 4 — MOVEMENT
  - PHASE 5 — CONTACT AND SHOCK
  - PHASE 6 — MELEE (design A verbatim — the Six Seconds)
  - PHASE 7 — MISSILES (design A verbatim)
  - PHASE 8 — ATTRITION
  - PHASE 9 — MORALE
  - PHASE 10 — ROUT AND PURSUIT
  - PHASE 11 — ARMY AND TIDE
  - PHASE 12 — VICTORY
  - PHASE 13 — LOG
- 5. THE REPLAY LOG
- 6. THE AFTERMATH
- 7. DETERMINISM TEST (required, not optional)
- 8. IMPLEMENTATION ORDER

## Units

- [[Knights]] — *this writ names "Knights" literally*

## Keywords

- [[Mercenary]] — *this writ names "Mercenary" literally*
- [[Mounted]] — *this writ names "Mounted" literally*
- [[Pavise (keyword)]] — *this writ names "Pavise" literally*
- [[Pursuer]] — *this writ names "Pursuer" literally*
- [[Stakes]] — *this writ names "Stakes" literally*

## Equipment

- [[No Shield]] — *this writ names "No Shield" literally*
- [[Pavise]] — *this writ names "Pavise" literally*

## Governing numbers

- [[Battle: Aftermath]] — *this writ names `K.aftermath` literally; this writ names `ransomCrownsPerStandingPoint`*
- [[Battle: Captains]] — *this writ names `battle.captains` literally; this writ names `contingentMoraleOnCaptainFall`; +4 more*
- [[Battle: Cohesion]] — *this writ names `K.cohesion` literally; this writ names `startBase`; +1 more*
- [[Battle: Command]] — *this writ names `K.command` literally; this writ names `reinforcementSightedLeadTicks`; +2 more*
- [[Battle: Melee]] — *this writ names `K.melee` literally*
- [[Battle: Morale]] — *this writ names `battle.morale` literally; this writ names `ceilingFromResolveBase`; +7 more*
- [[Battle: Refusal]] — *this writ names `K.refusal` literally*
- [[Battle: Shock]] — *this writ names `K.shock` literally*
- [[Battle: Space]] — *this writ names `tileMm`; this writ names `tilesX`; +1 more*
- [[Battle: Terrain]] — *this writ names `battle.terrain` literally; this writ names `K.battle.terrain` literally*
- [[Battle: Tide]] — *this writ names `K.tide` literally*
- [[Battle: Time]] — *this writ names `K.time` literally; this writ names `maxTicks`; +1 more*

## Orders

- [[Advance]] — *this writ names "Advance" literally*
- [[Attack]] — *this writ names "Attack" literally*
- [[Charge]] — *this writ names "Charge" literally*
- [[Exhort]] — *this writ names "Exhort" literally*
- [[Screen]] — *this writ names "Screen" literally*
- [[Support]] — *this writ names "Support" literally*
- [[Withdraw]] — *this writ names "Withdraw" literally*

## Standing plans

- [[HORN_SOUNDED]] — *this writ names "HORN_SOUNDED" literally*

## Traits

- [[Aggression]] — *this writ names "Aggression" literally*
- [[Caution]] — *this writ names "Caution" literally*
- [[Command]] — *this writ names "Command" literally*
- [[Valour]] — *this writ names "Valour" literally*

## Quirks

- [[Boastful]] — *this writ names "Boastful" literally*
- [[Craven]] — *this writ names "Craven" literally*

## Modules

- [[src/battle/engine.ts]] — *this writ names `ReplayLog`; this writ names `rulesetHash`; +1 more*
- [[src/battle/geometry.ts]] — *this writ names `engagementGapMm`; this writ names `gapBetween`; +3 more*
- [[src/battle/index.ts]] — *this writ names `armourEff`; this writ names `BattleState`; +4 more*
- [[src/battle/log.ts]] — *this writ names `LogWriter`*
- [[src/battle/phase-command.ts]] — *this writ names `inSignal`*
- [[src/battle/phase-fight.ts]] — *this writ names `armourEff`*
- [[src/battle/terrain.ts]] — *this writ names `elevationMm`; this writ names `gradePermille`; +4 more*
- [[src/battle/types.ts]] — *this writ names `BattleState`; this writ names `ChargeId`; +3 more*
- [[src/core/primitives.ts]] — *this writ names `bitLength`; this writ names `rollPermille`*
- [[src/core/tables.ts]] — *this writ names `TIDE_DECAY`*

## Backlinks

*Nothing in the Codex points here. An orphan page is worse than a missing one — it exists, it is correct, and no reader will ever reach it. `npm run codex:lint` counts these.*

## Documents that cite this source

*These name this FILE by its path. That is a citation of the source, not a claim about any one idea inside it — do not read a path citation as agreement, dependence or implementation.*

- [[OPEN QUESTIONS]]
- [[VASSAL VESSELS — The Constitution]]
- [[WRIT — THE COURT]]
- [[Writ of the Codex — the living manual, and the law that keeps it honest]]

## Sources this page cites

*Files this page names by path. Again: a citation of the file, nothing more.*

- [[WRIT — THE COURT]]

---

*Generated by `tools/codex/emit.mjs` from `docs/WRIT-THE-BATTLE.md`:1. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
