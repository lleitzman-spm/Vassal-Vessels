// WHY THIS FILE EXISTS. Everything the court has been computing exists to
// produce this one object: the army, as it actually stands, with the politics
// welded into every number. A Host is a READING — read it a day later and it
// differs, because a grudge cooled or a captain died — and it is never stored
// anywhere, which is what makes "same chronicle, same day, byte-identical host"
// true.
//
// THE FOUR NUMBERS THAT CARRY THE POLITICS ONTO THE FIELD, and the whole reason
// the two halves of this game are wired together:
//
//   resolve    — will they die for you
//   obedience  — will they carry out the tactic you issue
//   treachery  — will they turn
//   fatigue    — what your roads did to them before a blow was struck
//
// Plus `orderCapacity`, which is the court's most direct hand on the battle's
// controls: a vacant Marshalcy is two contingents you can direct at once, and a
// great Marshal is six. A player who never filled the seat fights the whole war
// two orders at a time, and can point at the day he decided that.
//
// ABSENCES ARE FINDINGS, NEVER SILENTLY SMALLER NUMBERS. Half the emotional
// payload of a muster is in `absent[]`: who owed men, who did not send them, and
// the records that caused it, so a missing wing is a clickable road back to the
// decision that lost it.

import type { Men, Score, Stamp } from '../core/primitives.js';
import { CONTRACT, hashSeed } from '../core/primitives.js';
import type { Quirk } from '../core/primitives.js';
import type {
  Absence,
  Captain,
  Contingent,
  Disposition,
  Host,
  Latecomer,
  Unit,
} from './contract.js';
import { CHOSEN, COURT, HOLDING_TYPES, QUIRKS, SEAT, UNIT_TYPES } from './codex.js';
import type { Occasion, Pick, Selection } from './answer.js';
import {
  grievanceActIdsBehind,
  journeyOf,
  readAnswerFor,
  readLegitimacy,
  readOccasion,
  selectionFor,
} from './answer.js';
import { forageOf } from './calendar.js';
import { holdingsOf } from './distance.js';
import { holderOfHolding, readGrievances } from './grievances.js';
import { kinOf, otherEnd } from './kin.js';
import { isChartered, readGranary, readMusterRoll, unitIdFor, unitNameFor } from './land.js';
import { bandOf, readLoyalty } from './loyalty.js';
import type { Chronicle } from './records.js';
import { captainOf, holdingOf, houseOf } from './records.js';
import { readAuthority, readOrderCapacity, seatEffect, seatIsFilled } from './seats.js';
import { holderOf } from './tenure.js';
import { round2 } from './tally.js';
import type { AnswerReading } from './types.js';

/** THE HOST ITSELF. Reads the whole thing out of the records and hands it to the
 *  battle. Pure: same chronicle, same day → byte-identical host, every time. */
export function readHost(c: Chronicle, campaignId: string, at: Stamp): Host {
  const occ = readOccasion(c, campaignId, at);
  if (!occ) {
    throw new Error(
      `readHost: nothing has been proclaimed and summoned for "${campaignId}". A host is read out of records; there are none.`,
    );
  }
  return assemble(c, occ, at);
}

/** The same assembly, for a war the forecast has invented rather than one the
 *  records declare. */
