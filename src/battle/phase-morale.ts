// PHASES 9 and 10 — MORALE, and ROUT AND PURSUIT.
//
// MORALE IS THE REAL HEALTH BAR. Armies break; they are not slaughtered to the
// man. Casualties are only the INPUT; collapse is the OUTPUT, and the slaughter
// comes AFTER, in the pursuit, which is where most of a battle's dead actually
// die and where all of its ransoms are taken.
//
// THE ONE ASYMMETRY THAT SHAPES EVERY BATTLE: a routing unit sprays panic ninety
// metres while a steady one steadies only forty-five. PANIC TRAVELS TWICE AS FAR
// AS COURAGE. That is why battles end in an avalanche rather than a grind, and
// it is one line of arithmetic.
//
// AND EVERY CHANGE SHOWS ITS WORKING (law 4). Every term that summed to a
// unit's morale this tick is kept and logged, because the answer to "why did I
// lose?" is printed, never guessed. The `morale` event is mandatory and is not
// an optimisation target.

import { clamp, idiv, maxi, mini } from "../core/primitives.js";
import { rollPermilleValue } from "../core/rng.js";
import { deed, emit } from "./emit.js";
import { distUnits, walkUnits } from "./geometry.js";
import { hasQuirk, heraldFled, heraldRally, heraldRout } from "./herald.js";
import type { LogWriter } from "./log.js";
import { K } from "./rules.js";
import type { BattleState, Captain, MoraleState, Unit } from "./types.js";

function push(u: Unit, term: string, value: number): void {
  if (value === 0) return;
  u.pending.morale += value;
  u.pending.moraleWhy.push({ term, value });
}

