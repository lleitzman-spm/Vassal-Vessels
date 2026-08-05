// PHASES 2, 3 and 4 — PERCEPTION, INTENT and MOVEMENT.
//
// WHY THESE THREE LIVE TOGETHER. They are one sentence with three clauses: what
// a unit can see, what it therefore means to do, and where that actually puts
// it. Splitting them would mean passing the same caches through three files.
//
// PHASE 4a IS THE CENTREPIECE OF THE WHOLE GAME AND IT IS TWELVE LINES LONG.
// Bracing grants no bonus. A braced line projects a REFUSAL FIELD in front of
// itself that takes a charge's speed away — and because shock is the SQUARE of
// the speed left at contact, halving the speed quarters the damage. Refusal is
// multiplied by the defender's morale and cohesion, so the same braced spears,
// frightened and ragged, project almost nothing and are ridden over. That is why
// morale is not bolted onto combat: it lives INSIDE the counter.
//
// WHAT BREAKS IF YOU DO THE OBVIOUS THING. The obvious implementation of "spears
// beat cavalry" is a bonus against mounted. Do that and every one of these falls
// out of the model: charging from too close does full damage; mud does not
// matter; a terrified spear line is as good as a steady one; and flanking a pike
// block changes nothing. All four of those are the game.

import { absi, clamp, idiv, maxi, mini } from "../core/primitives.js";
import { atan2B, cosB, normB, signedB, sinB } from "../core/trig.js";
import { formation } from "./catalog.js";
import { emit } from "./emit.js";
import {
  arcOf,
  buildHash,
  dist,
  distUnits,
  gapBetween,
  nearby,
  recomputeGeometry,
  speedOf,
  walkUnits,
  type SpatialHash,
} from "./geometry.js";
import { hasQuirk } from "./herald.js";
import type { LogWriter } from "./log.js";
import { losBetween } from "./los.js";
import { K } from "./rules.js";
import { elevationMm, gradePermille, groundAt, slopeSpeedMul } from "./terrain.js";
import type { BattleState, OrderParams, Side, SpeedTier, Unit } from "./types.js";

export interface Intent {
  bearing: number;
  tier: SpeedTier;
  facing: number;
  posture: Unit["posture"];
}

let hash: SpatialHash | null = null;

export function spatial(): SpatialHash {
  if (!hash) throw new Error("the spatial hash is built in phase 2 and read after");
  return hash;
}

// ── PHASE 2 — PERCEPTION ────────────────────────────────────────────────────

export function phasePerception(state: BattleState): void {
  hash = buildHash(state.units, state.terrain.widthMm, state.terrain.heightMm);
  const h = hash;
  for (const u of walkUnits(state.units, state.reverseUnits)) {
    const p = state.perception[u.idx];
    if (!p) continue;
    if (!u.onField) {
      p.nearestEnemyIdx = -1;
      continue;
    }
    p.elevationMm = elevationMm(state.terrain, u.posX, u.posY);
    p.nearestEnemyIdx = -1;
    p.nearestEnemyDist = 1 << 30;
    p.localFriendStrength = 0;
    p.localEnemyStrength = 0;
    p.enemyHorseInRear = false;
    p.reservesInSight = 0;
    p.engagedEnemyFilesAhead = 0;

    for (const idx of nearby(h, state.units, u.posX, u.posY, K.morale.localCountRangeMm)) {
      const o = state.units[idx] as Unit;
      if (o.idx === u.idx) continue;
      if (o.side === u.side) p.localFriendStrength += o.strength;
      else p.localEnemyStrength += o.strength;
    }
    for (const o of state.units) {
      if (!o.onField || o.side === u.side) continue;
      const d = distUnits(u, o);
      if (d < p.nearestEnemyDist) {
        p.nearestEnemyDist = d;
        p.nearestEnemyIdx = o.idx;
      }
      if (
        o.type.isMounted &&
        o.engagements.length === 0 &&
        d <= K.morale.cavalryDreadRangeMm &&
        arcOf(o, u) === "REAR"
      ) {
        p.enemyHorseInRear = true;
      }
      if (d <= 90000 && arcOf(o, u) === "FRONT") p.engagedEnemyFilesAhead += o.files;
    }
    for (const c of state.contingents) {
      if (c.side !== u.side || !c.isReserve || c.committed) continue;
      const banner = state.units[c.unitIdxs[0] ?? -1];
      if (banner && banner.onField && distUnits(u, banner) <= 200000) p.reservesInSight++;
    }
    const army = state.armies[u.side];
    const bannerUnit = army.bannerAlive && army.bannerIdx >= 0 ? state.units[army.bannerIdx] : undefined;
    p.bannerInLOS = bannerUnit !== undefined && bannerUnit.onField && losBetween(state, u, bannerUnit);
    const c = state.contingents.find((x) => x.id === u.contingentId);
    const captain = c ? state.captains.find((x) => x.id === c.captainId) : undefined;
    const capBanner = captain ? state.units[captain.bannerUnitIdx] : undefined;
    p.captainInLOS =
      capBanner !== undefined && capBanner.onField && captain !== undefined && captain.alive && losBetween(state, u, capBanner);
  }
}