export function assemble(c: Chronicle, occ: Occasion, at: Stamp): Host {
  const legitimacy = readLegitimacy(c, occ, at).value;
  const commanderId = commanderFor(c, occ, at);
  const commanderHouse = captainOf(c, commanderId)?.houseId ?? null;
  const commanderStanding = standingOf(c, commanderId, at);
  const authority = clampScore(readAuthority(c, commanderId, commanderStanding, at).value);
  const orderCapacity = readOrderCapacity(c, at);

  const contingents: Contingent[] = [];
  const units: Unit[] = [];
  const absent: Absence[] = [];
  const latecomers: Latecomer[] = [];
  const answers: AnswerReading[] = [];
  const notes: string[] = [];

  const chancellor = seatIsFilled(c, SEAT.chancellor, at) ? seatEffect(c, SEAT.chancellor, at) : 0;
  const constableRelief = seatIsFilled(c, SEAT.constable, at)
    ? COURT.wear.constableFatigueReduction * seatEffect(c, SEAT.constable, at)
    : 0;

  // ── The feudal levies ───────────────────────────────────────────────────
  for (const calledId of occ.calledIds) {
    const house = houseOf(c, calledId);
    if (!house) continue;

    const answer = readAnswerFor(c, occ, calledId, at);
    answers.push(answer);
    const chosen = selectionFor(c, occ, calledId, at);
    const loyalty = readLoyalty(c, calledId, at).value;
    const grievance = grievanceWeightOf(c, calledId, at);
    const lord = captainOf(c, answer.captainId);

    if (answer.sending <= 0 || chosen.picks.length === 0) {
      absent.push(absenceFor(c, calledId, house.name, 'house', answer, chosen, at));
      continue;
    }
    if (answer.sending < answer.owed) {
      absent.push(absenceFor(c, calledId, house.name, 'house', answer, chosen, at));
    }

    const contingentId = `k:${calledId}`;
    const resolve = computeResolve(c, {
      loyalty,
      legitimacy,
      grievance,
      defendingHome: occ.defending && homeIsHere(c, calledId, occ, at),
      veterancy: 0,
      hunger: 0,
      unpaidMercenary: false,
    });
    const obedience = computeObedience(c, {
      loyalty,
      authority,
      grievance,
      pride: lord?.pride ?? 50,
      sameHouseAsCommander: commanderHouse !== null && commanderHouse === calledId,
      rivalOfCommander: isRival(c, answer.captainId, commanderId, at),
      swornOrder: false,
    });
    const treachery = computeTreachery(c, calledId, { loyalty, grievance, unpaidSeasons: 0 }, at);

    const quirks: Quirk[] = [];
    if (treachery >= COURT.treacheryFormula.mayTurnQuirkAt) {
      quirks.push(quirk('may-turn', treachery));
    }
    if (answer.answer === 'deputy' || answer.answer === 'token') {
      quirks.push(quirk('claims-the-van', 40, answer.captainId));
    }

    contingents.push({
      id: contingentId,
      name: `the men of ${house.name}`,
      source: 'feudal-levy',
      houseId: calledId,
      houseName: house.name,
      captainId: answer.captainId,
      unitIds: chosen.picks.map((p) => p.entry.unitId),
      resolve,
      obedience,
      treachery,
      cohesion: cohesionOf(c, calledId, chosen.picks, at),
      fellowship: house.name,
      paid: true,
      arrears: 0,
      owed: answer.owed,
      present: answer.sending,
      disposition: dispositionOf(answer, resolve),
      quirks,
      story: storyFor(house.name, answer, bandOf(loyalty)),
    });

    pushUnits(c, occ, at, {
      picks: chosen.picks,
      contingentId,
      resolve,
      obedience,
      treachery,
      fellowship: house.name,
      chancellor,
      constableRelief,
      latecomers,
      units,
      hunger: 0,
    });
  }

  // ── The crown's own household ───────────────────────────────────────────
  const householdPicks = householdRoster(c, at);
  if (householdPicks.length > 0) {
    const contingentId = 'k:household';
    const resolve = computeResolve(c, {
      loyalty: 100,
      legitimacy,
      grievance: 0,
      defendingHome: occ.defending,
      veterancy: 0,
      hunger: 0,
      unpaidMercenary: false,
    });
    const obedience = computeObedience(c, {
      loyalty: 100,
      authority,
      grievance: 0,
      pride: 30,
      sameHouseAsCommander: true,
      rivalOfCommander: false,
      swornOrder: false,
    });
    contingents.push({
      id: contingentId,
      name: 'the crown’s household',
      source: 'household',
      captainId: commanderId,
      unitIds: householdPicks.map((p) => p.entry.unitId),
      resolve,
      obedience,
      treachery: 0,
      cohesion: 85,
      fellowship: 'the household',
      paid: true,
      arrears: 0,
      owed: 0,
      present: householdPicks.reduce((s, p) => s + p.men, 0),
      disposition: 'willing',
      quirks: [],
      story: 'Your own paid soldiers, who live where you live. No letters, no waiting, no excuses.',
    });
    pushUnits(c, occ, at, {
      picks: householdPicks,
      contingentId,
      resolve,
      obedience,
      treachery: 0,
      fellowship: 'the household',
      chancellor,
      constableRelief,
      latecomers,
      units,
      hunger: 0,
    });
  }

  // ── Chartered towns ─────────────────────────────────────────────────────
  for (const holding of c.founding.holdings) {
    if (!isChartered(c, holding.id, at)) continue;
    // A chartered town answers for itself, so the letters may name the town —
    // but a summons that named its lord reaches it too, because the crown asked
    // that country to come and the town is in that country.
    const lord = holderOfHolding(c, holding.id, at);
    const called = occ.calledIds.includes(holding.id) || (lord !== null && occ.calledIds.includes(lord));
    if (!called) continue;
    const picks = holdingPicks(c, holding.id, at);
    if (picks.length === 0) continue;
    const contingentId = `k:town:${holding.id}`;
    const resolve = computeResolve(c, {
      loyalty: 70,
      legitimacy,
      grievance: 0,
      defendingHome: occ.defending,
      veterancy: 0,
      hunger: 0,
      unpaidMercenary: false,
    });
    const obedience = computeObedience(c, {
      loyalty: 70,
      authority,
      grievance: 0,
      pride: 20,
      sameHouseAsCommander: false,
      rivalOfCommander: false,
      swornOrder: false,
    });
    contingents.push({
      id: contingentId,
      name: `the militia of ${holding.name}`,
      source: 'town-militia',
      captainId: commanderId,
      unitIds: picks.map((p) => p.entry.unitId),
      resolve,
      obedience,
      treachery: 0,
      cohesion: 45,
      fellowship: holding.name,
      paid: true,
      arrears: 0,
      owed: 0,
      present: picks.reduce((s, p) => s + p.men, 0),
      disposition: 'dutiful',
      quirks: [quirk('will-not-leave-the-province', 60)],
      story: `${holding.name} bought its liberties and sends its spears. A fifth of its tax is gone forever.`,
    });
    pushUnits(c, occ, at, {
      picks,
      contingentId,
      resolve,
      obedience,
      treachery: 0,
      fellowship: holding.name,
      chancellor,
      constableRelief,
      latecomers,
      units,
      hunger: 0,
    });
  }

  // ── The Sworn Order ─────────────────────────────────────────────────────
  for (const holding of c.founding.holdings) {
    if (HOLDING_TYPES[holding.typeId]?.id !== 'abbey') continue;
    const picks = holdingPicks(c, holding.id, at).filter(
      (p) => p.entry.unitTypeId === 'sworn-brothers' || p.entry.unitTypeId === 'relic-bearers',
    );
    if (picks.length === 0) continue;
    if (!occ.blessed) {
      absent.push({
        whoId: holding.id,
        whoName: `the Sworn Brothers of ${holding.name}`,
        kind: 'order',
        answer: 'refusal',
        owed: picks.reduce((s, p) => s + p.men, 0),
        sent: 0,
        reason: 'The cause was not blessed.',
        explains:
          'The Sworn Order comes only for a cause a Chaplain has blessed. Nobody blessed this one, so they are in their abbey.',
        grievanceActIds: [],
      });
      notes.push(`The Sworn Order of ${holding.name} stayed in its abbey: no Chaplain blessed the cause.`);
      continue;
    }
    const contingentId = `k:order:${holding.id}`;
    const resolve = computeResolve(c, {
      loyalty: 90,
      legitimacy,
      grievance: 0,
      defendingHome: false,
      veterancy: 20,
      hunger: 0,
      unpaidMercenary: false,
    });
    const obedience = computeObedience(c, {
      loyalty: 90,
      authority,
      grievance: 0,
      pride: 60,
      sameHouseAsCommander: false,
      rivalOfCommander: false,
      swornOrder: true,
    });
    contingents.push({
      id: contingentId,
      name: `the Sworn Brothers of ${holding.name}`,
      source: 'sworn-order',
      captainId: commanderId,
      unitIds: picks.map((p) => p.entry.unitId),
      resolve,
      obedience,
      treachery: 0,
      cohesion: 90,
      fellowship: 'the Order',
      paid: true,
      arrears: 0,
      owed: 0,
      present: picks.reduce((s, p) => s + p.men, 0),
      disposition: 'eager',
      quirks: [quirk('answers-to-the-grandmaster', 70), quirk('will-not-flee', 90)],
      story: 'They came because the cause was blessed, and they will not run away, which is not always good news.',
    });
    pushUnits(c, occ, at, {
      picks,
      contingentId,
      resolve,
      obedience,
      treachery: 0,
      fellowship: 'the Order',
      chancellor,
      constableRelief,
      latecomers,
      units,
      hunger: 0,
    });
  }

  // ── Hired companies ─────────────────────────────────────────────────────
  for (const a of c.acts) {
    if (a.kind !== 'contract' || a.at.absolute > at.absolute) continue;
    if (!occ.calledIds.includes(a.companyId)) continue;
    const arrears = arrearsOf(c, a.companyId, a.at, at, a.crowns);
    const unpaidSeasons = Math.floor(arrears / Math.max(1, a.crowns));
    const picks = companyPicks(c, a.companyId, a.men, a.id);
    if (picks.length === 0) continue;
    const contingentId = `k:company:${a.companyId}`;
    const resolve = computeResolve(c, {
      loyalty: 40,
      legitimacy,
      grievance: 0,
      defendingHome: false,
      veterancy: 30,
      hunger: 0,
      unpaidMercenary: arrears > 0,
    });
    const obedience = computeObedience(c, {
      loyalty: 40,
      authority,
      grievance: 0,
      pride: 40,
      sameHouseAsCommander: false,
      rivalOfCommander: false,
      swornOrder: false,
    });
    const treachery = clampScore(
      COURT.treacheryFormula.perUnpaidSeason * unpaidSeasons +
        COURT.treacheryFormula.loyaltyWeight * 40,
    );
    contingents.push({
      id: contingentId,
      name: `the Company of ${a.companyId}`,
      source: 'mercenary',
      captainId: commanderId,
      unitIds: picks.map((p) => p.entry.unitId),
      resolve,
      obedience,
      treachery,
      cohesion: 70,
      fellowship: a.companyId,
      paid: arrears <= 0,
      arrears,
      owed: 0,
      present: picks.reduce((s, p) => s + p.men, 0),
      disposition: arrears > 0 ? 'sullen' : 'dutiful',
      quirks: arrears > 0 ? [quirk('flees-early-if-unpaid', 70)] : [],
      story:
        arrears > 0
          ? `They are owed ${arrears} crowns and they know exactly what they are owed.`
          : 'Paid up, professional, and loyal to the purse.',
    });
    pushUnits(c, occ, at, {
      picks,
      contingentId,
      resolve,
      obedience,
      treachery,
      fellowship: a.companyId,
      chancellor,
      constableRelief,
      latecomers,
      units,
      hunger: 0,
    });
  }

  // ── Everything else the letters called and nobody has accounted for ─────
  for (const calledId of occ.calledIds) {
    if (houseOf(c, calledId)) continue;
    if (contingents.some((k) => k.id.endsWith(calledId))) continue;
    if (absent.some((x) => x.whoId === calledId)) continue;
    absent.push({
      whoId: calledId,
      whoName: calledId,
      kind: 'company',
      answer: 'refusal',
      owed: 0,
      sent: 0,
      reason: 'Called, and did not come.',
      explains: 'A letter went out to them and nothing came back. Nobody has accounted for it.',
      grievanceActIds: [],
    });
  }

  const men = units.reduce((s, u) => s + u.strength, 0);
  const sacks = readGranary(c, at).value;
  const arrearsTotal = contingents.reduce((s, k) => s + k.arrears, 0);
  const abbeys = c.founding.holdings.filter((h) => h.typeId === 'abbey').length;

  return {
    contract: CONTRACT,
    id: `host:${occ.campaignId}:${at.absolute}`,
    name: `the Host of ${c.founding.houses.find((h) => h.id === c.founding.crown.houseId)?.name ?? 'the Crown'}`,
    side: 'crown',
    seed: seedFor(c, occ, at),
    mustered: at,
    occasion: {
      causeId: occ.causeId,
      causeName: occ.causeName,
      defending: occ.defending,
      onOwnLand: occ.defending,
      homeHoldingIds: units.map((u) => u.homeHoldingId),
      legitimacy,
      surprise: surpriseOf(at),
      daysInTheField: Math.max(0, at.absolute - occ.sentOn.absolute),
    },
    command: {
      commanderId,
      authority,
      orderCapacity,
      chain: contingents.map((k) => ({
        captainId: k.captainId,
        defersTo: k.captainId === commanderId ? null : commanderId,
      })),
      disputes: disputesAmong(c, contingents.map((k) => k.captainId), at),
      vanPromisedTo: vanPromisedTo(c, occ, at),
    },
    contingents,
    units,
    captains: captainsFor(c, contingents, commanderId, at),
    supply: {
      provisionDays: men > 0 ? round2(sacks / (men / 100)) : 0,
      sacks,
      forage: forageOf(at.season),
      baggageCarts: Math.ceil(sacks / CHOSEN.sacksPerCart),
      physicians: abbeys * CHOSEN.physiciansPerAbbey,
      payArrears: arrearsTotal,
    },
    latecomers,
    absent,
    standing: {
      legitimacy,
      momentum: momentumOf(c, at),
      belief: clampScore(
        contingents.length === 0
          ? 0
          : contingents.reduce((s, k) => s + k.resolve, 0) / contingents.length,
      ),
    },
    notes,
  };
}

