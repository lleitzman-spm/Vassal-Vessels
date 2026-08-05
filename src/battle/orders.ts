// WHAT AN ORDER COSTS A CAPTAIN, and where the price comes from.
//
// `difficulty` is subtracted straight off a captain's heed, so it is the price
// of asking for something hard while men are dying around him. Holding still
// costs nothing. Falling back out of a melee costs a great deal — which is
// exactly the shape of the real problem: the orders you most need to land late
// are the ones a frightened man is least likely to take.
//
// THE NUMBERS ARE READ FROM `data/orders.json` (law 6: a number that is not in
// `data/` does not exist). That file's vocabulary is finer than the engine's —
// it separates LOOSE_ORDER from CLOSE_ORDER, ADVANCE_TO from HOLD_POSITION —
// so the table below is a MAP from the engine's coarser order ids onto the
// data's rows, and every price comes across from the data. Where the engine has
// an order the data does not name (TAKE_POST, the two pursuit words), the
// nearest data row is used and said so.

import ordersJson from "../../data/orders.json";
import standingPlansJson from "../../data/standing-plans.json";
import type { ChargeId, OrderId, TriggerId } from "./types.js";

interface RawOrder {
  id: string;
  name: string;
  difficulty: number;
  commitTicks: number;
  windupTicks: number;
  explains: string;
}

const DATA_ORDERS = ordersJson.orders as unknown as RawOrder[];
const DATA_CHARGES = ordersJson.charges as unknown as { id: string; name: string; difficulty: number; explains: string }[];

/** Which row of `data/orders.json` each of the engine's orders is priced by.
 *  A charge id here means the price is on the standing job of the same name. */
const PRICED_BY: Record<OrderId, string> = {
  HOLD: "HOLD_POSITION",
  TAKE_POST: "ADVANCE_TO",
  ADVANCE: "ADVANCE_TO",
  ATTACK: "charge:ATTACK",
  CHARGE: "CHARGE",
  BRACE: "BRACE",
  FALL_BACK: "FALL_BACK",
  WHEEL: "WHEEL",
  SUPPORT: "charge:SUPPORT",
  SCREEN: "charge:SCREEN",
  WITHDRAW: "charge:WITHDRAW",
  PURSUE: "SET_PURSUIT",
  REIN_IN: "SET_PURSUIT",
  PLANT_STAKES: "PLANT_STAKES",
  SHOOT: "LOOSE_FIRE",
  CEASE_SHOOTING: "HOLD_FIRE",
  FORM: "CLOSE_ORDER",
  FEIGN: "FEIGN_WITHDRAWAL",
  BIND_PLAN: "BIND_PLAN",
};

function priced(id: OrderId): { difficulty: number; commitTicks: number; windupTicks: number; explains: string } {
  const key = PRICED_BY[id];
  if (key.startsWith("charge:")) {
    const row = DATA_CHARGES.find((c) => c.id === key.slice(7));
    if (!row) throw new Error(`data/orders.json has no charge "${key}"`);
    // A standing job carries a difficulty but no lock and no windup; the
    // engine's own table below supplies those.
    return { difficulty: row.difficulty, commitTicks: -1, windupTicks: -1, explains: row.explains };
  }
  const row = DATA_ORDERS.find((o) => o.id === key);
  if (!row) throw new Error(`data/orders.json has no order "${key}"`);
  return { difficulty: row.difficulty, commitTicks: row.commitTicks, windupTicks: row.windupTicks, explains: row.explains };
}

export interface OrderSheet {
  id: OrderId;
  name: string;
  /** Subtracted from heed. 0 is "anyone would do this". 70 is the feigned
   *  retreat, the hardest order in the game. */
  difficulty: number;
  /** Ticks before a new word can displace this one. A charge cannot be recalled
   *  for eight seconds — that is the commitment the whole design turns on. */
  commitTicks: number;
  /** Ticks of preparation before the order takes effect at all. */
  windupTicks: number;
  explains: string;
}

/** The engine's own words for the things it can be told to do, each priced from
 *  `data/orders.json`. `commitTicks` and `windupTicks` fall back to the value
 *  beside the id only when the data prices it as a standing job, which carries
 *  neither. */
