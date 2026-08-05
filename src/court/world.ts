// WHY THIS FILE EXISTS. The world has a hand of its own — harvests, raids,
// plague, deaths, births, and people arriving at the gate wanting something.
// This is the ONLY place in the court where a die is thrown, and it is thrown
// from a seeded formula so the same chronicle always has the same weather.
//
// THE DICE NEVER TOUCH THE MUSTER. They write RECORDS; the muster arithmetic
// then reads those records with no randomness anywhere in its path. That
// separation is law 2 and it is not negotiable: a bad harvest can starve your
// army, but it does so by being a fact in the book that you could have read.
//
// The world clock does not advance time by itself either. It is asked to catch
// up to a day, and it appends what happened on the way. There is no end-turn.

import type { Stamp } from '../core/primitives.js';
import { makeRng, rnd, rollPermille } from '../core/primitives.js';
import { COURT, HOLDING_TYPES } from './codex.js';
import { readNow, stampOf } from './calendar.js';
import { holderOfHolding } from './grievances.js';
import type { Act, Chronicle } from './records.js';

/** Advances the seeded world clock to `to`, returning the acts it appends. The
 *  caller decides whether to keep them — they are a proposal, not a mutation. */
export function turnTheWorld(c: Chronicle, to: Stamp): Act[] {
  const from = readNow(c);
  if (to.absolute <= from.absolute) return [];

  const out: Act[] = [];
  const firstYear = from.year;
  const lastYear = to.year;

  for (let year = firstYear; year <= lastYear; year++) {
    // One private stream per year, seeded from the chronicle's own die, so
    // asking twice gives the same weather and asking for a later year never
    // changes an earlier one.
    const rng = makeRng(`${c.seed}:y${year}`);

    // ── The harvest. Every farm, once a year, on the fortieth day of Harvest.
    const harvestDay = stampOf(year, 'harvest', 40);
    if (inWindow(harvestDay, from, to)) {
      for (const holding of c.founding.holdings) {
        const type = HOLDING_TYPES[holding.typeId];
        if (!type || type.grainPerSeason <= 0) continue;
        const quality = 60 + rnd(rng, 81); // 0.60 .. 1.40 of an ordinary crop
        out.push({
          id: `w:${year}:harvest:${holding.id}`,
          at: harvestDay,
          by: 'world',
          kind: 'harvest',
          holdingId: holding.id,
          quality: quality / 100,
          note:
            quality < 80
              ? 'A thin year. The barns will not be full.'
              : quality > 120
                ? 'A fat year. Everything is easier for a while.'
                : 'An ordinary crop.',
        });
      }
    }

    // ── Raiding season. The frontier gets it, because that is what a frontier
    //    is; a march-fort is the answer and never a cure.
    const raidDay = stampOf(year, 'highsun', 20);
    if (inWindow(raidDay, from, to)) {
      for (const holding of c.founding.holdings) {
        const exposed = holding.typeId === 'march-fort' || holding.road === 'path';
        if (!exposed) continue;
        if (!rollPermille(rng, 250)) continue;
        const menLost = 4 + rnd(rng, 12);
        out.push({
          id: `w:${year}:raid:${holding.id}`,
          at: raidDay,
          by: 'world',
          kind: 'raid',
          holdingId: holding.id,
          menLost,
          ravaged: menLost > 12,
          note: `Riders came over the border and took ${menLost} men and whatever else was loose.`,
        });
      }
    }

    // ── Plague. Rare, and it does not care whose land it is on.
    const plagueDay = stampOf(year, 'wolfmoon', 10);
    if (inWindow(plagueDay, from, to) && rollPermille(rng, 90)) {
      const holdings = c.founding.holdings;
      const struck = holdings[rnd(rng, Math.max(1, holdings.length))];
      if (struck) {
        const severity = 10 + rnd(rng, 30);
        out.push({
          id: `w:${year}:pestilence:${struck.id}`,
          at: plagueDay,
          by: 'world',
          kind: 'pestilence',
          holdingId: struck.id,
          severity,
          note: 'A sickness in the winter quarters. It takes whoever it takes.',
        });
      }
    }

    // ── Deaths. Old men die, and their heirs take half of everything.
    const deathDay = stampOf(year, 'wolfmoon', 60);
    if (inWindow(deathDay, from, to)) {
      for (const p of c.founding.captains) {
        const age = year - p.born;
        if (age < 55) continue;
        const alreadyDead = c.acts.some((a) => a.kind === 'death' && a.captainId === p.id);
        if (alreadyDead) continue;
        const chance = Math.min(400, (age - 50) * 12);
        if (!rollPermille(rng, chance)) continue;
        out.push({
          id: `w:${year}:death:${p.id}`,
          at: deathDay,
          by: 'world',
          kind: 'death',
          captainId: p.id,
          cause: 'age and a hard winter',
          note: `${p.name} died at ${age}.`,
        });
      }
    }

    // ── People at the gate. The engine of live contested choice between wars:
    //    answering costs days, turning away costs a grudge, and doing neither is
    //    turning away with extra steps.
    const petitionDay = stampOf(year, 'seedtime', 30);
    if (inWindow(petitionDay, from, to)) {
      const houses = c.founding.houses.filter((h) => h.id !== c.founding.crown.houseId);
      const asker = houses[rnd(rng, Math.max(1, houses.length))];
      if (asker) {
        const asks = PETITIONS[rnd(rng, PETITIONS.length)] ?? 'a hearing';
        out.push({
          id: `w:${year}:petition:${asker.id}`,
          at: petitionDay,
          by: asker.id,
          kind: 'petition',
          fromId: asker.id,
          asks,
          note: `${asker.name} is at the gate asking for ${asks}.`,
        });
      }
    }

    // ── Births. A child in a house married into the crown turns the tie to
    //    blood, which is worth more than any feast you could hold.
    const birthDay = stampOf(year, 'seedtime', 60);
    if (inWindow(birthDay, from, to)) {
      for (const a of c.acts) {
        if (a.kind !== 'wed' || a.at.year > year) continue;
        if (!rollPermille(rng, 300)) continue;
        const house = c.founding.captains.find((p) => p.id === a.aId)?.houseId;
        if (!house) continue;
        out.push({
          id: `w:${year}:birth:${a.id}`,
          at: birthDay,
          by: 'world',
          kind: 'birth',
          captainId: `${a.id}:child`,
          houseId: house,
          note: 'A child, and two houses that are now blood.',
        });
      }
    }
  }

  out.sort((a, b) => a.at.absolute - b.at.absolute || a.id.localeCompare(b.id));
  return out.filter((a) => a.at.absolute > from.absolute && a.at.absolute <= to.absolute);
}

const PETITIONS: readonly string[] = [
  'a hearing over a mill',
  'the wardship of an orphan',
  'leave to marry a neighbour’s daughter',
  'relief from this year’s render',
  'a judgement against a rival',
  'men to hunt down a band of thieves',
];

function inWindow(day: Stamp, from: Stamp, to: Stamp): boolean {
  return day.absolute > from.absolute && day.absolute <= to.absolute;
}

/** What the world has already done to a piece of land this year — for a screen
 *  that wants to explain why the barns are empty. */
export function worldsHandOn(c: Chronicle, holdingId: string, at: Stamp): Act[] {
  return c.acts.filter(
    (a) =>
      a.by === 'world' &&
      a.at.year === at.year &&
      a.at.absolute <= at.absolute &&
      'holdingId' in a &&
      a.holdingId === holdingId,
  );
}

/** Who holds the land the world just burnt — so a raid can be told to the right
 *  lord. */
export function lordOfRavagedLand(c: Chronicle, holdingId: string, at: Stamp): string | null {
  return holderOfHolding(c, holdingId, at);
}

/** The world's own year, for anyone drawing a calendar. */
export function yearOf(at: Stamp): number {
  return Math.floor(at.absolute / COURT.calendar.daysPerYear) + 1;
}