// ── The four political numbers ─────────────────────────────────────────────

export function computeResolve(
  c: Chronicle,
  x: {
    loyalty: number;
    legitimacy: number;
    grievance: number;
    defendingHome: boolean;
    veterancy: number;
    hunger: number;
    unpaidMercenary: boolean;
  },
): Score {
  void c;
  const f = COURT.resolveFormula;
  let v: number = f.base;
  v += f.loyaltyWeight * x.loyalty;
  v += f.legitimacyWeight * (x.legitimacy - 50);
  if (x.defendingHome) v += f.defendingHome;
  v += f.veterancyWeight * x.veterancy;
  v += f.hungerWeight * x.hunger;
  v += f.grievanceWeight * x.grievance;
  if (x.unpaidMercenary) v += f.unpaidMercenary;
  return clampScore(v);
}

export function computeObedience(
  c: Chronicle,
  x: {
    loyalty: number;
    authority: number;
    grievance: number;
    pride: number;
    sameHouseAsCommander: boolean;
    rivalOfCommander: boolean;
    swornOrder: boolean;
  },
): Score {
  void c;
  const f = COURT.obedienceFormula;
  let v: number = f.base;
  v += f.loyaltyWeight * x.loyalty;
  v += f.commanderAuthorityWeight * x.authority;
  if (x.sameHouseAsCommander) v += f.sameHouseAsCommander;
  v += f.grievanceWeight * x.grievance;
  v += f.prideWeight * x.pride;
  if (x.rivalOfCommander) v += f.rivalOfCommander;
  // The Order answers its own Grandmaster first, whatever the sum says.
  if (x.swornOrder) v = Math.min(v, f.swornOrderCap);
  return clampScore(v);
}

