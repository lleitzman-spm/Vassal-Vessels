// WHY THIS FILE EXISTS. This is the mechanic the whole game is built to protect:
// what a house does when the letter arrives, worked out in front of the player,
// term by term, with no dice anywhere in the path.
//
// THE MUSTER NEVER ROLLS DICE (law 2). Willingness is a transparent sum. The
// answer falls on fixed thresholds. Given the records, what stands at the
// mustering place is determined arithmetic — so a betrayal is always foreseeable
// in hindsight, therefore always the player's fault, therefore a story. The ONLY
// uncertainty is hidden information: a grudge nobody told you about, which is a
// `learn` record you never wrote, not a number nobody could have known. If you
// ever find yourself reaching for a random number in this file, the game is
// over: put it down.
//
// WORST-KEPT-LAST. A short answer does not shrink everything a bit. An unwilling
// house fills its quota from the CHEAPEST men upward, so "comes at 0.75" means
// the knights stayed home — a sentence a player can picture, which is the whole
// difference between a mechanic and a multiplier.

import type { Crowns, Men, Stamp, Tally, Term } from '../core/primitives.js';
import { ANSWERS, CAUSES, COURT, HOLDING_TYPES, SEAT, UNIT_TYPES } from './codex.js';
import type { AnswerBand } from './codex.js';
import { addDays, stampAt } from './calendar.js';
import { fellowsOf } from './cabals.js';
import { holdingsOf, journey, nearestLeagues } from './distance.js';
import { readGrievances } from './grievances.js';
import { heirIsWard } from './kin.js';
import { isChartered, readMusterRoll, unitIdFor } from './land.js';
import { loyaltyTerms } from './loyalty.js';
import type { Chronicle, Proclaim, Summon } from './records.js';
import { houseOf } from './records.js';
import { seatEffect, seatIsFilled } from './seats.js';
import { clampedTally, round2, tally, term } from './tally.js';
import type { AnswerReading, Journey } from './types.js';
import { vesselDrunkBefore } from './vessel.js';

/** Everything about a war that a house's answer depends on, gathered once. Built
 *  from the records for a real campaign, or made up on the spot by the forecast
 *  for a war that has not been declared yet — which is why the forecast can be
 *  free to look at. */
export interface Occasion {
  campaignId: string;
  causeId: string;
  causeName: string;
  defending: boolean;
  blessed: boolean;
  great: boolean;
  musteringPlaceId: string;
  standBy: Stamp;
  /** The day the letters were sealed. */
  sentOn: Stamp;
  /** Null when nothing has actually been proclaimed — a forecast. */
  summonActId: string | null;
  calledIds: string[];
}

export function readOccasion(c: Chronicle, campaignId: string, at: Stamp): Occasion | null {
  const proclaim = c.acts.find(
    (a): a is Proclaim =>
      a.kind === 'proclaim' && a.campaignId === campaignId && a.at.absolute <= at.absolute,
  );
  const summons = c.acts
    .filter((a): a is Summon => a.kind === 'summon' && a.campaignId === campaignId && a.at.absolute <= at.absolute)
    .sort((x, y) => x.at.absolute - y.at.absolute);
  const summon = summons[summons.length - 1];
  if (!proclaim || !summon) return null;

  const cause = CAUSES[proclaim.causeId];
  return {
    campaignId,
    causeId: proclaim.causeId,
    causeName: cause?.name ?? proclaim.causeId,
    defending: proclaim.defending,
    blessed: proclaim.blessed,
    great: summon.great,
    musteringPlaceId: summon.musteringPlaceId,
    standBy: summon.standBy,
    sentOn: summon.at,
    summonActId: summon.id,
    calledIds: summon.calledIds,
  };
}

/** What the realm thinks of this war. Already inside every man's resolve; given
 *  separately so a herald can say it out loud. */
