// WHY THIS FILE EXISTS. The battle is one enormous machine and every phase of
// the tick touches the same handful of shapes. Writing them down in one place
// means a phase can be read on its own: if a field is not on this page, no phase
// may invent it.
//
// TWO THINGS TO NOTICE, BECAUSE THEY ARE THE WHOLE DESIGN.
//
// First, `pending`. Every unit carries a second, shadow copy of the numbers a
// tick can change — kills taken, morale, cohesion, fatigue, velocity, facing.
// Phases READ the unit and WRITE the shadow, and the shadow is folded in at
// stated boundaries. WHAT BREAKS IF YOU DO THE OBVIOUS THING: if melee wrote
// morale straight onto the unit, then the unit updated second in the loop would
// see the first one's new morale and the one updated first would not — and the
// battle would depend on the order of a loop, which is exactly what the replay
// forbids.
//
// Second, `rng` on the unit rather than on the state. Each unit's dice are its
// own, so nothing a neighbour rolls can move them. That is what lets the engine
// walk its units backwards and get the same battle, which is tested.

import type { Rng } from "../core/rng.js";
import type { Ground, Host, Quirk } from "../core/contract.js";

// ── the small vocabularies ──────────────────────────────────────────────────

export type Side = 0 | 1;

export type SpeedTier = "STOP" | "WALK" | "ADVANCE" | "RUN" | "CHARGE" | "ROUT";

export type Posture = "NONE" | "BRACED" | "SHOOTING" | "STAKED";

export type Spacing = "CLOSE" | "LOOSE";

export type MoraleState =
  | "STEADY"
  | "SHAKEN"
  | "WAVERING"
  | "ROUTING"
  | "RALLYING"
  | "FLED"
  | "DESTROYED";

export type Arc = "FRONT" | "FLANK" | "REAR";

export type KillSource = "MELEE" | "MISSILE" | "SHOCK" | "PURSUIT";

export type BattlePhase = "DEPLOY" | "BATTLE" | "PURSUIT" | "ENDED";

/** The six outcomes of a captain's heed (law 7: disobedience is a verb). */
export type Interpretation =
  | "OBEY"
  | "OBEY-HIS-WAY"
  | "DRAG"
  | "HEDGE"
  | "OVERREACH"
  | "HARD-HEDGE"
  | "DEFY";

/** A contingent's standing job. Always in force; the battle never waits. */
export type ChargeId =
  | "HOLD"
  | "ADVANCE"
  | "ATTACK"
  | "SUPPORT"
  | "SCREEN"
  | "GUARD"
  | "RESERVE"
  | "WITHDRAW"
  | "MARCH";

/** An improvised instruction. It rides a courier and faces the captain's heed. */
export type OrderId =
  | "HOLD"
  | "TAKE_POST"
  | "ADVANCE"
  | "ATTACK"
  | "CHARGE"
  | "BRACE"
  | "FALL_BACK"
  | "WHEEL"
  | "SUPPORT"
  | "SCREEN"
  | "WITHDRAW"
  | "PURSUE"
  | "REIN_IN"
  | "PLANT_STAKES"
  | "SHOOT"
  | "CEASE_SHOOTING"
  | "FORM"
  | "FEIGN"
  | "BIND_PLAN";

export type PursuitPolicy = "REIN_IN" | "SHORT" | "FULL";

/** Where an order or a charge is pointed. Every field is optional because most
 *  orders need only one of them. */
export interface OrderParams {
  x?: number;
  y?: number;
  targetUnitId?: string;
  targetContingentId?: string;
  formationId?: string;
  facing?: number;
  plan?: PlanBinding;
}

// ── the directive timeline: the ONLY input besides the seed ─────────────────

export interface PlanBinding {
  /** A contingent id or a unit id. */
  recipient: string;
  trigger: TriggerId;
  value: number;
  hornChannel: number;
  orderId: OrderId;
  params: OrderParams;
  /** For the herald, so a fired plan reads as a sentence. */
  note: string;
}

/** The vocabulary of `data/standing-plans.json`, verbatim. A trigger the engine
 *  cannot yet watch is simply never true — the same rule the contract sets for
 *  quirks — rather than a crash. */