export function computeTreachery(
  c: Chronicle,
  houseId: string,
  x: { loyalty: number; grievance: number; unpaidSeasons: number },
  at: Stamp,
): Score {
  const f = COURT.treacheryFormula;
  let v: number = Math.max(0, (x.grievance - f.grievanceAbove) * f.grievanceWeight);
  v += f.perUnpaidSeason * x.unpaidSeasons;
  if (kinAcrossTheLine(c, houseId, at)) v += f.enemyKinship;
  const house = houseOf(c, houseId);
  if (house) {
    const ward = c.acts.some(
      (a) =>
        a.kind === 'ward' &&
        a.houseId === houseId &&
        a.at.absolute <= at.absolute &&
        (!house.heirCaptainId || a.captainId === house.heirCaptainId) &&
        !c.acts.some((d) => d.kind === 'death' && d.captainId === a.captainId && d.at.absolute <= at.absolute),
    );
    if (ward) v += f.heirIsWard;
  }
  v += f.loyaltyWeight * x.loyalty;
  return clampScore(v);
}

/** A house with kin in a house that has already turned its coat. */
function kinAcrossTheLine(c: Chronicle, houseId: string, at: Stamp): boolean {
  const defected = c.acts
    .filter((a) => a.kind === 'defected' && a.at.absolute <= at.absolute)
    .map((a) => (a.kind === 'defected' ? a.subjectId : ''));
  if (defected.length === 0) return false;
  return kinOf(c, houseId, at).some((t) => defected.includes(otherEnd(t, houseId)));
}