// ── PHASE 3 — INTENT ────────────────────────────────────────────────────────

function ownEdgeBearing(side: Side): number {
  // Side nought came from the low edge; side one from the high one. Running
  // men run home.
  return side === 0 ? 3072 : 1024;
}

function enemyOf(state: BattleState, u: Unit, targetUnitId: string | undefined): Unit | null {
  if (targetUnitId) {
    const t = state.units.find((x) => x.id === targetUnitId);
    if (t && t.onField && t.side !== u.side) return t;
  }
  const p = state.perception[u.idx];
  if (p && p.nearestEnemyIdx >= 0) return state.units[p.nearestEnemyIdx] ?? null;
  return null;
}

function towards(u: Unit, x: number, y: number): number {
  return atan2B(y - u.posY, x - u.posX);
}

export function phaseIntent(state: BattleState, log: LogWriter, out: Intent[]): void {
  // Same rule as the melee: what is WRITTEN goes out in index order, whatever
  // order the units were walked in. See test/determinism.ts.
  const records: { key: number; payload: Record<string, unknown> }[] = [];
  const log2: LogWriter = log;
  const noteOnly = (key: number, payload: Record<string, unknown>): void => {
    records.push({ key, payload });
  };
  for (const u of walkUnits(state.units, state.reverseUnits)) {
    const intent: Intent = { bearing: u.facing, tier: "STOP", facing: u.facing, posture: u.posture };
    out[u.idx] = intent;
    if (!u.onField) continue;

    // Countdowns run here, so a phase that reads an order later in the tick
    // sees the same numbers a phase that read it earlier did.
    if (u.order) {
      if (u.order.windupTicksLeft > 0) u.order.windupTicksLeft--;
      if (u.order.commitTicksLeft > 0) u.order.commitTicksLeft--;
    }
    if (u.postureChangeTicksLeft > 0) u.postureChangeTicksLeft--;
    if (u.formationChangeTicksLeft > 0) u.formationChangeTicksLeft--;
    if (u.reformTicksLeft > 0) u.reformTicksLeft--;

    // Routing men ignore everything and run for their own edge. There is no
    // order that reaches them.
    //
    // AND THEN THEY STOP, once nothing is chasing them — which is not a
    // softening, it is the difference between a rally being possible and being
    // arithmetic nonsense. Running drains nine hundred wind a tick and a blown
    // unit loses two thousand will a tick, so a unit that ran forever could
    // never get its breath back and therefore could never rally, ever, under
    // any circumstances. Men run until they are out of danger and then stand
    // about gasping; the distance they judge safe is the same eighty metres the
    // rally itself asks for.
    if (u.moraleState === "ROUTING" || u.moraleState === "FLED") {
      const seen = state.perception[u.idx];
      const chased = seen !== undefined && seen.nearestEnemyIdx >= 0 && seen.nearestEnemyDist <= K.morale.rallyEnemyClearMm;
      intent.bearing = ownEdgeBearing(u.side);
      intent.facing = intent.bearing;
      intent.tier = chased ? "ROUT" : "STOP";
      intent.posture = "NONE";
      continue;
    }
    if (u.moraleState === "DESTROYED") continue;

    const c = state.contingents.find((x) => x.id === u.contingentId);
    const urgencyStandoff = c ? c.interpretation.standoffMm : 0;
    const paceBump = c ? c.interpretation.paceBump : 0;

    // Skirmishers back away from anything that comes near, with no order, no
    // courier and no heed check. It is what makes them work unattended.
    if (u.type.traits.includes("Evade") && (c?.charge.id === "SCREEN" || u.order?.id === "SCREEN")) {
      const p = state.perception[u.idx];
      if (p && p.nearestEnemyIdx >= 0 && p.nearestEnemyDist <= 45000) {
        const e = state.units[p.nearestEnemyIdx] as Unit;
        intent.bearing = normB(towards(u, e.posX, e.posY) + 2048);
        intent.facing = towards(u, e.posX, e.posY);
        intent.tier = "RUN";
        intent.posture = "NONE";
        continue;
      }
    }

    const orderId = u.order && u.order.windupTicksLeft === 0 ? u.order.id : null;
    const params = u.order ? u.order.params : {};
    const job = orderId ?? chargeToJob(state, u, c?.charge.id ?? "HOLD");

    compileJob(state, noteOnly, u, intent, job, orderId ? params : (c?.charge.params ?? {}), urgencyStandoff);
    intent.tier = bumpTier(intent.tier, paceBump);
  }
  records.sort((p, q) => p.key - q.key);
  for (const r of records) emit(state, log2, "posture_change", r.payload);
}

