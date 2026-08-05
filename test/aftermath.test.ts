// THE AFTERMATH, AND THE ARC THAT PRODUCES IT.
//
// The hard promise first: for EVERY unit, dead + wounded + captured + deserted +
// survived equals the strength it mustered with, exactly. The court asserts it
// and treats a mismatch as a contract violation. So the engine has to guarantee
// it, not hope for it, and this test is where that guarantee is checked across a
// spread of battles rather than one lucky one.
//
// Then the arc: rout, rally, pursuit and an end to the day must all be
// REACHABLE. A mechanic that never fires is a mechanic that was described rather
// than built, and the pursuit in particular is where most of a battle's dead
// actually die.

import { describe, expect, it } from "vitest";
import { chronicle, runBattle } from "../src/battle/index.js";
import type { Directive, ReplayLog } from "../src/battle/index.js";
import { makeHost, PLAIN_GROUND, ROLLING_GROUND, twoHosts } from "./fixtures.js";

const ORDERS_A: Directive[] = [
  { t: 0, kind: "CHARGE", contingentId: "a-crown", charge: "ADVANCE", params: {} },
  { t: 0, kind: "CHARGE", contingentId: "a-levy", charge: "ADVANCE", params: {} },
  { t: 0, kind: "CHARGE", contingentId: "a-horse", charge: "ATTACK", params: {} },
];
const ORDERS_B: Directive[] = [
  { t: 0, kind: "CHARGE", contingentId: "b-crown", charge: "ADVANCE", params: {} },
  { t: 0, kind: "CHARGE", contingentId: "b-town", charge: "HOLD", params: {} },
  { t: 0, kind: "CHARGE", contingentId: "b-company", charge: "ATTACK", params: {} },
];

function fought(): ReplayLog[] {
  const { a, b } = twoHosts();
  const out: ReplayLog[] = [];
  for (let i = 0; i < 8; i++) {
    out.push(runBattle(a, b, i % 2 ? ROLLING_GROUND : PLAIN_GROUND, `aftermath-${i}`, ORDERS_A, ORDERS_B));
  }
  return out;
}

const BATTLES = fought();

