// THE AFTERMATH — what the battle hands back, and the hinge of the whole game.
//
// The field writes the next season's politics (law 9). Every number below
// becomes a record in the chronicle: the dead leave a holding's roll, an unfair
// loss becomes a blood-debt, a distinguished captain starts a reward clock, a
// captured one starts a ransom clock, and a defection puts a house at war with
// you. The loop has no outside.
//
// THE ONE HARD PROMISE. For every unit, dead + wounded + captured + deserted +
// survived equals the strength it mustered with, EXACTLY. The court asserts it
// and treats a mismatch as a contract violation, logged loudly and never
// silently reconciled — so the engine guarantees it here rather than hoping.
// Everything else in this file is judgement; that line is arithmetic.

import type { Aftermath, CaptainFate, ContingentFate, Deed, Host, UnitFate } from "../core/contract.js";
import { CONTRACT } from "../core/primitives.js";
import { clamp, idiv, maxi, mini } from "../core/primitives.js";
import { HONOURED_QUIRK_IDS } from "./herald.js";
import { K, PLANNED_TICKS } from "./rules.js";
import type { BattleState, Side, Unit } from "./types.js";

function fraction(numerator: number, denominator: number): number {
  // The contract speaks in 0..1 fractions. This is the boundary where the
  // battle's whole numbers become the court's, and the only place a fraction is
  // ever produced.
  if (denominator <= 0) return 0;
  return Math.min(1, Math.max(0, numerator / denominator)); // integer-law: contract boundary
}

/** Who was left standing on the ground. This, not the outcome word, decides who
 *  takes the wounded, the baggage and the captives. */
function heldTheField(state: BattleState, side: Side): boolean {
  const mine = state.units.some(
    (u) => u.side === side && u.onField && u.moraleState !== "ROUTING" && u.moraleState !== "FLED",
  );
  const theirs = state.units.some(
    (u) => u.side !== side && u.onField && u.moraleState !== "ROUTING" && u.moraleState !== "FLED",
  );
  if (mine && !theirs) return true;
  if (!mine) return false;
  // Both still there: the side that did not break holds it.
  const myArmy = state.armies[side];
  const other = state.armies[side === 0 ? 1 : 0];
  if (other.broken && !myArmy.broken) return true;
  return false;
}

function outcomeFor(state: BattleState, side: Side, held: boolean, lossShare: number): Aftermath["outcome"] {
  const mine = state.armies[side];
  const other = state.armies[side === 0 ? 1 : 0];
  if (mine.broken && !other.broken) return lossShare >= 500 ? "rout" : "defeat";
  if (other.broken && !mine.broken) return lossShare >= 350 ? "costly-victory" : "victory";
  if (held && !other.broken) return "draw";
  return "draw";
}

