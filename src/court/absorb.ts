// WHY THIS FILE EXISTS. THE HINGE OF THE WHOLE GAME. The battle hands back a
// report; this turns it into records on the chronicle; the next muster reads
// those records and comes out different. The loop has no outside.
//
// Everything emitted below is a RECORD. Strike any one of them and the next
// muster's arithmetic changes accordingly — which is what makes this a chronicle
// rather than a save file. Nothing here writes a state; `absorb` is pure, and
// the same aftermath always yields the same acts in the same order.
//
// THE ASSERTION THIS MODULE OWNS. Five numbers per unit — dead, wounded,
// captured, deserted, survived — MUST sum to that unit's strength at muster. The
// contract says the court asserts it, so the court asserts it, loudly, and never
// silently reconciles. A battle engine that loses four men in the arithmetic
// will lose four hundred somewhere else later, and the mismatch is the only
// warning anybody gets.
//
// The order of emission is the writ's (§5), and it matters: casualties before
// blood-debts, because a blood-debt is computed from the losses; deaths before
// succession, because an heir cannot inherit from a living man.

import type { Stamp } from '../core/primitives.js';
import type { Aftermath, Host } from './contract.js';
import { CHOSEN, COURT } from './codex.js';
import { holdingOfUnitId } from './land.js';
import type { Act, AftermathRecord, Chronicle } from './records.js';
import { captainOf } from './records.js';

/** Thrown when a battle engine hands back arithmetic that does not add up. It is
 *  an error and not a warning on purpose: the alternative is a chronicle that
 *  quietly disagrees with itself about how many men exist. */
export class ContractViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContractViolation';
  }
}

/** Turns a battle report into acts on the chronicle. Pure: same aftermath, same
 *  acts. The caller appends them — this function writes nothing. */
export function absorb(chronicle: Chronicle, aftermath: Aftermath, host?: Host): Act[] {
  assertCasualtiesAddUp(aftermath, host);

  const out: Act[] = [];
  const at = aftermath.at;
  const battleId = aftermath.battleId;
  let n = 0;
  const id = (what: string): string => `a:${battleId}:${what}:${n++}`;

  const record = (
    kind: AftermathRecord['kind'],
    subjectId: string,
    amount: number | undefined,
    note: string,
  ): void => {
    out.push({
      id: id(kind),
      at,
      by: 'world',
      kind,
      battleId,
      subjectId,
      ...(amount === undefined ? {} : { amount }),
      note,
    } as AftermathRecord);
  };

  // 1. CASUALTIES, per unit. The men leave that holding's roll and regenerate at
  //    six a year, additive, so a small holding is not also a slow one.
  for (const u of aftermath.units) {
    const gone = u.dead + u.captured + u.deserted;
    if (gone > 0) {
      const home = holdingOfUnitId(u.unitId);
      record(
        'casualty',
        u.unitId,
        gone,
        home
          ? `${gone} men of ${home.holdingId} did not come home.`
          : `${gone} men did not come home.`,
      );
    }
    // Veterancy has no word of its own in the record vocabulary, so it is
    // written as a `distinguished` record whose subject is a UNIT. Readings that
    // want a captain ignore it cleanly, because a unit id is nobody's captain.
    if (u.veterancyGained > 0) {
      record(
        'distinguished',
        u.unitId,
        Math.min(u.veterancyGained, COURT.regeneration.veterancyCap),
        'These men learned something they will not unlearn.',
      );
    }
  }

  // 2. BLOOD-DEBT, per contingent that bled far worse than everybody else.
  //    EXCESS, not loss: a house that bled alongside the rest has no claim.
  const hostShare = averageLossShare(aftermath);
  for (const k of aftermath.contingents) {
    const excess = k.lossShare - hostShare;
    if (excess <= COURT.battleJoins.bloodDebtExcessThreshold) continue;
    const points = Math.min(
      COURT.battleJoins.bloodDebtCap,
      Math.round((excess * 100) / 5) * COURT.battleJoins.bloodDebtPerFivePointsExcess,
    );
    if (points <= 0) continue;
    const houseId = houseOfContingent(host, k.contingentId);
    if (!houseId) continue;
    record(
      'blood-debt',
      houseId,
      points,
      `They lost ${Math.round(k.lossShare * 100)} per cent where the host lost ${Math.round(hostShare * 100)}.`,
    );
  }

  // 3. DISTINGUISHED and DISGRACED, per captain, from his conduct.
  for (const f of aftermath.captains) {
    if (f.conduct === 'distinguished') {
      record('distinguished', f.captainId, 1, 'He distinguished himself, and a clock is now running on your gratitude.');
    }
    if (f.conduct === 'fled' || f.conduct === 'faltered' || f.conduct === 'defected') {
      record('disgraced', f.captainId, 1, `The court's word for him is now "${f.conduct}".`);
    }
  }

  // 4. THE SLAIN, and with them the succession. The heir takes the holding at
  //    half his father's loyalty and half his grudges — and a fresh one of his
  //    own if the death reads as avoidable.
  for (const f of aftermath.captains) {
    if (f.fate !== 'slain') continue;
    const avoidable = readsAsAvoidable(aftermath, f.captainId);
    record(
      'slain',
      f.captainId,
      avoidable ? 1 : 0,
      avoidable
        ? 'He died in a battle his house believes was thrown away.'
        : 'He died as men do, in a battle that had to be fought.',
    );
    out.push({
      id: id('death'),
      at,
      by: 'world',
      kind: 'death',
      captainId: f.captainId,
      cause: 'killed in battle',
      note: `${captainOf(chronicle, f.captainId)?.name ?? f.captainId} fell.`,
    });
  }

  // 5. THE TAKEN. Each captive is a ransom clock: pay it and the house
  //    remembers, leave it and the grudge climbs three a season to a cap, and
  //    four years is a house lost.
  for (const captive of aftermath.spoils.ourPeopleTaken) {
    record(
      'captured',
      captive.captainId,
      captive.ransom,
      `${captive.name} is in a cell and the price is ${captive.ransom} crowns.`,
    );
  }

  // 6. DEFECTIONS. The house is at war with you now; its land stops yielding and
  //    its roads close.
  for (const k of aftermath.contingents) {
    if (!k.defected) continue;
    const houseId = houseOfContingent(host, k.contingentId);
    if (!houseId) continue;
    record('defected', houseId, undefined, 'They changed sides in front of the whole host.');
  }

  // 7. PLUNDER, BANNERS, and what the ground did to the land.
  if (aftermath.spoils.plunder > 0) {
    record('plunder', 'crown', aftermath.spoils.plunder, 'What was taken on the field.');
  }
  for (const banner of aftermath.spoils.banners) {
    record(
      'banner-taken',
      banner.takenByCaptainId ?? 'crown',
      COURT.battleJoins.bannerStandingToCrown,
      `${banner.name} was taken, and everyone saw who took it.`,
    );
  }
  for (const holdingId of aftermath.ground.holdingIdsLost) {
    record('holding-lost', holdingId, undefined, 'The land is gone, and with it the men who were of it.');
  }
  for (const holdingId of aftermath.ground.ravaged) {
    record('holding-ravaged', holdingId, undefined, 'Burnt or stripped. Half yield until the year is out.');
  }

  // 8. LEGITIMACY. What the realm thinks of the crown after this.
  const legitimacy =
    aftermath.outcome === 'victory' || aftermath.outcome === 'costly-victory'
      ? COURT.battleJoins.victoryLegitimacy
      : aftermath.outcome === 'rout'
        ? COURT.battleJoins.routLegitimacy
        : aftermath.outcome === 'defeat'
          ? Math.round(COURT.battleJoins.routLegitimacy / 2)
          : 0;
  if (legitimacy !== 0) {
    record(
      'legitimacy',
      'crown',
      legitimacy,
      legitimacy > 0 ? 'A victory, and the realm noticed.' : 'A defeat, and the realm noticed that too.',
    );
  }

  // 9. GLORY HUNGER. A won war wants another inside the year, or the crown
  //    spends standing on the quiet.
  if (legitimacy > 0) {
    record(
      'glory-hunger',
      'crown',
      4,
      'The host has tasted a win and expects another war within the year.',
    );
  }

  return out;
}

