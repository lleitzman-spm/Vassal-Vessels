// WHY THIS FILE EXISTS. Levies are OF somewhere. The Spears of Millrow come from
// Millrow, and losing Millrow removes that named wing from the board — not
// "eight per cent of your infantry". This module is where a piece of land
// becomes coin, grain and named men, and it is the reason a player can look at
// the map and see an army.
//
// THE ROLL IS A READING AND IT IS THE SUBTLE ONE. What a holding can raise today
// is its founding roll, minus every man the battles took, minus what a raid or a
// plague took, plus six men a year of regeneration — ADDITIVE, so a small
// holding is not also a slow one, which is one of the named ladders out of a
// losing streak. Cache it and every one of those becomes a lie the moment a
// casualty record is struck out.

import type { Men, Sacks, Stamp, Tally, Term } from '../core/primitives.js';
import { CHOSEN, COURT, HOLDING_TYPES, SEAT, UNIT_TYPES } from './codex.js';
import { addDays, yearsBetween } from './calendar.js';
import { journey } from './distance.js';
import { holderOfHolding } from './grievances.js';
import type { Chronicle, RollEntry } from './records.js';
import { holdingOf } from './records.js';
import { seatEffect, seatIsFilled } from './seats.js';
import { clampedTally, round2, tally, term, whole } from './tally.js';
import type { HoldingReading } from './types.js';

/** The name a unit raised here goes by. Named for its home on purpose: it is how
 *  a player knows that losing a holding lost this exact wing. */
export function unitIdFor(holdingId: string, unitTypeId: string): string {
  return `u:${holdingId}:${unitTypeId}`;
}

export function unitNameFor(holdingName: string, unitTypeId: string): string {
  const type = UNIT_TYPES[unitTypeId];
  const word = wordFor(unitTypeId);
  void type;
  return `the ${word} of ${holdingName}`;
}

function wordFor(unitTypeId: string): string {
  const words: Record<string, string> = {
    spearmen: 'Spears',
    'militia-spears': 'Spears',
    bowmen: 'Bows',
    foresters: 'Foresters',
    'pick-men': 'Picks',
    'men-at-arms': 'Men-at-Arms',
    crossbowmen: 'Crossbows',
    marines: 'Marines',
    knights: 'Knights',
    'march-riders': 'Riders',
    'household-guard': 'Guard',
    'sworn-brothers': 'Brothers',
    'company-swords': 'Swords',
    'company-pikes': 'Pikes',
    'company-horse': 'Horse',
    'crown-banner': 'Banner',
    'relic-bearers': 'Bearers',
    bombard: 'Bombard',
  };
  return words[unitTypeId] ?? unitTypeId;
}

/** Which holding a unit id belongs to. The id carries its own home, so a
 *  casualty record written by the battle can be read back onto the land without
 *  a lookup table anybody has to keep in step. */
export function holdingOfUnitId(unitId: string): { holdingId: string; unitTypeId: string } | null {
  const parts = unitId.split(':');
  if (parts.length !== 3 || parts[0] !== 'u') return null;
  const holdingId = parts[1];
  const unitTypeId = parts[2];
  if (!holdingId || !unitTypeId) return null;
  return { holdingId, unitTypeId };
}

/** THE NAMED UNITS THIS HOLDING CAN RAISE TODAY. After casualties, raids,
 *  plague, garrison duty and regeneration. What a player reads off the map. */
export function readMusterRoll(c: Chronicle, holdingId: string, at: Stamp): RollEntry[] {
  const holding = holdingOf(c, holdingId);
  if (!holding) return [];
  const type = HOLDING_TYPES[holding.typeId];
  if (!type) return [];

  const lost = c.acts.some(
    (a) => a.kind === 'holding-lost' && a.subjectId === holdingId && a.at.absolute <= at.absolute,
  );
  if (lost) return [];

  const base = type.raises.map((r) => ({ ...r }));
  const men = base.map((r) => r.men);

  interface Blow {
    on: number;
    apply: (men: number[]) => void;
  }
  const blows: Blow[] = [];

  for (const a of c.acts) {
    if (a.at.absolute > at.absolute) continue;
    if (a.kind === 'casualty') {
      const home = holdingOfUnitId(a.subjectId);
      if (!home || home.holdingId !== holdingId) continue;
      const line = base.findIndex((r) => r.unitTypeId === home.unitTypeId);
      if (line < 0) continue;
      const amount = a.amount ?? 0;
      blows.push({
        on: a.at.absolute,
        apply: (m) => {
          m[line] = Math.max(0, (m[line] ?? 0) - amount);
        },
      });
    }
    if (a.kind === 'raid' && a.holdingId === holdingId) {
      blows.push({ on: a.at.absolute, apply: (m) => spread(m, a.menLost) });
    }
    if (a.kind === 'pestilence' && a.holdingId === holdingId) {
      const share = Math.max(0, Math.min(100, a.severity)) / 100;
      blows.push({
        on: a.at.absolute,
        apply: (m) => {
          for (let i = 0; i < m.length; i++) m[i] = (m[i] ?? 0) * (1 - share);
        },
      });
    }
  }
  blows.sort((x, y) => x.on - y.on);

  let clock = c.founding.founding.absolute;
  for (const b of blows) {
    regenerate(men, base, (b.on - clock) / COURT.calendar.daysPerYear);
    b.apply(men);
    clock = b.on;
  }
  regenerate(men, base, (at.absolute - clock) / COURT.calendar.daysPerYear);

  const constable = seatIsFilled(c, SEAT.constable, at)
    ? CHOSEN.constableGarrisonRelief * seatEffect(c, SEAT.constable, at)
    : 0;

  const out: RollEntry[] = [];
  for (let i = 0; i < base.length; i++) {
    const row = base[i];
    if (!row) continue;
    const strength = Math.max(0, Math.round(men[i] ?? 0));
    if (strength === 0) continue;
    const held = Math.min(strength, Math.round(row.garrisonHeld * (1 - constable)));
    out.push({ unitTypeId: row.unitTypeId, men: strength, garrisonHeld: held });
  }
  return out;
}

