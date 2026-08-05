// WHY THIS FILE EXISTS. A worked example is the proof. The tests around it check
// invariants; this one runs a whole season the way a player would live it —
// found a realm, take some acts, call the host, read out what stood and what did
// not — and prints it, because the constitution says the engine is tuned against
// text before anybody draws a single soldier.
//
// If a number in here looks wrong, it is wrong, and no amount of green
// invariants elsewhere will save it.

import { describe, expect, it } from 'vitest';
import {
  describeHost,
  readForecast,
  readHost,
  readOrderCapacity,
  readPrice,
  stampOf,
  type Act,
} from '../../src/court/index.js';
import { aldmarch, FORD, warAtTheFord } from './realm.js';

describe('a season at Aldmarch, end to end', () => {
  it('musters a host, names every absence, and shows the Marshalcy in the order capacity', () => {
    const summonedOn = stampOf(1, 'highsun', 20);
    const standsOn = stampOf(1, 'highsun', 61);

    // ── The realm, and a war ────────────────────────────────────────────
    const c = warAtTheFord(aldmarch(), { on: summonedOn });

    // ── What the crown could see before sending the letters ────────────
    const forecast = readForecast(c, summonedOn, { musteringPlaceId: FORD, defending: true });
    expect(forecast.men).toBeGreaterThan(0);
    expect(forecast.levers.length).toBeGreaterThan(0);

    // ── The host as it actually stands ─────────────────────────────────
    const host = readHost(c, 'the-ford', standsOn);
    const men = host.units.reduce((s, u) => s + u.strength, 0);

    console.log('');
    console.log('════════ THE FORECAST, BEFORE ANYTHING WAS DONE ════════');
    console.log(`  ${forecast.men} men would stand at the ford on day ${forecast.standsOn.day} of ${forecast.standsOn.season}.`);
    for (const a of forecast.absent) {
      console.log(`  · ${a.whoName}: owed ${a.owed}, would send ${a.sent} — ${a.answer}`);
    }
    console.log('');
    console.log('  LEVERS THE CROWN HAS, PRICED:');
    for (const lever of forecast.levers) {
      console.log(
        `  · ${lever.act.note ?? lever.act.kind}  —  ${lever.price.days} days off the ${lever.price.track}'s book, ` +
          `${lever.price.crowns} crowns, ${lever.price.musterDelta.explains}`,
      );
    }

    console.log('');
    console.log('════════ THE HOST ════════');
    console.log(describeHost(host));

    // ── The things the writ promises about this muster ─────────────────
    expect(host.command.orderCapacity).toBe(2); // the Marshalcy is empty
    expect(readOrderCapacity(c, standsOn)).toBe(2);
    expect(men).toBe(host.contingents.reduce((s, k) => s + k.present, 0));
    expect(host.absent.length).toBeGreaterThan(0);

    // The Sworn Order stayed in its abbey: nobody blessed the cause.
    const order = host.absent.find((a) => a.kind === 'order');
    expect(order).toBeDefined();
    expect(order?.reason).toContain('blessed');

    // Every absence names its cause in words.
    for (const a of host.absent) {
      expect(a.explains.length).toBeGreaterThan(10);
      expect(a.owed).toBeGreaterThanOrEqual(a.sent);
    }
  });

  it('grants the Marshalcy and the battle feels it — two more contingents can be directed', () => {
    const summonedOn = stampOf(1, 'highsun', 20);
    const standsOn = stampOf(1, 'highsun', 61);

    const grant: Act = {
      id: 'a:invest-marshal',
      at: stampOf(1, 'highsun', 5),
      by: 'crown',
      kind: 'invest',
      seatId: 'marshal',
      captainId: 'c-thorn', // command 78
      track: { seatId: 'crown', days: 3 },
      note: 'The Marshalcy to Lord Cenric of Thornbury.',
    };

    const without = readHost(warAtTheFord(aldmarch(), { on: summonedOn }), 'the-ford', standsOn);
    const with_ = readHost(warAtTheFord(aldmarch([grant]), { on: summonedOn }), 'the-ford', standsOn);

    console.log('');
    console.log('════════ WHAT THE MARSHALCY BOUGHT ════════');
    console.log(`  order capacity ${without.command.orderCapacity} → ${with_.command.orderCapacity}`);
    console.log(`  authority      ${without.command.authority} → ${with_.command.authority}`);
    console.log(
      `  men            ${without.units.reduce((s, u) => s + u.strength, 0)} → ${with_.units.reduce((s, u) => s + u.strength, 0)}`,
    );
    for (const a of with_.absent) console.log(`  · ${a.whoName}: ${a.reason} ${a.explains}`);

    expect(with_.command.orderCapacity).toBe(5); // 4 + (78-50)*0.04 = 5
    expect(with_.command.orderCapacity).toBeGreaterThan(without.command.orderCapacity);

    // AND THE TRADE, WHICH IS THE POINT. With the Marshalcy empty the crown
    // commands in person, and a crown is deferred to: authority is HIGHER and
    // there are two couriers. Grant the seat and a vassal commands — two and a
    // half times the orders, slightly less personal deference, one house
    // delighted and its rival sourer than before. The court never hands out a
    // gain without a named cost.
    expect(without.command.commanderId).toBe('c-king');
    expect(with_.command.commanderId).toBe('c-thorn');
    expect(with_.command.authority).toBeLessThan(without.command.authority);
    expect(with_.units.reduce((s, u) => s + u.strength, 0)).toBeGreaterThan(
      without.units.reduce((s, u) => s + u.strength, 0),
    );
    // Northwatch wanted the Marshalcy too, and sends fewer men for having lost
    // it — the rival going down while the winner goes up.
    const northBefore = without.absent.find((a) => a.whoId === 'h-northwatch');
    const northAfter = with_.absent.find((a) => a.whoId === 'h-northwatch');
    expect(northAfter?.sent ?? 0).toBeLessThan(northBefore?.sent ?? 0);
  });

  it('prices the act before it is taken', () => {
    const on = stampOf(1, 'highsun', 20);
    const c = warAtTheFord(aldmarch(), { on });
    const proposed: Act = {
      id: 'proposed:amends',
      at: on,
      by: 'crown',
      kind: 'amends',
      houseId: 'h-quayford',
      method: 'wergild',
      settles: [{ grievanceActId: 'a:invest-steward', points: 20 }],
      crowns: 200,
    };
    const price = readPrice(c, proposed, on);

    console.log('');
    console.log('════════ A WERGILD, PRICED BEFORE IT IS PAID ════════');
    console.log(`  ${price.days} days off the ${price.track}'s day-book, ${price.crowns} crowns.`);
    console.log(`  ${price.musterDelta.explains}`);
    for (const f of price.favours) console.log(`  + ${f.houseId}: ${f.kind} (${f.weight}) — ${f.explains}`);
    for (const g of price.grievances) console.log(`  − ${g.houseId}: ${g.kind} (${g.weight}) — ${g.explains}`);

    expect(price.crowns).toBe(200);
    expect(price.favours.some((f) => f.houseId === 'h-quayford')).toBe(true);
    expect(price.musterDelta.men).toBeGreaterThanOrEqual(0);
  });
});
