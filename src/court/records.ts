// WHY THIS FILE EXISTS. This is the whole of the game state, and there is
// nothing else. A founding book adopted exactly once, plus an append-only list
// of acts. Every number the player ever sees — a house's loyalty, a captain's
// grudge, how full a vessel is, who will stand at the ford in forty-one days —
// is worked out fresh from this list every time it is asked for, and stored
// nowhere.
//
// WHAT BREAKS IF SOMEONE CACHES A READING. Two sources of truth, and one of
// them starts lying the moment a record is struck out. Removal of a record IS
// revocation here: strike the enfeoffment and the house owes nothing, strike
// the slight and the grudge was never felt, and every reading recomputes around
// the hole without complaint. A stored `loyalty: 43` on a house record survives
// the strike, and then the player is looking at a number that no longer has a
// cause. The compile-time guards at the bottom of this file are the fence.
//
// Declared in `docs/WRIT-THE-COURT.md` §1.

import type { Crowns, Fraction, Men, Sacks, Score, Stamp, Leagues } from '../core/primitives.js';

/** Every act carries these. `at` IS the calendar: the clock is
 *  max(acts.map(a => a.at.absolute)), so time advances only because something
 *  was done. There is no end-turn (law 3). */
export interface ActBase {
  id: string;
  at: Stamp;
  /** 'crown' for the player, 'world' for the seeded world clock (harvests,
   *  raids, deaths, the enemy's movements), or a house id when a vassal acted
   *  alone. */
  by: 'crown' | 'world' | string;
  /** Which track it occupied and for how long — the crown's day-book or a
   *  seat's. Absent for world acts, which cost nobody anything. */
  track?: { seatId: string | 'crown'; days: number };
  note?: string;
}

// ── The land and the bond ──────────────────────────────────────────────────

/** THE FOUNDING RECORD OF EVERY OBLIGATION. Granting land IS the contract, and
 *  the terms live in the record — so regranting with better terms is the
 *  cleanest way in the game to buy soldiers, and it is permanent. */
export interface Enfeoff extends ActBase {
  kind: 'enfeoff';
  holdingId: string;
  houseId: string;
  owedMen: Men; // the servitium: men owed each year...
  owedDays: number; // ...for this many days. Classically 40.
}

/** Hostile seizure of a house's land. (An enfeoffment is revoked honestly by
 *  REMOVING its record; attainder is the different, louder thing.) */
export interface Attaint extends ActBase {
  kind: 'attaint';
  houseId: string;
  holdingIds: string[];
}

export interface Homage extends ActBase {
  kind: 'homage';
  captainId: string;
  houseId: string;
}

// ── The court ──────────────────────────────────────────────────────────────

export interface Invest extends ActBase {
  kind: 'invest';
  seatId: string;
  captainId: string;
}

/** Naming a commander for one campaign — required whenever the Marshalcy is
 *  vacant, and a fresh slight to everyone passed over, every single war. */
export interface NameCommander extends ActBase {
  kind: 'name-commander';
  campaignId: string;
  captainId: string;
}

export interface Betroth extends ActBase {
  kind: 'betroth';
  aId: string;
  bId: string;
}

export interface Wed extends ActBase {
  kind: 'wed';
  aId: string;
  bId: string;
}

/** A vassal's heir taken into the crown's household. Suppresses treachery by 30
 *  while held; sours after three years; and if the ward dies in your care it is
 *  the worst grievance in the game, spreading to every kinsman. The strongest
 *  and most dangerous instrument in the court. */
export interface Ward extends ActBase {
  kind: 'ward';
  captainId: string;
  houseId: string;
}

// ── Settling and souring ───────────────────────────────────────────────────

/** Settles grievance. Each method has its own rate and its own cost;
 *  'justice' is the strong one and creates a fresh grievance in whoever is
 *  punished. */
export interface Amends extends ActBase {
  kind: 'amends';
  houseId: string;
  method: 'wergild' | 'apology' | 'justice' | 'gift' | 'grant' | 'judgement';
  settles: { grievanceActId: string; points: number }[];
  crowns?: Crowns;
  /** Whoever the justice fell upon, when the method is 'justice' — the fresh
   *  grudge is theirs. */
  punishedHouseId?: string;
}

export interface Feast extends ActBase {
  kind: 'feast';
  crowns: Crowns;
  invitedHouseIds: string[];
}

export interface Tourney extends ActBase {
  kind: 'tourney';
  crowns: Crowns;
}

// ── The muster ─────────────────────────────────────────────────────────────

