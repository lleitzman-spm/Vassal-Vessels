// WHY THIS FILE EXISTS. The game is named for this. Every house is a cup holding
// one year of service: a stated number of men, for a stated number of days,
// written into the grant of land itself — so the enfeoffment record IS the
// contract, and there is no separate ledger of obligations anywhere. Summonses
// drink from the cup. The cup refills at the new year, never on a timer.
//
// WHAT BREAKS IF SOMEONE STORES `daysLeft`. Everything. Strike a summons and the
// days it drank must come back; regrant land on better terms and the cup must be
// a different size from that day forward; let three years of scutage go by and
// the cup must shrink because his sons grew up never having marched for you.
// Every one of those is a record changing, and a stored number would survive
// them all and be wrong.

import type { Men, Stamp } from '../core/primitives.js';
import { CHOSEN, COURT } from './codex.js';
import type { Chronicle, Enfeoff, Summon } from './records.js';
import type { Vessel } from './types.js';
import { stampOf } from './calendar.js';

/** The enfeoffments in force for a house on a day: the latest grant for each
 *  holding, and nothing for a holding whose grant has been struck out. */
export function enfeoffmentsOf(c: Chronicle, houseId: string, at: Stamp): Enfeoff[] {
  const latest = new Map<string, Enfeoff>();
  for (const a of c.acts) {
    if (a.kind !== 'enfeoff') continue;
    if (a.at.absolute > at.absolute) continue;
    const held = latest.get(a.holdingId);
    if (!held || a.at.absolute >= held.at.absolute) latest.set(a.holdingId, a);
  }
  const mine: Enfeoff[] = [];
  for (const e of latest.values()) {
    if (e.houseId !== houseId) continue;
    if (attainted(c, houseId, e.holdingId, at)) continue;
    if (lost(c, e.holdingId, at)) continue;
    mine.push(e);
  }
  return mine.sort((a, b) => a.holdingId.localeCompare(b.holdingId));
}

function attainted(c: Chronicle, houseId: string, holdingId: string, at: Stamp): boolean {
  return c.acts.some(
    (a) =>
      a.kind === 'attaint' &&
      a.at.absolute <= at.absolute &&
      a.houseId === houseId &&
      a.holdingIds.includes(holdingId),
  );
}

function lost(c: Chronicle, holdingId: string, at: Stamp): boolean {
  return c.acts.some(
    (a) => a.kind === 'holding-lost' && a.at.absolute <= at.absolute && a.subjectId === holdingId,
  );
}

/** Years in a row the crown has taken coin instead of men. After three, the
 *  obligation itself starts to be forgotten — a tenth a year — because his sons
 *  grew up never having marched for you. */
export function scutageYearsRunning(c: Chronicle, houseId: string, year: number): number {
  let running = 0;
  for (let y = year - 1; y >= 1; y--) {
    const tookCoin = c.acts.some(
      (a) => a.kind === 'accept-scutage' && a.houseId === houseId && a.at.year === y,
    );
    if (!tookCoin) break;
    running += 1;
  }
  return running;
}

/** The men a house owes this year, after the grants in force and after custom
 *  has been allowed to rot. */
export function owedMenOf(c: Chronicle, houseId: string, year: number): Men {
  const at = stampOf(year, 'wolfmoon', COURT.calendar.daysPerSeason);
  let owed = 0;
  for (const e of enfeoffmentsOf(c, houseId, at)) owed += e.owedMen;

  const running = scutageYearsRunning(c, houseId, year);
  const rotting = running - COURT.obligation.customDecayStartsAfterYears;
  if (rotting > 0) {
    owed = owed * Math.pow(1 - COURT.obligation.customDecayPerYearOfScutage, rotting);
  }
  return Math.round(owed);
}

/** Every summons of a year that called this house, oldest first. */
export function summonsesOf(c: Chronicle, houseId: string, year: number): Summon[] {
  return c.acts
    .filter((a): a is Summon => a.kind === 'summon' && a.at.year === year && a.calledIds.includes(houseId))
    .sort((a, b) => a.at.absolute - b.at.absolute);
}

/** How many days a campaign actually kept men in the field. Read from the
 *  records where the records know — a battle was fought, the host marched — and
 *  otherwise the full forty, because a crown that summons a house must plan on
 *  owing it the whole bond. */
function daysDrunkBy(c: Chronicle, s: Summon): number {
  let last = s.standBy.absolute;
  for (const a of c.acts) {
    if (a.at.absolute <= s.standBy.absolute) continue;
    const sameWar =
      (a.kind === 'march' && a.campaignId === s.campaignId) ||
      (a.kind === 'casualty' && a.at.absolute - s.standBy.absolute <= CHOSEN.defaultCampaignDays);
    if (sameWar && a.at.absolute > last) last = a.at.absolute;
  }
  const served = last - s.standBy.absolute;
  return served > 0 ? served : CHOSEN.defaultCampaignDays;
}

/** THE VESSEL. What this house owes this year and how much has been drawn.
 *  `beyond` counts the summonses that found the cup already dry — each one a
 *  named, escalating price, shown before the letter is sent. */
export function readVessel(c: Chronicle, houseId: string, year: number): Vessel {
  return vesselDrunkBefore(c, houseId, year, Number.POSITIVE_INFINITY);
}

/** The same reading, taken as it stood before a given day — which is what a
 *  summons needs, since a letter cannot be answered by a cup it has not yet
 *  drunk from. */
export function vesselDrunkBefore(
  c: Chronicle,
  houseId: string,
  year: number,
  beforeAbsolute: number,
): Vessel {
  const owedMen = owedMenOf(c, houseId, year);
  const enfeoffed = enfeoffmentsOf(c, houseId, stampOf(year, 'wolfmoon', COURT.calendar.daysPerSeason));
  const capacityDays =
    enfeoffed.length === 0
      ? COURT.obligation.serviceDaysPerYear
      : Math.min(...enfeoffed.map((e) => e.owedDays));

  let drawn = 0;
  let beyond = 0;
  for (const s of summonsesOf(c, houseId, year)) {
    if (s.at.absolute >= beforeAbsolute) continue;
    const left = capacityDays - drawn;
    if (left <= 0) {
      beyond += 1;
      continue;
    }
    const wants = daysDrunkBy(c, s);
    if (wants > left) beyond += 1;
    drawn += Math.min(wants, left);
  }

  return {
    houseId,
    owedMen,
    capacityDays,
    drawnDays: drawn,
    daysLeft: Math.max(0, capacityDays - drawn),
    beyond,
  };
}

/** What the next draw past the bond costs in grudge. Six the first time, eight
 *  every time after — the numbers are `data/constants.json →
 *  court.obligation.beyondTheVesselGrievance*`, and the player sees them before
 *  the letter goes. */
export function overCalledGrievance(beyondSoFar: number): number {
  return beyondSoFar <= 0
    ? COURT.obligation.beyondTheVesselGrievanceFirst
    : COURT.obligation.beyondTheVesselGrievanceFurther;
}
