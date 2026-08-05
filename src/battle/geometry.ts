// WHY THIS FILE EXISTS. Nearly every rule in the battle is really a question
// about shape: how many men can reach each other, which way is somebody facing,
// how tightly are they standing. Answer those three in one place and the rest of
// the engine stops arguing about them.
//
// THE ONE THING THAT IS NOT NEGOTIABLE. `nearby` hands its candidates back
// SORTED BY UNIT INDEX. Iterating a hash bucket in whatever order it happened
// to fill is the classic way a simulation stops being reproducible: it works
// for months, then one unit dies in a different order and the whole battle
// forks. The sort is cheap and it is the difference between a replay and a
// rumour.

import { absi, clamp, idiv, maxi } from "../core/primitives.js";
import { atan2B, cosB, signedB, sinB } from "../core/trig.js";
import { formation, targetRanksFor } from "./catalog.js";
import { K } from "./rules.js";
import type { Arc, Unit } from "./types.js";

/** Straight-line distance in millimetres. Uses the integer square root, so it
 *  is the same number on every machine. */
export function dist(ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  // Distances on this field never exceed 1.5 million mm, so the square fits
  // inside the wide bound with room to spare.
  return isqrtLocal(dx * dx + dy * dy);
}

// Imported by hand rather than through the barrel so that the hot path is one
// call deep.
import { isqrt as isqrtLocal } from "../core/primitives.js";

export function distUnits(a: Unit, b: Unit): number {
  return dist(a.posX, a.posY, b.posX, b.posY);
}

/** Rebuild a unit's shape from its strength, formation and spacing. Called
 *  whenever any of the three changes — which, in a fight, is every few ticks. */
export function recomputeGeometry(u: Unit): void {
  const f = formation(u.formationId);
  const targetRanks = targetRanksFor(u.type, f);
  let files: number;
  if (f.targetFiles > 0) {
    // Column: four men wide and long as a road.
    files = u.strength < f.targetFiles ? u.strength : f.targetFiles;
  } else {
    files = maxi(1, Math.min(idiv(u.strength + targetRanks - 1, targetRanks), u.strength));
    if (f.frontageMulPermille !== 1000) {
      // The wedge: half the frontage, so half as many men can fight — and the
      // shock concentrated into the point.
      files = maxi(1, idiv(files * f.frontageMulPermille, 1000));
    }
  }
  files = maxi(1, files);
  u.files = files;
  u.ranks = maxi(1, idiv(u.strength + files - 1, files));
  u.frontageMm = u.files * f.manWidthMm;
  u.depthMm = u.ranks * f.rankDepthMm;
  u.spacing = f.manWidthMm >= 1400 ? "LOOSE" : "CLOSE";
}

/** How tightly this unit is standing, against the reference of two men to the
 *  square metre. Arrows care about this and about nothing else. */
export function missileDensityPermille(u: Unit): number {
  const area = u.frontageMm * u.depthMm;
  if (area <= 0) return 0;
  // WIDE: strength (up to a few thousand) times a hundred million.
  const menPerSqMx100 = idiv(u.strength * 100 * 1000000, area);
  return idiv(menPerSqMx100 * 1000, K.spacing.referenceDensityMenPerSqMx100);
}

/** The centre of a unit's front line: half its depth ahead of its middle. */
export function frontCentreX(u: Unit): number {
  return u.posX + idiv(idiv(u.depthMm, 2) * cosB(u.facing), 4096);
}

export function frontCentreY(u: Unit): number {
  return u.posY + idiv(idiv(u.depthMm, 2) * sinB(u.facing), 4096);
}

/** Which arc of the DEFENDER the attacker is standing in. Front is the wedge he
 *  is looking at; rear is everything behind. Your mail still covers your back;
 *  your shield does not, and that is why getting round a flank wins battles. */
export function arcOf(attacker: Unit, defender: Unit): Arc {
  const bearing = atan2B(attacker.posY - defender.posY, attacker.posX - defender.posX);
  const rel = absi(signedB(bearing - defender.facing));
  if (rel <= K.arcs.frontHalfAngleBrads) return "FRONT";
  if (rel <= K.arcs.flankOuterHalfAngleBrads) return "FLANK";
  return "REAR";
}

/** How much of the two front lines actually face each other, in millimetres —
 *  projected onto the defender's own rank axis, because that is the direction
 *  along which his men are standing shoulder to shoulder. */
export function overlapWidth(a: Unit, b: Unit): number {
  const axis = a.facing + 1024; // the direction along a's rank
  const ux = cosB(axis);
  const uy = sinB(axis);
  const proj = (x: number, y: number): number => idiv(x * ux + y * uy, 4096); // WIDE

  const acx = frontCentreX(a);
  const acy = frontCentreY(a);
  const aHalf = idiv(a.frontageMm, 2);
  const aMid = proj(acx, acy);
  const aLo = aMid - aHalf;
  const aHi = aMid + aHalf;

  const bcx = frontCentreX(b);
  const bcy = frontCentreY(b);
  const bAxis = b.facing + 1024;
  const bHalf = idiv(b.frontageMm, 2);
  const bex = idiv(bHalf * cosB(bAxis), 4096);
  const bey = idiv(bHalf * sinB(bAxis), 4096);
  const p1 = proj(bcx - bex, bcy - bey);
  const p2 = proj(bcx + bex, bcy + bey);
  const bLo = p1 < p2 ? p1 : p2;
  const bHi = p1 < p2 ? p2 : p1;

  const lo = aLo > bLo ? aLo : bLo;
  const hi = aHi < bHi ? aHi : bHi;
  return hi > lo ? hi - lo : 0;
}