export function readLegitimacy(c: Chronicle, occ: Occasion, at: Stamp): Tally {
  const cause = CAUSES[occ.causeId];
  const terms: Term[] = [
    term(
      `The cause: ${occ.causeName}`,
      cause?.explains ?? 'A war has been declared and this is what it is called.',
      cause?.legitimacy ?? 50,
    ),
  ];
  if (occ.blessed) {
    const effect = seatEffect(c, SEAT.chaplain, at);
    terms.push(
      term(
        'Blessed by your Chaplain',
        'The Church says this war is just, which is worth ten times what your Chaplain is worth.',
        round2(10 * effect),
      ),
    );
  }
  for (const a of c.acts) {
    if (a.kind !== 'legitimacy' || a.at.absolute > at.absolute) continue;
    terms.push(
      term(
        (a.amount ?? 0) > 0 ? 'A victory remembered' : 'A defeat remembered',
        'What the realm thinks of the crown after the last war.',
        a.amount ?? 0,
        [a.id],
      ),
    );
  }
  return clampedTally(terms, 0, 100);
}

// ── Willingness ────────────────────────────────────────────────────────────

/** THE TRANSPARENT SUM. Every reason he might come and every reason he might
 *  not, each one pointing at the records that made it. The terms sum to the
 *  value; the value falls on a fixed threshold; there is no die anywhere. */
