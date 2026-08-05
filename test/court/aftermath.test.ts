// WHY THIS FILE EXISTS. `absorb` is the hinge of the whole game: the battle
// hands back a report, the report becomes records, and the records change the
// next muster. Two things are tested here and they are the two things the writ
// makes the COURT responsible for.
//
//  1. THE ASSERTION. Five numbers per unit — dead, wounded, captured, deserted,
//     survived — must sum to that unit's strength at muster. The court asserts
//     it and fails loudly. An engine that loses four men in the arithmetic will
//     lose four hundred somewhere else later, and this is the only warning
//     anybody gets.
//  2. THE LOOP. Deeds and grievances written back from an Aftermath change the
//     next muster's arithmetic. Proved with a before and an after, on the same
//     records, with nothing else altered.

import { describe, expect, it } from 'vitest';
import {
  absorb,
  assertCasualtiesAddUp,
  ContractViolation,
  CONTRACT,
  readAnswer,
  readGrievances,
  readHost,
  readMusterRoll,
  stampOf,
  veterancyOf,
  type Aftermath,
  type Chronicle,
  type Host,
  type UnitFate,
} from '../../src/court/index.js';
import { aldmarch, warAtTheFord } from './realm.js';

const MUSTER = stampOf(1, 'highsun', 61);
const AFTER = stampOf(1, 'highsun', 70);

function fateFor(host: Host, unitId: string, dead: number, wounded = 0): UnitFate {
  const strength = host.units.find((u) => u.id === unitId)?.strength ?? 0;
  return {
    unitId,
    present: true,
    dead,
    wounded,
    captured: 0,
    deserted: 0,
    survived: strength - dead - wounded,
    brokeAt: null,
    defected: false,
    ordersGiven: 2,
    ordersObeyed: 2,
    veterancyGained: 10,
  };
}

/** A battle report shaped like the one the canonical engine will hand back. */
function aftermathFor(host: Host, opts: { bleed?: string; outcome?: Aftermath['outcome'] } = {}): Aftermath {
  const bleedId = opts.bleed;
  const units = host.units.map((u) => {
    const heavy = bleedId !== undefined && u.contingentId === bleedId;
    return fateFor(host, u.id, heavy ? Math.floor(u.strength * 0.6) : Math.floor(u.strength * 0.05));
  });

  const contingents = host.contingents.map((k) => {
    const own = units.filter((u) => host.units.find((x) => x.id === u.unitId)?.contingentId === k.id);
    const stood = own.reduce((s, u) => s + u.dead + u.wounded + u.captured + u.deserted + u.survived, 0);
    const lost = own.reduce((s, u) => s + u.dead + u.captured + u.deserted, 0);
    return {
      contingentId: k.id,
      lossShare: stood === 0 ? 0 : lost / stood,
      defected: false,
      plunderSeized: 0,
    };
  });

  return {
    contract: CONTRACT,
    hostId: host.id,
    battleId: 'battle-of-the-ford',
    at: AFTER,
    outcome: opts.outcome ?? 'victory',
    heldTheField: true,
    hours: 4,
    units,
    captains: host.captains.map((p) => ({
      captainId: p.id,
      fate: 'unhurt' as const,
      conduct: 'steady' as const,
      ordersGiven: 2,
      ordersObeyed: 2,
      menLost: 0,
      deedIds: [],
    })),
    contingents,
    spoils: { plunder: 300, banners: [], captives: [], ourPeopleTaken: [], baggageLost: false },
    ground: { holdingIdsHeld: [], holdingIdsLost: [], ravaged: [], advanceStopped: true },
    deeds: [],
    notes: [],
  };
}

describe('the court’s assertion about casualties', () => {
  const host = readHost(warAtTheFord(aldmarch(), {}), 'the-ford', MUSTER);

  it('accepts a report whose five numbers sum to the strength at muster', () => {
    expect(() => assertCasualtiesAddUp(aftermathFor(host), host)).not.toThrow();
  });

  it('FAILS LOUDLY when they do not, and never reconciles them silently', () => {
    const bad = aftermathFor(host);
    const first = bad.units[0]!;
    bad.units[0] = { ...first, survived: first.survived - 4 }; // four men vanish

    expect(() => assertCasualtiesAddUp(bad, host)).toThrow(ContractViolation);
    expect(() => absorb(aldmarch(), bad, host)).toThrow(/must sum to the strength at muster/);

    // And it names the unit, the five numbers and the total, because a
    // contract violation the reader cannot debug is a shrug with a stack trace.
    try {
      assertCasualtiesAddUp(bad, host);
    } catch (e) {
      const message = (e as Error).message;
      expect(message).toContain(first.unitId);
      expect(message).toContain('mustered');
    }
  });
});

