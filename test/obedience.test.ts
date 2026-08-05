// DISOBEDIENCE IS A VERB, NEVER A NULL (KINGDOM law 7).
//
// A captain who will not obey does not stand idle. He obeys his own way, drags,
// hedges, overreaches, or follows his own counsel — all of which are visible
// motion, all of which the herald announces WITH ITS POLITICAL CAUSE NAMED. That
// last clause is the one this test is really about: a player must be able to
// read off the log that the charge never happened because of a wergild he never
// paid, not merely that it never happened.
//
// All six outcomes must be reachable, because every one of them is a thing the
// court can arrange, and an unreachable outcome is a lever the player was sold
// and cannot pull.

import { describe, expect, it } from "vitest";
import { applyInterpretation, captainOf, computeHeed } from "../src/battle/index.js";
import type { Interpretation } from "../src/battle/index.js";
import { makeLog } from "../src/battle/log.js";
import { initState } from "../src/battle/setup.js";
import { makeHost, PLAIN_GROUND } from "./fixtures.js";

/** One contingent a side, so a heed can be computed in isolation. */
function bench(obedience: number, aggression: number, quirks: { id: string; explains: string; intensity: number }[] = []) {
  const a = makeHost({
    id: "a",
    name: "the Host",
    side: "a",
    contingents: [
      {
        id: "a-c",
        name: "the men of the Weald",
        obedience,
        resolve: 70,
        cohesion: 70,
        units: [{ typeId: "spearmen", strength: 80 }],
        captain: { name: "the Lord of the Weald", command: 50, aggression, quirks },
      },
    ],
  });
  const b = makeHost({
    id: "b",
    name: "the Other Host",
    side: "b",
    contingents: [
      { id: "b-c", name: "the Others", units: [{ typeId: "spearmen", strength: 80 }] },
    ],
  });
  const state = initState({ a, b, ground: PLAIN_GROUND, seed: `heed-${obedience}-${aggression}`, ordersA: [], ordersB: [] });
  const log = makeLog(true);
  const c = state.contingents[0]!;
  const captain = captainOf(state, c)!;
  return { state, log, c, captain };
}

