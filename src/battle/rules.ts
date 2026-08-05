// WHY THIS FILE EXISTS. Law 6 of the constitution says a number that is not in
// `data/` does not exist, and that a playtest tunes exactly one file. So the
// engine reads `data/constants.json` itself rather than keeping a second copy in
// TypeScript that would immediately start to lie. This module is the single door
// through which every tuned number enters the simulation.
//
// Anything the engine needs that is NOT in the data files is declared where it
// is used, with a comment saying so, and is written down in
// `docs/OPEN-QUESTIONS.md`. There are four such holes and they are all the same
// hole: `data/orders.json`, `data/standing-plans.json`, `data/captains.json` and
// `data/terrain.json` are named by the writ but are not in this repository yet.

import constants from "../../data/constants.json";

/** Every tuned battle number. Referenced through the writ's own name, `K`. */
export const K = constants.battle;

/** Twenty slices a second, and every slice does the same work in the same
 *  order. That is what makes a replay a replay. */
export const TICK_HZ = K.time.tickHz;

/** How many ticks a battle is PLANNED to last — the yardstick that turns a
 *  latecomer's "a quarter of the way through" into a tick number. */
export const PLANNED_TICKS = K.time.plannedBattleTicks;

/** The hard stop. A battle that has not decided itself by here is a draw. */
export const MAX_TICKS = K.time.maxTicks;

/** The three feeling bars run 0..1,000,000 inside the machine. */
export const BAR_MAX = K.scales.barMax;
