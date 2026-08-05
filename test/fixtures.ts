// Hosts to fight with. Everything here is invented for the tests — no real
// person, house or place is named anywhere in this repository, and the names
// below are the kind of thing a herald would cry rather than anybody's.
//
// The builder is deliberately blunt: give it a list of unit types and it hands
// back a Host the court would have produced. Tests then tilt one number at a
// time — resolve, obedience, cohesion, arrears — which is exactly how the
// engine is meant to be exercised, because every one of those is a political
// fact the player could have changed.

import type {
  Ground,
  Host,
  HostCaptain,
  HostContingent,
  HostUnit,
  Quirk,
  Stamp,
} from "../src/core/contract.js";

export const AT: Stamp = { year: 3, season: "highsun", day: 41, absolute: 1121 };

export interface UnitSpec {
  typeId: string;
  strength: number;
  name?: string;
  drill?: number;
  armour?: number;
  fatigue?: number;
  hunger?: number;
  resolve?: number;
  quirks?: Quirk[];
}

export interface ContingentSpec {
  id: string;
  name: string;
  units: UnitSpec[];
  resolve?: number;
  obedience?: number;
  treachery?: number;
  cohesion?: number;
  source?: HostContingent["source"];
  arrears?: number;
  captain?: Partial<HostCaptain>;
  quirks?: Quirk[];
}

export interface HostSpec {
  id: string;
  name: string;
  side: string;
  seed?: string;
  orderCapacity?: number;
  contingents: ContingentSpec[];
  physicians?: number;
  defending?: boolean;
}

function captain(id: string, name: string, over: Partial<HostCaptain> = {}): HostCaptain {
  return {
    id,
    name,
    seatId: null,
    command: 55,
    valour: 50,
    wits: 50,
    aggression: 50,
    caution: 40,
    pride: 40,
    greed: 30,
    loyalty: 60,
    grievance: 10,
    standing: 40,
    rivals: [],
    kin: [],
    wounded: false,
    age: 38,
    record: { battlesFought: 2, battlesWon: 1, timesDistinguished: 0, timesFled: 0 },
    quirks: [],
    ...over,
  };
}

export function makeHost(spec: HostSpec): Host {
  const units: HostUnit[] = [];
  const contingents: HostContingent[] = [];
  const captains: HostCaptain[] = [];

  for (const cs of spec.contingents) {
    const unitIds: string[] = [];
    let present = 0;
    for (let i = 0; i < cs.units.length; i++) {
      const us = cs.units[i] as UnitSpec;
      const id = `${cs.id}-u${i}`;
      unitIds.push(id);
      present += us.strength;
      units.push({
        id,
        name: us.name ?? `${nameFor(us.typeId)} of ${cs.name}`,
        story: "Mustered on the appointed day.",
        contingentId: cs.id,
        homeHoldingId: `${cs.id}-home`,
        homeHoldingName: cs.name,
        typeId: us.typeId,
        kind: kindFor(us.typeId),
        reach: "melee",
        weight: "medium",
        paperStrength: us.strength,
        strength: us.strength,
        drill: us.drill ?? 50,
        veterancy: 20,
        equipment: 50,
        armour: us.armour ?? 50,
        fatigue: us.fatigue ?? 0,
        hunger: us.hunger ?? 0,
        resolve: us.resolve ?? cs.resolve ?? 60,
        obedience: cs.obedience ?? 60,
        treachery: cs.treachery ?? 0,
        fellowship: cs.id,
        marchSpeed: 8,
        quirks: us.quirks ?? [],
      });
    }
    const capId = `${cs.id}-cap`;
    captains.push(captain(capId, cs.captain?.name ?? `the Lord of ${cs.name}`, cs.captain ?? {}));
    contingents.push({
      id: cs.id,
      name: cs.name,
      source: cs.source ?? "feudal-levy",
      captainId: capId,
      unitIds,
      resolve: cs.resolve ?? 60,
      obedience: cs.obedience ?? 60,
      treachery: cs.treachery ?? 0,
      cohesion: cs.cohesion ?? 60,
      fellowship: cs.id,
      paid: (cs.arrears ?? 0) === 0,
      arrears: cs.arrears ?? 0,
      owed: present,
      present,
      disposition: "dutiful",
      quirks: cs.quirks ?? [],
      story: `${cs.name} answered the summons.`,
    });
  }

  return {
    contract: "1.0.0",
    id: spec.id,
    name: spec.name,
    side: spec.side,
    seed: spec.seed ?? spec.id,
    mustered: AT,
    occasion: {
      causeId: "the-ford",
      causeName: "The crossing at the ford",
      defending: spec.defending ?? false,
      onOwnLand: spec.defending ?? false,
      homeHoldingIds: [],
      legitimacy: 60,
      surprise: 0,
      daysInTheField: 6,
    },
    command: {
      commanderId: `${spec.contingents[0]?.id ?? "x"}-cap`,
      authority: 60,
      orderCapacity: spec.orderCapacity ?? 4,
      chain: [],
      disputes: [],
      vanPromisedTo: null,
    },
    contingents,
    units,
    captains,
    supply: {
      provisionDays: 5,
      sacks: 40,
      forage: 1,
      baggageCarts: 6,
      physicians: spec.physicians ?? 2,
      payArrears: 0,
    },
    latecomers: [],
    absent: [],
    standing: { legitimacy: 60, momentum: 0, belief: 55 },
    notes: [],
  };
}

