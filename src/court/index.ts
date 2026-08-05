// WHY THIS FILE EXISTS. One door into the court, so a front end, a test or the
// battle can take what it needs without learning the shape of the inside. The
// order below is the writ's order: the records first, because they are the only
// thing that exists; then the readings, which are all computed and none stored;
// then the two contracts that join this half of the game to the other.

// ── The records: the whole of the state ────────────────────────────────────
export type {
  Act,
  ActBase,
  ActKind,
  AftermathRecord,
  Amends,
  AnswerPetition,
  Attaint,
  Betroth,
  Birth,
  CaptainRecord,
  Charter,
  Chronicle,
  Contract,
  Death,
  Enfeoff,
  Feast,
  FoundingBook,
  Harvest,
  HoldingRecord,
  Homage,
  HouseRecord,
  Invest,
  Learn,
  March,
  NameCommander,
  Pay,
  Pestilence,
  Petition,
  Proclaim,
  Provision,
  Raid,
  RollEntry,
  SeatRecord,
  Summon,
  Tax,
  Tourney,
  Ward,
  Wed,
} from './records.js';
export { actsOfKind, actsUpTo, captainOf, holdingOf, houseOf, seatOf } from './records.js';

// ── The shared words ───────────────────────────────────────────────────────
export type {
  ContractVersion,
  Crowns,
  Fraction,
  Leagues,
  Men,
  Quirk,
  Sacks,
  Score,
  SeasonId,
  Stamp,
  Tally,
  Term,
} from '../core/primitives.js';
export { CONTRACT } from '../core/primitives.js';

// ── The calendar ───────────────────────────────────────────────────────────
export {
  addDays,
  daysBetween,
  readCalendar,
  readNow,
  seasonAt,
  seasonIndex,
  serviceYear,
  stampAt,
  stampOf,
  yearsBetween,
} from './calendar.js';

// ── The readings ───────────────────────────────────────────────────────────
export { readHouse } from './house.js';
export { bandOf, readLoyalty } from './loyalty.js';
export { readGrievances, isKnown, holderOfHolding } from './grievances.js';
export { readFavours } from './favours.js';
export { readCabals, fellowsOf } from './cabals.js';
export { readSeat, readOrderCapacity, readAuthority, seatEffect, seatIsFilled } from './seats.js';
export { readTracks, daysAvailable } from './tracks.js';
export { readAsCrown } from './crown.js';
export { readHolding, readMusterRoll, readCoffer, readGranary, unitIdFor, holdingOfUnitId } from './land.js';
export { readVessel, owedMenOf, enfeoffmentsOf } from './vessel.js';
export {
  bandFor,
  readAnswer,
  readAnswerFor,
  readLegitimacy,
  readOccasion,
  readWillingness,
  rosterOf,
  selectionFor,
} from './answer.js';
export type { Occasion, Pick, RosterEntry, Selection } from './answer.js';
export { readForecast, readMusterStrength, earliestFullMuster } from './forecast.js';
export { readPrice, trackFor } from './price.js';
export { assemble, readHost, computeObedience, computeResolve, computeTreachery, veterancyOf } from './host.js';
export { turnTheWorld } from './world.js';
export { absorb, assertCasualtiesAddUp, ContractViolation } from './absorb.js';

// ── The reading shapes ─────────────────────────────────────────────────────
export type {
  AnswerKind,
  AnswerReading,
  Cabal,
  Calendar,
  Favour,
  Forecast,
  Grievance,
  HoldingReading,
  HouseReading,
  Journey,
  Price,
  SeatReading,
  Track,
  Vessel,
} from './types.js';

// ── The contract with the battle ───────────────────────────────────────────
export type {
  Absence,
  Aftermath,
  Captain,
  CaptainFate,
  Captive,
  Command,
  Contingent,
  ContingentFate,
  ContingentSource,
  Deed,
  Disposition,
  Ground,
  GroundResult,
  Host,
  HostStanding,
  Latecomer,
  Occasion as HostOccasion,
  ReachBand,
  Spoils,
  Supply,
  TroopKind,
  Unit,
  UnitFate,
  WeightBand,
} from './contract.js';

// ── The tables ─────────────────────────────────────────────────────────────
export {
  ANSWERS,
  CAUSES,
  CHOSEN,
  COURT,
  FAVOURS,
  GRIEVANCES,
  HOLDING_TYPES,
  QUIRKS,
  SEASONS,
  SEASON_ORDER,
  SEAT,
  SEAT_IDS,
  UNIT_TYPES,
} from './codex.js';
export type { AnswerBand, CauseRow, FavourRow, GrievanceRow, HoldingTypeRow, SeasonRow, UnitTypeRow } from './codex.js';

// ── Founding a realm ───────────────────────────────────────────────────────
export { foundRealm, describeHost } from './founding.js';
export type { RealmPlan } from './founding.js';