type Noter = (key: number, payload: Record<string, unknown>) => void;

function bumpTier(tier: SpeedTier, bump: number): SpeedTier {
  if (bump === 0) return tier;
  const ladder: SpeedTier[] = ["STOP", "WALK", "ADVANCE", "RUN", "CHARGE"];
  const at = ladder.indexOf(tier);
  if (at < 0) return tier;
  return ladder[clamp(at + bump, 0, ladder.length - 1)] as SpeedTier;
}

function chargeToJob(state: BattleState, u: Unit, charge: string): string {
  switch (charge) {
    case "ATTACK":
      return "ATTACK";
    case "ADVANCE":
      return "ADVANCE";
    case "SUPPORT":
      return "SUPPORT";
    case "SCREEN":
      return "SCREEN";
    case "WITHDRAW":
      return "WITHDRAW";
    case "MARCH":
      return "MARCH";
    case "RESERVE":
    case "GUARD":
    case "HOLD":
    default: {
      // A unit standing on its job still shoots at what walks in front of it,
      // and still turns to face the nearest threat.
      void state;
      void u;
      return "HOLD";
    }
  }
}

function compileJob(
  state: BattleState,
  note: Noter,
  u: Unit,
  intent: Intent,
  job: string,
  params: OrderParams,
  standoffMm: number,
): void {
  const p = params as { x?: number; y?: number; targetUnitId?: string; targetContingentId?: string; formationId?: string; facing?: number };
  const enemy = enemyOf(state, u, p.targetUnitId);
  const per = state.perception[u.idx];

  switch (job) {
    case "BRACE": {
      intent.tier = "STOP";
      intent.posture = u.postureChangeTicksLeft === 0 ? "BRACED" : u.posture;
      if (enemy) intent.facing = towards(u, enemy.posX, enemy.posY);
      return;
    }
    case "PLANT_STAKES": {
      intent.tier = "STOP";
      if (u.order && u.order.windupTicksLeft === 0 && !u.hasStakes) {
        u.hasStakes = true;
        u.stakesX = u.posX;
        u.stakesY = u.posY;
        note(u.idx, {
          side: u.side,
          unit: u.id,
          posture: "STAKED",
          herald: `${u.name} finish hammering their stakes in, and the ground in front of them stops being open.`,
        });
      }
      intent.posture = u.hasStakes ? "STAKED" : "SHOOTING";
      if (enemy) intent.facing = towards(u, enemy.posX, enemy.posY);
      return;
    }
    case "SHOOT": {
      intent.tier = "STOP";
      intent.posture = "SHOOTING";
      if (enemy) intent.facing = towards(u, enemy.posX, enemy.posY);
      return;
    }
    case "CEASE_SHOOTING": {
      intent.tier = "STOP";
      intent.posture = "NONE";
      return;
    }
    case "FORM": {
      intent.tier = "STOP";
      if (p.formationId && u.formationId !== p.formationId && u.type.allowedFormations.includes(p.formationId) && u.formationChangeTicksLeft === 0) {
        const f = formation(p.formationId);
        u.formationId = p.formationId;
        u.formationChangeTicksLeft = f.changeTicks;
        recomputeGeometry(u);
        note(u.idx, {
          side: u.side,
          unit: u.id,
          formation: p.formationId,
          herald: `${u.name} change their order to ${f.name.toLowerCase()}.`,
        });
      }
      return;
    }
    case "WHEEL": {
      intent.tier = "STOP";
      intent.facing = p.facing !== undefined ? normB(p.facing) : enemy ? towards(u, enemy.posX, enemy.posY) : u.facing;
      return;
    }
    case "FALL_BACK": {
      const away = enemy ? normB(towards(u, enemy.posX, enemy.posY) + 2048) : ownEdgeBearing(u.side);
      intent.bearing = away;
      intent.facing = enemy ? towards(u, enemy.posX, enemy.posY) : away; // walk backwards, keep your points up
      intent.tier = "ADVANCE";
      intent.posture = "NONE";
      return;
    }
    case "WITHDRAW": {
      intent.bearing = ownEdgeBearing(u.side);
      intent.facing = intent.bearing;
      intent.tier = "ADVANCE";
      intent.posture = "NONE";
      return;
    }
    case "MARCH": {
      const y = u.side === 0 ? idiv(state.terrain.heightMm, 4) : state.terrain.heightMm - idiv(state.terrain.heightMm, 4);
      intent.bearing = towards(u, u.posX, y);
      intent.facing = intent.bearing;
      intent.tier = "ADVANCE";
      if (absi(u.posY - y) < 20000 && u.formationId === "column") {
        const to = u.type.defaultFormationId;
        u.formationId = to;
        u.formationChangeTicksLeft = formation(to).changeTicks;
        recomputeGeometry(u);
      }
      return;
    }
    case "SCREEN": {
      if (enemy && per && per.nearestEnemyDist < 60000) {
        intent.bearing = normB(towards(u, enemy.posX, enemy.posY) + 2048);
        intent.facing = towards(u, enemy.posX, enemy.posY);
        intent.tier = "ADVANCE";
      } else if (enemy) {
        intent.bearing = towards(u, enemy.posX, enemy.posY);
        intent.facing = intent.bearing;
        intent.tier = "WALK";
      }
      intent.posture = "SHOOTING";
      return;
    }
    case "SUPPORT":
    case "TAKE_POST": {
      let tx = p.x;
      let ty = p.y;
      if (p.targetUnitId) {
        const f = state.units.find((x) => x.id === p.targetUnitId);
        if (f) {
          tx = f.posX + idiv((f.frontageMm + u.frontageMm) * cosB(f.facing + 1024), 4096);
          ty = f.posY + idiv((f.frontageMm + u.frontageMm) * sinB(f.facing + 1024), 4096);
        }
      } else if (p.targetContingentId) {
        const tc = state.contingents.find((x) => x.id === p.targetContingentId);
        const f = tc ? state.units[tc.unitIdxs[0] ?? -1] : undefined;
        if (f) {
          tx = f.posX;
          ty = f.posY;
        }
      }
      if (tx === undefined || ty === undefined) {
        intent.tier = "STOP";
        if (enemy) intent.facing = towards(u, enemy.posX, enemy.posY);
        return;
      }
      const d = dist(u.posX, u.posY, tx, ty);
      intent.bearing = towards(u, tx, ty);
      intent.facing = enemy ? towards(u, enemy.posX, enemy.posY) : intent.bearing;
      intent.tier = d < 6000 ? "STOP" : d < 40000 ? "WALK" : "ADVANCE";
      return;
    }
    case "PURSUE": {
      const quarry = nearestRouting(state, u);
      if (!quarry) {
        intent.tier = "STOP";
        return;
      }
      u.pursuing = true;
      intent.bearing = towards(u, quarry.posX, quarry.posY);
      intent.facing = intent.bearing;
      intent.tier = "RUN";
      return;
    }
    case "REIN_IN": {
      u.pursuing = false;
      intent.tier = "STOP";
      return;
    }
    case "FEIGN": {
      // A false rout, deliberately indistinguishable from a real one — which is
      // exactly why a failed feign spreads real panic through your own line.
      intent.bearing = ownEdgeBearing(u.side);
      intent.facing = intent.bearing;
      intent.tier = "RUN";
      return;
    }
    case "CHARGE":
    case "ATTACK": {
      if (!enemy) {
        intent.tier = "STOP";
        return;
      }
      const gap = gapBetween(u, enemy);
      intent.bearing = towards(u, enemy.posX, enemy.posY);
      intent.facing = intent.bearing;
      if (standoffMm > 0 && gap <= standoffMm) {
        intent.tier = "STOP";
        intent.posture = u.type.missile ? "SHOOTING" : u.posture;
        return;
      }
      // THE RUN-UP IS THE WEAPON, AND IT IS SHORT. A horse needs a hundred and
      // fifty ticks — about thirty-four metres — to reach a gallop, and a
      // gallop costs 4200 wind a tick, so a charge begun from a hundred metres
      // out arrives blown and at half speed, and shock is the square of the
      // speed left. So: walk while it is far, advance, run, and only put the
      // spurs in at forty metres. Charging from too close is the player's
      // classic mistake; charging from too far is the engine's, and this line
      // is where it was made once already.
      const chargeFrom = u.type.isMounted ? 40000 : 15000;
      if (job === "CHARGE" || gap <= chargeFrom) intent.tier = "CHARGE";
      else if (gap <= 90000) intent.tier = "RUN";
      else if (gap <= 200000) intent.tier = "ADVANCE";
      else intent.tier = "WALK";
      if (u.reformTicksLeft > 0) intent.tier = "WALK"; // still redressing after the last stroke
      intent.posture = "NONE";
      return;
    }
    case "ADVANCE": {
      const tx = p.x;
      const ty = p.y;
      if (tx !== undefined && ty !== undefined) {
        intent.bearing = towards(u, tx, ty);
        intent.facing = intent.bearing;
        intent.tier = dist(u.posX, u.posY, tx, ty) < 6000 ? "STOP" : "ADVANCE";
        return;
      }
      if (!enemy) {
        intent.tier = "STOP";
        return;
      }
      const gap = gapBetween(u, enemy);
      intent.bearing = towards(u, enemy.posX, enemy.posY);
      intent.facing = intent.bearing;
      // A shooting unit told to ADVANCE advances to where it can shoot and no
      // further. Walking a bowman into a crossbowman's face is how you lose
      // sixty archers without loosing an arrow — a war bow cannot be drawn on
      // the move, so an archer who is still walking is an archer who is only
      // being shot at.
      let stop = standoffMm;
      if (stop === 0 && u.type.missile) stop = idiv(u.type.missile.rangeMm * 700, 1000);
      // Nobody advances at battle pace for a quarter of a kilometre. Beyond two
      // hundred metres the line walks, because wind spent on open ground is
      // wind that is not there when the fighting starts.
      intent.tier = gap <= stop ? "STOP" : gap > 200000 ? "WALK" : "ADVANCE";
      if (u.type.missile && gap <= u.type.missile.rangeMm) intent.posture = "SHOOTING";
      return;
    }
    case "HOLD":
    default: {
      intent.tier = "STOP";
      if (p.x !== undefined && p.y !== undefined && dist(u.posX, u.posY, p.x, p.y) > 12000) {
        intent.bearing = towards(u, p.x, p.y);
        intent.facing = intent.bearing;
        intent.tier = "WALK";
        return;
      }
      if (enemy) intent.facing = towards(u, enemy.posX, enemy.posY);
      if (u.type.missile && enemy && distUnits(u, enemy) <= u.type.missile.rangeMm && u.posture !== "STAKED") {
        intent.posture = "SHOOTING";
      }
      return;
    }
  }
}

