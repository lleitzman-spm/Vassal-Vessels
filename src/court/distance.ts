// WHY THIS FILE EXISTS. Distance in this game is arithmetic, never a pathfind:
// every holding's record carries the leagues to every mustering place, so the
// question "when can he be there?" has one answer that everybody computes the
// same way. A letter rides at twenty-five leagues a day, men gather for three to
// ten days depending on what kind of place they are from, and then foot makes
// eight leagues a day and horse twelve, slower on a track, slower still on a
// path, and slower again in the wrong season.
//
// The march is not free: it arrives as FATIGUE, in the Host, before a blow is
// struck. That is the court's fault and the contract says so out loud.

import type { Leagues, Stamp } from '../core/primitives.js';
import { COURT, HOLDING_TYPES, SEASONS, UNIT_TYPES } from './codex.js';
import { holderOfHolding } from './grievances.js';
import type { Chronicle, HoldingRecord } from './records.js';
import type { Journey } from './types.js';

/** The holdings a house holds today, by the grants in force. */
export function holdingsOf(c: Chronicle, houseId: string, at: Stamp): HoldingRecord[] {
  return c.founding.holdings.filter((h) => holderOfHolding(c, h.id, at) === houseId);
}

export function leaguesFrom(h: HoldingRecord, placeId: string): Leagues {
  return h.leaguesTo[placeId] ?? Number.POSITIVE_INFINITY;
}

/** The nearest of a house's holdings to a place. A house is "near" a war if any
 *  part of it is. */
export function nearestLeagues(
  c: Chronicle,
  houseId: string,
  placeId: string,
  at: Stamp,
): Leagues {
  const all = holdingsOf(c, houseId, at).map((h) => leaguesFrom(h, placeId));
  return all.length === 0 ? Number.POSITIVE_INFINITY : Math.min(...all);
}

export function roadFactor(road: HoldingRecord['road']): number {
  if (road === 'highway') return COURT.march.roadFactorHighway;
  if (road === 'track') return COURT.march.roadFactorTrack;
  return COURT.march.roadFactorPath;
}

export function gatherDaysFor(holding: HoldingRecord): number {
  const row = HOLDING_TYPES[holding.typeId];
  const days = row?.gatherDays ?? COURT.march.gatherDaysMin;
  return Math.min(Math.max(days, COURT.march.gatherDaysMin), COURT.march.gatherDaysMax);
}

/** How long from the sealing of the letter to men standing at the mustering
 *  place, and what the road did to them on the way.
 *
 *  `courierBonus` is the Chancellor's: his clerks know the roads and the letter
 *  goes faster. `fatigueRelief` is the Constable's. Both arrive as plain
 *  multipliers so the caller can show the seat's name beside the number. */
export function journey(
  c: Chronicle,
  holding: HoldingRecord,
  placeId: string,
  unitTypeId: string,
  at: Stamp,
  opts: { courierBonus?: number; fatigueRelief?: number; forced?: boolean } = {},
): Journey {
  void c;
  const leagues = leaguesFrom(holding, placeId);
  if (!Number.isFinite(leagues)) {
    return { letterDays: 0, gatherDays: 0, marchDays: 0, totalDays: 0, leagues: 0, fatigue: 0 };
  }

  const season = SEASONS[at.season];
  const unit = UNIT_TYPES[unitTypeId];
  const mounted = unit?.kind === 'horse';

  const courierRate = COURT.march.courierLeaguesPerDay * (1 + (opts.courierBonus ?? 0));
  const letterDays = Math.ceil(leagues / courierRate);
  const gatherDays = gatherDaysFor(holding);

  const perDayBase = mounted ? COURT.march.leaguesPerDayHorse : COURT.march.leaguesPerDayFoot;
  const forced = opts.forced ? COURT.march.forcedMarchSpeed : 1;
  const perDay = perDayBase * roadFactor(holding.road) * season.speed * forced;
  const marchDays = Math.ceil(leagues / perDay);

  const wearPerDay = (unit?.dailyWear ?? COURT.wear.dailyWearFoot) * season.wear;
  const forcedWear = opts.forced ? COURT.march.forcedMarchFatiguePerDay : 0;
  const raw = marchDays * (wearPerDay + forcedWear);
  const fatigue = Math.max(0, Math.round(raw * (1 - (opts.fatigueRelief ?? 0))));

  return {
    letterDays,
    gatherDays,
    marchDays,
    totalDays: letterDays + gatherDays + marchDays,
    leagues,
    fatigue: Math.min(100, fatigue),
  };
}
