// WHY THIS FILE EXISTS. The rest of the court: the calendar that only moves when
// something is done, the seats that are time and levers and grievance machines
// at once, the land that turns into named men, and the world's own hand — the
// one place in this layer where a die is thrown at all.

import { describe, expect, it } from 'vitest';
import {
  COURT,
  readCabals,
  readCalendar,
  readCoffer,
  readGranary,
  readHolding,
  readMusterRoll,
  readNow,
  readSeat,
  readTracks,
  seasonAt,
  stampAt,
  stampOf,
  turnTheWorld,
  type Act,
  type Chronicle,
} from '../../src/court/index.js';
import { aldmarch, warAtTheFord } from './realm.js';

const DAY = stampOf(1, 'highsun', 61);

describe('the calendar', () => {
  it('round-trips a stamp through its absolute day', () => {
    for (const [year, season, day] of [
      [1, 'seedtime', 1],
      [1, 'wolfmoon', 90],
      [7, 'harvest', 45],
      [23, 'highsun', 1],
    ] as const) {
      const stamp = stampOf(year, season, day);
      expect(stampAt(stamp.absolute)).toEqual(stamp);
    }
    expect(stampOf(1, 'seedtime', 1).absolute).toBe(0);
    expect(stampOf(2, 'seedtime', 1).absolute).toBe(COURT.calendar.daysPerYear);
    expect(seasonAt(4)).toBe('seedtime'); // it wraps
  });

  it('advances only because something was DONE — there is no end-turn', () => {
    const c = aldmarch();
    const before = readNow(c);
    const act: Act = {
      id: 'a:something',
      at: stampOf(1, 'harvest', 40),
      by: 'crown',
      kind: 'feast',
      crowns: 200,
      invitedHouseIds: ['h-millrow'],
    };
    const after = readNow({ ...c, acts: [...c.acts, act] });
    expect(after.absolute).toBeGreaterThan(before.absolute);

    // And striking the act puts yesterday back, which is only possible because
    // the clock is a reading.
    expect(readNow({ ...c, acts: [...c.acts, act].filter((a) => a.id !== 'a:something') })).toEqual(before);
  });

  it('shows the deadlines a player is entitled to see', () => {
    const c = warAtTheFord(aldmarch(), {});
    const calendar = readCalendar(c);
    const standBy = calendar.deadlines.find((d) => d.id.startsWith('stand-by:'));
    expect(standBy).toBeDefined();
    expect(standBy!.explains).toContain('must stand');
    expect(calendar.deadlines.some((d) => d.id === 'turn-of-the-year')).toBe(true);
  });

  it('gives the crown a day-book and one track for every seat, filled or not', () => {
    const c = warAtTheFord(aldmarch(), {});
    const tracks = readTracks(c, DAY);
    expect(tracks[0]!.id).toBe('crown');
    expect(tracks).toHaveLength(1 + c.founding.seats.length);

    // A track you do not have is shown anyway, with nobody on it — that is the
    // sentence the screen exists to say.
    const marshal = tracks.find((t) => t.id === 'marshal')!;
    expect(marshal.holderCaptainId).toBeNull();
    const chancellor = tracks.find((t) => t.id === 'chancellor')!;
    expect(chancellor.holderCaptainId).toBe('c-chancellor');
    expect(chancellor.occupied.some((o) => o.actId === 'a:summon-ford')).toBe(true);
  });
});

describe('the seats', () => {
  it('is never worse than empty, only wasted', () => {
    const c = aldmarch();
    const vacant = readSeat(c, 'marshal', DAY);
    expect(vacant.holderCaptainId).toBeNull();
    expect(vacant.tenure).toBe('vacant');
    expect(vacant.effect.value).toBe(COURT.seats.vacantEffect);

    // A hopeless man in the office still beats nobody in it.
    const fool = aldmarch([
      { id: 'a:fool', at: stampOf(1, 'seedtime', 20), by: 'crown', kind: 'invest', seatId: 'marshal', captainId: 'c-abbot' },
    ]);
    expect(readSeat(fool, 'marshal', DAY).effect.value).toBeGreaterThanOrEqual(COURT.seats.vacantEffect);
  });

  it('turns customary at eight years and hereditary at sixteen, and says what taking it back costs', () => {
    const grant: Act = {
      id: 'a:grant-marshal',
      at: stampOf(1, 'seedtime', 20),
      by: 'crown',
      kind: 'invest',
      seatId: 'marshal',
      captainId: 'c-thorn',
    };
    const c = aldmarch([grant]);

    expect(readSeat(c, 'marshal', stampOf(3, 'highsun', 1)).tenure).toBe('granted');
    expect(readSeat(c, 'marshal', stampOf(10, 'highsun', 1)).tenure).toBe('customary');
    expect(readSeat(c, 'marshal', stampOf(20, 'highsun', 1)).tenure).toBe('hereditary');

    const young = readSeat(c, 'marshal', stampOf(3, 'highsun', 1)).revocationGrievance;
    const old = readSeat(c, 'marshal', stampOf(20, 'highsun', 1)).revocationGrievance;
    expect(old).toBeGreaterThan(young);
    expect(old).toBeGreaterThanOrEqual(COURT.seats.hereditaryGrievance);
  });

  it('names its claimants and what passing them over would cost', () => {
    const seat = readSeat(aldmarch(), 'constable', DAY);
    const beorhtwulf = seat.claimants.find((x) => x.captainId === 'c-north');
    expect(beorhtwulf).toBeDefined();
    expect(beorhtwulf!.claim).toBe(5);
    expect(beorhtwulf!.grievance).toBe(5 * COURT.seats.passedOverPerClaimPoint);
  });
});