export function readWillingness(
  c: Chronicle,
  occ: Occasion,
  houseId: string,
  at: Stamp,
  opts: { countFellows?: boolean } = {},
): Tally {
  const terms: Term[] = [];

  // 1. Loyalty, spelled out rather than lumped. A player looking at a refusal
  //    must see the grudge itself, not a number called "loyalty".
  const loyal = loyaltyTerms(c, houseId, at);
  let loyalSum = 0;
  for (const t of loyal) loyalSum += t.value;
  terms.push(...loyal);
  if (loyalSum > 100) {
    terms.push(
      term(
        'Loyalty stops at a hundred',
        'He cannot be more than entirely yours, however much you have given him.',
        round2(100 - loyalSum),
      ),
    );
  } else if (loyalSum < 0) {
    terms.push(
      term(
        'Loyalty stops at nothing',
        'He cannot be less than entirely against you, however much you have taken.',
        round2(-loyalSum),
      ),
    );
  }

  // 2. The cause.
  const legitimacy = readLegitimacy(c, occ, at).value;
  const causeWorth = Math.max(
    -COURT.willingness.causeBonusClamp,
    Math.min(
      COURT.willingness.causeBonusClamp,
      (legitimacy - 50) * COURT.willingness.causeBonusPerLegitimacyPoint,
    ),
  );
  terms.push(
    term(
      `The cause: ${occ.causeName}`,
      `The realm reckons this war ${Math.round(legitimacy)} out of a hundred just.`,
      round2(causeWorth),
    ),
  );

  // 3. Defending his own doorstep.
  const leagues = nearestLeagues(c, houseId, occ.musteringPlaceId, at);
  if (occ.defending && Number.isFinite(leagues)) {
    if (leagues <= 20) {
      terms.push(
        term(
          'The war is at his door',
          `The mustering place is ${Math.round(leagues)} leagues from his own land, and it is his land being defended.`,
          COURT.willingness.defendingWithin20Leagues,
        ),
      );
    } else if (leagues <= 50) {
      terms.push(
        term(
          'The war is in his country',
          `Fifty leagues is close enough to smell the smoke.`,
          COURT.willingness.defendingWithin50Leagues,
        ),
      );
    }
  }

  // 4. His heir at your court.
  const ward = heirIsWard(c, houseOf(c, houseId) ?? { id: houseId, name: houseId, lordCaptainId: '' }, at);
  if (ward.held) {
    terms.push(
      term(
        'You hold his heir',
        'His son lives at your court. This is what hostages were for, and it is exactly as ugly as it sounds.',
        COURT.willingness.heirIsWard,
        ward.actId ? [ward.actId] : [],
      ),
    );
  }

  // 5. The Chancellor's letter.
  if (seatIsFilled(c, SEAT.chancellor, at)) {
    terms.push(
      term(
        'Summoned by your Chancellor',
        'The letter came under the proper seal, with the proper words, and arrived when it said it would.',
        round2(COURT.willingness.chancellorBonus * seatEffect(c, SEAT.chancellor, at)),
      ),
    );
  }

  // 6. A dry vessel. What he owes is forty days a year, and you have had them.
  const vessel = vesselDrunkBefore(c, houseId, at.year, occ.sentOn.absolute);
  if (vessel.daysLeft <= 0) {
    const ladder = [
      COURT.willingness.dryVesselFirst,
      COURT.willingness.dryVesselSecond,
      COURT.willingness.dryVesselThird,
    ];
    const step = Math.min(vessel.beyond, ladder.length - 1);
    terms.push(
      term(
        'His vessel is dry',
        `He owes you ${vessel.capacityDays} days a year and you have already drunk them. This is the ${ordinal(vessel.beyond + 1)} time past the bond.`,
        ladder[step] ?? COURT.willingness.dryVesselThird,
        occ.summonActId ? [occ.summonActId] : [],
      ),
    );
  }

  // 7. The season.
  const seasonTerm = seasonPenalty(c, houseId, at);
  if (seasonTerm) terms.push(seasonTerm);

  // 8. Fellows already refusing. Counted one level deep only: asking every
  //    fellow what his fellows are doing would never terminate, and a faction is
  //    a room of men looking at each other once, not forever.
  if (opts.countFellows !== false) {
    const fellows = fellowsOf(c, houseId, at);
    const refusing = fellows.filter((f) => {
      const w = readWillingness(c, occ, f, at, { countFellows: false });
      return bandFor(w.value).fraction <= 0;
    });
    if (refusing.length > 0) {
      terms.push(
        term(
          'His faction is refusing',
          `${refusing.length} ${refusing.length === 1 ? 'house he stands with is' : 'houses he stands with are'} refusing this summons, and he can count.`,
          COURT.willingness.cabalFellowRefusing * refusing.length,
        ),
      );
    }
  }

  // 9. War weariness.
  const recent = recentBattles(c, at);
  if (recent.length > 0) {
    terms.push(
      term(
        'War weariness',
        `${recent.length} ${recent.length === 1 ? 'battle' : 'battles'} in two years. His people are tired of burying men.`,
        Math.max(
          COURT.willingness.warWearinessCap,
          COURT.willingness.warWearinessPerRecentBattle * recent.length,
        ),
        recent,
      ),
    );
  }

  // 10. Mercenaries preferred.
  const scorned = campaignsLeftOut(c, houseId, at);
  if (scorned.length > 0) {
    terms.push(
      term(
        'You hired strangers instead',
        `${scorned.length} ${scorned.length === 1 ? 'war' : 'wars'} fought with hired men he was not called to. He heard about all of them.`,
        Math.max(
          COURT.willingness.mercenaryScornCap,
          COURT.willingness.mercenaryScornPerCampaign * scorned.length,
        ),
        scorned,
      ),
    );
  }

  // 11. A long way to go.
  if (Number.isFinite(leagues) && leagues > 60) {
    terms.push(
      term(
        'A long way to go',
        `${Math.round(leagues)} leagues. That is a fortnight of somebody else's roads before a blow is struck.`,
        COURT.willingness.distantMusterOver60Leagues,
      ),
    );
  }

  return tally(terms);
}

function ordinal(n: number): string {
  const words = ['first', 'second', 'third', 'fourth', 'fifth'];
  return words[n - 1] ?? `${n}th`;
}

function seasonPenalty(c: Chronicle, houseId: string, at: Stamp): Term | null {
  const w = COURT.willingness;
  if (at.season === 'highsun') return null;
  if (at.season === 'seedtime') {
    return term('Called at seedtime', 'The fields are being sown. He comes, and he resents it.', w.seedtimeCall);
  }
  if (at.season === 'wolfmoon') {
    return term('Called in the wolfmoon', 'Snow, short days and no forage. Nobody wants this.', w.winterCall);
  }
  const farms = holdingsOf(c, houseId, at).some((h) => HOLDING_TYPES[h.typeId]?.farmland === true);
  if (!farms) return null;
  return term(
    'Called at harvest',
    'His people are getting the crop in. Every man you take is a field that rots.',
    w.harvestCallFarmland,
  );
}

