// THE MOST IMPORTANT TEST IN THE REPOSITORY (WRIT-THE-BATTLE §7).
//
// A battle is a seed and a list of orders and everything else is derived. If
// that is true, then running the same battle twice must produce the same
// transcript byte for byte, and running it from its own log header alone must
// produce that transcript again. If it is not true, every other test in this
// repository is measuring a different battle each time it runs.
//
// The four proofs below are the writ's own, in its order:
//   1. A corpus of thirty battles, each fought twice, byte-identical.
//   2. The same battle with the units walked BACKWARDS through the phases that
//      are supposed not to care — the proof that per-unit random streams work.
//   3. Refought from nothing but the header.
//   4. The Tide recomputed from the log's own event lines, equal to every logged
//      value — the proof that it is a reading and not a store.
//
// The writ also asks for a run on a different Node major version. That cannot be
// done from inside one process; it is left to CI, and noted in OPEN-QUESTIONS.

import { describe, expect, it } from "vitest";
import { parseNdjson, readTide, replayFromHeader, runBattle } from "../src/battle/index.js";
import type { Directive } from "../src/battle/index.js";
import { PLAIN_GROUND, ROLLING_GROUND, twoHosts } from "./fixtures.js";

const ORDERS_A: Directive[] = [
  { t: 0, kind: "CHARGE", contingentId: "a-crown", charge: "ADVANCE", params: {} },
  { t: 0, kind: "CHARGE", contingentId: "a-levy", charge: "ADVANCE", params: {} },
  { t: 0, kind: "CHARGE", contingentId: "a-horse", charge: "ATTACK", params: {} },
  {
    t: 0,
    kind: "PLAN",
    plan: {
      recipient: "a-levy",
      trigger: "ENEMY_CAVALRY_WITHIN",
      value: 100000,
      hornChannel: 0,
      orderId: "BRACE",
      params: {},
      note: "if horsemen come within a hundred paces, brace",
    },
  },
  { t: 400, kind: "ORDER", contingentId: "a-levy", unitId: null, orderId: "ATTACK", params: {} },
  { t: 900, kind: "HORN", channel: 1 },
];

const ORDERS_B: Directive[] = [
  { t: 0, kind: "CHARGE", contingentId: "b-crown", charge: "HOLD", params: {} },
  { t: 0, kind: "CHARGE", contingentId: "b-town", charge: "HOLD", params: {} },
  { t: 0, kind: "CHARGE", contingentId: "b-company", charge: "ATTACK", params: {} },
  { t: 600, kind: "EXHORT", contingentId: "b-town" },
];

function corpusSeeds(n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(`corpus-battle-${i}`);
  return out;
}

describe("determinism — the seed of truth", () => {
  it("1. thirty stored battles, each fought twice, byte for byte the same", () => {
    const { a, b } = twoHosts();
    for (const [i, seed] of corpusSeeds(30).entries()) {
      const ground = i % 2 === 0 ? PLAIN_GROUND : ROLLING_GROUND;
      const first = runBattle(a, b, ground, seed, ORDERS_A, ORDERS_B);
      const second = runBattle(a, b, ground, seed, ORDERS_A, ORDERS_B);
      expect(second.ndjson.length, `battle ${seed} changed length`).toBe(first.ndjson.length);
      expect(second.ndjson, `battle ${seed} is not reproducible`).toBe(first.ndjson);
    }
  }, 300000);

  it("2. walking the units BACKWARDS changes nothing", () => {
    const { a, b } = twoHosts();
    for (const seed of ["reverse-1", "reverse-2", "reverse-3"]) {
      const forwards = runBattle(a, b, ROLLING_GROUND, seed, ORDERS_A, ORDERS_B);
      const backwards = runBattle(a, b, ROLLING_GROUND, seed, ORDERS_A, ORDERS_B, { reverseUnits: true });
      expect(backwards.ndjson, `${seed} depends on the order of a loop`).toBe(forwards.ndjson);
    }
  }, 120000);

  it("3. the header alone refights the battle", () => {
    const { a, b } = twoHosts();
    const original = runBattle(a, b, ROLLING_GROUND, "from-the-header", ORDERS_A, ORDERS_B);
    // Round-tripped through JSON, because that is how a stored replay comes back.
    const stored = JSON.parse(JSON.stringify(original.header)) as typeof original.header;
    const refought = replayFromHeader(stored);
    expect(refought.ndjson).toBe(original.ndjson);
    expect(refought.aftermath.a.outcome).toBe(original.aftermath.a.outcome);
  }, 60000);

  it("4. the Tide recomputed from the log's own lines equals every logged value", () => {
    const { a, b } = twoHosts();
    const replay = runBattle(a, b, ROLLING_GROUND, "tide-is-a-reading", ORDERS_A, ORDERS_B);
    const lines = parseNdjson(replay.ndjson);

    // Rebuild the event list exactly as a reader would: from the transcript,
    // with no access to the engine's own state at all.
    const events = lines
      .filter((l) => typeof l["k"] === "string" && l["k"] !== "d" && l["k"] !== "key")
      .map((l) => ({ ...l, t: l["t"] as number, k: l["k"] as string }));

    const logged = lines.filter((l) => l["k"] === "tide");
    expect(logged.length).toBeGreaterThan(10);
    for (const line of logged) {
      const tick = line["t"] as number;
      const side = line["side"] as 0 | 1;
      // Scanning from index nought — the reading must not depend on the window
      // pointer the engine keeps for speed.
      const recomputed = readTide(events, tick, side, 0);
      expect(recomputed, `the Tide at tick ${tick} for side ${side} is stored, not read`).toBe(line["tide"]);
    }
  }, 60000);

  it("turning the log off does not change one value", () => {
    const { a, b } = twoHosts();
    const loud = runBattle(a, b, ROLLING_GROUND, "silence", ORDERS_A, ORDERS_B);
    const silent = runBattle(a, b, ROLLING_GROUND, "silence", ORDERS_A, ORDERS_B, { logEnabled: false });
    expect(silent.ndjson).toBe("");
    expect(silent.ticks).toBe(loud.ticks);
    expect(JSON.stringify(silent.aftermath)).toBe(JSON.stringify(loud.aftermath));
  }, 60000);

  it("the ruleset hash is stable and is carried in the header", () => {
    const { a, b } = twoHosts();
    const r = runBattle(a, b, PLAIN_GROUND, "hash", ORDERS_A, ORDERS_B, { maxTicks: 50 });
    expect(r.header.rulesetHash).toMatch(/^[0-9a-f]{64}$/);
    const again = runBattle(a, b, PLAIN_GROUND, "hash", ORDERS_A, ORDERS_B, { maxTicks: 50 });
    expect(again.header.rulesetHash).toBe(r.header.rulesetHash);
  }, 60000);
});
