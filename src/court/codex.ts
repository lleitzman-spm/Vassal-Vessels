// WHY THIS FILE EXISTS. Law 6 of the constitution says the wiki IS the data and
// a number that is not in `data/` does not exist. This file is how the court
// obeys that law while staying a pure, headless library: it holds the court's
// half of `data/constants.json` transcribed into TypeScript, plus the tables the
// writ names by filename but which have not been written yet.
//
// TWO THINGS TO KNOW BEFORE CHANGING A NUMBER HERE.
//
// 1. `COURT` below is a TRANSCRIPTION of `data/constants.json → court`, key for
//    key and value for value. It is not a second opinion. `test/court/codex.test.ts`
//    reads the JSON off disk and fails if one digit has drifted, so the file on
//    disk stays the authority and this file stays its echo. The transcription
//    exists because the writ gives the readings signatures that take no codex
//    argument (`readAnswer(c, campaignId, houseId, at)`), so the constants have
//    to be reachable from module scope — and the layer is forbidden any I/O.
//
// 2. Everything BELOW `COURT` is a standing-in. The writ points at
//    `data/answers.json`, `data/grievances.json`, `data/favours.json`,
//    `data/holdings.json` and `data/captains.json`, and not one of those files
//    exists yet. The tables are written here so the layer can be built and
//    driven, in the shape those files should take, and every one of them is
//    logged in `docs/OPEN-QUESTIONS.md`. When the files land, this section is
//    deleted and a loader replaces it. (`data/obligations.json → acts`, which
//    the writ also named, HAS landed — as `court.actDays` in the constants — and
//    is transcribed above with the rest.)

import causesJson from '../../data/causes.json';
import type { SeasonId } from '../core/primitives.js';
import type { AnswerKind, ReachBand, TroopKind, WeightBand } from './contract.js';

// ── The transcription of `data/constants.json → court` ─────────────────────

