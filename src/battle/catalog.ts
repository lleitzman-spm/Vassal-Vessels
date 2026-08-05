// WHY THIS FILE EXISTS. A unit arrives from the court as a name, a strength and
// four political numbers. Everything PHYSICAL about it — how heavy a man is, how
// far his spear reaches, how hard his line refuses a horse — lives on a type
// sheet in `data/`, and it must be looked up once, folded together, and then
// frozen. Once the battle starts, no phase asks a question of a JSON file: it
// reads the resolved sheet hanging off the unit.
//
// THE ONE RULE THAT IS EASY TO GET WRONG: where the Host and the type sheet
// overlap, THE HOST WINS. Drill and armour come from the court, because the
// court knows how well these particular men were trained and what they could
// afford. Everything the court does not carry — weapons, reach, mass, refusal,
// formations, traits — comes from the sheet.

import equipmentJson from "../../data/equipment.json";
import formationsJson from "../../data/formations.json";
import unitsJson from "../../data/units.json";

import type { Formation, MissileWeapon, UnitType, Weapon } from "./types.js";

// The JSON files are heterogeneous by design — a bombard carries fields a
// spearman does not — so they are read through these loose shapes rather than
// whatever TypeScript infers from the literal.
interface RawSheet {
  id: string;
  name: string;
  class: string;
  massPerManKg: number;
  armour: string;
  shield: string;
  primaryWeapon: string;
  sidearm: string;
  missileWeapon?: string;
  skill: number;
  drillBase: number;
  refusalBase: number;
  refusalRangeMm: number;
  turnMulPermille: number;
  fatigueMulPermille: number;
  speedMulPermille?: number;
  chargeSpeedMmPerTick?: number;
  arrivalReadyTicks?: number;
  moraleCeilingCap?: number;
  signalRadiusMm?: number;
  steadyRadiusMm?: number;
  defaultFormation: string;
  allowedFormations: string[];
  traits: string[];
  defaultQuirks?: string[];
}

interface RawWeapon {
  id: string;
  name: string;
  reachMm: number;
  pen: number;
  ratePer1000Ticks: number;
  fightingRanks: number;
  pressPenaltyPermille: number;
  shockOnly: boolean;
  twoHanded: boolean;
}

interface RawMissile {
  id: string;
  name: string;
  rangeMm: number;
  pen: number;
  shotsPer1000Ticks: number;
  ammo: number;
  flightSpeedMmPerTick: number;
  spreadPermilleOfRange: number;
  moraleMultiplierPermille: number;
  canShootMoving: boolean;
  misfirePermille?: number;
}

interface RawArmour {
  id: string;
  armour: number;
  horseArmour?: number;
  fatigueMulPermille: number;
}

interface RawShield {
  id: string;
  shield: number;
  missileBonus: number;
  requiresStationary?: boolean;
}

interface RawFormation {
  id: string;
  name: string;
  manWidthMm: number;
  rankDepthMm: number;
  targetRanksDefault?: number;
  targetFiles?: number;
  frontageMulPermille?: number;
  missileDensityPermille?: number;
  speedMulPermille: number;
  roadSpeedMulPermille?: number;
  shockDeliveredMulPermille?: number;
  shockReceivedMulPermille?: number;
  shockConcentrationMulPermille?: number;
  shockResistBonus?: number;
  frontShieldMulPermille?: number;
  cohesionCapPermille: number;
  refusalMulPermille?: number;
  allArcBrace?: boolean;
  changeTicks: number;
  requires?: string[];
}

const SHEETS = unitsJson.units as unknown as RawSheet[];
const WEAPONS = equipmentJson.weapons as unknown as RawWeapon[];
const MISSILES = equipmentJson.missileWeapons as unknown as RawMissile[];
const ARMOURS = equipmentJson.armour as unknown as RawArmour[];
const SHIELDS = equipmentJson.shields as unknown as RawShield[];
const FORMATIONS = formationsJson.formations as unknown as RawFormation[];

function must<T extends { id: string }>(rows: T[], id: string, what: string): T {
  const found = rows.find((r) => r.id === id);
  if (!found) throw new Error(`${what} "${id}" is not in data/`);
  return found;
}

function toWeapon(raw: RawWeapon): Weapon {
  return {
    id: raw.id,
    name: raw.name,
    reachMm: raw.reachMm,
    pen: raw.pen,
    ratePer1000Ticks: raw.ratePer1000Ticks,
    fightingRanks: raw.fightingRanks,
    pressPenaltyPermille: raw.pressPenaltyPermille,
    shockOnly: raw.shockOnly,
    twoHanded: raw.twoHanded,
  };
}

/** Which of the two weapons a man actually kills with once the lines are
 *  jammed together and there is no room to draw a shaft back. Rate, crowd room
 *  and penetration, multiplied — a knife at ten swings a minute with nothing in
 *  its way beats a pike at five with half its room taken away, which is the
 *  whole of the Six Seconds in one line of arithmetic. */
function pressScore(w: Weapon): number {
  return w.ratePer1000Ticks * (1000 - w.pressPenaltyPermille) * w.pen;
}

const FORMATION_CACHE = new Map<string, Formation>();