describe("the aftermath", () => {
  it("THE FIVE NUMBERS SUM TO THE MUSTER, EXACTLY, for every unit of every battle", () => {
    const { a, b } = twoHosts();
    for (const replay of BATTLES) {
      for (const [host, after] of [
        [a, replay.aftermath.a],
        [b, replay.aftermath.b],
      ] as const) {
        expect(after.units.length).toBe(host.units.length);
        for (const fate of after.units) {
          const mustered = host.units.find((u) => u.id === fate.unitId)!.strength;
          const sum = fate.dead + fate.wounded + fate.captured + fate.deserted + fate.survived;
          expect(sum, `${fate.unitId} does not add up`).toBe(mustered);
          expect(fate.dead).toBeGreaterThanOrEqual(0);
          expect(fate.wounded).toBeGreaterThanOrEqual(0);
          expect(fate.captured).toBeGreaterThanOrEqual(0);
          expect(fate.deserted).toBeGreaterThanOrEqual(0);
          expect(fate.survived).toBeGreaterThanOrEqual(0);
        }
      }
    }
  }, 300000);

  it("the physicians tilt dead toward wounded, and nothing else moves", () => {
    const build = (physicians: number) => {
      const { a, b } = twoHosts();
      a.supply.physicians = physicians;
      return runBattle(a, b, PLAIN_GROUND, "physicians", ORDERS_A, ORDERS_B);
    };
    const none = build(0);
    const many = build(10);
    const casualties = (r: ReplayLog) => r.aftermath.a.units.reduce((n, u) => n + u.dead + u.wounded, 0);
    const wounded = (r: ReplayLog) => r.aftermath.a.units.reduce((n, u) => n + u.wounded, 0);
    // The same battle: the same men go down either way.
    expect(casualties(many)).toBe(casualties(none));
    // But more of them are carried off than buried.
    expect(wounded(many)).toBeGreaterThan(wounded(none));
  }, 60000);

  it("the receipts the court reads: ordersGiven and ordersObeyed", () => {
    const replay = BATTLES[0]!;
    const given = replay.aftermath.a.units.reduce((n, u) => n + u.ordersGiven, 0);
    const obeyed = replay.aftermath.a.units.reduce((n, u) => n + u.ordersObeyed, 0);
    expect(given).toBeGreaterThan(0);
    expect(obeyed).toBeLessThanOrEqual(given);
    for (const c of replay.aftermath.a.captains) {
      expect(c.ordersObeyed).toBeLessThanOrEqual(c.ordersGiven);
    }
  });

  it("veterancy is earned by time in contact and capped where the court expects", () => {
    for (const replay of BATTLES) {
      for (const u of [...replay.aftermath.a.units, ...replay.aftermath.b.units]) {
        expect(u.veterancyGained).toBeGreaterThanOrEqual(0);
        expect(u.veterancyGained).toBeLessThanOrEqual(40);
      }
    }
    const anyEarned = BATTLES.some((r) =>
      [...r.aftermath.a.units, ...r.aftermath.b.units].some((u) => u.veterancyGained > 0),
    );
    expect(anyEarned).toBe(true);
  });

  it("every captain gets a fate and a word the court will use about him", () => {
    const replay = BATTLES[0]!;
    const fates = new Set<string>();
    const conducts = new Set<string>();
    for (const c of [...replay.aftermath.a.captains, ...replay.aftermath.b.captains]) {
      fates.add(c.fate);
      conducts.add(c.conduct);
    }
    expect(fates.size).toBeGreaterThan(0);
    expect(conducts.size).toBeGreaterThan(0);
  });

  it("the engine names no blame — the court computes its own", () => {
    expect(BATTLES[0]!.aftermath.a.blame).toBeNull();
    expect(BATTLES[0]!.aftermath.a.glory).toBeNull();
    expect(BATTLES[0]!.aftermath.a.quirksHonoured!.length).toBeGreaterThan(5);
  });

  it("only one side holds the field, or neither", () => {
    for (const replay of BATTLES) {
      const both = replay.aftermath.a.heldTheField && replay.aftermath.b.heldTheField;
      expect(both).toBe(false);
    }
  });
});