describe("heed and the six outcomes", () => {
  it("every one of the six is reachable, and each names its political cause", () => {
    const seen = new Map<Interpretation, string>();
    for (const obedience of [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0]) {
      for (const aggression of [20, 80]) {
        const { state, log, c, captain } = bench(obedience, aggression);
        const result = computeHeed(state, c, captain, "ATTACK", null);
        applyInterpretation(state, log, c, captain, "ATTACK", {}, result);
        const event = state.events.filter((e) => e.k === "interpretation").pop();
        expect(event, "an interpretation must always be logged").toBeTruthy();
        const herald = event!["herald"] as string;
        expect(herald.length, "every outcome is heralded").toBeGreaterThan(10);
        if (!seen.has(result.choice)) seen.set(result.choice, herald);
      }
    }
    const wanted: Interpretation[] = ["OBEY", "OBEY-HIS-WAY", "DRAG", "HEDGE", "OVERREACH", "HARD-HEDGE", "DEFY"];
    for (const w of wanted) {
      expect(seen.has(w), `${w} is unreachable`).toBe(true);
    }
    // The herald must say WHY, not merely WHAT. Every line ends in a cause.
    for (const [choice, herald] of seen) {
      expect(herald, `${choice} heralds no cause`).toMatch(/[—;:,]/);
    }
  });

  it("an interpretation logs every term of the heed, so a defeat can be read", () => {
    const { state, log, c, captain } = bench(45, 70);
    const result = computeHeed(state, c, captain, "ATTACK", null);
    applyInterpretation(state, log, c, captain, "ATTACK", {}, result);
    const event = state.events.filter((e) => e.k === "interpretation").pop()!;
    const why = event["why"] as { term: string; value: number }[];
    expect(why.length).toBeGreaterThan(2);
    expect(why.some((t) => t.term.includes("obedience"))).toBe(true);
    expect(why.some((t) => t.term.includes("the order is"))).toBe(true);
    // The terms sum to the heed the table was read with.
    const sum = why.reduce((acc, t) => acc + t.value, 0);
    expect(sum).toBe(event["heed"]);
  });

  it("a grudge the court recorded is a tactic that does not happen", () => {
    const plain = bench(62, 40);
    const grudging = bench(62, 40, [
      { id: "old-grudge", explains: "The slight at the feast.", intensity: 100 },
    ]);
    const a = computeHeed(plain.state, plain.c, plain.captain, "ATTACK", null);
    const b = computeHeed(grudging.state, grudging.c, grudging.captain, "ATTACK", null);
    expect(b.heed).toBeLessThan(a.heed);
    applyInterpretation(grudging.state, grudging.log, grudging.c, grudging.captain, "ATTACK", {}, b);
    const herald = grudging.state.events.filter((e) => e.k === "interpretation").pop()!["herald"] as string;
    expect(herald).toContain("the slight at the feast is not forgotten");
  });

  it("an oath clamps outright refusal into foot-dragging", () => {
    const sworn = bench(0, 60, [{ id: "iron-oath", explains: "He swore.", intensity: 100 }]);
    const result = computeHeed(sworn.state, sworn.c, sworn.captain, "ATTACK", null);
    expect(result.choice).not.toBe("DEFY");
  });

  it("going over a captain's head is an order obeyed and an insult remembered", () => {
    const { state, log, c, captain } = bench(80, 50);
    const before = computeHeed(state, c, captain, "ATTACK", null).heed;
    captain.insulted = true;
    const after = computeHeed(state, c, captain, "ATTACK", null);
    expect(after.heed).toBeLessThan(before);
    applyInterpretation(state, log, c, captain, "ATTACK", {}, after);
    const herald = state.events.filter((e) => e.k === "interpretation").pop()!["herald"] as string;
    expect(herald).toContain("over his head");
  });

  it("OBEY and OBEY-HIS-WAY count as obeyed; the rest do not", () => {
    for (const obedience of [100, 20]) {
      const { state, log, c, captain } = bench(obedience, 60);
      const result = computeHeed(state, c, captain, "ATTACK", null);
      applyInterpretation(state, log, c, captain, "ATTACK", {}, result);
      const unit = state.units[c.unitIdxs[0]!]!;
      const obeyed = result.choice === "OBEY" || result.choice === "OBEY-HIS-WAY";
      expect(unit.ordersGiven).toBe(1);
      expect(unit.ordersObeyed).toBe(obeyed ? 1 : 0);
    }
  });

  it("the SUPPORT veto: he looks upon a rival hard-pressed, and looks away", () => {
    const a = makeHost({
      id: "a",
      name: "the Host",
      side: "a",
      contingents: [
        {
          id: "a-left",
          name: "the men of the Weald",
          obedience: 60,
          units: [{ typeId: "spearmen", strength: 80 }],
          captain: { name: "the Lord of the Weald", command: 50, aggression: 30 },
        },
        {
          id: "a-right",
          name: "the men of the Mere",
          obedience: 60,
          units: [{ typeId: "spearmen", strength: 80 }],
          captain: { name: "the Lord of the Mere" },
        },
      ],
    });
    // The court's feud, handed to the battle exactly as the contract carries it.
    a.captains[0]!.rivals = [{ captainId: a.captains[1]!.id, intensity: 80 }];
    const b = makeHost({
      id: "b",
      name: "the Other Host",
      side: "b",
      contingents: [{ id: "b-c", name: "the Others", units: [{ typeId: "spearmen", strength: 80 }] }],
    });
    const state = initState({ a, b, ground: PLAIN_GROUND, seed: "veto", ordersA: [], ordersB: [] });
    const log = makeLog(true);
    const c = state.contingents[0]!;
    const captain = captainOf(state, c)!;
    c.interpretation.supportTargetId = "a-right";
    const result = computeHeed(state, c, captain, "SUPPORT", null);
    expect(result.vetoed).toBe(true);
    expect(["DRAG", "DEFY"]).toContain(result.choice);
    applyInterpretation(state, log, c, captain, "SUPPORT", { targetContingentId: "a-right" }, result);
    const herald = state.events.filter((e) => e.k === "interpretation").pop()!["herald"] as string;
    expect(herald).toContain("looks away");
  });
});