export function phaseMorale(state: BattleState, log: LogWriter): void {
  // 9a. The pressures. Every term computed separately, into a `why` record.
  for (const u of walkUnits(state.units, state.reverseUnits)) {
    if (!u.onField || u.moraleState === "DESTROYED") continue;
    const p = state.perception[u.idx];
    const c = state.contingents.find((x) => x.id === u.contingentId);
    const captain = c ? state.captains.find((x) => x.id === c.captainId) : undefined;

    if (u.lastKillsTaken > 0 && u.maxStrength > 0) {
      // Read as: 400 thousandths of the bar per man lost, scaled by how big the
      // unit was. Losing a quarter of a hundred men costs a tenth of the bar.
      let loss = idiv(u.lastKillsTaken * K.morale.pCasualtyPerKillScaled * 1000, u.maxStrength);
      if (u.lastKillSource === "MISSILE") {
        // Being shot at from beyond answer is UNBEARABLE, and unbearable is
        // what routs armies. This multiplier is the archer's whole purpose.
        loss = idiv(loss * K.morale.pMissileMultiplierPermille, 1000);
      }
      push(u, u.lastKillSource === "MISSILE" ? "arrows in the ranks" : "our own dead, this moment", -loss);
      u.moraleCeiling = clamp(
        u.moraleCeiling - idiv(u.lastKillsTaken * K.morale.ceilingLossPerKillScaled * 1000, u.maxStrength),
        0,
        K.scales.barMax,
      );
    }

    for (const e of u.engagements) {
      if (e.arcOnMe === "FLANK") push(u, "they are round our side", K.morale.pFlankEngaged);
      else if (e.arcOnMe === "REAR") push(u, "they are behind us", K.morale.pRearEngaged);
    }

    if (p && p.enemyHorseInRear) push(u, "horsemen at our backs", K.morale.pCavalryDread);

    if (p) {
      const outnumbered = clamp(
        (p.localEnemyStrength - p.localFriendStrength) * K.morale.pOutnumberedPerMan,
        K.morale.pOutnumberedClamp,
        0,
      );
      push(u, "there are more of them here than of us", outnumbered);
      if (p.reservesInSight > 0) {
        push(u, "there are still fresh men behind us", p.reservesInSight * K.morale.pReservePerContingent);
      }
    }

    if (u.fatigue > K.morale.pFatigueAbove) {
      push(u, "we are blown", -idiv(u.fatigue, K.morale.pFatigueDivisor));
    }

    if (captain && captain.alive) {
      const banner = state.units[captain.bannerUnitIdx];
      if (banner && banner.onField && distUnits(u, banner) <= K.morale.captainNearRangeMm) {
        push(u, `${captain.name} is here with us`, captain.valour * K.morale.pCaptainNearPerValour);
      }
    }

    if (p && u.engagements.length > 0) {
      for (const e of u.engagements) {
        const enemy = state.units[e.enemyIdx] as Unit;
        const theirs = state.perception[enemy.idx];
        if (!theirs) continue;
        if (p.elevationMm - theirs.elevationMm >= K.morale.uphillThresholdMm) {
          push(u, "we hold the high ground", K.morale.pUphill);
        } else if (theirs.elevationMm - p.elevationMm >= K.morale.uphillThresholdMm) {
          push(u, "they are above us", -K.morale.pUphill);
        }
        break;
      }
    }

    const net = u.lastKillsDealt - u.lastKillsTaken;
    if (net !== 0) push(u, net > 0 ? "we are winning here" : "we are losing here", net * K.morale.pWinningPerNetKill);

    if (u.engagements.length === 0 && u.lastKillsTaken === 0) {
      push(u, "nobody is trying to kill us just now", K.morale.pRecovery);
    }

    // The Tide: the day itself, leaning. Winning firms an army up; losing makes
    // it brittle. This one coupling is where the whole dramatic arc comes from.
    const tide = state.armies[u.side].tide;
    if (tide !== 0) push(u, tide > 0 ? "the day is going our way" : "the day is going against us", tide * K.morale.pTidePerPoint);
  }

  // 9b. Contagion. Panic reaches twice as far as courage.
  for (const src of walkUnits(state.units, state.reverseUnits)) {
    if (!src.onField) continue;
    const routing = src.moraleState === "ROUTING" || src.moraleState === "FLED" || src.order?.id === "FEIGN";
    if (routing) {
      const emitted = src.strength * K.morale.contagionPanicPerMan;
      for (const u of state.units) {
        if (!u.onField || u.side !== src.side || u.idx === src.idx) continue;
        const d = distUnits(u, src);
        if (d >= K.morale.contagionPanicRangeMm) continue;
        const falloff = idiv((K.morale.contagionPanicRangeMm - d) * 1000, K.morale.contagionPanicRangeMm);
        push(u, `${src.name} are running`, -idiv(emitted * falloff, 1000));
      }
      continue;
    }
    const steady = src.moraleState === "STEADY" && src.morale >= K.morale.contagionSteadyMinMorale;
    const standard = src.type.traits.includes("Standard") && src.type.steadyRadiusMm > 0;
    if (!steady && !standard) continue;
    const range = standard ? src.type.steadyRadiusMm : K.morale.contagionSteadyRangeMm;
    const emitted = standard ? src.strength * K.morale.contagionSteadyPerMan * 2 : src.strength * K.morale.contagionSteadyPerMan;
    for (const u of state.units) {
      if (!u.onField || u.side !== src.side || u.idx === src.idx) continue;
      const d = distUnits(u, src);
      if (d >= range) continue;
      // COURAGE DOES NOT PASS BETWEEN CONTINGENTS WHOSE CAPTAINS ARE RIVALS.
      // The court's feud, visible as a gap in the line — you can watch a
      // grudge you never settled fail to hold a wing together.
      if (K.morale.contagionBlockedByRivalry && !standard && rivals(state, u, src)) continue;
      const falloff = idiv((range - d) * 1000, range);
      push(u, standard ? "the standard is still up" : `${src.name} are standing firm`, idiv(emitted * falloff, 1000));
    }
  }

  // 9c. Apply and clamp — the ONLY place morale is written.
  //
  // THE FLOOR IS A DRAG, NOT A WALL, AND THIS IS A DELIBERATE READING OF A
  // CONTRADICTION IN THE WRIT. Taken literally, morale is clamped to
  // [moraleFloor, ceiling] with a paid man's floor at 200,000, while a unit
  // routs below 150,000 — so no paid unit could ever break, which would delete
  // the rout, the rally, the pursuit and most of the game. Read instead as: a
  // paid man in a formed body has something holding him up, so below his floor
  // every pressure against him bites at a fifth of its weight. An unpaid
  // mercenary's floor is nought, so nothing damps him at all — which is exactly
  // what the Mercenary keyword says out loud: their courage has no floor. See
  // docs/OPEN-QUESTIONS.md.
  for (const u of state.units) {
    if (!u.onField) continue;
    let delta = u.pending.morale;
    if (delta < 0 && u.morale < u.moraleFloor) delta = idiv(delta, 5);
    if (delta !== 0) {
      u.morale = clamp(u.morale + delta, 0, u.moraleCeiling);
    } else if (u.morale > u.moraleCeiling) {
      u.morale = u.moraleCeiling;
    }
  }

  // 9d. State transitions, with hysteresis so a unit does not flicker.
  for (const u of state.units) {
    if (!u.onField) continue;
    transition(state, log, u);
  }

  // 9e. Log, with the full working, every ten ticks — and at once when any one
  // term was large enough to be the story.
  for (const u of state.units) {
    if (!u.onField) continue;
    // THE ORDER OF THE TERMS IS AN OUTPUT, so it must not depend on the order
    // the terms happened to be gathered in. Contagion walks its neighbours in
    // whatever order the caller walks units, and the reverse-iteration proof in
    // test/determinism.ts found exactly that: identical numbers, different line.
    // Sorted heaviest-against-him first, which is also the order a player wants
    // to read "why did I lose?" in.
    u.pending.moraleWhy.sort((p, q) => (p.value !== q.value ? p.value - q.value : p.term < q.term ? -1 : p.term > q.term ? 1 : 0));
    const big = u.pending.moraleWhy.some((w) => w.value >= 50000 || w.value <= -50000);
    if (big || state.tick % 10 === 0) {
      emit(state, log, "morale", {
        side: u.side,
        unit: u.id,
        morale: u.morale,
        ceiling: u.moraleCeiling,
        state: u.moraleState,
        delta: u.pending.morale,
        why: u.pending.moraleWhy,
      });
    }
    u.pending.morale = 0;
    u.pending.moraleWhy = [];
  }
}