/** Six men a year, whatever the size of the place, to whichever line is most
 *  depleted. Additive on purpose: being small must not also mean recovering
 *  slowly. */
function regenerate(men: number[], base: { men: Men }[], years: number): void {
  if (years <= 0) return;
  let pool = COURT.regeneration.menPerHoldingPerYear * years;
  for (let guard = 0; guard < 64 && pool > 0.001; guard++) {
    let worst = -1;
    let gap = 0;
    for (let i = 0; i < men.length; i++) {
      const missing = (base[i]?.men ?? 0) - (men[i] ?? 0);
      if (missing > gap) {
        gap = missing;
        worst = i;
      }
    }
    if (worst < 0) return;
    const give = Math.min(pool, gap);
    men[worst] = (men[worst] ?? 0) + give;
    pool -= give;
  }
}

/** A raid takes men off the whole place, in proportion to who was standing
 *  there. */
function spread(men: number[], lost: Men): void {
  const total = men.reduce((s, m) => s + m, 0);
  if (total <= 0) return;
  for (let i = 0; i < men.length; i++) {
    men[i] = Math.max(0, (men[i] ?? 0) - (lost * (men[i] ?? 0)) / total);
  }
}

/** Has this town bought its liberties? A chartered town musters for itself and
 *  keeps a share of its own tax forever — men now, money never again. */
export function isChartered(c: Chronicle, holdingId: string, at: Stamp): boolean {
  return c.acts.some(
    (a) => a.kind === 'charter' && a.holdingId === holdingId && a.at.absolute <= at.absolute,
  );
}

/** Was this land burnt or stripped, and until when? Half yield for a year. */
export function ravagedUntil(c: Chronicle, holdingId: string, at: Stamp): Stamp | null {
  let until: Stamp | null = null;
  for (const a of c.acts) {
    if (a.kind !== 'holding-ravaged' || a.subjectId !== holdingId) continue;
    if (a.at.absolute > at.absolute) continue;
    const end = addDays(a.at, COURT.calendar.daysPerYear);
    if (end.absolute > at.absolute && (!until || end.absolute > until.absolute)) until = end;
  }
  return until;
}