function nearestRouting(state: BattleState, u: Unit): Unit | null {
  let best: Unit | null = null;
  let bestD = 1 << 30;
  for (const o of state.units) {
    if (!o.onField || o.side === u.side) continue;
    if (o.moraleState !== "ROUTING" && o.moraleState !== "FLED") continue;
    const d = distUnits(u, o);
    if (d < bestD) {
      bestD = d;
      best = o;
    }
  }
  return best;
}

// ── PHASE 4 — MOVEMENT ──────────────────────────────────────────────────────

function tierSpeed(u: Unit, tier: SpeedTier): number {
  const s = K.speeds;
  if (u.type.isMounted) {
    switch (tier) {
      case "STOP":
        return 0;
      case "WALK":
        return s.horseWalk;
      case "ADVANCE":
        return s.horseTrot;
      case "RUN":
        return s.horseCanter;
      case "CHARGE":
        return u.type.chargeSpeedMmPerTick > 0 ? u.type.chargeSpeedMmPerTick : s.horseGallop;
      case "ROUT":
        return s.horseRout;
    }
  }
  switch (tier) {
    case "STOP":
      return 0;
    case "WALK":
      return s.footWalk;
    case "ADVANCE":
      return s.footAdvance;
    case "RUN":
      return s.footRun;
    case "CHARGE":
      return s.footCharge;
    case "ROUT":
      return s.footRout;
  }
}

