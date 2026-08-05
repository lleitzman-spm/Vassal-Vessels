// THE SIX SECONDS — the inversion that makes a sidearm worth more than any stat.
//
// For the first hundred and twenty ticks of contact, REACH RULES: a spear wall
// beats swordsmen better than two to one, because a spear out-reaches a sword by
// more than a metre and two ranks of it can fight at once.
//
// Then the press. Long weapons drop to ONE fighting rank, take their crowd
// penalty, and the reach advantage becomes HALF OF ITSELF AS A PENALTY —
// computed from the PRIMARY weapons even after the sidearms are out, because the
// man is still tangled with his pike. Short weapons gain penetration, because at
// grappling distance you aim at the gaps in the armour.
//
// The consequence the manual cares about: spears want to hit, hurt, and step
// back out before the six seconds are up — which costs an order, a courier and
// disengagement blood, or one well-bound standing plan.

import { describe, expect, it } from "vitest";
import { meleeOneWay, woundPermille } from "../src/battle/index.js";
import { idiv } from "../src/core/primitives.js";
import { initState } from "../src/battle/setup.js";
import { makeHost, PLAIN_GROUND } from "./fixtures.js";
import type { Unit } from "../src/battle/index.js";

/** Two units, standing, so the melee arithmetic can be asked directly without a
 *  battle happening around it. */
function pair(aType: string, bType: string, men = 100): { a: Unit; b: Unit } {
  const host = (id: string, typeId: string) =>
    makeHost({
      id,
      name: id,
      side: id,
      contingents: [
        {
          id: `${id}-c`,
          name: id,
          cohesion: 100,
          resolve: 100,
          units: [{ typeId, strength: men }],
        },
      ],
    });
  const state = initState({
    a: host("a", aType),
    b: host("b", bType),
    ground: PLAIN_GROUND,
    seed: "six-seconds",
    ordersA: [],
    ordersB: [],
  });
  const a = state.units.find((u) => u.side === 0) as Unit;
  const b = state.units.find((u) => u.side === 1) as Unit;
  return { a, b };
}

/** The full width of the shorter of the two fronts, so neither side is being
 *  measured with a hand behind its back. */
function overlap(a: Unit, b: Unit): number {
  return a.frontageMm < b.frontageMm ? a.frontageMm : b.frontageMm;
}

