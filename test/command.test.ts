// FORESIGHT IS CHEAP; IMPROVISATION IS DEAR (KINGDOM law 8).
//
// Anything agreed BEFORE the battle — a standing charge, a conditional standing
// plan — executes INSTANTLY when its moment comes, with no obedience check,
// because the captain agreed while he was calm. Anything improvised DURING the
// battle rides a courier at a physical speed and passes through a captain's
// temper when it lands.
//
// That difference is the deepest skill in the game: guessing this morning which
// crisis tonight will bring. This test measures it in ticks, which is the only
// honest way to say "the deepest skill in the game" out loud.
//
// And courier scarcity is the court's hand on your throat: the number of riders
// IS the Host's orderCapacity, and when they are all out, the order simply FAILS
// TO SEND. There is no queue. That is asserted here too.

import { describe, expect, it } from "vitest";
import { runBattle } from "../src/battle/index.js";
import type { Directive } from "../src/battle/index.js";
import { makeHost, PLAIN_GROUND } from "./fixtures.js";

function hosts(orderCapacity: number) {
  const a = makeHost({
    id: "a",
    name: "the Host of the Marches",
    side: "a",
    orderCapacity,
    contingents: [
      {
        id: "a-crown",
        name: "the Crown's Household",
        obedience: 90,
        source: "household",
        units: [
          { typeId: "crown-banner", strength: 40 },
          { typeId: "household-guard", strength: 60 },
        ],
        captain: { name: "the Marshal", command: 80, wits: 75, aggression: 50 },
      },
      {
        id: "a-far",
        name: "the men of the far wing",
        obedience: 90,
        units: [{ typeId: "spearmen", strength: 80 }],
        captain: { name: "the Lord of the far wing", command: 70, aggression: 50 },
      },
    ],
  });
  const b = makeHost({
    id: "b",
    name: "the Host of the River",
    side: "b",
    orderCapacity: 2,
    contingents: [
      { id: "b-c", name: "the River Guard", units: [{ typeId: "spearmen", strength: 80 }] },
    ],
  });
  return { a, b };
}

/** The far wing is put a long way off, out of sight of the banner, so a word to
 *  it has to be carried by a man on a horse. */
const PLACEMENTS: Directive[] = [
  { t: 0, kind: "PLACE", unitId: "a-crown-u0", x: 400000, y: 350000, facing: 1024, formationId: null, posture: null },
  { t: 0, kind: "PLACE", unitId: "a-crown-u1", x: 420000, y: 350000, facing: 1024, formationId: null, posture: null },
  // Three hundred and fifty metres off — beyond the banner's two-hundred-and-
  // sixty-metre voice, so this wing can only be reached by a man on a horse.
  { t: 0, kind: "PLACE", unitId: "a-far-u0", x: 750000, y: 350000, facing: 1024, formationId: null, posture: null },
  { t: 0, kind: "CHARGE", contingentId: "a-crown", charge: "HOLD", params: {} },
  { t: 0, kind: "CHARGE", contingentId: "a-far", charge: "HOLD", params: {} },
];

const ORDERS_B: Directive[] = [
  { t: 0, kind: "PLACE", unitId: "b-c-u0", x: 600000, y: 700000, facing: 3072, formationId: null, posture: null },
  { t: 0, kind: "CHARGE", contingentId: "b-c", charge: "HOLD", params: {} },
];