/** What a piece of land is, who holds it, what it yields and what it raises. */
export function readHolding(c: Chronicle, holdingId: string, at: Stamp): HoldingReading {
  const holding = holdingOf(c, holdingId) ?? {
    id: holdingId,
    name: holdingId,
    typeId: 'manor',
    provinceId: 'unknown',
    leaguesTo: {},
    road: 'track' as const,
  };
  const type = HOLDING_TYPES[holding.typeId];
  const houseId = holderOfHolding(c, holdingId, at);
  const ravaged = ravagedUntil(c, holdingId, at);
  const lost = c.acts.some(
    (a) => a.kind === 'holding-lost' && a.subjectId === holdingId && a.at.absolute <= at.absolute,
  );
  const contested = c.acts.some(
    (a) =>
      a.kind === 'attaint' && a.holdingIds.includes(holdingId) && a.at.absolute <= at.absolute,
  );

  const coinTerms: Term[] = [];
  const grainTerms: Term[] = [];
  if (type && !lost) {
    coinTerms.push(term(`A ${type.name}`, type.explains, type.coinPerSeason));
    grainTerms.push(term(`A ${type.name}`, type.explains, type.grainPerSeason));
    if (ravaged) {
      coinTerms.push(
        term('Ravaged', 'Burnt or stripped. Half yield until the year is out.', -type.coinPerSeason / 2),
      );
      grainTerms.push(
        term('Ravaged', 'Burnt or stripped. Half yield until the year is out.', -type.grainPerSeason / 2),
      );
    }
    for (const a of c.acts) {
      if (a.kind !== 'charter' || a.holdingId !== holdingId) continue;
      if (a.at.absolute > at.absolute) continue;
      coinTerms.push(
        term(
          'Chartered liberties',
          'The town bought its liberties. That share of the tax is gone, and it is gone forever.',
          -round2(type.coinPerSeason * a.libertyShare),
          [a.id],
        ),
      );
    }
  }

  const marchDays: Record<string, number> = {};
  for (const placeId of Object.keys(holding.leaguesTo)) {
    const roll = readMusterRoll(c, holdingId, at);
    const slowest = roll.reduce((worst, r) => {
      const j = journey(c, holding, placeId, r.unitTypeId, at);
      return Math.max(worst, j.marchDays);
    }, 0);
    marchDays[placeId] = slowest;
  }

  return {
    holding,
    state: lost ? 'vacant' : contested ? 'contested' : houseId ? 'held' : 'vacant',
    houseId,
    coinPerSeason: clampedTally(coinTerms, 0, Number.MAX_SAFE_INTEGER),
    grainPerSeason: clampedTally(grainTerms, 0, Number.MAX_SAFE_INTEGER),
    roll: readMusterRoll(c, holdingId, at),
    marchDays,
    ravagedUntil: ravaged,
  };
}

// ── The two chests ─────────────────────────────────────────────────────────
//
// Coin and grain are readings like everything else: the founding amount, plus
// every act that added, minus every act that spent. There is no wallet.

export function readCoffer(c: Chronicle, at: Stamp): Tally {
  const terms: Term[] = [
    term('The founding chest', 'What was in the treasury when the realm was founded.', c.founding.crown.coffer),
  ];

  for (const a of c.acts) {
    if (a.at.absolute > at.absolute) continue;
    switch (a.kind) {
      case 'tax': {
        let taken = 0;
        for (const id of a.holdingIds) {
          taken += readHolding(c, id, at).coinPerSeason.value;
        }
        if (a.extraordinary) taken *= 2;
        terms.push(
          term(
            a.extraordinary ? 'An extraordinary tax' : 'Taxes gathered',
            a.extraordinary
              ? 'Twice the ordinary render, and everyone who paid it remembers.'
              : 'The ordinary render of the named holdings, for one season.',
            whole(taken),
            [a.id],
          ),
        );
        break;
      }
      case 'accept-scutage':
        terms.push(term('Scutage taken', 'Coin instead of men. Easy now; hollow later.', a.crowns, [a.id]));
        break;
      case 'plunder':
        terms.push(term('Plunder', 'What was taken on the field.', a.amount ?? 0, [a.id]));
        break;
      case 'pay':
        terms.push(term(`Paid to ${a.toId}`, 'The chest was opened.', -a.crowns, [a.id]));
        break;
      case 'provision':
        terms.push(term('Grain bought', 'A hundred men eat a sack a day.', -a.crowns, [a.id]));
        break;
      case 'feast':
        terms.push(term('A feast', 'A week of food and talk.', -a.crowns, [a.id]));
        break;
      case 'tourney':
        terms.push(term('A tourney', 'Twelve days and a great deal of money.', -a.crowns, [a.id]));
        break;
      case 'contract':
        terms.push(term('A company hired', 'Coin into men.', -a.crowns, [a.id]));
        break;
      default:
        break;
    }
  }

  return tally(terms);
}

export function readGranary(c: Chronicle, at: Stamp): Tally {
  const terms: Term[] = [
    term('The founding granary', 'What was in the barns when the realm was founded.', c.founding.crown.granary),
  ];

  for (const a of c.acts) {
    if (a.at.absolute > at.absolute) continue;
    if (a.kind === 'harvest') {
      const holding = readHolding(c, a.holdingId, at);
      const sacks: Sacks = whole(holding.grainPerSeason.value * a.quality);
      terms.push(
        term(
          `Harvest at ${holding.holding.name}`,
          `The year gave back ${Math.round(a.quality * 100)} per cent of an ordinary crop.`,
          sacks,
          [a.id],
        ),
      );
    }
    if (a.kind === 'provision') {
      terms.push(term('Grain bought', 'Bought and carted in.', a.sacks, [a.id]));
    }
    if (a.kind === 'feast') {
      terms.push(term('A feast', 'Eaten.', -20, [a.id]));
    }
  }

  return clampedTally(terms, 0, Number.MAX_SAFE_INTEGER);
}

/** Every year since the founding, for the readings that count seasons. */
export function yearsSinceFounding(c: Chronicle, at: Stamp): number {
  return yearsBetween(c.founding.founding, at);
}