export type TriggerId =
  | "HORN_SOUNDED"
  | "ENEMY_CAVALRY_WITHIN"
  | "ENEMY_WITHIN"
  | "ENGAGED_FOR_TICKS"
  | "MORALE_BELOW"
  | "SELF_STRENGTH_BELOW"
  | "AMMO_BELOW"
  | "FRIEND_ROUTS_WITHIN"
  | "ENEMY_ENTERS_ZONE"
  | "TICK_REACHED"
  | "BANNER_LOST"
  | "ENEMY_BROKE";

export type Directive =
  | { t: number; kind: "PLACE"; unitId: string; x: number; y: number; facing: number; formationId: string | null; posture: Posture | null }
  | { t: number; kind: "CHARGE"; contingentId: string; charge: ChargeId; params: OrderParams }
  | { t: number; kind: "PLAN"; plan: PlanBinding }
  | { t: number; kind: "ORDER"; contingentId: string | null; unitId: string | null; orderId: OrderId; params: OrderParams }
  | { t: number; kind: "EXHORT"; contingentId: string }
  | { t: number; kind: "RIDE_TO"; x: number; y: number }
  | { t: number; kind: "HORN"; channel: number }
  | { t: number; kind: "SOUND_RETREAT" }
  | { t: number; kind: "PURSUIT_POLICY"; policy: PursuitPolicy };

// ── the resolved sheets (read once at muster, then frozen) ──────────────────

export interface Weapon {
  id: string;
  name: string;
  reachMm: number;
  pen: number;
  ratePer1000Ticks: number;
  fightingRanks: number;
  pressPenaltyPermille: number;
  shockOnly: boolean;
  twoHanded: boolean;
}

export interface MissileWeapon {
  id: string;
  name: string;
  rangeMm: number;
  pen: number;
  shotsPer1000Ticks: number;
  ammo: number;
  flightSpeedMmPerTick: number;
  spreadPermilleOfRange: number;
  moraleMultiplierPermille: number;
  canShootMoving: boolean;
  misfirePermille: number;
}

export interface Formation {
  id: string;
  name: string;
  manWidthMm: number;
  rankDepthMm: number;
  targetRanks: number;
  targetFiles: number;
  frontageMulPermille: number;
  missileDensityPermille: number;
  speedMulPermille: number;
  roadSpeedMulPermille: number;
  shockDeliveredMulPermille: number;
  shockReceivedMulPermille: number;
  shockConcentrationMulPermille: number;
  shockResistBonus: number;
  frontShieldMulPermille: number;
  cohesionCapPermille: number;
  refusalMulPermille: number;
  allArcBrace: boolean;
  changeTicks: number;
  requires: string[];
}

export interface UnitType {
  id: string;
  name: string;
  cls: string;
  massPerManKg: number;
  skill: number;
  drillBase: number;
  armourBase: number;
  horseArmour: number;
  shieldBase: number;
  shieldMissileBonus: number;
  shieldRequiresStationary: boolean;
  primary: Weapon;
  sidearm: Weapon;
  /** Whichever of primary and sidearm maximises rate x (1000 - press penalty) x
   *  pen: the weapon a man actually kills with once the lines are jammed. */
  pressWeapon: Weapon;
  missile: MissileWeapon | null;
  ammo: number;
  refusalBase: number;
  refusalRangeMm: number;
  turnMulPermille: number;
  fatigueMulPermille: number;
  speedMulPermille: number;
  chargeSpeedMmPerTick: number;
  arrivalReadyTicks: number;
  defaultFormationId: string;
  allowedFormations: string[];
  traits: readonly string[];
  isMounted: boolean;
  canBrace: boolean;
  isNonCombatant: boolean;
  moraleCeilingCap: number;
  signalRadiusMm: number;
  steadyRadiusMm: number;
  defaultQuirks: readonly string[];
}

// ── the state ───────────────────────────────────────────────────────────────

export interface Engagement {
  enemyIdx: number;
  overlapMm: number;
  arcOnMe: Arc;
  arcOnThem: Arc;
}

/** The shadow copy. See the note at the top of this file: no phase may write a
 *  live field that another phase in the same tick still has to read. */