const ORDER_ROWS: OrderSheet[] = (
  [
    ["HOLD", "Hold", 0, 0],
    ["TAKE_POST", "Take post", 0, 0],
    ["ADVANCE", "Advance", 40, 0],
    ["ATTACK", "Attack", 160, 0],
    ["CHARGE", "Charge", 160, 20],
    ["BRACE", "Brace", 0, 0],
    ["FALL_BACK", "Fall back", 0, 0],
    ["WHEEL", "Wheel", 0, 0],
    ["SUPPORT", "Support", 40, 0],
    ["SCREEN", "Screen", 0, 0],
    ["WITHDRAW", "Withdraw", 40, 0],
    ["PURSUE", "Pursue", 0, 0],
    ["REIN_IN", "Rein in", 0, 0],
    ["PLANT_STAKES", "Plant stakes", 0, 0],
    ["SHOOT", "Shoot", 0, 0],
    ["CEASE_SHOOTING", "Cease shooting", 0, 0],
    ["FORM", "Change formation", 0, 0],
    ["FEIGN", "Feign flight", 0, 0],
    ["BIND_PLAN", "Bind a plan", 0, 0],
  ] as [OrderId, string, number, number][]
).map(([id, name, commitFallback, windupFallback]) => {
  const p = priced(id);
  return {
    id,
    name,
    difficulty: p.difficulty,
    commitTicks: p.commitTicks >= 0 ? p.commitTicks : commitFallback,
    windupTicks: p.windupTicks >= 0 ? p.windupTicks : windupFallback,
    explains: p.explains,
  };
});

const ORDER_BY_ID = new Map<OrderId, OrderSheet>(ORDER_ROWS.map((o) => [o.id, o]));

export function orderSheet(id: OrderId): OrderSheet {
  const row = ORDER_BY_ID.get(id);
  if (!row) throw new Error(`unknown order "${id}"`);
  return row;
}

export function allOrderIds(): OrderId[] {
  return ORDER_ROWS.map((o) => o.id);
}

/** Extra difficulty this particular unit finds in this particular order. Kept
 *  separate from the sheet because it is about the man, not the word: telling a
 *  spear line to brace is easy; telling it to brace while horsemen are already
 *  in its flank is not. */
export function orderDifficultyModifier(id: OrderId, canBrace: boolean, isMounted: boolean, engaged: boolean): number {
  let extra = 0;
  if (id === "BRACE" && !canBrace) extra += 40; // asking men with knives to stop a horse
  if (id === "FALL_BACK" && engaged) extra += 10;
  if (id === "REIN_IN" && !isMounted) extra -= 10; // footmen were never going to catch them anyway
  if (id === "CHARGE" && !isMounted) extra += 5;
  return extra;
}

// ── the standing jobs ───────────────────────────────────────────────────────

export interface ChargeSheet {
  id: ChargeId;
  name: string;
  explains: string;
}

export const CHARGES: ChargeSheet[] = DATA_CHARGES.map((c) => ({
  id: c.id as ChargeId,
  name: c.name,
  explains: c.explains,
}));

/** What a standing job costs a captain's heed when he is asked to take it up —
 *  including at tick nought, where every contingent weighs its opening charge
 *  exactly as it would weigh a word from a rider. */
export function chargeDifficulty(id: ChargeId): number {
  const row = DATA_CHARGES.find((c) => c.id === id);
  return row ? row.difficulty : 0;
}

// ── the triggers a standing plan may watch ──────────────────────────────────

export interface TriggerSheet {
  id: TriggerId;
  name: string;
  explains: string;
}

export const TRIGGERS: TriggerSheet[] = (
  standingPlansJson.triggers as unknown as { id: string; name: string; explains: string }[]
).map((t) => ({ id: t.id as TriggerId, name: t.name, explains: t.explains }));

/** The two triggers this engine cannot yet watch. `ENEMY_ENTERS_ZONE` wants a
 *  drawn box the directive vocabulary has no shape for; it is listed so a front
 *  end can see it exists and grey it out, exactly as the contract asks for a
 *  quirk it cannot express. */
export const TRIGGERS_NOT_YET_WATCHED: TriggerId[] = ["ENEMY_ENTERS_ZONE"];