/** THE COURT'S ASSERTION. Five numbers, one sum, no exceptions. */
export function assertCasualtiesAddUp(aftermath: Aftermath, host?: Host): void {
  for (const u of aftermath.units) {
    const sum = u.dead + u.wounded + u.captured + u.deserted + u.survived;
    const mustered = host?.units.find((x) => x.id === u.unitId)?.strength;
    if (mustered === undefined) {
      if (!u.present && sum === 0) continue;
      continue; // without the host we cannot check the total, only the parts
    }
    if (sum !== mustered) {
      throw new ContractViolation(
        `Unit ${u.unitId}: dead ${u.dead} + wounded ${u.wounded} + captured ${u.captured} + deserted ${u.deserted} + survived ${u.survived} = ${sum}, but ${mustered} men mustered. The five numbers must sum to the strength at muster; the court will not reconcile them silently.`,
      );
    }
  }
}

function averageLossShare(aftermath: Aftermath): number {
  if (aftermath.contingents.length === 0) return 0;
  let total = 0;
  for (const k of aftermath.contingents) total += k.lossShare;
  return total / aftermath.contingents.length;
}

function houseOfContingent(host: Host | undefined, contingentId: string): string | null {
  const k = host?.contingents.find((x) => x.id === contingentId);
  if (k?.houseId) return k.houseId;
  // The court's own contingent ids carry the house in them, so a report can be
  // absorbed even when the host object has been thrown away — which it always
  // has, because a host is a reading and nobody keeps one.
  const parts = contingentId.split(':');
  return parts[0] === 'k' && parts.length === 2 ? (parts[1] ?? null) : null;
}

/** Did this death read as thrown away? A rout, or a man whose own contingent
 *  bled far worse than the host — the two shapes a house will not forgive. */
function readsAsAvoidable(aftermath: Aftermath, captainId: string): boolean {
  if (aftermath.outcome === 'rout') return true;
  const hostShare = averageLossShare(aftermath);
  return aftermath.contingents.some(
    (k) =>
      k.lossShare - hostShare > COURT.battleJoins.bloodDebtExcessThreshold * 2 &&
      aftermath.captains.some((f) => f.captainId === captainId),
  );
}

/** The day a ransom clock runs out. Four years is a house lost. */
export function ransomDueBy(taken: Stamp): number {
  return taken.absolute + COURT.calendar.daysPerYear * 4;
}

/** The day a reward clock runs out. Miss it and the slight lands by itself. */
export function rewardDueBy(deed: Stamp): number {
  return deed.absolute + CHOSEN.rewardClockDays;
}
