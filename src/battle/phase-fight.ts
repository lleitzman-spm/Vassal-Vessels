// PHASES 5 to 8 — CONTACT AND SHOCK, MELEE, MISSILES, ATTRITION.
//
// PHASE 5 IS WHERE LAW 5 LIVES: shock is men times mass times the SQUARE of the
// speed left at contact. Halve the speed and you quarter the damage. There is
// not one bonus in it, and every counter in the game falls out of that one line
// — braced points, mud, charging from too close, a wedge, a flank.
//
// PHASE 6 IS THE SIX SECONDS. For a hundred and twenty ticks reach rules: a
// spear wall beats swordsmen better than two to one. Then the press: long
// weapons drop to one fighting rank, take their crowd penalty, and the reach
// advantage becomes HALF OF ITSELF AS A PENALTY — computed from the PRIMARY
// weapons even after sidearms are drawn, because the man is still tangled with
// his pike. Short weapons gain penetration, because at grappling distance you
// aim at the gaps in the armour. A sidearm is worth more than any stat.
//
// PHASE 7: arrows are shot at a PATCH OF GROUND, they fly, and they land on
// whoever is standing there. The sim never leads the target — a unit that moved
// during the flight is missed. Arrows kill slowly and frighten badly, and that
// is their real job: make the enemy breakable, then charge.
//
// WHAT BREAKS IF YOU DO THE OBVIOUS THING. If missiles were an instant hit roll
// against a unit, then moving would not save anybody, the three-second flight
// would be decoration, and shooting at a target that is about to charge you
// would be free. All three of those are the archer's actual problem.

import { absi, assertWide, clamp, idiv, maxi, mini, sq } from "../core/primitives.js";
import { atan2B, cosB, sinB } from "../core/trig.js";
import { rnd, rollPermilleValue } from "../core/rng.js";
import { formation } from "./catalog.js";
import { deed, emit } from "./emit.js";
import {
  arcOf,
  closingSpeed,
  dist,
  distUnits,
  engagementGapMm,
  gapBetween,
  missileDensityPermille,
  overlapWidth,
  recomputeGeometry,
  speedOf,
  walkUnits,
} from "./geometry.js";
import { hasQuirk, heraldShock } from "./herald.js";
import type { LogWriter } from "./log.js";
import { losBetween } from "./los.js";
import { K } from "./rules.js";
import { coverAt, elevationMm } from "./terrain.js";
import type { Arc, BattleState, Unit, Volley } from "./types.js";

/** Armour as it actually protects, from the direction it is actually being hit.
 *
 *  Front: armour plus shield. Flank: most of the armour, a quarter of the
 *  shield. Rear: your mail still covers your back — your shield does not. And a
 *  unit whose ranks have come apart has lost the overlap that made the wall a
 *  wall, so its shields are worth half. */
export function armourEff(u: Unit, arc: Arc, versusMissile: boolean, stationary: boolean): number {
  const f = formation(u.formationId);
  let body = u.type.armourBase;
  if (u.type.isMounted && u.type.horseArmour > 0) {
    // A third of what you are aiming at is horse.
    body = idiv(u.type.armourBase * 2 + u.type.horseArmour, 3);
  } else if (u.type.isMounted) {
    body = idiv(u.type.armourBase * 2 + 0, 3);
  }
  let shield = versusMissile ? u.type.shieldBase + u.type.shieldMissileBonus : u.type.shieldBase;
  if (u.type.shieldRequiresStationary && !stationary) shield = 0;
  if (u.cohesion < K.cohesion.shieldHalvedBelow) shield = idiv(shield, 2);
  if (arc === "FRONT" && f.frontShieldMulPermille !== 1000) shield = idiv(shield * f.frontShieldMulPermille, 1000);

  switch (arc) {
    case "FRONT":
      return idiv(body * K.arcs.armourMulFrontPermille, 1000) + idiv(shield * K.arcs.shieldMulFrontPermille, 1000);
    case "FLANK":
      return idiv(body * K.arcs.armourMulFlankPermille, 1000) + idiv(shield * K.arcs.shieldMulFlankPermille, 1000);
    default:
      return idiv(body * K.arcs.armourMulRearPermille, 1000) + idiv(shield * K.arcs.shieldMulRearPermille, 1000);
  }
}

