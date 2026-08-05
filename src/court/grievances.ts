// WHY THIS FILE EXISTS. A grudge is not a number going down. It is a named
// thing, with a date, a cause you can point at, and a weight that a player can
// argue with. This module is where the act list becomes that list of named
// things — and it is the single most important reading in the layer, because
// every refusal at every muster traces back through here to one record.
//
// THREE RULES THAT MUST NOT BE BENT.
//
//  1. NOTHING IS STORED. A grievance exists because an act exists. Strike the
//     act and the grievance was never felt — no residue, no half-remembered
//     resentment, no "well it already affected the loyalty". If you cache this
//     list, striking a record stops meaning anything and the game's whole claim
//     — that you can always see why — becomes a lie.
//  2. GRUDGES DO NOT FADE. Favours fade; grudges are SETTLED, or they cool by a
//     fifth after ten years, or an heir takes half. That asymmetry is the game:
//     generosity is a subscription, resentment is a mortgage.
//  3. KNOWING IS A RECORD. Until a `learn` record covers it, a grievance you did
//     not cause yourself is not in the crown's own reading. "I did not know" is
//     a fact in the book, not an excuse — and it is the only uncertainty in this
//     layer, because the muster never rolls dice.

import type { Stamp } from '../core/primitives.js';
import { CHOSEN, COURT, GRIEVANCES } from './codex.js';
import { addDays, yearsBetween } from './calendar.js';
import { kinOf, lordAt, otherEnd } from './kin.js';
import type { Chronicle } from './records.js';
import { captainOf, holdingOf } from './records.js';
import { tenanciesOf, yearsVacant } from './tenure.js';
import type { Grievance } from './types.js';
import { overCalledGrievance, summonsesOf, vesselDrunkBefore } from './vessel.js';
import { round2 } from './tally.js';

interface Raw {
  actId: string;
  kind: string;
  houseId: string;
  raw: number;
  since: Stamp;
  explains: string;
}

/** Every grudge a house holds on a given day, settled, cooled, inherited and
 *  marked known or hidden. The truth — `readAsCrown` is what the player is
 *  entitled to see. */
export function readGrievances(c: Chronicle, houseId: string, at: Stamp): Grievance[] {
  const raws = gather(c, at).filter((r) => r.houseId === houseId);
  const out: Grievance[] = [];

  for (const r of raws) {
    if (r.raw <= 0) continue;
    const settledBy: string[] = [];
    let points = r.raw;

    for (const a of c.acts) {
      if (a.kind !== 'amends') continue;
      if (a.at.absolute > at.absolute) continue;
      if (a.houseId !== houseId) continue;
      for (const s of a.settles) {
        if (s.grievanceActId !== r.actId) continue;
        if (!GRIEVANCES[r.kind]?.settleable) continue; // some things money does not buy
        points -= s.points;
        settledBy.push(a.id);
      }
    }
    if (points <= 0) continue;

    // Cooling: a fifth off after ten years. Not decay — the thing still happened.
    const age = yearsBetween(r.since, at);
    if (age >= COURT.loyalty.grievanceCoolAfterYears) {
      points = points * (1 - COURT.loyalty.grievanceCoolShare);
    }

    // Inheritance: an heir carries half of his father's grudges. Killing a
    // difficult lord only ever half-solves the problem.
    const lord = lordAt(c, houseId, at);
    if (lord.succeeded && lord.onDay && lord.onDay.absolute > r.since.absolute) {
      points = points * COURT.loyalty.heirInheritsGrievanceShare;
    }

    out.push({
      actId: r.actId,
      kind: r.kind,
      houseId,
      weight: round2(points),
      raw: round2(r.raw),
      since: r.since,
      settledBy,
      explains: r.explains,
      known: isKnown(c, r.actId, at),
    });
  }

  out.sort((a, b) => b.weight - a.weight || a.actId.localeCompare(b.actId));
  return out;
}

/** Has the crown learned of this? Anything the crown DID, it knows. Anything
 *  else needs a `learn` record — which is the Spymaster's whole reason to exist,
 *  and the reason a betrayal is foreseeable rather than unfair. */
export function isKnown(c: Chronicle, actId: string, at: Stamp): boolean {
  const cause = c.acts.find((a) => a.id === actId);
  if (cause && cause.by === 'crown') return true;
  return c.acts.some(
    (a) => a.kind === 'learn' && a.at.absolute <= at.absolute && a.aboutActIds.includes(actId),
  );
}

// ── Where grudges come from ────────────────────────────────────────────────
//
// One pass over the act list. Every branch below names the act that caused it,
// so every grievance in the game can be clicked back to its record.

