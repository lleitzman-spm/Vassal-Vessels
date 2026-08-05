// WHY THIS FILE EXISTS. The court hands the battle a coarse hint — "there is a
// ford and a wood here, and it is Harvest" — and nothing else. The battle owns
// the ground: it grows the real tile map from that hint plus the seed, so the
// same seed and the same hint always give the same hill in the same place.
//
// AND THEN IT WRITES THE TILES INTO THE REPLAY HEADER, WHOLE. That is the point
// of the design: because the tiles are in the header, a replay never depends on
// this generator. Improve the hill-making tomorrow and every stored battle still
// plays back exactly as it did, because it carries its own ground with it.
//
// The ground types themselves are READ from `data/terrain.json`; only the
// recipe that lays them out lives here.

import terrainJson from "../../data/terrain.json";
import { clamp, idiv } from "../core/primitives.js";
import { makeRng, rnd, type Rng } from "../core/rng.js";
import type { Ground } from "../core/contract.js";
import { K } from "./rules.js";
import type { Terrain } from "./types.js";

// The ground types come from `data/terrain.json` — law 6: a number that is not
// in `data/` does not exist. The engine keeps only the INDEX of each type it
// places by hand, looked up by name at load, so a retune of the data file needs
// no change here.

export interface GroundSheet {
  id: string;
  name: string;
  speedMulPermille: number;
  /** What a charge keeps here. Mud halves the speed, and because shock is the
   *  square of the speed, it quarters the damage — the whole reason mud is on
   *  this list at all. */
  chargeSpeedMulPermille: number;
  cohesionCapPermille: number;
  fatigueMulPermille: number;
  coverLevel: number;
  blocksLOS: boolean;
  impassable: boolean;
  explains: string;
}

interface RawGround {
  id: string;
  name: string;
  speedMulPermille: number;
  chargeSpeedMulPermille: number;
  cohesionCapPermille: number;
  fatigueMulPermille: number;
  cover: number;
  blocksLineOfSight?: boolean;
  impassable?: boolean;
  explains: string;
}

export const GROUNDS: GroundSheet[] = (terrainJson.groundTypes as unknown as RawGround[]).map((g) => ({
  id: g.id,
  name: g.name,
  speedMulPermille: g.speedMulPermille,
  chargeSpeedMulPermille: g.chargeSpeedMulPermille,
  cohesionCapPermille: g.cohesionCapPermille,
  fatigueMulPermille: g.fatigueMulPermille,
  coverLevel: g.cover,
  blocksLOS: g.blocksLineOfSight === true,
  impassable: g.impassable === true,
  explains: g.explains,
}));

function indexOfGround(id: string): number {
  const at = GROUNDS.findIndex((g) => g.id === id);
  if (at < 0) throw new Error(`ground type "${id}" is not in data/terrain.json`);
  return at;
}

export const GROUND_PLAIN = indexOfGround("turf");
export const GROUND_ROAD = indexOfGround("road");
export const GROUND_MUD = indexOfGround("soft");
export const GROUND_MARSH = indexOfGround("marsh");
export const GROUND_FORD = indexOfGround("ford");
export const GROUND_WOODS = indexOfGround("woods");
export const GROUND_ROUGH = indexOfGround("scrub");

export function groundSheet(id: number): GroundSheet {
  return GROUNDS[id] ?? (GROUNDS[GROUND_PLAIN] as GroundSheet);
}

/** Value noise on a coarse lattice, interpolated in whole numbers. Not a
 *  beautiful landscape; a deterministic one, which is the requirement. */
function lattice(rng: Rng, tilesX: number, tilesY: number, spacing: number, amplitudeDm: number, out: Int16Array): void {
  const nx = idiv(tilesX, spacing) + 2;
  const ny = idiv(tilesY, spacing) + 2;
  const pts = new Int16Array(nx * ny);
  for (let i = 0; i < pts.length; i++) pts[i] = rnd(rng, amplitudeDm * 2 + 1) - amplitudeDm;
  for (let y = 0; y < tilesY; y++) {
    const gy = idiv(y, spacing);
    const fy = y - gy * spacing;
    for (let x = 0; x < tilesX; x++) {
      const gx = idiv(x, spacing);
      const fx = x - gx * spacing;
      const p00 = pts[gy * nx + gx] as number;
      const p10 = pts[gy * nx + gx + 1] as number;
      const p01 = pts[(gy + 1) * nx + gx] as number;
      const p11 = pts[(gy + 1) * nx + gx + 1] as number;
      const top = p00 + idiv((p10 - p00) * fx, spacing);
      const bot = p01 + idiv((p11 - p01) * fx, spacing);
      out[y * tilesX + x] = ((out[y * tilesX + x] as number) + top + idiv((bot - top) * fy, spacing)) as number;
    }
  }
}

