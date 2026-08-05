// WHY THIS FILE EXISTS. "Every choice is a trade with a named price" is the
// design's central promise, and a promise nothing computes is a slogan. This is
// the function that makes it true: hand it an act you are THINKING about and it
// tells you what it costs in days, whose day-book it comes off, what it costs in
// coin and grain, exactly which houses will resent it and by how much, which
// will be pleased, and — the one that matters — what it does to the muster if
// you called the host tomorrow.
//
// It is pure and cheap enough for a screen to call on hover. It appends the
// proposed act to a COPY of the chronicle and reads the muster twice; nothing is
// written anywhere, which is only possible because every reading in this layer
// is computed rather than stored.

import type { Men, Stamp } from '../core/primitives.js';
import { COURT, FAVOURS, GRIEVANCES, SEAT, UNPRICED_ACTS } from './codex.js';
import type { Occasion } from './answer.js';
import { readOccasion } from './answer.js';
import { assemble } from './host.js';
import { holderOfHolding } from './grievances.js';
import type { Act, Chronicle } from './records.js';
import { captainOf, houseOf } from './records.js';
import { seatIsFilled } from './seats.js';
import { revocationGrievance, yearsHeld } from './tenure.js';
import { round2 } from './tally.js';
import type { Price } from './types.js';
import { overCalledGrievance, vesselDrunkBefore } from './vessel.js';

