// WHY THIS FILE EXISTS. Fifty, plus kindness, plus blood, minus grudges. That is
// the whole of loyalty, and it is a READING — there is no loyalty field on a
// house record anywhere in this repository, and the compiler is instructed to
// refuse one (see `records.ts`, HOUSE_STORES_NO_STANDING).
//
// WHAT BREAKS IF SOMEONE CACHES THIS. The player strikes a record — an
// investiture that slighted three houses, say — and expects the three houses to
// forget it happened. With a stored number they do not forget: the loyalty was
// "already applied", so the game now holds an opinion with no cause, and the
// player's whole mental model ("I can see why") is broken in a way that cannot
// be debugged from the screen.
//
// Every term below points at the records that made it, so the number can be
// argued with, and every one of them is spelled out again inside willingness, so
// that a player looking at a refusal sees the grudge itself rather than a lump
// labelled "loyalty".

import type { Score, Stamp, Tally, Term } from '../core/primitives.js';
import { CHOSEN, COURT } from './codex.js';
import { readFavours } from './favours.js';
import { readGrievances } from './grievances.js';
import { kinOf, kinshipWorth, otherEnd } from './kin.js';
import type { Chronicle } from './records.js';
import { clampedTally, round2, term } from './tally.js';
import type { Grievance } from './types.js';

/** THE TRUTH about a house's loyalty, hidden grudges included. What the player
 *  is entitled to see is `readAsCrown` of this. */
export function readLoyalty(c: Chronicle, houseId: string, at: Stamp): Tally {
  return clampedTally(loyaltyTerms(c, houseId, at), 0, 100);
}

/** The terms themselves, so that willingness can spell them out one by one
 *  instead of quoting a lump. */
export function loyaltyTerms(c: Chronicle, houseId: string, at: Stamp): Term[] {
  const terms: Term[] = [
    term(
      'Neither friend nor enemy',
      'Every house begins at fifty. Everything else is something you did.',
      COURT.loyalty.foundingDisposition,
    ),
  ];

  for (const f of readFavours(c, houseId, at)) {
    const worth = round2(f.standing + f.fading);
    if (worth === 0) continue;
    terms.push(term(labelForFavour(f.kind), f.explains, worth, [f.actId]));
  }

  for (const tie of kinOf(c, houseId, at)) {
    const crown = c.founding.crown.houseId;
    if (otherEnd(tie, houseId) !== crown) continue;
    const worth = kinshipWorth(tie.degree);
    if (worth === 0) continue;
    terms.push(
      term(
        tie.degree === 'blood' ? 'Blood of the crown' : 'Married into the crown',
        tie.degree === 'blood'
          ? 'A marriage between your houses has borne a child. You share a grandchild now.'
          : 'One of theirs married one of yours.',
        worth,
        tie.actIds,
      ),
    );
  }

  for (const g of readGrievances(c, houseId, at)) {
    if (g.weight === 0) continue;
    terms.push(term(labelForGrievance(g), g.explains, -g.weight, [g.actId]));
  }

  return terms;
}

/** The word a herald would use. Bands exist because "he is at 61" is not a thing
 *  a person says about a vassal. */
export function bandOf(loyalty: Score): string {
  for (const b of CHOSEN.bands) if (loyalty >= b.at) return b.name;
  return 'Defiant';
}

function labelForFavour(kind: string): string {
  const words: Record<string, string> = {
    'seat-granted': 'Holds one of your seats',
    'land-granted': 'Holds land of your gift',
    wergild: 'Wergild paid',
    apology: 'An apology made',
    judgement: 'A judgement in their favour',
    justice: 'Justice done on their behalf',
    gift: 'Gifts given',
    feast: 'Feasted at your table',
    tourney: 'Your tourney',
    betrothal: 'A marriage promised',
    'ransom-paid': 'Their kinsman ransomed',
    'defended-his-land': 'You defended their land',
  };
  return words[kind] ?? kind;
}

function labelForGrievance(g: Grievance): string {
  const words: Record<string, string> = {
    'passed-over': 'Passed over for a seat',
    'passed-over-command': 'Passed over for the command',
    unseated: 'Unseated',
    'seat-left-empty': 'A seat they want, left empty',
    attainted: 'Attainted',
    tyranny: 'A house stripped',
    'ward-soured': 'Their heir held too long',
    'ward-died': 'Their child died in your keeping',
    'turned-away': 'Turned away at the gate',
    'over-called': 'Called past the bond',
    'great-summons': 'The Great Summons',
    'blood-debt': 'Blood debt',
    unrewarded: 'Distinguished and unrewarded',
    unransomed: 'Kinsman unransomed',
    disgraced: 'Named disgraced',
    punished: 'Justice done upon them',
    chartered: 'Their town chartered',
    avenge: 'A death to avenge',
  };
  return words[g.kind] ?? g.kind;
}