/** Penetration against armour, on a CUBE. The cube is deliberate: it makes
 *  armour a wall rather than a slope, which is why armies carry hammers. */
export function woundPermille(pen: number, armour: number): number {
  const p3 = assertWide(pen * pen * pen, "pen cubed");
  const a3 = assertWide(armour * armour * armour, "armour cubed");
  if (p3 + a3 === 0) return K.melee.woundClampHigh;
  return clamp(idiv(1000 * p3, p3 + a3), K.melee.woundClampLow, K.melee.woundClampHigh);
}

// ── PHASE 5 — CONTACT AND SHOCK ─────────────────────────────────────────────

export function phaseContact(state: BattleState, log: LogWriter): void {
  const previous = new Map<number, Set<number>>();
  for (const u of state.units) previous.set(u.idx, new Set(u.engagements.map((e) => e.enemyIdx)));

  for (const u of state.units) u.engagements = [];
  for (let i = 0; i < state.units.length; i++) {
    const a = state.units[i] as Unit;
    if (!a.onField || a.moraleState === "DESTROYED") continue;
    for (let j = i + 1; j < state.units.length; j++) {
      const b = state.units[j] as Unit;
      if (!b.onField || b.side === a.side || b.moraleState === "DESTROYED") continue;
      const overlap = overlapWidth(a, b);
      if (overlap <= 0) continue;
      if (gapBetween(a, b) > engagementGapMm(a, b)) continue;
      const arcOnA = arcOf(b, a);
      const arcOnB = arcOf(a, b);
      a.engagements.push({ enemyIdx: b.idx, overlapMm: overlap, arcOnMe: arcOnA, arcOnThem: arcOnB });
      b.engagements.push({ enemyIdx: a.idx, overlapMm: overlap, arcOnMe: arcOnB, arcOnThem: arcOnA });
    }
  }

  for (const u of state.units) {
    const before = previous.get(u.idx) ?? new Set<number>();
    const now = new Set(u.engagements.map((e) => e.enemyIdx));
    for (const idx of now) {
      if (!before.has(idx) && idx > u.idx) {
        emit(state, log, "contact_begin", { side: u.side, a: u.id, b: (state.units[idx] as Unit).id });
      }
    }
    for (const idx of before) {
      if (!now.has(idx) && idx > u.idx) {
        emit(state, log, "contact_end", { side: u.side, a: u.id, b: (state.units[idx] as Unit).id });
      }
    }
    if (now.size > 0) {
      u.contactTicks++;
      u.totalContactTicks++;
    } else {
      u.contactTicks = 0;
    }
  }

  // 5b. Shock, on each NEW contact that arrived fast enough to matter.
  for (let i = 0; i < state.units.length; i++) {
    const c = state.units[i] as Unit;
    if (!c.onField) continue;
    const before = previous.get(c.idx) ?? new Set<number>();
    for (const e of c.engagements) {
      if (before.has(e.enemyIdx)) continue;
      const d = state.units[e.enemyIdx] as Unit;
      const closing = closingSpeed(c, d);
      if (closing < K.shock.thresholdMmPerTick) continue;
      // ONE stroke per meeting, delivered by whoever was actually moving. Both
      // bodies feel the collision, but the shock formula already gives the
      // charger his share of it (`chargerLossPermilleOfDelivered`); letting both
      // sides "deliver" counts the same crash twice and turns a cavalry charge
      // into a mutual head-on.
      const cs = speedOf(c);
      const ds = speedOf(d);
      if (cs < ds || (cs === ds && d.idx < c.idx)) continue;
      deliverShock(state, log, c, d, e.overlapMm, e.arcOnThem, closing);
    }
  }
}