export const COURT = {
  calendar: {
    daysPerSeason: 90,
    seasonsPerYear: 4,
    daysPerYear: 360,
  },
  obligation: {
    serviceDaysPerYear: 40,
    scutageCrownsPerManOwed: 2,
    greatSummonsEveryYears: 5,
    greatSummonsMenMultiplier: 1.75,
    greatSummonsGrievance: 15,
    customDecayPerYearOfScutage: 0.1,
    customDecayStartsAfterYears: 3,
    beyondTheVesselGrievanceFirst: 6,
    beyondTheVesselGrievanceFurther: 8,
  },
  actDays: {
    summonOneHouse: { track: 'crown', days: 2 },
    summonRealm: { track: 'crown', days: 4 },
    greatSummons: { track: 'crown', days: 8 },
    proclaim: { track: 'crown', days: 5, daysWithChaplain: 3 },
    invest: { track: 'crown', days: 3 },
    enfeoff: { track: 'crown', days: 7 },
    attaint: { track: 'crown', days: 6 },
    amendsWergild: { track: 'crown', days: 4, crownsPerGrievancePoint: 16 },
    amendsApology: { track: 'crown', days: 6, standing: -5, settles: 10 },
    amendsJustice: { track: 'justiciar', days: 12, crowns: 40 },
    amendsJudgement: { track: 'justiciar', days: 20, crowns: 40 },
    betroth: { track: 'chancellor', days: 20, daysWithChancellor: 14, crowns: 100 },
    ward: { track: 'crown', days: 10 },
    contract: { track: 'steward', days: 6, plusTheirRidingDays: true },
    charter: { track: 'chancellor', days: 8 },
    provision: { track: 'steward', days: 3 },
    pay: { track: 'crown', days: 2 },
    tax: { track: 'steward', days: 5, revenueShare: 0.4 },
    nameCommander: { track: 'crown', days: 1 },
    march: { track: 'crown', days: 1 },
    feast: { track: 'crown', days: 12, crowns: 200 },
    tourney: { track: 'crown', days: 15, crowns: 300 },
    answerPetition: { track: 'crown', daysMin: 2, daysMax: 8 },
    learn: { track: 'spymaster', days: 10, crowns: 60 },
  },
  loyalty: {
    foundingDisposition: 50,
    kinshipBlood: 15,
    kinshipMarriage: 8,
    grievanceCoolAfterYears: 10,
    grievanceCoolShare: 0.2,
    heirInheritsGrievanceShare: 0.5,
  },
  willingness: {
    causeBonusPerLegitimacyPoint: 0.4,
    causeBonusClamp: 20,
    defendingWithin20Leagues: 25,
    defendingWithin50Leagues: 12,
    heirIsWard: 20,
    chancellorBonus: 8,
    dryVesselFirst: -15,
    dryVesselSecond: -25,
    dryVesselThird: -35,
    harvestCallFarmland: -15,
    winterCall: -20,
    seedtimeCall: -8,
    cabalFellowRefusing: -5,
    warWearinessPerRecentBattle: -3,
    warWearinessCap: -12,
    mercenaryScornPerCampaign: -4,
    mercenaryScornCap: -16,
    distantMusterOver60Leagues: -5,
  },
  resolveFormula: {
    base: 20,
    loyaltyWeight: 0.5,
    legitimacyWeight: 0.2,
    defendingHome: 15,
    unpaidMercenary: -25,
    veterancyWeight: 0.1,
    hungerWeight: -0.3,
    grievanceWeight: -0.15,
  },
  obedienceFormula: {
    base: 25,
    loyaltyWeight: 0.35,
    commanderAuthorityWeight: 0.35,
    sameHouseAsCommander: 10,
    grievanceWeight: -0.3,
    prideWeight: -0.1,
    rivalOfCommander: -20,
    swornOrderCap: 55,
  },
  treacheryFormula: {
    grievanceAbove: 40,
    grievanceWeight: 1.5,
    perUnpaidSeason: 12,
    enemyKinship: 10,
    heirIsWard: -30,
    loyaltyWeight: -0.2,
    mayTurnQuirkAt: 60,
  },
  march: {
    leaguesPerDayFoot: 8,
    leaguesPerDayHorse: 12,
    courierLeaguesPerDay: 25,
    roadFactorHighway: 1.0,
    roadFactorTrack: 0.75,
    roadFactorPath: 0.5,
    gatherDaysMin: 3,
    gatherDaysMax: 10,
    forcedMarchSpeed: 1.5,
    forcedMarchFatiguePerDay: 6,
    forcedMarchAttritionPerDay: 0.01,
  },
  wear: {
    dailyWearFoot: 3,
    dailyWearHorse: 2,
    dailyWearMilitia: 5,
    restRecoveryPerDay: 8,
    constableFatigueReduction: 0.3,
  },
  supply: {
    sacksPerHundredMenPerDay: 1,
    hungerPerDayWithoutFood: 8,
    provisionCrownsPerSack: 2,
    stewardProvisionDiscount: 0.3,
  },
  coin: {
    householdCrownsPerManPerSeason: 3,
    mercenaryContractCrownsPerMan: 2,
    mercenaryUpkeepCrownsPerManPerSeason: 4,
    seatStipendCrownsPerSeason: 60,
  },
  seats: {
    loyaltyFactorFloor: 0.5,
    loyaltyFactorPer100Loyalty: 0.5,
    vacantEffect: 0.5,
    customaryAfterYears: 8,
    customaryGrievance: 25,
    hereditaryAfterYears: 16,
    hereditaryGrievance: 40,
    tyrannyGrievanceToAll: 2,
    passedOverPerClaimPoint: 4,
    unseatedPerYear: 1,
    unseatedCap: 8,
  },
  regeneration: {
    menPerHoldingPerYear: 6,
    veterancyCap: 80,
    destroyedUnitRebuildYears: 4,
  },
  battleJoins: {
    orderCapacityVacantMarshal: 2,
    orderCapacityBaseMarshal: 4,
    orderCapacityPerCompetenceAbove50: 0.04,
    authorityBase: 40,
    authorityPerEffect: 40,
    authorityStandingDivisor: 5,
    authorityCrownBloodBonus: 10,
    bloodDebtExcessThreshold: 0.1,
    bloodDebtPerFivePointsExcess: 1,
    bloodDebtCap: 25,
    victoryLegitimacy: 8,
    routLegitimacy: -12,
    warWithoutBattleLegitimacy: -4,
    bannerStandingToCrown: 5,
    bannerStandingToCaptain: 3,
  },
} as const;

// ── The seasons ────────────────────────────────────────────────────────────
//
// The order is the constitution's (§3, "Seasons"). Forage is the writ's own
// worked pair — 1.2 at harvest, 0.4 in winter — and the two in between are read
// off the same curve. Speed and wear are this file's reading of "each season
// changes march speed, wear, forage and willingness"; the willingness half is in
// `COURT.willingness` where the writ put it.

export const SEASON_ORDER: readonly SeasonId[] = ['seedtime', 'highsun', 'harvest', 'wolfmoon'];

export interface SeasonRow {
  name: string;
  /** Multiplier on march speed: mud in seedtime, hard roads at highsun, snow in
   *  wolfmoon. */
  speed: number;
  /** Multiplier on the fatigue a day's march costs. */
  wear: number;
  /** What the land gives back to a host standing on it. */
  forage: number;
  /** How much a winter march buys in surprise (0..1). Nobody expects an army in
   *  the snow. */
  surprise: number;
  explains: string;
}

export const SEASONS: Record<SeasonId, SeasonRow> = {
  seedtime: {
    name: 'Seedtime',
    speed: 0.9,
    wear: 1.0,
    forage: 0.8,
    surprise: 0.1,
    explains: 'The fields are being sown and the roads are soft. Men come, but they resent it.',
  },
  highsun: {
    name: 'Highsun',
    speed: 1.0,
    wear: 1.0,
    forage: 1.2,
    surprise: 0,
    explains: 'The campaigning season. Hard roads, long light, and nobody is surprised to see you.',
  },
  harvest: {
    name: 'Harvest',
    speed: 0.95,
    wear: 1.0,
    forage: 1.2,
    surprise: 0.15,
    explains: 'The trap. The going is good and the granary is full, and every farmer you call is losing his year.',
  },
  wolfmoon: {
    name: 'Wolfmoon',
    speed: 0.7,
    wear: 1.3,
    forage: 0.4,
    surprise: 0.5,
    explains: 'The gamble. Slow, cold, hungry — and the one season an enemy will not believe you have come.',
  },
};