function nameFor(typeId: string): string {
  switch (typeId) {
    case "spearmen":
      return "Spears";
    case "militia-spears":
      return "Town Spears";
    case "bowmen":
      return "Bowmen";
    case "knights":
      return "Knights";
    case "march-riders":
      return "Riders";
    case "men-at-arms":
      return "Men-at-Arms";
    case "company-swords":
      return "Swords";
    case "company-pikes":
      return "Pikes";
    case "household-guard":
      return "Guard";
    case "crown-banner":
      return "The Crown Banner";
    case "crossbowmen":
      return "Crossbows";
    case "marines":
      return "Marines";
    default:
      return "Levy";
  }
}

function kindFor(typeId: string): HostUnit["kind"] {
  if (typeId === "knights" || typeId === "march-riders" || typeId === "company-horse") return "horse";
  if (typeId === "bowmen" || typeId === "crossbowmen" || typeId === "foresters") return "shot";
  if (typeId === "bombard") return "engine";
  return "foot";
}

export const PLAIN_GROUND: Ground = {
  id: "the-ford",
  name: "The crossing at the ford",
  holdingId: null,
  season: "highsun",
  features: [],
};

export const ROLLING_GROUND: Ground = {
  id: "millrow-fields",
  name: "The fields above the mill",
  holdingId: null,
  season: "highsun",
  features: ["ridge", "wood", "road"],
};

/** Two ordinary hosts, roughly matched, which is what most tests want. */
export function twoHosts(): { a: Host; b: Host } {
  const a = makeHost({
    id: "host-a",
    name: "the Host of the Marches",
    side: "a",
    orderCapacity: 4,
    contingents: [
      {
        id: "a-crown",
        name: "the Crown's Household",
        obedience: 85,
        resolve: 80,
        cohesion: 85,
        source: "household",
        units: [
          { typeId: "crown-banner", strength: 40 },
          { typeId: "household-guard", strength: 120 },
        ],
        captain: { name: "the Marshal", command: 75, aggression: 55, valour: 65, wits: 72 },
      },
      {
        id: "a-levy",
        name: "the men of the Weald",
        obedience: 55,
        resolve: 55,
        cohesion: 50,
        units: [
          { typeId: "spearmen", strength: 90 },
          { typeId: "bowmen", strength: 60 },
        ],
        captain: { name: "the Lord of the Weald", command: 45, aggression: 35, caution: 55 },
      },
      {
        id: "a-horse",
        name: "the Knights of the Horse-run",
        obedience: 45,
        resolve: 70,
        cohesion: 65,
        units: [{ typeId: "knights", strength: 50 }],
        captain: { name: "the Knight of the Horse-run", command: 60, aggression: 80, greed: 65, pride: 75 },
      },
    ],
  });
  const b = makeHost({
    id: "host-b",
    name: "the Host of the River",
    side: "b",
    orderCapacity: 2,
    contingents: [
      {
        id: "b-crown",
        name: "the River Guard",
        obedience: 70,
        resolve: 70,
        cohesion: 70,
        source: "household",
        units: [
          { typeId: "crown-banner", strength: 40 },
          { typeId: "men-at-arms", strength: 80 },
        ],
        captain: { name: "the Captain of the River", command: 65, aggression: 45, valour: 60 },
      },
      {
        id: "b-town",
        name: "the Town of the Bridge",
        obedience: 40,
        resolve: 40,
        cohesion: 35,
        source: "town-militia",
        units: [
          { typeId: "militia-spears", strength: 140 },
          { typeId: "crossbowmen", strength: 45 },
        ],
        captain: { name: "the Bridge-Warden", command: 35, aggression: 30, caution: 75 },
      },
      {
        id: "b-company",
        name: "the Company of the Long Road",
        obedience: 50,
        resolve: 45,
        cohesion: 60,
        source: "mercenary",
        arrears: 0,
        units: [{ typeId: "company-swords", strength: 100 }],
        captain: { name: "the Captain of the Long Road", command: 62, aggression: 60, greed: 80 },
      },
    ],
  });
  return { a, b };
}
