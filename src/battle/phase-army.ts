// PHASES 11, 12 and 13 — THE ARMY AND THE TIDE, VICTORY, and THE LOG.
//
// PHASE 11 is where the battle stops being a collection of units and becomes an
// army with a mood. Three things happen: the Tide is READ (never stored — see
// ./tide.ts), the contingents that were always going to turn get their chance to
// turn, and the army is asked whether it is still an army.
//
// TREACHERY IS NOT THE GAME CHEATING; IT IS THE GAME REMEMBERING. The court
// guarantees the player could have read the number before summoning, with a
// Spymaster. So the check below only fires for a contingent whose treachery the
// court already published, on a side whose Tide has sunk — foreseeable, which
// makes it your fault, which makes it a story.
//
// PHASE 13 is append-only and side-effect free. Turning the log off must not
// change one value anywhere; nothing in this file may consume a random number or
// mutate a unit.

import { clamp, idiv, maxi } from "../core/primitives.js";
import { rnd, rollPermilleValue } from "../core/rng.js";
import { deed, emit } from "./emit.js";
import { heraldArmyBreak, heraldTreachery } from "./herald.js";
import type { LogWriter } from "./log.js";
import { write } from "./log.js";
import { onUnitLost } from "./phase-morale.js";
import { K, MAX_TICKS } from "./rules.js";
import { advanceTideWindow, readTide } from "./tide.js";
import type { BattleState, Side, Unit } from "./types.js";

export function phaseArmyAndTide(state: BattleState, log: LogWriter): void {
  for (const side of [0, 1] as Side[]) {
    const army = state.armies[side];
    let weighted = 0;
    let men = 0;
    for (const u of state.units) {
      if (u.side !== side || !u.onField) continue;
      weighted += u.morale * u.strength;
      men += u.strength;
    }
    army.armyMorale = men > 0 ? idiv(weighted, men) : 0;
  }

  if (state.tick % K.tide.readEveryTicks === 0) {
    // Ground gained, recorded once a second, so the Tide has something to read.
    for (const side of [0, 1] as Side[]) {
      let gained = 0;
      for (const u of state.units) {
        if (u.side !== side || !u.onField) continue;
        gained += u.advanceAlongFacingMm;
        u.advanceAlongFacingMm = 0;
      }
      const twentyMetres = idiv(gained, 20000);
      if (twentyMetres > 0) {
        emit(state, log, "ground_gained", { side, tideCount: twentyMetres, metres: idiv(gained, 1000) });
      }
    }
    state.tideWindowStart = advanceTideWindow(state.events, state.tick, state.tideWindowStart);
    for (const side of [0, 1] as Side[]) {
      const army = state.armies[side];
      army.tide = readTide(state.events, state.tick, side, state.tideWindowStart);
      emit(state, log, "tide", { side, tide: army.tide });
      emit(state, log, "army_morale", { side, morale: army.armyMorale, strength: onFieldStrength(state, side) });
    }
  }

  if (state.tick % K.treachery.checkEveryTicks === 0) treachery(state, log);
  for (const side of [0, 1] as Side[]) breakCheck(state, log, side);
}

function onFieldStrength(state: BattleState, side: Side): number {
  let n = 0;
  for (const u of state.units) if (u.side === side && u.onField) n += u.strength;
  return n;
}

function treachery(state: BattleState, log: LogWriter): void {
  for (const c of state.contingents) {
    if (c.withdrawn || c.treachery < K.treachery.actsAboveTreachery) continue;
    if (state.armies[c.side].tide > K.treachery.requiresTideAtOrBelow) continue;
    const captain = state.captains.find((x) => x.id === c.captainId);
    if (!captain || !captain.alive) continue;
    const banner = state.units[captain.bannerUnitIdx];
    if (!banner || !banner.onField) continue;
    const chance = (c.treachery - 30) * K.treachery.permillePerPointOver30;
    if (rollPermilleValue(banner.rng) >= chance) continue;

    const defects = c.treachery >= K.treachery.defectsAboveTreachery;
    c.withdrawn = true;
    if (defects) {
      const to = (c.side === 0 ? 1 : 0) as Side;
      c.side = to;
      for (const i of c.unitIdxs) {
        const u = state.units[i] as Unit;
        u.side = to;
        u.defected = true;
        u.engagements = [];
      }
      captain.side = to;
      c.withdrawn = false;
      emit(state, log, "treachery", {
        side: to,
        contingent: c.id,
        defected: true,
        herald: heraldTreachery(c.name, captain.name, true),
      });
      deed(state, log, "turned-cloak", captain.id, null, `${c.name} changed sides in the middle of the day.`);
    } else {
      for (const i of c.unitIdxs) {
        const u = state.units[i] as Unit;
        if (!u.onField) continue;
        u.onField = false;
        u.deserted += u.strength;
        u.strength = 0;
      }
      emit(state, log, "treachery", {
        side: c.side,
        contingent: c.id,
        defected: false,
        herald: heraldTreachery(c.name, captain.name, false),
      });
      deed(state, log, "left-the-field", captain.id, null, `${c.name} walked off the field while it was still being fought.`);
    }
  }
}

