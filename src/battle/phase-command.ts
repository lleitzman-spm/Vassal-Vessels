// PHASE 1 — COMMAND. WHY THIS IS THE PHASE THE GAME IS NAMED AFTER.
//
// You do not command an army; you command the few men who will still listen to
// you, and who those men are was decided at court, months ago, by you. This file
// is where that sentence becomes arithmetic. A word you give does not appear in
// a captain's head: it travels — one second if he can see the Crown Banner, nine
// seconds if a rider has to cross the field — and when it lands it goes through
// a person, who computes his heed ONCE and picks one of six outcomes, every one
// of which is visible motion, every one of which the herald announces with its
// political cause named (law 7).
//
// THREE CHANNELS, AND THE DIFFERENCE BETWEEN THEM IS THE WHOLE GAME (law 8):
//   · A standing CHARGE is always in force and costs nothing.
//   · A standing PLAN, agreed this morning while he was calm, fires INSTANTLY
//     and passes NO heed check. That is the loophole in the politics and it is
//     meant to be there: you cannot make a disloyal lord obey you in a crisis,
//     but you can get him to agree to something hypothetical at breakfast.
//   · An improvised ORDER rides a courier and passes through his temper.
//
// AND NO QUEUE. If every rider is out, the order simply FAILS TO SEND. The
// scarcity is the game; do not add a queue.

import { clamp, idiv } from "../core/primitives.js";
import { jitter8, rnd, rollPermilleValue } from "../core/rng.js";
import { deed, emit } from "./emit.js";
import { dist, distUnits, recomputeGeometry } from "./geometry.js";
import {
  heraldDesertion,
  heraldExhort,
  heraldInterpretation,
  heraldPlanFired,
  heraldSupportVeto,
  heraldWithdrawalSounded,
  hasQuirk,
  politicalCause,
  quirkHeed,
  quirkIntensity,
} from "./herald.js";
import type { LogWriter } from "./log.js";
import { losBetween } from "./los.js";
import { orderDifficultyModifier, orderSheet } from "./orders.js";
import { K } from "./rules.js";
import { bindPlan } from "./setup.js";
import type {
  BattleState,
  Captain,
  ChargeId,
  Contingent,
  Directive,
  Interpretation,
  OrderId,
  OrderParams,
  Side,
  StandingPlan,
  Unit,
} from "./types.js";

// ── small readings the heed needs ───────────────────────────────────────────

export function contingentUnits(state: BattleState, c: Contingent): Unit[] {
  return c.unitIdxs.map((i) => state.units[i] as Unit).filter((u) => u.onField);
}

function meanOf(units: Unit[], pick: (u: Unit) => number): number {
  if (units.length === 0) return 0;
  let total = 0;
  for (const u of units) total += pick(u);
  return idiv(total, units.length);
}

/** What share of this contingent's men are down, per mille. Half a point of
 *  heed for every one per cent of his men lost — a captain who has buried a
 *  quarter of his people listens differently. */
export function casualtiesPermille(state: BattleState, c: Contingent): number {
  let mustered = 0;
  let now = 0;
  for (const i of c.unitIdxs) {
    const u = state.units[i] as Unit;
    mustered += u.musterStrength;
    now += u.strength;
  }
  if (mustered === 0) return 0;
  return idiv((mustered - now) * 1000, mustered);
}

export function captainOf(state: BattleState, c: Contingent): Captain | undefined {
  return state.captains.find((x) => x.id === c.captainId);
}

function bannerUnit(state: BattleState, side: Side): Unit | null {
  const army = state.armies[side];
  if (!army.bannerAlive || army.bannerIdx < 0) return null;
  const u = state.units[army.bannerIdx];
  return u && u.onField ? u : null;
}

/** Can this unit hear you? The banner is your voice; where it stands is where
 *  you can be heard, and its range halves while it is moving. */
export function inSignal(state: BattleState, side: Side, target: Unit): boolean {
  const banner = bannerUnit(state, side);
  if (!banner) return false;
  const army = state.armies[side];
  const range = idiv(
    army.signalRangeMm * (army.bannerMoving ? K.command.signalRangeMovingMulPermille : 1000),
    1000,
  );
  if (distUnits(banner, target) > range) return false;
  if (!K.command.signalRequiresLOS) return true;
  return losBetween(state, banner, target);
}

// ── 1b. the heed, and the six outcomes ──────────────────────────────────────

export interface HeedResult {
  heed: number;
  choice: Interpretation;
  terms: { term: string; value: number }[];
  vetoed: boolean;
}

/** The score a captain computes when a word lands — ONCE, on arrival, never
 *  re-rolled per tick. Every term is kept so the event can print its reasons. */