function deliverShock(
  state: BattleState,
  log: LogWriter,
  c: Unit,
  d: Unit,
  overlapMm: number,
  arc: Arc,
  closing: number,
): void {
  const cf = formation(c.formationId);
  const df = formation(d.formationId);
  const impactMen = mini(
    mini(idiv(overlapMm, cf.manWidthMm), c.files),
    idiv(overlapMm, df.manWidthMm),
  );
  if (impactMen <= 0) return;

  // The square of the speed left at contact. This is the game.
  let shockRaw = assertWide(idiv(impactMen * c.type.massPerManKg * sq(idiv(closing, 10)), 1000), "shockRaw");
  shockRaw = idiv(shockRaw * cf.shockConcentrationMulPermille, 1000);
  shockRaw = idiv(shockRaw * cf.shockDeliveredMulPermille, 1000);
  shockRaw = idiv(shockRaw * df.shockReceivedMulPermille, 1000);
  shockRaw = idiv(shockRaw * maxi(c.cohesion, 300000), 1000000);

  const braced = (d.posture === "BRACED" || d.posture === "STAKED") && (arc === "FRONT" || df.allArcBrace);
  const resist =
    K.shock.resistBase +
    armourEff(d, arc, false, speedOf(d) === 0) +
    (braced ? K.shock.resistBracedBonus : 0) +
    d.ranks * K.shock.resistPerRank +
    idiv(d.cohesion, K.shock.resistCohesionDivisor) +
    df.shockResistBonus;

  const killsMilli = idiv(shockRaw * 240, resist);
  const ct = state.contingents.find((x) => x.id === c.contingentId);
  const captain = ct ? state.captains.find((x) => x.id === ct.captainId) : undefined;
  const impaled =
    ct !== undefined && captain !== undefined && ct.interpretation.choice === "OVERREACH" && hasQuirk(captain.quirks, "boastful");
  const chargerMilli = idiv(
    idiv(killsMilli * K.shock.chargerLossPermilleOfDelivered, 1000) * (impaled ? K.shock.impalementChargerLossMul : 1),
    1,
  );

  d.pending.killsMilli += killsMilli;
  d.pending.killSource = "SHOCK";
  c.pending.killsMilli += chargerMilli;
  if (!c.pending.killSource) c.pending.killSource = "SHOCK";
  c.pending.killsDealtMilli += killsMilli;
  d.pending.killsDealtMilli += chargerMilli;
  d.pending.morale -= idiv(killsMilli * K.shock.shockMoralePerKill, 1000);
  c.pending.cohesion -= K.shock.chargerCohesionLoss;
  d.pending.cohesion -= K.shock.defenderCohesionLoss;

  // Charging home wrecks your OWN order. Cavalry is a piston: charge, strike,
  // wheel out, reform, charge — and every stroke costs a rider out and back.
  c.velX = 0;
  c.velY = 0;
  c.reformTicksLeft = c.type.arrivalReadyTicks;

  emit(state, log, "shock", {
    side: c.side,
    charger: c.id,
    target: d.id,
    closingMmPerTick: closing,
    impactMen,
    killsMilli,
    chargerLossMilli: chargerMilli,
    arc,
    why: {
      refusalDecelApplied: c.refusalTakenMmPerTick,
      speedTakenAway: maxi(0, (c.type.chargeSpeedMmPerTick > 0 ? c.type.chargeSpeedMmPerTick : K.speeds.horseGallop) - closing),
      braced,
      resist,
      defenderCohesion: d.cohesion,
      defenderMorale: d.morale,
      impaled,
    },
    herald: heraldShock(c.name, d.name, closing, idiv(killsMilli, 1000)),
  });
  if (impaled && captain) {
    deed(state, log, "pressed-refused-charge", captain.id, c.id, `${captain.name} spurred his horses onto the points rather than be seen to slow.`);
  }
}

// ── PHASE 6 — MELEE, AND THE SIX SECONDS ────────────────────────────────────

export interface MeleeSide {
  attackers: number;
  hitPermille: number;
  woundPermille: number;
  crowdPermille: number;
  reach: number;
  killsMilli: number;
  weaponId: string;
}

/** One tick of attrition in one direction. Split out of the phase so the
 *  Six Seconds can be tested on its own, without a battle around it. */
