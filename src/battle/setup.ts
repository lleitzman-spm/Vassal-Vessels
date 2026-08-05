// WHY THIS FILE EXISTS. Everything the battle needs is decided here, once, and
// then the tick loop only ever changes numbers. A Host is a political document;
// this module turns it into bodies on ground: how brave they start, how well
// dressed their ranks are, how many riders you have, and where they stand.
//
// THE MAPPINGS FROM THE COURT'S SCALE TO THE FIELD'S ARE THIS CANON'S OWN.
// Neither source design carried both scales, so the four bridges below —
// resolve into a morale ceiling, social cohesion into a cohesion bar, hunger
// into ceiling loss, arrears into a morale floor — are choices, written down in
// `data/constants.json` under `morale` and `cohesion` so a playtest can move
// them, and flagged in `docs/OPEN-QUESTIONS.md`.

import type { Ground, Host, HostCaptain, HostContingent, HostUnit } from "../core/contract.js";
import { clamp, hashSeed, idiv, mini } from "../core/primitives.js";
import { makeRng, makeUnitRng, next } from "../core/rng.js";
import { formation, unitType } from "./catalog.js";
import { recomputeGeometry } from "./geometry.js";
import { K, PLANNED_TICKS } from "./rules.js";
import { generateTerrain } from "./terrain.js";
import type {
  Army,
  BattleState,
  Captain,
  Contingent,
  Courier,
  Directive,
  Perception,
  Side,
  StandingPlan,
  Unit,
} from "./types.js";

export interface BattleInput {
  a: Host;
  b: Host;
  ground: Ground;
  seed: string;
  ordersA: Directive[];
  ordersB: Directive[];
  /** Turning the log off must not change a single value; this switch exists so
   *  that promise can be tested. */
  logEnabled?: boolean;
}

function emptyPerception(): Perception {
  return {
    nearestEnemyIdx: -1,
    nearestEnemyDist: 0,
    localFriendStrength: 0,
    localEnemyStrength: 0,
    enemyHorseInRear: false,
    captainInLOS: false,
    bannerInLOS: false,
    reservesInSight: 0,
    elevationMm: 0,
    engagedEnemyFilesAhead: 0,
  };
}