// ── The answers (standing in for `data/answers.json`) ──────────────────────
//
// Nine bands on one falling ladder, and the ladder is the whole of law 2: no
// dice, fixed thresholds, so a player who can read can predict. The tenth answer
// in the vocabulary — scutage — is NOT a band. It is a bargain struck in a record
// of its own, which is why the writ counts nine here and ten in the union.
//
// The eight named behaviours of the constitution (§8.2) run down these bands in
// order: murmurs, short measure, foot-dragging, withholding his best, faction,
// public defiance, revolt, treachery.

export interface AnswerBand {
  answer: AnswerKind;
  /** The willingness at which this band begins. Bands are tried from the top. */
  atLeast: number;
  /** How much of the quota comes. */
  fraction: number;
  /** Days after the stand-by day before he arrives. */
  lateDays: number;
  /** He sends a lesser man in his place. */
  deputy: boolean;
  /** He answers the summons by joining the enemy. */
  turns: boolean;
  reason: string;
  explains: string;
}

export const ANSWERS: readonly AnswerBand[] = [
  {
    answer: 'more-than-owed',
    atLeast: 95,
    fraction: 1.25,
    lateDays: 0,
    deputy: false,
    turns: false,
    reason: 'Came with more than he owed.',
    explains: 'He is delighted to be asked and brings men he did not have to bring.',
  },
  {
    answer: 'in-full',
    atLeast: 75,
    fraction: 1.0,
    lateDays: 0,
    deputy: false,
    turns: false,
    reason: 'Came in full.',
    explains: 'Exactly what the grant of land says he owes, on the day it says he owes it.',
  },
  {
    answer: 'near-full',
    atLeast: 60,
    fraction: 0.9,
    lateDays: 0,
    deputy: false,
    turns: false,
    reason: 'Came very nearly in full.',
    explains: 'A tenth of the quota is missing and there is a reason for every man of it. Murmurs.',
  },
  {
    answer: 'short',
    atLeast: 45,
    fraction: 0.75,
    lateDays: 0,
    deputy: false,
    turns: false,
    reason: 'Came short.',
    explains: 'Three quarters, and his best men are the ones who stayed at home. Short measure.',
  },
  {
    answer: 'late-and-short',
    atLeast: 32,
    fraction: 0.6,
    lateDays: 5,
    deputy: false,
    turns: false,
    reason: 'Came late and came short.',
    explains: 'The letter took a long time to find him, he says. Foot-dragging.',
  },
  {
    answer: 'deputy',
    atLeast: 22,
    fraction: 0.5,
    lateDays: 8,
    deputy: true,
    turns: false,
    reason: 'Sent a deputy with half the quota.',
    explains: 'He did not come himself. A younger cousin brought half the men and none of the standing.',
  },
  {
    answer: 'token',
    atLeast: 12,
    fraction: 0.2,
    lateDays: 12,
    deputy: true,
    turns: false,
    reason: 'Sent a token.',
    explains: 'A fifth of the quota, arriving after everything is decided. This is defiance with a fig leaf.',
  },
  {
    answer: 'refusal',
    atLeast: 3,
    fraction: 0,
    lateDays: 0,
    deputy: false,
    turns: false,
    reason: 'Refused the summons.',
    explains: 'He read the letter and did nothing, in front of witnesses. Every other house is watching.',
  },
  {
    answer: 'turncoat',
    atLeast: -1000,
    fraction: 0,
    lateDays: 0,
    deputy: false,
    turns: true,
    reason: 'Answered the summons by joining the enemy.',
    explains:
      'He has decided you are the worse bet. You could have read this number before you sent the letter, which is what makes it your fault and therefore a story.',
  },
];

// ── The grievances (standing in for `data/grievances.json`) ────────────────
//
// A grudge does not fade. It is settled, or it cools by a fifth after ten years,
// or an heir takes half of it. `raw` is what the slight is worth the day it
// happens; where the weight depends on the act (how many years a seat was held,
// how badly a house bled), the reading computes it and this row only names and
// explains it.

export interface GrievanceRow {
  kind: string;
  raw: number;
  /** How readily amends settle it: a wergild buys a point of this kind per
   *  crown-rate below. Some things money does not buy. */
  settleable: boolean;
  explains: string;
}

