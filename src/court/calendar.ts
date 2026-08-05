// WHY THIS FILE EXISTS. The court is a game of days, so the day has to be one
// thing that everybody counts the same way. Four seasons of ninety days, and one
// number — `absolute` — that arithmetic can compare without knowing a single
// calendar rule.
//
// THE CLOCK IS A READING TOO. There is no end-turn (law 3): the present day is
// simply the latest day any act was written on. Time advances because something
// was DONE. Strike the last act and yesterday is today again, which is exactly
// right and would be impossible if the clock were a stored field.

import type { SeasonId, Stamp } from '../core/primitives.js';
import { COURT, SEASONS, SEASON_ORDER } from './codex.js';
import type { Act, Chronicle } from './records.js';
import type { Calendar } from './types.js';

const { daysPerSeason, daysPerYear } = COURT.calendar;

export function seasonIndex(season: SeasonId): number {
  const i = SEASON_ORDER.indexOf(season);
  return i < 0 ? 0 : i;
}

export function seasonAt(index: number): SeasonId {
  const wrapped = ((index % SEASON_ORDER.length) + SEASON_ORDER.length) % SEASON_ORDER.length;
  return SEASON_ORDER[wrapped] ?? 'seedtime';
}

/** Build a stamp from the words. Year 1, Seedtime, day 1 is absolute zero, so
 *  `absolute` reads as "days since the founding" for any realm founded on the
 *  first day of its first year — which is every realm the founding book can
 *  describe. */
export function stampOf(year: number, season: SeasonId, day: number): Stamp {
  return {
    year,
    season,
    day,
    absolute: (year - 1) * daysPerYear + seasonIndex(season) * daysPerSeason + (day - 1),
  };
}

/** The inverse. Every reading that needs "what day is it in the year" goes
 *  through here rather than doing the division itself. */
export function stampAt(absolute: number): Stamp {
  const year = Math.floor(absolute / daysPerYear) + 1;
  const within = absolute - (year - 1) * daysPerYear;
  const season = seasonAt(Math.floor(within / daysPerSeason));
  const day = (within % daysPerSeason) + 1;
  return { year, season, day, absolute };
}

export function addDays(at: Stamp, days: number): Stamp {
  return stampAt(at.absolute + days);
}

export function daysBetween(from: Stamp, to: Stamp): number {
  return to.absolute - from.absolute;
}

export function yearsBetween(from: Stamp, to: Stamp): number {
  return (to.absolute - from.absolute) / daysPerYear;
}

/** Which year of service a day belongs to. The vessel refills at the new year,
 *  never on a timer, so this is the only question the vessel ever asks the
 *  calendar. */
export function serviceYear(at: Stamp): number {
  return at.year;
}

export function seasonOf(at: Stamp): SeasonId {
  return at.season;
}

export function forageOf(season: SeasonId): number {
  return SEASONS[season].forage;
}

/** The present day: the latest act, or the founding if nothing has been done.
 *  A READING — never stored. */
export function readNow(c: Chronicle): Stamp {
  let latest = c.founding.founding;
  for (const a of c.acts) if (a.at.absolute > latest.absolute) latest = a.at;
  return latest;
}

/** The clock plus every deadline the player is entitled to see. Deadlines are
 *  read off the records that set them: a summons carries its stand-by day, a
 *  distinguished captain carries his reward clock, a captive carries his ransom
 *  clock. None of them is stored anywhere. */
export function readCalendar(c: Chronicle): Calendar {
  const now = readNow(c);
  const deadlines: Calendar['deadlines'] = [];

  for (const a of c.acts) {
    if (a.kind === 'summon') {
      deadlines.push({
        id: `stand-by:${a.id}`,
        at: a.standBy,
        daysLeft: a.standBy.absolute - now.absolute,
        explains: `The host summoned for ${a.campaignId} must stand at ${a.musteringPlaceId} on this day.`,
      });
    }
    if (a.kind === 'distinguished') {
      const due = addDays(a.at, 360);
      deadlines.push({
        id: `reward:${a.id}`,
        at: due,
        daysLeft: due.absolute - now.absolute,
        explains: `${a.subjectId} distinguished himself. Reward him before this day or the slight lands by itself.`,
      });
    }
    if (a.kind === 'captured') {
      const due = addDays(a.at, daysPerYear * 4);
      deadlines.push({
        id: `ransom:${a.id}`,
        at: due,
        daysLeft: due.absolute - now.absolute,
        explains: `${a.subjectId} is in a cell. Four years unpaid is a house lost.`,
      });
    }
  }

  const turn = stampOf(now.year + 1, 'seedtime', 1);
  deadlines.push({
    id: 'turn-of-the-year',
    at: turn,
    daysLeft: turn.absolute - now.absolute,
    explains: 'Every vessel refills on this day, and every unspent day of service is gone.',
  });

  deadlines.sort((x, y) => x.at.absolute - y.at.absolute);
  return { now, deadlines };
}

/** Acts written on or before a day. The whole layer reads through this. */
export function upTo(acts: readonly Act[], at: Stamp): Act[] {
  return acts.filter((a) => a.at.absolute <= at.absolute);
}