export function clampScore(v: number): Score {
  return Math.max(0, Math.min(100, Math.round(v)));
}

// ── Assembly helpers ───────────────────────────────────────────────────────

function pushUnits(
  c: Chronicle,
  occ: Occasion,
  at: Stamp,
  x: {
    picks: Pick[];
    contingentId: string;
    resolve: Score;
    obedience: Score;
    treachery: Score;
    fellowship: string;
    chancellor: number;
    constableRelief: number;
    latecomers: Latecomer[];
    units: Unit[];
    hunger: number;
  },
): void {
  const late: { unitIds: string[]; lateDays: number } = { unitIds: [], lateDays: 0 };

  for (const pick of x.picks) {
    const type = UNIT_TYPES[pick.entry.unitTypeId];
    const holding = holdingOf(c, pick.entry.holdingId);
    const j = holding
      ? journeyOf(c, holding, occ, pick.entry.unitTypeId, at, x.chancellor)
      : { letterDays: 0, gatherDays: 0, marchDays: 0, totalDays: 0, leagues: 0, fatigue: 0 };
    const fatigue = Math.round(j.fatigue * (1 - x.constableRelief));
    const veterancy = veterancyOf(c, pick.entry.unitId, at);

    x.units.push({
      id: pick.entry.unitId,
      name: unitNameFor(pick.entry.holdingName, pick.entry.unitTypeId),
      story: `${pick.men} of them, ${j.marchDays} days on the road from ${pick.entry.holdingName}.`,
      contingentId: x.contingentId,
      homeHoldingId: pick.entry.holdingId,
      homeHoldingName: pick.entry.holdingName,
      typeId: pick.entry.unitTypeId,
      kind: type?.kind ?? 'foot',
      reach: type?.reach ?? 'melee',
      weight: type?.weight ?? 'medium',
      paperStrength: pick.entry.paper,
      strength: pick.men,
      drill: type?.drillBase ?? 40,
      veterancy,
      equipment: equipmentOf(type?.musterCost ?? 0),
      armour: type?.armour ?? 25,
      fatigue: Math.min(100, fatigue),
      hunger: x.hunger,
      resolve: x.resolve,
      obedience: x.obedience,
      treachery: x.treachery,
      fellowship: x.fellowship,
      marchSpeed: type?.marchSpeed ?? 8,
      quirks: (type?.defaultQuirks ?? []).map((id) => quirk(id, 50)),
    });

    const lateBy = occ.sentOn.absolute + j.totalDays - occ.standBy.absolute;
    if (lateBy > 0) {
      late.unitIds.push(pick.entry.unitId);
      late.lateDays = Math.max(late.lateDays, lateBy);
    }
  }

  if (late.unitIds.length > 0) {
    x.latecomers.push({
      unitIds: late.unitIds,
      contingentId: x.contingentId,
      lateDays: late.lateDays,
      entersAtFraction: Math.min(1, late.lateDays / CHOSEN.lateDaysToFullyMissed),
      explains: `The roads were ${late.lateDays} days longer than the summons allowed. They arrive with the day already begun.`,
    });
  }
}

/** Equipment is what the muster cost bought. A six-hundred-crown wing is better
 *  equipped than a twenty-crown one, and that is the only place the number
 *  needs to come from. */
function equipmentOf(musterCost: number): Score {
  return clampScore(20 + Math.min(70, musterCost / 8));
}