export const GRIEVANCES: Record<string, GrievanceRow> = {
  'passed-over': {
    kind: 'passed-over',
    raw: 0, // computed: claim × COURT.seats.passedOverPerClaimPoint
    settleable: true,
    explains: 'He wanted the seat, said so, and watched somebody else take it.',
  },
  'passed-over-command': {
    kind: 'passed-over-command',
    raw: 0, // computed: claim × passedOverPerClaimPoint, every war
    settleable: true,
    explains: 'A commander was named for this war and it was not him. Every war asks the question again.',
  },
  unseated: {
    kind: 'unseated',
    raw: 0, // computed from years held
    settleable: true,
    explains: 'The seat was taken back. The longer he held it the more it was his.',
  },
  'seat-left-empty': {
    kind: 'seat-left-empty',
    raw: 0, // computed: years vacant, capped
    settleable: true,
    explains: 'The office he wants sits empty and the crown does the work badly. It sours slowly.',
  },
  attainted: {
    kind: 'attainted',
    raw: 60,
    settleable: false,
    explains: 'His lands were taken by force. There is no coin that buys this back.',
  },
  tyranny: {
    kind: 'tyranny',
    raw: COURT.seats.tyrannyGrievanceToAll,
    settleable: true,
    explains: 'A house was stripped, and every other house did the arithmetic about itself.',
  },
  'ward-soured': {
    kind: 'ward-soured',
    raw: 0, // computed: years held beyond three
    settleable: true,
    explains: 'His heir has been at your court a long time now, and the word for it has changed.',
  },
  'ward-died': {
    kind: 'ward-died',
    raw: 80,
    settleable: false,
    explains:
      'The child he handed you died in your keeping. This is the worst thing in the book and it spreads to every kinsman.',
  },
  'turned-away': {
    kind: 'turned-away',
    raw: 8,
    settleable: true,
    explains: 'He came to the gate and asked, and was sent home with nothing.',
  },
  'over-called': {
    kind: 'over-called',
    raw: 0, // computed: escalating with each draw past the vessel
    settleable: true,
    explains: 'You called him past the forty days the grant of land says he owes.',
  },
  'great-summons': {
    kind: 'great-summons',
    raw: COURT.obligation.greatSummonsGrievance,
    settleable: true,
    explains:
      'You called out the whole strength of the land. Forgiven entirely if you win; twice as heavy if you lose.',
  },
  'blood-debt': {
    kind: 'blood-debt',
    raw: 0, // computed from the excess loss share
    settleable: true,
    explains: 'His men died far worse than everybody else’s. Bleeding alongside the rest is no claim; this is.',
  },
  unrewarded: {
    kind: 'unrewarded',
    raw: 10,
    settleable: true,
    explains: 'He distinguished himself in a battle a year ago and nothing whatever came of it.',
  },
  unransomed: {
    kind: 'unransomed',
    raw: 0, // computed: 3 a season, cap 30
    settleable: true,
    explains: 'His kinsman is still in a cell somewhere and you have not paid.',
  },
  disgraced: {
    kind: 'disgraced',
    raw: 12,
    settleable: true,
    explains: 'The court said out loud that he faltered, and he did not think he had.',
  },
  punished: {
    kind: 'punished',
    raw: 20,
    settleable: false,
    explains: 'Justice was done and it was done to him. The strongest settlement makes the next grudge.',
  },
  chartered: {
    kind: 'chartered',
    raw: 14,
    settleable: true,
    explains: 'A town on his land was given its liberties, and a fifth of what it paid him now goes elsewhere.',
  },
  avenge: {
    kind: 'avenge',
    raw: 25,
    settleable: false,
    explains: 'His father died in a battle the house believes was thrown away.',
  },
};
// NOTE what is NOT a grievance here: preferring mercenaries. Hiring strangers
// for a war a vassal was not called to is a WILLINGNESS term (§3.1,
// `mercenaryScornPerCampaign`) and nothing else. Making it a grudge as well
// would count the same fact twice, and a number counted twice is a number the
// player cannot predict.

// ── The favours (standing in for `data/favours.json`) ──────────────────────
//
// Generosity is a subscription, not a purchase. Each kind splits into a part
// that holds while the thing is still TRUE — he still has the seat, he still has
// the land — and a part that decays on its own half-life. Stop giving and the
// fading half is gone in a few years.

export interface FavourRow {
  kind: string;
  standing: number;
  fading: number;
  halfLifeYears: number;
  explains: string;
}

