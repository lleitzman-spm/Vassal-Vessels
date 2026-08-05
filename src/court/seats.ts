// WHY THIS FILE EXISTS. A seat is three things at once and this module computes
// all three: it is TIME (a second day-book on the calendar), it is a LEVER on
// the muster filtered through whoever holds it, and it is a GRIEVANCE MACHINE in
// both directions — grant it and everyone passed over sours, leave it empty and
// the claimants sour slowly while the crown does the job at half effect.
//
// THE ONE RULE THAT MAKES SEATS FEEL RIGHT: a seat is never worse than empty,
// only wasted. A fool in the Chancellery still gets letters out faster than
// nobody; he just wastes most of what the office could have been. So the effect
// has a floor at half, and the arithmetic below never drops through it.
//
// The Marshalcy is the loud one. It sets `orderCapacity`, which the battle
// spends as couriers and standing-plan slots — the court's most direct hand on
// the battle's controls, and the reason a player who never filled the seat
// fights the whole war two orders at a time.

import type { Score, Stamp, Tally } from '../core/primitives.js';
import { COURT, SEAT } from './codex.js';
import { readLoyalty } from './loyalty.js';
import type { Chronicle } from './records.js';
import { captainOf, seatOf } from './records.js';
import { holderOf, revocationGrievance, tenureFromYears, yearsHeld } from './tenure.js';
import { clampedTally, round2, term } from './tally.js';
import type { SeatReading } from './types.js';

/** The seat, its holder, what it is worth today and what taking it back would
 *  cost. */
export function readSeat(c: Chronicle, seatId: string, at: Stamp): SeatReading {
  const seat = seatOf(c, seatId) ?? { id: seatId, name: seatId, base: {} };
  const held = holderOf(c, seatId, at);
  const strength = seat.base['strength'] ?? 1;

  const terms = [];
  if (!held) {
    terms.push(
      term(
        'Vacant — the crown does it',
        'Nobody holds this office, so the crown does the work itself, at half of what the office could be.',
        round2(strength * COURT.seats.vacantEffect),
      ),
    );
  } else {
    const p = captainOf(c, held.captainId);
    const competence = competenceFor(seatId, p);
    const loyalty = p?.houseId ? readLoyalty(c, p.houseId, at).value : 100;
    const loyaltyFactor =
      COURT.seats.loyaltyFactorFloor + (COURT.seats.loyaltyFactorPer100Loyalty * loyalty) / 100;
    const raw = strength * (competence / 100) * loyaltyFactor;
    const floor = strength * COURT.seats.vacantEffect;

    terms.push(
      term(
        `${p?.name ?? held.captainId} holds it`,
        `He is worth ${Math.round(competence)} out of a hundred at this particular office.`,
        round2(strength * (competence / 100)),
        [held.actId],
      ),
    );
    terms.push(
      term(
        'And how far he is yours',
        `A man at ${Math.round(loyalty)} loyalty works this office at ${Math.round(loyaltyFactor * 100)} per cent of his own ability.`,
        round2(raw - strength * (competence / 100)),
        [held.actId],
      ),
    );
    if (raw < floor) {
      terms.push(
        term(
          'Never worse than empty',
          'A seat is never worse than empty, only wasted. The crown would do this much itself.',
          round2(floor - raw),
          [held.actId],
        ),
      );
    }
  }

  const effect: Tally = clampedTally(terms, strength * COURT.seats.vacantEffect, strength);
  const years = yearsHeld(c, seatId, at);

  const claimants: SeatReading['claimants'] = [];
  for (const p of c.founding.captains) {
    const claim = p.claims[seatId] ?? 0;
    if (claim <= 0) continue;
    if (held && held.captainId === p.id) continue;
    claimants.push({
      captainId: p.id,
      claim,
      grievance: claim * COURT.seats.passedOverPerClaimPoint,
    });
  }
  claimants.sort((a, b) => b.claim - a.claim || a.captainId.localeCompare(b.captainId));

  return {
    seat,
    holderCaptainId: held?.captainId ?? null,
    since: held?.from ?? null,
    effect,
    tenure: tenureFromYears(years, held !== null),
    revocationGrievance: held ? revocationGrievance(years) : 0,
    claimants,
  };
}