describe("the arc of a battle", () => {
  it("rout, pursuit and an end to the day are all reachable", () => {
    const kinds = new Set<string>();
    for (const replay of BATTLES) for (const e of replay.events) kinds.add(e.k);
    for (const wanted of [
      "contact_begin",
      "melee",
      "casualties",
      "morale",
      "morale_state",
      "rout_begin",
      "unit_destroyed",
      "army_break",
      "pursuit_begin",
      "battle_end",
      "tide",
      "army_morale",
      "deed",
      "turning_point",
    ]) {
      expect(kinds.has(wanted), `no ${wanted} in eight battles`).toBe(true);
    }
  });

  it("a broken unit that gets clear of the enemy RALLIES, once and only once", () => {
    // A rally needs four things at once: will back above the threshold and held
    // for three seconds; no enemy within eighty metres; the captain within a
    // hundred; and no rally spent yet. So: a big levy that walks into
    // professionals, breaks, runs clear of a small enemy that cannot follow,
    // and gets its breath back with its own lord standing in the middle of it.
    const a = makeHost({
      id: "a",
      name: "the Levy of Millrow",
      side: "a",
      orderCapacity: 2,
      contingents: [
        {
          id: "a-line",
          name: "the Spears of Millrow",
          obedience: 90,
          resolve: 100,
          cohesion: 100,
          units: [{ typeId: "militia-spears", strength: 400 }],
          captain: { name: "the Reeve of Millrow", command: 70, valour: 95, aggression: 70, caution: 5 },
        },
        {
          id: "a-rear",
          name: "the Guard of Millrow",
          obedience: 90,
          resolve: 100,
          cohesion: 100,
          units: [{ typeId: "household-guard", strength: 60 }],
          captain: { name: "the Steward of Millrow", caution: 5 },
        },
      ],
    });
    const b = makeHost({
      id: "b",
      name: "the Company of the Long Road",
      side: "b",
      orderCapacity: 2,
      contingents: [
        {
          id: "b-c",
          name: "the Company of the Long Road",
          obedience: 90,
          resolve: 90,
          cohesion: 90,
          units: [{ typeId: "men-at-arms", strength: 60 }],
          captain: { name: "the Captain of the Long Road", aggression: 5, caution: 5 },
        },
      ],
    });

    const r = runBattle(a, b, PLAIN_GROUND, "the-rally", [
      { t: 0, kind: "PLACE", unitId: "a-line-u0", x: 600000, y: 440000, facing: 1024, formationId: null, posture: null },
      { t: 0, kind: "PLACE", unitId: "a-rear-u0", x: 600000, y: 60000, facing: 1024, formationId: null, posture: null },
      { t: 0, kind: "CHARGE", contingentId: "a-line", charge: "ATTACK", params: {} },
      { t: 0, kind: "CHARGE", contingentId: "a-rear", charge: "HOLD", params: {} },
    ], [
      { t: 0, kind: "PLACE", unitId: "b-c-u0", x: 600000, y: 500000, facing: 3072, formationId: null, posture: "BRACED" },
      { t: 0, kind: "CHARGE", contingentId: "b-c", charge: "HOLD", params: {} },
    ], { maxTicks: 9000 });

    expect(r.events.some((e) => e.k === "rout_begin"), "nobody broke").toBe(true);
    const rallies = r.events.filter((e) => e.k === "rally");
    expect(rallies.length, "nobody rallied").toBeGreaterThan(0);
    // A unit rallies at most ONCE. Twice-broken men are done for the day.
    const perUnit = new Map<string, number>();
    for (const e of rallies) {
      const id = e["unit"] as string;
      perUnit.set(id, (perUnit.get(id) ?? 0) + 1);
    }
    for (const [id, n] of perUnit) expect(n, `${id} rallied more than once`).toBeLessThanOrEqual(1);
    expect(String(rallies[0]!["herald"])).toContain("turn");
    // And it comes back SHAKEN, not whole: the ceiling only ever falls.
    const after = r.aftermath.a.units.find((u) => u.unitId === "a-line-u0")!;
    expect(after.brokeAt).not.toBeNull();
  }, 120000);

  it("the log reads as a chronicle: the heralds tell the day without a picture", () => {
    const lines = chronicle(BATTLES[0]!);
    expect(lines.length).toBeGreaterThan(40);
    // Every line is stamped with a time and says something in words.
    for (const line of lines) {
      expect(line).toMatch(/^\d+:\d\d {2}\S/);
      expect(line.length).toBeGreaterThan(20);
    }
    // And the day ends with a sentence saying how.
    expect(lines.some((l) => l.includes("And so the day ended"))).toBe(true);
  });

  it("every morale event carries the terms that made it", () => {
    const replay = BATTLES[0]!;
    const moraleEvents = replay.events.filter((e) => e.k === "morale");
    expect(moraleEvents.length).toBeGreaterThan(100);
    for (const e of moraleEvents.slice(0, 200)) {
      const why = e["why"] as { term: string; value: number }[];
      expect(Array.isArray(why)).toBe(true);
      const sum = why.reduce((n, t) => n + t.value, 0);
      expect(sum).toBe(e["delta"]);
    }
  });

  it("every shock event says the speed the refusal took away", () => {
    for (const replay of BATTLES) {
      for (const e of replay.events) {
        if (e.k !== "shock") continue;
        const why = e["why"] as Record<string, unknown>;
        expect(why).toBeTruthy();
        expect(typeof why["speedTakenAway"]).toBe("number");
        expect(typeof why["braced"]).toBe("boolean");
        expect(typeof why["resist"]).toBe("number");
        expect(typeof why["refusalDecelApplied"]).toBe("number");
      }
    }
  });
});
