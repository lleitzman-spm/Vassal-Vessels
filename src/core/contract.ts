// WHY THIS FILE EXISTS. There are two games in this repository — the court and
// the battle — and they are meant to be buildable blind to each other. This file
// is the whole of what passes between them: a Host goes in, an Aftermath comes
// back, and neither side is allowed to know how the other works.
//
// The shapes are transcribed from `docs/WRIT-THE-COURT.md` §0, §4 and §5. Where
// that document is the law, this file is only its restatement in TypeScript, so
// if the two ever disagree the writ wins.
//
// TYPES ONLY. Nothing here executes. The court computes these; the battle reads
// them and never computes one of them for itself.

// The §0 shared words — ContractVersion, Score, Fraction, Men, Stamp, Tally,
// Quirk and the rest — are declared ONCE in ./primitives.ts, where both halves
// of the game can reach them without either owning the other. They are passed
// straight through here so a reader of the contract sees the whole vocabulary in
// one import, and so there is never a second, subtly different Stamp.
export type {
  ContractVersion,
  Score,
  Fraction,
  Men,
  Crowns,
  Sacks,
  Leagues,
  SeasonId,
  Stamp,
  Tally,
  Term,
  Quirk,
} from "./primitives.js";
export { CONTRACT } from "./primitives.js";

import type { Crowns, Fraction, Leagues, Men, Quirk, Sacks, Score, SeasonId, Stamp } from "./primitives.js";
import type { ContractVersion } from "./primitives.js";

export type TroopKind = "foot" | "horse" | "shot" | "engine";
export type ReachBand = "melee" | "missile" | "both";
export type WeightBand = "light" | "medium" | "heavy";

export type ContingentSource =
  | "feudal-levy"
  | "household"
  | "mercenary"
  | "town-militia"
  | "sworn-order"
  | "allied";

export type Disposition = "eager" | "willing" | "dutiful" | "sullen" | "mutinous";

export type AnswerKind =
  | "more-than-owed"
  | "in-full"
  | "near-full"
  | "short"
  | "late-and-short"
  | "deputy"
  | "scutage"
  | "token"
  | "refusal"
  | "turncoat";

// ── The Host: what the court hands the battle ───────────────────────────────

export interface Host {
  contract: ContractVersion;
  id: string;
  name: string;
  /** Two hosts with the same side are allies. */
  side: string;
  seed: string;
  mustered: Stamp;
  occasion: Occasion;
  command: Command;
  contingents: HostContingent[];
  units: HostUnit[];
  captains: HostCaptain[];
  supply: Supply;
  latecomers: Latecomer[];
  /** WHO DID NOT COME, AND WHY. Never a silently smaller number. */
  absent: Absence[];
  standing: HostStanding;
  notes: string[];
}

export interface Occasion {
  causeId: string;
  causeName: string;
  /** Already folded into every resolve below — the battle must NOT apply it
   *  again; it is given for deployment, victory conditions and flavour. */
  defending: boolean;
  onOwnLand: boolean;
  homeHoldingIds: string[];
  legitimacy: Score;
  surprise: Fraction;
  daysInTheField: number;
}

export interface Command {
  commanderId: string;
  authority: Score;
  /** HOW MANY CONTINGENTS CAN BE GIVEN A TACTIC AT ONE TIME. The canonical
   *  battle engine spends it as courier count and standing-plan slots. */
  orderCapacity: number;
  chain: { captainId: string; defersTo: string | null }[];
  disputes: {
    aId: string;
    bId: string;
    over: "precedence" | "the-van" | "plunder" | "blood";
    intensity: Score;
    explains: string;
  }[];
  vanPromisedTo: string | null;
}

/** Politics attaches HERE; units inherit. Named `HostContingent` because the
 *  battle keeps a contingent of its own with the same word for a name. */
export interface HostContingent {
  id: string;
  name: string;
  source: ContingentSource;
  houseId?: string;
  houseName?: string;
  captainId: string;
  unitIds: string[];
  /** WILLINGNESS TO DIE FOR YOU. */
  resolve: Score;
  /** WILL THEY CARRY OUT A TACTIC YOU ISSUE. Feeds the heed score. */
  obedience: Score;
  /** PROPENSITY TO TURN. Above 60 likely, never certain. */
  treachery: Score;
  /** How well these men hold together. */
  cohesion: Score;
  fellowship: string;
  paid: boolean;
  arrears: Crowns;
  owed: Men;
  present: Men;
  disposition: Disposition;
  quirks: Quirk[];
  story: string;
}