export function buildAftermath(state: BattleState, side: Side, host: Host, battleId: string): Aftermath {
  const army = state.armies[side];
  const physicians = army.physicians;
  const woundedPermille =
    K.aftermath.woundedPermilleOfCasualtiesBase + physicians * K.aftermath.woundedPermillePerPhysician;

  const units: UnitFate[] = [];
  let mustered = 0;
  let lost = 0;

  for (const u of state.units) {
    // A defector is reported to the host he MUSTERED with, not the one he ended
    // the day fighting for — otherwise the treachery would vanish from the
    // record of the man it happened to.
    const home = hostOf(state, u, host);
    if (!home) continue;

    // The five numbers. Deaths first, then the physicians take their share of
    // them back as wounded, and whatever is left over survived.
    const rawCasualties = u.dead;
    const wounded = idiv(rawCasualties * woundedPermille, 1000);
    const dead = rawCasualties - wounded;
    const captured = u.captured;
    const deserted = u.deserted;
    const survived = u.musterStrength - dead - wounded - captured - deserted;

    mustered += u.musterStrength;
    lost += dead + wounded + captured + deserted;

    const present = u.arrivalTick === 0 || u.onField || u.totalContactTicks > 0;
    const fate: UnitFate = {
      unitId: u.id,
      present,
      dead,
      wounded,
      captured,
      deserted,
      // Never negative, never short: the five MUST sum to the muster.
      survived: maxi(0, survived),
      brokeAt: u.brokeAtTick === null ? null : fraction(u.brokeAtTick, maxi(1, state.tick)),
      defected: u.defected,
      ordersGiven: u.ordersGiven,
      ordersObeyed: u.ordersObeyed,
      veterancyGained: mini(
        K.aftermath.veterancyGainCap,
        idiv(mini(u.totalContactTicks, 4000), K.aftermath.veterancyPerContactTicks),
      ),
    };
    if (u.totalContactTicks === 0) fate.didNotEngage = true;
    // The promise, enforced rather than hoped for. If rounding the wounded off
    // the dead ever moved a man, he goes back into the survivors.
    const sum = fate.dead + fate.wounded + fate.captured + fate.deserted + fate.survived;
    if (sum !== u.musterStrength) fate.survived += u.musterStrength - sum;
    units.push(fate);
  }

  const lossSharePermille = mustered > 0 ? idiv(lost * 1000, mustered) : 0;
  const held = heldTheField(state, side);

  const contingents: ContingentFate[] = [];
  for (const c of state.contingents) {
    const home = host.contingents.find((x) => x.id === c.id);
    if (!home) continue;
    let cMustered = 0;
    let cLost = 0;
    let greed = 0;
    const captain = state.captains.find((x) => x.id === c.captainId);
    if (captain) greed = captain.greed;
    for (const i of c.unitIdxs) {
      const u = state.units[i] as Unit;
      cMustered += u.musterStrength;
      cLost += u.dead + u.captured + u.deserted;
    }
    const pursued = c.unitIdxs.some((i) => (state.units[i] as Unit).bloodlust > 0);
    contingents.push({
      contingentId: c.id,
      lossShare: fraction(cLost, maxi(1, cMustered)),
      defected: c.unitIdxs.some((i) => (state.units[i] as Unit).defected),
      // What greed took before anything was shared out.
      plunderSeized: pursued && held ? idiv(greed * cMustered, 20) : 0,
    });
  }

  const captains: CaptainFate[] = [];
  for (const cap of state.captains) {
    if (!host.captains.some((x) => x.id === cap.id)) continue;
    const c = state.contingents.find((x) => x.id === cap.contingentId);
    const own = c ? c.unitIdxs.map((i) => state.units[i] as Unit) : [];
    let menLost = 0;
    for (const u of own) menLost += u.dead + u.captured + u.deserted;
    // "Did not engage" must mean he was not in the battle — not merely that
    // nobody reached his men with a spear. A contingent that lost eighty men to
    // arrows was in the battle, and the court would be told a lie by any other
    // reading.
    const engaged = own.some((u) => u.totalContactTicks > 0 || u.dead > 0 || u.captured > 0 || u.lastKillsDealt > 0);
    const routed = own.some((u) => u.brokeAtTick !== null);
    const defected = own.some((u) => u.defected);
    const deeds = state.deeds.filter((d) => d.captainId === cap.id);
    const distinguished = deeds.some((d) =>
      d.kind === "held-the-line" || d.kind === "broke-the-enemy" || d.kind === "slew-captain" || d.kind === "took-banner",
    );
    const faltered = deeds.some((d) => d.kind === "defied" || d.kind === "abandoned" || d.kind === "sounded-own-withdrawal");

    // A man who died with his own men around him did not flee, whatever his
    // contingent did afterwards. `fled` is for a captain who was there to run.
    const fled = cap.alive && !cap.captured && routed && own.every((u) => u.brokeAtTick !== null);
    const conduct: CaptainFate["conduct"] = defected
      ? "defected"
      : !engaged
        ? "did-not-engage"
        : fled
          ? "fled"
          : distinguished
            ? "distinguished"
            : faltered
              ? "faltered"
              : "steady";

    captains.push({
      captainId: cap.id,
      fate: cap.captured ? "captured" : !cap.alive ? "slain" : cap.wounded ? "wounded" : "unhurt",
      conduct,
      ordersGiven: own.reduce((a, u) => a + u.ordersGiven, 0),
      ordersObeyed: own.reduce((a, u) => a + u.ordersObeyed, 0),
      menLost,
      deedIds: deeds.map((d) => d.id),
    });
  }

  const deeds: Deed[] = state.deeds
    .filter((d) => {
      if (d.captainId) return host.captains.some((x) => x.id === d.captainId);
      if (d.unitId) return host.units.some((x) => x.id === d.unitId);
      return false;
    })
    .map((d) => {
      const out: Deed = {
        id: d.id,
        kind: d.kind,
        atFraction: fraction(d.tick, maxi(1, state.tick)),
        tale: d.tale,
      };
      if (d.captainId) out.captainId = d.captainId;
      if (d.unitId) out.unitId = d.unitId;
      return out;
    });

  const captives = state.captives
    .filter((c) => c.side !== side)
    .map((c) => {
      const cap = state.captains.find((x) => x.id === c.captainId);
      const enemyHost = state.armies[side === 0 ? 1 : 0].host;
      const hostCap = enemyHost.captains.find((x) => x.id === c.captainId);
      const out = {
        captainId: c.captainId,
        name: cap ? cap.name : c.captainId,
        ransom: (cap ? cap.standing : 0) * K.aftermath.ransomCrownsPerStandingPoint,
      } as { captainId: string; name: string; houseId?: string; ransom: number };
      if (hostCap && hostCap.houseId !== undefined) out.houseId = hostCap.houseId;
      return out;
    });
  const ourPeopleTaken = state.captives
    .filter((c) => c.side === side)
    .map((c) => {
      const cap = state.captains.find((x) => x.id === c.captainId);
      const out = {
        captainId: c.captainId,
        name: cap ? cap.name : c.captainId,
        ransom: (cap ? cap.standing : 0) * K.aftermath.ransomCrownsPerStandingPoint,
      } as { captainId: string; name: string; houseId?: string; ransom: number };
      const hostCap = host.captains.find((x) => x.id === c.captainId);
      if (hostCap && hostCap.houseId !== undefined) out.houseId = hostCap.houseId;
      return out;
    });

  const enemyBannerTaken = !state.armies[side === 0 ? 1 : 0].bannerAlive;
  const seconds = idiv(state.tick, K.time.tickHz);

  return {
    contract: CONTRACT,
    hostId: host.id,
    battleId,
    at: host.mustered,
    outcome: outcomeFor(state, side, held, lossSharePermille),
    heldTheField: held,
    hours: idiv(seconds, 3600),
    units,
    captains,
    contingents,
    spoils: {
      plunder: held ? idiv(army.plunder + state.armies[side === 0 ? 1 : 0].baggageCarts * 40, 1) : 0,
      banners: enemyBannerTaken
        ? [{ name: `the banner of ${state.armies[side === 0 ? 1 : 0].name}`, takenByCaptainId: null }]
        : [],
      captives,
      ourPeopleTaken,
      baggageLost: !held && state.armies[side].broken,
    },
    ground: {
      holdingIdsHeld: held ? host.occasion.homeHoldingIds : [],
      holdingIdsLost: held ? [] : host.occasion.homeHoldingIds,
      ravaged: [],
      advanceStopped: held,
    },
    deeds,
    // This engine names no fault. The court computes its own blame and glory
    // from conduct and casualties; the contract permits either.
    blame: null,
    glory: null,
    quirksHonoured: HONOURED_QUIRK_IDS,
    notes: [
      `The fighting ran ${seconds} seconds — ${state.tick} ticks — and ended because ${state.endedReason}.`,
      `Order capacity ${host.command.orderCapacity} meant ${army.couriersTotal} riders and ${army.planSlots} standing plans.`,
    ],
  };
}