describe("the Six Seconds", () => {
  it("reproduces K.melee.verifiedRatios for pikes against company swords", () => {
    // data/constants.json → battle.melee.verifiedRatios.pikesVsCompanySwords:
    //   "clash 1.7:1 to pikes, press 1:15.9 to swords".
    // The writ's implementation order says the engine must reproduce these
    // before anything else is built on top, so they are asserted as numbers and
    // not as a feeling.
    const { a, b } = pair("company-pikes", "company-swords", 200);
    const w = overlap(a, b);
    const clashPikes = meleeOneWay(a, b, w, "FRONT", false, false).killsMilli;
    const clashSwords = meleeOneWay(b, a, w, "FRONT", false, false).killsMilli;
    const pressPikes = meleeOneWay(a, b, w, "FRONT", true, false).killsMilli;
    const pressSwords = meleeOneWay(b, a, w, "FRONT", true, false).killsMilli;

    const clashRatio = idiv(clashPikes * 100, clashSwords); // x100, to pikes
    const pressRatio = idiv(pressSwords * 100, pressPikes); // x100, to swords
    expect(clashRatio).toBeGreaterThanOrEqual(150);
    expect(clashRatio).toBeLessThanOrEqual(200);
    expect(pressRatio).toBeGreaterThanOrEqual(1300);
    expect(pressRatio).toBeLessThanOrEqual(1900);
  });

  it("A SIDEARM IS WORTH MORE THAN ANY STAT: spear and sword wins the clash AND survives the press", () => {
    // verifiedRatios.spearAndSwordVsSwords: "clash 6.9:1, press 1:1.17 — near
    // even. This is what a sidearm is worth." Marines carry both.
    const { a, b } = pair("marines", "company-swords");
    const w = overlap(a, b);
    const clashMarines = meleeOneWay(a, b, w, "FRONT", false, false).killsMilli;
    const clashSwords = meleeOneWay(b, a, w, "FRONT", false, false).killsMilli;
    const pressMarines = meleeOneWay(a, b, w, "FRONT", true, false).killsMilli;
    const pressSwords = meleeOneWay(b, a, w, "FRONT", true, false).killsMilli;

    expect(clashMarines).toBeGreaterThan(clashSwords * 4);
    // Near even: neither side takes twice the other in the press.
    expect(pressSwords).toBeLessThan(pressMarines * 2);
    expect(pressMarines).toBeLessThan(pressSwords * 2);
  });

  it("THE INVERSION: a knife-carrying spear line's whole fortune turns at the six-second mark", () => {
    const { a, b } = pair("spearmen", "company-swords");
    const w = overlap(a, b);
    const clashSpears = meleeOneWay(a, b, w, "FRONT", false, false).killsMilli;
    const clashSwords = meleeOneWay(b, a, w, "FRONT", false, false).killsMilli;
    const pressSpears = meleeOneWay(a, b, w, "FRONT", true, false).killsMilli;
    const pressSwords = meleeOneWay(b, a, w, "FRONT", true, false).killsMilli;

    // Levy spearmen do not out-kill free-company professionals even at reach —
    // the skill and the mail see to that — but the RATIO swings by nearly an
    // order of magnitude the moment the press starts, and that swing is the
    // mechanic. Hit, hurt, and be out before the six seconds are up.
    const clash = idiv(clashSpears * 1000, clashSwords);
    const press = idiv(pressSpears * 1000, pressSwords);
    expect(clash).toBeGreaterThan(press * 8);
    expect(pressSwords).toBeGreaterThan(pressSpears * 4);
  });

  it("long weapons drop to one fighting rank in the press", () => {
    const { a, b } = pair("company-pikes", "company-swords", 200);
    const w = overlap(a, b);
    const clash = meleeOneWay(a, b, w, "FRONT", false, false);
    const press = meleeOneWay(a, b, w, "FRONT", true, false);
    // Three ranks of pikes reach in the clash; one in the press.
    expect(clash.attackers).toBe(press.attackers * 3);
    // And the reach advantage has become a penalty, at half its weight.
    expect(clash.reach).toBeGreaterThan(0);
    expect(press.reach).toBe(-idiv(clash.reach, 2));
  });

  it("the arcs are worth what the manual says: flank and rear beat the front", () => {
    const { a, b } = pair("company-swords", "spearmen");
    const w = overlap(a, b);
    const perMan = (arc: "FRONT" | "FLANK" | "REAR"): number => {
      const r = meleeOneWay(a, b, w, arc, false, false);
      return idiv(r.hitPermille * r.woundPermille, 1000);
    };
    expect(perMan("FLANK")).toBeGreaterThan(perMan("FRONT"));
    expect(perMan("REAR")).toBeGreaterThan(perMan("FLANK"));
  });

  it("backing out of a melee is paid for in blood", () => {
    const { a, b } = pair("company-swords", "spearmen");
    const w = overlap(a, b);
    const steady = meleeOneWay(a, b, w, "FRONT", false, false).killsMilli;
    const disengaging = meleeOneWay(a, b, w, "FRONT", false, true).killsMilli;
    expect(disengaging).toBeGreaterThan(steady * 2);
  });

  it("armour is a wall, not a slope — the cube law, against the worked numbers", () => {
    // data/constants.json → battle.wound.worked. Six of the seven land exactly;
    // the seventh (a sword cut against homespun) is off by five in a thousand
    // and is recorded in docs/OPEN-QUESTIONS.md rather than fudged here.
    expect(woundPermille(30, 55)).toBe(139);
    expect(woundPermille(30, 88)).toBe(38);
    expect(woundPermille(42, 55)).toBe(308);
    expect(woundPermille(42, 88)).toBe(98);
    expect(woundPermille(62, 88)).toBe(259);
    expect(woundPermille(70, 88)).toBe(334);
    // And the shape of it: a wall, not a slope. Doubling the armour against a
    // sword cut costs the swordsman seven times his effect.
    expect(woundPermille(30, 8)).toBeGreaterThan(970);
    expect(idiv(woundPermille(30, 44) * 100, woundPermille(30, 88))).toBeGreaterThan(600);
  });
});
