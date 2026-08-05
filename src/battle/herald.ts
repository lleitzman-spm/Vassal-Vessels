// WHY THIS FILE EXISTS. Law 6: every outcome of an order is heralded in plain
// words that name the political cause, and law 10: the battle can be READ as a
// chronicle the day the engine works, with no pictures at all. So every event
// that a person could care about carries a `herald` string, and every one of
// them is built here, from the record — never written by hand, never invented.
//
// The templates would live in `data/captains.json` and `data/standing-plans.json`
// if those files existed. They do not yet, so they live here in the same shape.
// See `docs/OPEN-QUESTIONS.md`.
//
// THE ONE RULE. A herald line must name the CAUSE, not the effect. "He drags his
// feet" is a description. "He drags his feet — the slight at the feast is not
// forgotten" is a chronicle. If the line does not point at something the player
// did at court, it is not finished.

import { idiv } from "../core/primitives.js";
import type { Quirk } from "../core/contract.js";
import type { Captain, Contingent, Interpretation } from "./types.js";

/** The quirks this engine can actually express, with what each one does to a
 *  captain's heed when a word lands. A quirk not on this list is IGNORED — the
 *  contract says ignoring is legal and expected — and never reported back to
 *  the court as honoured. */
export interface QuirkSheet {
  id: string;
  /** Points off heed, before intensity. Zero means the quirk changes behaviour
   *  somewhere else instead. */
  heed: number;
  explains: string;
}

export const QUIRKS: QuirkSheet[] = [
  { id: "old-grudge", heed: -20, explains: "He has not forgiven you, and he weighs every word you send against it." },
  { id: "blood-feud", heed: -10, explains: "There is blood between his house and someone here, and it is louder than your orders." },
  { id: "will-not-fight-beside", heed: -8, explains: "He will not stand next to that man, and courage does not pass between them." },
  { id: "iron-oath", heed: 5, explains: "He swore, and he does not break oaths. He may drag his feet; he will never simply refuse." },
  { id: "craven", heed: -5, explains: "He would rather be somewhere else, and he keeps a road open to it." },
  { id: "boastful", heed: 0, explains: "He would rather die famously than live quietly, and will press a refused charge onto the points." },
  { id: "hotheaded", heed: 0, explains: "He goes at the enemy when he sees one, orders or no orders." },
  { id: "charges-without-orders", heed: 0, explains: "The same fault with a politer name: his men are moving before your rider is halfway." },
  { id: "hungry-for-ransom", heed: -6, explains: "He is counting lords, not enemies. Reining him in is the hardest order you own." },
  { id: "first-to-plunder", heed: -4, explains: "The baggage is worth more to him than the flank you asked him to hold." },
  { id: "may-turn", heed: -6, explains: "He has been read at eighty and summoned anyway. What follows is your doing." },
  { id: "will-not-flee", heed: 3, explains: "These men do not run. Which is not always good news: a unit that cannot retreat can be destroyed in place." },
  { id: "answers-to-the-grandmaster", heed: -10, explains: "He answers his own master before your Marshal, and at some point he will do what he believes is right." },
  { id: "flees-early-if-unpaid", heed: -4, explains: "Hired men fight exactly as well as they are paid, and they know precisely what they are owed." },
  { id: "breaks-early", heed: 0, explains: "They will be the first thing on your side to run." },
  { id: "veterans-know-the-ground", heed: 4, explains: "They have raided this country since childhood and need less telling." },
  { id: "holds-to-the-last-on-own-land", heed: 2, explains: "These are their own roofs behind them." },
  { id: "will-not-leave-the-province", heed: 0, explains: "They came for their own county and no further." },
  { id: "will-not-stand-in-line", heed: 0, explains: "They know they cannot stand where somebody can hit back, and so should you." },
];

const QUIRK_BY_ID = new Map(QUIRKS.map((q) => [q.id, q]));

/** Every quirk id this engine implements, for `Aftermath.quirksHonoured`. */
export const HONOURED_QUIRK_IDS: string[] = QUIRKS.map((q) => q.id);

export function hasQuirk(quirks: Quirk[], id: string): boolean {
  return quirks.some((q) => q.id === id);
}

export function quirkIntensity(quirks: Quirk[], id: string): number {
  const q = quirks.find((x) => x.id === id);
  return q ? q.intensity : 0;
}

/** The total heed those quirks cost, weighted by how strongly the court says
 *  the man holds them. Twenty is a tendency; ninety is a certainty. */
export function quirkHeed(quirks: Quirk[]): { total: number; terms: { term: string; value: number }[] } {
  const terms: { term: string; value: number }[] = [];
  let total = 0;
  for (const q of quirks) {
    const sheet = QUIRK_BY_ID.get(q.id);
    if (!sheet || sheet.heed === 0) continue;
    // A quirk the court thought worth naming is never worth nothing: a
    // twenty-intensity grudge still costs him a point.
    const scaled = idiv(sheet.heed * q.intensity, 100);
    const value = scaled === 0 ? (sheet.heed < 0 ? -1 : 1) : scaled;
    terms.push({ term: `quirk:${q.id}`, value });
    total += value;
  }
  return { total, terms };
}

// ── the lines themselves ────────────────────────────────────────────────────

/** The cause, in one clause, for the herald to hang the outcome on. Grievance
 *  first, because a grudge is the loudest thing in a captain's head; then the
 *  quirk he is best known for; then, if the man simply has no reason, say so. */
