// WHY THIS FILE EXISTS. A battle is a seed and a list of orders, and everything
// else is worked out from them (law 1). That only holds if the dice are not
// really dice: they are a formula, started from one number, handing back the
// same sequence every time. The formula itself lives in ./primitives.ts, which
// both halves of the game share; what is added here is the handful of throws the
// FIELD needs and the court does not.
//
// THE PART THAT IS EASY TO GET WRONG, AND THE REASON THIS FILE MATTERS. It is
// not enough for a battle to share one stream of numbers. If every unit drew
// from one stream, the ORDER in which units were updated would decide which
// number each one got — and the moment anyone reorders a loop, or updates two
// units at once, the battle changes. So every unit carries its OWN stream,
// seeded from the battle seed and its own index (`makeUnitRng` below), and only
// army-level rolls come from the global stream, taken in a fixed order:
// ascending side, then ascending contingent. The engine may then walk its units
// forwards, backwards, or in any order at all and get the same dead men. A test
// walks them backwards on purpose.

import { imul32, makeRng, next, rnd, splitmix32, type RngState } from "./primitives.js";

/** One stream's state: four 32-bit words. */
export type Rng = RngState;

export { makeRng, next, rnd, splitmix32 };

/** A unit's private stream: the battle's seed hash, folded with the unit's own
 *  index through the golden ratio so that neighbouring units do not walk in
 *  step. The +1 is so unit 0 is not handed the bare battle hash. */
export function makeUnitRng(seedHash: number, unitIndex: number): Rng {
  return makeRng(splitmix32((seedHash ^ imul32(unitIndex + 1, 0x9e3779b9)) >>> 0));
}

/** A roll of a hundred: 0..99. */
export function roll100(s: Rng): number {
  return rnd(s, 100);
}

/** A roll of a thousand: 0..999. Chances in this game are counted per mille,
 *  so `rollPermilleValue(s) < p` is "p in a thousand". */
export function rollPermilleValue(s: Rng): number {
  return rnd(s, 1000);
}

/** The heed wobble: a whole number from -8 to +8, evenly. A captain weighing an
 *  order is a person, and a person is never quite the same twice. */
export function jitter8(s: Rng): number {
  return rnd(s, 17) - 8;
}

/** Copy a stream, so a reading may be taken without moving anybody's dice. */
export function cloneRng(s: Rng): Rng {
  return new Uint32Array(s);
}
