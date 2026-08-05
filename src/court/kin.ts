// WHY THIS FILE EXISTS. Who is related to whom is not written on anybody's
// record — it is read off the marriages and the births, like everything else.
// Strike a wedding and the two houses are strangers again, and every number that
// leaned on that tie moves the same day.
//
// HOW BLOOD IS TOLD FROM MARRIAGE, since the writ does not say and somebody has
// to. A `wed` record joins two captains, and through them their houses: that is
// kinship by MARRIAGE, worth eight. A `birth` recorded in one of those two
// houses afterwards makes the tie BLOOD, worth fifteen — the marriage bore a
// child and now the two houses share a grandchild. This is the reading the layer
// took, and it is logged in `docs/OPEN-QUESTIONS.md` because a different one is
// perfectly defensible.

import type { Stamp } from '../core/primitives.js';
import { COURT } from './codex.js';
import type { Act, Chronicle, HouseRecord } from './records.js';
import { captainOf } from './records.js';

export type KinDegree = 'blood' | 'marriage' | 'ward';

export interface KinTie {
  aHouseId: string;
  bHouseId: string;
  degree: KinDegree;
  actIds: string[];
}

/** The house a captain belonged to on a given day. A captain's house is on his
 *  founding record and marriage does not move him; what moves is the TIE. */
export function houseOfCaptain(c: Chronicle, captainId: string): string | null {
  return captainOf(c, captainId)?.houseId ?? null;
}

/** Every tie the records make, on the day asked. Nothing is cached: two houses
 *  are kin because there is a record saying so, and for no other reason. */
export function readKin(c: Chronicle, at: Stamp): KinTie[] {
  const acts = c.acts.filter((a) => a.at.absolute <= at.absolute);
  const ties: KinTie[] = [];

  for (const a of acts) {
    if (a.kind !== 'wed') continue;
    const aHouse = houseOfCaptain(c, a.aId);
    const bHouse = houseOfCaptain(c, a.bId);
    if (!aHouse || !bHouse || aHouse === bHouse) continue;
    const existing = ties.find((t) => sameTie(t, aHouse, bHouse));
    if (existing) existing.actIds.push(a.id);
    else ties.push({ aHouseId: aHouse, bHouseId: bHouse, degree: 'marriage', actIds: [a.id] });
  }

  // A child born into either house after the wedding turns the tie to blood.
  for (const tie of ties) {
    const wedOn = earliestOf(acts, tie.actIds);
    if (wedOn === null) continue;
    const child = acts.find(
      (a) =>
        a.kind === 'birth' &&
        a.at.absolute > wedOn &&
        (a.houseId === tie.aHouseId || a.houseId === tie.bHouseId),
    );
    if (child) {
      tie.degree = 'blood';
      tie.actIds.push(child.id);
    }
  }

  // A ward is kin of a third kind: the child lives at the crown's court, which
  // is why it works and why it is dangerous.
  for (const a of acts) {
    if (a.kind !== 'ward') continue;
    const crown = c.founding.crown.houseId;
    if (a.houseId === crown) continue;
    if (releasedOrDead(acts, a.captainId, at)) continue;
    ties.push({ aHouseId: crown, bHouseId: a.houseId, degree: 'ward', actIds: [a.id] });
  }

  return ties;
}

function sameTie(t: KinTie, a: string, b: string): boolean {
  return (t.aHouseId === a && t.bHouseId === b) || (t.aHouseId === b && t.bHouseId === a);
}

function earliestOf(acts: readonly Act[], ids: readonly string[]): number | null {
  let best: number | null = null;
  for (const a of acts) {
    if (!ids.includes(a.id)) continue;
    if (best === null || a.at.absolute < best) best = a.at.absolute;
  }
  return best;
}

/** A ward who has died is not a hostage; he is the worst grievance in the game,
 *  and that is handled among the grievances, not here. */
function releasedOrDead(acts: readonly Act[], captainId: string, at: Stamp): boolean {
  return acts.some(
    (a) => a.kind === 'death' && a.captainId === captainId && a.at.absolute <= at.absolute,
  );
}

/** The ties a single house has, on the day asked. */
export function kinOf(c: Chronicle, houseId: string, at: Stamp): KinTie[] {
  return readKin(c, at).filter((t) => t.aHouseId === houseId || t.bHouseId === houseId);
}

/** The other end of a tie. */
export function otherEnd(t: KinTie, houseId: string): string {
  return t.aHouseId === houseId ? t.bHouseId : t.aHouseId;
}

/** What a tie to the CROWN is worth in loyalty. Blood fifteen, marriage eight; a
 *  wardship is worth nothing here on purpose — it buys obedience by holding a
 *  child, and pretending it also buys affection would be the game lying to the
 *  player about what hostages are. */
export function kinshipWorth(degree: KinDegree): number {
  if (degree === 'blood') return COURT.loyalty.kinshipBlood;
  if (degree === 'marriage') return COURT.loyalty.kinshipMarriage;
  return 0;
}

/** Is this house's heir currently held at the crown's court? Worth twenty in
 *  willingness and minus thirty in treachery, which is what hostages were for. */
export function heirIsWard(c: Chronicle, house: HouseRecord, at: Stamp): { held: boolean; actId: string | null } {
  const acts = c.acts.filter((a) => a.at.absolute <= at.absolute);
  for (const a of acts) {
    if (a.kind !== 'ward') continue;
    if (a.houseId !== house.id) continue;
    if (house.heirCaptainId && a.captainId !== house.heirCaptainId) continue;
    if (releasedOrDead(acts, a.captainId, at)) continue;
    return { held: true, actId: a.id };
  }
  return { held: false, actId: null };
}

/** Who speaks for a house today. The founding lord until a death record says
 *  otherwise, and then the heir. An heir takes half of everything his father was
 *  owed and half of everything his father was owed FOR — killing a difficult
 *  lord only ever half-solves the problem. */
export function lordAt(c: Chronicle, houseId: string, at: Stamp): { captainId: string; succeeded: boolean; onDay: Stamp | null } {
  const house = c.founding.houses.find((h) => h.id === houseId);
  if (!house) return { captainId: '', succeeded: false, onDay: null };
  const death = c.acts.find(
    (a) => a.kind === 'death' && a.captainId === house.lordCaptainId && a.at.absolute <= at.absolute,
  );
  if (death && house.heirCaptainId) {
    return { captainId: house.heirCaptainId, succeeded: true, onDay: death.at };
  }
  return { captainId: house.lordCaptainId, succeeded: false, onDay: null };
}