export interface Pending {
  killsMilli: number;
  killsDealtMilli: number;
  killSource: KillSource | null;
  morale: number;
  moraleCeiling: number;
  cohesion: number;
  fatigue: number;
  velX: number;
  velY: number;
  facing: number;
  /** Every named term that summed to this tick's morale change, so the event
   *  can print its reasons (law 4). */
  moraleWhy: { term: string; value: number }[];
}

export interface ActiveOrder {
  id: OrderId;
  params: OrderParams;
  commitTicksLeft: number;
  windupTicksLeft: number;
}

export interface PendingOrder {
  orderId: OrderId;
  params: OrderParams;
  arriveTick: number;
  viaCourier: boolean;
  /** null when the word was addressed to a single unit over its captain's head. */
  contingentId: string | null;
  unitIdx: number | null;
  issuedTick: number;
}

export interface Unit {
  id: string;
  idx: number;
  side: Side;
  typeId: string;
  contingentId: string;
  name: string;
  homeHoldingId: string;

  posX: number;
  posY: number;
  velX: number;
  velY: number;
  facing: number;
  speedTier: SpeedTier;
  speedCapThisTick: number;
  refusalTakenMmPerTick: number;

  strength: number;
  maxStrength: number;
  musterStrength: number;
  killAcc: number;

  files: number;
  ranks: number;
  frontageMm: number;
  depthMm: number;
  spacing: Spacing;
  formationId: string;
  formationChangeTicksLeft: number;

  morale: number;
  moraleCeiling: number;
  moraleFloor: number;
  cohesion: number;
  fatigue: number;
  moraleState: MoraleState;
  moraleStateSince: number;
  ralliesUsed: number;
  aboveRallySince: number;

  posture: Posture;
  postureChangeTicksLeft: number;
  stakesX: number;
  stakesY: number;
  hasStakes: boolean;

  ammo: number;
  volleyCooldownTicks: number;
  aimedWindupLeft: number;

  order: ActiveOrder | null;
  pendingOrders: PendingOrder[];

  engagements: Engagement[];
  contactTicks: number;
  reformTicksLeft: number;

  bloodlust: number;
  pursuing: boolean;

  lastKillsTaken: number;
  lastKillsDealt: number;
  lastKillSource: KillSource | null;

  /** The receipts the court reads (Aftermath). */
  ordersGiven: number;
  ordersObeyed: number;

  /** The five numbers that MUST sum to `musterStrength`. */
  dead: number;
  captured: number;
  deserted: number;

  onField: boolean;
  arrivalTick: number;
  brokeAtTick: number | null;
  defected: boolean;
  totalContactTicks: number;
  advanceAlongFacingMm: number;

  exhortUntilTick: number;
  plansArmed: number;

  rng: Rng;
  renderSeed: number;
  type: UnitType;
  quirks: Quirk[];
  pending: Pending;
}

export interface Contingent {
  id: string;
  side: Side;
  name: string;
  captainId: string;
  unitIdxs: number[];
  obedience: number;
  resolve: number;
  treachery: number;
  cohesion0: number;
  fellowship: string;
  quirks: Quirk[];
  source: string;
  arrears: number;
  isReserve: boolean;
  committed: boolean;
  charge: { id: ChargeId; params: OrderParams };
  interpretation: {
    choice: Interpretation;
    urgency: number;
    sinceTick: number;
    standoffMm: number;
    /** One tier faster or slower than you asked for. A hot captain's advance
     *  arrives at a run; a careful one comes on at a walk. */
    paceBump: number;
    heldBackUnitIdx: number;
    supportTargetId: string | null;
  };
  pursuitPolicy: PursuitPolicy;
  casualtiesPermilleAtLastThink: number;
  withdrawn: boolean;
}

export interface Captain {
  id: string;
  contingentId: string;
  side: Side;
  name: string;
  command: number;
  valour: number;
  wits: number;
  aggression: number;
  caution: number;
  pride: number;
  greed: number;
  loyalty: number;
  grievance: number;
  standing: number;
  rivals: { captainId: string; intensity: number }[];
  quirks: Quirk[];
  insulted: boolean;
  alive: boolean;
  captured: boolean;
  wounded: boolean;
  bannerUnitIdx: number;
  nextThinkTick: number;
  fellAtTick: number | null;
  deedIds: string[];
}