describe('an Aftermath becomes the next muster', () => {
  it('takes the dead off the holding’s roll, so a named wing is smaller next time', () => {
    const c = warAtTheFord(aldmarch(), {});
    const host = readHost(c, 'the-ford', MUSTER);

    const before = readMusterRoll(c, 'millrow-manor', MUSTER);
    const after: Chronicle = { ...c, acts: [...c.acts, ...absorb(c, aftermathFor(host), host)] };
    const later = readMusterRoll(after, 'millrow-manor', AFTER);

    const beforeSpears = before.find((r) => r.unitTypeId === 'spearmen')?.men ?? 0;
    const afterSpears = later.find((r) => r.unitTypeId === 'spearmen')?.men ?? 0;
    expect(afterSpears).toBeLessThan(beforeSpears);

    // And the men come back at six a year, additively — a small holding is not
    // also a slow one.
    const years = stampOf(4, 'highsun', 61);
    const recovered = readMusterRoll(after, 'millrow-manor', years).find((r) => r.unitTypeId === 'spearmen')?.men ?? 0;
    expect(recovered).toBeGreaterThan(afterSpears);
  });

  it('writes a blood-debt ONLY for losses far worse than everybody else’s', () => {
    const c = warAtTheFord(aldmarch(), {});
    const host = readHost(c, 'the-ford', MUSTER);

    // Everybody bleeds the same: nobody has a claim.
    const even = absorb(c, aftermathFor(host), host);
    expect(even.some((a) => a.kind === 'blood-debt')).toBe(false);

    // Thornbury is fed into the mill and loses sixty per cent: that is a claim.
    const unfair = absorb(c, aftermathFor(host, { bleed: 'k:h-thornbury' }), host);
    const debt = unfair.find((a) => a.kind === 'blood-debt');
    expect(debt).toBeDefined();
    expect(debt && 'subjectId' in debt ? debt.subjectId : '').toBe('h-thornbury');
  });

  it('PROVES THE LOOP: a blood-debt changes the next muster’s arithmetic', () => {
    const c = warAtTheFord(aldmarch(), {});
    const host = readHost(c, 'the-ford', MUSTER);

    const nextWar = stampOf(2, 'highsun', 20);
    const nextStands = stampOf(2, 'highsun', 61);
    const declareAgain = (chronicle: Chronicle): Chronicle =>
      warAtTheFord({ ...chronicle, acts: [...chronicle.acts] }, { on: nextWar });

    // BEFORE: the same realm, the same second war, no battle in between.
    const before = declareAgain(c);
    const beforeAnswer = readAnswer(before, 'the-ford', 'h-thornbury', nextStands);

    // AFTER: the same second war, but Thornbury was fed into the mill first.
    const bled: Chronicle = {
      ...c,
      acts: [...c.acts, ...absorb(c, aftermathFor(host, { bleed: 'k:h-thornbury' }), host)],
    };
    const after = declareAgain(bled);
    const afterAnswer = readAnswer(after, 'the-ford', 'h-thornbury', nextStands);

    expect(afterAnswer.willingness.value).toBeLessThan(beforeAnswer.willingness.value);
    const term = afterAnswer.willingness.terms.find((t) => t.label === 'Blood debt');
    expect(term).toBeDefined();
    expect(term!.value).toBeLessThan(0);

    // The grievance points at the record that made it, and striking THAT ONE
    // record removes exactly that term and nothing else. (It does not restore
    // the first reading: the same battle also wrote a victory into legitimacy,
    // and that is a different record with a different cause.)
    const grudge = readGrievances(after, 'h-thornbury', nextStands).find((g) => g.kind === 'blood-debt');
    expect(grudge).toBeDefined();
    const struck: Chronicle = { ...after, acts: after.acts.filter((a) => a.id !== grudge!.actId) };
    const healed = readAnswer(struck, 'the-ford', 'h-thornbury', nextStands).willingness;
    expect(healed.terms.some((t) => t.label === 'Blood debt')).toBe(false);
    expect(healed.value).toBeCloseTo(afterAnswer.willingness.value - term!.value, 2);
  });

  it('writes a defeat into legitimacy, and the next cause is worth less', () => {
    const c = warAtTheFord(aldmarch(), {});
    const host = readHost(c, 'the-ford', MUSTER);
    const routed = absorb(c, aftermathFor(host, { outcome: 'rout' }), host);
    const legit = routed.find((a) => a.kind === 'legitimacy');
    expect(legit).toBeDefined();
    expect(legit && 'amount' in legit ? legit.amount : 0).toBe(-12);
    expect(routed.some((a) => a.kind === 'glory-hunger')).toBe(false); // nobody is hungry after a rout
  });

  it('records veterancy, capped, so survivors compound but never run away with it', () => {
    const c = warAtTheFord(aldmarch(), {});
    const host = readHost(c, 'the-ford', MUSTER);
    const wing = host.units.find((u) => u.homeHoldingId === 'millrow-manor')!;

    let chronicle: Chronicle = c;
    for (let i = 0; i < 12; i++) {
      const acts = absorb(chronicle, aftermathFor(host), host).map((a) => ({ ...a, id: `${a.id}:r${i}` }));
      chronicle = { ...chronicle, acts: [...chronicle.acts, ...acts] };
    }

    // Ten a battle, twelve battles, and it stops at eighty. The Veteran Loop is
    // wanted and it is capped, exactly as the constitution's table says.
    const day = stampOf(2, 'seedtime', 1);
    expect(veterancyOf(chronicle, wing.id, day)).toBe(80);
    expect(veterancyOf(c, wing.id, day)).toBe(0);
  });
});