function paintBlob(
  rng: Rng,
  t: Terrain,
  kind: number,
  cx: number,
  cy: number,
  radiusX: number,
  radiusY: number,
): void {
  for (let y = cy - radiusY; y <= cy + radiusY; y++) {
    if (y < 0 || y >= t.tilesY) continue;
    for (let x = cx - radiusX; x <= cx + radiusX; x++) {
      if (x < 0 || x >= t.tilesX) continue;
      const dx = ((x - cx) * 1000);
      const dy = ((y - cy) * 1000);
      const inside = idiv(dx * dx, radiusX * radiusX) + idiv(dy * dy, radiusY * radiusY);
      // A ragged edge, so a wood does not look like a stamp.
      if (inside <= 1000000 + rnd(rng, 400000) - 200000) {
        t.ground[y * t.tilesX + x] = kind;
      }
    }
  }
}

/** Grow the field. Same seed hash and same coarse ground → the same tiles,
 *  every time, on every machine. */
export function generateTerrain(seedHash: number, ground: Ground): Terrain {
  const tilesX = K.space.tilesX;
  const tilesY = K.space.tilesY;
  const t: Terrain = {
    widthMm: K.space.fieldWidthMm,
    heightMm: K.space.fieldHeightMm,
    tileMm: K.space.tileMm,
    tilesX,
    tilesY,
    elevationDm: new Int16Array(tilesX * tilesY),
    ground: new Uint8Array(tilesX * tilesY),
    cover: new Uint8Array(tilesX * tilesY),
  };
  const rng = makeRng(seedHash ^ 0x7e88a1);

  // Three lattices, coarse to fine: the shape of the country, then its folds,
  // then its lumps.
  lattice(rng, tilesX, tilesY, 40, 45, t.elevationDm);
  lattice(rng, tilesX, tilesY, 16, 18, t.elevationDm);
  lattice(rng, tilesX, tilesY, 6, 6, t.elevationDm);

  // Quantise to half a metre. Nobody can read a five-centimetre difference off
  // a battlefield, and rounding here makes the tiles in the replay header
  // compress to a fraction of their size.
  for (let i = 0; i < t.elevationDm.length; i++) {
    t.elevationDm[i] = idiv(t.elevationDm[i] as number, 5) * 5;
  }

  // The court's hints, placed in a fixed order so two hosts that list their
  // features differently still get the same field.
  const features = [...ground.features].sort();
  for (const f of features) {
    const cx = 20 + rnd(rng, tilesX - 40);
    const cy = 15 + rnd(rng, tilesY - 30);
    switch (f) {
      case "ridge": {
        // A ridge is elevation, not a ground type: it is worth taking for
        // momentum, for missile range and for the carry of your own voice.
        const bandY = cy;
        const height = 25 + rnd(rng, 25);
        for (let y = 0; y < tilesY; y++) {
          const d = y > bandY ? y - bandY : bandY - y;
          if (d > 14) continue;
          const lift = idiv(height * (14 - d), 14);
          for (let x = 0; x < tilesX; x++) {
            t.elevationDm[y * tilesX + x] = ((t.elevationDm[y * tilesX + x] as number) + lift) as number;
          }
        }
        break;
      }
      case "wood":
        paintBlob(rng, t, GROUND_WOODS, cx, cy, 10 + rnd(rng, 8), 7 + rnd(rng, 6));
        break;
      case "marsh":
        paintBlob(rng, t, GROUND_MARSH, cx, cy, 12 + rnd(rng, 8), 6 + rnd(rng, 5));
        break;
      case "mud":
        paintBlob(rng, t, GROUND_MUD, cx, cy, 14 + rnd(rng, 10), 8 + rnd(rng, 6));
        break;
      case "ford": {
        // A band of shallow crossing straight across the middle of the field.
        // Deliberately NOT impassable water: a battle the engine cannot finish
        // is worse than a battle with an easy river in it.
        const bandY = idiv(tilesY, 2) + rnd(rng, 9) - 4;
        for (let y = bandY - 1; y <= bandY + 1; y++) {
          if (y < 0 || y >= tilesY) continue;
          for (let x = 0; x < tilesX; x++) t.ground[y * tilesX + x] = GROUND_FORD;
        }
        break;
      }
      case "road": {
        const roadY = 8 + rnd(rng, tilesY - 16);
        for (let x = 0; x < tilesX; x++) {
          const wobble = idiv(x, 30) % 3;
          const y = clamp(roadY + wobble - 1, 0, tilesY - 1);
          t.ground[y * tilesX + x] = GROUND_ROAD;
        }
        break;
      }
      default:
        // An unknown feature is ignored, exactly as an unknown quirk is: the
        // court is allowed to grow a vocabulary the battle has not learned.
        break;
    }
  }

  for (let i = 0; i < t.ground.length; i++) {
    t.cover[i] = groundSheet(t.ground[i] as number).coverLevel;
  }
  return t;
}