function recentBattles(c: Chronicle, at: Stamp): string[] {
  const since = at.absolute - COURT.calendar.daysPerYear * 2;
  const seen: string[] = [];
  for (const a of c.acts) {
    if (a.kind !== 'casualty') continue;
    if (a.at.absolute > at.absolute || a.at.absolute < since) continue;
    if (!seen.includes(a.battleId)) seen.push(a.battleId);
  }
  return seen;
}

function campaignsLeftOut(c: Chronicle, houseId: string, at: Stamp): string[] {
  const out: string[] = [];
  for (const a of c.acts) {
    if (a.kind !== 'contract' || a.at.absolute > at.absolute) continue;
    const calledToSomething = c.acts.some(
      (s) =>
        s.kind === 'summon' &&
        s.calledIds.includes(houseId) &&
        Math.abs(s.at.absolute - a.at.absolute) <= COURT.calendar.daysPerSeason,
    );
    if (!calledToSomething) out.push(a.id);
  }
  return out.slice(0, 4); // the cap is four campaigns' worth, so stop counting
}

// ── The nine answers ───────────────────────────────────────────────────────

/** Which band a willingness falls in. Fixed thresholds, tried from the top —
 *  this function is the whole of law 2 and it must never learn a new trick. */
export function bandFor(willingness: number): AnswerBand {
  for (const band of ANSWERS) if (willingness >= band.atLeast) return band;
  return ANSWERS[ANSWERS.length - 1]!;
}

// ── One house's answer, fully itemised ─────────────────────────────────────

export function readAnswer(
  c: Chronicle,
  campaignId: string,
  houseId: string,
  at: Stamp,
): AnswerReading {
  const occ = readOccasion(c, campaignId, at);
  if (!occ) {
    return {
      houseId,
      willingness: tally([]),
      answer: 'refusal',
      owed: 0,
      sending: 0,
      units: [],
      lateDays: 0,
      captainId: houseOf(c, houseId)?.lordCaptainId ?? '',
      scutageOffered: null,
    };
  }
  return readAnswerFor(c, occ, houseId, at);
}

export function readAnswerFor(
  c: Chronicle,
  occ: Occasion,
  houseId: string,
  at: Stamp,
): AnswerReading {
  const house = houseOf(c, houseId);
  const willingness = readWillingness(c, occ, houseId, at);
  const vessel = vesselDrunkBefore(c, houseId, at.year, occ.sentOn.absolute);

  const owed = occ.great
    ? Math.round(vessel.owedMen * COURT.obligation.greatSummonsMenMultiplier)
    : vessel.owedMen;

  // Scutage is not a rung on the ladder. It is a bargain struck in a record of
  // its own, and if that record exists it settles the matter.
  const paid = c.acts.find(
    (a) =>
      a.kind === 'accept-scutage' &&
      a.houseId === houseId &&
      a.campaignId === occ.campaignId &&
      a.at.absolute <= at.absolute,
  );
  if (paid && paid.kind === 'accept-scutage') {
    return {
      houseId,
      willingness,
      answer: 'scutage',
      owed,
      sending: 0,
      units: [],
      lateDays: 0,
      captainId: house?.lordCaptainId ?? '',
      scutageOffered: paid.crowns,
    };
  }

  const chosen = selectionFor(c, occ, houseId, at);

  return {
    houseId,
    willingness,
    answer: chosen.band.answer,
    owed,
    sending: chosen.sending,
    units: chosen.units,
    lateDays: chosen.band.lateDays + travelLateness(c, houseId, occ, at),
    captainId: captainFor(c, houseId, chosen.band, at),
    scutageOffered: wouldPayInstead(chosen.band)
      ? owed * COURT.obligation.scutageCrownsPerManOwed
      : null,
  };
}

/** Which men come, and how many of each. Separated out because the Host needs
 *  the counts and the answer sheet needs the sentences, and they must be the
 *  same decision — computed once, here, so a player can never be shown a wing on
 *  the answer sheet that is not in the army. */
export interface Pick {
  entry: RosterEntry;
  men: Men;
}