/** WHAT AN ACT WOULD COST, BEFORE YOU DO IT. */
export function readPrice(c: Chronicle, proposed: Act, at: Stamp): Price {
  const cost = costOf(c, proposed, at);
  const track = cost.track === 'crown' || seatIsFilled(c, cost.track, at) ? cost.track : 'crown';

  const grievances: Price['grievances'] = [];
  const favours: Price['favours'] = [];
  let crowns = cost.crowns;
  let sacks = cost.sacks;

  switch (proposed.kind) {
    case 'invest': {
      for (const p of c.founding.captains) {
        if (p.id === proposed.captainId || !p.houseId) continue;
        const claim = p.claims[proposed.seatId] ?? 0;
        if (claim <= 0) continue;
        grievances.push({
          houseId: p.houseId,
          kind: 'passed-over',
          weight: claim * COURT.seats.passedOverPerClaimPoint,
          explains: `${p.name} wanted the ${proposed.seatId} and will watch it go elsewhere.`,
        });
      }
      const years = yearsHeld(c, proposed.seatId, at);
      if (years > 0) {
        const holder = captainOf(c, proposed.captainId);
        void holder;
        grievances.push({
          houseId: 'the present holder',
          kind: 'unseated',
          weight: revocationGrievance(years),
          explains: `The seat has been held ${Math.floor(years)} years. Taking it back is worth this much resentment.`,
        });
      }
      const winner = captainOf(c, proposed.captainId);
      if (winner?.houseId) {
        favours.push({
          houseId: winner.houseId,
          kind: 'seat-granted',
          weight: (FAVOURS['seat-granted']?.standing ?? 0) + (FAVOURS['seat-granted']?.fading ?? 0),
          explains: `${winner.name} gets one of the seven offices, and everyone will know it.`,
        });
      }
      break;
    }

    case 'attaint': {
      grievances.push({
        houseId: proposed.houseId,
        kind: 'attainted',
        weight: GRIEVANCES['attainted']?.raw ?? 0,
        explains: 'Their lands taken by force. No coin buys this back.',
      });
      for (const h of c.founding.houses) {
        if (h.id === proposed.houseId) continue;
        grievances.push({
          houseId: h.id,
          kind: 'tyranny',
          weight: COURT.seats.tyrannyGrievanceToAll,
          explains: 'Every other house will do the arithmetic about itself.',
        });
      }
      break;
    }

    case 'charter': {
      const holder = holderOfHolding(c, proposed.holdingId, at);
      if (holder) {
        grievances.push({
          houseId: holder,
          kind: 'chartered',
          weight: GRIEVANCES['chartered']?.raw ?? 0,
          explains: 'A fifth of the town’s tax leaves their hands forever.',
        });
      }
      break;
    }

    case 'amends': {
      const points = proposed.settles.reduce((sum, x) => sum + x.points, 0);
      crowns +=
        proposed.crowns ??
        (proposed.method === 'wergild' ? points * COURT.actDays.amendsWergild.crownsPerGrievancePoint : 0);
      favours.push({
        houseId: proposed.houseId,
        kind: proposed.method,
        weight: (FAVOURS[proposed.method]?.fading ?? 0) + (FAVOURS[proposed.method]?.standing ?? 0),
        explains: `Amends made properly, in public, by ${proposed.method}.`,
      });
      if (proposed.method === 'justice' && proposed.punishedHouseId) {
        grievances.push({
          houseId: proposed.punishedHouseId,
          kind: 'punished',
          weight: GRIEVANCES['punished']?.raw ?? 0,
          explains: 'The strongest settlement there is, and it makes a fresh grudge in whoever it falls on.',
        });
      }
      break;
    }

    case 'feast': {
      crowns += proposed.crowns;
      for (const houseId of proposed.invitedHouseIds) {
        favours.push({
          houseId,
          kind: 'feast',
          weight: FAVOURS['feast']?.fading ?? 0,
          explains: 'They eat at your table where everyone can see it.',
        });
      }
      break;
    }

    case 'tourney': {
      crowns += proposed.crowns;
      for (const h of c.founding.houses) {
        favours.push({
          houseId: h.id,
          kind: 'tourney',
          weight: FAVOURS['tourney']?.fading ?? 0,
          explains: 'Their young men will have somewhere to be dangerous.',
        });
      }
      break;
    }

    case 'summon': {
      for (const calledId of proposed.calledIds) {
        if (!houseOf(c, calledId)) continue;
        if (proposed.great) {
          grievances.push({
            houseId: calledId,
            kind: 'great-summons',
            weight: COURT.obligation.greatSummonsGrievance,
            explains: 'The whole strength of the land. Forgiven if you win, twice as heavy if you lose.',
          });
          continue;
        }
        const vessel = vesselDrunkBefore(c, calledId, at.year, at.absolute);
        if (vessel.daysLeft > 0) continue;
        grievances.push({
          houseId: calledId,
          kind: 'over-called',
          weight: overCalledGrievance(vessel.beyond),
          explains: `Their vessel is dry — you would be calling them past the ${vessel.capacityDays} days they owe.`,
        });
      }
      break;
    }

    case 'answer-petition': {
      if (proposed.granted) break;
      const petition = c.acts.find((a) => a.id === proposed.petitionActId);
      if (petition?.kind !== 'petition') break;
      grievances.push({
        houseId: petition.fromId,
        kind: 'turned-away',
        weight: GRIEVANCES['turned-away']?.raw ?? 0,
        explains: 'They came to the gate and would be sent home with nothing.',
      });
      break;
    }

    case 'enfeoff': {
      favours.push({
        houseId: proposed.houseId,
        kind: 'land-granted',
        weight: FAVOURS['land-granted']?.standing ?? 0,
        explains: `Land, and with it ${proposed.owedMen} men for ${proposed.owedDays} days a year, forever.`,
      });
      break;
    }

    case 'contract': {
      crowns += proposed.crowns;
      break;
    }

    case 'provision': {
      crowns += proposed.crowns;
      sacks -= proposed.sacks;
      break;
    }

    case 'pay': {
      crowns += proposed.crowns;
      break;
    }

    case 'accept-scutage': {
      crowns -= proposed.crowns;
      break;
    }

    default:
      break;
  }

  return {
    days: cost.days,
    track,
    crowns: round2(crowns),
    sacks: round2(sacks),
    grievances,
    favours,
    musterDelta: musterDelta(c, proposed, at),
  };
}

/** THE KILLER LINE: "+36 men this season". Read the muster as it stands, read it
 *  again with the proposed act written in, and hand back the difference. Nothing
 *  is stored, so the second reading costs only arithmetic. */
function musterDelta(c: Chronicle, proposed: Act, at: Stamp): Price['musterDelta'] {
  const occ = anyOccasion(c, at);
  if (!occ) {
    return { men: 0, explains: 'No war is declared, so there is no muster to change yet.' };
  }
  const before = musterMen(c, occ, at);
  const after = musterMen({ ...c, acts: [...c.acts, proposed] }, occ, at);
  const delta = after - before;
  return {
    men: delta,
    explains:
      delta === 0
        ? 'It changes nobody’s answer to the present summons.'
        : `${delta > 0 ? '+' : ''}${delta} men at the present muster.`,
  };
}

function anyOccasion(c: Chronicle, at: Stamp): Occasion | null {
  for (const a of c.acts) {
    if (a.kind !== 'summon' || a.at.absolute > at.absolute) continue;
    const occ = readOccasion(c, a.campaignId, at);
    if (occ) return occ;
  }
  return null;
}

