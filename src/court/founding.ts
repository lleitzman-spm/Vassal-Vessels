// WHY THIS FILE EXISTS. A realm has to start somewhere, and "somewhere" must
// itself be records — otherwise the first muster would be reading a state
// nobody wrote. So founding a realm means writing down a founding book (who
// exists) and then ACTS: one enfeoffment per holding, because granting land IS
// the contract and the terms live in the record. Strike the enfeoffment and the
// house owes nothing, which is exactly what should happen.
//
// The second half of this file is a herald: it turns a Host into plain words a
// person can read out. That is not decoration. The engine is meant to be tuned
// against text before anybody draws a single soldier, and a muster you cannot
// read aloud is a muster nobody can argue with.

import type { Crowns, Sacks, Stamp } from '../core/primitives.js';
import { COURT, SEAT_IDS, UNIT_TYPES } from './codex.js';
import { stampOf } from './calendar.js';
import type { Host } from './contract.js';
import type {
  Act,
  CaptainRecord,
  Chronicle,
  FoundingBook,
  HoldingRecord,
  HouseRecord,
  RollEntry,
  SeatRecord,
} from './records.js';

export interface RealmPlan {
  name: string;
  seed: string;
  founded?: Stamp;
  crown: {
    houseId: string;
    coffer: Crowns;
    granary: Sacks;
    household: RollEntry[];
  };
  houses: HouseRecord[];
  holdings: (HoldingRecord & { heldBy: string; owedMen: number; owedDays?: number })[];
  captains: CaptainRecord[];
  seats?: SeatRecord[];
  musteringPlaces?: { id: string; name: string; provinceId: string }[];
}

/** The seven offices, with the conventional `strength` lever the readings
 *  multiply by competence and loyalty. A realm may name them otherwise, but a
 *  Marshal not called `marshal` will not set the order capacity, because nothing
 *  in the code would know he was the Marshal. */
export function sevenSeats(): SeatRecord[] {
  const names: Record<string, string> = {
    marshal: 'The Marshalcy',
    chancellor: 'The Chancellery',
    steward: 'The Stewardship',
    constable: 'The Constableship',
    chaplain: 'The Chaplaincy',
    spymaster: 'The Spymastery',
    justiciar: 'The Justiciarship',
  };
  return SEAT_IDS.map((id) => ({ id, name: names[id] ?? id, base: { strength: 1 } }));
}

/** Found a realm: a founding book, plus one enfeoffment act per holding. */
export function foundRealm(plan: RealmPlan): Chronicle {
  const founded = plan.founded ?? stampOf(1, 'seedtime', 1);

  const founding: FoundingBook = {
    founding: founded,
    crown: plan.crown,
    houses: plan.houses,
    holdings: plan.holdings.map(({ heldBy, owedMen, owedDays, ...rest }) => {
      void heldBy;
      void owedMen;
      void owedDays;
      return rest;
    }),
    captains: plan.captains,
    seats: plan.seats ?? sevenSeats(),
    ...(plan.musteringPlaces ? { musteringPlaces: plan.musteringPlaces } : {}),
  };

  const acts: Act[] = plan.holdings.map((h) => ({
    id: `f:enfeoff:${h.id}`,
    at: founded,
    by: 'crown',
    kind: 'enfeoff',
    holdingId: h.id,
    houseId: h.heldBy,
    owedMen: h.owedMen,
    owedDays: h.owedDays ?? COURT.obligation.serviceDaysPerYear,
    note: `${h.name} is granted to ${h.heldBy}, who owes ${h.owedMen} men for ${h.owedDays ?? COURT.obligation.serviceDaysPerYear} days a year.`,
  }));

  return { founding, acts, seed: plan.seed };
}

// ── The herald ─────────────────────────────────────────────────────────────

/** A Host, read out loud. Every line of it comes off the object; nothing here
 *  computes anything, so if a number looks wrong the fault is upstream. */
export function describeHost(host: Host): string {
  const lines: string[] = [];
  const men = host.units.reduce((s, u) => s + u.strength, 0);

  lines.push(`${host.name.toUpperCase()} — mustered year ${host.mustered.year}, ${host.mustered.season}, day ${host.mustered.day}`);
  lines.push(`The cause is ${host.occasion.causeName}, reckoned ${host.occasion.legitimacy} out of a hundred just.`);
  lines.push(
    `${men} men in ${host.contingents.length} contingents. Order capacity ${host.command.orderCapacity} — ` +
      `${host.command.orderCapacity <= 2 ? 'two contingents at a time, and no Marshal to blame but yourself' : 'that many contingents can be given a tactic at once'}.`,
  );
  lines.push(
    `Authority ${host.command.authority}. Provisions for ${Math.floor(host.supply.provisionDays)} days ` +
      `(${host.supply.sacks} sacks, forage ${host.supply.forage}).`,
  );
  lines.push('');

  lines.push('WHAT STANDS');
  for (const k of host.contingents) {
    lines.push(
      `  ${pad(k.name, 34)} ${String(k.present).padStart(4)} men  ` +
        `resolve ${pad3(k.resolve)}  obedience ${pad3(k.obedience)}  treachery ${pad3(k.treachery)}  [${k.disposition}]`,
    );
    lines.push(`      ${k.story}`);
    for (const unitId of k.unitIds) {
      const u = host.units.find((x) => x.id === unitId);
      if (!u) continue;
      lines.push(
        `      · ${pad(u.name, 32)} ${String(u.strength).padStart(4)}/${String(u.paperStrength).padEnd(4)} ` +
          `fatigue ${pad3(u.fatigue)} ${u.kind}`,
      );
    }
    for (const q of k.quirks) lines.push(`      ! ${q.id}: ${q.explains}`);
  }

  if (host.latecomers.length > 0) {
    lines.push('');
    lines.push('LATE');
    for (const l of host.latecomers) {
      lines.push(`  ${l.contingentId}: ${l.lateDays} days late (enters at ${l.entersAtFraction}). ${l.explains}`);
    }
  }

  lines.push('');
  lines.push('WHO DID NOT COME, AND WHY');
  if (host.absent.length === 0) lines.push('  Everybody came. Enjoy it.');
  for (const a of host.absent) {
    lines.push(`  ${pad(a.whoName, 28)} owed ${String(a.owed).padStart(4)}, sent ${String(a.sent).padStart(4)}  — ${a.answer}`);
    lines.push(`      ${a.reason} ${a.explains}`);
  }

  if (host.command.disputes.length > 0) {
    lines.push('');
    lines.push('WHO WILL NOT WORK WITH WHOM');
    for (const d of host.command.disputes) lines.push(`  ${d.aId} / ${d.bId} over ${d.over}: ${d.explains}`);
  }

  if (host.notes.length > 0) {
    lines.push('');
    for (const note of host.notes) lines.push(`  (${note})`);
  }

  return lines.join('\n');
}

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}

function pad3(n: number): string {
  return String(Math.round(n)).padStart(3);
}

/** A muster roll line, in words — for a screen or a test that wants to check a
 *  named wing exists rather than a number. */
export function describeRoll(roll: RollEntry[]): string {
  return roll
    .map((r) => `${UNIT_TYPES[r.unitTypeId]?.name ?? r.unitTypeId} ${r.men} (${r.garrisonHeld} held)`)
    .join(', ');
}