function gather(c: Chronicle, at: Stamp): Raw[] {
  const out: Raw[] = [];
  const acts = c.acts.filter((a) => a.at.absolute <= at.absolute);
  const houses = c.founding.houses;

  const houseOfCaptain = (captainId: string): string | null => captainOf(c, captainId)?.houseId ?? null;

  for (const a of acts) {
    switch (a.kind) {
      case 'invest': {
        // Everyone who wanted it and watched somebody else take it.
        for (const p of c.founding.captains) {
          if (p.id === a.captainId) continue;
          const claim = p.claims[a.seatId] ?? 0;
          if (claim <= 0 || !p.houseId) continue;
          out.push({
            actId: a.id,
            kind: 'passed-over',
            houseId: p.houseId,
            raw: claim * COURT.seats.passedOverPerClaimPoint,
            since: a.at,
            explains: `${p.name} wanted the ${a.seatId} and watched it go elsewhere.`,
          });
        }
        break;
      }

      case 'name-commander': {
        for (const p of c.founding.captains) {
          if (p.id === a.captainId) continue;
          const claim = p.claims['marshal'] ?? 0;
          if (claim <= 0 || !p.houseId) continue;
          out.push({
            actId: a.id,
            kind: 'passed-over-command',
            houseId: p.houseId,
            raw: claim * COURT.seats.passedOverPerClaimPoint,
            since: a.at,
            explains: `A commander was named for ${a.campaignId} and it was not ${p.name}.`,
          });
        }
        break;
      }

      case 'attaint': {
        out.push({
          actId: a.id,
          kind: 'attainted',
          houseId: a.houseId,
          raw: GRIEVANCES['attainted']?.raw ?? 0,
          since: a.at,
          explains: 'Their lands were taken by force.',
        });
        for (const h of houses) {
          if (h.id === a.houseId) continue;
          out.push({
            actId: a.id,
            kind: 'tyranny',
            houseId: h.id,
            raw: COURT.seats.tyrannyGrievanceToAll,
            since: a.at,
            explains: 'A house was stripped of its land, and every other house did the arithmetic about itself.',
          });
        }
        break;
      }

      case 'answer-petition': {
        if (a.granted) break;
        const petition = acts.find((p) => p.id === a.petitionActId);
        if (!petition || petition.kind !== 'petition') break;
        const houseId = houses.some((h) => h.id === petition.fromId)
          ? petition.fromId
          : houseOfCaptain(petition.fromId);
        if (!houseId) break;
        out.push({
          actId: a.id,
          kind: 'turned-away',
          houseId,
          raw: GRIEVANCES['turned-away']?.raw ?? 0,
          since: a.at,
          explains: `They came to the gate asking ${petition.asks}, and were sent home with nothing.`,
        });
        break;
      }

      case 'charter': {
        const holding = holdingOf(c, a.holdingId);
        const holder = holding ? holderOfHolding(c, a.holdingId, a.at) : null;
        if (!holder) break;
        out.push({
          actId: a.id,
          kind: 'chartered',
          houseId: holder,
          raw: GRIEVANCES['chartered']?.raw ?? 0,
          since: a.at,
          explains: `${holding?.name ?? a.holdingId} was given its liberties, and a share of its tax with them.`,
        });
        break;
      }

      case 'amends': {
        if (a.method !== 'justice' || !a.punishedHouseId) break;
        out.push({
          actId: a.id,
          kind: 'punished',
          houseId: a.punishedHouseId,
          raw: GRIEVANCES['punished']?.raw ?? 0,
          since: a.at,
          explains: 'Justice was done, and it was done to them.',
        });
        break;
      }

      case 'ward': {
        const years = yearsBetween(a.at, at);
        if (years > CHOSEN.wardSoursAfterYears) {
          out.push({
            actId: a.id,
            kind: 'ward-soured',
            houseId: a.houseId,
            raw: round2((years - CHOSEN.wardSoursAfterYears) * CHOSEN.wardSourPerYear),
            since: addDays(a.at, CHOSEN.wardSoursAfterYears * COURT.calendar.daysPerYear),
            explains: 'Their heir has been at your court a long time now, and the word for it has changed.',
          });
        }
        break;
      }

      case 'death': {
        // A ward who dies in your care is the worst grievance in the game, and
        // it spreads to every kinsman.
        const warded = acts.find(
          (w) => w.kind === 'ward' && w.captainId === a.captainId && w.at.absolute <= a.at.absolute,
        );
        if (!warded || warded.kind !== 'ward') break;
        out.push({
          actId: a.id,
          kind: 'ward-died',
          houseId: warded.houseId,
          raw: GRIEVANCES['ward-died']?.raw ?? 0,
          since: a.at,
          explains: 'The child they handed you died in your keeping.',
        });
        for (const tie of kinOf(c, warded.houseId, at)) {
          const other = otherEnd(tie, warded.houseId);
          if (other === c.founding.crown.houseId) continue;
          out.push({
            actId: a.id,
            kind: 'ward-died',
            houseId: other,
            raw: (GRIEVANCES['ward-died']?.raw ?? 0) / 2,
            since: a.at,
            explains: 'A kinsman’s child died in the crown’s keeping. Every kinsman heard about it.',
          });
        }
        break;
      }

      case 'blood-debt': {
        out.push({
          actId: a.id,
          kind: 'blood-debt',
          houseId: a.subjectId,
          raw: a.amount ?? 0,
          since: a.at,
          explains: 'Their men died far worse than everybody else’s did.',
        });
        break;
      }

      case 'disgraced': {
        const houseId = houseOfCaptain(a.subjectId);
        if (!houseId) break;
        out.push({
          actId: a.id,
          kind: 'disgraced',
          houseId,
          raw: GRIEVANCES['disgraced']?.raw ?? 0,
          since: a.at,
          explains: 'The court said out loud that he faltered, and he did not think he had.',
        });
        break;
      }

      case 'distinguished': {
        const houseId = houseOfCaptain(a.subjectId);
        if (!houseId) break;
        const due = addDays(a.at, CHOSEN.rewardClockDays);
        if (at.absolute < due.absolute) break; // the clock is still running
        if (rewarded(c, a.subjectId, houseId, a.at, due)) break;
        out.push({
          actId: a.id,
          kind: 'unrewarded',
          houseId,
          raw: GRIEVANCES['unrewarded']?.raw ?? 0,
          since: due,
          explains: 'He distinguished himself, a year went by, and nothing whatever came of it.',
        });
        break;
      }

      case 'captured': {
        const houseId = houseOfCaptain(a.subjectId);
        if (!houseId) break;
        const paid = acts.some(
          (p) => p.kind === 'ransom-paid' && p.subjectId === a.subjectId && p.at.absolute >= a.at.absolute,
        );
        if (paid) break;
        const seasons = Math.floor(
          (at.absolute - a.at.absolute) / COURT.calendar.daysPerSeason,
        );
        if (seasons <= 0) break;
        out.push({
          actId: a.id,
          kind: 'unransomed',
          houseId,
          raw: Math.min(seasons * CHOSEN.unransomedPerSeason, CHOSEN.unransomedCap),
          since: a.at,
          explains: 'Their kinsman is still in a cell somewhere and you have not paid.',
        });
        break;
      }

      case 'slain': {
        // The court writes `slain` with an amount of 1 when the death reads as
        // avoidable — thrown away in a rout, or in a contingent that bled far
        // worse than the rest. Then the house wants somebody blamed.
        if ((a.amount ?? 0) <= 0) break;
        const houseId = houseOfCaptain(a.subjectId);
        if (!houseId) break;
        out.push({
          actId: a.id,
          kind: 'avenge',
          houseId,
          raw: GRIEVANCES['avenge']?.raw ?? 0,
          since: a.at,
          explains: 'Their lord died in a battle the house believes was thrown away.',
        });
        break;
      }

      case 'summon': {
        for (const calledId of a.calledIds) {
          if (!houses.some((h) => h.id === calledId)) continue;

          if (a.great) {
            const verdict = greatSummonsVerdict(c, a, at);
            if (verdict === 'forgiven') continue;
            out.push({
              actId: a.id,
              kind: 'great-summons',
              houseId: calledId,
              raw:
                COURT.obligation.greatSummonsGrievance * (verdict === 'doubled' ? 2 : 1),
              since: a.at,
              explains:
                verdict === 'doubled'
                  ? 'You called out the whole strength of the land and lost. It weighs twice.'
                  : 'You called out the whole strength of the land. Win and it is forgiven entirely.',
            });
            continue;
          }

          const before = vesselDrunkBefore(c, calledId, a.at.year, a.at.absolute);
          if (before.daysLeft > 0) continue;
          const priorOverCalls = summonsesOf(c, calledId, a.at.year).filter(
            (s) => s.at.absolute < a.at.absolute && vesselDrunkBefore(c, calledId, a.at.year, s.at.absolute).daysLeft <= 0,
          ).length;
          out.push({
            actId: a.id,
            kind: 'over-called',
            houseId: calledId,
            raw: overCalledGrievance(priorOverCalls),
            since: a.at,
            explains: 'You called them past the forty days the grant of land says they owe.',
          });
        }
        break;
      }

      default:
        break;
    }
  }

  // A seat left empty sours its claimants slowly, while the crown does the job
  // at half effect. This is the one grievance with no record behind it — its
  // cause is the ABSENCE of an investiture — so it is revoked not by striking a
  // record but by writing one.
  for (const seat of c.founding.seats) {
    const vacantYears = yearsVacant(c, seat.id, at);
    const everHeld = tenanciesOf(c, seat.id, at).length > 0;
    const heldNow = everHeld && tenanciesOf(c, seat.id, at).slice(-1)[0]?.until === null;
    if (heldNow || vacantYears < 1) continue;
    for (const p of c.founding.captains) {
      const claim = p.claims[seat.id] ?? 0;
      if (claim <= 0 || !p.houseId) continue;
      const wear = Math.min(
        Math.floor(vacantYears) * COURT.seats.unseatedPerYear,
        COURT.seats.unseatedCap,
      );
      out.push({
        actId: `vacancy:${seat.id}`,
        kind: 'seat-left-empty',
        houseId: p.houseId,
        raw: round2((wear * claim) / 5),
        since: at,
        explains: `The ${seat.name} sits empty, and ${p.name} wants it.`,
      });
    }
  }

  // Being unseated. The invest record that displaced him is the cause: strike it
  // and he never lost the office.
  for (const seat of c.founding.seats) {
    for (const t of tenanciesOf(c, seat.id, at)) {
      if (t.ended !== 'displaced' || !t.until) continue;
      const p = captainOf(c, t.captainId);
      if (!p?.houseId) continue;
      const years = yearsBetween(t.from, t.until);
      const wear = Math.min(
        Math.floor(years) * COURT.seats.unseatedPerYear,
        COURT.seats.unseatedCap,
      );
      const custom =
        years >= COURT.seats.hereditaryAfterYears
          ? COURT.seats.hereditaryGrievance
          : years >= COURT.seats.customaryAfterYears
            ? COURT.seats.customaryGrievance
            : 0;
      out.push({
        actId: displacingActId(c, seat.id, t.until) ?? t.actId,
        kind: 'unseated',
        houseId: p.houseId,
        raw: wear + custom,
        since: t.until,
        explains: `${p.name} held the ${seat.name} for ${Math.floor(years)} years and then did not.`,
      });
    }
  }

  return out;
}