export function computeHeed(
  state: BattleState,
  c: Contingent,
  captain: Captain,
  orderId: OrderId,
  representative: Unit | null,
): HeedResult {
  const terms: { term: string; value: number }[] = [];
  const units = contingentUnits(state, c);
  const add = (term: string, value: number): void => {
    if (value !== 0) terms.push({ term, value });
  };

  let heed = c.obedience;
  add("obedience (the court's own number)", c.obedience);

  const craft = idiv(captain.command, K.heed.commandBonusDivisor);
  heed += craft;
  add("his craft steadies the hand", craft);

  const banner = state.units[captain.bannerUnitIdx];
  if (banner && inSignal(state, c.side, banner)) {
    heed += K.heed.bannerLosBonus;
    add("he can see the Crown Banner", K.heed.bannerLosBonus);
  }

  const exhorted = units.some((u) => u.exhortUntilTick >= state.tick);
  if (exhorted) {
    heed += K.heed.exhortBonus;
    add("the exhortation is still in their ears", K.heed.exhortBonus);
  }

  const sheet = orderSheet(orderId);
  const rep = representative ?? units[0] ?? null;
  const extra = rep
    ? orderDifficultyModifier(orderId, rep.type.canBrace, rep.type.isMounted, rep.engagements.length > 0)
    : 0;
  heed -= sheet.difficulty + extra;
  add(`the order is ${sheet.name.toLowerCase()}`, -(sheet.difficulty + extra));

  const meanMorale = meanOf(units, (u) => u.morale);
  if (meanMorale < 450000) {
    heed -= K.heed.dangerWavering;
    add("his men are wavering", -K.heed.dangerWavering);
  }
  const ownFiles = units.reduce((a, u) => a + u.files, 0);
  const enemyFiles = units.reduce((a, u) => a + (state.perception[u.idx]?.engagedEnemyFilesAhead ?? 0), 0);
  if (ownFiles > 0 && enemyFiles * 2 >= ownFiles * 3) {
    heed -= K.heed.dangerOutnumbered;
    add("there are half again as many of them in front of him", -K.heed.dangerOutnumbered);
  }

  const cas = idiv(casualtiesPermille(state, c), K.heed.casualtyPermilleDivisor);
  heed -= cas;
  add("his own dead", -cas);

  if (captain.insulted) {
    heed -= K.command.overTheHeadInsultHeed * -1;
    add("you went over his head in front of his retinue", K.command.overTheHeadInsultHeed);
  }

  const q = quirkHeed(captain.quirks);
  heed += q.total;
  for (const t of q.terms) terms.push(t);

  const fat = idiv(meanOf(units, (u) => u.fatigue), K.heed.fatigueDivisor);
  heed -= fat;
  add("they are blown", -fat);

  const blood = meanOf(units, (u) => u.bloodlust);
  heed -= blood;
  add("the chase is in their blood", -blood);

  // The wobble is drawn from the captain's own banner unit, so nothing another
  // captain does can move his dice.
  const wobble = banner ? jitter8(banner.rng) : 0;
  heed += wobble;
  add("the man himself, on the day", wobble);

  let choice = pickOutcome(heed, captain);
  let vetoed = false;

  // THE SUPPORT VETO COMES FIRST, and it is canon because it is the story beat
  // the game exists for: he looks upon them hard-pressed, and looks away.
  if (orderId === "SUPPORT" && c.obedience < K.heed.supportVetoObedienceBar) {
    const targetC = state.contingents.find((x) => x.id === c.interpretation.supportTargetId);
    const targetCaptainId = targetC ? targetC.captainId : null;
    const isRival = targetCaptainId !== null && captain.rivals.some((r) => r.captainId === targetCaptainId);
    if (isRival) {
      vetoed = true;
      choice = captain.aggression >= K.heed.aggressionBranchAt ? "DRAG" : "DEFY";
      terms.push({ term: "he will not go to a rival's aid", value: 0 });
    }
  }

  // An oath is an oath. He may drag his feet; he will never simply refuse.
  if (choice === "DEFY" && hasQuirk(captain.quirks, "iron-oath")) {
    choice = "DRAG";
    terms.push({ term: "he swore an oath and does not break oaths", value: 0 });
  }

  return { heed, choice, terms, vetoed };
}

function pickOutcome(heed: number, captain: Captain): Interpretation {
  if (heed >= K.heed.obeyAt) return "OBEY";
  if (heed >= K.heed.obeyHisWayAt) return "OBEY-HIS-WAY";
  if (heed >= K.heed.dragOrHedgeAt) {
    return captain.aggression >= K.heed.aggressionBranchAt ? "DRAG" : "HEDGE";
  }
  if (heed >= K.heed.overreachOrHardHedgeAt) {
    return captain.aggression >= K.heed.aggressionBranchAt ? "OVERREACH" : "HARD-HEDGE";
  }
  return "DEFY";
}

/** The safe version of a word: a hedging captain does the half of it that
 *  cannot get him killed, and keeps a road open. */
function hedgeSubstitute(orderId: OrderId): OrderId {
  switch (orderId) {
    case "ATTACK":
    case "CHARGE":
      return "ADVANCE";
    case "SUPPORT":
      return "TAKE_POST";
    case "ADVANCE":
      return "ADVANCE";
    default:
      return orderId;
  }
}

/** The glory version: he goes further than you asked, and sooner. */
function overreachSubstitute(orderId: OrderId): OrderId {
  switch (orderId) {
    case "ADVANCE":
      return "ATTACK";
    case "ATTACK":
      return "CHARGE";
    default:
      return orderId;
  }
}