function buildUnit(
  hu: HostUnit,
  hc: HostContingent,
  side: Side,
  idx: number,
  seedHash: number,
): Unit {
  const type = unitType(hu.typeId);

  // The bridges from the court's 0-100 scales into the battle's own.
  let moraleCeiling = K.morale.ceilingFromResolveBase + hu.resolve * K.morale.ceilingFromResolvePerPoint;
  moraleCeiling -= hu.hunger * K.morale.ceilingLossPerHungerPoint;
  if (type.moraleCeilingCap > 0 && moraleCeiling > type.moraleCeilingCap) {
    // Fragile men can never be more than two-thirds brave, however well the day
    // is going.
    moraleCeiling = type.moraleCeilingCap;
  }
  moraleCeiling = clamp(moraleCeiling, 0, K.scales.barMax);
  const cohesion = clamp(
    K.cohesion.startBase + hc.cohesion * K.cohesion.startPerPoint,
    0,
    K.scales.barMax,
  );
  const isUnpaidMercenary = hc.source === "mercenary" && hc.arrears > 0;

  const rng = makeUnitRng(seedHash, idx);
  const u: Unit = {
    id: hu.id,
    idx,
    side,
    typeId: hu.typeId,
    contingentId: hu.contingentId,
    name: hu.name,
    homeHoldingId: hu.homeHoldingId,

    posX: 0,
    posY: 0,
    velX: 0,
    velY: 0,
    facing: side === 0 ? 1024 : 3072,
    speedTier: "STOP",
    speedCapThisTick: 0,
    refusalTakenMmPerTick: 0,

    strength: hu.strength,
    maxStrength: hu.strength,
    musterStrength: hu.strength,
    killAcc: 0,

    files: 1,
    ranks: 1,
    frontageMm: 0,
    depthMm: 0,
    spacing: "CLOSE",
    formationId: type.defaultFormationId,
    formationChangeTicksLeft: 0,

    morale: moraleCeiling,
    moraleCeiling,
    moraleFloor: isUnpaidMercenary ? K.morale.floorUnpaidMercenary : K.morale.floorPaid,
    cohesion,
    fatigue: clamp(hu.fatigue * 10000, 0, K.scales.barMax),
    moraleState: "STEADY",
    moraleStateSince: 0,
    ralliesUsed: 0,
    aboveRallySince: -1,

    posture: "NONE",
    postureChangeTicksLeft: 0,
    stakesX: 0,
    stakesY: 0,
    hasStakes: false,

    ammo: type.ammo,
    volleyCooldownTicks: 0,
    aimedWindupLeft: 0,

    order: null,
    pendingOrders: [],

    engagements: [],
    contactTicks: 0,
    reformTicksLeft: 0,

    bloodlust: 0,
    pursuing: false,

    lastKillsTaken: 0,
    lastKillsDealt: 0,
    lastKillSource: null,

    ordersGiven: 0,
    ordersObeyed: 0,

    dead: 0,
    captured: 0,
    deserted: 0,

    onField: true,
    arrivalTick: 0,
    brokeAtTick: null,
    defected: false,
    totalContactTicks: 0,
    advanceAlongFacingMm: 0,

    exhortUntilTick: -1,
    plansArmed: 0,

    rng,
    renderSeed: next(makeUnitRng(seedHash ^ 0x51ed27, idx)),
    type,
    // The unit's own quirks plus whatever its kind always carries. A sheet quirk
    // arrives with a middling intensity, because it is a habit of the trade
    // rather than something the court measured about these particular men.
    quirks: [
      ...hu.quirks,
      ...type.defaultQuirks
        .filter((q) => !hu.quirks.some((x) => x.id === q))
        .map((q) => ({ id: q, explains: `A habit of ${type.name}.`, intensity: 50 })),
    ],
    pending: {
      killsMilli: 0,
      killsDealtMilli: 0,
      killSource: null,
      morale: 0,
      moraleCeiling: 0,
      cohesion: 0,
      fatigue: 0,
      velX: 0,
      velY: 0,
      facing: 0,
      moraleWhy: [],
    },
  };
  recomputeGeometry(u);
  return u;
}

function buildCaptain(hc: HostCaptain, contingentId: string, side: Side, bannerUnitIdx: number): Captain {
  return {
    id: hc.id,
    contingentId,
    side,
    name: hc.name,
    command: hc.command,
    valour: hc.valour,
    wits: hc.wits,
    aggression: hc.aggression,
    caution: hc.caution,
    pride: hc.pride,
    greed: hc.greed,
    loyalty: hc.loyalty,
    grievance: hc.grievance,
    standing: hc.standing,
    rivals: hc.rivals.map((r) => ({ captainId: r.captainId, intensity: r.intensity })),
    quirks: hc.quirks.slice(),
    insulted: false,
    alive: true,
    captured: false,
    wounded: hc.wounded,
    bannerUnitIdx,
    nextThinkTick: 0,
    fellAtTick: null,
    deedIds: [],
  };
}

/** Stand the host up on its own third of the field. A `PLACE` directive
 *  overrides any of this; without one, the line forms sensibly so a battle can
 *  always be fought with no deployment orders at all (law 3: nothing waits). */