/** Veterancy is a reading over the battles a named wing has come through.
 *
 *  A NOTE ON THE CONTRACT. `UnitFate.veterancyGained` is a number the battle
 *  hands back, but `AftermathRecord.kind` has no word for it, so the court
 *  writes it as a `distinguished` record whose subject is a UNIT id rather than
 *  a captain id — "these men learned something". Readings that expect a captain
 *  ignore it cleanly, because a unit id is nobody's captain. This is logged in
 *  `docs/OPEN-QUESTIONS.md` as a gap in the record vocabulary. */
export function veterancyOf(c: Chronicle, unitId: string, at: Stamp): Score {
  let v = 0;
  for (const a of c.acts) {
    if (a.kind !== 'distinguished' || a.subjectId !== unitId) continue;
    if (a.at.absolute > at.absolute) continue;
    v += a.amount ?? 0;
  }
  return Math.min(COURT.regeneration.veterancyCap, Math.round(v));
}

function holdingPicks(c: Chronicle, holdingId: string, at: Stamp): Pick[] {
  const holding = holdingOf(c, holdingId);
  if (!holding) return [];
  const picks: Pick[] = [];
  for (const line of readMusterRoll(c, holdingId, at)) {
    const type = UNIT_TYPES[line.unitTypeId];
    const men = Math.max(0, line.men - line.garrisonHeld);
    if (men <= 0) continue;
    picks.push({
      entry: {
        unitId: unitIdFor(holdingId, line.unitTypeId),
        unitTypeId: line.unitTypeId,
        holdingId,
        holdingName: holding.name,
        name: type?.name ?? line.unitTypeId,
        available: men,
        paper: type?.typicalMen ?? line.men,
        cost: type?.musterCost ?? 0,
      },
      men,
    });
  }
  return picks;
}

/** The crown's household: instant, absolutely yours, and capped by coin. */
function householdRoster(c: Chronicle, at: Stamp): Pick[] {
  void at;
  const picks: Pick[] = [];
  for (const line of c.founding.crown.household) {
    const type = UNIT_TYPES[line.unitTypeId];
    const men = Math.max(0, line.men - line.garrisonHeld);
    if (men <= 0) continue;
    picks.push({
      entry: {
        unitId: unitIdFor('household', line.unitTypeId),
        unitTypeId: line.unitTypeId,
        holdingId: 'household',
        holdingName: 'the Household',
        name: type?.name ?? line.unitTypeId,
        available: men,
        paper: type?.typicalMen ?? line.men,
        cost: type?.musterCost ?? 0,
      },
      men,
    });
  }
  return picks;
}

/** A hired company brings whatever the contract bought, in whole wings. */
function companyPicks(c: Chronicle, companyId: string, men: Men, actId: string): Pick[] {
  void c;
  void actId;
  const type = UNIT_TYPES['company-swords'];
  return [
    {
      entry: {
        unitId: unitIdFor(`company-${companyId}`, 'company-swords'),
        unitTypeId: 'company-swords',
        holdingId: `company-${companyId}`,
        holdingName: `the Company of ${companyId}`,
        name: type?.name ?? 'Free Company Swords',
        available: men,
        paper: men,
        cost: type?.musterCost ?? 200,
      },
      men,
    },
  ];
}

function arrearsOf(c: Chronicle, companyId: string, from: Stamp, at: Stamp, contracted: number): number {
  const seasons = Math.floor((at.absolute - from.absolute) / COURT.calendar.daysPerSeason);
  let owed = contracted * Math.max(0, seasons);
  for (const a of c.acts) {
    if (a.kind !== 'pay' || a.toId !== companyId) continue;
    if (a.at.absolute > at.absolute) continue;
    owed -= a.crowns;
  }
  return Math.max(0, Math.round(owed));
}

/** WHY A WING IS MISSING, IN WORDS. Three different sentences, because there are
 *  three different failures and telling them apart is the whole point of the
 *  list: he is sulking, or his walls are holding his men, or he simply has not
 *  got them. */
function absenceFor(
  c: Chronicle,
  whoId: string,
  whoName: string,
  kind: Absence['kind'],
  answer: AnswerReading,
  chosen: Selection,
  at: Stamp,
): Absence {
  const worst = readGrievances(c, whoId, at)[0];
  const wanted = Math.round(chosen.owed * chosen.band.fraction);
  const heldAtHome = garrisonHeldBy(c, whoId, at);

  let explains: string;
  if (chosen.band.fraction < 1 && worst) {
    explains = `${worst.explains} That is worth ${Math.round(worst.weight)} against you, and this is what it bought.`;
  } else if (wanted > chosen.marchable && heldAtHome > 0) {
    explains = `He is willing enough — ${heldAtHome} of his men never leave their own walls, and no Constable relieves them.`;
  } else if (wanted > chosen.marchable) {
    explains = `He is willing enough and he has not got the men: ${chosen.marchable} is everything he can put on a road.`;
  } else if (worst) {
    explains = `${worst.explains} That is worth ${Math.round(worst.weight)} against you.`;
  } else {
    explains = 'No grudge and no shortage — only distance, or a dry vessel, or the season.';
  }

  return {
    whoId,
    whoName,
    kind,
    answer: answer.answer,
    owed: answer.owed,
    sent: answer.sending,
    reason: reasonFor(answer),
    explains,
    grievanceActIds: grievanceActIdsBehind(c, whoId, at),
  };
}