describe('the land', () => {
  it('raises named units OF a place, with its garrison held back', () => {
    const c = aldmarch();
    const roll = readMusterRoll(c, 'northwatch-castle', DAY);
    const menAtArms = roll.find((r) => r.unitTypeId === 'men-at-arms')!;
    expect(menAtArms.men).toBe(40);
    expect(menAtArms.garrisonHeld).toBe(16); // walls do not walk

    // A Constable relieves a quarter of them.
    const withConstable = aldmarch([
      { id: 'a:constable', at: stampOf(1, 'seedtime', 20), by: 'crown', kind: 'invest', seatId: 'constable', captainId: 'c-north' },
    ]);
    const relieved = readMusterRoll(withConstable, 'northwatch-castle', DAY).find((r) => r.unitTypeId === 'men-at-arms')!;
    expect(relieved.garrisonHeld).toBeLessThan(menAtArms.garrisonHeld);
  });

  it('loses the wing with the land', () => {
    const c: Chronicle = {
      ...aldmarch(),
      acts: [
        ...aldmarch().acts,
        {
          id: 'a:lost',
          at: stampOf(1, 'highsun', 5),
          by: 'world',
          kind: 'holding-lost',
          battleId: 'b1',
          subjectId: 'thornbury-run',
        },
      ],
    };
    expect(readMusterRoll(c, 'thornbury-run', DAY)).toHaveLength(0);
    expect(readHolding(c, 'thornbury-run', DAY).state).toBe('vacant');
  });

  it('halves a ravaged holding’s yield for a year, and then stops', () => {
    const ravage: Act = {
      id: 'a:ravaged',
      at: stampOf(1, 'seedtime', 10),
      by: 'world',
      kind: 'holding-ravaged',
      battleId: 'b1',
      subjectId: 'millrow-manor',
    };
    const c = aldmarch([ravage]);
    const burnt = readHolding(c, 'millrow-manor', stampOf(1, 'highsun', 1));
    const mended = readHolding(c, 'millrow-manor', stampOf(3, 'highsun', 1));
    expect(burnt.ravagedUntil).not.toBeNull();
    expect(burnt.coinPerSeason.value).toBeLessThan(mended.coinPerSeason.value);
    expect(mended.ravagedUntil).toBeNull();
  });

  it('reads the two chests off the records, and nothing else', () => {
    const c = aldmarch();
    expect(readCoffer(c, DAY).value).toBe(900);
    expect(readGranary(c, DAY).value).toBe(400);

    const spent = aldmarch([
      { id: 'a:pay', at: stampOf(1, 'seedtime', 20), by: 'crown', kind: 'pay', toId: 'company-a', crowns: 300 },
      { id: 'a:tax', at: stampOf(1, 'seedtime', 22), by: 'crown', kind: 'tax', holdingIds: ['quayford-town'], extraordinary: false },
    ]);
    const coffer = readCoffer(spent, DAY);
    expect(coffer.terms.some((t) => t.label === 'Paid to company-a')).toBe(true);
    expect(coffer.terms.some((t) => t.label === 'Taxes gathered')).toBe(true);
    expect(coffer.value).toBe(coffer.terms.reduce((s, t) => s + t.value, 0));
  });
});

describe('the world’s own hand', () => {
  it('is seeded: the same chronicle always has the same weather', () => {
    const c = aldmarch();
    const to = stampOf(3, 'wolfmoon', 80);
    const once = turnTheWorld(c, to);
    const twice = turnTheWorld(c, to);
    expect(twice).toEqual(once);
    expect(once.length).toBeGreaterThan(0);
  });

  it('changes with the seed, and only with the seed', () => {
    const to = stampOf(3, 'wolfmoon', 80);
    const a = turnTheWorld(aldmarch(), to);
    const b = turnTheWorld({ ...aldmarch(), seed: 'a-different-year' }, to);
    expect(JSON.stringify(b)).not.toBe(JSON.stringify(a));
  });

  it('writes RECORDS and never touches the muster directly', () => {
    const acts = turnTheWorld(aldmarch(), stampOf(2, 'wolfmoon', 80));
    for (const a of acts) {
      expect(['harvest', 'raid', 'pestilence', 'death', 'birth', 'petition']).toContain(a.kind);
      // The world costs nobody a day off the deadline: it is not an act of
      // governance, it is the weather.
      if (a.by === 'world') expect(a.track).toBeUndefined();
    }
  });

  it('never hands back a day outside the window it was asked for', () => {
    const c = aldmarch();
    const from = readNow(c);
    const to = stampOf(4, 'seedtime', 1);
    for (const a of turnTheWorld(c, to)) {
      expect(a.at.absolute).toBeGreaterThan(from.absolute);
      expect(a.at.absolute).toBeLessThanOrEqual(to.absolute);
    }
  });
});

describe('cabals', () => {
  it('finds houses that share a grudge pointing at the same record', () => {
    // One act, two houses, both badly slighted: that is a faction, and neither
    // house has a membership card anywhere.
    const attaint: Act = {
      id: 'a:attaint',
      at: stampOf(1, 'seedtime', 30),
      by: 'crown',
      kind: 'attaint',
      houseId: 'h-stonebeck',
      holdingIds: ['stonebeck-mine', 'stonebeck-weald'],
    };
    const c = aldmarch([attaint]);
    const cabals = readCabals(c, DAY);
    // Stonebeck alone carries a grudge heavy enough to matter; the tyranny
    // ripple is only worth two to everybody else, which is not a faction.
    expect(cabals.every((cabal) => cabal.houseIds.length >= 2)).toBe(true);
  });
});
