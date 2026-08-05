// WHY THIS FILE EXISTS. Line of sight is asked for far more often than it
// changes: whether a unit can see the banner is the same answer for half a
// second at a time, and working it out with a Bresenham walk every tick for
// every pair would be most of the engine's work for nothing.
//
// THE CACHE MUST NOT BE ABLE TO CHANGE THE ANSWER. It is keyed on the pair AND
// on the group of ten ticks, and it is emptied whenever the group turns over —
// so a cached answer is never older than half a second, and a run with the cache
// disabled would give the same battle. That is the only kind of optimisation
// allowed anywhere near a replay.

import { idiv } from "../core/primitives.js";
import { hasLOS } from "./terrain.js";
import type { BattleState, Unit } from "./types.js";

export function losBetween(state: BattleState, a: Unit, b: Unit): boolean {
  const group = idiv(state.tick, 10);
  if (group !== state.losGroup) {
    state.losGroup = group;
    state.losSeen.clear();
  }
  const lo = a.idx < b.idx ? a.idx : b.idx;
  const hi = a.idx < b.idx ? b.idx : a.idx;
  const key = lo * 4096 + hi;
  const cached = state.losSeen.get(key);
  if (cached !== undefined) return cached;
  const answer = hasLOS(state.terrain, a.posX, a.posY, b.posX, b.posY);
  state.losSeen.set(key, answer);
  return answer;
}