describe("the three channels", () => {
  it("a standing plan fires the instant its trigger does; a courier takes nine seconds", () => {
    const { a, b } = hosts(4);

    // Bound this morning, while he was calm: no rider, no heed check.
    const planned = runBattle(a, b, PLAIN_GROUND, "plan-vs-rider", [
      ...PLACEMENTS,
      {
        t: 0,
        kind: "PLAN",
        plan: {
          recipient: "a-far",
          trigger: "TICK_REACHED",
          value: 200,
          hornChannel: 0,
          orderId: "BRACE",
          params: {},
          note: "at the appointed moment, brace",
        },
      },
    ], ORDERS_B, { maxTicks: 1600 });

    const fired = planned.events.find((e) => e.k === "plan_fired");
    expect(fired, "the plan never fired").toBeTruthy();
    // Plans are looked at every five ticks; 200 is a multiple of five, so the
    // moment IS the tick.
    const planLatency = (fired!.t as number) - 200;
    expect(planLatency).toBe(0);

    // The same word, improvised at the same moment, to the same wing.
    const improvised = runBattle(a, b, PLAIN_GROUND, "plan-vs-rider", [
      ...PLACEMENTS,
      { t: 200, kind: "ORDER", contingentId: "a-far", unitId: null, orderId: "BRACE", params: {} },
    ], ORDERS_B, { maxTicks: 1600 });

    const issued = improvised.events.find((e) => e.k === "order_issued");
    expect(issued, "the order was never issued").toBeTruthy();
    expect(issued!["sent"]).toBe(true);
    expect(issued!["viaCourier"], "the far wing cannot see the banner").toBe(true);
    const arrived = improvised.events.find((e) => e.k === "courier_arrive");
    expect(arrived, "the rider never got there").toBeTruthy();
    const courierLatency = (arrived!.t as number) - 200;

    // Three hundred and fifty metres at ten metres a second is thirty-five
    // seconds of riding — seven hundred ticks — and rather more if the road
    // passes near the enemy. The plan cost nothing and took none of it.
    expect(courierLatency).toBeGreaterThan(600);
    expect(courierLatency).toBeGreaterThan(planLatency + 100);
  }, 60000);

  it("a unit that can see the Crown Banner takes the signal in one second and spends no rider", () => {
    const { a, b } = hosts(4);
    const r = runBattle(a, b, PLAIN_GROUND, "in-signal", [
      ...PLACEMENTS,
      // The household stands beside the banner.
      { t: 100, kind: "ORDER", contingentId: "a-crown", unitId: null, orderId: "BRACE", params: {} },
    ], ORDERS_B, { maxTicks: 400 });
    const issued = r.events.find((e) => e.k === "order_issued");
    expect(issued!["viaCourier"]).toBe(false);
    expect(issued!["arriveTick"]).toBe(120); // one second, exactly
    expect(r.events.some((e) => e.k === "courier_dispatch")).toBe(false);
  }, 60000);

  it("COURIER SCARCITY IS THE COURT'S HAND ON YOUR THROAT: with the riders out, the word never leaves", () => {
    // Two riders — a vacant Marshalcy — and three words at once to a wing that
    // cannot see the banner.
    const { a, b } = hosts(2);
    const r = runBattle(a, b, PLAIN_GROUND, "no-riders", [
      ...PLACEMENTS,
      { t: 100, kind: "ORDER", contingentId: "a-far", unitId: null, orderId: "BRACE", params: {} },
      { t: 100, kind: "ORDER", contingentId: "a-far", unitId: null, orderId: "ADVANCE", params: {} },
      { t: 100, kind: "ORDER", contingentId: "a-far", unitId: null, orderId: "ATTACK", params: {} },
    ], ORDERS_B, { maxTicks: 400 });
    const issued = r.events.filter((e) => e.k === "order_issued");
    expect(issued.length).toBe(3);
    expect(issued.filter((e) => e["sent"] === true).length).toBe(2);
    const failed = issued.find((e) => e["sent"] === false)!;
    expect(failed["reason"]).toBe("NO_COURIER");
    // No queue. The scarcity is the game.
    expect(r.events.filter((e) => e.k === "courier_dispatch").length).toBe(2);
    expect(String(failed["herald"])).toContain("no rider free");
  }, 60000);

  it("the number of riders IS the Host's orderCapacity", () => {
    for (const capacity of [2, 4, 6]) {
      const { a, b } = hosts(capacity);
      const words: Directive[] = [];
      for (let i = 0; i < 8; i++) {
        words.push({ t: 100, kind: "ORDER", contingentId: "a-far", unitId: null, orderId: "BRACE", params: {} });
      }
      const r = runBattle(a, b, PLAIN_GROUND, `capacity-${capacity}`, [...PLACEMENTS, ...words], ORDERS_B, {
        maxTicks: 200,
      });
      expect(r.events.filter((e) => e.k === "courier_dispatch").length).toBe(capacity);
    }
  }, 60000);

  it("a plan fires with NO heed check — the loophole in the politics, deliberately left open", () => {
    // A captain who would refuse anything you sent him still does what he
    // agreed to at the morning briefing.
    const { a, b } = hosts(4);
    a.contingents[1]!.obedience = 0;
    a.captains[1]!.grievance = 95;
    a.captains[1]!.quirks = [{ id: "old-grudge", explains: "The slight at the feast.", intensity: 100 }];

    const r = runBattle(a, b, PLAIN_GROUND, "the-loophole", [
      ...PLACEMENTS,
      {
        t: 0,
        kind: "PLAN",
        plan: {
          recipient: "a-far",
          trigger: "TICK_REACHED",
          value: 100,
          hornChannel: 0,
          orderId: "BRACE",
          params: {},
          note: "if it comes to it, brace",
        },
      },
    ], ORDERS_B, { maxTicks: 400 });

    const fired = r.events.find((e) => e.k === "plan_fired");
    expect(fired, "a bound plan must fire whatever the captain thinks of you").toBeTruthy();
    expect(fired!.t).toBe(100);
    // And the same man, sent the same word by rider, does not simply obey.
    const improvised = runBattle(a, b, PLAIN_GROUND, "the-loophole", [
      ...PLACEMENTS,
      { t: 100, kind: "ORDER", contingentId: "a-far", unitId: null, orderId: "BRACE", params: {} },
    ], ORDERS_B, { maxTicks: 1600 });
    const interp = improvised.events.filter((e) => e.k === "interpretation" && e["contingent"] === "a-far").pop();
    expect(interp, "the word must land and be judged").toBeTruthy();
    expect(interp!["choice"]).not.toBe("OBEY");
  }, 60000);

  it("a horn is a trigger the player pulls by hand", () => {
    const { a, b } = hosts(4);
    const r = runBattle(a, b, PLAIN_GROUND, "the-horn", [
      ...PLACEMENTS,
      {
        t: 0,
        kind: "PLAN",
        plan: {
          recipient: "a-far",
          trigger: "HORN_SOUNDED",
          value: 0,
          hornChannel: 2,
          orderId: "ADVANCE",
          params: {},
          note: "when the second horn sounds, come on",
        },
      },
      { t: 300, kind: "HORN", channel: 2 },
    ], ORDERS_B, { maxTicks: 600 });
    const horn = r.events.find((e) => e.k === "horn");
    const fired = r.events.find((e) => e.k === "plan_fired");
    expect(horn!.t).toBe(300);
    expect(fired, "the horn did not fire its plan").toBeTruthy();
    // Plans are evaluated after the directives are ingested, so the same tick.
    expect((fired!.t as number) - 300).toBeLessThanOrEqual(5);
    expect(String(fired!["herald"])).toContain("as agreed this morning");
  }, 60000);
});
