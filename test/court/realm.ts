// WHY THIS FILE EXISTS. Every test in this folder needs a realm to argue about,
// and it should be the SAME realm, so that a number quoted in one test can be
// checked against a number quoted in another. This is Aldmarch, the worked
// example from `docs/WRIT-THE-COURT.md` §6: six houses owing 445 men between
// them, two of the seven seats filled, and an enemy at a ford.
//
// It is a fixture, not data. Nobody real lives here.

import { foundRealm, stampOf, type Act, type CaptainRecord, type Chronicle, type RealmPlan } from '../../src/court/index.js';

export const FORD = 'aldford';
export const FOUNDED = stampOf(1, 'seedtime', 1);

function captain(
  id: string,
  name: string,
  houseId: string | null,
  born: number,
  stats: { command: number; valour: number; wits: number; aggression: number; caution: number; pride: number; greed: number },
  claims: Record<string, number> = {},
): CaptainRecord {
  return { id, name, houseId, born, ...stats, claims };
}

export const ALDMARCH_PLAN: RealmPlan = {
  name: 'Aldmarch',
  seed: 'aldmarch-the-first',
  founded: FOUNDED,
  crown: {
    houseId: 'h-crown',
    coffer: 900,
    granary: 400,
    household: [
      { unitTypeId: 'household-guard', men: 150, garrisonHeld: 0 },
      { unitTypeId: 'crown-banner', men: 40, garrisonHeld: 0 },
    ],
  },
  houses: [
    { id: 'h-crown', name: 'Aldmarch', lordCaptainId: 'c-king', heirCaptainId: 'c-prince' },
    { id: 'h-thornbury', name: 'Thornbury', lordCaptainId: 'c-thorn', heirCaptainId: 'c-thorn-heir' },
    { id: 'h-millrow', name: 'Millrow', lordCaptainId: 'c-mill', heirCaptainId: 'c-mill-heir' },
    { id: 'h-quayford', name: 'Quayford', lordCaptainId: 'c-quay', heirCaptainId: 'c-quay-heir' },
    { id: 'h-northwatch', name: 'Northwatch', lordCaptainId: 'c-north', heirCaptainId: 'c-north-heir' },
    { id: 'h-stonebeck', name: 'Stonebeck', lordCaptainId: 'c-stone' },
    { id: 'h-abbeyholt', name: 'Abbeyholt', lordCaptainId: 'c-abbot' },
  ],
  holdings: [
    { id: 'thornbury-manor', name: 'Thornbury', typeId: 'manor', provinceId: 'the-weald', leaguesTo: { [FORD]: 30 }, road: 'highway', heldBy: 'h-thornbury', owedMen: 50 },
    { id: 'thornbury-run', name: 'Hartsmeadow', typeId: 'horse-run', provinceId: 'the-weald', leaguesTo: { [FORD]: 34 }, road: 'highway', heldBy: 'h-thornbury', owedMen: 40 },
    { id: 'millrow-manor', name: 'Millrow', typeId: 'manor', provinceId: 'the-vale', leaguesTo: { [FORD]: 18 }, road: 'track', heldBy: 'h-millrow', owedMen: 60 },
    { id: 'quayford-port', name: 'Quayford', typeId: 'port', provinceId: 'the-strand', leaguesTo: { [FORD]: 55 }, road: 'highway', heldBy: 'h-quayford', owedMen: 50 },
    { id: 'quayford-town', name: 'Saltgate', typeId: 'town', provinceId: 'the-strand', leaguesTo: { [FORD]: 52 }, road: 'highway', heldBy: 'h-quayford', owedMen: 60 },
    { id: 'northwatch-fort', name: 'Northwatch', typeId: 'march-fort', provinceId: 'the-marches', leaguesTo: { [FORD]: 70 }, road: 'track', heldBy: 'h-northwatch', owedMen: 40 },
    { id: 'northwatch-castle', name: 'Coldgate', typeId: 'castle', provinceId: 'the-marches', leaguesTo: { [FORD]: 66 }, road: 'track', heldBy: 'h-northwatch', owedMen: 35 },
    { id: 'stonebeck-mine', name: 'Stonebeck', typeId: 'mine', provinceId: 'the-fells', leaguesTo: { [FORD]: 40 }, road: 'path', heldBy: 'h-stonebeck', owedMen: 25 },
    { id: 'stonebeck-weald', name: 'Harrowwood', typeId: 'weald', provinceId: 'the-fells', leaguesTo: { [FORD]: 44 }, road: 'path', heldBy: 'h-stonebeck', owedMen: 25 },
    { id: 'abbeyholt-abbey', name: 'Abbeyholt', typeId: 'abbey', provinceId: 'the-vale', leaguesTo: { [FORD]: 25 }, road: 'track', heldBy: 'h-abbeyholt', owedMen: 20 },
    { id: 'abbeyholt-manor', name: 'Lowfield', typeId: 'manor', provinceId: 'the-vale', leaguesTo: { [FORD]: 22 }, road: 'track', heldBy: 'h-abbeyholt', owedMen: 40 },
  ],
  captains: [
    captain('c-king', 'King Aldred', 'h-crown', -30, { command: 62, valour: 55, wits: 70, aggression: 45, caution: 55, pride: 60, greed: 30 }),
    captain('c-prince', 'Prince Osric', 'h-crown', -8, { command: 48, valour: 70, wits: 44, aggression: 75, caution: 25, pride: 70, greed: 40 }),
    captain('c-steward', 'Wulfric the Steward', 'h-crown', -22, { command: 40, valour: 30, wits: 74, aggression: 20, caution: 70, pride: 35, greed: 25 }, { steward: 3 }),
    captain('c-chancellor', 'Beorn of the Seal', 'h-crown', -26, { command: 30, valour: 25, wits: 82, aggression: 15, caution: 75, pride: 30, greed: 20 }, { chancellor: 4 }),
    captain('c-thorn', 'Lord Cenric of Thornbury', 'h-thornbury', -18, { command: 78, valour: 72, wits: 50, aggression: 70, caution: 30, pride: 80, greed: 45 }, { marshal: 5, constable: 2 }),
    captain('c-thorn-heir', 'Edric of Thornbury', 'h-thornbury', 4, { command: 44, valour: 60, wits: 40, aggression: 65, caution: 30, pride: 60, greed: 40 }, { marshal: 2 }),
    captain('c-mill', 'Lord Aelfwine of Millrow', 'h-millrow', -20, { command: 52, valour: 48, wits: 58, aggression: 35, caution: 60, pride: 40, greed: 30 }, { steward: 2 }),
    captain('c-mill-heir', 'Godwin of Millrow', 'h-millrow', 6, { command: 30, valour: 40, wits: 45, aggression: 40, caution: 50, pride: 35, greed: 30 }),
    captain('c-quay', 'Lady Hild of Quayford', 'h-quayford', -24, { command: 60, valour: 45, wits: 80, aggression: 30, caution: 65, pride: 75, greed: 55 }, { steward: 5, chancellor: 3 }),
    captain('c-quay-heir', 'Osgar of Quayford', 'h-quayford', 2, { command: 35, valour: 50, wits: 55, aggression: 45, caution: 45, pride: 55, greed: 50 }),
    captain('c-north', 'Lord Beorhtwulf of Northwatch', 'h-northwatch', -21, { command: 70, valour: 80, wits: 45, aggression: 75, caution: 35, pride: 65, greed: 35 }, { constable: 5, marshal: 3 }),
    captain('c-north-heir', 'Ælfgar of Northwatch', 'h-northwatch', 5, { command: 40, valour: 65, wits: 38, aggression: 70, caution: 30, pride: 50, greed: 35 }),
    captain('c-stone', 'Lord Ordgar of Stonebeck', 'h-stonebeck', -19, { command: 45, valour: 40, wits: 60, aggression: 30, caution: 65, pride: 45, greed: 70 }, { justiciar: 2 }),
    captain('c-abbot', 'Abbot Dunstan', 'h-abbeyholt', -35, { command: 35, valour: 30, wits: 78, aggression: 10, caution: 80, pride: 40, greed: 15 }, { chaplain: 5 }),
  ],
  musteringPlaces: [{ id: FORD, name: 'the ford at Aldford', provinceId: 'the-vale' }],
};

