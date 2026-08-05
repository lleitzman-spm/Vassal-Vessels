// WHY THIS FILE EXISTS. A grudge held alone is a sulk. A grudge held by four
// houses at once, about the same act, is a faction — and a faction is the rung
// on the ladder just below public defiance. This module finds them, and it finds
// them the only way this game is allowed to: by noticing that several houses
// carry a grievance pointing at the SAME record.
//
// A cabal is not a stored membership list. Settle the grudge with one of the
// four and he is simply not in it any more, the same day, with no bookkeeping.
// That is the point.

import type { Stamp } from '../core/primitives.js';
import { CHOSEN } from './codex.js';
import { readGrievances, isKnown } from './grievances.js';
import { kinOf, otherEnd } from './kin.js';
import type { Chronicle } from './records.js';
import type { Cabal } from './types.js';

/** Who is quietly agreeing with whom. */
export function readCabals(c: Chronicle, at: Stamp): Cabal[] {
  const byCause = new Map<string, { houseIds: string[]; since: Stamp; weight: number }>();

  for (const house of c.founding.houses) {
    for (const g of readGrievances(c, house.id, at)) {
      if (g.weight < CHOSEN.cabalGrievanceFloor) continue;
      const found = byCause.get(g.actId);
      if (found) {
        if (!found.houseIds.includes(house.id)) found.houseIds.push(house.id);
        found.weight += g.weight;
      } else {
        byCause.set(g.actId, { houseIds: [house.id], since: g.since, weight: g.weight });
      }
    }
  }

  const out: Cabal[] = [];
  for (const [actId, row] of byCause) {
    if (row.houseIds.length < 2) continue;
    const bound = Math.min(100, Math.round(row.weight / row.houseIds.length));
    // Kin bind tighter than strangers with the same complaint.
    const kinBonus = row.houseIds.some((h) =>
      kinOf(c, h, at).some((t) => row.houseIds.includes(otherEnd(t, h))),
    )
      ? 15
      : 0;
    out.push({
      houseIds: [...row.houseIds].sort(),
      since: row.since,
      binding: Math.min(100, bound + kinBonus),
      known: isKnown(c, actId, at),
    });
  }

  out.sort((a, b) => b.binding - a.binding || a.houseIds[0]!.localeCompare(b.houseIds[0]!));
  return out;
}

/** The houses this one would look sideways at before answering a summons. */
export function fellowsOf(c: Chronicle, houseId: string, at: Stamp): string[] {
  const fellows: string[] = [];
  for (const cabal of readCabals(c, at)) {
    if (!cabal.houseIds.includes(houseId)) continue;
    for (const id of cabal.houseIds) if (id !== houseId && !fellows.includes(id)) fellows.push(id);
  }
  return fellows;
}
