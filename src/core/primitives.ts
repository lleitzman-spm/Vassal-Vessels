// WHY THIS FILE EXISTS. Everything in Vassal Vessels is counted in whole
// numbers, and this is where the whole numbers are defined. The constitution
// (law: determinism and the replay) puts it plainly — not one floating-point
// number anywhere in the simulation, because two machines are allowed to
// disagree about the last digit of a fraction, and a battle that disagrees
// about the last digit will, ten thousand ticks later, disagree about who won.
//
// So there is exactly ONE division in the engine and it lives below, wrapped in
// `idiv`, which always rounds DOWN — including for negative numbers, where
// JavaScript's own `|0` and `Math.trunc` round toward zero instead and quietly
// give a different answer on one side of the field than the other.
//
// Both halves of the game share this file: the battle and the court import from
// here, so a number computed at court and a number computed on the field are
// computed the same way.

/** Integer division, floored, always. `idiv(-7, 2)` is -4, not -3.
 *
 *  WHAT BREAKS IF YOU DO THE OBVIOUS THING. `(a / b) | 0` truncates toward
 *  zero, so a unit on the left of the field and its mirror image on the right
 *  round opposite ways, and two armies that should be identical are not. The
 *  bitwise form also silently wraps above 2^31, which the WIDE formulas exceed.
 *  This one line is the only place a slash is allowed in the simulation, and a
 *  test enforces that. */
export function idiv(a: number, b: number): number {
  return Math.floor(a / b); // integer-law: the one permitted division
}

/** Squaring, named, because the square of the speed left at contact is the most
 *  important number in the game and it deserves to be readable. */
export function sq(a: number): number {
  return a * a;
}

/** Hold a value between two bounds. */
export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function absi(a: number): number {
  return a < 0 ? -a : a;
}

export function mini(a: number, b: number): number {
  return a < b ? a : b;
}

export function maxi(a: number, b: number): number {
  return a > b ? a : b;
}

/** 32-bit multiply, the seeding primitive. Kept here rather than inline so
 *  every stream is seeded through the same wrap-around arithmetic. */
export function imul32(a: number, b: number): number {
  return Math.imul(a, b) >>> 0;
}

/** How many bits `n` needs. Used to seed the square root. */
export function bitLength(n: number): number {
  let bits = 0;
  let v = n;
  while (v > 0) {
    bits++;
    v = idiv(v, 2);
  }
  return bits;
}

/** Integer square root: Newton-Raphson, six turns, then corrected by hand.
 *
 *  WHAT BREAKS IF YOU DO THE OBVIOUS THING. `Math.sqrt` is not required to give
 *  the same last digit on every runtime, and the correction below is not
 *  cosmetic: six turns of Newton from a power-of-two seed can land one either
 *  side of the true root, so the answer is walked down while it is too big and
 *  up while the next one still fits. After that it is exact, forever, on any
 *  machine. */
export function isqrt(n: number): number {
  if (n <= 0) return 0;
  if (n < 4) return 1;
  let x = 1 << ((bitLength(n) + 1) >> 1);
  for (let i = 0; i < 6; i++) x = idiv(x + idiv(n, x), 2);
  while (x * x > n) x = x - 1;
  while ((x + 1) * (x + 1) <= n) x = x + 1;
  return x;
}

/** The narrow product bound (`data/constants.json → battle.integerLaw`). A
 *  product that has not been annotated WIDE must fit inside this. */
export const PRODUCT_BOUND_NARROW = 2147483647;
/** The wide bound: formulas marked WIDE in the writ may reach here and no
 *  further, because past it a whole number stops being whole. */
export const PRODUCT_BOUND_WIDE = 9007199254740991;

/** A debug-build assertion that a WIDE product really did stay whole. Cheap
 *  enough to leave on: it is one comparison, and the alternative is a battle
 *  that silently disagrees with itself above 2^53. */
export function assertWide(v: number, what: string): number {
  if (v > PRODUCT_BOUND_WIDE || v < -PRODUCT_BOUND_WIDE) {
    throw new Error(`integer law: ${what} left the wide bound at ${v}`);
  }
  return v;
}

/** Multiply by a per-mille factor and floor. The engine does this several
 *  hundred times a tick and every one of them must round the same way. */
export function permille(v: number, per1000: number): number {
  return idiv(v * per1000, 1000);
}

/** Multiply by a factor scaled to one million — the scale the three feeling
 *  bars (morale, cohesion, fatigue) are counted in. */
export function permillion(v: number, per1e6: number): number {
  return idiv(v * per1e6, 1000000);
}

// ────────────────────────────────────────────────────────────────────────────
// THE SHARED WORDS (`docs/WRIT-THE-COURT.md` §0)
//
// The arithmetic above says how the two halves count. What follows says what
// they count — the handful of words the court and the battle must both know
// before either can say anything to the other: what a day is, what a score is
// out of, and what "shows its working" means. Declared once here so neither
// half can drift into its own dialect. This is the writ's §0 text, made code.
// ────────────────────────────────────────────────────────────────────────────

/** The version of the Host/Aftermath contract. Bumped on any breaking change.
 *  A battle engine SHOULD refuse a major version it does not know and SHOULD
 *  tolerate an unknown minor (minors only ever add optional fields). */