export const FAVOURS: Record<string, FavourRow> = {
  'seat-granted': {
    kind: 'seat-granted',
    standing: 15,
    fading: 8,
    halfLifeYears: 4,
    explains: 'You gave him one of the seven offices. He has it still, and that part never fades.',
  },
  'land-granted': {
    kind: 'land-granted',
    standing: 20,
    fading: 0,
    halfLifeYears: 1,
    explains: 'You gave him land. Land is the only generous currency in the game and it does not wear out.',
  },
  wergild: {
    kind: 'wergild',
    standing: 0,
    fading: 10,
    halfLifeYears: 6,
    explains: 'You paid the price of a man in coin, publicly, which is the old and correct way.',
  },
  apology: {
    kind: 'apology',
    standing: 0,
    fading: 4,
    halfLifeYears: 2,
    explains: 'You said the words. Words are cheap and they are not nothing.',
  },
  judgement: {
    kind: 'judgement',
    standing: 0,
    fading: 7,
    halfLifeYears: 4,
    explains: 'The Justiciar heard the case and found for him.',
  },
  justice: {
    kind: 'justice',
    standing: 0,
    fading: 14,
    halfLifeYears: 5,
    explains: 'You punished the man who wronged him. The strongest settlement there is — and it makes a new grudge elsewhere.',
  },
  gift: {
    kind: 'gift',
    standing: 0,
    fading: 6,
    halfLifeYears: 3,
    explains: 'Plate, horses, a hawk. Pleasant, and forgotten in a few years.',
  },
  feast: {
    kind: 'feast',
    standing: 0,
    fading: 5,
    halfLifeYears: 2,
    explains: 'He ate at your table where everyone could see him do it.',
  },
  tourney: {
    kind: 'tourney',
    standing: 0,
    fading: 4,
    halfLifeYears: 2,
    explains: 'You held a tourney and his young men had somewhere to be dangerous.',
  },
  betrothal: {
    kind: 'betrothal',
    standing: 6,
    fading: 4,
    halfLifeYears: 5,
    explains: 'A marriage is promised between your houses. Not yet kin — but promised.',
  },
  'ransom-paid': {
    kind: 'ransom-paid',
    standing: 0,
    fading: 18,
    halfLifeYears: 6,
    explains: 'You bought his kinsman out of a cell. Nobody forgets that quickly.',
  },
  'defended-his-land': {
    kind: 'defended-his-land',
    standing: 0,
    fading: 12,
    halfLifeYears: 5,
    explains: 'You brought the host to his border when it was his border that was burning.',
  },
};

// ── The holdings (standing in for `data/holdings.json`) ────────────────────
//
// A holding is a piece of land that yields coin, grain and named men. The men
// are OF it: lose the holding and the Spears of Millrow stop existing, which is
// a very different sentence from "you lost eight percent of your infantry".

export interface HoldingTypeRow {
  id: string;
  name: string;
  coinPerSeason: number;
  grainPerSeason: number;
  /** Days between the letter arriving and the men being on the road. */
  gatherDays: number;
  /** Whether a harvest call falls on it. A miner does not lose his year in
   *  Harvest; a farmer does. */
  farmland: boolean;
  /** What it raises, and how many men of each. */
  raises: { unitTypeId: string; men: number; garrisonHeld: number }[];
  explains: string;
}

export const HOLDING_TYPES: Record<string, HoldingTypeRow> = {
  manor: {
    id: 'manor',
    name: 'Manor',
    coinPerSeason: 40,
    grainPerSeason: 30,
    gatherDays: 5,
    farmland: true,
    raises: [
      { unitTypeId: 'spearmen', men: 60, garrisonHeld: 0 },
      { unitTypeId: 'bowmen', men: 40, garrisonHeld: 0 },
    ],
    explains: 'Fields, a hall and the people who work them. The backbone of every host you will ever field.',
  },
  castle: {
    id: 'castle',
    name: 'Castle',
    coinPerSeason: 25,
    grainPerSeason: 10,
    gatherDays: 4,
    farmland: false,
    raises: [
      { unitTypeId: 'men-at-arms', men: 40, garrisonHeld: 16 },
      { unitTypeId: 'crossbowmen', men: 30, garrisonHeld: 12 },
    ],
    explains: 'Professional soldiers, and a wall that will not let most of them leave.',
  },
  town: {
    id: 'town',
    name: 'Town',
    coinPerSeason: 90,
    grainPerSeason: 15,
    gatherDays: 3,
    farmland: true,
    raises: [
      { unitTypeId: 'militia-spears', men: 120, garrisonHeld: 30 },
      { unitTypeId: 'crossbowmen', men: 30, garrisonHeld: 8 },
    ],
    explains: 'Money, and a great many spears held by people who would rather be shopkeeping.',
  },
  port: {
    id: 'port',
    name: 'Port',
    coinPerSeason: 110,
    grainPerSeason: 20,
    gatherDays: 4,
    farmland: false,
    raises: [{ unitTypeId: 'marines', men: 50, garrisonHeld: 10 }],
    explains: 'The richest thing on the map and the hardest to defend. Its fighters are dock-fighters.',
  },
  abbey: {
    id: 'abbey',
    name: 'Abbey',
    coinPerSeason: 30,
    grainPerSeason: 45,
    gatherDays: 6,
    farmland: true,
    raises: [
      { unitTypeId: 'sworn-brothers', men: 60, garrisonHeld: 0 },
      { unitTypeId: 'relic-bearers', men: 25, garrisonHeld: 0 },
    ],
    explains: 'Grain, physicians, and sixty men who answer their own Grandmaster before your Marshal.',
  },
  'march-fort': {
    id: 'march-fort',
    name: 'March-fort',
    coinPerSeason: 15,
    grainPerSeason: 10,
    gatherDays: 3,
    farmland: false,
    raises: [{ unitTypeId: 'march-riders', men: 50, garrisonHeld: 30 }],
    explains: 'The frontier. Its riders are the best light horse in the realm and most of them cannot leave the wall.',
  },
  'horse-run': {
    id: 'horse-run',
    name: 'Horse-run',
    coinPerSeason: 35,
    grainPerSeason: 20,
    gatherDays: 6,
    farmland: false,
    raises: [{ unitTypeId: 'knights', men: 40, garrisonHeld: 0 }],
    explains: 'Grass, mares and armoured men. The most expensive forty men in the game.',
  },
  mine: {
    id: 'mine',
    name: 'Mine',
    coinPerSeason: 95,
    grainPerSeason: 0,
    gatherDays: 5,
    farmland: false,
    raises: [{ unitTypeId: 'pick-men', men: 40, garrisonHeld: 0 }],
    explains: 'Silver, and men with hammers you should keep far away from anything you love.',
  },
  weald: {
    id: 'weald',
    name: 'Weald',
    coinPerSeason: 20,
    grainPerSeason: 10,
    gatherDays: 7,
    farmland: false,
    raises: [{ unitTypeId: 'foresters', men: 60, garrisonHeld: 0 }],
    explains: 'Woodland and the people who eat because they can hit a moving deer.',
  },
};