function hostOf(state: BattleState, u: Unit, host: Host): boolean {
  void state;
  return host.units.some((x) => x.id === u.id);
}

/** The named moments a battle earns at its end rather than during it. */
export function closingDeeds(state: BattleState): void {
  for (const u of state.units) {
    if (u.totalContactTicks >= 3600) {
      state.deeds.push({
        id: `deed-${state.deeds.length + 1}`,
        kind: "held-the-line",
        captainId: state.contingents.find((c) => c.id === u.contingentId)?.captainId ?? null,
        unitId: u.id,
        tick: state.tick,
        tale: `${u.name} held their ground for ${idiv(u.totalContactTicks, K.time.tickHz)} seconds without giving way.`,
      });
    }
    if (u.brokeAtTick !== null && u.moraleState === "FLED") {
      state.deeds.push({
        id: `deed-${state.deeds.length + 1}`,
        kind: "fled-the-field",
        captainId: state.contingents.find((c) => c.id === u.contingentId)?.captainId ?? null,
        unitId: u.id,
        tick: u.brokeAtTick,
        tale: `${u.name} broke twice and left the field for good.`,
      });
    }
  }
  for (const side of [0, 1] as Side[]) {
    const other = state.armies[side === 0 ? 1 : 0];
    if (!other.broken) continue;
    for (const c of state.contingents) {
      if (c.side !== side) continue;
      const worked = c.unitIdxs.some((i) => (state.units[i] as Unit).totalContactTicks > 600);
      if (!worked) continue;
      state.deeds.push({
        id: `deed-${state.deeds.length + 1}`,
        kind: "broke-the-enemy",
        captainId: c.captainId,
        unitId: null,
        tick: other.brokeAtTick ?? state.tick,
        tale: `${c.name} were in the fighting when ${other.name} came apart.`,
      });
    }
  }
  void clamp;
  void PLANNED_TICKS;
}
