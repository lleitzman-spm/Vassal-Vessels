// WHY THIS FILE EXISTS. The Host is the contract, and a contract that is only
// mostly kept is not one. This checks the shape the battle is promised, and then
// checks the court's FINGERPRINT on the battlefield: `orderCapacity`, which is
// the Marshalcy made mechanical. A vacant seat must demonstrably reduce how many
// contingents can be directed mid-battle, and that must be visible in a test,
// because it is the single clearest place where a decision taken at court
// becomes something the player feels in their hands during a fight.

import { describe, expect, it } from 'vitest';
import {
  CONTRACT,
  readHost,
  readOrderCapacity,
  stampOf,
  COURT,
  type Act,
} from '../../src/court/index.js';
import { aldmarch, warAtTheFord } from './realm.js';

const DAY = stampOf(1, 'highsun', 61);

function marshal(captainId: string): Act {
  return {
    id: `a:invest-marshal-${captainId}`,
    at: stampOf(1, 'seedtime', 20),
    by: 'crown',
    kind: 'invest',
    seatId: 'marshal',
    captainId,
    note: 'The Marshalcy is granted.',
  };
}

describe('the Host matches the contract', () => {
  const host = readHost(warAtTheFord(aldmarch(), {}), 'the-ford', DAY);

  it('carries the contract version and a seed derived from the records', () => {
    expect(host.contract).toBe(CONTRACT);
    expect(host.seed.length).toBeGreaterThan(0);
    // Same chronicle, same day, same seed — always.
    const again = readHost(warAtTheFord(aldmarch(), {}), 'the-ford', DAY);
    expect(again.seed).toBe(host.seed);
  });

  it('keeps units flat, and every unit belongs to a contingent that claims it', () => {
    for (const u of host.units) {
      const k = host.contingents.find((x) => x.id === u.contingentId);
      expect(k, `unit ${u.id} has no contingent`).toBeDefined();
      expect(k!.unitIds).toContain(u.id);
    }
    for (const k of host.contingents) {
      for (const id of k.unitIds) {
        expect(host.units.some((u) => u.id === id)).toBe(true);
      }
      expect(k.present).toBe(
        host.units.filter((u) => u.contingentId === k.id).reduce((s, u) => s + u.strength, 0),
      );
    }
  });

  it('names every unit for its home, so losing land loses a named wing', () => {
    for (const u of host.units) {
      expect(u.homeHoldingId.length).toBeGreaterThan(0);
      expect(u.name).toContain(u.homeHoldingName);
      expect(u.id).toContain(u.homeHoldingId);
    }
  });

  it('keeps the four political numbers inside the scale, on contingents and units alike', () => {
    for (const k of host.contingents) {
      for (const n of [k.resolve, k.obedience, k.treachery, k.cohesion]) {
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(100);
      }
    }
    for (const u of host.units) {
      for (const n of [u.resolve, u.obedience, u.treachery, u.fatigue, u.hunger, u.armour, u.drill]) {
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(100);
      }
      expect(u.veterancy).toBeLessThanOrEqual(COURT.regeneration.veterancyCap);
    }
  });

  it('names every captain it mentions', () => {
    const named = new Set(host.captains.map((p) => p.id));
    expect(named.has(host.command.commanderId)).toBe(true);
    for (const k of host.contingents) expect(named.has(k.captainId)).toBe(true);
  });

  it('gives the roads their due: men arrive tired, and the court owns it', () => {
    const far = host.units.find((u) => u.homeHoldingId === 'northwatch-castle');
    const near = host.units.find((u) => u.homeHoldingId === 'millrow-manor');
    expect(far!.fatigue).toBeGreaterThan(near!.fatigue);
  });

  it('reports the supply as days, not sacks, because days are the war mechanic', () => {
    const men = host.units.reduce((s, u) => s + u.strength, 0);
    expect(host.supply.provisionDays).toBeCloseTo(host.supply.sacks / (men / 100), 1);
    expect(host.supply.forage).toBe(1.2); // highsun
  });

  it('refuses to read a host for a war nobody declared', () => {
    expect(() => readHost(aldmarch(), 'no-such-war', DAY)).toThrow(/read out of records/);
  });
});

describe('orderCapacity is the court’s fingerprint on the battlefield', () => {
  it('is two when the Marshalcy is vacant — and that is a decision, not a default', () => {
    const c = warAtTheFord(aldmarch(), {});
    expect(readOrderCapacity(c, DAY)).toBe(COURT.battleJoins.orderCapacityVacantMarshal);
    expect(readHost(c, 'the-ford', DAY).command.orderCapacity).toBe(2);
  });

  it('is four for an ordinary Marshal and six for a great one', () => {
    // Aelfwine of Millrow: command 52 — barely above the bar.
    const ordinary = readHost(warAtTheFord(aldmarch([marshal('c-mill')]), {}), 'the-ford', DAY);
    expect(ordinary.command.orderCapacity).toBe(4);

    // Beorhtwulf of Northwatch: command 70.
    const good = readHost(warAtTheFord(aldmarch([marshal('c-north')]), {}), 'the-ford', DAY);
    expect(good.command.orderCapacity).toBe(4 + Math.floor((70 - 50) * 0.04));

    // A great Marshal, at the top of the scale, is worth six.
    const greatPlan = aldmarch([marshal('c-thorn')]);
    const cenric = greatPlan.founding.captains.find((p) => p.id === 'c-thorn')!;
    const raised = {
      ...greatPlan,
      founding: {
        ...greatPlan.founding,
        captains: greatPlan.founding.captains.map((p) =>
          p.id === 'c-thorn' ? { ...cenric, command: 100 } : p,
        ),
      },
    };
    expect(readHost(warAtTheFord(raised, {}), 'the-ford', DAY).command.orderCapacity).toBe(6);
  });

  it('A VACANT MARSHALCY DEMONSTRABLY REDUCES HOW MANY CONTINGENTS CAN BE DIRECTED', () => {
    const vacant = readHost(warAtTheFord(aldmarch(), {}), 'the-ford', DAY);
    const filled = readHost(warAtTheFord(aldmarch([marshal('c-north')]), {}), 'the-ford', DAY);

    // The host is the same size either way — this is not about men.
    expect(vacant.contingents.length).toBeGreaterThan(filled.command.orderCapacity);

    // It is about how much of that host you can actually steer at once.
    expect(vacant.command.orderCapacity).toBeLessThan(filled.command.orderCapacity);
    expect(vacant.contingents.length - vacant.command.orderCapacity).toBeGreaterThan(
      filled.contingents.length - filled.command.orderCapacity,
    );

    // And the canonical battle spends it as couriers and (plus two) plan slots,
    // so the difference is four riders and four plans across the two hosts.
    const couriers = (h: typeof vacant): number => h.command.orderCapacity;
    const planSlots = (h: typeof vacant): number => h.command.orderCapacity + 2;
    expect(couriers(filled) - couriers(vacant)).toBe(2);
    expect(planSlots(filled) - planSlots(vacant)).toBe(2);
  });
});