/** How far a unit's body reaches from its centre, in the direction of a given
 *  bearing. A rectangle seen from an angle, in whole numbers. */
function halfExtent(u: Unit, bearing: number): number {
  const rel = bearing - u.facing;
  const along = idiv(absi(cosB(rel)) * idiv(u.depthMm, 2), 4096);
  const across = idiv(absi(sinB(rel)) * idiv(u.frontageMm, 2), 4096);
  return along + across;
}

/** The clear ground between two bodies, floored at nothing. */
export function gapBetween(a: Unit, b: Unit): number {
  const d = distUnits(a, b);
  const bearingAB = atan2B(b.posY - a.posY, b.posX - a.posX);
  const gap = d - halfExtent(a, bearingAB) - halfExtent(b, bearingAB + 2048);
  return gap > 0 ? gap : 0;
}

/** Close enough that the two front ranks can hurt each other: the longer of the
 *  two primary weapons, plus a stride. */
export function engagementGapMm(a: Unit, b: Unit): number {
  const reach = a.type.primary.reachMm > b.type.primary.reachMm ? a.type.primary.reachMm : b.type.primary.reachMm;
  return reach + 300;
}

/** Bodies simply do not occupy the same ground. */
export const BODY_GAP_MM = 400;

/** How fast this unit is actually going, in millimetres a tick. */
export function speedOf(u: Unit): number {
  return isqrtLocal(u.velX * u.velX + u.velY * u.velY);
}

/** How fast the two are closing on each other along the line between them.
 *  Negative means they are drawing apart. */
export function closingSpeed(a: Unit, b: Unit): number {
  const bearing = atan2B(b.posY - a.posY, b.posX - a.posX);
  const ax = idiv(a.velX * cosB(bearing) + a.velY * sinB(bearing), 4096);
  const bx = idiv(b.velX * cosB(bearing) + b.velY * sinB(bearing), 4096);
  return ax - bx;
}

/** The units, in whatever order the caller asked for. The four phases that use
 *  it (perception, intent, melee, morale) are order-independent BY CONSTRUCTION
 *  — they read the top-of-tick state and add into the shadow copy — and the
 *  determinism test walks them backwards to prove it. */
export function walkUnits(units: Unit[], reverse: boolean): Unit[] {
  return reverse ? units.slice().reverse() : units;
}

// ── the spatial hash ────────────────────────────────────────────────────────

export interface SpatialHash {
  cellMm: number;
  cols: number;
  rows: number;
  buckets: number[][];
}

export function buildHash(units: Unit[], widthMm: number, heightMm: number): SpatialHash {
  const cellMm = K.space.spatialCellMm;
  const cols = idiv(widthMm, cellMm) + 1;
  const rows = idiv(heightMm, cellMm) + 1;
  const buckets: number[][] = new Array(cols * rows);
  // Units are walked in ascending index and pushed in that order, so every
  // bucket is already sorted and `nearby` never has to sort again.
  for (const u of units) {
    if (!u.onField) continue;
    const cx = clamp(idiv(u.posX, cellMm), 0, cols - 1);
    const cy = clamp(idiv(u.posY, cellMm), 0, rows - 1);
    const at = cy * cols + cx;
    const b = buckets[at];
    if (b) b.push(u.idx);
    else buckets[at] = [u.idx];
  }
  return { cellMm, cols, rows, buckets };
}

/** Every unit whose centre lies within `radiusMm` of a point, in ASCENDING
 *  INDEX ORDER. See the note at the top of this file. */
export function nearby(h: SpatialHash, units: Unit[], xMm: number, yMm: number, radiusMm: number): number[] {
  const r = idiv(radiusMm, h.cellMm) + 1;
  const cx = clamp(idiv(xMm, h.cellMm), 0, h.cols - 1);
  const cy = clamp(idiv(yMm, h.cellMm), 0, h.rows - 1);
  const out: number[] = [];
  for (let y = cy - r; y <= cy + r; y++) {
    if (y < 0 || y >= h.rows) continue;
    for (let x = cx - r; x <= cx + r; x++) {
      if (x < 0 || x >= h.cols) continue;
      const b = h.buckets[y * h.cols + x];
      if (!b) continue;
      for (const idx of b) {
        const u = units[idx] as Unit;
        if (dist(xMm, yMm, u.posX, u.posY) <= radiusMm) out.push(idx);
      }
    }
  }
  out.sort((p, q) => p - q);
  return out;
}