// ── The units, the court's half (`data/units.json`, top of each entry) ─────
//
// The battle reads the bottom half of those rows — mass, reach, refusal, traits.
// The court reads only this much: where they come from, how they march, what
// they cost, and the coarse words the contract uses so ANY engine can map them.
// `test/court/codex.test.ts` checks these against the file on disk.

export interface UnitTypeRow {
  id: string;
  name: string;
  raisedBy: readonly string[];
  typicalMen: number;
  marchSpeed: number;
  dailyWear: number;
  skill: number;
  drillBase: number;
  armour: number;
  musterCost: number;
  kind: TroopKind;
  reach: ReachBand;
  weight: WeightBand;
  traits: readonly string[];
  defaultQuirks: readonly string[];
}

export const UNIT_TYPES: Record<string, UnitTypeRow> = {
  'militia-spears': { id: 'militia-spears', name: 'Militia Spears', raisedBy: ['town'], typicalMen: 120, marchSpeed: 7, dailyWear: 5, skill: 20, drillBase: 30, armour: 25, musterCost: 30, kind: 'foot', reach: 'melee', weight: 'light', traits: ['CanBrace'], defaultQuirks: ['will-not-leave-the-province', 'holds-to-the-last-on-own-land'] },
  spearmen: { id: 'spearmen', name: 'Levy Spearmen', raisedBy: ['manor'], typicalMen: 60, marchSpeed: 8, dailyWear: 3, skill: 25, drillBase: 40, armour: 25, musterCost: 55, kind: 'foot', reach: 'melee', weight: 'light', traits: ['CanBrace'], defaultQuirks: [] },
  bowmen: { id: 'bowmen', name: 'Bowmen', raisedBy: ['manor'], typicalMen: 40, marchSpeed: 8, dailyWear: 3, skill: 30, drillBase: 44, armour: 25, musterCost: 130, kind: 'shot', reach: 'both', weight: 'light', traits: ['Stakes', 'MaulFinisher'], defaultQuirks: [] },
  foresters: { id: 'foresters', name: 'Foresters', raisedBy: ['weald'], typicalMen: 60, marchSpeed: 9, dailyWear: 2, skill: 34, drillBase: 25, armour: 8, musterCost: 45, kind: 'shot', reach: 'missile', weight: 'light', traits: ['Evade', 'FastFoot', 'Nimble'], defaultQuirks: ['will-not-stand-in-line'] },
  'pick-men': { id: 'pick-men', name: 'Pick-men', raisedBy: ['mine'], typicalMen: 40, marchSpeed: 8, dailyWear: 4, skill: 15, drillBase: 10, armour: 8, musterCost: 20, kind: 'foot', reach: 'melee', weight: 'light', traits: ['Fragile'], defaultQuirks: ['breaks-early'] },
  'men-at-arms': { id: 'men-at-arms', name: 'Men-at-Arms', raisedBy: ['castle'], typicalMen: 40, marchSpeed: 7, dailyWear: 3, skill: 78, drillBase: 66, armour: 88, musterCost: 420, kind: 'foot', reach: 'melee', weight: 'heavy', traits: ['CanBrace', 'ArmourWall'], defaultQuirks: [] },
  crossbowmen: { id: 'crossbowmen', name: 'Crossbowmen', raisedBy: ['castle', 'town'], typicalMen: 30, marchSpeed: 7, dailyWear: 3, skill: 38, drillBase: 56, armour: 55, musterCost: 190, kind: 'shot', reach: 'both', weight: 'medium', traits: ['Pavise', 'ArmourPiercer'], defaultQuirks: [] },
  marines: { id: 'marines', name: 'Marines', raisedBy: ['port'], typicalMen: 50, marchSpeed: 8, dailyWear: 3, skill: 58, drillBase: 62, armour: 55, musterCost: 180, kind: 'foot', reach: 'melee', weight: 'medium', traits: ['CanBrace', 'ShieldWall'], defaultQuirks: [] },
  knights: { id: 'knights', name: 'Knights', raisedBy: ['horse-run'], typicalMen: 40, marchSpeed: 12, dailyWear: 2, skill: 84, drillBase: 58, armour: 88, musterCost: 600, kind: 'horse', reach: 'melee', weight: 'heavy', traits: ['Mounted', 'Shock', 'Proud', 'Ransomable'], defaultQuirks: ['charges-without-orders', 'first-to-plunder'] },
  'march-riders': { id: 'march-riders', name: 'March Riders', raisedBy: ['march-fort'], typicalMen: 50, marchSpeed: 14, dailyWear: 2, skill: 48, drillBase: 55, armour: 34, musterCost: 160, kind: 'horse', reach: 'both', weight: 'light', traits: ['Mounted', 'ShootOnMove', 'Feigner', 'Nimble', 'Pursuer'], defaultQuirks: ['veterans-know-the-ground'] },
  'household-guard': { id: 'household-guard', name: 'Household Guard', raisedBy: ['household'], typicalMen: 150, marchSpeed: 8, dailyWear: 2, skill: 72, drillBase: 85, armour: 70, musterCost: 0, kind: 'foot', reach: 'melee', weight: 'medium', traits: ['CanBrace', 'ShieldWall'], defaultQuirks: [] },
  'sworn-brothers': { id: 'sworn-brothers', name: 'Sworn Brothers', raisedBy: ['abbey'], typicalMen: 60, marchSpeed: 8, dailyWear: 2, skill: 76, drillBase: 90, armour: 70, musterCost: 0, kind: 'foot', reach: 'melee', weight: 'medium', traits: ['CanBrace'], defaultQuirks: ['answers-to-the-grandmaster', 'will-not-flee'] },
  'company-swords': { id: 'company-swords', name: 'Free Company Swords', raisedBy: ['contract'], typicalMen: 100, marchSpeed: 9, dailyWear: 2, skill: 62, drillBase: 52, armour: 55, musterCost: 200, kind: 'foot', reach: 'melee', weight: 'medium', traits: ['PressFighter', 'Mercenary'], defaultQuirks: ['flees-early-if-unpaid', 'first-to-plunder'] },
  'company-pikes': { id: 'company-pikes', name: 'Free Company Pikes', raisedBy: ['contract'], typicalMen: 200, marchSpeed: 8, dailyWear: 3, skill: 30, drillBase: 74, armour: 34, musterCost: 210, kind: 'foot', reach: 'melee', weight: 'light', traits: ['CanBrace', 'DeepBlock', 'Mercenary'], defaultQuirks: ['flees-early-if-unpaid'] },
  'company-horse': { id: 'company-horse', name: 'Free Company Horse', raisedBy: ['contract'], typicalMen: 70, marchSpeed: 13, dailyWear: 2, skill: 58, drillBase: 54, armour: 70, musterCost: 300, kind: 'horse', reach: 'melee', weight: 'medium', traits: ['Mounted', 'Shock', 'Mercenary', 'UnpaidLeave'], defaultQuirks: ['flees-early-if-unpaid', 'first-to-plunder'] },
  'crown-banner': { id: 'crown-banner', name: 'The Crown Banner', raisedBy: ['household'], typicalMen: 40, marchSpeed: 8, dailyWear: 2, skill: 80, drillBase: 80, armour: 88, musterCost: 0, kind: 'foot', reach: 'melee', weight: 'heavy', traits: ['Standard', 'SignalSource', 'Bodyguard', 'Irreplaceable'], defaultQuirks: [] },
  'relic-bearers': { id: 'relic-bearers', name: 'Relic Bearers', raisedBy: ['abbey'], typicalMen: 25, marchSpeed: 8, dailyWear: 2, skill: 8, drillBase: 40, armour: 25, musterCost: 0, kind: 'foot', reach: 'melee', weight: 'light', traits: ['Standard', 'Holy', 'NonCombatant', 'Irreplaceable'], defaultQuirks: [] },
  bombard: { id: 'bombard', name: 'The Bombard', raisedBy: ['contract', 'port'], typicalMen: 12, marchSpeed: 5, dailyWear: 4, skill: 10, drillBase: 30, armour: 25, musterCost: 500, kind: 'engine', reach: 'missile', weight: 'light', traits: ['Immobile', 'Terrify', 'Misfires'], defaultQuirks: [] },
};