function autoDeploy(state: BattleState, side: Side): void {
  const t = state.terrain;
  // FIFTY METRES EITHER SIDE OF THE MIDDLE, and the reason is arithmetic, not
  // taste. An advance costs 300 wind a tick — 420 for men in mail and plates —
  // and a man is blown at a million, so every hundred metres of open ground is
  // about a minute and half of a heavy footman's wind. A hundred metres leaves
  // an attacker winded on arrival, which is the point; the full third of an
  // eight-hundred-metre field leaves him destroyed before he gets there, which
  // is not. A player who wants the far edge of his own third says so with PLACE
  // and pays for it in wind. See docs/OPEN-QUESTIONS.md.
  const front = side === 0 ? idiv(t.heightMm, 2) - 50000 : idiv(t.heightMm, 2) + 50000;
  const facing = side === 0 ? 1024 : 3072;
  const back = side === 0 ? front - 70000 : front + 70000;

  const line: Unit[] = [];
  const reserve: Unit[] = [];
  for (const c of state.contingents) {
    if (c.side !== side) continue;
    for (const ui of c.unitIdxs) {
      const u = state.units[ui] as Unit;
      (c.isReserve ? reserve : line).push(u);
    }
  }
  const layout = (row: Unit[], y: number): void => {
    if (row.length === 0) return;
    let total = 0;
    for (const u of row) total += u.frontageMm + 8000;
    let x = idiv(t.widthMm, 2) - idiv(total, 2);
    for (const u of row) {
      u.posX = clamp(x + idiv(u.frontageMm, 2), 20000, t.widthMm - 20000);
      u.posY = clamp(y, 20000, t.heightMm - 20000);
      u.facing = facing;
      x += u.frontageMm + 8000;
    }
  };
  layout(line, front);
  layout(reserve, back);
}

