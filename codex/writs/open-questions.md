---
type: "writ"
id: "writ:docs/OPEN-QUESTIONS.md"
title: "OPEN QUESTIONS"
standing: "proposed"
standing_source: "docs/OPEN-QUESTIONS.md"
source_path: "docs/OPEN-QUESTIONS.md"
source_line: 1
origin: "derived"
generator: "tools/codex/emit.mjs"
aliases:
  - "writ:docs/OPEN-QUESTIONS.md"
---

# OPEN QUESTIONS

> **STANDING — PROPOSED ⚠**  
> NOT BUILT. A design in `data/` with no engine reading it yet. This page may NEVER be cited as evidence that the game plays this way.  
> *Declared in `docs/OPEN-QUESTIONS.md`.*

This file is where the seams live, so that they are not lost.

*Verified verbatim against `docs/OPEN-QUESTIONS.md`:1 on every lint — no quote, no object.*

## Outline

- 1. THE MOST SERIOUS ONE — the heed scale is the join of two differently-calibrated systems
- 2. Numbers chosen on feel
  - 2.1 The courier count — the designers' own flag, and we made it worse
  - 2.2 Standing-plan slots (`orderCapacity + 2`)
  - 2.3 The melee pacing — design B's own flag
  - 2.4 The Six Seconds is exactly 120 ticks
  - 2.5 The jitter is ±8
  - 2.6 The Tide's half-life is 15 seconds
  - 2.7 The treachery numbers
  - 2.8 The bridges between the court's 0–100 scales and the battle's bars
  - 2.9 Captain mortality
- 3. Where the three designs disagreed, and who lost
- 4. Joins that may not hold
  - 4.1 The standing-plan loophole is deliberately unbalanced
  - 4.2 Quirks are permitted to be ignored, which could become "ignored"
  - 4.3 Nothing lets a melee stop
  - 4.4 A Host says nothing about the other side, but four quirks point at it
  - 4.5 The Aftermath's sum invariant is strict and the pursuit is messy
  - 4.6 Village and brook
  - 4.7 The obligation days never reach the battle as a number
- 5. The court design's own doubt: is a dice-free muster too legible?
- 6. Seams in the data model itself
- 7. Things only play will answer
- 8. How to close a question
- Raised by the court build
  - C1. Five data files the writ names do not exist
  - C2. The court's constants are transcribed, not loaded — because the layer may not read a file
  - C3. Nine answers, ten answer kinds
  - C4. Kinship is counted once, in loyalty, not twice
  - C5. How blood kinship is told from marriage
  - C6. What a summons drinks from the vessel
  - C7. A vacant seat's grievance has no record behind it
  - C8. `UnitFate.veterancyGained` has no word in the record vocabulary
  - C9. Seat effect is a factor between a half and one, and `SeatRecord.base` is a bag of levers
  - C10. A vacant Marshalcy gives MORE authority and FEWER couriers
  - C11. Things the writ does not price at all
  - C12. Harvest willingness falls only on farmland
  - C13. A faction is counted one level deep
  - C14. Absences include houses that came SHORT, not only houses that did not come
  - C15. The chartered town and the Sworn Order are pulled OUT of their lord's roster
- Raised by the engine build
  - E1. THE MOST SERIOUS ONE — the morale floor makes routing impossible as written
  - E2. The morale and ceiling casualty formulas are out by a factor of a thousand
  - E3. A routing unit could never rally, because running is what routing is
  - E4. The engine's vocabulary is coarser than `data/orders.json`'s
  - E5. The refusal counter's third case cannot behave as the brief describes
  - E6. Deployment inside "its own third" of an 800 m field is fatal to the attacker
  - E7. The double buffer's fold points are not stated
  - E8. The order of the lines in the log is an output, and the writ does not say so
  - E9. In the pursuit, phases 5, 11 and 12 must still run
  - E10. Several smaller readings, each taken once and marked in the code
  - E11. What the determinism test cannot do from inside one process
  - E12. Terrain, and what is deliberately not modelled
  - E13. Quirks honoured, and quirks ignored

## Units

- [[Household Guard]] — *this writ names "Household Guard" literally*

## Keywords

- [[Mercenary]] — *this writ names "Mercenary" literally*

## Formations

- [[Open Order]] — *this writ names "Open Order" literally*

## Governing numbers