export interface Proclaim extends ActBase {
  kind: 'proclaim';
  campaignId: string;
  causeId: string;
  defending: boolean;
  /** Blessed by the Chaplain — the only road to the Sworn Order, and worth
   *  10 × the Chaplain's effect in legitimacy. */
  blessed: boolean;
}

export interface Summon extends ActBase {
  kind: 'summon';
  campaignId: string;
  calledIds: string[]; // houses, companies, towns, orders
  musteringPlaceId: string;
  standBy: Stamp; // the day the host must stand
  /** The Great Summons: the whole strength of the land instead of the quotas.
   *  Defensive causes only, once in five years; every house earns
   *  beyond-the-bond 15 — forgiven entirely on victory, doubled on defeat. */
  great: boolean;
}

export interface AcceptScutage extends ActBase {
  kind: 'accept-scutage';
  houseId: string;
  campaignId: string;
  crowns: Crowns;
}

export interface Charter extends ActBase {
  kind: 'charter';
  holdingId: string;
  libertyShare: Fraction;
}

export interface Contract extends ActBase {
  kind: 'contract';
  companyId: string;
  men: Men;
  crowns: Crowns;
  seasons: number;
}

export interface Provision extends ActBase {
  kind: 'provision';
  sacks: Sacks;
  crowns: Crowns;
}

export interface Pay extends ActBase {
  kind: 'pay';
  toId: string;
  crowns: Crowns;
}

export interface Tax extends ActBase {
  kind: 'tax';
  holdingIds: string[];
  extraordinary: boolean;
}

export interface March extends ActBase {
  kind: 'march';
  campaignId: string;
  toPlaceId: string;
  forced: boolean; // 1.5× speed, +6 fatigue a day, 1% attrition a day
}

// ── Knowing ────────────────────────────────────────────────────────────────

/** Discovery is a RECORD, not a flag. Until the crown has learned of a
 *  grievance it does not appear in the crown's own reading of a house — the ONLY
 *  uncertainty in this layer, and the reason the Spymaster's seat is worth men.
 *  "I did not know" is a fact in the book, not an excuse. */
export interface Learn extends ActBase {
  kind: 'learn';
  aboutActIds: string[];
  through: 'spymaster' | 'feast' | 'herald' | 'betrayal' | 'plain-sight';
}

// ── The world's own hand — the only dice in this layer, from a seeded clock ─

export interface Harvest extends ActBase {
  kind: 'harvest';
  holdingId: string;
  quality: Fraction;
}

export interface Raid extends ActBase {
  kind: 'raid';
  holdingId: string;
  menLost: Men;
  ravaged: boolean;
}

export interface Pestilence extends ActBase {
  kind: 'pestilence';
  holdingId: string;
  severity: Score;
}

export interface Death extends ActBase {
  kind: 'death';
  captainId: string;
  cause: string;
}

export interface Birth extends ActBase {
  kind: 'birth';
  captainId: string;
  houseId: string;
}

/** The Crown's Gate: something has arrived and must be ANSWERED (days, and a
 *  favour or a grievance) or TURNED AWAY (free — and a grievance, which is
 *  exactly why turning petitions away is on the grievance list). The engine of
 *  live contested choice between wars. */
export interface Petition extends ActBase {
  kind: 'petition';
  fromId: string;
  aboutId?: string;
  asks: string;
}

export interface AnswerPetition extends ActBase {
  kind: 'answer-petition';
  petitionActId: string;
  granted: boolean;
}

/** The battle's report, absorbed — one record per fact. Emitted by absorb(). */
export interface AftermathRecord extends ActBase {
  kind:
    | 'casualty'
    | 'blood-debt'
    | 'distinguished'
    | 'disgraced'
    | 'slain'
    | 'captured'
    | 'ransom-paid'
    | 'defected'
    | 'plunder'
    | 'banner-taken'
    | 'holding-lost'
    | 'holding-ravaged'
    | 'legitimacy'
    | 'glory-hunger';
  battleId: string;
  subjectId: string;
  amount?: number;
}

export type Act =
  | Enfeoff
  | Attaint
  | Homage
  | Invest
  | NameCommander
  | Betroth
  | Wed
  | Ward
  | Amends
  | Feast
  | Tourney
  | Proclaim
  | Summon
  | AcceptScutage
  | Charter
  | Contract
  | Provision
  | Pay
  | Tax
  | March
  | Learn
  | Harvest
  | Raid
  | Pestilence
  | Death
  | Birth
  | Petition
  | AnswerPetition
  | AftermathRecord;

export type ActKind = Act['kind'];

