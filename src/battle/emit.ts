// WHY THIS FILE EXISTS. Every event goes two places at once: into the battle's
// own record, because readings like the Tide are computed off it (law 1), and
// into the replay log, because that is the deliverable. One door, so the two can
// never drift apart.
//
// AND EVERY EVENT CARRIES ITS REASONS (law 4). A `morale` event logs each of the
// terms that summed to it; an `interpretation` logs every term of the heed; a
// `shock` logs the speed the refusal took away. The answer to "why did I lose?"
// is printed, never guessed — which is also why the herald string is not
// decoration: it is the record made readable.

import { write } from "./log.js";
import type { BattleState, EventRecord } from "./types.js";
import type { LogWriter } from "./log.js";

export function emit(
  state: BattleState,
  log: LogWriter,
  kind: string,
  payload: Record<string, unknown>,
): EventRecord {
  const rec: EventRecord = { t: state.tick, k: kind, ...payload };
  state.events.push(rec);
  log.events.push(rec);
  write(log, rec as unknown as Record<string, unknown>);
  return rec;
}

/** Record a named moment for the court. Deeds are the chronicle's memory: the
 *  lines a player reads three years later when deciding whether to trust a man.
 *  Emit generously. */
export function deed(
  state: BattleState,
  log: LogWriter,
  kind: string,
  captainId: string | null,
  unitId: string | null,
  tale: string,
): void {
  const id = `deed-${state.deeds.length + 1}`;
  state.deeds.push({ id, kind, captainId, unitId, tick: state.tick, tale });
  emit(state, log, "deed", { id, kind, captainId, unitId, herald: tale });
}