export interface Courier {
  side: Side;
  id: number;
  busyUntilTick: number;
}

export interface Volley {
  shooterIdx: number;
  side: Side;
  launchTick: number;
  landTick: number;
  targetX: number;
  targetY: number;
  spreadMm: number;
  shafts: number;
  aimed: boolean;
  weapon: MissileWeapon;
  shooterElevationDm: number;
}

export interface StandingPlan {
  side: Side;
  recipient: string;
  recipientIsUnit: boolean;
  trigger: TriggerId;
  value: number;
  hornChannel: number;
  orderId: OrderId;
  params: OrderParams;
  note: string;
  armed: boolean;
  firedAtTick: number | null;
}

export interface Army {
  side: Side;
  hostId: string;
  name: string;
  commanderCaptainId: string;
  couriersTotal: number;
  exhortUsesLeft: number;
  bannerIdx: number;
  bannerAlive: boolean;
  /** The tick the banner went down, or null. A captain thinks again when it
   *  FALLS — an army that never had one has nothing to think again about. */
  bannerLostAtTick: number | null;
  bannerMoving: boolean;
  bannerTargetX: number;
  bannerTargetY: number;
  signalRangeMm: number;
  planSlots: number;
  plansBound: number;
  hornsSounded: { tick: number; channel: number }[];
  armyMorale: number;
  lowMoraleSince: number;
  startingStrength: number;
  broken: boolean;
  brokeAtTick: number | null;
  retreatSounded: boolean;
  retreatAtTick: number | null;
  /** A CACHE of the most recent Tide reading. The canonical value is always
   *  recomputable from `state.events`; the determinism test recomputes it that
   *  way and asserts the two agree. It is never the source of truth. */
  tide: number;
  authority: number;
  physicians: number;
  baggageCarts: number;
  plunder: number;
  host: Host;
}

export interface Terrain {
  widthMm: number;
  heightMm: number;
  tileMm: number;
  tilesX: number;
  tilesY: number;
  elevationDm: Int16Array;
  ground: Uint8Array;
  cover: Uint8Array;
}

export interface EventRecord {
  t: number;
  k: string;
  [key: string]: unknown;
}

/** Everything a perception pass worked out about one unit, so later phases read
 *  it instead of walking the field again. Rebuilt from scratch every tick. */
export interface Perception {
  nearestEnemyIdx: number;
  nearestEnemyDist: number;
  localFriendStrength: number;
  localEnemyStrength: number;
  enemyHorseInRear: boolean;
  captainInLOS: boolean;
  bannerInLOS: boolean;
  reservesInSight: number;
  elevationMm: number;
  engagedEnemyFilesAhead: number;
}

export interface BattleState {
  tick: number;
  seed: string;
  seedHash: number;
  rngGlobal: Rng;
  terrain: Terrain;
  units: Unit[];
  contingents: Contingent[];
  captains: Captain[];
  armies: [Army, Army];
  volleys: Volley[];
  couriers: Courier[];
  plans: StandingPlan[];
  directives: Directive[];
  directiveCursor: number;
  events: EventRecord[];
  /** Where the Tide's window begins in `events`. A pointer, not a store: the
   *  reading is identical whether the scan starts here or at zero. */
  tideWindowStart: number;
  perception: Perception[];
  phase: BattlePhase;
  pursuitTicksLeft: number;
  noContactTicks: number;
  deeds: BattleDeed[];
  captives: { captainId: string; side: Side; byIdx: number; tick: number }[];
  capturedMen: { unitIdx: number; men: number }[];
  losSeen: Map<number, boolean>;
  losGroup: number;
  endedReason: string;
  ground: Ground;
  /** Walk the units backwards in the phases that are supposed not to care
   *  (perception, intent, melee, morale). Nothing but a test switch — and the
   *  test that flips it is the proof that per-unit random streams work, because
   *  a battle that changes when you reverse a loop has a shared die in it
   *  somewhere. */
  reverseUnits: boolean;
}

export interface BattleDeed {
  id: string;
  kind: string;
  captainId: string | null;
  unitId: string | null;
  tick: number;
  tale: string;
}
