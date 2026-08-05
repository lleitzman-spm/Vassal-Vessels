// WHY THIS FILE EXISTS. Every shape a reading comes back in, in one place, so
// that a reader can see at a glance what the court is willing to say about
// itself. Not one of these is ever stored: they are what a function hands back
// and the caller throws away.
//
// Declared in `docs/WRIT-THE-COURT.md` §2.

import type { Crowns, Men, Sacks, Score, Stamp, Tally } from '../core/primitives.js';
import type { Act, HoldingRecord, HouseRecord, RollEntry, SeatRecord } from './records.js';
import type { AnswerKind, Absence } from './contract.js';

export type { AnswerKind, Absence };

// ── Legibility first ───────────────────────────────────────────────────────

/** WHAT AN ACT WOULD COST, BEFORE YOU DO IT. The single shape that makes "every
 *  choice is a trade with a named price" true rather than aspirational. A UI is
 *  expected to ask for one on hover. */
export interface Price {
  days: number;
  track: 'crown' | string;
  crowns: Crowns;
  sacks: Sacks;
  /** The grudges this will create, named and weighted, BEFORE you commit. */
  grievances: { houseId: string; kind: string; weight: number; explains: string }[];
  favours: { houseId: string; kind: string; weight: number; explains: string }[];
  /** What it does to the muster if you called the host tomorrow. The killer
   *  feature: "+36 men this season, −9 next year." */
  musterDelta: { men: Men; explains: string };
}

// ── The court ──────────────────────────────────────────────────────────────

export interface Grievance {
  actId: string; // the record that caused it
  kind: string; // a row in the grievance table
  houseId: string;
  weight: number; // after cooling (20% off after ten years) and inheritance (heirs take half)
  raw: number;
  since: Stamp;
  settledBy: string[]; // Amends act ids that have chipped at it
  explains: string;
  /** False until a Learn record covers it. The crown's readings omit unknown
   *  grievances; the truth includes them. */
  known: boolean;
}

export interface Favour {
  actId: string;
  kind: string; // a row in the favour table
  houseId: string;
  standing: number; // the part that does not fade while the thing is still true
  fading: number; // the decayed remainder (half-life per kind)
  halfLifeYears: number;
  explains: string;
}

export interface Cabal {
  houseIds: string[];
  since: Stamp;
  binding: Score;
  known: boolean;
}

export interface HouseReading {
  house: HouseRecord;
  loyalty: Tally; // 50 + favours (decayed) + kinship − grievances, clamped 0..100
  grievances: Grievance[];
  favours: Favour[];
  vessel: Vessel;
  holdings: HoldingReading[];
  marchable: Men;
  band: string; // Devoted | True | Dutiful | Cool | Sullen | Estranged | Defiant
}

export interface SeatReading {
  seat: SeatRecord;
  holderCaptainId: string | null;
  since: Stamp | null;
  /** base × (competence/100) × (0.5 + loyalty/200); 0.5 × base when vacant. A
   *  seat is never worse than empty, only wasted. */
  effect: Tally;
  tenure: 'granted' | 'customary' | 'hereditary' | 'vacant'; // 8 years; 16 years
  revocationGrievance: number;
  claimants: { captainId: string; claim: number; grievance: number }[];
}

export interface HoldingReading {
  holding: HoldingRecord;
  state: 'held' | 'wardship' | 'vacant' | 'contested'; // read, never stored
  houseId: string | null;
  coinPerSeason: Tally;
  grainPerSeason: Tally;
  roll: RollEntry[];
  marchDays: Record<string, number>;
  ravagedUntil: Stamp | null;
}

export interface Calendar {
  now: Stamp;
  /** Deadlines the player can see: enemy muster days, ransom clocks, reward
   *  clocks, charter riot windows, the turn of the year. */
  deadlines: { id: string; at: Stamp; daysLeft: number; explains: string }[];
}

export interface Track {
  id: 'crown' | string;
  name: string;
  holderCaptainId: string | null; // null = a track you do not have
  occupied: { actId: string; until: Stamp }[];
  freeOn: Stamp;
}

// ── The muster ─────────────────────────────────────────────────────────────

/** The vessel: what a house owes this year and how much has been drawn. THE
 *  GAME IS NAMED FOR THIS. Each house is a cup holding one year's service — a
 *  stated number of men for a stated number of days, written into the grant of
 *  land itself, so the enfeoffment record IS the contract. */
export interface Vessel {
  houseId: string;
  owedMen: Men;
  capacityDays: number; // 40, from the enfeoffment
  drawnDays: number;
  daysLeft: number;
  beyond: number; // summonses past the vessel this year — each a named price
}

/** ONE HOUSE'S ANSWER, FULLY ITEMISED. No dice: given the records, determined. */
export interface AnswerReading {
  houseId: string;
  willingness: Tally; // the arithmetic, term by term
  answer: AnswerKind;
  owed: Men;
  sending: Men;
  /** Which units, worst-kept-LAST: a short answer sheds in DESCENDING order of
   *  quality, so "0.75" means the knights stayed home, not that everything
   *  shrank. */
  units: { unitId: string; sent: boolean; why: string }[];
  lateDays: number;
  captainId: string; // may be a deputy, and a lesser man
  scutageOffered: Crowns | null;
}

/** "IF I CALLED THE HOST TODAY, WHAT WOULD STAND?" Free to look at, always
 *  current, and the screen the player lives on. */
export interface Forecast {
  men: Men;
  byHouse: AnswerReading[];
  absent: Absence[];
  standsOn: Stamp; // earliest day a host of this size stands there
  levers: { act: Act; price: Price }[]; // the player's move list
}

/** What a summons needs to know about where it is going and when. Passed about
 *  between the muster readings rather than recomputed, because it is arithmetic
 *  over records and every reader must get the same answer. */
export interface Journey {
  letterDays: number;
  gatherDays: number;
  marchDays: number;
  totalDays: number;
  leagues: number;
  fatigue: Score;
}
