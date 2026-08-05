// WHY THIS FILE EXISTS. There are two truths in this layer and the difference
// between them is the whole of the game's uncertainty.
//
// `readLoyalty` and its neighbours return THE TRUTH: every grudge, whether or
// not anybody told the crown about it. `readAsCrown` returns what the player is
// ENTITLED TO SEE: the same reading with the grudges nobody has learned of taken
// out, and the tallies re-added so the arithmetic still adds up.
//
// This is the only uncertainty in the court, and it is hidden information rather
// than randomness — which is the point. A house that turns its coat was always
// going to; the player simply never wrote the `learn` record that would have
// shown it. "I did not know" is a fact in the book, not an excuse, and with a
// Spymaster seated the two readings converge.
//
// WHAT BREAKS IF THIS IS DONE WITH A FLAG INSTEAD OF A RECORD. Discovery becomes
// a piece of state somebody has to remember to set, the crown's view and the
// truth drift apart in ways nothing can reconcile, and a betrayal stops being
// foreseeable — which is the one thing the design cannot survive.

import type { Stamp, Tally, Term } from '../core/primitives.js';
import { SEAT } from './codex.js';
import { isKnown } from './grievances.js';
import type { Chronicle } from './records.js';
import { seatIsFilled } from './seats.js';
import { round2 } from './tally.js';
import type { Grievance } from './types.js';

/** The crown's own view of any reading. Hidden terms omitted unless a `learn`
 *  record covers them — or a Spymaster is seated, in which case the two
 *  converge, which is what the seat is for. */
export function readAsCrown<T>(c: Chronicle, reading: T, at: Stamp): T {
  if (seatIsFilled(c, SEAT.spymaster, at)) return reading;
  return strip(c, reading, at) as T;
}

function strip(c: Chronicle, value: unknown, at: Stamp): unknown {
  if (Array.isArray(value)) {
    const out: unknown[] = [];
    for (const item of value) {
      if (isGrievance(item) && !item.known) continue;
      out.push(strip(c, item, at));
    }
    return out;
  }

  if (value === null || typeof value !== 'object') return value;

  if (isTally(value)) return stripTally(c, value, at);

  const source = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(source)) out[key] = strip(c, source[key], at);
  return out;
}

/** A tally the crown may see: every term whose causes are all unknown is
 *  dropped, and the value is re-added from what is left. The number the player
 *  sees is therefore always the sum of the terms in front of them — a screen
 *  that showed a total nobody could account for would be worse than no screen. */
function stripTally(c: Chronicle, t: Tally, at: Stamp): Tally {
  const kept: Term[] = [];
  for (const term of t.terms) {
    if (term.fromActIds.length > 0 && term.fromActIds.every((id) => !isKnown(c, id, at))) continue;
    kept.push(term);
  }
  let value = 0;
  for (const term of kept) value += term.value;
  const out: Tally = { value: round2(value), terms: kept };
  if (t.clampedFrom !== undefined) out.clampedFrom = t.clampedFrom;
  return out;
}

function isTally(v: object): v is Tally {
  const t = v as Partial<Tally>;
  return typeof t.value === 'number' && Array.isArray(t.terms);
}

function isGrievance(v: unknown): v is Grievance {
  if (v === null || typeof v !== 'object') return false;
  const g = v as Partial<Grievance>;
  return typeof g.actId === 'string' && typeof g.known === 'boolean' && typeof g.weight === 'number';
}