export function installOrder(u: Unit, orderId: OrderId, params: OrderParams): void {
  const sheet = orderSheet(orderId);
  u.order = {
    id: orderId,
    params,
    commitTicksLeft: sheet.commitTicks,
    windupTicksLeft: sheet.windupTicks,
  };
}

/** Put the word into the contingent's hands, shaped by how the captain took it. */
export function applyInterpretation(
  state: BattleState,
  log: LogWriter,
  c: Contingent,
  captain: Captain,
  orderId: OrderId,
  params: OrderParams,
  result: HeedResult,
): void {
  const units = contingentUnits(state, c);
  let effective = orderId;
  let urgency = 1000;
  let standoff = 0;
  let heldBack = -1;
  let paceBump = 0;

  switch (result.choice) {
    case "OBEY":
      break;
    case "OBEY-HIS-WAY":
      // A hot captain's advance arrives at a run; a careful one keeps a unit
      // back as his own private reserve, which you never asked for and cannot
      // see on any list.
      if (captain.aggression >= 60) paceBump = 1;
      else if (captain.aggression <= 40 && units.length >= 3) heldBack = units[units.length - 1]?.idx ?? -1;
      break;
    case "DRAG":
      urgency = K.heed.dragUrgencyPermille;
      break;
    case "HEDGE":
      effective = hedgeSubstitute(orderId);
      urgency = K.heed.hedgeUrgencyPermille;
      standoff = K.heed.hedgeStandoffMm;
      break;
    case "OVERREACH":
      effective = overreachSubstitute(orderId);
      urgency = 1000;
      break;
    case "HARD-HEDGE":
      effective = hedgeSubstitute(orderId);
      urgency = K.heed.hedgeUrgencyPermille;
      standoff = K.heed.hardHedgeStandoffMm;
      break;
    case "DEFY":
      // "Protect my own." He sets your word aside and stands where he is.
      effective = "HOLD";
      c.charge = { id: "HOLD", params: { x: units[0]?.posX ?? 0, y: units[0]?.posY ?? 0 } };
      break;
  }
  if (standoff > 0 && hasQuirk(captain.quirks, "craven")) standoff += K.heed.cravenExtraStandoffMm;

  c.interpretation = {
    choice: result.choice,
    urgency,
    sinceTick: state.tick,
    standoffMm: standoff,
    paceBump,
    heldBackUnitIdx: heldBack,
    supportTargetId: params.targetContingentId ?? c.interpretation.supportTargetId,
  };
  c.casualtiesPermilleAtLastThink = casualtiesPermille(state, c);

  const obeyed = result.choice === "OBEY" || result.choice === "OBEY-HIS-WAY";
  for (const u of units) {
    u.ordersGiven++;
    if (obeyed) u.ordersObeyed++;
    if (u.idx === heldBack) continue;
    if (u.order && u.order.commitTicksLeft > 0) {
      emit(state, log, "order_blocked", {
        side: c.side,
        unit: u.id,
        order: effective,
        reason: "COMMITTED",
        herald: `${u.name} are already committed and cannot be turned for another ${u.order.commitTicksLeft} ticks.`,
      });
      continue;
    }
    installOrder(u, effective, params);
    // Urgency is not only pace: a dragging captain takes two-thirds again as
    // long to get anything started, and a hot one is quicker off the mark.
    if (u.order && urgency > 0) u.order.windupTicksLeft = idiv(u.order.windupTicksLeft * 1000, urgency);
  }

  const cause = politicalCause(captain, c, result.terms);
  const herald = result.vetoed
    ? heraldSupportVeto(
        captain.name,
        state.contingents.find((x) => x.id === params.targetContingentId)?.name ?? "his fellows",
      )
    : heraldInterpretation(result.choice, captain.name, c.name, cause);

  emit(state, log, "interpretation", {
    side: c.side,
    captain: captain.id,
    contingent: c.id,
    order: orderId,
    effectiveOrder: effective,
    heed: result.heed,
    choice: result.choice,
    urgency,
    standoffMm: standoff,
    why: result.terms,
    herald,
  });

  if (result.choice === "DEFY") {
    deed(state, log, "defied", captain.id, null, `${captain.name} set the crown's word aside: ${cause}.`);
  }
}

// ── the phase itself ────────────────────────────────────────────────────────

export function phaseCommand(state: BattleState, log: LogWriter): void {
  ingestDirectives(state, log);
  deliverAndHeed(state, log);
  if (state.tick % K.command.planCheckEveryTicks === 0) evaluatePlans(state, log);
  if (state.tick % K.command.captainThinkEveryTicks === 0) captainsOwnHand(state, log);
  reconsider(state, log);
}

function sideOfDirective(state: BattleState, d: Directive): Side {
  switch (d.kind) {
    case "PLACE": {
      const u = state.units.find((x) => x.id === d.unitId);
      return u ? u.side : 0;
    }
    case "CHARGE": {
      const c = state.contingents.find((x) => x.id === d.contingentId);
      return c ? c.side : 0;
    }
    case "ORDER": {
      if (d.unitId) {
        const u = state.units.find((x) => x.id === d.unitId);
        if (u) return u.side;
      }
      const c = state.contingents.find((x) => x.id === d.contingentId);
      return c ? c.side : 0;
    }
    case "EXHORT": {
      const c = state.contingents.find((x) => x.id === d.contingentId);
      return c ? c.side : 0;
    }
    case "PLAN": {
      const c = state.contingents.find((x) => x.id === d.plan.recipient);
      if (c) return c.side;
      const u = state.units.find((x) => x.id === d.plan.recipient);
      return u ? u.side : 0;
    }
    default:
      return 0;
  }
}