export const HOUSE_IDS: readonly string[] = [
  'h-thornbury',
  'h-millrow',
  'h-quayford',
  'h-northwatch',
  'h-stonebeck',
  'h-abbeyholt',
];

/** Aldmarch as founded, with two of seven seats filled — the Stewardship to the
 *  crown's own man (which is the slight the worked example turns on) and the
 *  Chancellery to his clerk. The Marshalcy is deliberately EMPTY. */
export function aldmarch(extra: Act[] = []): Chronicle {
  const c = foundRealm(ALDMARCH_PLAN);
  c.acts.push(
    {
      id: 'a:invest-steward',
      at: stampOf(1, 'seedtime', 10),
      by: 'crown',
      kind: 'invest',
      seatId: 'steward',
      captainId: 'c-steward',
      track: { seatId: 'crown', days: 3 },
      note: 'The Stewardship to Wulfric. Lady Hild of Quayford wanted it and said so.',
    },
    {
      id: 'a:invest-chancellor',
      at: stampOf(1, 'seedtime', 14),
      by: 'crown',
      kind: 'invest',
      seatId: 'chancellor',
      captainId: 'c-chancellor',
      track: { seatId: 'crown', days: 3 },
      note: 'The Chancellery to Beorn of the Seal.',
    },
  );
  c.acts.push(...extra);
  return c;
}

/** A war: declared, unblessed, defensive, with the whole realm called to the
 *  ford and forty-one days to get there. */
export function warAtTheFord(
  c: Chronicle,
  opts: {
    on?: ReturnType<typeof stampOf>;
    blessed?: boolean;
    defending?: boolean;
    causeId?: string;
    days?: number;
    called?: string[];
  } = {},
): Chronicle {
  const on = opts.on ?? stampOf(1, 'highsun', 20);
  const days = opts.days ?? 41;
  c.acts.push(
    {
      id: 'a:proclaim-ford',
      at: on,
      by: 'crown',
      kind: 'proclaim',
      campaignId: 'the-ford',
      causeId: opts.causeId ?? (opts.defending === false ? 'a-just-claim' : 'defence-of-the-realm'),
      defending: opts.defending !== false,
      blessed: opts.blessed === true,
      track: { seatId: 'crown', days: 2 },
      note: 'An enemy stands at the ford.',
    },
    {
      id: 'a:summon-ford',
      at: on,
      by: 'crown',
      kind: 'summon',
      campaignId: 'the-ford',
      calledIds: opts.called ?? [...HOUSE_IDS],
      musteringPlaceId: FORD,
      standBy: stampOf(on.year, on.season, on.day + days),
      great: false,
      track: { seatId: 'chancellor', days: 3 },
      note: `The host is to stand at the ford in ${days} days.`,
    },
  );
  return c;
}