export function initState(input: BattleInput): BattleState {
  const seedHash = hashSeed(input.seed);
  const terrain = generateTerrain(seedHash, input.ground);

  const units: Unit[] = [];
  const contingents: Contingent[] = [];
  const captains: Captain[] = [];
  const hosts: [Host, Host] = [input.a, input.b];

  for (let side = 0 as Side; side < 2; side = (side + 1) as Side) {
    const host = hosts[side] as Host;
    for (const hc of host.contingents) {
      const startIdx = units.length;
      const idxs: number[] = [];
      for (const unitId of hc.unitIds) {
        const hu = host.units.find((x) => x.id === unitId);
        if (!hu) continue;
        const idx = units.length;
        units.push(buildUnit(hu, hc, side, idx, seedHash));
        idxs.push(idx);
      }
      const cap = host.captains.find((x) => x.id === hc.captainId);
      const bannerUnitIdx = idxs.length > 0 ? (idxs[0] as number) : startIdx;
      contingents.push({
        id: hc.id,
        side,
        name: hc.name,
        captainId: hc.captainId,
        unitIdxs: idxs,
        obedience: hc.obedience,
        resolve: hc.resolve,
        treachery: hc.treachery,
        cohesion0: hc.cohesion,
        fellowship: hc.fellowship,
        quirks: hc.quirks.slice(),
        source: hc.source,
        arrears: hc.arrears,
        isReserve: hc.disposition === "dutiful" && false,
        committed: false,
        charge: { id: "HOLD", params: {} },
        interpretation: {
          choice: "OBEY",
          urgency: 1000,
          sinceTick: 0,
          standoffMm: 0,
          paceBump: 0,
          heldBackUnitIdx: -1,
          supportTargetId: null,
        },
        pursuitPolicy: "SHORT",
        casualtiesPermilleAtLastThink: 0,
        withdrawn: false,
      });
      if (cap) captains.push(buildCaptain(cap, hc.id, side, bannerUnitIdx));
    }
  }

  const couriers: Courier[] = [];
  const buildArmy = (s: number): Army => {
    const side = s as Side;
    const host = hosts[side] as Host;
    const commander = host.captains.find((c) => c.id === host.command.commanderId);
    const bannerUnit = units.find((u) => u.side === side && u.type.traits.includes("SignalSource"));
    let startingStrength = 0;
    for (const u of units) if (u.side === side) startingStrength += u.strength;
    // THE JOIN: couriers = orderCapacity. The court's most direct hand on the
    // battle's controls, and the cleanest seam in the whole graft.
    const couriersTotal = host.command.orderCapacity;
    for (let i = 0; i < couriersTotal; i++) {
      couriers.push({ side, id: couriers.length, busyUntilTick: -1 });
    }
    const army: Army = {
      side,
      hostId: host.id,
      name: host.name,
      commanderCaptainId: host.command.commanderId,
      couriersTotal,
      exhortUsesLeft: K.command.exhortUsesBase + idiv(commander ? commander.standing : 0, K.command.exhortUsesPerStanding),
      bannerIdx: bannerUnit ? bannerUnit.idx : -1,
      bannerAlive: bannerUnit !== undefined,
      bannerLostAtTick: null,
      bannerMoving: false,
      bannerTargetX: 0,
      bannerTargetY: 0,
      signalRangeMm: K.command.signalRangeMm,
      planSlots: host.command.orderCapacity + K.command.planSlotsBonusOverOrderCapacity,
      plansBound: 0,
      hornsSounded: [],
      armyMorale: K.scales.barMax,
      lowMoraleSince: -1,
      startingStrength,
      broken: false,
      brokeAtTick: null,
      retreatSounded: false,
      retreatAtTick: null,
      tide: 0,
      authority: host.command.authority,
      physicians: host.supply.physicians,
      baggageCarts: host.supply.baggageCarts,
      plunder: 0,
      host,
    };
    return army;
  };
  const armies: [Army, Army] = [buildArmy(0), buildArmy(1)];

  const directives: Directive[] = [];
  for (const d of input.ordersA) directives.push(d);
  for (const d of input.ordersB) directives.push(d);
  // A stable order: by tick, then by the side that gave the word, then by the
  // order it was written. Two front ends that append in different orders within
  // the same tick still get the same battle.
  const sideOf = new Map<Directive, number>();
  for (const d of input.ordersA) sideOf.set(d, 0);
  for (const d of input.ordersB) sideOf.set(d, 1);
  const seq = new Map<Directive, number>();
  directives.forEach((d, i) => seq.set(d, i));
  directives.sort((p, q) => {
    if (p.t !== q.t) return p.t - q.t;
    const sp = sideOf.get(p) ?? 0;
    const sq = sideOf.get(q) ?? 0;
    if (sp !== sq) return sp - sq;
    return (seq.get(p) ?? 0) - (seq.get(q) ?? 0);
  });

  const state: BattleState = {
    tick: 0,
    seed: input.seed,
    seedHash,
    rngGlobal: makeRng(seedHash),
    terrain,
    units,
    contingents,
    captains,
    armies,
    volleys: [],
    couriers,
    plans: [],
    directives,
    directiveCursor: 0,
    events: [],
    tideWindowStart: 0,
    perception: units.map(() => emptyPerception()),
    phase: "DEPLOY",
    pursuitTicksLeft: 0,
    noContactTicks: 0,
    deeds: [],
    captives: [],
    capturedMen: [],
    losSeen: new Map<number, boolean>(),
    losGroup: -1,
    endedReason: "",
    ground: input.ground,
    reverseUnits: false,
  };

  // ── the deployment prologue ───────────────────────────────────────────────
  // Placements, the opening charges, stakes and the standing plans, all free.
  for (const d of directives) {
    if (d.t > 0) continue;
    applyDeploymentDirective(state, d, sideOf.get(d) === 1 ? 1 : 0);
  }
  // Anything not placed by hand stands where a marshal would put it.
  const placed = new Set<string>();
  for (const d of directives) if (d.t <= 0 && d.kind === "PLACE") placed.add(d.unitId);
  for (const side of [0, 1] as Side[]) {
    const anyPlaced = state.units.some((u) => u.side === side && placed.has(u.id));
    if (!anyPlaced) autoDeploy(state, side);
  }
  for (const u of state.units) recomputeGeometry(u);

  // Latecomers march on at their declared moment, in column, on the MARCH job.
  for (const side of [0, 1] as Side[]) {
    const host = hosts[side] as Host;
    for (const late of host.latecomers) {
      for (const unitId of late.unitIds) {
        const u = state.units.find((x) => x.id === unitId && x.side === side);
        if (!u) continue;
        // `entersAtFraction` is the one number in the contract that is not a
        // whole number. It is turned into a tick HERE, at the boundary, and
        // never touched again — no fraction ever enters the simulation.
        const at = Math.floor(late.entersAtFraction * PLANNED_TICKS);
        u.arrivalTick = at;
        if (at > 0) {
          u.onField = false;
          u.posX = clamp(u.posX, 20000, terrain.widthMm - 20000);
          u.posY = side === 0 ? 10000 : terrain.heightMm - 10000;
          if (u.type.allowedFormations.includes("column")) u.formationId = "column";
          recomputeGeometry(u);
        }
      }
    }
  }

  state.phase = "BATTLE";
  return state;
}

