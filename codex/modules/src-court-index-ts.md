---
type: "module"
id: "module:src/court/index.ts"
title: "src/court/index.ts"
standing: "built"
standing_source: "derived"
source_path: "src/court/index.ts"
source_line: 1
origin: "derived"
generator: "tools/codex/emit.mjs"
aliases:
  - "module:src/court/index.ts"
---

# src/court/index.ts

> **STANDING — BUILT**  
> Implemented in code and checkable against the tree — a module or a test stands under it.  
> *Derived from the tree — the code is there to be read.*

176 lines · 181 exported symbols.

## What the file says of itself

> WHY THIS FILE EXISTS. One door into the court, so a front end, a test or the
> battle can take what it needs without learning the shape of the inside. The
> order below is the writ's order: the records first, because they are the only
> thing that exists; then the readings, which are all computed and none stored;
> then the two contracts that join this half of the game to the other.

## Shape

- **Lines:** 176
- **Exported symbols (181):** `ANSWERS`, `Absence`, `Act`, `ActBase`, `ActKind`, `Aftermath`, `AftermathRecord`, `Amends`, `AnswerBand`, `AnswerKind`, `AnswerPetition`, `AnswerReading`, `Attaint`, `Betroth`, `Birth`, `CAUSES`, `CHOSEN`, `CONTRACT`, `COURT`, `Cabal`, `Calendar`, `Captain`, `CaptainFate`, `CaptainRecord`, `Captive`, `CauseRow`, `Charter`, `Chronicle`, `Command`, `Contingent`, `ContingentFate`, `ContingentSource`, `Contract`, `ContractVersion`, `ContractViolation`, `Crowns`, `Death`, `Deed`, `Disposition`, `Enfeoff`, `FAVOURS`, `Favour`, `FavourRow`, `Feast`, `Forecast`, `FoundingBook`, `Fraction`, `GRIEVANCES`, `Grievance`, `GrievanceRow`, `Ground`, `GroundResult`, `HOLDING_TYPES`, `Harvest`, `HoldingReading`, `HoldingRecord`, `HoldingTypeRow`, `Homage`, `Host`, `HostOccasion`, `HostStanding`, `HouseReading`, `HouseRecord`, `Invest`, `Journey`, `Latecomer`, `Leagues`, `Learn`, `March`, `Men`, `NameCommander`, `Occasion`, `Pay`, `Pestilence`, `Petition`, `Pick`, `Price`, `Proclaim`, `Provision`, `QUIRKS`, `Quirk`, `Raid`, `ReachBand`, `RealmPlan`, `RollEntry`, `RosterEntry`, `SEASONS`, `SEASON_ORDER`, `SEAT`, `SEAT_IDS`, `Sacks`, `Score`, `SeasonId`, `SeasonRow`, `SeatReading`, `SeatRecord`, `Selection`, `Spoils`, `Stamp`, `Summon`, `Supply`, `Tally`, `Tax`, `Term`, `Tourney`, `Track`, `TroopKind`, `UNIT_TYPES`, `Unit`, `UnitFate`, `UnitTypeRow`, `Vessel`, `Ward`, `Wed`, `WeightBand`, `absorb`, `actsOfKind`, `actsUpTo`, `addDays`, `assemble`, `assertCasualtiesAddUp`, `bandFor`, `bandOf`, `captainOf`, `computeObedience`, `computeResolve`, `computeTreachery`, `daysAvailable`, `daysBetween`, `describeHost`, `earliestFullMuster`, `enfeoffmentsOf`, `fellowsOf`, `foundRealm`, `holderOfHolding`, `holdingOf`, `holdingOfUnitId`, `houseOf`, `isKnown`, `owedMenOf`, `readAnswer`, `readAnswerFor`, `readAsCrown`, `readAuthority`, `readCabals`, `readCalendar`, `readCoffer`, `readFavours`, `readForecast`, `readGranary`, `readGrievances`, `readHolding`, `readHost`, `readHouse`, `readLegitimacy`, `readLoyalty`, `readMusterRoll`, `readMusterStrength`, `readNow`, `readOccasion`, `readOrderCapacity`, `readPrice`, `readSeat`, `readTracks`, `readVessel`, `readWillingness`, `rosterOf`, `seasonAt`, `seasonIndex`, `seatEffect`, `seatIsFilled`, `seatOf`, `selectionFor`, `serviceYear`, `stampAt`, `stampOf`, `trackFor`, `turnTheWorld`, `unitIdFor`, `veterancyOf`, `yearsBetween`

## Modules

- [[src/core/primitives.ts]] — *imported by this file*
- [[src/court/absorb.ts]] — *imported by this file*
- [[src/court/answer.ts]] — *imported by this file*
- [[src/court/cabals.ts]] — *imported by this file*
- [[src/court/calendar.ts]] — *imported by this file*
- [[src/court/codex.ts]] — *imported by this file*
- [[src/court/crown.ts]] — *imported by this file*
- [[src/court/favours.ts]] — *imported by this file*
- [[src/court/forecast.ts]] — *imported by this file*
- [[src/court/founding.ts]] — *imported by this file*
- [[src/court/grievances.ts]] — *imported by this file*
- [[src/court/host.ts]] — *imported by this file*
- [[src/court/house.ts]] — *imported by this file*
- [[src/court/land.ts]] — *imported by this file*
- [[src/court/loyalty.ts]] — *imported by this file*
- [[src/court/price.ts]] — *imported by this file*
- [[src/court/records.ts]] — *imported by this file*
- [[src/court/seats.ts]] — *imported by this file*
- [[src/court/tracks.ts]] — *imported by this file*
- [[src/court/types.ts]] — *imported by this file*
- [[src/court/vessel.ts]] — *imported by this file*
- [[src/court/world.ts]] — *imported by this file*