export interface HostUnit {
  id: string;
  /** ALWAYS NAMED FOR ITS HOME: "the Spears of Millrow". */
  name: string;
  story: string;
  contingentId: string;
  homeHoldingId: string;
  homeHoldingName: string;
  /** A row in data/units.json — the battle reads its full physical sheet there. */
  typeId: string;
  kind: TroopKind;
  reach: ReachBand;
  weight: WeightBand;
  paperStrength: Men;
  strength: Men;
  /** Authoritative over the type sheet's baseline. */
  drill: Score;
  veterancy: Score;
  equipment: Score;
  /** Authoritative over the type sheet's baseline. */
  armour: Score;
  /** ON ARRIVAL — what the roads did; the court's fault. */
  fatigue: Score;
  hunger: Score;
  resolve: Score;
  obedience: Score;
  treachery: Score;
  fellowship: string;
  marchSpeed: Leagues;
  quirks: Quirk[];
}

export interface HostCaptain {
  id: string;
  name: string;
  houseId?: string;
  houseName?: string;
  seatId: string | null;
  command: Score;
  valour: Score;
  wits: Score;
  aggression: Score;
  caution: Score;
  pride: Score;
  greed: Score;
  loyalty: Score;
  grievance: Score;
  standing: Score;
  rivals: { captainId: string; intensity: Score }[];
  kin: { captainId: string; degree: "blood" | "marriage" | "ward" }[];
  wounded: boolean;
  age: number;
  record: {
    battlesFought: number;
    battlesWon: number;
    timesDistinguished: number;
    timesFled: number;
  };
  quirks: Quirk[];
}

export interface Supply {
  provisionDays: number;
  sacks: Sacks;
  forage: Fraction;
  baggageCarts: number;
  /** Tilts dead toward wounded; the battle decides how. */
  physicians: number;
  payArrears: Crowns;
}

export interface Latecomer {
  unitIds: string[];
  contingentId: string;
  lateDays: number;
  /** 0 = present from the first minute, 1 = after everything is decided. */
  entersAtFraction: Fraction;
  explains: string;
}

export interface Absence {
  whoId: string;
  whoName: string;
  kind: "house" | "company" | "town" | "order";
  answer: AnswerKind;
  owed: Men;
  sent: Men;
  reason: string;
  explains: string;
  grievanceActIds: string[];
}

export interface HostStanding {
  legitimacy: Score;
  momentum: number;
  belief: Score;
}

/** The battle owns terrain entirely. This is only what the court knows about
 *  where the fight is; the battle generates its real field from this and a seed. */
export interface Ground {
  id: string;
  name: string;
  holdingId: string | null;
  season: SeasonId;
  /** Coarse hints: 'ford' | 'wood' | 'ridge' | 'marsh' | 'road' | 'mud'. */
  features: string[];
}

// ── The Aftermath: what the battle hands back ───────────────────────────────

export interface Aftermath {
  contract: ContractVersion;
  hostId: string;
  battleId: string;
  at: Stamp;
  outcome: "victory" | "costly-victory" | "draw" | "defeat" | "rout";
  /** Who was left standing on the ground. This, not outcome, decides who takes
   *  the wounded, the baggage and the captives. */
  heldTheField: boolean;
  hours: number;
  units: UnitFate[];
  captains: CaptainFate[];
  contingents: ContingentFate[];
  spoils: Spoils;
  ground: GroundResult;
  deeds: Deed[];
  blame?: { captainId: string; share: Fraction; reason: string }[] | null;
  glory?: { captainId: string; share: Fraction; reason: string }[] | null;
  honours?: { captainId: string; promised: string; kept: boolean }[];
  quirksHonoured?: string[];
  notes: string[];
}

export interface UnitFate {
  unitId: string;
  present: boolean;
  didNotEngage?: boolean;
  /** These five MUST sum to the unit's strength at muster. The court asserts
   *  it; a mismatch is a contract violation, never silently reconciled. */
  dead: Men;
  wounded: Men;
  captured: Men;
  deserted: Men;
  survived: Men;
  brokeAt: Fraction | null;
  defected: boolean;
  ordersGiven: number;
  ordersObeyed: number;
  veterancyGained: number;
}

export interface CaptainFate {
  captainId: string;
  fate: "unhurt" | "wounded" | "maimed" | "captured" | "slain";
  conduct: "distinguished" | "steady" | "faltered" | "fled" | "defected" | "did-not-engage";
  ordersGiven: number;
  ordersObeyed: number;
  menLost: Men;
  deedIds: string[];
}

export interface ContingentFate {
  contingentId: string;
  lossShare: Fraction;
  defected: boolean;
  plunderSeized: Crowns;
}

export interface Spoils {
  plunder: Crowns;
  banners: { name: string; takenByCaptainId: string | null }[];
  captives: Captive[];
  ourPeopleTaken: Captive[];
  baggageLost: boolean;
}

export interface Captive {
  captainId: string;
  name: string;
  houseId?: string;
  ransom: Crowns;
}

export interface GroundResult {
  holdingIdsHeld: string[];
  holdingIdsLost: string[];
  ravaged: string[];
  advanceStopped: boolean;
}

export interface Deed {
  id: string;
  kind: string;
  captainId?: string;
  unitId?: string;
  atFraction: Fraction;
  /** One sentence, past tense, for the chronicle. */
  tale: string;
}
