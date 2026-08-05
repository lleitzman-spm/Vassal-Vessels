---
type: "writ"
id: "writ:docs/WRIT-THE-COURT.md"
title: "WRIT — THE COURT"
standing: "proposed"
standing_source: "docs/WRIT-THE-COURT.md"
source_path: "docs/WRIT-THE-COURT.md"
source_line: 1
origin: "derived"
generator: "tools/codex/emit.mjs"
aliases:
  - "writ:docs/WRIT-THE-COURT.md"
---

# WRIT — THE COURT

> **STANDING — PROPOSED ⚠**  
> NOT BUILT. A design in `data/` with no engine reading it yet. This page may NEVER be cited as evidence that the game plays this way.  
> *Declared in `docs/WRIT-THE-COURT.md`.*

The implementable specification of the realm layer: the records, the readings computed over them, the calendar, the muster arithmetic, and the two contracts — `Host` and `Aftermath` — that join the court to the battle. The contracts are given as literal, commented TypeScript; everything here is pure

## The source, verbatim

> The implementable specification of the realm layer: the records, the readings computed
> over them, the calendar, the muster arithmetic, and the two contracts — `Host` and
> `Aftermath` — that join the court to the battle. The contracts are given as literal,
> commented TypeScript; everything here is pure, headless, deterministic code with no
> DOM, no rendering, no I/O. Constants are referenced as `K.<path>` and live in
> `data/constants.json` under the `court` key.

*Verified against `docs/WRIT-THE-COURT.md`:1 on every lint — no quote, no object.*

## Outline

- 0. Shared primitives
- 1. The records
  - The founding book and its records
  - The guards the compiler holds
- 2. The readings
  - Supporting reading shapes
- 3. The muster arithmetic
- 4. The Host — what the court hands the battle
- 5. The Aftermath — what the battle hands back
  - How the Aftermath becomes the next muster
- 6. Worked example (compressed)

## Worked examples

- [[The Host of Aldmarch]] — *this writ names "The Host of Aldmarch" literally*

## Units

- [[Knights]] — *this writ names "Knights" literally*
- [[Marines]] — *this writ names "Marines" literally*

## Keywords

- [[Mercenary]] — *this writ names "Mercenary" literally*

## Governing numbers

- [[Court: Act Days]] — *this writ names `court.actDays` literally; this writ names `K.court.actDays` literally*
- [[Court: Resolve Formula]] — *this writ names `court.resolveFormula` literally; this writ names `K.court.resolveFormula` literally*
- [[Court: Wear]] — *this writ names `restRecoveryPerDay`*

## Orders

- [[Charge]] — *this writ names "Charge" literally*
- [[Screen]] — *this writ names "Screen" literally*
- [[Support]] — *this writ names "Support" literally*

## Traits

- [[Aggression]] — *this writ names "Aggression" literally*
- [[Caution]] — *this writ names "Caution" literally*
- [[Command]] — *this writ names "Command" literally*
- [[Valour]] — *this writ names "Valour" literally*

## Seats

- [[The Chaplain]] — *this writ names "The Chaplain" literally*
- [[The Marshal]] — *this writ names "The Marshal" literally*
- [[The Spymaster]] — *this writ names "The Spymaster" literally*

## Obligations

- [[The Great Summons (obligation)]] — *this writ names "The Great Summons" literally*

## Grievances

- [[Blood-debt]] — *this writ names "Blood-debt" literally*
- [[The Great Summons]] — *this writ names "The Great Summons" literally*
- [[Unrewarded]] — *this writ names "Unrewarded" literally*

## Answers

- [[Comes short]] — *this writ names "Comes short" literally*

## Troop sources

- [[The Sworn Order]] — *this writ names "The Sworn Order" literally*

## Seasons

- [[Harvest (season)]] — *this writ names "Harvest" literally*
- [[Highsun (season)]] — *this writ names "Highsun" literally*
- [[Seedtime (season)]] — *this writ names "Seedtime" literally*
- [[Wolfmoon (season)]] — *this writ names "Wolfmoon" literally*

## Modules

- [[src/battle/engine.ts]] — *this writ names `runBattle`*
- [[src/battle/index.ts]] — *this writ names `runBattle`*
- [[src/core/contract.ts]] — *this writ names `AnswerKind`; this writ names `CaptainFate`; +10 more*
- [[src/core/primitives.ts]] — *this writ names `ContractVersion`; this writ names `SeasonId`*
- [[src/court/answer.ts]] — *this writ names `readAnswer`*
- [[src/court/cabals.ts]] — *this writ names `readCabals`*
- [[src/court/calendar.ts]] — *this writ names `readCalendar`*
- [[src/court/contract.ts]] — *this writ names `AnswerKind`; this writ names `CaptainFate`; +8 more*
- [[src/court/crown.ts]] — *this writ names `readAsCrown`*
- [[src/court/distance.ts]] — *this writ names `roadFactor`*
- [[src/court/favours.ts]] — *this writ names `readFavours`*
- [[src/court/forecast.ts]] — *this writ names `readForecast`*
- [[src/court/grievances.ts]] — *this writ names `readGrievances`*
- [[src/court/host.ts]] — *this writ names `readHost`*
- [[src/court/house.ts]] — *this writ names `readHouse`*
- [[src/court/index.ts]] — *this writ names `ActBase`; this writ names `AftermathRecord`; +43 more*
- [[src/court/land.ts]] — *this writ names `ravagedUntil`; this writ names `readCoffer`; +3 more*
- [[src/court/loyalty.ts]] — *this writ names `readLoyalty`*
- [[src/court/price.ts]] — *this writ names `readPrice`*
- [[src/court/records.ts]] — *this writ names `AcceptScutage`; this writ names `ActBase`; +11 more*
- [[src/court/seats.ts]] — *this writ names `readSeat`*
- [[src/court/tenure.ts]] — *this writ names `revocationGrievance`*
- [[src/court/tracks.ts]] — *this writ names `readTracks`*
- [[src/court/types.ts]] — *this writ names `AnswerKind`; this writ names `AnswerReading`; +3 more*
- [[src/court/vessel.ts]] — *this writ names `readVessel`*
- [[src/court/world.ts]] — *this writ names `turnTheWorld`*

## Backlinks

*Nothing in the Codex points here. An orphan page is worse than a missing one — it exists, it is correct, and no reader will ever reach it. `npm run codex:lint` counts these.*

## Documents that cite this source

*These name this FILE by its path. That is a citation of the source, not a claim about any one idea inside it — do not read a path citation as agreement, dependence or implementation.*

- [[OPEN QUESTIONS]]
- [[VASSAL VESSELS — The Constitution]]
- [[WRIT — THE BATTLE]]
- [[Writ of the Codex — the living manual, and the law that keeps it honest]]

## Sources this page cites

*Files this page names by path. Again: a citation of the file, nothing more.*

- [[WRIT — THE BATTLE]]

---

*Generated by `tools/codex/emit.mjs` from `docs/WRIT-THE-COURT.md`:1. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