export function meleeOneWay(
  a: Unit,
  b: Unit,
  overlapMm: number,
  arcOnB: Arc,
  press: boolean,
  bFallingBack: boolean,
): MeleeSide {
  const af = formation(a.formationId);
  const w = press ? a.type.pressWeapon : a.type.primary;
  const ranks = press ? K.melee.pressLongWeaponRankCap : mini(a.ranks, w.fightingRanks);
  let engagedFiles = idiv(overlapMm, af.manWidthMm);
  if (arcOnB === "FLANK") engagedFiles = mini(engagedFiles, b.ranks);
  else if (arcOnB === "REAR") engagedFiles = mini(engagedFiles, b.files);
  const attackers = mini(a.strength, engagedFiles * ranks);

  // Reach is computed from the PRIMARY weapons in both phases — the man is
  // still tangled with his pike even after he has dropped it.
  const reachClash = clamp(
    idiv((a.type.primary.reachMm - b.type.primary.reachMm) * K.melee.reachMulPer100Mm, 100),
    -K.melee.reachAdvClamp,
    K.melee.reachAdvClamp,
  );
  // A press fighter gains the inversion rather than suffering it: he fights at
  // arm's length by choice.
  const inverts = a.type.traits.includes("PressFighter") ? absi(reachClash) : -reachClash;
  const reach = press ? idiv(inverts, 2) : reachClash;

  const arcBonus =
    arcOnB === "FRONT"
      ? K.melee.arcHitBonusFront
      : arcOnB === "FLANK"
        ? K.melee.arcHitBonusFlank
        : K.melee.arcHitBonusRear;

  const hitP = clamp(
    K.melee.baseHitPermille +
      (a.type.skill - b.type.skill) * K.melee.skillDeltaPerPoint +
      reach +
      (b.type.isMounted ? K.melee.mountedTargetHitBonus : 0) +
      arcBonus -
      idiv(a.fatigue * K.melee.fatigueHitPenaltyPerBar, 1000000) -
      idiv((1000000 - a.cohesion) * K.melee.cohesionHitPenaltyPerBar, 1000000),
    K.melee.hitClampLow,
    K.melee.hitClampHigh,
  );

  const pen =
    w.pen +
    (press && w.pressPenaltyPermille <= K.melee.pressPenBonusWhenPressPenaltyAtMost
      ? K.melee.pressPenBonusShortWeapons
      : 0);
  const woundP = woundPermille(pen, armourEff(b, arcOnB, false, speedOf(b) === 0));
  const crowd = press
    ? a.type.traits.includes("PressFighter")
      ? 1000
      : 1000 - w.pressPenaltyPermille
    : 1000;
  const disengage = bFallingBack ? K.melee.disengagePenaltyMul : 1000;

  let kills = attackers * w.ratePer1000Ticks;
  kills = idiv(kills * hitP, 1000);
  kills = idiv(kills * woundP, 1000);
  kills = idiv(kills * crowd, 1000);
  kills = idiv(kills * disengage, 1000);
  if (a.type.isNonCombatant) kills = 0;

  return {
    attackers,
    hitPermille: hitP,
    woundPermille: woundP,
    crowdPermille: crowd,
    reach,
    killsMilli: kills,
    weaponId: w.id,
  };
}

export function phaseMelee(state: BattleState, log: LogWriter): void {
  // The melee records are gathered and then written in pair order rather than
  // in whatever order the units were walked. The ARITHMETIC does not care about
  // the order — every kill goes into the shadow copy — but the ORDER OF THE
  // LINES IN THE LOG IS AN OUTPUT, and the reverse-iteration proof in
  // test/determinism.ts is what found that out.
  const records: { key: number; payload: Record<string, unknown> }[] = [];
  for (const a of walkUnits(state.units, state.reverseUnits)) {
    if (!a.onField) continue;
    for (const e of a.engagements) {
      // Each pair once, from the lower index, so walking the units backwards
      // visits exactly the same pairs.
      if (e.enemyIdx < a.idx) continue;
      const b = state.units[e.enemyIdx] as Unit;
      const af = formation(a.formationId);
      const bf = formation(b.formationId);
      const closeClass = af.manWidthMm <= 900 && bf.manWidthMm <= 900;
      const press = a.contactTicks >= K.melee.pressOnsetTicks && closeClass;
      const aBack = a.order?.id === "FALL_BACK";
      const bBack = b.order?.id === "FALL_BACK";

      const fromA = meleeOneWay(a, b, e.overlapMm, e.arcOnThem, press, bBack);
      const fromB = meleeOneWay(b, a, e.overlapMm, e.arcOnMe, press, aBack);

      b.pending.killsMilli += fromA.killsMilli;
      if (fromA.killsMilli > 0) b.pending.killSource = "MELEE";
      a.pending.killsDealtMilli += fromA.killsMilli;
      a.pending.killsMilli += fromB.killsMilli;
      if (fromB.killsMilli > 0) a.pending.killSource = "MELEE";
      b.pending.killsDealtMilli += fromB.killsMilli;

      if (state.tick % 10 === 0) {
        records.push({
          key: a.idx * 4096 + b.idx,
          payload: {
          side: a.side,
          a: a.id,
          b: b.id,
          phase: press ? "PRESS" : "CLASH",
          contactTicks: a.contactTicks,
          aReach: fromA.reach,
          bReach: fromB.reach,
          aWeapon: fromA.weaponId,
          bWeapon: fromB.weaponId,
          aKillsMilli: fromA.killsMilli,
          bKillsMilli: fromB.killsMilli,
          aHit: fromA.hitPermille,
          bHit: fromB.hitPermille,
          aWound: fromA.woundPermille,
          bWound: fromB.woundPermille,
          },
        });
      }
    }
  }
  records.sort((p, q) => p.key - q.key);
  for (const r of records) emit(state, log, "melee", r.payload);
}