/** Men who are on the roll and will never march: a garrison is a wall's worth of
 *  soldiers doing exactly the job the wall was built for. */
function garrisonHeldBy(c: Chronicle, houseId: string, at: Stamp): Men {
  let held = 0;
  for (const holding of holdingsOf(c, houseId, at)) {
    for (const line of readMusterRoll(c, holding.id, at)) held += line.garrisonHeld;
  }
  return held;
}

function reasonFor(answer: AnswerReading): string {
  if (answer.sending <= 0) return 'Did not come.';
  return `Owed ${answer.owed}, sent ${answer.sending}.`;
}

function dispositionOf(answer: AnswerReading, resolve: Score): Disposition {
  if (answer.answer === 'more-than-owed') return 'eager';
  if (answer.answer === 'in-full') return 'willing';
  if (answer.answer === 'near-full' || answer.answer === 'short') return 'dutiful';
  if (resolve < 30) return 'mutinous';
  return 'sullen';
}

function storyFor(houseName: string, answer: AnswerReading, band: string): string {
  const gap = answer.owed - answer.sending;
  if (gap <= 0) return `${houseName} owed ${answer.owed} and brought ${answer.sending}. ${band}.`;
  return `${houseName} owed ${answer.owed} and brought ${answer.sending}. ${band}, and ${gap} men short.`;
}

function cohesionOf(c: Chronicle, houseId: string, picks: Pick[], at: Stamp): Score {
  void c;
  void at;
  // Men of one district under one lord hold together; a contingent scraped from
  // four holdings does not.
  const homes = new Set(picks.map((p) => p.entry.holdingId));
  void houseId;
  return clampScore(90 - (homes.size - 1) * 12);
}

function homeIsHere(c: Chronicle, houseId: string, occ: Occasion, at: Stamp): boolean {
  return holdingsOf(c, houseId, at).some((h) => (h.leaguesTo[occ.musteringPlaceId] ?? 999) <= 20);
}

function isRival(c: Chronicle, aId: string, bId: string, at: Stamp): boolean {
  if (aId === bId) return false;
  const aHouse = captainOf(c, aId)?.houseId;
  const bHouse = captainOf(c, bId)?.houseId;
  if (!aHouse || !bHouse || aHouse === bHouse) return false;
  // A rivalry is a grievance that points at a record which favoured the other
  // man. Nothing is stored: strike the investiture and they are colleagues.
  return readGrievances(c, aHouse, at).some((g) => {
    const cause = c.acts.find((x) => x.id === g.actId);
    if (!cause) return false;
    if (cause.kind === 'invest') return cause.captainId === bId;
    if (cause.kind === 'name-commander') return cause.captainId === bId;
    return false;
  });
}

function disputesAmong(c: Chronicle, captainIds: string[], at: Stamp): Host['command']['disputes'] {
  const out: Host['command']['disputes'] = [];
  for (const a of captainIds) {
    for (const b of captainIds) {
      if (a >= b) continue;
      if (!isRival(c, a, b, at) && !isRival(c, b, a, at)) continue;
      const aName = captainOf(c, a)?.name ?? a;
      const bName = captainOf(c, b)?.name ?? b;
      out.push({
        aId: a,
        bId: b,
        over: 'precedence',
        intensity: 60,
        explains: `${aName} and ${bName} both wanted the same office, and one of them got it.`,
      });
    }
  }
  return out;
}

function vanPromisedTo(c: Chronicle, occ: Occasion, at: Stamp): string | null {
  void occ;
  // The proudest seated man expects the place of honour, and the court records
  // the expectation so the battle can keep it or break it honestly.
  let best: { id: string; pride: number } | null = null;
  for (const seatId of Object.keys(c.founding.seats.reduce<Record<string, true>>((m, s) => ({ ...m, [s.id]: true }), {}))) {
    const held = holderOf(c, seatId, at);
    if (!held) continue;
    const p = captainOf(c, held.captainId);
    if (!p) continue;
    if (!best || p.pride > best.pride) best = { id: p.id, pride: p.pride };
  }
  return best?.id ?? null;
}

function commanderFor(c: Chronicle, occ: Occasion, at: Stamp): string {
  const named = c.acts.find(
    (a) =>
      a.kind === 'name-commander' && a.campaignId === occ.campaignId && a.at.absolute <= at.absolute,
  );
  if (named && named.kind === 'name-commander') return named.captainId;
  const marshal = holderOf(c, SEAT.marshal, at);
  if (marshal) return marshal.captainId;
  return houseOf(c, c.founding.crown.houseId)?.lordCaptainId ?? '';
}