function ingestDirectives(state: BattleState, log: LogWriter): void {
  while (state.directiveCursor < state.directives.length) {
    const d = state.directives[state.directiveCursor] as Directive;
    if (d.t > state.tick) break;
    state.directiveCursor++;
    if (d.t < state.tick) continue; // the deployment prologue, already spent
    ingestOne(state, log, d);
  }
}

function ingestOne(state: BattleState, log: LogWriter, d: Directive): void {
  const side = sideOfDirective(state, d);
  const army = state.armies[side];
  switch (d.kind) {
    // ── 1e. the words that need no rider ──────────────────────────────────
    case "EXHORT": {
      const c = state.contingents.find((x) => x.id === d.contingentId);
      if (!c || army.exhortUsesLeft <= 0) return;
      const units = contingentUnits(state, c);
      if (units.length === 0 || !units.some((u) => inSignal(state, side, u))) return;
      army.exhortUsesLeft--;
      for (const u of units) {
        u.morale = clamp(u.morale + K.morale.pExhort, u.moraleFloor, u.moraleCeiling);
        // The ceiling only ever falls. An exhortation is spent, permanently.
        u.moraleCeiling = clamp(u.moraleCeiling - K.morale.ceilingLossExhort, 0, K.scales.barMax);
        u.exhortUntilTick = state.tick + K.command.exhortDurationTicks;
      }
      emit(state, log, "exhort", { side, contingent: c.id, herald: heraldExhort(c.name) });
      return;
    }
    case "RIDE_TO": {
      army.bannerMoving = true;
      army.bannerTargetX = d.x;
      army.bannerTargetY = d.y;
      emit(state, log, "charge_change", {
        side,
        contingent: "banner",
        herald: "The banner moves. While it moves, your voice carries half as far.",
      });
      return;
    }
    case "HORN": {
      army.hornsSounded.push({ tick: state.tick, channel: d.channel });
      emit(state, log, "horn", {
        side,
        channel: d.channel,
        herald: `The ${d.channel === 1 ? "first" : d.channel === 2 ? "second" : "third"} horn sounds.`,
      });
      return;
    }
    case "SOUND_RETREAT": {
      army.retreatSounded = true;
      army.retreatAtTick = state.tick;
      for (const c of state.contingents) {
        if (c.side !== side) continue;
        c.charge = { id: "WITHDRAW", params: {} };
      }
      emit(state, log, "charge_change", {
        side,
        contingent: "all",
        charge: "WITHDRAW",
        herald: `${army.name} sounds the retreat, and the day is conceded.`,
      });
      return;
    }
    case "PURSUIT_POLICY": {
      for (const c of state.contingents) if (c.side === side) c.pursuitPolicy = d.policy;
      return;
    }
    case "PLAN": {
      // Mid-battle binding rides a courier and passes heed ON ARRIVAL: he can
      // refuse the envelope. Once accepted, the plan itself fires unchecked.
      sendOrder(state, log, side, d.plan.recipient, null, "BIND_PLAN", { plan: d.plan });
      return;
    }
    case "ORDER": {
      sendOrder(state, log, side, d.contingentId, d.unitId, d.orderId, d.params);
      return;
    }
    case "CHARGE": {
      const c = state.contingents.find((x) => x.id === d.contingentId);
      if (!c) return;
      c.charge = { id: d.charge, params: d.params };
      emit(state, log, "charge_change", {
        side,
        contingent: c.id,
        charge: d.charge,
        herald: `${c.name} are given a new standing job: ${d.charge.toLowerCase()}.`,
      });
      return;
    }
    default:
      return;
  }
}

