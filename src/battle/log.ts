// WHY THIS FILE EXISTS, AND WHY IT GOES IN AT STEP ONE. The replay log is not a
// side effect of the battle; it IS the battle's output. A front end has not been
// written and may never be: the engine is tuned against text, and the day the
// heralds read like a chronicle is the day the format is finished.
//
// TWO PROMISES THIS MODULE MAKES.
//
// 1. APPEND-ONLY AND SIDE-EFFECT FREE. Turning the log off must not change a
//    single value in the simulation. Nothing here may be handed a live object it
//    could mutate, and nothing here may consume a random number. The `enabled`
//    switch below only decides whether lines are kept; the EVENTS still happen,
//    because events are state (law 1) and the Tide is read off them.
//
// 2. THE HEADER REPRODUCES THE STREAM. Version, seed, ruleset hash, the tiles,
//    both rosters with the resolved type sheets copied in, and every directive
//    with the tick it was given. Feed that header back to `runBattle` and the
//    events come out byte for byte the same. There is a test, and it is the most
//    important test in the repository.

import type { EventRecord } from "./types.js";

export interface LogWriter {
  lines: string[];
  enabled: boolean;
  /** Every event, in the order it happened. The header and the frames are in
   *  `lines`; this is the narratable subset, kept so a reader does not have to
   *  parse. */
  events: EventRecord[];
}

export function makeLog(enabled: boolean): LogWriter {
  return { lines: [], enabled, events: [] };
}

/** Write one NDJSON line. `t` is non-decreasing across the whole file, which is
 *  what lets a reader stream it without buffering. */
export function write(log: LogWriter, record: Record<string, unknown>): void {
  if (!log.enabled) return;
  log.lines.push(JSON.stringify(record));
}

/** The whole log as one NDJSON document. */
export function toNdjson(log: LogWriter): string {
  return log.lines.join("\n");
}

/** Read a log back — the reverse of `write`, for the tests and for anything that
 *  wants to recompute a reading (the Tide) from the transcript alone. */
export function parseNdjson(text: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const line of text.split("\n")) {
    if (line.length === 0) continue;
    out.push(JSON.parse(line) as Record<string, unknown>);
  }
  return out;
}
