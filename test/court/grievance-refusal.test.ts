// WHY THIS FILE EXISTS. This is the game, in one test. Slight a house; watch the
// same summons come back worse; and find the slight sitting in the Tally as a
// named term, pointing at the record that caused it.
//
// If this test can be made to pass while the player CANNOT see the cause, the
// design has failed, because the whole promise is that a betrayal is foreseeable
// in hindsight — therefore the player's fault — therefore a story. So the test
// asserts the arithmetic AND the legibility, and walks the whole ladder down:
// dutiful, short, defiant, turncoat.

import { describe, expect, it } from 'vitest';
import {
  readAnswer,
  readAsCrown,
  readGrievances,
  readHost,
  readLoyalty,
  stampOf,
  type Act,
  type Chronicle,
} from '../../src/court/index.js';
import { aldmarch, warAtTheFord } from './realm.js';

const DAY = stampOf(1, 'highsun', 61);

/** A slight, on the record. Lord Beorhtwulf of Northwatch wants the
 *  Constableship badly (claim 5) — this hands it to a man in the valley who has
 *  never seen the frontier. */
const theSlight: Act = {
  id: 'a:the-slight',
  at: stampOf(1, 'seedtime', 25),
  by: 'crown',
  kind: 'invest',
  seatId: 'constable',
  captainId: 'c-mill',
  note: 'The Constableship to Millrow, over the head of the man who holds the wall.',
};