function rivals(state: BattleState, a: Unit, b: Unit): boolean {
  if (a.contingentId === b.contingentId) return false;
  const ca = state.contingents.find((x) => x.id === a.contingentId);
  const cb = state.contingents.find((x) => x.id === b.contingentId);
  if (!ca || !cb) return false;
  const capA = state.captains.find((x) => x.id === ca.captainId);
  const capB = state.captains.find((x) => x.id === cb.captainId);
  if (!capA || !capB) return false;
  if (capA.rivals.some((r) => r.captainId === capB.id)) return true;
  if (capB.rivals.some((r) => r.captainId === capA.id)) return true;
  const q = (c: Captain, other: Captain): boolean =>
    c.quirks.some((x) => x.id === "will-not-fight-beside" && (x.targetId === other.id || x.targetId === undefined));
  return q(capA, capB) || q(capB, capA);
}

function setState(state: BattleState, u: Unit, to: MoraleState): void {
  if (u.moraleState === to) return;
  u.moraleState = to;
  u.moraleStateSince = state.tick;
}

function transition(state: BattleState, log: LogWriter, u: Unit): void {
  const h = K.morale.hysteresisMilli;
  const breakAt = u.type.isNonCombatant ? K.morale.nonCombatantBreakThreshold : K.morale.breakThreshold;

  if (u.strength <= 0 || idiv(u.strength * 1000, maxi(1, u.musterStrength)) < K.army.destroyedStrengthPermille) {
    if (u.moraleState !== "DESTROYED" && u.strength <= 0) {
      setState(state, u, "DESTROYED");
      u.onField = false;
      emit(state, log, "unit_destroyed", {
        side: u.side,
        unit: u.id,
        herald: `${u.name} are destroyed where they stood.`,
      });
      onUnitLost(state, log, u);
      return;
    }
  }
  if (u.moraleState === "DESTROYED" || u.moraleState === "FLED") return;

  if (u.moraleState === "ROUTING") {
    // A unit rallies at most ONCE. Twice-broken men are done for the day.
    if (u.ralliesUsed >= K.morale.ralliesAllowed) {
      if (state.tick - u.moraleStateSince > 200) {
        setState(state, u, "FLED");
        u.onField = false;
        emit(state, log, "unit_fled", { side: u.side, unit: u.id, herald: heraldFled(u.name) });
      }
      return;
    }
    if (u.morale > K.morale.rallyThreshold) {
      if (u.aboveRallySince < 0) u.aboveRallySince = state.tick;
    } else {
      u.aboveRallySince = -1;
    }
    const heldLongEnough = u.aboveRallySince >= 0 && state.tick - u.aboveRallySince >= K.morale.rallyHoldTicks;
    if (!heldLongEnough) return;
    let enemyClear = true;
    for (const e of state.units) {
      if (!e.onField || e.side === u.side) continue;
      if (distUnits(u, e) <= K.morale.rallyEnemyClearMm) {
        enemyClear = false;
        break;
      }
    }
    if (!enemyClear) return;
    const c = state.contingents.find((x) => x.id === u.contingentId);
    const captain = c ? state.captains.find((x) => x.id === c.captainId) : undefined;
    const captainBanner = captain && captain.alive ? state.units[captain.bannerUnitIdx] : undefined;
    const captainNear =
      captainBanner !== undefined && captainBanner.onField && distUnits(u, captainBanner) <= K.morale.rallyCaptainRadiusMm;
    const atOwnBaseline = u.side === 0 ? u.posY <= 30000 : u.posY >= state.terrain.heightMm - 30000;
    if (!captainNear && !atOwnBaseline) return;
    setState(state, u, "RALLYING");
    emit(state, log, "rally", {
      side: u.side,
      unit: u.id,
      herald: captain ? heraldRally(u.name, captain.name) : `${u.name} turn and stand.`,
    });
    return;
  }

  if (u.moraleState === "RALLYING") {
    if (state.tick - u.moraleStateSince >= K.morale.rallyHoldTicks) {
      u.ralliesUsed = 1;
      setState(state, u, "SHAKEN");
    }
    return;
  }

  if (u.morale < breakAt) {
    // Breaking is breaking: no hysteresis on the way down.
    setState(state, u, "ROUTING");
    u.brokeAtTick = state.tick;
    u.cohesion = 100000;
    u.order = null;
    u.posture = "NONE";
    if (u.type.allowedFormations.includes("loose")) u.formationId = "loose";
    emit(state, log, "rout_begin", { side: u.side, unit: u.id, herald: heraldRout(u.name) });
    emit(state, log, "morale_state", { side: u.side, unit: u.id, state: "ROUTING" });
    return;
  }

  const before = u.moraleState;
  if (u.morale >= K.morale.steadyThreshold + h) setState(state, u, "STEADY");
  else if (u.morale < K.morale.steadyThreshold - h && u.morale >= K.morale.shakenThreshold + h) setState(state, u, "SHAKEN");
  else if (u.morale < K.morale.shakenThreshold - h) setState(state, u, "WAVERING");
  if (before !== u.moraleState) {
    emit(state, log, "morale_state", { side: u.side, unit: u.id, state: u.moraleState, morale: u.morale });
  }
}