export interface Selection {
  band: AnswerBand;
  owed: Men;
  marchable: Men;
  target: Men;
  sending: Men;
  picks: Pick[];
  units: AnswerReading['units'];
}

export function selectionFor(
  c: Chronicle,
  occ: Occasion,
  houseId: string,
  at: Stamp,
): Selection {
  const willingness = readWillingness(c, occ, houseId, at);
  const band = bandFor(willingness.value);
  const vessel = vesselDrunkBefore(c, houseId, at.year, occ.sentOn.absolute);
  const owed = occ.great
    ? Math.round(vessel.owedMen * COURT.obligation.greatSummonsMenMultiplier)
    : vessel.owedMen;

  const roster = rosterOf(c, houseId, at);
  const marchable = roster.reduce((s, u) => s + u.available, 0);
  const target = Math.min(Math.round(owed * band.fraction), marchable);

  // WORST-KEPT-LAST. A willing house fills the quota from its BEST men down; an
  // unwilling one from its CHEAPEST up, so the knights are what never make the
  // cut. That is why "0.75" is a sentence and not a multiplier.
  const willing = band.fraction >= 1;
  const order = [...roster].sort((a, b) =>
    willing
      ? b.cost - a.cost || a.unitId.localeCompare(b.unitId)
      : a.cost - b.cost || a.unitId.localeCompare(b.unitId),
  );

  const units: AnswerReading['units'] = [];
  const picks: Pick[] = [];
  let sending = 0;
  for (const u of order) {
    if (band.fraction <= 0) {
      units.push({ unitId: u.unitId, sent: false, why: band.reason });
      continue;
    }
    const room = target - sending;
    if (room <= 0) {
      units.push({
        unitId: u.unitId,
        sent: false,
        why: willing
          ? 'The quota was full before this wing was needed.'
          : `Kept at home: the ${u.name} are the best men he has, and he is not sending his best.`,
      });
      continue;
    }
    const take = Math.min(u.available, room);
    sending += take;
    picks.push({ entry: u, men: take });
    units.push({
      unitId: u.unitId,
      sent: true,
      why:
        take === u.available
          ? `The ${u.name} of ${u.holdingName}, all ${take} of them.`
          : `The ${u.name} of ${u.holdingName}, but only ${take} of ${u.available} — the quota filled partway through.`,
    });
  }

  return { band, owed, marchable, target, sending, picks, units };
}

function wouldPayInstead(band: AnswerBand): boolean {
  return band.fraction > 0 && band.fraction < 1;
}

/** The two unit types that belong to the Sworn Order rather than to whoever
 *  holds the abbey's land. */
export const SWORN_ORDER_UNITS: readonly string[] = ['sworn-brothers', 'relic-bearers'];

/** Every wing a house could put on a road today, with what it costs to field —
 *  which doubles as its quality, and therefore as the order in which a sullen
 *  lord sheds it. */
export interface RosterEntry {
  unitId: string;
  unitTypeId: string;
  holdingId: string;
  holdingName: string;
  name: string;
  available: Men;
  paper: Men;
  cost: number;
}

export function rosterOf(c: Chronicle, houseId: string, at: Stamp): RosterEntry[] {
  const out: RosterEntry[] = [];
  for (const holding of holdingsOf(c, houseId, at)) {
    // A town that bought its liberties musters for itself now, not for its lord
    // — that is what he sold. Its spears appear in the Host as a town militia.
    if (isChartered(c, holding.id, at)) continue;
    for (const line of readMusterRoll(c, holding.id, at)) {
      // The Sworn Order is not a vassal's to send. Its brothers come only for a
      // cause the Chaplain has blessed, and they answer their own Grandmaster.
      if (SWORN_ORDER_UNITS.includes(line.unitTypeId)) continue;
      const type = UNIT_TYPES[line.unitTypeId];
      const available = Math.max(0, line.men - line.garrisonHeld);
      if (available <= 0) continue;
      out.push({
        unitId: unitIdFor(holding.id, line.unitTypeId),
        unitTypeId: line.unitTypeId,
        holdingId: holding.id,
        holdingName: holding.name,
        name: type?.name ?? line.unitTypeId,
        available,
        paper: type?.typicalMen ?? line.men,
        cost: type?.musterCost ?? 0,
      });
    }
  }
  return out.sort((a, b) => a.unitId.localeCompare(b.unitId));
}