function musterMen(c: Chronicle, occ: Occasion, at: Stamp): Men {
  // The WHOLE host, not just the levies: chartering a town moves its spears out
  // of its lord's roster and into a militia of its own, and an answer that
  // counted only the levies would report that trade as a pure loss. Assembling
  // is more work than adding up the houses, and it is the only honest sum.
  let men = 0;
  for (const u of assemble(c, occ, at).units) men += u.strength;
  return men;
}

/** THE DAYS, AND WHOSE BOOK THEY COME OFF. Straight out of
 *  `data/constants.json → court.actDays`, with the four acts whose price depends
 *  on the act itself worked out here: a summons costs more the more houses it
 *  names, a proclamation is quicker with a Chaplain, a betrothal is quicker with
 *  a Chancellor, and amends cost what the method costs. */
export function costOf(
  c: Chronicle,
  proposed: Act,
  at: Stamp,
): { days: number; track: string; crowns: number; sacks: number } {
  const days = COURT.actDays;
  const plain = (row: { track: string; days: number; crowns?: number }): {
    days: number;
    track: string;
    crowns: number;
    sacks: number;
  } => ({ days: row.days, track: row.track, crowns: row.crowns ?? 0, sacks: 0 });

  switch (proposed.kind) {
    case 'summon':
      if (proposed.great) return plain(days.greatSummons);
      return plain(proposed.calledIds.length > 1 ? days.summonRealm : days.summonOneHouse);
    case 'proclaim':
      return {
        days: seatIsFilled(c, SEAT.chaplain, at) ? days.proclaim.daysWithChaplain : days.proclaim.days,
        track: days.proclaim.track,
        crowns: 0,
        sacks: 0,
      };
    case 'betroth':
      return {
        days: seatIsFilled(c, SEAT.chancellor, at) ? days.betroth.daysWithChancellor : days.betroth.days,
        track: days.betroth.track,
        crowns: days.betroth.crowns,
        sacks: 0,
      };
    case 'amends':
      switch (proposed.method) {
        case 'justice':
          return plain(days.amendsJustice);
        case 'judgement':
          return plain(days.amendsJudgement);
        case 'apology':
          return plain(days.amendsApology);
        case 'grant':
          return plain(days.enfeoff);
        default:
          return plain(days.amendsWergild);
      }
    case 'answer-petition':
      // Turning somebody away is quick. Hearing them properly is not, and that
      // is the trade the Crown's Gate exists to make.
      return {
        days: proposed.granted ? days.answerPetition.daysMax : days.answerPetition.daysMin,
        track: days.answerPetition.track,
        crowns: 0,
        sacks: 0,
      };
    case 'invest':
      return { ...plain(days.invest), crowns: COURT.coin.seatStipendCrownsPerSeason };
    case 'enfeoff':
      return plain(days.enfeoff);
    case 'attaint':
      return plain(days.attaint);
    case 'ward':
      return plain(days.ward);
    case 'contract':
      return plain(days.contract);
    case 'charter':
      return plain(days.charter);
    case 'provision':
      return plain(days.provision);
    case 'pay':
      return plain(days.pay);
    case 'tax':
      return plain(days.tax);
    case 'name-commander':
      return plain(days.nameCommander);
    case 'march':
      return plain(days.march);
    case 'feast':
      return { ...plain(days.feast), sacks: 20 };
    case 'tourney':
      return { ...plain(days.tourney), sacks: 30 };
    case 'learn':
      return plain(days.learn);
    default: {
      const row = UNPRICED_ACTS[proposed.kind];
      return row
        ? { days: row.days, track: row.track, crowns: row.crowns, sacks: row.sacks }
        : { days: 0, track: 'crown', crowns: 0, sacks: 0 };
    }
  }
}

/** Which day-book an act would come off, given who is seated. Exported because
 *  the calendar screen needs the same answer. */
export function trackFor(c: Chronicle, proposed: Act, at: Stamp): string {
  const wanted = costOf(c, proposed, at).track;
  if (wanted === 'crown') return 'crown';
  return seatIsFilled(c, wanted, at) ? wanted : 'crown';
}

/** The seven seats, for a screen that wants to show which ones would help. */
export const SEATS_THAT_SAVE_DAYS: readonly string[] = [
  SEAT.chancellor,
  SEAT.steward,
  SEAT.justiciar,
  SEAT.marshal,
  SEAT.chaplain,
  SEAT.spymaster,
];