// ── The quirk vocabulary (standing in for `data/captains.json → quirks`) ───
//
// The joint between the two layers, and deliberately loose. The court emits
// these names; the battle implements what it can express and legally ignores the
// rest. Ignoring is expected, never a failure.

export const QUIRKS: Record<string, string> = {
  'charges-without-orders': 'These men will go forward at a good target whether or not you said so.',
  'first-to-plunder': 'When the enemy breaks, they will be looking at the baggage, not at your horn.',
  'flees-early-if-unpaid': 'Arrears are on their minds. They will leave before anyone else does.',
  'will-not-leave-the-province': 'Town levies fight for their own roads and get uneasy past them.',
  'holds-to-the-last-on-own-land': 'On their own ground they do not run, whatever the arithmetic says.',
  'will-not-stand-in-line': 'They will not stand where somebody can hit them back, and they are right.',
  'breaks-early': 'They will be the first thing on your side to run.',
  'answers-to-the-grandmaster': 'They obey their own order before they obey your Marshal.',
  'will-not-flee': 'They do not run away. This is not always good news.',
  'veterans-know-the-ground': 'They have raided this country since childhood and it shows.',
  'may-turn': 'The grudge is heavy enough that this contingent may change sides. It was readable before you sent the letter.',
  'will-not-fight-beside': 'There is a man on this field they will not stand next to.',
  'claims-the-van': 'He was promised the place of honour, or believes he was owed it.',
  'grieving': 'He buried a son because of a battle, and it is on him.',
  'newly-raised': 'These men have never done this before.',
};

