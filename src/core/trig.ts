// WHY THIS FILE EXISTS. Angles on this field are measured in BRADS: 4096 of
// them to a full turn, 1024 to a right angle. Degrees would need a fraction to
// say "half a degree" and radians are a fraction from the start; brads divide
// a circle into whole numbers a computer never has to round.
//
// Everything here reads the tables in ./tables.ts and does the mirroring by
// hand. Nothing calls the standard library's trigonometry, which is allowed to
// differ in its last place between runtimes and would break the replay.

import { ATAN, SIN } from "./tables.js";
import { idiv } from "./primitives.js";

/** A full turn, in brads. */
export const TURN = 4096;
/** A right angle. */
export const QUARTER = 1024;
/** Half a turn. */
export const HALF = 2048;
/** The scale the sine table is written in: sinB returns -4096..+4096. */
export const TRIG_ONE = 4096;

/** Fold any angle into [0, 4096), the way a compass does. */
export function normB(a: number): number {
  const m = a % TURN;
  return m < 0 ? m + TURN : m;
}

/** Fold a difference of angles into (-2048, +2048] — the SHORT way round.
 *  Turning is expensive in this game, so which way round matters. */
export function signedB(a: number): number {
  let d = normB(a);
  if (d > HALF) d -= TURN;
  return d;
}

/** The first quadrant of the table, with the one entry the 1024-long table
 *  cannot hold spelled out: a quarter turn is exactly 4096. */
function sinQuarter(i: number): number {
  if (i >= QUARTER) return TRIG_ONE;
  return SIN[i] as number;
}

/** Sine, scaled by 4096. `sinB(1024)` is 4096; `sinB(3072)` is -4096.
 *
 *  The `=== 0` guards are not decoration: negating a zero in JavaScript gives
 *  MINUS zero, which compares equal to zero everywhere except `Object.is` — so
 *  it survives silently for months and then two values that are the same number
 *  are not the same value. Whole numbers have one zero. */
export function sinB(a: number): number {
  const t = normB(a);
  if (t < QUARTER) return sinQuarter(t);
  if (t < HALF) return sinQuarter(HALF - t);
  if (t < HALF + QUARTER) {
    const v = sinQuarter(t - HALF);
    return v === 0 ? 0 : -v;
  }
  const v = sinQuarter(TURN - t);
  return v === 0 ? 0 : -v;
}

/** Cosine is sine a quarter turn along. */
export function cosB(a: number): number {
  return sinB(a + QUARTER);
}

/** The bearing from the origin to (dx, dy), in brads, by octant.
 *
 *  WHAT BREAKS IF YOU DO THE OBVIOUS THING. `Math.atan2` is the obvious thing
 *  and it is a floating-point function: two runtimes may hand back bearings a
 *  hair apart, a unit turns one brad differently on each, and by the fourth
 *  minute the two battles have different dead. The table below is 257 whole
 *  numbers and it is the same 257 numbers everywhere. */
export function atan2B(dy: number, dx: number): number {
  if (dx === 0 && dy === 0) return 0;
  const ax = dx < 0 ? -dx : dx;
  const ay = dy < 0 ? -dy : dy;
  const lo = ax < ay ? ax : ay;
  const hi = ax < ay ? ay : ax;
  const oct = ATAN[idiv(lo * 256, hi)] as number; // 0..512, one octant
  let r = ax >= ay ? oct : QUARTER - oct;
  if (dx < 0) r = HALF - r;
  if (dy < 0) r = TURN - r;
  return normB(r);
}

/** Step `dist` millimetres along bearing `a`. The pair of them together are how
 *  every body on the field moves. */
export function stepX(dist: number, a: number): number {
  return idiv(dist * cosB(a), TRIG_ONE);
}

export function stepY(dist: number, a: number): number {
  return idiv(dist * sinB(a), TRIG_ONE);
}