/** 4a. THE REFUSAL FIELD. A horse will not run onto a set spear point.
 *
 *  Read the multiplication carefully: refusal is the line's own strength TIMES
 *  whether it is braced TIMES how steady it is TIMES how well dressed it is.
 *  Frightened, ragged men project almost nothing, and get ridden over — which is
 *  the rule working, not the rule failing. And it is FRONT ARC ONLY, which is
 *  why pikes need horsemen on their wings. */
function applyRefusal(state: BattleState, chargers: Unit[]): void {
  for (const c of chargers) {
    if (c.speedTier !== "CHARGE" && c.speedTier !== "RUN") continue;
    const current = speedOf(c);
    let cap = current + 1000; // no cap until something refuses him
    let worst = 0;
    for (const d of state.units) {
      if (!d.onField || d.side === c.side) continue;
      const braced = d.posture === "BRACED";
      const staked = d.posture === "STAKED" || d.hasStakes;
      if (!braced && !staked && d.type.refusalBase === 0) continue;
      const f = formation(d.formationId);
      // Brace is front-arc only — unless the ring, which has no flanks at all.
      if (!f.allArcBrace && arcOf(c, d) !== "FRONT") continue;
      const range = staked ? K.refusal.stakesRefusalRangeMm : d.type.refusalRangeMm;
      if (range === 0) continue;
      const rangeEff = c.type.isMounted ? range : idiv(range * K.refusal.rangeMulAgainstFootPermille, 1000);
      if (gapBetween(d, c) > rangeEff) continue;

      const base = staked ? K.refusal.stakesRefusalBase : d.type.refusalBase;
      const braceMul = braced || staked ? K.refusal.braceMulBracedPermille : K.refusal.braceMulUnbracedPermille;
      const speciesMul = c.type.isMounted ? K.refusal.speciesMulMountedPermille : K.refusal.speciesMulFootPermille;
      let eff = idiv(base * braceMul, 1000);
      eff = idiv(eff * idiv(d.cohesion, 1000), 1000);
      eff = idiv(eff * idiv(d.morale, 1000), 1000);
      eff = idiv(eff * speciesMul, 1000);
      eff = idiv(eff * f.refusalMulPermille, 1000);
      let decel = idiv(eff * K.refusal.decelPerRefusalPoint, 1000);

      // THE IMPALEMENT RIDER. A boastful captain who has overreached spurs the
      // horses onto the points: half the refusal, and triple his own dead.
      const ct = state.contingents.find((x) => x.id === c.contingentId);
      const captain = ct ? state.captains.find((x) => x.id === ct.captainId) : undefined;
      if (
        ct &&
        captain &&
        ct.interpretation.choice === "OVERREACH" &&
        hasQuirk(captain.quirks, "boastful")
      ) {
        decel = idiv(decel * K.shock.impalementDecelMulPermille, 1000);
      }
      if (decel > worst) worst = decel;
      const capped = maxi(0, current - decel);
      if (capped < cap) cap = capped;
    }
    c.speedCapThisTick = cap;
    c.refusalTakenMmPerTick = worst;
  }
}