/** What a seat is worth as a plain factor between a half and one — the shape
 *  every other formula wants. */
export function seatEffect(c: Chronicle, seatId: string, at: Stamp): number {
  const r = readSeat(c, seatId, at);
  const strength = r.seat.base['strength'] ?? 1;
  return strength === 0 ? 0 : r.effect.value / strength;
}

export function seatIsFilled(c: Chronicle, seatId: string, at: Stamp): boolean {
  return holderOf(c, seatId, at) !== null;
}

/** Which of a captain's three competences an office actually uses. A Marshal is
 *  judged on command, a Spymaster on wits, a Chaplain on the standing his house
 *  already has — and a man good at one is not thereby good at another. */
function competenceFor(
  seatId: string,
  p: { command: Score; valour: Score; wits: Score } | undefined,
): number {
  if (!p) return 0;
  switch (seatId) {
    case SEAT.marshal:
      return p.command;
    case SEAT.constable:
      return Math.round((p.command + p.valour) / 2);
    case SEAT.chancellor:
    case SEAT.spymaster:
      return p.wits;
    case SEAT.justiciar:
      return Math.round((p.wits + p.valour) / 2);
    case SEAT.steward:
      return Math.round((p.wits + p.command) / 2);
    case SEAT.chaplain:
      return Math.round((p.valour + p.wits) / 2);
    default:
      return Math.round((p.command + p.wits + p.valour) / 3);
  }
}

// ── The Marshalcy, which the battle can feel ───────────────────────────────

/** HOW MANY CONTINGENTS CAN BE GIVEN A TACTIC AT ONE TIME. Two if the Marshalcy
 *  is vacant; four for a seated Marshal; one more for every twenty-five points
 *  of command above fifty, so a great Marshal is worth six.
 *
 *  This is the court's fingerprint on the battlefield. The battle spends it as
 *  couriers and standing-plan slots, so a player who never filled the seat is
 *  fighting the whole war two orders at a time and can point at the day he
 *  decided that. */
export function readOrderCapacity(c: Chronicle, at: Stamp): number {
  const held = holderOf(c, SEAT.marshal, at);
  if (!held) return COURT.battleJoins.orderCapacityVacantMarshal;
  const p = captainOf(c, held.captainId);
  const above = Math.max(0, (p?.command ?? 50) - 50);
  return Math.floor(
    COURT.battleJoins.orderCapacityBaseMarshal +
      above * COURT.battleJoins.orderCapacityPerCompetenceAbove50,
  );
}

/** How far the host defers to whoever is commanding. Forty, plus forty times the
 *  Marshal's effect, plus a fifth of the commander's own standing, plus ten if
 *  he is the crown's own blood. */
export function readAuthority(c: Chronicle, commanderId: string, standing: Score, at: Stamp): Tally {
  const j = COURT.battleJoins;
  const effect = seatEffect(c, SEAT.marshal, at);
  const filled = seatIsFilled(c, SEAT.marshal, at);
  const p = captainOf(c, commanderId);
  const crownBlood = p?.houseId === c.founding.crown.houseId;

  const terms = [
    term('A crown is obeyed', 'Men do as the crown says, up to a point, because he is the crown.', j.authorityBase),
    term(
      filled ? 'Your Marshal' : 'No Marshal',
      filled
        ? 'The office of Marshal is filled, and the host knows whose word carries.'
        : 'Nobody holds the Marshalcy, so the crown does the work at half of what it could be.',
      round2(j.authorityPerEffect * effect),
    ),
    term(
      'His own standing',
      'A man the court already listens to is listened to on the field.',
      round2(standing / j.authorityStandingDivisor),
    ),
  ];
  if (crownBlood) {
    terms.push(
      term('The crown’s own blood', 'He is family, and everyone knows it.', j.authorityCrownBloodBonus),
    );
  }
  return clampedTally(terms, 0, 100);
}