## Backlinks

### Writs that specify it

- [[OPEN QUESTIONS]] — *this writ names `AftermathRecord`; this writ names `AnswerKind`; +6 more*
- [[WRIT — THE COURT]] — *this writ names `ActBase`; this writ names `AftermathRecord`; +43 more*

### Invariants that enforce it

*These roads come from a shared source FILE, not from a semantic claim: the test file imports the module. Read it as "stands near", never as "proves".*

- [[A VACANT MARSHALCY DEMONSTRABLY REDUCES HOW MANY CONTINGENTS CAN BE DIRECTED]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[accepts a report whose five numbers sum to the strength at muster]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[adds its terms to its value, exactly, for every house]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[advances only because something was DONE — there is no end-turn]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[carries the contract version and a seed derived from the records]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[changes with the seed, and only with the seed]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[checks the armour scores against data/equipment.json rather than a memory]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[counts every draw past the bond, and the price escalates]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[drains as summonses drink and refills at the new year]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[FAILS LOUDLY when they do not, and never reconciles them silently]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[finds houses that share a grudge pointing at the same record]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[gives the crown a day-book and one track for every seat, filled or not]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[gives the roads their due: men arrive tired, and the court owns it]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[gives the same answer every time, with no die anywhere in the path]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[gives the same answer twice from the same records]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[grants the Marshalcy and the battle feels it — two more contingents can be directed]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[halves a ravaged holding’s yield for a year, and then stops]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[has exactly nine bands, in falling order, ending in turncoat]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[has no random number generator anywhere in the muster path]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[hides a grudge the crown never learned of — until a record says otherwise]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[is a step, never a slope: the same band gives the same fraction throughout]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[is four for an ordinary Marshal and six for a great one]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[is never worse than empty, only wasted]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[is seeded: the same chronicle always has the same weather]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[is tested on BOTH sides of every boundary]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[is the enfeoffment: the terms are in the record, not in a ledger]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[is two when the Marshalcy is vacant — and that is a decision, not a default]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[keeps no host, no loyalties and no muster on the chronicle]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[keeps the four political numbers inside the scale, on contingents and units alike]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[keeps units flat, and every unit belongs to a contingent that claims it]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[leaves no number on disk that the court silently ignores]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[leaves no residue anywhere: loyalty, willingness and the host all return]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[lets custom rot after three straight years of coin instead of men]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[loses the wing with the land]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[matches data/constants.json → court, key for key and digit for digit]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[matches the court’s half of data/units.json]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[musters a host, names every absence, and shows the Marshalcy in the order capacity]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[names every captain it mentions]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[names every unit for its home, so losing land loses a named wing]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[names its claimants and what passing them over would cost]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[names the terms a player would want to argue with]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[never hands back a day outside the window it was asked for]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[points every term at the records that made it]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[prices a dry-cup summons BEFORE the letter is sent]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[prices the act before it is taken]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[PROVES THE LOOP: a blood-debt changes the next muster’s arithmetic]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[raises named units OF a place, with its garrison held back]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[raises only unit types the roster knows, from holdings the roster mentions]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[reads the two chests off the records, and nothing else]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[records veterancy, capped, so survivors compound but never run away with it]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[refuses to read a host for a war nobody declared]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[regranting on better terms is permanent, and the vessel is bigger from that day]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[reports the supply as days, not sacks, because days are the war mechanic]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[returns tallies whose terms sum to their value]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[round-trips a stamp through its absolute day]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[settles a grudge with amends, and the men come back]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[sheds the BEST men first when a house comes short — worst-kept-LAST]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[shows a dry cup as a named term in the answer, at the escalating rate]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[shows the deadlines a player is entitled to see]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[slights a house, and the same summons is answered worse]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[stores nothing: every reading can be taken from a frozen chronicle]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[strikes an enfeoffment and the house owes nothing and raises nobody]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[takes the dead off the holding’s roll, so a named wing is smaller next time]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[takes the grievance away completely when the act is struck out]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[turns customary at eight years and hereditary at sixteen, and says what taking it back costs]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[walks the ladder all the way down to a refusal, and then to a turned coat]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[writes a blood-debt ONLY for losses far worse than everybody else’s]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[writes a defeat into legitimacy, and the next cause is worth less]] — *imported by the test FILE (shared source, not a claim about this one test)*
- [[writes RECORDS and never touches the muster directly]] — *imported by the test FILE (shared source, not a claim about this one test)*

---

*Generated by `tools/codex/emit.mjs` from `src/court/index.ts`:1. **Never edit this page** — it is a view, not an artifact. Fix the source and re-compile (`npm run codex`).*
