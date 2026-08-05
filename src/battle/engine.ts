// THE ENGINE. `runBattle(a, b, ground, seed, ordersA, ordersB) → ReplayLog`.
//
// WHY THE LOG IS THE RETURN VALUE AND THE AFTERMATH IS ONLY ITS LAST TWO LINES.
// A battle is a seed and a list of orders, and everything else is derived (law
// 1). That is precisely what makes the replay possible — and it means the honest
// output of this function is the transcript, not a summary. The two Aftermath
// objects the court needs are the final records IN it.
//
// THE HEADER REPRODUCES THE STREAM. Version, seed, ruleset hash, the tiles, both
// rosters with the resolved type sheets copied in so an old replay survives a
// rebalance, and every directive with the tick it was given. Feed that header
// back to `replayFromHeader` and the events come out byte for byte the same,
// forever. There is a test and it is the most important one in the repository.
//
// THE ORDER OF THE THIRTEEN PHASES IS CANON, NOT A SUGGESTION. Every one of them
// reads the state as it stood at the top of the tick and writes into the shadow
// copy; the shadow is folded in at the boundaries marked below. Reorder them and
// you will get a battle — just not this one, and not the same one twice.

import constantsJson from "../../data/constants.json";
import equipmentJson from "../../data/equipment.json";
import formationsJson from "../../data/formations.json";
import keywordsJson from "../../data/keywords.json";
import ordersJson from "../../data/orders.json";
import standingPlansJson from "../../data/standing-plans.json";
import terrainJson from "../../data/terrain.json";
import unitsJson from "../../data/units.json";
import type { Aftermath, Ground, Host } from "../core/contract.js";
import { sha256 } from "../core/hash.js";
import { CONTRACT, idiv } from "../core/primitives.js";
import { buildAftermath, closingDeeds } from "./aftermath.js";
import { resolvedTypesFor } from "./catalog.js";
import { makeLog, toNdjson, write, type LogWriter } from "./log.js";
import { bringOnLatecomers, phaseCommand } from "./phase-command.js";
import { emitTurningPoints, phaseArmyAndTide, phaseLog, phaseVictory, sweepLosses } from "./phase-army.js";
import { foldCasualties, phaseAttrition, phaseContact, phaseMelee, phaseMissiles } from "./phase-fight.js";
import { phaseIntent, phaseMovement, phasePerception, type Intent } from "./phase-move.js";
import { phaseMorale, phaseRout } from "./phase-morale.js";
import { K, MAX_TICKS, TICK_HZ } from "./rules.js";
import { initState, type BattleInput } from "./setup.js";
import { encodeTerrain } from "./terrain.js";
import type { BattleState, Directive, EventRecord, Side } from "./types.js";

export const ENGINE_VERSION = "1.0.0";

/** Everything needed to fight the same battle again. */
export interface ReplayHeader {
  version: string;
  contract: string;
  seed: string;
  /** A fingerprint of every number the battle was fought under, so an old
   *  replay can say honestly "this was fought under different rules". */
  rulesetHash: string;
  tickHz: number;
  field: { widthMm: number; heightMm: number; tileMm: number; tilesX: number; tilesY: number };
  ground: Ground;
  hosts: [Host, Host];
  orders: [Directive[], Directive[]];
}

export interface ReplayLog {
  header: ReplayHeader;
  /** The whole transcript, NDJSON, one record per line. */
  ndjson: string;
  /** The event records, already parsed — the same objects the Tide read. */
  events: EventRecord[];
  aftermath: { a: Aftermath; b: Aftermath };
  ticks: number;
  endedReason: string;
}

let cachedRulesetHash: string | null = null;

/** SHA-256 over every data file THE BATTLE READS, in a fixed filename order.
 *  The court's own files are deliberately left out: a retune of the muster
 *  arithmetic does not change how a battle was fought, and a fingerprint that
 *  moves for reasons the battle cannot feel is a fingerprint nobody trusts. */
export function rulesetHash(): string {
  if (cachedRulesetHash) return cachedRulesetHash;
  const parts = [
    ["constants.json", constantsJson],
    ["equipment.json", equipmentJson],
    ["formations.json", formationsJson],
    ["keywords.json", keywordsJson],
    ["orders.json", ordersJson],
    ["standing-plans.json", standingPlansJson],
    ["terrain.json", terrainJson],
    ["units.json", unitsJson],
  ] as [string, unknown][];
  parts.sort((p, q) => (p[0] < q[0] ? -1 : p[0] > q[0] ? 1 : 0));
  cachedRulesetHash = sha256(parts.map(([name, body]) => `${name}\n${JSON.stringify(body)}`).join("\n"));
  return cachedRulesetHash;
}

/** ONE TICK. Phases 1 to 13, in this exact order, always. */
export function step(state: BattleState, log: LogWriter, intents: Intent[]): void {
  const pursuing = state.phase === "PURSUIT";

  bringOnLatecomers(state, log);
  // In the pursuit nobody is listening: phase 1 does not run. The chase is
  // deaf, which is exactly how a won battle is lost.
  if (!pursuing) phaseCommand(state, log);

  phasePerception(state);
  phaseIntent(state, log, intents);
  phaseMovement(state, intents);
  // ── the movement half of the shadow copy has been folded in ──
  phaseContact(state, log);
  phaseMelee(state, log);
  if (!pursuing) phaseMissiles(state, log);
  phaseRoutKills(state, log, pursuing);
  foldCasualties(state, log);
  // ── the dead have been folded in; morale now sees one honest number ──
  phaseAttrition(state);
  // ── fatigue, cohesion and the ceiling have been folded in ──
  phaseMorale(state, log);
  sweepLosses(state, log);
  phaseArmyAndTide(state, log);
  phaseVictory(state, log);
  phaseLog(state, log);
  state.tick++;
}

