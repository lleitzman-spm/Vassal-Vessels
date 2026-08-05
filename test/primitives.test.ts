// THE ARITHMETIC ITSELF. Everything else in this repository is built on these
// nine functions, so if one of them is a hair wrong the whole battle is wrong in
// a way that will not show up for four minutes of simulated time.
//
// The trigonometry is checked against its own definition rather than against
// Math.sin — the point of the tables is that they do NOT agree with a library
// function to the last place on every runtime — so the assertions below are
// about the properties a caller actually relies on: the right values at the
// quarter turns, the right signs in each quadrant, symmetry, and bearings that
// come back out of atan2B pointing where they went in.

import { describe, expect, it } from "vitest";
import { sha256 } from "../src/core/hash.js";
import { bitLength, clamp, idiv, isqrt, permille } from "../src/core/primitives.js";
import { cloneRng, jitter8, makeRng, makeUnitRng, next, rnd } from "../src/core/rng.js";
import { atan2B, cosB, normB, signedB, sinB, stepX, stepY } from "../src/core/trig.js";

describe("integer arithmetic", () => {
  it("idiv floors, including on the negative side of the field", () => {
    expect(idiv(7, 2)).toBe(3);
    expect(idiv(-7, 2)).toBe(-4); // NOT -3: truncation would round the two
    expect(idiv(-1, 2)).toBe(-1); //   halves of the field opposite ways
    expect(idiv(0, 5)).toBe(0);
    expect(idiv(-8, 2)).toBe(-4);
  });

  it("isqrt is exact, and stays exact at the sizes the field uses", () => {
    for (let n = 0; n < 2000; n++) {
      const r = isqrt(n);
      expect(r * r).toBeLessThanOrEqual(n);
      expect((r + 1) * (r + 1)).toBeGreaterThan(n);
    }
    // A corner-to-corner distance on the field, squared.
    for (const n of [1440000000000, 999999999999, 1, 2, 3, 4, 1000000, 1000001]) {
      const r = isqrt(n);
      expect(r * r).toBeLessThanOrEqual(n);
      expect((r + 1) * (r + 1)).toBeGreaterThan(n);
    }
  });

  it("clamp, permille and bitLength do the obvious thing", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-5, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
    expect(permille(1000, 350)).toBe(350);
    expect(permille(-1000, 350)).toBe(-350);
    expect(bitLength(0)).toBe(0);
    expect(bitLength(1)).toBe(1);
    expect(bitLength(255)).toBe(8);
    expect(bitLength(256)).toBe(9);
  });
});

describe("brads", () => {
  it("the quarter turns are exact", () => {
    expect(sinB(0)).toBe(0);
    expect(sinB(1024)).toBe(4096);
    expect(sinB(2048)).toBe(0);
    expect(sinB(3072)).toBe(-4096);
    expect(cosB(0)).toBe(4096);
    expect(cosB(1024)).toBe(0);
    expect(cosB(2048)).toBe(-4096);
    expect(cosB(3072)).toBe(0);
  });

  it("the signs are right in every quadrant, and the curve is symmetric", () => {
    for (let a = 1; a < 1024; a++) {
      expect(sinB(a), `sin(${a})`).toBeGreaterThan(0);
      expect(sinB(a + 2048), `sin(${a + 2048})`).toBeLessThan(0);
      expect(sinB(a)).toBe(-sinB(a + 2048));
      expect(sinB(2048 - a)).toBe(sinB(a));
    }
  });

  it("angles fold the way a compass folds", () => {
    expect(normB(4096)).toBe(0);
    expect(normB(-1)).toBe(4095);
    expect(normB(9000)).toBe(9000 % 4096);
    expect(signedB(3000)).toBe(3000 - 4096);
    expect(signedB(1000)).toBe(1000);
    expect(signedB(2048)).toBe(2048);
  });

  it("atan2B points where it was pointed, in every octant", () => {
    expect(atan2B(0, 1)).toBe(0);
    expect(atan2B(1, 1)).toBe(512);
    expect(atan2B(1, 0)).toBe(1024);
    expect(atan2B(1, -1)).toBe(1536);
    expect(atan2B(0, -1)).toBe(2048);
    expect(atan2B(-1, -1)).toBe(2560);
    expect(atan2B(-1, 0)).toBe(3072);
    expect(atan2B(-1, 1)).toBe(3584);
    expect(atan2B(0, 0)).toBe(0);
  });

  it("a step of a thousand millimetres lands within a millimetre of where it should", () => {
    for (let a = 0; a < 4096; a += 37) {
      const x = stepX(1000, a);
      const y = stepY(1000, a);
      const len = isqrt(x * x + y * y);
      expect(len).toBeGreaterThanOrEqual(998);
      expect(len).toBeLessThanOrEqual(1001);
      // And the bearing survives the round trip.
      const back = atan2B(y, x);
      const off = Math.abs(signedB(back - a));
      expect(off, `bearing ${a} came back as ${back}`).toBeLessThanOrEqual(4);
    }
  });
});

describe("the seeded die", () => {
  it("the same seed gives the same sequence, forever", () => {
    const a = makeRng("the-ford");
    const b = makeRng("the-ford");
    for (let i = 0; i < 500; i++) expect(next(a)).toBe(next(b));
  });

  it("different seeds give different sequences", () => {
    const a = makeRng("one");
    const b = makeRng("two");
    let same = 0;
    for (let i = 0; i < 200; i++) if (next(a) === next(b)) same++;
    expect(same).toBeLessThan(5);
  });

  it("a unit's stream depends on its index and on nothing else", () => {
    const first = makeUnitRng(1234, 7);
    const second = makeUnitRng(1234, 7);
    const other = makeUnitRng(1234, 8);
    for (let i = 0; i < 100; i++) expect(next(first)).toBe(next(second));
    const a = makeUnitRng(1234, 7);
    const b = makeUnitRng(1234, 8);
    let same = 0;
    for (let i = 0; i < 200; i++) if (next(a) === next(b)) same++;
    expect(same).toBeLessThan(5);
    expect(next(other)).toBeGreaterThanOrEqual(0);
  });

  it("cloning a stream reads it without moving it", () => {
    const s = makeRng(99);
    const copy = cloneRng(s);
    const peeked = next(copy);
    expect(next(s)).toBe(peeked);
  });

  it("rnd stays inside its bounds and jitter8 is -8..+8", () => {
    const s = makeRng("bounds");
    for (let i = 0; i < 5000; i++) {
      const r = rnd(s, 1000);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(1000);
    }
    const j = makeRng("jitter");
    const seen = new Set<number>();
    for (let i = 0; i < 5000; i++) {
      const v = jitter8(j);
      expect(v).toBeGreaterThanOrEqual(-8);
      expect(v).toBeLessThanOrEqual(8);
      seen.add(v);
    }
    expect(seen.size).toBe(17);
  });
});

describe("the ruleset fingerprint", () => {
  it("sha256 agrees with the published test vectors", () => {
    expect(sha256("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(sha256("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(sha256("The quick brown fox jumps over the lazy dog")).toBe(
      "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
    );
    // Longer than one block, to exercise the padding.
    expect(sha256("a".repeat(1000))).toBe("41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3");
  });
});