function applyDeploymentDirective(state: BattleState, d: Directive, side: Side): void {
  switch (d.kind) {
    case "PLACE": {
      const u = state.units.find((x) => x.id === d.unitId);
      if (!u) return;
      u.posX = clamp(d.x, 0, state.terrain.widthMm);
      u.posY = clamp(d.y, 0, state.terrain.heightMm);
      u.facing = ((d.facing % 4096) + 4096) % 4096;
      if (d.formationId && u.type.allowedFormations.includes(d.formationId)) {
        u.formationId = d.formationId;
      }
      if (d.posture) {
        // Stakes are planted before the fighting or not at all — ninety seconds
        // of hammering is not something you start with horsemen coming.
        u.posture = d.posture;
        if (d.posture === "STAKED") {
          u.hasStakes = true;
          u.stakesX = u.posX;
          u.stakesY = u.posY;
        }
      }
      recomputeGeometry(u);
      return;
    }
    case "CHARGE": {
      const c = state.contingents.find((x) => x.id === d.contingentId);
      if (!c) return;
      c.charge = { id: d.charge, params: d.params };
      c.isReserve = d.charge === "RESERVE";
      return;
    }
    case "PLAN": {
      const army = state.armies[side];
      if (army.plansBound >= army.planSlots) return;
      const plan = bindPlan(state, side, d.plan);
      if (plan) army.plansBound++;
      return;
    }
    case "PURSUIT_POLICY": {
      for (const c of state.contingents) if (c.side === side) c.pursuitPolicy = d.policy;
      return;
    }
    default:
      return;
  }
}

/** Arm a standing plan, if the recipient has a slot left. One armed plan per
 *  unit — two if its captain's wits are 70 or better, because a cunning man can
 *  hold two hypotheticals in his head at the morning briefing. */
export function bindPlan(state: BattleState, side: Side, binding: {
  recipient: string;
  trigger: StandingPlan["trigger"];
  value: number;
  hornChannel: number;
  orderId: StandingPlan["orderId"];
  params: StandingPlan["params"];
  note: string;
}): StandingPlan | null {
  const contingent = state.contingents.find((c) => c.id === binding.recipient && c.side === side);
  const unit = contingent ? undefined : state.units.find((u) => u.id === binding.recipient && u.side === side);
  if (!contingent && !unit) return null;

  const targets: Unit[] = contingent
    ? contingent.unitIdxs.map((i) => state.units[i] as Unit)
    : [unit as Unit];
  const captainId = contingent ? contingent.captainId : (state.contingents.find((c) => c.id === (unit as Unit).contingentId)?.captainId ?? "");
  const captain = state.captains.find((c) => c.id === captainId);
  const perUnit = captain && captain.wits >= K.command.highWitsThreshold
    ? K.command.plansPerUnitHighWits
    : K.command.plansPerUnit;
  for (const t of targets) if (t.plansArmed >= perUnit) return null;
  for (const t of targets) t.plansArmed++;

  const plan: StandingPlan = {
    side,
    recipient: binding.recipient,
    recipientIsUnit: contingent === undefined,
    trigger: binding.trigger,
    value: binding.value,
    hornChannel: binding.hornChannel,
    orderId: binding.orderId,
    params: binding.params,
    note: binding.note,
    armed: true,
    firedAtTick: null,
  };
  state.plans.push(plan);
  return plan;
}

/** How many men each side stands with at this moment. Used for army morale, the
 *  break check and the aftermath. */
export function sideStrength(state: BattleState, side: Side): number {
  let total = 0;
  for (const u of state.units) if (u.side === side && u.onField) total += u.strength;
  return total;
}

export function unitFormation(u: Unit): ReturnType<typeof formation> {
  return formation(u.formationId);
}

export function tickFraction(state: BattleState): number {
  return mini(1000, idiv(state.tick * 1000, PLANNED_TICKS));
}