export function politicalCause(c: Captain, ct: Contingent, terms: { term: string; value: number }[] = []): string {
  if (c.insulted) return "the word went over his head in front of his own retinue";
  if (hasQuirk(c.quirks, "old-grudge")) return "the slight at the feast is not forgotten";
  if (c.grievance >= 60) return "he has a grudge against the crown and it has never been settled";
  if (hasQuirk(c.quirks, "hungry-for-ransom")) return "he is counting lords, not enemies";
  if (hasQuirk(c.quirks, "craven")) return "he keeps a road open behind him";
  if (hasQuirk(c.quirks, "boastful")) return "he would rather die famously than live quietly";
  if (hasQuirk(c.quirks, "answers-to-the-grandmaster")) return "he answers his own master before your Marshal";
  if (ct.arrears > 0) return "his men have not been paid";
  if (ct.obedience < 35) return "he was never much minded to listen to you";
  if (c.loyalty >= 75) return "he is yours and has always been yours";
  // No grudge, no quirk, no arrears: then the cause is whatever weighed
  // heaviest against the word when it landed. A herald line that says only "he
  // judges it best" has told the player nothing, which is the one thing law 6
  // forbids.
  let worst = "";
  let worstValue = 0;
  for (const t of terms) {
    if (t.value < worstValue) {
      worstValue = t.value;
      worst = t.term;
    }
  }
  if (worst !== "") return worst;
  return "he judges it best";
}

export function heraldInterpretation(
  choice: Interpretation,
  captainName: string,
  contingentName: string,
  cause: string,
): string {
  switch (choice) {
    case "OBEY":
      return `${captainName} takes the word and does it — ${cause}.`;
    case "OBEY-HIS-WAY":
      return `${captainName} takes the word and does it his own way; ${cause}.`;
    case "DRAG":
      return `${captainName} drags his feet — ${cause}.`;
    case "HEDGE":
      return `${captainName} does the safe half of it and keeps a road open — ${cause}.`;
    case "OVERREACH":
      return `${captainName} goes further than you asked, and sooner — ${cause}.`;
    case "HARD-HEDGE":
      return `${captainName} obeys to the letter, from well out of dying range — ${cause}.`;
    case "DEFY":
      return `${captainName} sets your word aside and looks to his own: ${contingentName} will protect their own, and ${cause}.`;
  }
}

export function heraldSupportVeto(captainName: string, targetName: string): string {
  return `${captainName} looks upon ${targetName} hard-pressed, and looks away.`;
}

export function heraldPlanFired(note: string, recipientName: string): string {
  return `${recipientName}, as agreed this morning: ${note}.`;
}

export function heraldRout(unitName: string): string {
  return `${unitName} will not stand it any longer, and the line opens where they were.`;
}

export function heraldRally(unitName: string, captainName: string): string {
  return `${captainName} rides into the running men, and ${unitName} turns and stands.`;
}

export function heraldFled(unitName: string): string {
  return `${unitName} breaks a second time, and that is the end of them for the day.`;
}

export function heraldShock(chargerName: string, targetName: string, closing: number, killed: number): string {
  if (closing < 120) {
    return `${chargerName} come on to ${targetName} at a walk and stop dead on the points; ${killed} fall.`;
  }
  if (killed >= 8) return `${chargerName} strike ${targetName} at full speed and ${killed} go down in the first instant.`;
  return `${chargerName} strike ${targetName}; ${killed} go down.`;
}

export function heraldArmyBreak(armyName: string): string {
  return `${armyName} is broken, and the field belongs to whoever is still standing on it.`;
}

export function heraldCaptainFell(captainName: string, unitName: string): string {
  return `${captainName} falls with ${unitName}, and the men around him know it at once.`;
}

export function heraldBannerFell(armyName: string): string {
  return `The banner of ${armyName} goes down. Every order from here is a nine-second ride.`;
}

export function heraldTreachery(contingentName: string, captainName: string, defected: boolean): string {
  return defected
    ? `${contingentName} turn their coats: ${captainName} has been reading the day, and he has read it against you.`
    : `${contingentName} walk off the field. ${captainName} did not come this far to die for a losing cause.`;
}

export function heraldDesertion(unitName: string): string {
  return `${unitName} are owed money and are not paid, and they simply go home.`;
}

export function heraldExhort(contingentName: string): string {
  return `The word goes down the line to ${contingentName}, and they lift their heads — though they will never be quite so brave again.`;
}

export function heraldWithdrawalSounded(captainName: string, contingentName: string): string {
  return `${captainName} sounds his own withdrawal without your leave; ${contingentName} come off the field.`;
}

export function heraldReinforcement(unitName: string): string {
  return `${unitName} come up the road in column, late, and shake out where they can.`;
}

export function heraldBattleEnd(reason: string): string {
  return `And so the day ended: ${reason}.`;
}

export function heraldPressedCharge(captainName: string): string {
  return `${captainName} will not be slowed by a hedge of points; he spurs the horses onto them and pays for it.`;
}

export function heraldTurningPoint(unitName: string, term: string, atSeconds: number): string {
  const m = idiv(atSeconds, 60);
  const s = atSeconds % 60;
  const clock = `${m}:${s < 10 ? "0" : ""}${s}`;
  return `You lost ground at ${clock}, when ${unitName} gave way — ${term} was the weight that did it.`;
}