function displacingActId(c: Chronicle, seatId: string, on: Stamp): string | null {
  const a = c.acts.find(
    (x) => x.kind === 'invest' && x.seatId === seatId && x.at.absolute === on.absolute,
  );
  return a?.id ?? null;
}

/** Who holds a holding on a day, by its latest enfeoffment. */
export function holderOfHolding(c: Chronicle, holdingId: string, at: Stamp): string | null {
  let best: { houseId: string; on: number } | null = null;
  for (const a of c.acts) {
    if (a.kind !== 'enfeoff' || a.holdingId !== holdingId) continue;
    if (a.at.absolute > at.absolute) continue;
    if (!best || a.at.absolute >= best.on) best = { houseId: a.houseId, on: a.at.absolute };
  }
  if (!best) return null;
  const seized = c.acts.some(
    (a) =>
      a.kind === 'attaint' &&
      a.at.absolute <= at.absolute &&
      a.at.absolute >= best.on &&
      a.holdingIds.includes(holdingId),
  );
  return seized ? null : best.houseId;
}

/** Was anything at all done for this man, or his house, inside the reward
 *  clock? Land, a seat, coin, or a formal settlement all count. */
function rewarded(
  c: Chronicle,
  captainId: string,
  houseId: string,
  from: Stamp,
  to: Stamp,
): boolean {
  return c.acts.some((a) => {
    if (a.at.absolute < from.absolute || a.at.absolute > to.absolute) return false;
    if (a.kind === 'invest') return a.captainId === captainId;
    if (a.kind === 'enfeoff') return a.houseId === houseId;
    if (a.kind === 'amends') return a.houseId === houseId;
    if (a.kind === 'pay') return a.toId === captainId || a.toId === houseId;
    return false;
  });
}

/** The Great Summons is forgiven entirely on victory and doubled on defeat —
 *  read off the legitimacy record the battle's absorption wrote. */
function greatSummonsVerdict(
  c: Chronicle,
  summons: { at: Stamp; campaignId: string },
  at: Stamp,
): 'forgiven' | 'doubled' | 'standing' {
  for (const a of c.acts) {
    if (a.kind !== 'legitimacy') continue;
    if (a.at.absolute < summons.at.absolute || a.at.absolute > at.absolute) continue;
    if ((a.amount ?? 0) > 0) return 'forgiven';
    if ((a.amount ?? 0) < 0) return 'doubled';
  }
  return 'standing';
}