- [[Battle: Captains]] — *this writ names `fallPermilleOnBannerUnitBreak`*
- [[Battle: Heed]] — *this writ names `K.heed` literally*
- [[Battle: Melee]] — *this writ names `battle.melee` literally; this writ names `K.battle.melee` literally*
- [[Battle: Refusal]] — *this writ names `braceMulUnbracedPermille`*
- [[Court: Act Days]] — *this writ names `court.actDays` literally; this writ names `K.court.actDays` literally*
- [[Court: Battle Joins]] — *this writ names `authorityBase`; this writ names `authorityCrownBloodBonus`; +1 more*
- [[Court: Loyalty]] — *this writ names `kinshipBlood`; this writ names `kinshipMarriage`*
- [[Court: Willingness]] — *this writ names `harvestCallFarmland`*

## Orders

- [[Advance]] — *this writ names "Advance" literally*
- [[Charge]] — *this writ names "Charge" literally*
- [[Envelop]] — *this writ names "Envelop" literally*
- [[Screen]] — *this writ names "Screen" literally*

## Standing plans

- [[ENEMY_ENTERS_ZONE]] — *this writ names "ENEMY_ENTERS_ZONE" literally*
- [[ENGAGED_FOR_TICKS]] — *this writ names "ENGAGED_FOR_TICKS" literally*

## Traits

- [[Command]] — *this writ names "Command" literally*
- [[Valour]] — *this writ names "Valour" literally*

## Quirks

- [[Boastful]] — *this writ names "Boastful" literally*

## Seats

- [[The Marshal]] — *this writ names "The Marshal" literally*
- [[The Spymaster]] — *this writ names "The Spymaster" literally*

## Obligations

- [[The Household]] — *this writ names "The Household" literally*

## Holdings

- [[Castle]] — *this writ names "Castle" literally*
- [[Horse-run]] — *this writ names "Horse-run" literally*
- [[March-fort]] — *this writ names "March-fort" literally*

## Answers

- [[Refuses]] — *this writ names "Refuses" literally*

## Troop sources

- [[The Household (troop-source)]] — *this writ names "The Household" literally*
- [[The Sworn Order]] — *this writ names "The Sworn Order" literally*

## Seasons

- [[Harvest]] — *this writ names "Harvest" literally*

## Modules

- [[src/battle/engine.ts]] — *this writ names `runBattle`*
- [[src/battle/index.ts]] — *this writ names `runBattle`; this writ names `TriggerId`*
- [[src/battle/orders.ts]] — *this writ names `TRIGGERS_NOT_YET_WATCHED`*
- [[src/battle/types.ts]] — *this writ names `TriggerId`*
- [[src/core/contract.ts]] — *this writ names `AnswerKind`; this writ names `CaptainFate`; +1 more*
- [[src/court/answer.ts]] — *this writ names `readAnswer`*
- [[src/court/codex.ts]] — *this writ names `UNPRICED_ACTS`*
- [[src/court/contract.ts]] — *this writ names `AnswerKind`; this writ names `CaptainFate`; +1 more*
- [[src/court/forecast.ts]] — *this writ names `readForecast`*
- [[src/court/index.ts]] — *this writ names `AftermathRecord`; this writ names `AnswerKind`; +6 more*
- [[src/court/records.ts]] — *this writ names `AcceptScutage`; this writ names `AftermathRecord`; +1 more*
- [[src/court/types.ts]] — *this writ names `AnswerKind`; this writ names `SeatReading`*

## Backlinks

*Nothing in the Codex points here. An orphan page is worse than a missing one — it exists, it is correct, and no reader will ever reach it. `npm run codex:lint` counts these.*

## Documents that cite this source

*These name this FILE by its path. That is a citation of the source, not a claim about any one idea inside it — do not read a path citation as agreement, dependence or implementation.*

- [[VASSAL VESSELS — The Constitution]]

## Sources this page cites

*Files this page names by path. Again: a citation of the file, nothing more.*

- [[src/battle/engine.ts]]
- [[src/battle/herald.ts]]
- [[src/battle/orders.ts]]
- [[src/court/codex.ts]]
- [[VASSAL VESSELS — The Constitution]]
- [[WRIT — THE BATTLE]]
- [[WRIT — THE COURT]]

---

*Generated by `tools/codex/emit.mjs` from `docs/OPEN-QUESTIONS.md`:1. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
