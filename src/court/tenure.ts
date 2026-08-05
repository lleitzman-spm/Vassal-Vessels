// WHY THIS FILE EXISTS. Who holds a seat, since when, and what it would cost to
// take it back. This is separated from the seats' own reading because the
// grievances need it and the seats need the grievances, and a straight line is
// better than a knot: nothing in here asks what anybody's loyalty is.
//
// The whole of the tenure rule, from the constitution §8.3: hold a seat eight
// years and taking it back is a serious insult; sixteen and everyone treats it
// as the house's property. You rented time and paid in sovereignty.

import type { Stamp } from '../core/primitives.js';
import { COURT } from './codex.js';
import type { Chronicle } from './records.js';
import { yearsBetween } from './calendar.js';

export interface Tenancy {
  seatId: string;
  captainId: string;
  from: Stamp;
  /** Null while he still holds it. */
  until: Stamp | null;
  /** The invest record that put him there — strike it and he was never seated. */
  actId: string;
  /** How he left, if he has: displaced by a new investiture, or dead. */
  ended: 'displaced' | 'died' | null;
}

/** Everyone who has ever held a seat, oldest first, on the day asked. */
export function tenanciesOf(c: Chronicle, seatId: string, at: Stamp): Tenancy[] {
  const invests = c.acts
    .filter((a) => a.kind === 'invest' && a.seatId === seatId && a.at.absolute <= at.absolute)
    .sort((a, b) => a.at.absolute - b.at.absolute);

  const out: Tenancy[] = [];
  for (const a of invests) {
    if (a.kind !== 'invest') continue;
    const previous = out[out.length - 1];
    if (previous && previous.until === null) {
      previous.until = a.at;
      previous.ended = previous.captainId === a.captainId ? null : 'displaced';
    }
    out.push({ seatId, captainId: a.captainId, from: a.at, until: null, actId: a.id, ended: null });
  }

  // A dead man holds nothing. The seat falls vacant on the day of the death and
  // his claimants start souring again from that day.
  for (const t of out) {
    if (t.until !== null) continue;
    const death = c.acts.find(
      (a) =>
        a.kind === 'death' &&
        a.captainId === t.captainId &&
        a.at.absolute <= at.absolute &&
        a.at.absolute >= t.from.absolute,
    );
    if (death) {
      t.until = death.at;
      t.ended = 'died';
    }
  }

  return out;
}

/** Who holds it today, or nobody. */
export function holderOf(c: Chronicle, seatId: string, at: Stamp): Tenancy | null {
  const all = tenanciesOf(c, seatId, at);
  const last = all[all.length - 1];
  return last && last.until === null ? last : null;
}

/** How long the present holder has had it, in years. Zero when vacant. */
export function yearsHeld(c: Chronicle, seatId: string, at: Stamp): number {
  const held = holderOf(c, seatId, at);
  return held ? yearsBetween(held.from, at) : 0;
}

/** How long the seat has stood empty, in years — counted from the day the last
 *  holder left, or from the founding if nobody ever held it. This is the number
 *  that sours a claimant slowly while the crown does the job at half effect. */
export function yearsVacant(c: Chronicle, seatId: string, at: Stamp): number {
  const all = tenanciesOf(c, seatId, at);
  const last = all[all.length - 1];
  if (!last) return yearsBetween(c.founding.founding, at);
  if (last.until === null) return 0;
  return yearsBetween(last.until, at);
}

export type Tenure = 'granted' | 'customary' | 'hereditary' | 'vacant';

export function tenureFromYears(years: number, seated: boolean): Tenure {
  if (!seated) return 'vacant';
  if (years >= COURT.seats.hereditaryAfterYears) return 'hereditary';
  if (years >= COURT.seats.customaryAfterYears) return 'customary';
  return 'granted';
}

/** What it would cost, in grudge, to take this seat back today. The clock is the
 *  whole point: a seat is a loan of sovereignty and the interest compounds. */
export function revocationGrievance(years: number): number {
  const wear = Math.min(Math.floor(years) * COURT.seats.unseatedPerYear, COURT.seats.unseatedCap);
  if (years >= COURT.seats.hereditaryAfterYears) return wear + COURT.seats.hereditaryGrievance;
  if (years >= COURT.seats.customaryAfterYears) return wear + COURT.seats.customaryGrievance;
  return wear;
}