/** 1a. Work out how the word travels, and who carries it. */
function sendOrder(
  state: BattleState,
  log: LogWriter,
  side: Side,
  contingentId: string | null,
  unitId: string | null,
  orderId: OrderId,
  params: OrderParams,
): void {
  const army = state.armies[side];
  const overTheHead = unitId !== null;
  const targetUnit = unitId !== null ? state.units.find((u) => u.id === unitId && u.side === side) : undefined;
  const contingent = contingentId !== null
    ? state.contingents.find((c) => c.id === contingentId && c.side === side)
    : targetUnit
      ? state.contingents.find((c) => c.id === targetUnit.contingentId)
      : undefined;
  if (!contingent) return;
  const captain = captainOf(state, contingent);
  const recipientUnit = targetUnit ?? state.units[captain ? captain.bannerUnitIdx : contingent.unitIdxs[0] ?? 0];
  if (!recipientUnit) return;

  if (inSignal(state, side, recipientUnit)) {
    const arriveTick = state.tick + K.command.signalDelayTicks;
    queuePending(recipientUnit, {
      orderId,
      params,
      arriveTick,
      viaCourier: false,
      contingentId: overTheHead ? null : contingent.id,
      unitIdx: overTheHead ? recipientUnit.idx : null,
      issuedTick: state.tick,
    });
    emit(state, log, "order_issued", {
      side,
      order: orderId,
      to: overTheHead ? recipientUnit.id : contingent.id,
      overTheHead,
      sent: true,
      viaCourier: false,
      arriveTick,
      herald: `The banner signals ${overTheHead ? recipientUnit.name : contingent.name}: ${orderSheet(orderId).name.toLowerCase()}.`,
    });
    if (overTheHead && captain) markInsulted(state, log, captain, contingent, recipientUnit);
    return;
  }

  const courier = state.couriers.find((c) => c.side === side && c.busyUntilTick <= state.tick);
  if (!courier) {
    // NO QUEUE. The scarcity is the game.
    emit(state, log, "order_issued", {
      side,
      order: orderId,
      to: overTheHead ? recipientUnit.id : contingent.id,
      overTheHead,
      sent: false,
      reason: "NO_COURIER",
      herald: `There is no rider free; the word to ${overTheHead ? recipientUnit.name : contingent.name} never leaves the banner.`,
    });
    return;
  }

  const banner = state.units[army.bannerIdx];
  const fromX = banner && army.bannerAlive ? banner.posX : recipientUnit.posX;
  const fromY = banner && army.bannerAlive ? banner.posY : recipientUnit.posY;
  const d = dist(fromX, fromY, recipientUnit.posX, recipientUnit.posY);
  let travel = idiv(d, K.speeds.courierRide);
  // A rider who has to go round or through danger takes a quarter longer.
  let passedDanger = false;
  for (const e of state.units) {
    if (e.side === side || !e.onField) continue;
    if (dist(e.posX, e.posY, idiv(fromX + recipientUnit.posX, 2), idiv(fromY + recipientUnit.posY, 2)) <= 50000) {
      passedDanger = true;
      break;
    }
  }
  if (passedDanger) travel = idiv(travel * K.speeds.courierDangerMulPermille, 1000);
  const anyEngaged = contingentUnits(state, contingent).some((u) => u.engagements.length > 0);
  if (anyEngaged) travel += K.speeds.courierRecipientEngagedExtraTicks;

  const arriveTick = state.tick + travel;
  courier.busyUntilTick = state.tick + travel * K.command.courierOccupancyMultiplier;
  queuePending(recipientUnit, {
    orderId,
    params,
    arriveTick,
    viaCourier: true,
    contingentId: overTheHead ? null : contingent.id,
    unitIdx: overTheHead ? recipientUnit.idx : null,
    issuedTick: state.tick,
  });
  emit(state, log, "order_issued", {
    side,
    order: orderId,
    to: overTheHead ? recipientUnit.id : contingent.id,
    overTheHead,
    sent: true,
    viaCourier: true,
    arriveTick,
    travelTicks: travel,
    herald: `A rider goes out to ${overTheHead ? recipientUnit.name : contingent.name}; he will be ${travel} ticks on the road.`,
  });
  emit(state, log, "courier_dispatch", {
    side,
    courier: courier.id,
    busyUntil: courier.busyUntilTick,
    distanceMm: d,
    passedDanger,
  });
  if (overTheHead && captain) markInsulted(state, log, captain, contingent, recipientUnit);
}

function markInsulted(state: BattleState, log: LogWriter, captain: Captain, c: Contingent, u: Unit): void {
  if (captain.insulted) return;
  captain.insulted = true;
  emit(state, log, "deed", {
    side: c.side,
    id: `insult-${captain.id}-${state.tick}`,
    kind: "went-over-his-head",
    captainId: captain.id,
    herald: `The word goes straight to ${u.name}, over ${captain.name}'s head and in front of his own retinue. He will remember it all day.`,
  });
}

function queuePending(u: Unit, p: Unit["pendingOrders"][number]): void {
  u.pendingOrders.push(p);
}

