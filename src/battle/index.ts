// The battle, from outside. Everything a caller needs and nothing it does not:
// hand in two Hosts, some ground, a seed and two lists of directives, and get
// back a replay log whose last two records are the Aftermaths the court absorbs.

export { runBattle, replayFromHeader, chronicle, winner, rulesetHash, ENGINE_VERSION } from "./engine.js";
export type { ReplayHeader, ReplayLog, RunOptions } from "./engine.js";
export { parseNdjson } from "./log.js";
export { readTide, tideWeight } from "./tide.js";
export { CHARGES, TRIGGERS, allOrderIds, orderSheet } from "./orders.js";
export { QUIRKS, HONOURED_QUIRK_IDS } from "./herald.js";
export { GROUNDS } from "./terrain.js";
export { unitType, formation } from "./catalog.js";
export { computeHeed, applyInterpretation, contingentUnits, captainOf } from "./phase-command.js";
export { meleeOneWay, armourEff, woundPermille } from "./phase-fight.js";
export { initState } from "./setup.js";
export type { BattleInput } from "./setup.js";
export type {
  BattleState,
  ChargeId,
  Directive,
  Interpretation,
  OrderId,
  OrderParams,
  PlanBinding,
  Posture,
  Side,
  TriggerId,
  Unit,
} from "./types.js";