describe('a grievance leads to a refusal, end to end', () => {
  it('slights a house, and the same summons is answered worse', () => {
    const loyal = warAtTheFord(aldmarch(), {});
    const slighted = warAtTheFord(aldmarch([theSlight]), {});

    const before = readAnswer(loyal, 'the-ford', 'h-northwatch', DAY);
    const after = readAnswer(slighted, 'the-ford', 'h-northwatch', DAY);

    expect(after.willingness.value).toBeLessThan(before.willingness.value);
    expect(after.sending).toBeLessThan(before.sending);

    // THE GRIEVANCE IS VISIBLE AS A TERM IN THE TALLY — the part that makes it a
    // story rather than a dice roll.
    const term = after.willingness.terms.find((t) => t.label === 'Passed over for a seat');
    expect(term).toBeDefined();
    expect(term!.value).toBe(-20); // claim 5 × 4 a point
    expect(term!.fromActIds).toEqual(['a:the-slight']);
    expect(term!.explains).toContain('constable');

    // And the record it names is in the book, and striking it undoes everything.
    const struck: Chronicle = { ...slighted, acts: slighted.acts.filter((a) => a.id !== 'a:the-slight') };
    expect(readAnswer(struck, 'the-ford', 'h-northwatch', DAY).sending).toBe(before.sending);
  });

  it('walks the ladder all the way down to a refusal, and then to a turned coat', () => {
    // Slights stack, and each one is a record with a name.
    const insults: Act[] = [
      theSlight,
      {
        id: 'a:attaint-a-neighbour',
        at: stampOf(1, 'seedtime', 40),
        by: 'crown',
        kind: 'attaint',
        houseId: 'h-stonebeck',
        holdingIds: ['stonebeck-mine'],
        note: 'Stonebeck is stripped of its mine — and every other house does the arithmetic about itself.',
      },
      {
        id: 'a:ward-taken',
        at: stampOf(1, 'seedtime', 50),
        by: 'crown',
        kind: 'ward',
        captainId: 'c-north-heir',
        houseId: 'h-northwatch',
      },
      {
        id: 'a:the-child-died',
        at: stampOf(1, 'highsun', 2),
        by: 'world',
        kind: 'death',
        captainId: 'c-north-heir',
        cause: 'a fever at the crown’s court',
        note: 'The boy they handed you died in your keeping.',
      },
    ];

    // FOR THE REALM'S OWN DEFENCE they still turn out, barely: a house that
    // hates you will still stand between an invader and its own fields, and the
    // ladder says so — a token, arriving after everything is decided.
    const defending = warAtTheFord(aldmarch(insults), {});
    expect(readAnswer(defending, 'the-ford', 'h-northwatch', DAY).answer).toBe('token');

    // FOR THE CROWN'S OWN CLAIM they will not move at all.
    const c = warAtTheFord(aldmarch(insults), { defending: false });
    const answer = readAnswer(c, 'the-ford', 'h-northwatch', DAY);
    const grudges = readGrievances(c, 'h-northwatch', DAY);

    expect(grudges.map((g) => g.kind)).toContain('ward-died');
    expect(readLoyalty(c, 'h-northwatch', DAY).value).toBe(0); // clamped, and it says so
    expect(readLoyalty(c, 'h-northwatch', DAY).clampedFrom).toBeLessThan(0);
    expect(answer.answer).toBe('refusal');
    expect(answer.sending).toBe(0);

    // AND FOR A WAR OF CONQUEST they answer the summons by joining the enemy —
    // the bottom of the ladder, reachable only because every step down it was
    // written in the book first.
    const conquest = warAtTheFord(aldmarch(insults), { defending: false, causeId: 'conquest' });
    expect(readAnswer(conquest, 'the-ford', 'h-northwatch', DAY).answer).toBe('turncoat');

    // The whole reason, spelled out, in the order that matters.
    const reasons = answer.willingness.terms.filter((t) => t.value < 0).map((t) => t.label);
    expect(reasons).toContain('Their child died in your keeping');

    // And the host says so out loud rather than being quietly smaller.
    const host = readHost(c, 'the-ford', DAY);
    const missing = host.absent.find((a) => a.whoId === 'h-northwatch');
    expect(missing).toBeDefined();
    expect(missing!.sent).toBe(0);
    expect(missing!.grievanceActIds).toContain('a:the-child-died');
    expect(missing!.explains).toContain('keeping');
  });

  it('hides a grudge the crown never learned of — until a record says otherwise', () => {
    // A vassal acted alone: nobody told the crown, and there is no Spymaster.
    const quietGrudge: Act[] = [
      {
        id: 'a:petition',
        at: stampOf(1, 'seedtime', 30),
        by: 'h-millrow',
        kind: 'petition',
        fromId: 'h-millrow',
        asks: 'a hearing over a mill',
      },
      {
        id: 'a:turned-away',
        at: stampOf(1, 'seedtime', 33),
        by: 'h-crown', // NOT 'crown': a clerk sent them away and never said so
        kind: 'answer-petition',
        petitionActId: 'a:petition',
        granted: false,
      },
    ];

    const c = warAtTheFord(aldmarch(quietGrudge), {});
    const truth = readGrievances(c, 'h-millrow', DAY);
    const hidden = truth.find((g) => g.kind === 'turned-away');
    expect(hidden).toBeDefined();
    expect(hidden!.known).toBe(false);

    // The truth includes it. The crown's own view does not.
    const asCrown = readAsCrown(c, truth, DAY);
    expect(asCrown.some((g) => g.kind === 'turned-away')).toBe(false);

    // The willingness the crown is shown omits the term, and still adds up —
    // a screen that showed a total nobody could account for would be worse than
    // no screen at all.
    const shown = readAsCrown(c, readAnswer(c, 'the-ford', 'h-millrow', DAY).willingness, DAY);
    expect(shown.terms.some((t) => t.label === 'Turned away at the gate')).toBe(false);
    expect(shown.terms.reduce((s, t) => s + t.value, 0)).toBeCloseTo(shown.value, 2);

    // Learn of it — a record, not a flag — and the two views converge.
    const learned: Chronicle = {
      ...c,
      acts: [
        ...c.acts,
        {
          id: 'a:learn',
          at: stampOf(1, 'highsun', 30),
          by: 'crown',
          kind: 'learn',
          aboutActIds: ['a:turned-away'],
          through: 'herald',
        },
      ],
    };
    const nowKnown = readGrievances(learned, 'h-millrow', DAY).find((g) => g.kind === 'turned-away');
    expect(nowKnown!.known).toBe(true);
    expect(readAsCrown(learned, readGrievances(learned, 'h-millrow', DAY), DAY).some((g) => g.kind === 'turned-away')).toBe(true);

    // The TRUTH never moved. Only what the crown was entitled to see did.
    expect(readLoyalty(learned, 'h-millrow', DAY)).toEqual(readLoyalty(c, 'h-millrow', DAY));
  });

  it('settles a grudge with amends, and the men come back', () => {
    const slighted = warAtTheFord(aldmarch([theSlight]), {});
    const settled = warAtTheFord(
      aldmarch([
        theSlight,
        {
          id: 'a:wergild',
          at: stampOf(1, 'highsun', 10),
          by: 'crown',
          kind: 'amends',
          houseId: 'h-northwatch',
          method: 'wergild',
          settles: [{ grievanceActId: 'a:the-slight', points: 20 }],
          crowns: 200,
        },
      ]),
      {},
    );

    const sore = readAnswer(slighted, 'the-ford', 'h-northwatch', DAY);
    const mended = readAnswer(settled, 'the-ford', 'h-northwatch', DAY);

    expect(mended.willingness.value).toBeGreaterThan(sore.willingness.value);
    expect(mended.sending).toBeGreaterThanOrEqual(sore.sending);
    expect(readGrievances(settled, 'h-northwatch', DAY).some((g) => g.actId === 'a:the-slight')).toBe(false);
    // The kindness is remembered on its own clock, and it will fade.
    expect(mended.willingness.terms.some((t) => t.label === 'Wergild paid')).toBe(true);
  });
});