/** A unit leaving the field may take a captain, a banner or a saint with it. */
export function onUnitLost(state: BattleState, log: LogWriter, u: Unit): void {
  const army = state.armies[u.side];
  if (army.bannerIdx === u.idx && army.bannerAlive) {
    army.bannerAlive = false;
    army.bannerLostAtTick = state.tick;
    army.signalRangeMm = 0;
    for (const f of state.units) {
      if (f.side !== u.side || !f.onField) continue;
      f.morale = clamp(f.morale + K.morale.pBannerLost, f.moraleFloor, f.moraleCeiling);
    }
    emit(state, log, "banner_fell", {
      side: u.side,
      unit: u.id,
      herald: `The banner of ${army.name} goes down. Every order from here is a nine-second ride.`,
    });
  }
  const c = state.contingents.find((x) => x.id === u.contingentId);
  const captain = c ? state.captains.find((x) => x.id === c.captainId) : undefined;
  if (captain && captain.alive && captain.bannerUnitIdx === u.idx) {
    captain.alive = false;
    captain.fellAtTick = state.tick;
    emit(state, log, "captain_fell", {
      side: u.side,
      captain: captain.id,
      unit: u.id,
      herald: `${captain.name} falls with ${u.name}, and the men around him know it at once.`,
    });
    deed(state, log, "died-at-the-banner", captain.id, u.id, `${captain.name} died with his own men around him.`);
    for (const f of state.units) {
      if (f.contingentId !== u.contingentId || !f.onField) continue;
      f.moraleCeiling = clamp(f.moraleCeiling - K.morale.ceilingLossCaptainKilled, 0, K.scales.barMax);
    }
  }
}

