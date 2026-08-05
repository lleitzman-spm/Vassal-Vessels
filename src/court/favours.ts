// WHY THIS FILE EXISTS. Generosity is a subscription, not a purchase. That one
// sentence is the whole asymmetry the court runs on: grudges are settled or
// inherited but never fade, while kindnesses decay on a half-life and have to be
// renewed. A crown that bought a house's love ten years ago and has done nothing
// since is a crown that has been quietly slipping the whole time, and this
// module is where that slipping is computed — freshly, every time, from the acts
// that were generous.
//
// TWO PARTS TO EVERY FAVOUR. `standing` holds while the thing is still TRUE — he
// still has the seat, he still has the land — and vanishes the day it stops
// being true. `fading` is the memory of the act itself, halving on its own
// clock. A seat granted is worth fifteen while he holds it and eight that fades;
// take the seat back and only the fading half remains, on top of a fresh grudge.

import type { Stamp } from '../core/primitives.js';
import { COURT, FAVOURS } from './codex.js';
import { yearsBetween } from './calendar.js';
import { holdingsOf, leaguesFrom } from './distance.js';
import { holderOfHolding } from './grievances.js';
import type { Chronicle } from './records.js';
import { captainOf } from './records.js';
import { holderOf } from './tenure.js';
import { round2 } from './tally.js';
import type { Favour } from './types.js';

/** Every kindness a house is still carrying, decayed to the day asked. */
export function readFavours(c: Chronicle, houseId: string, at: Stamp): Favour[] {
  const out: Favour[] = [];
  const acts = c.acts.filter((a) => a.at.absolute <= at.absolute);

  const add = (
    actId: string,
    kind: string,
    since: Stamp,
    stillTrue: boolean,
    explains: string,
  ): void => {
    const row = FAVOURS[kind];
    if (!row) return;
    const years = yearsBetween(since, at);
    const fading = row.fading * Math.pow(0.5, years / row.halfLifeYears);
    const standing = stillTrue ? row.standing : 0;
    if (standing + fading < 0.05) return; // nothing left of it worth printing
    out.push({
      actId,
      kind,
      houseId,
      standing: round2(standing),
      fading: round2(fading),
      halfLifeYears: row.halfLifeYears,
      explains,
    });
  };

  for (const a of acts) {
    switch (a.kind) {
      case 'invest': {
        const p = captainOf(c, a.captainId);
        if (!p || p.houseId !== houseId) break;
        const stillHolds = holderOf(c, a.seatId, at)?.captainId === a.captainId;
        add(a.id, 'seat-granted', a.at, stillHolds, `${p.name} was given the ${a.seatId}.`);
        break;
      }

      case 'enfeoff': {
        if (a.houseId !== houseId) break;
        // THE LAND THEY ALREADY HAD IS NOT A KINDNESS. A grant written on the
        // founding day is the status quo — it is what makes them a house at all
        // — and counting it as generosity would put every vassal in the realm at
        // seventy before the crown had done a single thing. A grant made LATER
        // is the most generous currency in the game, and it never wears out.
        if (a.at.absolute <= c.founding.founding.absolute) break;
        // Only a grant still in force is still a kindness. Strike it, or grant
        // the same holding to somebody else, and the standing half goes the same
        // day.
        const stillTheirs = holderOfHolding(c, a.holdingId, at) === houseId;
        add(a.id, 'land-granted', a.at, stillTheirs, `They were granted ${a.holdingId}.`);
        break;
      }

      case 'amends': {
        if (a.houseId !== houseId) break;
        const kind = a.method === 'grant' ? 'land-granted' : a.method;
        add(a.id, kind, a.at, a.method === 'grant', `Amends were made: ${a.method}.`);
        break;
      }

      case 'feast': {
        if (!a.invitedHouseIds.includes(houseId)) break;
        add(a.id, 'feast', a.at, false, 'They ate at your table where everyone could see it.');
        break;
      }

      case 'tourney': {
        add(a.id, 'tourney', a.at, false, 'You held a tourney and their young men had somewhere to be.');
        break;
      }

      case 'betroth': {
        const aHouse = captainOf(c, a.aId)?.houseId;
        const bHouse = captainOf(c, a.bId)?.houseId;
        if (aHouse !== houseId && bHouse !== houseId) break;
        const wed = acts.some(
          (w) => w.kind === 'wed' && w.aId === a.aId && w.bId === a.bId && w.at.absolute >= a.at.absolute,
        );
        // Once the wedding happens the promise stops being a favour and becomes
        // kinship, which is counted in the loyalty reading instead. Counting
        // both would be counting the same fact twice.
        if (wed) break;
        add(a.id, 'betrothal', a.at, true, 'A marriage is promised between your houses.');
        break;
      }

      case 'ransom-paid': {
        const p = captainOf(c, a.subjectId);
        if (!p || p.houseId !== houseId) break;
        add(a.id, 'ransom-paid', a.at, false, `You bought ${p.name} out of a cell.`);
        break;
      }

      case 'summon': {
        // Bringing the host to a house's own border, in its defence, is a
        // kindness it remembers — and one the records already contain.
        if (!a.calledIds.includes(houseId)) break;
        const proclaim = acts.find(
          (x) => x.kind === 'proclaim' && x.campaignId === a.campaignId,
        );
        if (!proclaim || proclaim.kind !== 'proclaim' || !proclaim.defending) break;
        const near = holdingsOf(c, houseId, a.at).some(
          (h) => leaguesFrom(h, a.musteringPlaceId) <= 20,
        );
        if (!near) break;
        add(a.id, 'defended-his-land', a.at, false, 'You brought the host to their border when it was their border burning.');
        break;
      }

      default:
        break;
    }
  }

  out.sort((x, y) => y.standing + y.fading - (x.standing + x.fading));
  return out;
}

/** What the favours are worth today, all told. */
export function favourWorth(f: Favour): number {
  return round2(f.standing + f.fading);
}

/** The half-life in days, for anyone drawing a graph of the crown's slipping
 *  generosity. */
export function halfLifeDays(f: Favour): number {
  return f.halfLifeYears * COURT.calendar.daysPerYear;
}