function breakCheck(state: BattleState, log: LogWriter, side: Side): void {
  const army = state.armies[side];
  if (army.broken) return;

  let gone = 0;
  for (const u of state.units) {
    if (u.side !== side) continue;
    if (u.moraleState === "ROUTING" || u.moraleState === "FLED" || u.moraleState === "DESTROYED" || !u.onField) {
      gone += u.musterStrength;
    }
  }
  const byStrength = army.startingStrength > 0 && idiv(gone * 1000, army.startingStrength) >= K.army.breakRoutedFractionPermille;

  if (army.armyMorale < K.army.breakArmyMoraleThreshold) {
    if (army.lowMoraleSince < 0) army.lowMoraleSince = state.tick;
  } else {
    army.lowMoraleSince = -1;
  }
  const byMorale = army.lowMoraleSince >= 0 && state.tick - army.lowMoraleSince >= K.army.breakArmyMoraleTicks;
  const byBanner = !army.bannerAlive && army.armyMorale < K.army.breakOnBannerLostMoraleUnder;

  let anyCaptain = false;
  for (const c of state.contingents) {
    if (c.side !== side) continue;
    const cap = state.captains.find((x) => x.id === c.captainId);
    if (!cap || !cap.alive || cap.captured) continue;
    const units = c.unitIdxs.map((i) => state.units[i] as Unit).filter((u) => u.onField);
    if (units.some((u) => u.moraleState !== "ROUTING" && u.moraleState !== "FLED")) anyCaptain = true;
  }
  const byCaptains = !anyCaptain;

  if (!byStrength && !byMorale && !byBanner && !byCaptains) return;

  army.broken = true;
  army.brokeAtTick = state.tick;
  for (const u of state.units) {
    if (u.side !== side || !u.onField) continue;
    u.morale = clamp(u.morale + K.army.onBreakMoraleHit, u.moraleFloor, u.moraleCeiling);
  }
  emit(state, log, "army_break", {
    side,
    reason: byStrength ? "STRENGTH" : byMorale ? "WILL" : byBanner ? "BANNER" : "CAPTAINS",
    herald: heraldArmyBreak(army.name),
  });
  state.phase = "PURSUIT";
  state.pursuitTicksLeft = K.pursuit.phaseTicksMin + rnd(state.rngGlobal, K.pursuit.phaseTicksMax - K.pursuit.phaseTicksMin + 1);
  emit(state, log, "pursuit_begin", {
    side: side === 0 ? 1 : 0,
    ticks: state.pursuitTicksLeft,
    herald: "The line is gone, and the killing starts — which is where most of a battle's dead actually die.",
  });
  for (const c of state.contingents) {
    if (c.side === side) continue;
    if (c.pursuitPolicy === "REIN_IN") continue;
    for (const i of c.unitIdxs) {
      const u = state.units[i] as Unit;
      if (u.onField) u.pursuing = true;
    }
  }
}

// ── PHASE 12 — VICTORY ──────────────────────────────────────────────────────

export function phaseVictory(state: BattleState, log: LogWriter): void {
  if (state.phase === "PURSUIT") {
    state.pursuitTicksLeft--;
    if (state.pursuitTicksLeft <= 0) {
      end(state, log, "the chase blew itself out");
      return;
    }
  }

  let anyContact = false;
  for (const u of state.units) if (u.onField && u.engagements.length > 0) anyContact = true;
  if (anyContact) state.noContactTicks = 0;
  else state.noContactTicks++;

  const retreated = state.armies.some((a) => a.retreatSounded);
  if (retreated && state.noContactTicks >= K.army.retreatNoContactEndTicks) {
    end(state, log, "one side broke contact and went home");
    return;
  }

  const aLeft = state.units.some((u) => u.side === 0 && u.onField && u.moraleState !== "ROUTING" && u.moraleState !== "FLED");
  const bLeft = state.units.some((u) => u.side === 1 && u.onField && u.moraleState !== "ROUTING" && u.moraleState !== "FLED");
  if (!aLeft || !bLeft) {
    if (state.phase !== "PURSUIT") {
      end(state, log, !aLeft && !bLeft ? "both lines came apart at once" : "one side had nobody left standing");
      return;
    }
  }

  if (state.tick >= MAX_TICKS) end(state, log, "the light went and nobody had won");
}

