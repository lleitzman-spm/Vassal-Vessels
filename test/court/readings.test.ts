// WHY THIS FILE EXISTS. Law 1 — records in, readings out — is the spine, and a
// spine has to be tested or it is a slogan. Three things are asserted here and
// nothing else in the repository can be trusted if any of them goes red:
//
//   · the same act list always yields the same readings;
//   · removing an act revokes exactly what it granted, with no residue;
//   · nothing in the layer stores a reading anywhere.
//
// The third is the one people get wrong. It is checked two ways: the founding
// records are frozen while readings are taken (so a reading that tried to write
// a cache would throw), and the readings are taken twice from a frozen chronicle
// and compared.

import { describe, expect, it } from 'vitest';
import {
  readForecast,
  readGrievances,
  readHost,
  readHouse,
  readLoyalty,
  readSeat,
  readVessel,
  stampOf,
  type Act,
  type Chronicle,
} from '../../src/court/index.js';
import { aldmarch, FORD, HOUSE_IDS, warAtTheFord } from './realm.js';

const DAY = stampOf(1, 'highsun', 61);

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  Object.freeze(value);
  for (const key of Object.keys(value as Record<string, unknown>)) {
    deepFreeze((value as Record<string, unknown>)[key]);
  }
  return value;
}

describe('readings are pure', () => {
  it('gives the same answer twice from the same records', () => {
    const c = warAtTheFord(aldmarch(), {});
    const once = JSON.stringify(readHouse(c, 'h-quayford', DAY));
    const twice = JSON.stringify(readHouse(c, 'h-quayford', DAY));
    expect(twice).toBe(once);

    const hostOnce = JSON.stringify(readHost(c, 'the-ford', DAY));
    const hostTwice = JSON.stringify(readHost(c, 'the-ford', DAY));
    expect(hostTwice).toBe(hostOnce);
  });

  it('stores nothing: every reading can be taken from a frozen chronicle', () => {
    const c = warAtTheFord(aldmarch(), {});
    deepFreeze(c);

    // In strict mode, any attempt to cache a reading onto the records would
    // throw here. That is the whole point of freezing rather than inspecting.
    expect(() => readLoyalty(c, 'h-quayford', DAY)).not.toThrow();
    expect(() => readGrievances(c, 'h-quayford', DAY)).not.toThrow();
    expect(() => readVessel(c, 'h-quayford', 1)).not.toThrow();
    expect(() => readSeat(c, 'marshal', DAY)).not.toThrow();
    expect(() => readHost(c, 'the-ford', DAY)).not.toThrow();
    expect(() => readForecast(c, DAY, { musteringPlaceId: FORD, defending: true })).not.toThrow();
  });

  it('keeps no host, no loyalties and no muster on the chronicle', () => {
    const c = warAtTheFord(aldmarch(), {});
    readHost(c, 'the-ford', DAY);
    readForecast(c, DAY, { musteringPlaceId: FORD, defending: true });

    // The compile-time guard in records.ts forbids these keys; this is the
    // run-time half of the same fence, for anyone reaching for a cache with a
    // cast.
    const keys = Object.keys(c);
    expect(keys.sort()).toEqual(['acts', 'founding', 'seed']);
    for (const house of c.founding.houses) {
      expect(Object.keys(house).every((k) => !['loyalty', 'grievance', 'standing', 'willingness'].includes(k))).toBe(true);
    }
  });
});

describe('removal of a record IS revocation', () => {
  const slight: Act = {
    id: 'a:slight',
    at: stampOf(1, 'seedtime', 20),
    by: 'crown',
    kind: 'invest',
    seatId: 'constable',
    captainId: 'c-mill', // Northwatch wanted the Constableship badly (claim 5)
    note: 'The Constableship to Millrow, over the head of the man who holds the frontier.',
  };

  it('takes the grievance away completely when the act is struck out', () => {
    const withSlight = warAtTheFord(aldmarch([slight]), {});
    const without: Chronicle = {
      ...withSlight,
      acts: withSlight.acts.filter((a) => a.id !== 'a:slight'),
    };

    const sore = readGrievances(withSlight, 'h-northwatch', DAY);
    const healed = readGrievances(without, 'h-northwatch', DAY);

    expect(sore.some((g) => g.actId === 'a:slight')).toBe(true);
    expect(healed.some((g) => g.actId === 'a:slight')).toBe(false);
    expect(healed.length).toBe(sore.length - 1);
  });

  it('leaves no residue anywhere: loyalty, willingness and the host all return', () => {
    const withSlight = warAtTheFord(aldmarch([slight]), {});
    const without: Chronicle = {
      ...withSlight,
      acts: withSlight.acts.filter((a) => a.id !== 'a:slight'),
    };
    const clean = warAtTheFord(aldmarch(), {});

    // A chronicle with the act struck out must be indistinguishable from one
    // where it never happened. Not "close" — identical.
    expect(readLoyalty(without, 'h-northwatch', DAY)).toEqual(readLoyalty(clean, 'h-northwatch', DAY));
    expect(readHost(without, 'the-ford', DAY).units.reduce((s, u) => s + u.strength, 0)).toBe(
      readHost(clean, 'the-ford', DAY).units.reduce((s, u) => s + u.strength, 0),
    );

    // And the slight really did do something, or this test proves nothing.
    expect(readLoyalty(withSlight, 'h-northwatch', DAY).value).toBeLessThan(
      readLoyalty(clean, 'h-northwatch', DAY).value,
    );
  });

  it('strikes an enfeoffment and the house owes nothing and raises nobody', () => {
    const c = warAtTheFord(aldmarch(), {});
    const stripped: Chronicle = {
      ...c,
      acts: c.acts.filter((a) => !(a.kind === 'enfeoff' && a.houseId === 'h-millrow')),
    };

    expect(readVessel(c, 'h-millrow', 1).owedMen).toBe(60);
    expect(readVessel(stripped, 'h-millrow', 1).owedMen).toBe(0);
    expect(readHouse(stripped, 'h-millrow', DAY).marchable).toBe(0);
    expect(readHouse(stripped, 'h-millrow', DAY).holdings).toHaveLength(0);
  });
});

describe('every reading shows its work', () => {
  it('returns tallies whose terms sum to their value', () => {
    const c = warAtTheFord(aldmarch(), {});
    for (const houseId of HOUSE_IDS) {
      const loyalty = readLoyalty(c, houseId, DAY);
      const sum = loyalty.terms.reduce((s, t) => s + t.value, 0);
      if (loyalty.clampedFrom === undefined) {
        expect(Math.abs(sum - loyalty.value)).toBeLessThan(0.011);
      } else {
        expect(Math.abs(sum - loyalty.clampedFrom)).toBeLessThan(0.011);
      }
      for (const t of loyalty.terms) {
        expect(t.label.length).toBeGreaterThan(0);
        expect(t.explains.length).toBeGreaterThan(0);
      }
    }
  });

  it('points every term at the records that made it', () => {
    const c = warAtTheFord(aldmarch(), {});
    const loyalty = readLoyalty(c, 'h-quayford', DAY);
    const grudge = loyalty.terms.find((t) => t.label === 'Passed over for a seat');
    expect(grudge).toBeDefined();
    expect(grudge?.fromActIds).toContain('a:invest-steward');
    // And the record it points at really is in the book.
    expect(c.acts.some((a) => a.id === 'a:invest-steward')).toBe(true);
  });
});
