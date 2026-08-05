// THE REFUSAL COUNTER — the best single idea in either source design, and the
// one law the whole game rests on (KINGDOM §2 law 5).
//
// Bracing grants NO BONUS. A braced line projects a refusal field that takes a
// charge's speed away, and shock is the SQUARE of the speed left at contact. And
// because refusal is multiplied by the defender's morale and cohesion, THE SAME
// BRACED SPEARS, FRIGHTENED AND RAGGED, PROJECT ALMOST NOTHING AND ARE RIDDEN
// OVER. Morale is not bolted onto combat; it lives inside the counter.
//
// The three probes below charge the SAME fifty knights into the SAME hundred
// spearmen and change one thing at a time. The probe forces the defender's
// posture, morale and cohesion every tick, so nothing but the refusal field is
// under test — a captain's own hand would otherwise call the brace for the
// unbraced line before the horses arrived, which is correct behaviour and
// useless for measuring.
//
// A NOTE ON WHAT THIS TEST DOES *NOT* ASSERT, because it matters. It would be
// natural to expect the ragged brace to be WORSE than no brace at all. Under the
// writ's own constants it cannot be: an unbraced line already surrenders nearly
// the whole closing speed, so the ragged brace cannot give away more of it, and
// bracing still carries its +140 shock resistance. So the ordering the arithmetic
// actually produces is braced-and-steady << braced-and-ragged < unbraced, and
// that is what is asserted. See docs/OPEN-QUESTIONS.md.

import { describe, expect, it } from "vitest";
import { step } from "../src/battle/engine.js";
import { makeLog } from "../src/battle/log.js";
import type { Intent } from "../src/battle/phase-move.js";
import { initState } from "../src/battle/setup.js";
import type { Posture } from "../src/battle/index.js";
import { makeHost, PLAIN_GROUND } from "./fixtures.js";

interface Probe {
  posture: Posture;
  morale: number;
  cohesion: number;
}

/** Fifty knights, at a gallop, into a hundred levy spearmen a hundred metres
 *  away. Returns the shock the spearmen took, and the speed the horses still
 *  had when they arrived. */
function charge(probe: Probe): { defenderKillsMilli: number; chargerKillsMilli: number; closing: number } {
  const attacker = makeHost({
    id: "chargers",
    name: "the Riders",
    side: "a",
    orderCapacity: 2,
    contingents: [
      {
        id: "ch",
        name: "the Horse",
        obedience: 95,
        resolve: 90,
        cohesion: 90,
        units: [{ typeId: "knights", strength: 50 }],
        captain: { name: "the Knight", command: 70, aggression: 60 },
      },
    ],
  });
  const defender = makeHost({
    id: "defenders",
    name: "the Spears",
    side: "b",
    orderCapacity: 2,
    contingents: [
      {
        id: "de",
        name: "the Line",
        obedience: 80,
        resolve: 90,
        cohesion: 90,
        units: [{ typeId: "spearmen", strength: 100 }],
        captain: { name: "the Reeve", command: 60, aggression: 20 },
      },
    ],
  });

  const state = initState({
    a: attacker,
    b: defender,
    ground: PLAIN_GROUND,
    seed: "the-refusal-probe",
    ordersA: [
      { t: 0, kind: "PLACE", unitId: "ch-u0", x: 600000, y: 300000, facing: 1024, formationId: "wedge", posture: null },
      { t: 0, kind: "CHARGE", contingentId: "ch", charge: "ATTACK", params: {} },
    ],
    ordersB: [
      { t: 0, kind: "PLACE", unitId: "de-u0", x: 600000, y: 400000, facing: 3072, formationId: "close", posture: probe.posture },
      { t: 0, kind: "CHARGE", contingentId: "de", charge: "HOLD", params: {} },
    ],
  });

  const log = makeLog(true);
  const intents: Intent[] = state.units.map(() => ({ bearing: 0, tier: "STOP", facing: 0, posture: "NONE" }));
  const d = state.units.find((u) => u.id === "de-u0");
  if (!d) throw new Error("no defender");

  for (let i = 0; i < 900 && state.phase !== "ENDED"; i++) {
    // Hold the one thing under test still. The captain's own hand would call
    // the brace for the unbraced line, and morale would drift — both correct,
    // both fatal to a measurement.
    d.posture = probe.posture;
    d.morale = probe.morale;
    d.cohesion = probe.cohesion;
    d.order = null;
    step(state, log, intents);
    const shock = state.events.find((e) => e.k === "shock");
    if (shock) {
      return {
        defenderKillsMilli: shock["killsMilli"] as number,
        chargerKillsMilli: shock["chargerLossMilli"] as number,
        closing: shock["closingMmPerTick"] as number,
      };
    }
  }
  // THE CHARGE WAS REFUSED OUTRIGHT. The horses came on, slowed through the
  // last twelve metres, and stopped without touching the line — which is not a
  // failure of the probe, it is the whole point of the mechanic, and it is what
  // "0.10 men killed" in the worked table of data/constants.json looks like from
  // the inside. Nought dead, nought closing speed.
  return { defenderKillsMilli: 0, chargerKillsMilli: 0, closing: 0 };
}

const STEADY = 1000000;
const RAGGED = 200000;

describe("the refusal field", () => {
  const braced = charge({ posture: "BRACED", morale: STEADY, cohesion: STEADY });
  const unbraced = charge({ posture: "NONE", morale: STEADY, cohesion: STEADY });
  const frightened = charge({ posture: "BRACED", morale: RAGGED, cohesion: RAGGED });

  it("braced and steady, the horses stop and almost nobody dies", () => {
    // "The horses stop dead" — the worked table in data/constants.json runs down
    // to a tenth of a man. Here they stop entirely: nothing arrives at all.
    expect(braced.closing).toBeLessThan(200);
    expect(braced.defenderKillsMilli).toBeLessThan(2000);
  });

  it("unbraced, the same spears take materially more", () => {
    expect(unbraced.closing).toBeGreaterThan(braced.closing * 2);
    expect(unbraced.defenderKillsMilli).toBeGreaterThan(braced.defenderKillsMilli * 5);
  });

  it("MORALE LIVES INSIDE THE COUNTER: braced but frightened and ragged is far worse", () => {
    // The same men, the same spears, the same order to brace — and a fraction of
    // the refusal, because refusal is multiplied by how steady and how well
    // dressed the line is.
    expect(frightened.closing).toBeGreaterThan(braced.closing * 2);
    expect(frightened.defenderKillsMilli).toBeGreaterThan(braced.defenderKillsMilli * 5);
  });

  it("the ordering the arithmetic actually produces, asserted whole", () => {
    expect(braced.defenderKillsMilli).toBeLessThan(frightened.defenderKillsMilli);
    expect(frightened.defenderKillsMilli).toBeLessThan(unbraced.defenderKillsMilli);
    expect(braced.closing).toBeLessThan(frightened.closing);
  });

  it("the charger's own dead follow the same order — a stalled charge kills nobody, including its own", () => {
    expect(braced.chargerKillsMilli).toBeLessThan(unbraced.chargerKillsMilli);
    expect(braced.chargerKillsMilli).toBeLessThan(frightened.chargerKillsMilli);
  });

  it("the same charge, told twice, gives the same answer", () => {
    const again = charge({ posture: "BRACED", morale: RAGGED, cohesion: RAGGED });
    expect(again.defenderKillsMilli).toBe(frightened.defenderKillsMilli);
    expect(again.closing).toBe(frightened.closing);
  });
});