export type ContractVersion = `${number}.${number}.${number}`;
export const CONTRACT: ContractVersion = '1.0.0';

/** 0..100. The one scale for every judgement in this contract, so a battle
 *  engine never has to ask "out of what?". Consumers may clamp. */
export type Score = number;

/** 0..1. Proportions, chances, positions-through-a-battle. */
export type Fraction = number;

/** Whole men. Never fractional — a levy is people. */
export type Men = number;

export type Crowns = number; // the realm's coin
export type Sacks = number; // grain; a host eats one sack per hundred men per day
export type Leagues = number; // distance; foot makes eight a day on a good summer road

export type SeasonId = 'seedtime' | 'highsun' | 'harvest' | 'wolfmoon';

/** The calendar. Four seasons of ninety days. `absolute` is days since the
 *  founding — the only field arithmetic should compare, since it needs no
 *  calendar rules. */
export interface Stamp {
  year: number;
  season: SeasonId;
  day: number;
  absolute: number;
}

/** A number that shows its working (law 4). EVERY reading the court produces
 *  returns one of these rather than a bare number. A player who asks "why did
 *  this house send 68 and not 90?" must be able to see the seven terms that made
 *  it and click through to the seven records that caused them.
 *  `terms` sum to `value` before clamping; `clampedFrom` is set when clamping
 *  moved it, so a table can honestly say "this would be 118, but loyalty stops
 *  at 100." */
export interface Tally {
  value: number;
  terms: Term[];
  clampedFrom?: number;
}

export interface Term {
  label: string; // short, for a table: "Passed over for the Marshalcy"
  explains: string; // the twelve-year-old's sentence
  value: number;
  /** The acts this term was folded from. This is what makes "removal of a record
   *  IS revocation" tangible: strike these ids and the term vanishes. */
  fromActIds: string[];
}

/** A named, documented behaviour attached to a unit, contingent or captain.
 *
 *  QUIRKS ARE THE JOINT BETWEEN THE TWO LAYERS AND THEY ARE DELIBERATELY LOOSE.
 *  The court knows WHY a contingent will charge without orders; it has no
 *  business knowing how the battle expresses a charge. So it emits a named
 *  string from the documented vocabulary, an explanation, an intensity, and an
 *  optional target.
 *
 *  THE CONTRACT WITH THE BATTLE ENGINE, STATED PLAINLY:
 *    · Implement the quirks you can express. IGNORE the rest — ignoring is legal
 *      and expected, not a failure.
 *    · Never crash on an unknown id. New quirks will appear in later minors.
 *    · If you implement one, list it in `Aftermath.quirksHonoured`, so the court
 *      can narrate causes it knows were real instead of inventing them. */
export interface Quirk {
  id: string; // e.g. 'charges-without-orders'
  explains: string; // for the manual
  intensity: Score; // 20 is a tendency; 90 is a certainty
  targetId?: string; // some quirks point at someone
}

// ── The seeded die (`docs/WRIT-THE-BATTLE.md` §0.4) ─────────────────────────
//
// The dice are fake in the best way: they come from a formula fed by one number,
// so the same seed gives the same throws forever. The COURT throws them in
// exactly one place — the world's own hand, which writes harvests, raids and
// deaths — and never in the muster, where dice are forbidden outright (law 2).

export type RngState = Uint32Array;

/** FNV-1a, 32-bit. Turns a seed string into the one number everything else grows
 *  from. */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = imul32(h, 0x01000193);
  }
  return h >>> 0;
}

export function splitmix32(seed: number): number {
  let z = (seed + 0x9e3779b9) >>> 0;
  z = imul32(z ^ (z >>> 16), 0x21f0aaad);
  z = imul32(z ^ (z >>> 15), 0x735a2d97);
  return (z ^ (z >>> 15)) >>> 0;
}

/** xoshiro128\*\*, seeded through splitmix32. */
export function makeRng(seed: string | number): RngState {
  const base = typeof seed === 'string' ? hashSeed(seed) : seed >>> 0;
  const s = new Uint32Array(4);
  let acc = base;
  for (let i = 0; i < 4; i++) {
    acc = splitmix32(acc);
    s[i] = acc;
  }
  if ((s[0]! | s[1]! | s[2]! | s[3]!) === 0) s[0] = 1; // an all-zero state never moves
  return s;
}

function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0;
}

/** The next raw draw, 0 .. 2³² − 1. */
export function next(s: RngState): number {
  const s1 = s[1]!;
  const result = imul32(rotl(imul32(s1, 5), 7), 9);
  const t = (s1 << 9) >>> 0;
  s[2] = (s[2]! ^ s[0]!) >>> 0;
  s[3] = (s[3]! ^ s1) >>> 0;
  s[1] = (s1 ^ s[2]!) >>> 0;
  s[0] = (s[0]! ^ s[3]!) >>> 0;
  s[2] = (s[2]! ^ t) >>> 0;
  s[3] = rotl(s[3]!, 11);
  return result;
}

/** A whole number in `[0, n)`. */
export function rnd(s: RngState, n: number): number {
  return n <= 0 ? 0 : next(s) % n;
}

/** A chance out of a thousand. */
export function rollPermille(s: RngState, per1000: number): boolean {
  return rnd(s, 1000) < per1000;
}