/** How many days past the stand-by day the roads themselves make him. Separate
 *  from the days his temper adds, because one is the court's fault and the other
 *  is his. */
export function travelLateness(c: Chronicle, houseId: string, occ: Occasion, at: Stamp): number {
  let worst = 0;
  const chancellor = seatIsFilled(c, SEAT.chancellor, at) ? seatEffect(c, SEAT.chancellor, at) : 0;
  for (const holding of holdingsOf(c, houseId, at)) {
    for (const line of readMusterRoll(c, holding.id, at)) {
      const j = journeyOf(c, holding, occ, line.unitTypeId, at, chancellor);
      const arrives = occ.sentOn.absolute + j.totalDays;
      worst = Math.max(worst, arrives - occ.standBy.absolute);
    }
  }
  return Math.max(0, worst);
}

export function journeyOf(
  c: Chronicle,
  holding: Parameters<typeof journey>[1],
  occ: Occasion,
  unitTypeId: string,
  at: Stamp,
  chancellorEffect: number,
): Journey {
  return journey(c, holding, occ.musteringPlaceId, unitTypeId, at, {
    courierBonus: chancellorEffect * 0.5,
  });
}

/** Who leads them. A house that is dragging its feet sends the least of its
 *  captains, and the Host will feel it in the obedience number. */
function captainFor(c: Chronicle, houseId: string, band: AnswerBand, at: Stamp): string {
  const house = houseOf(c, houseId);
  if (!house) return '';
  const lord = house.lordCaptainId;
  if (!band.deputy) return aliveOr(c, lord, houseId, at);
  const others = c.founding.captains
    .filter((p) => p.houseId === houseId && p.id !== lord)
    .sort((a, b) => a.command - b.command);
  return others[0]?.id ?? aliveOr(c, lord, houseId, at);
}

function aliveOr(c: Chronicle, captainId: string, houseId: string, at: Stamp): string {
  const dead = c.acts.some(
    (a) => a.kind === 'death' && a.captainId === captainId && a.at.absolute <= at.absolute,
  );
  if (!dead) return captainId;
  const house = houseOf(c, houseId);
  if (house?.heirCaptainId) return house.heirCaptainId;
  const any = c.founding.captains.find((p) => p.houseId === houseId && p.id !== captainId);
  return any?.id ?? captainId;
}

/** The grievance records behind an answer, so an absence can point straight at
 *  the decision that caused it. */
export function grievanceActIdsBehind(c: Chronicle, houseId: string, at: Stamp): string[] {
  return readGrievances(c, houseId, at)
    .filter((g) => g.weight > 0)
    .map((g) => g.actId);
}

/** What a summons would cost a house's vessel, in coin, if it paid instead. */
export function scutageFor(owed: Men): Crowns {
  return owed * COURT.obligation.scutageCrownsPerManOwed;
}

/** A stand-by day far enough out that a house could actually make it — used by
 *  the forecast, which has to invent a plausible war. */
export function soonestStandBy(c: Chronicle, houseIds: string[], placeId: string, at: Stamp): Stamp {
  let worst = 0;
  const occ: Occasion = {
    campaignId: 'forecast',
    causeId: 'a-just-claim',
    causeName: 'a just claim',
    defending: false,
    blessed: false,
    great: false,
    musteringPlaceId: placeId,
    standBy: at,
    sentOn: at,
    summonActId: null,
    calledIds: houseIds,
  };
  for (const houseId of houseIds) {
    for (const holding of holdingsOf(c, houseId, at)) {
      for (const line of readMusterRoll(c, holding.id, at)) {
        worst = Math.max(worst, journeyOf(c, holding, occ, line.unitTypeId, at, 0).totalDays);
      }
    }
  }
  return stampAt(addDays(at, worst).absolute);
}