// ── PHASE 10 — ROUT AND PURSUIT ─────────────────────────────────────────────

export function phaseRout(state: BattleState, log: LogWriter): void {
  for (const quarry of state.units) {
    if (!quarry.onField) continue;
    if (quarry.moraleState !== "ROUTING" && quarry.moraleState !== "FLED") continue;

    for (const hunter of state.units) {
      if (!hunter.onField || hunter.side === quarry.side) continue;
      if (distUnits(hunter, quarry) > K.pursuit.engagementRangeMm) continue;
      // Running men cannot defend themselves: armour and shields are ignored.
      let rate = K.pursuit.killRatePerTickMilli;
      if (hunter.type.isMounted || hunter.type.traits.includes("Pursuer")) {
        rate = idiv(rate * K.pursuit.mountedPursuerMulPermille, 1000);
      }
      quarry.pending.killsMilli += rate;
      quarry.pending.killSource = "PURSUIT";
      hunter.pending.killsDealtMilli += rate;
      hunter.pursuing = true;

      // The ransoms. This is where lords are taken, and it is why pursuit is
      // tempting and why pursuit is dangerous.
      if (state.tick % K.pursuit.captureCheckEveryTicks === 0) {
        const c = state.contingents.find((x) => x.id === quarry.contingentId);
        const captain = c ? state.captains.find((x) => x.id === c.captainId) : undefined;
        const hunterC = state.contingents.find((x) => x.id === hunter.contingentId);
        const hunterCaptain = hunterC ? state.captains.find((x) => x.id === hunterC.captainId) : undefined;
        let chance =
          K.pursuit.captureBasePermille +
          (hunter.type.isMounted ? K.pursuit.captureMountedBonusPermille : 0) +
          idiv(quarry.fatigue, K.pursuit.captureFatigueDivisor) -
          (captain ? captain.valour : 0);
        if (hunterCaptain && hasQuirk(hunterCaptain.quirks, "hungry-for-ransom")) {
          chance += K.pursuit.captureRansomHungryBonusPermille;
        }
        if (chance > 0 && rollPermilleValue(quarry.rng) < chance) {
          const men = mini(quarry.strength, maxi(1, idiv(quarry.strength, 8)));
          quarry.strength -= men;
          quarry.captured += men;
          state.capturedMen.push({ unitIdx: quarry.idx, men });
          emit(state, log, "casualties", {
            side: quarry.side,
            unit: quarry.id,
            men,
            source: "CAPTURED",
            herald: `${men} of ${quarry.name} throw down their arms and are taken.`,
          });
          if (captain && captain.alive && captain.bannerUnitIdx === quarry.idx && quarry.type.traits.includes("Ransomable")) {
            captain.alive = false;
            captain.captured = true;
            state.captives.push({ captainId: captain.id, side: quarry.side, byIdx: hunter.idx, tick: state.tick });
            emit(state, log, "captain_captured", {
              side: quarry.side,
              captain: captain.id,
              by: hunter.id,
              herald: `${captain.name} is pulled off his horse and taken alive; there will be a price on him by nightfall.`,
            });
            deed(state, log, "took-prisoners", hunterCaptain ? hunterCaptain.id : null, hunter.id, `${hunter.name} took ${captain.name} alive.`);
          }
        }
      }
    }
  }

  // The rein. A greedy captain, or one with blood between him and the running
  // men, ignores it exactly as he would ignore any other order he does not like.
  for (const c of state.contingents) {
    if (c.pursuitPolicy !== "REIN_IN") continue;
    const captain = state.captains.find((x) => x.id === c.captainId);
    if (!captain) continue;
    const wilful = captain.greed >= 60 || hasQuirk(captain.quirks, "blood-feud") || hasQuirk(captain.quirks, "hungry-for-ransom");
    for (const i of c.unitIdxs) {
      const u = state.units[i] as Unit;
      if (!u.onField || !u.pursuing) continue;
      if (wilful) {
        if (u.bloodlust >= K.pursuit.bloodlustCap) {
          deed(state, log, "over-pursued", captain.id, u.id, `${u.name} were told to rein in and did not hear it.`);
          u.bloodlust = K.pursuit.bloodlustCap - 1;
        }
        continue;
      }
      u.pursuing = false;
    }
  }
}
