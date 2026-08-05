// WHY THIS FILE EXISTS. Law 4: every reading shows its working. A bare number is
// not an answer in this game — "he sent 68 of 90" is only half a sentence, and
// the other half is the seven reasons, each pointing at the records that caused
// it. So every reading comes back as a Tally, and a Tally is built here, in one
// place, so that the sum can never quietly disagree with its own terms.
//
// THE INVARIANT THIS FILE KEEPS. `terms` sum to `value` — exactly, always. When
// a value is clamped, the clamp is not applied silently: `clampedFrom` is set so
// a table can honestly say "this would be 118, but loyalty stops at 100." Test
// `tally.test.ts` asserts the invariant on every reading in the layer.

import type { Tally, Term } from '../core/primitives.js';

export function term(label: string, explains: string, value: number, fromActIds: string[] = []): Term {
  return { label, explains, value, fromActIds };
}

/** Sum the terms and hand back the working. Terms worth exactly nothing are
 *  KEPT: "the Chancellor's letter was worth nothing to him" is information, and
 *  dropping it is how a table starts lying by omission. */
export function tally(terms: Term[]): Tally {
  let value = 0;
  for (const t of terms) value += t.value;
  return { value: round2(value), terms };
}

/** The same, held between two bounds, saying so. */
export function clampedTally(terms: Term[], lo: number, hi: number): Tally {
  const raw = tally(terms);
  if (raw.value < lo) return { value: lo, terms, clampedFrom: raw.value };
  if (raw.value > hi) return { value: hi, terms, clampedFrom: raw.value };
  return raw;
}

/** Every record any term was folded from, once each. This is what makes
 *  "removal of a record IS revocation" a thing a player can click: strike these
 *  ids and the number changes by exactly the terms that named them. */
export function causesOf(t: Tally): string[] {
  const seen: string[] = [];
  for (const term of t.terms) {
    for (const id of term.fromActIds) if (!seen.includes(id)) seen.push(id);
  }
  return seen;
}

/** The court keeps two decimal places and no more. Not for tidiness: a
 *  willingness of 44.999999999999996 falls on the wrong side of a threshold of
 *  45, and the whole promise of law 2 is that thresholds are readable. */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** A whole number of men. There is no such thing as two-thirds of a man on a
 *  road. */
export function whole(n: number): number {
  return Math.round(n);
}

export function sum(ns: readonly number[]): number {
  let total = 0;
  for (const n of ns) total += n;
  return total;
}