function deliverAndHeed(state: BattleState, log: LogWriter): void {
  // At tick zero every contingent's opening charge is weighed exactly as a word
  // arrival would be, so a hostile captain's opening behaviour is visible from
  // the first second rather than an hour in.
  if (state.tick === 0) {
    for (const c of state.contingents) {
      const captain = captainOf(state, c);
      if (!captain) continue;
      const rep = contingentUnits(state, c)[0] ?? null;
      const asOrder = chargeAsOrder(c.charge.id);
      const result = computeHeed(state, c, captain, asOrder, rep);
      applyInterpretation(state, log, c, captain, asOrder, c.charge.params, result);
      // The charge itself is what they carry out; the interpretation shades it.
      for (const u of contingentUnits(state, c)) u.order = null;
    }
    return;
  }

  for (const u of state.units) {
    if (u.pendingOrders.length === 0) continue;
    const due = u.pendingOrders.filter((p) => p.arriveTick === state.tick);
    if (due.length === 0) continue;
    u.pendingOrders = u.pendingOrders.filter((p) => p.arriveTick !== state.tick);
    for (const p of due) {
      if (p.viaCourier) {
        emit(state, log, "courier_arrive", { side: u.side, to: u.id, order: p.orderId, ridingTicks: state.tick - p.issuedTick });
      }
      if (p.unitIdx !== null) {
        // Over the captain's head: the unit takes it at full urgency with no
        // heed check of its own. The captain's grudge was booked at dispatch.
        u.ordersGiven++;
        u.ordersObeyed++;
        installOrder(u, p.orderId, p.params);
        emit(state, log, "interpretation", {
          side: u.side,
          unit: u.id,
          order: p.orderId,
          heed: 100,
          choice: "OBEY",
          urgency: 1000,
          why: [{ term: "the word came straight to them, over their captain", value: 0 }],
          herald: `${u.name} take the word straight from the crown and do it.`,
        });
        continue;
      }
      const c = state.contingents.find((x) => x.id === p.contingentId);
      const captain = c ? captainOf(state, c) : undefined;
      if (!c || !captain) continue;

      if (p.orderId === "BIND_PLAN") {
        const result = computeHeed(state, c, captain, "BIND_PLAN", contingentUnits(state, c)[0] ?? null);
        const accepted = result.choice !== "DEFY" && result.choice !== "HARD-HEDGE";
        if (accepted && p.params.plan) {
          const plan = bindPlan(state, c.side, p.params.plan);
          if (plan) {
            state.armies[c.side].plansBound++;
            emit(state, log, "plan_bound", {
              side: c.side,
              contingent: c.id,
              trigger: plan.trigger,
              order: plan.orderId,
              heed: result.heed,
              herald: `${captain.name} takes the envelope: ${plan.note}.`,
            });
          }
        } else {
          emit(state, log, "plan_bound", {
            side: c.side,
            contingent: c.id,
            accepted: false,
            heed: result.heed,
            herald: `${captain.name} will not take the envelope — ${politicalCause(captain, c, result.terms)}.`,
          });
        }
        continue;
      }
      const result = computeHeed(state, c, captain, p.orderId, contingentUnits(state, c)[0] ?? null);
      applyInterpretation(state, log, c, captain, p.orderId, p.params, result);
    }
  }
}

/** A standing job, weighed as though it were a word. */
export function chargeAsOrder(charge: ChargeId): OrderId {
  switch (charge) {
    case "HOLD":
    case "GUARD":
    case "RESERVE":
      return "HOLD";
    case "ADVANCE":
    case "MARCH":
      return "ADVANCE";
    case "ATTACK":
      return "ATTACK";
    case "SUPPORT":
      return "SUPPORT";
    case "SCREEN":
      return "SCREEN";
    case "WITHDRAW":
      return "WITHDRAW";
  }
}

/** An interpretation persists until a new word arrives, his casualties cross a
 *  quarter, one of his own units breaks, or the Banner falls. Nothing ever
 *  waits, and nothing is re-rolled every tick. */
function reconsider(state: BattleState, log: LogWriter): void {
  if (state.tick % K.command.captainThinkEveryTicks !== 0) return;
  for (const c of state.contingents) {
    if (c.withdrawn) continue;
    const captain = captainOf(state, c);
    if (!captain || !captain.alive) continue;
    const cas = casualtiesPermille(state, c);
    const crossed = cas - c.casualtiesPermilleAtLastThink >= K.heed.reEvaluateOnCasualtiesPermille;
    const broke = contingentUnits(state, c).some((u) => u.moraleState === "ROUTING" && u.brokeAtTick === state.tick - 1);
    const lost = state.armies[c.side].bannerLostAtTick;
    const bannerDown = lost !== null && state.tick - lost <= K.command.captainThinkEveryTicks;
    if (!crossed && !broke && !bannerDown) continue;
    const asOrder = chargeAsOrder(c.charge.id);
    const result = computeHeed(state, c, captain, asOrder, contingentUnits(state, c)[0] ?? null);
    applyInterpretation(state, log, c, captain, asOrder, c.charge.params, result);
  }
}

// ── 1c. standing plans ──────────────────────────────────────────────────────

function planTargets(state: BattleState, plan: StandingPlan): Unit[] {
  if (plan.recipientIsUnit) {
    const u = state.units.find((x) => x.id === plan.recipient);
    return u ? [u] : [];
  }
  const c = state.contingents.find((x) => x.id === plan.recipient);
  return c ? contingentUnits(state, c) : [];
}

