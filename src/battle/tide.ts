// WHY THIS FILE EXISTS. The Tide is a side's momentum, and it is the single
// coupling from which the whole dramatic arc of a battle emerges — probing, the
// press, the crisis, the break, the rout. Every unit's morale drifts with its
// side's Tide, so winning firms an army up and losing makes it brittle, and the
// fifteen-second half-life is the anti-snowball: an early advantage evaporates
// unless it is pressed.
//
// THE THING TO UNDERSTAND, AND THE REASON IT LIVES IN ITS OWN FILE. THE TIDE IS
// NOT A COUNTER. Nothing anywhere adds to it or takes from it. It is a READING
// taken over the last thirty seconds of the event record, decayed and clamped —
// delete the events and the Tide is gone (law 1). An implementation is allowed
// to cache the last reading for convenience, and this engine does, but the
// cached number is never the truth: the determinism test recomputes the Tide
// from the replay log's own event lines and asserts it equals every logged
// value. If somebody ever "optimises" this into a running total, that test is
// what will catch it.

import { clamp, idiv } from "../core/primitives.js";
import { TIDE_DECAY } from "../core/tables.js";
import { K } from "./rules.js";
import type { EventRecord, Side } from "./types.js";

const W = K.tide.weights;

/** What one event is worth to ONE side. Everything is written from that side's
 *  point of view: an enemy unit breaking is good news, your own breaking is the
 *  same number with the other sign. */
export function tideWeight(kind: string, eventSide: number, readingSide: number, count: number): number {
  const mine = eventSide === readingSide;
  switch (kind) {
    case "rout_begin":
      return mine ? W.ownUnitBroke : W.enemyUnitBroke;
    case "captain_fell":
      return mine ? W.ownCaptainFell : W.enemyCaptainFell;
    case "banner_fell":
      return mine ? W.ownBannerFell : W.enemyBannerFell;
    case "shock":
      // A charge that lands is a fact about the side that delivered it, and
      // nothing at all about the side that received it beyond its own dead.
      return mine ? W.chargeLanded : 0;
    case "ground_gained":
      return mine ? W.groundGainedPer20m * count : 0;
    default:
      return 0;
  }
}

/** The Tide for one side at one moment, read over an event list.
 *
 *  `fromIndex` is a pure optimisation — the caller may pass the index of the
 *  first event still inside the window — and it changes nothing: passing 0
 *  gives the identical answer, and the determinism test relies on that. */
export function readTide(events: readonly EventRecord[], nowTick: number, side: Side, fromIndex = 0): number {
  const windowStart = nowTick - K.tide.windowTicks;
  let total = 0;
  for (let i = fromIndex; i < events.length; i++) {
    const e = events[i] as EventRecord;
    if (e.t < windowStart) continue;
    if (e.t > nowTick) break;
    const eventSide = typeof e["side"] === "number" ? (e["side"] as number) : -1;
    if (eventSide < 0) continue;
    const count = typeof e["tideCount"] === "number" ? (e["tideCount"] as number) : 1;
    const w = tideWeight(e.k, eventSide, side, count);
    if (w === 0) continue;
    const ageSeconds = idiv(nowTick - e.t, K.tide.readEveryTicks);
    const decay = TIDE_DECAY[ageSeconds < TIDE_DECAY.length ? ageSeconds : TIDE_DECAY.length - 1] as number;
    total += w * decay;
  }
  return clamp(idiv(total, 4096), -K.tide.clamp, K.tide.clamp);
}

/** Walk the window pointer forward. Nothing but a scan hint. */
export function advanceTideWindow(events: readonly EventRecord[], nowTick: number, from: number): number {
  const windowStart = nowTick - K.tide.windowTicks;
  let i = from;
  while (i < events.length && (events[i] as EventRecord).t < windowStart) i++;
  return i;
}