// ── sampling ────────────────────────────────────────────────────────────────

export function tileIndex(t: Terrain, xMm: number, yMm: number): number {
  const tx = clamp(idiv(xMm, t.tileMm), 0, t.tilesX - 1);
  const ty = clamp(idiv(yMm, t.tileMm), 0, t.tilesY - 1);
  return ty * t.tilesX + tx;
}

export function elevationMm(t: Terrain, xMm: number, yMm: number): number {
  return (t.elevationDm[tileIndex(t, xMm, yMm)] as number) * 100;
}

export function groundAt(t: Terrain, xMm: number, yMm: number): GroundSheet {
  return groundSheet(t.ground[tileIndex(t, xMm, yMm)] as number);
}

export function coverAt(t: Terrain, xMm: number, yMm: number): number {
  return t.cover[tileIndex(t, xMm, yMm)] as number;
}

/** How steep the going is between two points, in parts per thousand. Uphill is
 *  positive and costs speed and wind; downhill gives a little speed back and
 *  nothing else. */
export function gradePermille(t: Terrain, x1: number, y1: number, x2: number, y2: number): number {
  const e1 = elevationMm(t, x1, y1);
  const e2 = elevationMm(t, x2, y2);
  return idiv((e2 - e1) * 1000, t.tileMm);
}

export function slopeSpeedMul(grade: number): number {
  return clamp(1000 - grade * 2, 400, 1150);
}

export function slopeFatigueMul(grade: number): number {
  return 1000 + (grade > 0 ? grade : 0) * 3;
}

/** Can these two points see each other? Integer Bresenham across the tiles: a
 *  tile blocks if it stands more than 400 mm above the sight line, or if it is
 *  woodland. There is no fog of war in this game — you can see everything and
 *  touch almost nothing — but you cannot SHOUT through a hill, and the banner's
 *  whole value is that men can see it. */
export function hasLOS(t: Terrain, x1: number, y1: number, x2: number, y2: number): boolean {
  let tx = clamp(idiv(x1, t.tileMm), 0, t.tilesX - 1);
  let ty = clamp(idiv(y1, t.tileMm), 0, t.tilesY - 1);
  const ex = clamp(idiv(x2, t.tileMm), 0, t.tilesX - 1);
  const ey = clamp(idiv(y2, t.tileMm), 0, t.tilesY - 1);
  const e1 = elevationMm(t, x1, y1) + 1700; // a man's eye is up off the ground
  const e2 = elevationMm(t, x2, y2) + 1700;
  const dxT = ex > tx ? ex - tx : tx - ex;
  const dyT = ey > ty ? ey - ty : ty - ey;
  const steps = dxT > dyT ? dxT : dyT;
  if (steps === 0) return true;
  const sx = ex > tx ? 1 : ex < tx ? -1 : 0;
  const sy = ey > ty ? 1 : ey < ty ? -1 : 0;
  let err = dxT - dyT;
  let step = 0;
  for (;;) {
    if (tx === ex && ty === ey) return true;
    const e2err = err * 2;
    if (e2err > -dyT) {
      err -= dyT;
      tx += sx;
    }
    if (e2err < dxT) {
      err += dxT;
      ty += sy;
    }
    step++;
    if (step >= steps) return true;
    const idx = ty * t.tilesX + tx;
    if (groundSheet(t.ground[idx] as number).blocksLOS) return false;
    const sight = e1 + idiv((e2 - e1) * step, steps);
    if ((t.elevationDm[idx] as number) * 100 > sight + 400) return false;
  }
}

/** Run-length encode the tiles for the replay header, so a replay carries its
 *  own ground and never has to trust this generator again. */
export function encodeTerrain(t: Terrain): {
  tilesX: number;
  tilesY: number;
  tileMm: number;
  elevationDm: number[];
  ground: number[];
  cover: number[];
} {
  const rle = (arr: Int16Array | Uint8Array): number[] => {
    const out: number[] = [];
    let i = 0;
    while (i < arr.length) {
      const v = arr[i] as number;
      let n = 1;
      while (i + n < arr.length && (arr[i + n] as number) === v) n++;
      out.push(n, v);
      i += n;
    }
    return out;
  };
  return {
    tilesX: t.tilesX,
    tilesY: t.tilesY,
    tileMm: t.tileMm,
    elevationDm: rle(t.elevationDm),
    ground: rle(t.ground),
    cover: rle(t.cover),
  };
}