function triggerFires(state: BattleState, plan: StandingPlan, targets: Unit[]): boolean {
  const army = state.armies[plan.side];
  switch (plan.trigger) {
    case "HORN_SOUNDED":
      return army.hornsSounded.some(
        (h) => h.channel === plan.hornChannel && h.tick > state.tick - K.command.planCheckEveryTicks && h.tick <= state.tick,
      );
    case "TICK_REACHED":
      return state.tick >= plan.value;
    case "BANNER_LOST":
      return army.bannerLostAtTick !== null && state.tick - army.bannerLostAtTick < K.command.planCheckEveryTicks;
    case "ENEMY_BROKE":
      // The best use of the whole mechanism: the reserve goes in the instant
      // the enemy line opens, with no rider and no heed check.
      for (const e of state.units) {
        if (e.side === plan.side || !e.onField) continue;
        if (e.brokeAtTick !== null && state.tick - e.brokeAtTick < K.command.planCheckEveryTicks) return true;
      }
      return false;
    default:
      break;
  }
  for (const u of targets) {
    switch (plan.trigger) {
      case "ENEMY_CAVALRY_WITHIN":
        for (const e of state.units) {
          if (e.side === plan.side || !e.onField || !e.type.isMounted) continue;
          if (distUnits(u, e) <= plan.value) return true;
        }
        break;
      case "ENEMY_WITHIN":
        for (const e of state.units) {
          if (e.side === plan.side || !e.onField) continue;
          if (distUnits(u, e) <= plan.value) return true;
        }
        break;
      case "ENGAGED_FOR_TICKS":
        if (u.contactTicks >= plan.value) return true;
        break;
      case "MORALE_BELOW":
        if (u.morale <= plan.value) return true;
        break;
      case "SELF_STRENGTH_BELOW":
        // Half a unit is worth saving; a quarter of one is worth nothing to
        // anybody. The value is per mille of the strength it mustered with.
        if (u.musterStrength > 0 && idiv(u.strength * 1000, u.musterStrength) <= plan.value) return true;
        break;
      case "AMMO_BELOW":
        if (u.type.missile !== null && u.ammo <= plan.value) return true;
        break;
      case "FRIEND_ROUTS_WITHIN":
        for (const f of state.units) {
          if (f.side !== plan.side || !f.onField || f.idx === u.idx) continue;
          if (f.moraleState === "ROUTING" && distUnits(u, f) <= plan.value) return true;
        }
        break;
      default:
        break;
    }
  }
  return false;
}

function evaluatePlans(state: BattleState, log: LogWriter): void {
  for (const plan of state.plans) {
    if (!plan.armed) continue;
    const targets = planTargets(state, plan);
    if (targets.length === 0) continue;
    if (!triggerFires(state, plan, targets)) continue;
    plan.armed = false;
    plan.firedAtTick = state.tick;
    // NO COURIER, NO HEED CHECK. He agreed while he was calm (law 8). This is
    // the loophole in the politics and it is deliberate.
    for (const u of targets) {
      installOrder(u, plan.orderId, plan.params);
      u.ordersGiven++;
      u.ordersObeyed++;
    }
    const name = plan.recipientIsUnit
      ? (targets[0] as Unit).name
      : (state.contingents.find((c) => c.id === plan.recipient)?.name ?? plan.recipient);
    emit(state, log, "plan_fired", {
      side: plan.side,
      recipient: plan.recipient,
      trigger: plan.trigger,
      order: plan.orderId,
      herald: heraldPlanFired(plan.note, name),
    });
  }
}

// ── 1d. the captain's own hand ──────────────────────────────────────────────
//
// Between your words a captain is never idle. Good captains make the army feel
// alive; bad ones make it feel haunted.