/** Phase 10 runs before the casualties are folded, so a captured man is gone
 *  from the same tally as a killed one. */
function phaseRoutKills(state: BattleState, log: LogWriter, pursuing: boolean): void {
  void pursuing;
  phaseRout(state, log);
}

export interface RunOptions {
  logEnabled?: boolean;
  battleId?: string;
  maxTicks?: number;
  /** Walk the units backwards in the order-independent phases. A test switch;
   *  the battle must come out byte for byte the same either way. */
  reverseUnits?: boolean;
}

export function runBattle(
  a: Host,
  b: Host,
  ground: Ground,
  seed: string,
  ordersA: Directive[] = [],
  ordersB: Directive[] = [],
  options: RunOptions = {},
): ReplayLog {
  const input: BattleInput = { a, b, ground, seed, ordersA, ordersB };
  const state = initState(input);
  state.reverseUnits = options.reverseUnits === true;
  const log = makeLog(options.logEnabled !== false);
  const battleId = options.battleId ?? `battle-${seed}`;
  const cap = options.maxTicks ?? MAX_TICKS;

  const header: ReplayHeader = {
    version: ENGINE_VERSION,
    contract: CONTRACT,
    seed,
    rulesetHash: rulesetHash(),
    tickHz: TICK_HZ,
    field: {
      widthMm: state.terrain.widthMm,
      heightMm: state.terrain.heightMm,
      tileMm: state.terrain.tileMm,
      tilesX: state.terrain.tilesX,
      tilesY: state.terrain.tilesY,
    },
    ground,
    hosts: [a, b],
    orders: [ordersA, ordersB],
  };

  // Layer 1 — the seed of truth.
  write(log, { t: 0, k: "header", ...(header as unknown as Record<string, unknown>) });
  write(log, { t: 0, k: "terrain", ...encodeTerrain(state.terrain) });
  write(log, {
    t: 0,
    k: "roster",
    units: state.units.map((u) => ({
      i: u.idx,
      id: u.id,
      name: u.name,
      side: u.side,
      type: u.typeId,
      contingent: u.contingentId,
      strength: u.strength,
      morale: u.morale,
      ceiling: u.moraleCeiling,
      cohesion: u.cohesion,
      fatigue: u.fatigue,
    })),
    contingents: state.contingents.map((c) => ({
      id: c.id,
      side: c.side,
      name: c.name,
      captain: c.captainId,
      obedience: c.obedience,
      resolve: c.resolve,
      treachery: c.treachery,
    })),
    captains: state.captains.map((c) => ({ id: c.id, name: c.name, side: c.side, command: c.command, aggression: c.aggression })),
    // The RESOLVED sheets actually used, copied in, so an old replay survives a
    // rebalance of data/units.json.
    types: resolvedTypesFor(state.units.map((u) => u.typeId)),
  });
  write(log, { t: 0, k: "inputs", orders: [ordersA, ordersB] });

  // Layer 2 — the stream.
  const intents: Intent[] = state.units.map(() => ({ bearing: 0, tier: "STOP", facing: 0, posture: "NONE" }));
  while (state.phase !== "ENDED" && state.tick < cap) {
    step(state, log, intents);
  }
  if (state.phase !== "ENDED") {
    state.phase = "ENDED";
    state.endedReason = "the light went and nobody had won";
    write(log, { t: state.tick, k: "battle_end", side: 0, reason: state.endedReason, herald: `And so the day ended: ${state.endedReason}.` });
  }

  closingDeeds(state);
  emitTurningPoints(state, log);

  const after = {
    a: buildAftermath(state, 0, a, battleId),
    b: buildAftermath(state, 1, b, battleId),
  };
  write(log, { t: state.tick, k: "aftermath", host: a.id, body: after.a as unknown as Record<string, unknown> });
  write(log, { t: state.tick, k: "aftermath", host: b.id, body: after.b as unknown as Record<string, unknown> });

  return {
    header,
    ndjson: toNdjson(log),
    events: state.events,
    aftermath: after,
    ticks: state.tick,
    endedReason: state.endedReason,
  };
}

/** Fight the battle again from nothing but the header. This is the promise the
 *  whole design is built on, and the determinism test calls it. */
export function replayFromHeader(header: ReplayHeader, options: RunOptions = {}): ReplayLog {
  return runBattle(
    header.hosts[0],
    header.hosts[1],
    header.ground,
    header.seed,
    header.orders[0],
    header.orders[1],
    options,
  );
}

/** Which side won, for a caller that only wants the one word. */
export function winner(replay: ReplayLog): Side | null {
  if (replay.aftermath.a.heldTheField && !replay.aftermath.b.heldTheField) return 0;
  if (replay.aftermath.b.heldTheField && !replay.aftermath.a.heldTheField) return 1;
  return null;
}

/** Every herald line in the transcript, in order — the battle read as a
 *  chronicle, with no pictures at all. */
export function chronicle(replay: ReplayLog): string[] {
  const out: string[] = [];
  for (const e of replay.events) {
    const herald = e["herald"];
    if (typeof herald === "string" && herald.length > 0) {
      const seconds = idiv(e.t, K.time.tickHz);
      const m = idiv(seconds, 60);
      const s = seconds % 60;
      out.push(`${m}:${s < 10 ? "0" : ""}${s}  ${herald}`);
    }
  }
  return out;
}