export function formation(id: string): Formation {
  const cached = FORMATION_CACHE.get(id);
  if (cached) return cached;
  const raw = must(FORMATIONS, id, "formation");
  const f: Formation = {
    id: raw.id,
    name: raw.name,
    manWidthMm: raw.manWidthMm,
    rankDepthMm: raw.rankDepthMm,
    targetRanks: raw.targetRanksDefault ?? 4,
    targetFiles: raw.targetFiles ?? 0,
    frontageMulPermille: raw.frontageMulPermille ?? 1000,
    missileDensityPermille: raw.missileDensityPermille ?? 1000,
    speedMulPermille: raw.speedMulPermille,
    roadSpeedMulPermille: raw.roadSpeedMulPermille ?? raw.speedMulPermille,
    shockDeliveredMulPermille: raw.shockDeliveredMulPermille ?? 1000,
    shockReceivedMulPermille: raw.shockReceivedMulPermille ?? 1000,
    shockConcentrationMulPermille: raw.shockConcentrationMulPermille ?? 1000,
    shockResistBonus: raw.shockResistBonus ?? 0,
    frontShieldMulPermille: raw.frontShieldMulPermille ?? 1000,
    cohesionCapPermille: raw.cohesionCapPermille,
    refusalMulPermille: raw.refusalMulPermille ?? 1000,
    allArcBrace: raw.allArcBrace ?? false,
    changeTicks: raw.changeTicks,
    requires: raw.requires ?? [],
  };
  FORMATION_CACHE.set(id, f);
  return f;
}

export function formationIds(): string[] {
  return FORMATIONS.map((f) => f.id);
}

const TYPE_CACHE = new Map<string, UnitType>();

/** Resolve a type sheet and freeze it. Called once per distinct type at muster;
 *  never during the tick. */
export function unitType(typeId: string): UnitType {
  const cached = TYPE_CACHE.get(typeId);
  if (cached) return cached;
  const s = must(SHEETS, typeId, "unit type");
  const armour = must(ARMOURS, s.armour, "armour");
  const shield = must(SHIELDS, s.shield, "shield");
  const primary = toWeapon(must(WEAPONS, s.primaryWeapon, "weapon"));
  const sidearm = toWeapon(must(WEAPONS, s.sidearm, "weapon"));
  const rawMissile = s.missileWeapon ? must(MISSILES, s.missileWeapon, "missile weapon") : null;
  const missile: MissileWeapon | null = rawMissile
    ? {
        id: rawMissile.id,
        name: rawMissile.name,
        rangeMm: rawMissile.rangeMm,
        pen: rawMissile.pen,
        shotsPer1000Ticks: rawMissile.shotsPer1000Ticks,
        ammo: rawMissile.ammo,
        flightSpeedMmPerTick: rawMissile.flightSpeedMmPerTick,
        spreadPermilleOfRange: rawMissile.spreadPermilleOfRange,
        moraleMultiplierPermille: rawMissile.moraleMultiplierPermille,
        canShootMoving: rawMissile.canShootMoving,
        misfirePermille: rawMissile.misfirePermille ?? 0,
      }
    : null;

  const traits = s.traits.slice();
  const isMounted = traits.includes("Mounted");
  const t: UnitType = {
    id: s.id,
    name: s.name,
    cls: s.class,
    massPerManKg: s.massPerManKg,
    skill: s.skill,
    drillBase: s.drillBase,
    armourBase: armour.armour,
    horseArmour: armour.horseArmour ?? 0,
    shieldBase: shield.shield,
    shieldMissileBonus: shield.missileBonus,
    shieldRequiresStationary: shield.requiresStationary ?? false,
    primary,
    sidearm,
    pressWeapon: pressScore(sidearm) > pressScore(primary) ? sidearm : primary,
    missile,
    ammo: missile ? missile.ammo : 0,
    // The Stakes trait buys a refusal of its own, planted in the ground rather
    // than carried; the numbers are in K.refusal and applied where stakes are.
    refusalBase: s.refusalBase,
    refusalRangeMm: s.refusalRangeMm,
    turnMulPermille: s.turnMulPermille,
    // The SHEET's multiplier already carries the armour ("how fast this unit
    // tires, from armour weight and the work" — data/units.json). Multiplying
    // the armour row in as well counts the harness twice and blows a household
    // guard out in ninety seconds of walking, which is how this was found.
    fatigueMulPermille: s.fatigueMulPermille,
    speedMulPermille: s.speedMulPermille ?? 1000,
    chargeSpeedMmPerTick: s.chargeSpeedMmPerTick ?? 0,
    arrivalReadyTicks: s.arrivalReadyTicks ?? 0,
    defaultFormationId: s.defaultFormation,
    allowedFormations: s.allowedFormations.slice(),
    traits,
    isMounted,
    canBrace: traits.includes("CanBrace"),
    isNonCombatant: traits.includes("NonCombatant"),
    moraleCeilingCap: s.moraleCeilingCap ?? 0,
    signalRadiusMm: s.signalRadiusMm ?? 0,
    steadyRadiusMm: s.steadyRadiusMm ?? 0,
    defaultQuirks: s.defaultQuirks ?? [],
  };
  Object.freeze(t);
  TYPE_CACHE.set(typeId, t);
  return t;
}

/** Every type the roster used, copied whole into the replay header so an old
 *  replay survives a rebalance of `data/units.json`. */
export function resolvedTypesFor(typeIds: string[]): Record<string, UnitType> {
  const out: Record<string, UnitType> = {};
  for (const id of [...new Set(typeIds)].sort()) out[id] = unitType(id);
  return out;
}

/** The default number of ranks a unit of this type stands in. A deep block
 *  stands eight deep instead of four: enormous staying power, a narrow front,
 *  and it turns like a barn. */
export function targetRanksFor(type: UnitType, f: Formation): number {
  if (type.traits.includes("DeepBlock") && f.targetRanks > 0) return f.targetRanks * 2;
  return f.targetRanks;
}