function captainsOwnHand(state: BattleState, log: LogWriter): void {
  for (const c of state.contingents) {
    if (c.withdrawn) continue;
    const captain = captainOf(state, c);
    if (!captain || !captain.alive) continue;
    const units = contingentUnits(state, c);
    if (units.length === 0) continue;
    const banner = state.units[captain.bannerUnitIdx];

    // 1. Hired men who have not been paid simply go home. Not a morale
    //    penalty — they leave. The strongest wire between treasury and field.
    if (c.source === "mercenary" && c.arrears > 0) {
      let left = false;
      for (const u of units) {
        if (!u.type.traits.includes("UnpaidLeave") && !hasQuirk(u.quirks, "flees-early-if-unpaid")) continue;
        if (rollPermilleValue(state.rngGlobal) < 25) {
          u.onField = false;
          u.deserted += u.strength;
          u.strength = 0;
          emit(state, log, "unit_fled", { side: c.side, unit: u.id, reason: "unpaid", herald: heraldDesertion(u.name) });
          deed(state, log, "deserted-unpaid", captain.id, u.id, `${u.name} were owed their pay and went home.`);
          left = true;
        }
      }
      if (left) continue;
    }

    // 2. Horse coming on: brace, and be LATE about it in proportion to how
    //    poor a soldier he is.
    const braceCandidates = units.filter(
      (u) => u.type.canBrace && u.posture !== "BRACED" && u.postureChangeTicksLeft === 0,
    );
    if (braceCandidates.length > 0) {
      let horseComing = false;
      for (const e of state.units) {
        if (e.side === c.side || !e.onField || !e.type.isMounted) continue;
        for (const u of braceCandidates) {
          if (distUnits(u, e) <= 120000) {
            horseComing = true;
            break;
          }
        }
        if (horseComing) break;
      }
      if (horseComing) {
        const late = idiv((100 - captain.command) * 40, 100);
        for (const u of braceCandidates) {
          u.postureChangeTicksLeft = orderSheet("BRACE").windupTicks + late;
          installOrder(u, "BRACE", {});
        }
        emit(state, log, "posture_change", {
          side: c.side,
          contingent: c.id,
          posture: "BRACED",
          lateTicks: late,
          herald: `${captain.name} calls the brace; butts go into the earth${late > 20 ? ", later than they should have" : ""}.`,
        });
        continue;
      }
    }

    // 4. One of his own is wavering and he holds somebody spare.
    const wavering = units.find((u) => u.moraleState === "WAVERING");
    const spare = units.find(
      (u) =>
        u.engagements.length === 0 &&
        u.moraleState === "STEADY" &&
        // He commits a man ONCE. Without this he re-orders the same unit to the
        // same place every two seconds for the rest of the day, and the log
        // fills with a decision he already made.
        !(u.order?.id === "SUPPORT"),
    );
    if (wavering && spare && spare.idx !== wavering.idx) {
      installOrder(spare, "SUPPORT", { targetUnitId: wavering.id });
      emit(state, log, "reserve_committed", {
        side: c.side,
        contingent: c.id,
        unit: spare.id,
        herald: `${captain.name} sends ${spare.name} in beside ${wavering.name} before they go.`,
      });
      continue;
    }

    // 5. One of his own is running and he rides to it. This is what makes a
    //    rally possible at all.
    const routing = units.find((u) => u.moraleState === "ROUTING");
    if (routing && banner) {
      installOrder(banner, "TAKE_POST", { x: routing.posX, y: routing.posY });
      emit(state, log, "charge_change", {
        side: c.side,
        contingent: c.id,
        herald: `${captain.name} rides into the running men of ${routing.name}.`,
      });
      continue;
    }

    // 6. A careful man whose contingent is coming apart sounds his OWN
    //    withdrawal, without your leave. Canon, because it is a story beat.
    const meanMorale = meanOf(units, (u) => u.morale);
    if ((captain.caution >= 70 || hasQuirk(captain.quirks, "craven")) && meanMorale < 300000) {
      c.charge = { id: "WITHDRAW", params: {} };
      emit(state, log, "charge_change", {
        side: c.side,
        contingent: c.id,
        charge: "WITHDRAW",
        herald: heraldWithdrawalSounded(captain.name, c.name),
      });
      deed(state, log, "sounded-own-withdrawal", captain.id, null, `${captain.name} came off the field without leave.`);
      continue;
    }

    // 7. A hothead sees an enemy and goes, orders or no orders.
    const heat = Math.max(
      quirkIntensity(captain.quirks, "hotheaded"),
      quirkIntensity(captain.quirks, "charges-without-orders"),
    );
    if (heat > 0 && banner && meanMorale >= 600000) {
      let enemyNear: Unit | null = null;
      for (const e of state.units) {
        if (e.side === c.side || !e.onField) continue;
        if (distUnits(banner, e) <= 100000) {
          enemyNear = e;
          break;
        }
      }
      if (enemyNear && rollPermilleValue(banner.rng) < heat * 2) {
        for (const u of units) installOrder(u, "ATTACK", { targetUnitId: enemyNear.id });
        emit(state, log, "interpretation", {
          side: c.side,
          captain: captain.id,
          contingent: c.id,
          order: "ATTACK",
          heed: 0,
          choice: "OVERREACH",
          why: [{ term: "he charges without orders", value: heat }],
          herald: `${captain.name} sees ${enemyNear.name} and goes at them; his men are moving before your rider is halfway.`,
        });
      }
    }
  }

  // 3. Fresh horse against a charge that just struck: the counter-charge into
  //    the flank. Kept separate because it looks across contingents.
  for (const c of state.contingents) {
    const captain = captainOf(state, c);
    if (!captain || !captain.alive || captain.aggression < K.heed.aggressionBranchAt) continue;
    const fresh = contingentUnits(state, c).find(
      (u) => u.type.isMounted && u.engagements.length === 0 && u.fatigue < 400000 && u.reformTicksLeft === 0,
    );
    if (!fresh) continue;
    let charger: Unit | null = null;
    for (const u of contingentUnits(state, c)) {
      for (const e of u.engagements) {
        const enemy = state.units[e.enemyIdx] as Unit;
        if (enemy.contactTicks <= K.command.captainThinkEveryTicks && enemy.type.isMounted) charger = enemy;
      }
    }
    if (!charger) continue;
    installOrder(fresh, "CHARGE", { targetUnitId: charger.id });
    emit(state, log, "charge_change", {
      side: c.side,
      contingent: c.id,
      unit: fresh.id,
      herald: `${captain.name} looses ${fresh.name} at the flank of ${charger.name}.`,
    });
  }
}

/** Reinforcements walk on at their hour, in column, on the MARCH job. */
export function bringOnLatecomers(state: BattleState, log: LogWriter): void {
  for (const u of state.units) {
    if (u.onField || u.arrivalTick !== state.tick) continue;
    u.onField = true;
    recomputeGeometry(u);
    const c = state.contingents.find((x) => x.id === u.contingentId);
    if (c) c.charge = { id: "MARCH", params: {} };
    emit(state, log, "reinforcement_arrives", {
      side: u.side,
      unit: u.id,
      herald: `${u.name} come up the road in column, late, and shake out where they can.`,
    });
  }
}

/** A crude random helper the captains' hand shares, kept here so the global
 *  stream is only ever touched from one file. */
export function globalRoll(state: BattleState, n: number): number {
  return rnd(state.rngGlobal, n);
}