// ── The causes of a war ────────────────────────────────────────────────────
//
// Legitimacy is what the realm thinks of the war, and it rides into every man's
// resolve. A blessed cause is worth ten times the Chaplain's effect on top.
//
// These sat as a hand-written table here for a while, under a comment admitting
// it was "standing in for `data/causes.json`". That was a law 6 violation with a
// note attached: a number that is not in `data/` does not exist, and a playtest
// must be able to tune exactly one file. It was also invisible — game content
// living in TypeScript gets no page in the Codex, so the single largest term in
// whether anybody answers your summons could not be read by anyone learning the
// game. The file exists now and this reads it.

export interface CauseRow {
  id: string;
  name: string;
  legitimacy: number;
  explains: string;
}

export const CAUSES: Record<string, CauseRow> = Object.fromEntries(
  (causesJson.causes as CauseRow[]).map((c) => [c.id, c]),
);

// ── What an act costs ─────────────────────────────────────────────────────
//
// The days come straight out of `COURT.actDays`, which is
// `data/constants.json → court.actDays` — the writ pointed at a
// `data/obligations.json → acts` table that was folded into constants instead,
// "because they are exactly the numbers a playtest turns first and because the
// calendar is the game's hardest dial." Two acts of the record vocabulary
// (`homage` and `wed`) have no row there yet; they are named below with the
// question logged in `docs/OPEN-QUESTIONS.md`.

export interface ActCostRow {
  days: number;
  /** The seat that may do this instead of the crown. If it is empty, the days
   *  come off the crown's own book, which is what "a seat you never granted is a
   *  hand you do not have" means in arithmetic. */
  track: string;
  crowns: number;
  sacks: number;
  explains: string;
}

/** The two acts the data does not price yet. Feel-chosen, and logged. */
export const UNPRICED_ACTS: Record<string, ActCostRow> = {
  homage: {
    days: 2,
    track: 'crown',
    crowns: 0,
    sacks: 0,
    explains: 'He kneels, you take his hands. An afternoon, and no row in the data yet.',
  },
  wed: {
    days: 10,
    track: 'chancellor',
    crowns: 150,
    sacks: 4,
    explains: 'A wedding: ten days of everyone important being somewhere else. No row in the data yet.',
  },
};

// ── The seven seats, by name ───────────────────────────────────────────────
//
// The ids the readings know by heart. A realm's founding book may name them
// however it likes, but a Marshal who is not called `marshal` will not set the
// order capacity, because nothing in the code would know he was the Marshal.

export const SEAT = {
  marshal: 'marshal',
  chancellor: 'chancellor',
  steward: 'steward',
  constable: 'constable',
  chaplain: 'chaplain',
  spymaster: 'spymaster',
  justiciar: 'justiciar',
} as const;

/** The seven, in the order a herald would call them. */
export const SEAT_IDS: readonly string[] = [
  SEAT.marshal,
  SEAT.chancellor,
  SEAT.steward,
  SEAT.constable,
  SEAT.chaplain,
  SEAT.spymaster,
  SEAT.justiciar,
];

// ── Feel-chosen numbers this layer needed and the data did not have ────────
//
// Each of these is logged in `docs/OPEN-QUESTIONS.md`. They are gathered here
// rather than scattered through the code so that the list of things nobody has
// tuned yet is one screen long and cannot hide.

export const CHOSEN = {
  /** A house one day late enters halfway through; two days late and it is over
   *  before he arrives. The contract lets an engine treat any value above zero
   *  as absent, so this only has to be honest, not precise. */
  lateDaysToFullyMissed: 2,
  /** Garrison duty a Constable relieves. */
  constableGarrisonRelief: 0.25,
  /** How much a summons drinks: the days the host is expected to stand. */
  defaultCampaignDays: 40,
  /** Sacks one cart carries. */
  sacksPerCart: 20,
  /** An abbey sends its infirmarer. */
  physiciansPerAbbey: 1,
  /** Grievance a house must carry before its fellows notice and gather. */
  cabalGrievanceFloor: 25,
  /** Loyalty bands, high to low. */
  bands: [
    { at: 85, name: 'Devoted' },
    { at: 70, name: 'True' },
    { at: 55, name: 'Dutiful' },
    { at: 45, name: 'Cool' },
    { at: 30, name: 'Sullen' },
    { at: 15, name: 'Estranged' },
    { at: -1000, name: 'Defiant' },
  ] as const,
  /** A distinguished captain has a year to be rewarded. */
  rewardClockDays: 360,
  /** An unransomed kinsman sours by this much each season, to a cap. */
  unransomedPerSeason: 3,
  unransomedCap: 30,
  /** A ward sours after three years, by this much a year after that. */
  wardSoursAfterYears: 3,
  wardSourPerYear: 6,
} as const;