function end(state: BattleState, log: LogWriter, reason: string): void {
  if (state.phase === "ENDED") return;
  state.phase = "ENDED";
  state.endedReason = reason;
  emit(state, log, "battle_end", {
    side: 0,
    tick: state.tick,
    reason,
    herald: `And so the day ended: ${reason}.`,
  });
}

// ── PHASE 13 — THE LOG ──────────────────────────────────────────────────────

export function phaseLog(state: BattleState, log: LogWriter): void {
  if (!log.enabled) return;

  // The delta: where everything is, every tick, and nothing else.
  const d: number[] = [];
  for (const u of state.units) {
    if (!u.onField) continue;
    d.push(u.idx, u.posX, u.posY, u.facing, u.strength);
  }
  write(log, { t: state.tick, k: "d", u: d });

  // The keyframe: everything a renderer would need to draw the field cold.
  if (state.tick % 10 === 0) {
    const key = state.units
      .filter((u) => u.onField)
      .map((u) => ({
        i: u.idx,
        x: u.posX,
        y: u.posY,
        f: u.facing,
        s: u.strength,
        files: u.files,
        ranks: u.ranks,
        sp: u.spacing,
        fm: u.formationId,
        po: u.posture,
        mo: u.morale,
        co: u.cohesion,
        fa: u.fatigue,
        st: u.moraleState,
        rs: u.renderSeed,
      }));
    write(log, { t: state.tick, k: "key", units: key, phase: state.phase });
  }
}

/** The worst excursions in each side's will, named — generated, never written.
 *  "You lost the battle at 4:12, when the knights took the spears of Millrow in
 *  the rear and the left folded in eleven seconds." */
export function emitTurningPoints(state: BattleState, log: LogWriter): void {
  for (const side of [0, 1] as Side[]) {
    const samples: { t: number; v: number }[] = [];
    for (const e of state.events) {
      if (e.k !== "army_morale" || e["side"] !== side) continue;
      samples.push({ t: e.t, v: e["morale"] as number });
    }
    const drops: { t: number; drop: number }[] = [];
    for (let i = 1; i < samples.length; i++) {
      const prev = samples[i - 1] as { t: number; v: number };
      const now = samples[i] as { t: number; v: number };
      if (now.v < prev.v) drops.push({ t: now.t, drop: prev.v - now.v });
    }
    drops.sort((p, q) => q.drop - p.drop || p.t - q.t);
    // Three to six MOMENTS, not three to six ticks of the same moment: a
    // collapse spans several samples and the reader wants the collapse once.
    const chosen: { t: number; drop: number }[] = [];
    for (const d of drops) {
      if (chosen.some((c) => (c.t > d.t ? c.t - d.t : d.t - c.t) < 400)) continue;
      chosen.push(d);
      if (chosen.length >= 5) break;
    }
    for (const drop of chosen) {
      // Whose morale fell hardest at that moment, and which term did it.
      let worstUnit = "";
      let worstTerm = "";
      let worstValue = 0;
      for (const e of state.events) {
        if (e.k !== "morale" || e["side"] !== side) continue;
        if (e.t < drop.t - K.tide.readEveryTicks || e.t > drop.t) continue;
        const why = (e["why"] ?? []) as { term: string; value: number }[];
        for (const w of why) {
          if (w.value < worstValue) {
            worstValue = w.value;
            worstTerm = w.term;
            worstUnit = e["unit"] as string;
          }
        }
      }
      if (worstUnit === "") continue;
      const named = state.units.find((u) => u.id === worstUnit);
      const worstName = named ? named.name : worstUnit;
      const thousandths = maxi(1, idiv(drop.drop, 1000));
      const seconds = idiv(drop.t, 20);
      const m = idiv(seconds, 60);
      const s = seconds % 60;
      emit(state, log, "turning_point", {
        side,
        tick: drop.t,
        unit: worstUnit,
        term: worstTerm,
        drop: drop.drop,
        herald: `At ${m}:${s < 10 ? "0" : ""}${s} the day turned — ${worstName} gave way under "${worstTerm}", and ${thousandths} ${thousandths === 1 ? "thousandth" : "thousandths"} of the army's whole will went with them.`,
      });
    }
  }
}

/** Anything that left the field this tick may have taken a banner or a lord
 *  with it; kept here so phase 11 and phase 12 share one door. */
export function sweepLosses(state: BattleState, log: LogWriter): void {
  for (const u of state.units) {
    if (u.onField || u.moraleState === "DESTROYED") continue;
    if (u.strength > 0) continue;
    onUnitLost(state, log, u);
  }
}