/** The whole game state, and there is nothing else. */
export interface Chronicle {
  founding: FoundingBook; // houses, holdings, captains, seats — adopted exactly once
  acts: Act[]; // append-only; the ONLY mutable thing
  seed: string; // the world clock's die
}

// ── The founding book and its records ──────────────────────────────────────

export interface FoundingBook {
  founding: Stamp;
  crown: { houseId: string; coffer: Crowns; granary: Sacks; household: RollEntry[] };
  houses: HouseRecord[];
  holdings: HoldingRecord[];
  captains: CaptainRecord[];
  seats: SeatRecord[];
  /** Where a host may be told to stand, and nothing more: the leagues to each
   *  are on the holdings, so a march is arithmetic and never a pathfind. */
  musteringPlaces?: { id: string; name: string; provinceId: string }[];
}

/** NOTE WHAT IS NOT ON THIS RECORD: loyalty, grievance, standing, willingness.
 *  All four are readings. The compile-time guard below enforces it. */
export interface HouseRecord {
  id: string;
  name: string;
  lordCaptainId: string;
  heirCaptainId?: string;
}

export interface HoldingRecord {
  id: string;
  name: string;
  typeId: string; // a row in the holdings table
  provinceId: string;
  /** Distance to each mustering place, so march days are arithmetic, not a
   *  pathfind. Keyed by mustering place id. */
  leaguesTo: Record<string, Leagues>;
  road: 'highway' | 'track' | 'path';
}

export interface CaptainRecord {
  id: string;
  name: string;
  houseId: string | null;
  born: number;
  command: Score;
  valour: Score;
  wits: Score;
  aggression: Score;
  caution: Score;
  pride: Score;
  greed: Score;
  /** How badly they want each seat, 0..5. Feeds passed-over and unseated. */
  claims: Record<string, number>;
}

export interface SeatRecord {
  id: string;
  name: string;
  /** The seat's named levers. The conventional key `strength` (defaulting to 1)
   *  is what `readSeat` multiplies by competence and loyalty to get the seat's
   *  effect; everything else is a lever a particular reading knows how to
   *  spend. */
  base: Record<string, number>;
}

/** One line of a muster roll: a named unit type and how many men of it. */
export interface RollEntry {
  unitTypeId: string;
  men: Men;
  garrisonHeld: Men;
}

// ── The guards the compiler holds ──────────────────────────────────────────

type Assert<T extends true> = T;

/** A HOUSE STORES NO STANDING. Loyalty is a reading over the act list; the
 *  moment someone hangs a loyalty field on the record, two sources of truth
 *  exist and one of them starts lying. Add any of these keys and this line stops
 *  compiling. */
export type HOUSE_STORES_NO_STANDING = Assert<
  Extract<keyof HouseRecord, 'loyalty' | 'grievance' | 'standing' | 'willingness'> extends never
    ? true
    : false
>;

/** A HOST IS NEVER STORED. It is read fresh from the chronicle every time. If
 *  Chronicle ever grows a host key, someone has cached a reading, and the next
 *  bug is a host that disagrees with the records that made it. */
export type CHRONICLE_STORES_NO_HOST = Assert<
  Extract<keyof Chronicle, 'host' | 'hosts' | 'muster' | 'loyalties'> extends never ? true : false
>;

// ── Small conveniences over the list ───────────────────────────────────────
//
// Every one of these walks the acts. None of them remembers what it found: a
// memo here would be a cached reading wearing a hat.

/** Acts on or before a day, in the order they were written. The whole layer
 *  reads through this, which is why striking a record is revocation everywhere
 *  at once. */
export function actsUpTo(c: Chronicle, at: Stamp): Act[] {
  return c.acts.filter((a) => a.at.absolute <= at.absolute);
}

export function actsOfKind<K extends ActKind>(
  acts: readonly Act[],
  kind: K,
): Extract<Act, { kind: K }>[] {
  return acts.filter((a): a is Extract<Act, { kind: K }> => a.kind === kind);
}

export function houseOf(c: Chronicle, houseId: string): HouseRecord | undefined {
  return c.founding.houses.find((h) => h.id === houseId);
}

export function holdingOf(c: Chronicle, holdingId: string): HoldingRecord | undefined {
  return c.founding.holdings.find((h) => h.id === holdingId);
}

export function captainOf(c: Chronicle, captainId: string): CaptainRecord | undefined {
  return c.founding.captains.find((p) => p.id === captainId);
}

export function seatOf(c: Chronicle, seatId: string): SeatRecord | undefined {
  return c.founding.seats.find((s) => s.id === seatId);
}
