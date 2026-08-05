// WHY THIS FILE EXISTS. "If I called the host today, what would stand?" — free
// to look at, always current, and the screen the player lives on. One fused
// gauge with every absence named and every unspent lever priced, so the road
// from "that is bad" to "here is what I can do about it" is on the same page as
// the number. A surface that reports a state and makes you navigate elsewhere to
// change it has failed.
//
// The forecast invents a war that has not been declared — a plausible cause, a
// plausible stand-by day — so that it can ask every house the question without
// anybody having to commit to anything. Nothing is written; the invented
// occasion never touches the chronicle.

import type { Men, Stamp } from '../core/primitives.js';
import { CAUSES, COURT } from './codex.js';
import type { Occasion } from './answer.js';
import { readAnswerFor, readOccasion, soonestStandBy } from './answer.js';
import { addDays } from './calendar.js';
import { holdingsOf } from './distance.js';
import { readGrievances } from './grievances.js';
import { readPrice } from './price.js';
import type { Act, Chronicle } from './records.js';
import { houseOf } from './records.js';
import { seatIsFilled } from './seats.js';
import type { Absence } from './contract.js';
import type { AnswerReading, Forecast, Price } from './types.js';

export function readForecast(
  c: Chronicle,
  at: Stamp,
  opts: { musteringPlaceId: string; defending: boolean; campaignId?: string },
): Forecast {
  const houseIds = c.founding.houses
    .filter((h) => h.id !== c.founding.crown.houseId)
    .filter((h) => holdingsOf(c, h.id, at).length > 0)
    .map((h) => h.id);

  const occ = opts.campaignId
    ? readOccasion(c, opts.campaignId, at)
    : null;
  const occasion: Occasion = occ ?? {
    campaignId: 'forecast',
    causeId: opts.defending ? 'defence-of-the-realm' : 'a-just-claim',
    causeName: opts.defending
      ? CAUSES['defence-of-the-realm']!.name
      : CAUSES['a-just-claim']!.name,
    defending: opts.defending,
    blessed: false,
    great: false,
    musteringPlaceId: opts.musteringPlaceId,
    standBy: soonestStandBy(c, houseIds, opts.musteringPlaceId, at),
    sentOn: at,
    summonActId: null,
    calledIds: houseIds,
  };

  const byHouse: AnswerReading[] = [];
  const absent: Absence[] = [];
  let men: Men = 0;

  for (const houseId of occasion.calledIds) {
    const house = houseOf(c, houseId);
    if (!house) continue;
    const answer = readAnswerFor(c, occasion, houseId, at);
    byHouse.push(answer);
    men += answer.sending;
    if (answer.sending < answer.owed) {
      const worst = readGrievances(c, houseId, at)[0];
      absent.push({
        whoId: houseId,
        whoName: house.name,
        kind: 'house',
        answer: answer.answer,
        owed: answer.owed,
        sent: answer.sending,
        reason: answer.sending <= 0 ? 'Would not come.' : `Would owe ${answer.owed} and send ${answer.sending}.`,
        explains: worst
          ? worst.explains
          : 'There is no grudge behind this one — only distance, or a dry vessel, or the season.',
        grievanceActIds: readGrievances(c, houseId, at).map((g) => g.actId),
      });
    }
  }

  return {
    men,
    byHouse,
    absent,
    standsOn: occasion.standBy,
    levers: leversFor(c, at, occasion),
  };
}

/** The player's move list: the acts worth considering right now, each with its
 *  price already worked out. Proximity of information to action — the act stands
 *  beside the record it changes. */
function leversFor(c: Chronicle, at: Stamp, occ: Occasion): { act: Act; price: Price }[] {
  const out: { act: Act; price: Price }[] = [];
  const propose = (act: Act): void => {
    out.push({ act, price: readPrice(c, act, at) });
  };

  // Fill an empty seat with its loudest claimant.
  for (const seat of c.founding.seats) {
    if (seatIsFilled(c, seat.id, at)) continue;
    const claimant = [...c.founding.captains]
      .filter((p) => (p.claims[seat.id] ?? 0) > 0)
      .sort((a, b) => (b.claims[seat.id] ?? 0) - (a.claims[seat.id] ?? 0))[0];
    if (!claimant) continue;
    propose({
      id: `lever:invest:${seat.id}`,
      at,
      by: 'crown',
      kind: 'invest',
      seatId: seat.id,
      captainId: claimant.id,
      note: `Grant ${seat.name} to ${claimant.name}.`,
    });
  }

  // Settle the loudest grudge in the realm with coin.
  let loudest: { houseId: string; actId: string; weight: number } | null = null;
  for (const h of c.founding.houses) {
    for (const g of readGrievances(c, h.id, at)) {
      if (!loudest || g.weight > loudest.weight) {
        loudest = { houseId: h.id, actId: g.actId, weight: g.weight };
      }
    }
  }
  if (loudest) {
    propose({
      id: 'lever:amends',
      at,
      by: 'crown',
      kind: 'amends',
      houseId: loudest.houseId,
      method: 'wergild',
      settles: [{ grievanceActId: loudest.actId, points: Math.ceil(loudest.weight) }],
      crowns: Math.ceil(loudest.weight) * 10,
      note: 'Pay the wergild and have done with it.',
    });
  }

  // Charter the biggest town that has not bought its liberties.
  const town = c.founding.holdings.find(
    (h) => h.typeId === 'town' && !c.acts.some((a) => a.kind === 'charter' && a.holdingId === h.id),
  );
  if (town) {
    propose({
      id: 'lever:charter',
      at,
      by: 'crown',
      kind: 'charter',
      holdingId: town.id,
      libertyShare: 0.2,
      note: `Sell ${town.name} its liberties: spears now, a fifth of its tax forever.`,
    });
  }

  // Bless the cause, if a Chaplain is seated and nobody has.
  if (occ.summonActId && !occ.blessed) {
    propose({
      id: 'lever:proclaim-blessed',
      at,
      by: 'crown',
      kind: 'proclaim',
      campaignId: occ.campaignId,
      causeId: occ.causeId,
      defending: occ.defending,
      blessed: true,
      note: 'Have the Chaplain bless the cause and open the road to the Sworn Order.',
    });
  }

  return out;
}

/** How many men a forecast expects, and by when — the two numbers a war council
 *  actually argues about. */
export function readMusterStrength(
  c: Chronicle,
  at: Stamp,
  opts: { musteringPlaceId: string; defending: boolean },
): { men: Men; standsOn: Stamp; daysFromNow: number } {
  const f = readForecast(c, at, opts);
  return {
    men: f.men,
    standsOn: f.standsOn,
    daysFromNow: f.standsOn.absolute - at.absolute,
  };
}

/** A day far enough out that the whole realm could be there — for a screen that
 *  wants to say "call them now and they stand on this day". */
export function earliestFullMuster(c: Chronicle, at: Stamp, placeId: string): Stamp {
  const houseIds = c.founding.houses.map((h) => h.id);
  const day = soonestStandBy(c, houseIds, placeId, at);
  return addDays(day, COURT.march.gatherDaysMin);
}