function standingOf(c: Chronicle, captainId: string, at: Stamp): Score {
  let v = 50;
  for (const a of c.acts) {
    if (a.at.absolute > at.absolute) continue;
    if (a.kind === 'distinguished' && a.subjectId === captainId) v += 8;
    if (a.kind === 'disgraced' && a.subjectId === captainId) v -= 10;
    if (a.kind === 'banner-taken' && a.subjectId === captainId) v += COURT.battleJoins.bannerStandingToCaptain;
    if (a.kind === 'invest' && a.captainId === captainId) v += 10;
  }
  return clampScore(v);
}

function momentumOf(c: Chronicle, at: Stamp): number {
  let m = 0;
  const since = at.absolute - COURT.calendar.daysPerYear;
  for (const a of c.acts) {
    if (a.kind !== 'legitimacy') continue;
    if (a.at.absolute > at.absolute || a.at.absolute < since) continue;
    m += (a.amount ?? 0) > 0 ? 1 : -1;
  }
  return Math.max(-3, Math.min(3, m));
}

function surpriseOf(at: Stamp): number {
  const rows: Record<string, number> = { seedtime: 0.1, highsun: 0, harvest: 0.15, wolfmoon: 0.5 };
  return rows[at.season] ?? 0;
}

function grievanceWeightOf(c: Chronicle, houseId: string, at: Stamp): number {
  return readGrievances(c, houseId, at).reduce((s, g) => s + g.weight, 0);
}

function captainsFor(
  c: Chronicle,
  contingents: Contingent[],
  commanderId: string,
  at: Stamp,
): Captain[] {
  const ids = new Set<string>([commanderId]);
  for (const k of contingents) ids.add(k.captainId);

  const out: Captain[] = [];
  for (const id of ids) {
    const p = captainOf(c, id);
    if (!p) continue;
    const house = p.houseId ? houseOf(c, p.houseId) : undefined;
    const loyalty = p.houseId ? readLoyalty(c, p.houseId, at).value : 100;
    const grievance = p.houseId ? grievanceWeightOf(c, p.houseId, at) : 0;
    const seat = c.founding.seats.find((s) => holderOf(c, s.id, at)?.captainId === id);

    out.push({
      id,
      name: p.name,
      ...(house ? { houseId: house.id, houseName: house.name } : {}),
      seatId: seat?.id ?? null,
      command: p.command,
      valour: p.valour,
      wits: p.wits,
      aggression: p.aggression,
      caution: p.caution,
      pride: p.pride,
      greed: p.greed,
      loyalty: clampScore(loyalty),
      grievance: clampScore(grievance),
      standing: standingOf(c, id, at),
      rivals: [...ids]
        .filter((other) => other !== id && isRival(c, id, other, at))
        .map((other) => ({ captainId: other, intensity: 60 })),
      kin: p.houseId
        ? kinOf(c, p.houseId, at).flatMap((t) => {
            const otherHouse = otherEnd(t, p.houseId!);
            const lord = houseOf(c, otherHouse)?.lordCaptainId;
            return lord ? [{ captainId: lord, degree: t.degree }] : [];
          })
        : [],
      wounded: false,
      age: Math.max(0, at.year - p.born),
      record: recordOf(c, id, at),
      quirks: [],
    });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

function recordOf(c: Chronicle, captainId: string, at: Stamp): Captain['record'] {
  let fought = 0;
  let won = 0;
  let distinguished = 0;
  let fled = 0;
  const seen: string[] = [];
  for (const a of c.acts) {
    if (a.at.absolute > at.absolute) continue;
    if (a.kind === 'distinguished' && a.subjectId === captainId) distinguished += 1;
    if (a.kind === 'disgraced' && a.subjectId === captainId) fled += 1;
    if (a.kind === 'casualty' && !seen.includes(a.battleId)) {
      seen.push(a.battleId);
      fought += 1;
    }
    if (a.kind === 'legitimacy' && (a.amount ?? 0) > 0) won += 1;
  }
  return { battlesFought: fought, battlesWon: Math.min(won, fought), timesDistinguished: distinguished, timesFled: fled };
}

function quirk(id: string, intensity: number, targetId?: string): Quirk {
  return {
    id,
    explains: QUIRKS[id] ?? 'A named behaviour the battle may express or ignore.',
    intensity: clampScore(intensity),
    ...(targetId ? { targetId } : {}),
  };
}

/** The battle's die, derived from the records so the same chronicle always
 *  fights the same battle. Never a clock, never a random. */
function seedFor(c: Chronicle, occ: Occasion, at: Stamp): string {
  let h = hashSeed(c.seed);
  h = (h ^ hashSeed(occ.campaignId)) >>> 0;
  h = (h ^ at.absolute) >>> 0;
  for (const a of c.acts) if (a.at.absolute <= at.absolute) h = (h ^ hashSeed(a.id)) >>> 0;
  return `${occ.campaignId}:${h >>> 0}`;
}

/** Who holds a holding, exported for the report writers. */
export { holderOfHolding };