// ── PHASE 7 — MISSILES ──────────────────────────────────────────────────────

export function phaseMissiles(state: BattleState, log: LogWriter): void {
  // Land what is already in the air. It lands where it was AIMED, not where the
  // target is now.
  const landing = state.volleys.filter((v) => v.landTick === state.tick);
  state.volleys = state.volleys.filter((v) => v.landTick !== state.tick);
  for (const v of landing) landVolley(state, log, v);

  for (const u of state.units) {
    if (u.volleyCooldownTicks > 0) u.volleyCooldownTicks--;
    if (!u.onField || !u.type.missile || u.posture !== "SHOOTING") continue;
    if (u.ammo <= 0 || u.volleyCooldownTicks > 0) continue;
    if (u.moraleState === "ROUTING" || u.moraleState === "FLED") continue;
    const moving = speedOf(u) > 0;
    if (moving && !u.type.traits.includes("ShootOnMove")) continue;

    let target: Unit | null = null;
    let bestD = 1 << 30;
    for (const e of state.units) {
      if (!e.onField || e.side === u.side) continue;
      const d = distUnits(u, e);
      if (d > u.type.missile.rangeMm || d >= bestD) continue;
      if (!losBetween(state, u, e)) continue;
      target = e;
      bestD = d;
    }
    if (!target) continue;

    // Do not shoot your own people in the back: a lane six metres wide.
    let blocked = false;
    const bearing = atan2B(target.posY - u.posY, target.posX - u.posX);
    for (const f of state.units) {
      if (!f.onField || f.side !== u.side || f.idx === u.idx) continue;
      const df = distUnits(u, f);
      if (df >= bestD) continue;
      const fx = u.posX + idiv(df * cosB(bearing), 4096);
      const fy = u.posY + idiv(df * sinB(bearing), 4096);
      if (dist(fx, fy, f.posX, f.posY) < K.missiles.friendlyFireLaneMm + idiv(f.frontageMm, 2)) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;

    const aimed = u.aimedWindupLeft === 0 && u.order?.id === "SHOOT" && u.contactTicks === 0 && false;
    const w = u.type.missile;
    if (w.misfirePermille > 0 && rollPermilleValue(u.rng) < w.misfirePermille) {
      // Gunpowder. Sometimes the tube wins.
      u.pending.killsMilli += u.strength * 1000;
      emit(state, log, "casualties", {
        side: u.side,
        unit: u.id,
        source: "MISFIRE",
        herald: `The tube bursts and takes the crew of ${u.name} with it.`,
      });
      continue;
    }
    const flight = maxi(1, idiv(bestD, w.flightSpeedMmPerTick));
    state.volleys.push({
      shooterIdx: u.idx,
      side: u.side,
      launchTick: state.tick,
      landTick: state.tick + flight,
      targetX: target.posX,
      targetY: target.posY,
      spreadMm: idiv(bestD * w.spreadPermilleOfRange, 1000),
      shafts: u.strength,
      aimed,
      weapon: w,
      shooterElevationDm: idiv(elevationMm(state.terrain, u.posX, u.posY), 100),
    });
    u.ammo -= aimed ? K.missiles.aimedVolleyAmmoMul : 1;
    u.volleyCooldownTicks = maxi(1, idiv(1000, w.shotsPer1000Ticks));
    emit(state, log, "volley_launch", {
      side: u.side,
      unit: u.id,
      target: target.id,
      shafts: u.strength,
      flightTicks: flight,
      ammoLeft: u.ammo,
    });
  }
}

function landVolley(state: BattleState, log: LogWriter, v: Volley): void {
  const shooter = state.units[v.shooterIdx] as Unit;
  let hitUnit: Unit | null = null;
  let bestD = 1 << 30;
  for (const e of state.units) {
    if (!e.onField || e.side === v.side) continue;
    const d = dist(v.targetX, v.targetY, e.posX, e.posY);
    if (d > v.spreadMm + idiv(e.frontageMm + e.depthMm, 2)) continue;
    if (d < bestD) {
      bestD = d;
      hitUnit = e;
    }
  }
  if (!hitUnit) {
    emit(state, log, "volley_land", {
      side: v.side,
      unit: shooter.id,
      hit: null,
      herald: `The volley from ${shooter.name} falls on empty ground.`,
    });
    return;
  }

  const density = missileDensityPermille(hitUnit);
  const cover = coverAt(state.terrain, hitUnit.posX, hitUnit.posY);
  let hitP = K.missiles.baseHitPermille;
  hitP = idiv(hitP * density, 1000);
  for (let i = 0; i < cover; i++) hitP = idiv(hitP * K.missiles.coverHitMulPerLevelPermille, 1000);
  const elevationGainMm = v.shooterElevationDm * 100 - elevationMm(state.terrain, hitUnit.posX, hitUnit.posY);
  const elevBonus = clamp(
    idiv(elevationGainMm * K.missiles.elevationHitBonusPer1000mm, 1000),
    0,
    K.missiles.elevationHitBonusCapPermille,
  );
  hitP = idiv(hitP * (1000 + elevBonus), 1000);
  if (speedOf(hitUnit) > 0) hitP = idiv(hitP * K.missiles.movingTargetHitMulPermille, 1000);
  if (speedOf(shooter) > 0) hitP = idiv(hitP * K.missiles.shootOnMovePenaltyPermille, 1000);
  if (v.aimed) hitP = idiv(hitP * K.missiles.aimedVolleyHitMulPermille, 1000);

  const arc = arcOf(shooter, hitUnit);
  let armour = armourEff(hitUnit, arc, true, speedOf(hitUnit) === 0);
  if (hitUnit.type.traits.includes("Pavise") && arc === "FRONT" && speedOf(hitUnit) === 0) armour += 30;
  const woundP = woundPermille(v.weapon.pen, armour);

  const hitsMilli = v.shafts * hitP;
  const killsMilli = idiv(hitsMilli * woundP, 1000);
  hitUnit.pending.killsMilli += killsMilli;
  hitUnit.pending.killSource = "MISSILE";
  shooter.pending.killsDealtMilli += killsMilli;

  emit(state, log, "volley_land", {
    side: v.side,
    unit: shooter.id,
    hit: hitUnit.id,
    killsMilli,
    why: { density, cover, elevationBonus: elevBonus, armour, woundPermille: woundP, hitPermille: hitP },
    // A volley that kills nobody is still a record — it carries its reasons —
    // but it is not a line in a chronicle. Twenty of them in a row would drown
    // out the battle.
    ...(killsMilli >= 1000
      ? { herald: `The volley comes down on ${hitUnit.name} and ${idiv(killsMilli, 1000)} go down; the rest feel every shaft that missed.` }
      : {}),
  });
}

// ── folding the dead in ─────────────────────────────────────────────────────

/** Turn the tick's milli-kills into whole men. Done ONCE, after all four
 *  sources of death have had their say, so morale sees one honest number. */
export function foldCasualties(state: BattleState, log: LogWriter): void {
  for (const u of state.units) {
    u.lastKillsDealt = idiv(u.pending.killsDealtMilli, 1000);
    u.pending.killsDealtMilli = 0;
    if (u.pending.killsMilli === 0) {
      u.lastKillsTaken = 0;
      continue;
    }
    u.killAcc += u.pending.killsMilli;
    u.lastKillSource = u.pending.killSource;
    u.pending.killsMilli = 0;
    u.pending.killSource = null;
    const whole = idiv(u.killAcc, 1000);
    if (whole <= 0) {
      u.lastKillsTaken = 0;
      continue;
    }
    u.killAcc -= whole * 1000;
    const actual = mini(whole, u.strength);
    u.strength -= actual;
    u.dead += actual;
    u.lastKillsTaken = actual;
    recomputeGeometry(u);
    if (actual > 0) {
      emit(state, log, "casualties", {
        side: u.side,
        unit: u.id,
        men: actual,
        source: u.lastKillSource,
        strengthLeft: u.strength,
      });
    }
  }
}

// ── PHASE 8 — ATTRITION ─────────────────────────────────────────────────────

export function phaseAttrition(state: BattleState): void {
  for (const u of state.units) {
    if (!u.onField) continue;
    const f = formation(u.formationId);
    const g = groundOf(state, u);

    let drain: number;
    switch (u.speedTier) {
      case "STOP":
        drain = K.fatigue.drainStanding;
        break;
      case "WALK":
        drain = K.fatigue.drainWalking;
        break;
      case "ADVANCE":
        drain = K.fatigue.drainAdvancing;
        break;
      case "RUN":
        drain = K.fatigue.drainRunning;
        break;
      case "CHARGE":
        drain = K.fatigue.drainCharging;
        break;
      case "ROUT":
        drain = K.fatigue.drainRouting;
        break;
    }
    // Fighting is work even when you are standing still.
    if (u.engagements.length > 0 && drain < K.fatigue.drainMelee) drain = K.fatigue.drainMelee;
    drain = idiv(drain * u.type.fatigueMulPermille, 1000);
    drain = idiv(drain * g.fatigueMulPermille, 1000);
    u.pending.fatigue += drain;

    // Tired men can never be fully brave again. This is why the counter to
    // elite heavy foot is to make it chase you.
    if (u.fatigue > K.fatigue.ceilingErosionAboveFatigue) {
      u.pending.moraleCeiling -= K.fatigue.ceilingErosionPerTick;
    }

    // Standing still repairs the ranks; a well-drilled unit repairs them
    // faster. Everything else wrecks them.
    if (u.speedTier === "STOP" && u.engagements.length === 0) {
      u.pending.cohesion += K.cohesion.recoverStandingPerTick + u.type.drillBase * K.cohesion.drillRecoveryBonusPerPoint;
    }

    // The longer they chase, the less they hear you.
    if (u.pursuing) {
      if (state.tick % 100 === 0) u.bloodlust = mini(K.pursuit.bloodlustCap, u.bloodlust + K.pursuit.bloodlustPer100Ticks);
    } else if (u.bloodlust > 0) {
      u.bloodlust--;
    }

    // Fold the two slow bars in, under their caps.
    u.fatigue = clamp(u.fatigue + u.pending.fatigue, 0, K.scales.barMax);
    u.pending.fatigue = 0;
    const cap = mini(
      idiv(K.scales.barMax * f.cohesionCapPermille, 1000),
      idiv(K.scales.barMax * g.cohesionCapPermille, 1000),
    );
    const floor = u.pursuing ? K.pursuit.pursuitCohesionFloor : 0;
    u.cohesion = clamp(u.cohesion + u.pending.cohesion, floor, cap);
    u.pending.cohesion = 0;
    u.moraleCeiling = clamp(u.moraleCeiling + u.pending.moraleCeiling, 0, K.scales.barMax);
    u.pending.moraleCeiling = 0;
  }
}

function groundOf(state: BattleState, u: Unit): { fatigueMulPermille: number; cohesionCapPermille: number } {
  // Imported lazily to keep the hot loop from re-walking the module graph.
  const g = groundAtLocal(state, u);
  return g;
}

import { groundAt as groundAtRaw } from "./terrain.js";

function groundAtLocal(state: BattleState, u: Unit): { fatigueMulPermille: number; cohesionCapPermille: number } {
  return groundAtRaw(state.terrain, u.posX, u.posY);
}

/** A tiny helper the rout phase shares: how many men a roll of the dice took. */
export function rollMen(u: Unit, chancePermille: number, men: number): number {
  let taken = 0;
  for (let i = 0; i < men; i++) if (rnd(u.rng, 1000) < chancePermille) taken++;
  return taken;
}