export function phaseMovement(state: BattleState, intents: Intent[]): void {
  for (const u of state.units) {
    u.speedCapThisTick = 1 << 20;
    u.refusalTakenMmPerTick = 0;
    if (u.onField) u.speedTier = intents[u.idx]?.tier ?? "STOP";
  }
  applyRefusal(state, state.units.filter((u) => u.onField));

  for (const u of state.units) {
    if (!u.onField || u.moraleState === "DESTROYED") continue;
    const intent = intents[u.idx];
    if (!intent) continue;
    const f = formation(u.formationId);
    const g = groundAt(state.terrain, u.posX, u.posY);

    // 4b. How fast this unit may go this tick.
    let want = tierSpeed(u, intent.tier);
    want = idiv(want * (intent.tier === "CHARGE" ? g.chargeSpeedMulPermille : g.speedMulPermille), 1000);
    const aheadX = u.posX + idiv(state.terrain.tileMm * cosB(intent.bearing), 4096);
    const aheadY = u.posY + idiv(state.terrain.tileMm * sinB(intent.bearing), 4096);
    const grade = gradePermille(state.terrain, u.posX, u.posY, aheadX, aheadY);
    want = idiv(want * slopeSpeedMul(grade), 1000);
    const fatigueMul = 1000 - idiv(u.fatigue * (1000 - K.fatigue.speedPenaltyAtFullFatiguePermille), 1000000);
    want = idiv(want * fatigueMul, 1000);
    want = idiv(want * (g.id === "road" && u.formationId === "column" ? f.roadSpeedMulPermille : f.speedMulPermille), 1000);
    want = idiv(want * u.type.speedMulPermille, 1000);
    if (u.formationChangeTicksLeft > 0) want = idiv(want, 2); // neither one thing nor the other
    const c = state.contingents.find((x) => x.id === u.contingentId);
    if (c) want = idiv(want * c.interpretation.urgency, 1000);
    if (want > u.speedCapThisTick) want = u.speedCapThisTick;
    if (want < 0) want = 0;

    const current = speedOf(u);
    const accel = u.type.isMounted ? K.acceleration.horseAccelMmPerTick2 : K.acceleration.footAccelMmPerTick2;
    let speed: number;
    if (want > current) speed = mini(want, current + accel);
    else speed = maxi(want, current - K.acceleration.brakeMmPerTick2);

    // 4c. Turning. A unit already fighting turns at barely a third speed, which
    // is exactly why getting round somebody's side wins battles: they cannot
    // look at you in time.
    let turn = K.turning.baseTurnBradsPerTick + idiv(u.type.drillBase * K.turning.drillTurnBonusPer10Drill, 10);
    turn = idiv(turn * u.type.turnMulPermille, 1000);
    turn = idiv(turn * idiv(maxi(u.cohesion, K.turning.cohesionTurnMulMin), 1000), 1000);
    if (u.engagements.length > 0) turn = idiv(turn * K.turning.inContactTurnMulPermille, 1000);
    const wantFacing = normB(intent.facing);
    const delta = signedB(wantFacing - u.facing);
    const turned = clamp(delta, -turn, turn);
    u.pending.facing = normB(u.facing + turned);
    if (turned !== 0) {
      u.pending.cohesion -= absi(turned) * K.turning.turnCohesionCostPerBrad;
    }

    // 4d. Integrate. A body moves the way it is pointing.
    const dirX = cosB(u.pending.facing);
    const dirY = sinB(u.pending.facing);
    u.pending.velX = idiv(speed * dirX, 4096);
    u.pending.velY = idiv(speed * dirY, 4096);

    // Manoeuvre costs dress, always. That is the invisible price of every
    // clever idea a commander has.
    if (intent.tier === "WALK" || intent.tier === "ADVANCE") u.pending.cohesion += K.cohesion.drainWalking;
    else if (intent.tier === "RUN" || intent.tier === "ROUT") u.pending.cohesion += K.cohesion.drainRunning;
    else if (intent.tier === "CHARGE") u.pending.cohesion += K.cohesion.drainCharging;
    if (g.cohesionCapPermille < 1000 && speed > 0) u.pending.cohesion += K.cohesion.drainRoughGroundPerTick;

    // Posture. Bracing takes two seconds to set, and the difference between set
    // and not set is the difference between stopping horses and being ridden
    // over.
    if (intent.posture !== u.posture && u.postureChangeTicksLeft === 0) {
      if (intent.posture === "BRACED" && !u.type.canBrace) {
        // Men with knives cannot stop a horse by wishing.
      } else if (speed === 0 || intent.posture === "NONE") {
        u.posture = intent.posture;
      }
    }
    // You cannot brace and walk. Move, and the points come up off the ground.
    if (speed > 0 && u.posture === "BRACED") u.posture = "NONE";
    if (speed > 0 && u.posture === "STAKED") {
      // Stakes are left behind forever if the unit moves. Ninety seconds of
      // work, abandoned in one step.
      u.posture = "NONE";
      u.hasStakes = false;
    }
  }

  // Fold the movement half of the shadow copy in.
  for (const u of state.units) {
    if (!u.onField) continue;
    u.facing = u.pending.facing;
    u.velX = u.pending.velX;
    u.velY = u.pending.velY;
    u.pending.velX = 0;
    u.pending.velY = 0;
    const beforeX = u.posX;
    const beforeY = u.posY;
    u.posX = clamp(u.posX + u.velX, 0, state.terrain.widthMm);
    u.posY = clamp(u.posY + u.velY, 0, state.terrain.heightMm);
    // How much ground this unit gained along its own front, for the Tide.
    const moved = idiv((u.posX - beforeX) * cosB(u.facing) + (u.posY - beforeY) * sinB(u.facing), 4096);
    if (u.engagements.length > 0 && moved > 0) u.advanceAlongFacingMm += moved;
  }

  // Bodies do not occupy the same ground. Pushed apart once, in ascending index
  // order, so the result cannot depend on who was looked at first.
  for (let i = 0; i < state.units.length; i++) {
    const a = state.units[i] as Unit;
    if (!a.onField) continue;
    for (let j = i + 1; j < state.units.length; j++) {
      const b = state.units[j] as Unit;
      if (!b.onField) continue;
      if (a.engagements.some((e) => e.enemyIdx === b.idx)) continue;
      const gap = gapBetween(a, b);
      if (gap > 0) continue;
      const push = 400 - gap;
      const bearing = atan2B(b.posY - a.posY, b.posX - a.posX);
      // A horse shoves a footman three to one.
      const aShare = a.type.isMounted && !b.type.isMounted ? idiv(push, 4) : b.type.isMounted && !a.type.isMounted ? idiv(push * 3, 4) : idiv(push, 2);
      const bShare = push - aShare;
      a.posX = clamp(a.posX - idiv(aShare * cosB(bearing), 4096), 0, state.terrain.widthMm);
      a.posY = clamp(a.posY - idiv(aShare * sinB(bearing), 4096), 0, state.terrain.heightMm);
      b.posX = clamp(b.posX + idiv(bShare * cosB(bearing), 4096), 0, state.terrain.widthMm);
      b.posY = clamp(b.posY + idiv(bShare * sinB(bearing), 4096), 0, state.terrain.heightMm);
    }
  }
}
