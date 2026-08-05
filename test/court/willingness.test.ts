// WHY THIS FILE EXISTS. Law 2 — the muster never rolls dice — and law 4 — every
// reading shows its work — meet here. Willingness must be a TRANSPARENT SUM:
// every term visible, the terms adding to the value, the value falling on a
// fixed threshold, and no random number anywhere in the path. That is the
// mechanic that makes a betrayal foreseeable in hindsight, therefore the
// player's fault, therefore a story.
//
// The threshold test walks both sides of all nine boundaries. If somebody
// "smooths" the ladder into a curve, this file goes red, and it should.

import { describe, expect, it } from 'vitest';
import {
  ANSWERS,
  bandFor,
  readAnswer,
  readOccasion,
  readWillingness,
  stampOf,
  unitIdFor,
  type AnswerKind,
} from '../../src/court/index.js';
import { aldmarch, HOUSE_IDS, warAtTheFord } from './realm.js';

const DAY = stampOf(1, 'highsun', 61);

describe('willingness is a transparent sum', () => {
  it('adds its terms to its value, exactly, for every house', () => {
    const c = warAtTheFord(aldmarch(), {});
    const occ = readOccasion(c, 'the-ford', DAY);
    expect(occ).not.toBeNull();

    for (const houseId of HOUSE_IDS) {
      const w = readWillingness(c, occ!, houseId, DAY);
      const sum = w.terms.reduce((s, t) => s + t.value, 0);
      expect(Math.abs(sum - w.value)).toBeLessThan(0.011);
      expect(w.terms.length).toBeGreaterThan(2);
      for (const t of w.terms) {
        expect(t.label.length).toBeGreaterThan(0);
        expect(t.explains.length).toBeGreaterThan(0);
        expect(Number.isFinite(t.value)).toBe(true);
      }
    }
  });

  it('names the terms a player would want to argue with', () => {
    const c = warAtTheFord(aldmarch(), {});
    const occ = readOccasion(c, 'the-ford', DAY)!;
    const labels = readWillingness(c, occ, 'h-quayford', DAY).terms.map((t) => t.label);

    expect(labels).toContain('Neither friend nor enemy'); // the fifty everyone starts at
    expect(labels).toContain('Passed over for a seat'); // the grudge
    expect(labels.some((l) => l.startsWith('The cause'))).toBe(true);
    expect(labels).toContain('Summoned by your Chancellor');
  });

  it('gives the same answer every time, with no die anywhere in the path', () => {
    const c = warAtTheFord(aldmarch(), {});
    const occ = readOccasion(c, 'the-ford', DAY)!;
    const first = readWillingness(c, occ, 'h-quayford', DAY);
    for (let i = 0; i < 25; i++) {
      expect(readWillingness(c, occ, 'h-quayford', DAY)).toEqual(first);
    }
  });

  it('has no random number generator anywhere in the muster path', async () => {
    // The court throws dice in exactly one place — the world clock — and the
    // muster is not it. This is checked by reading the source of every module
    // the muster touches, because a comment saying "no dice" is not a test.
    const { readFileSync } = await import('node:fs');
    const musterPath = [
      'answer.ts',
      'loyalty.ts',
      'grievances.ts',
      'favours.ts',
      'vessel.ts',
      'seats.ts',
      'host.ts',
      'land.ts',
      'distance.ts',
      'cabals.ts',
      'tenure.ts',
      'kin.ts',
    ];
    for (const file of musterPath) {
      const source = readFileSync(`src/court/${file}`, 'utf8');
      const code = source
        .split('\n')
        .filter((line) => !line.trimStart().startsWith('//') && !line.trimStart().startsWith('*'))
        .join('\n');
      expect(code, `${file} must not roll dice`).not.toMatch(/Math\.random|makeRng|rollPermille|\brnd\(/);
    }
  });
});

describe('the nine answers fall on fixed thresholds', () => {
  it('has exactly nine bands, in falling order, ending in turncoat', () => {
    expect(ANSWERS).toHaveLength(9);
    for (let i = 1; i < ANSWERS.length; i++) {
      expect(ANSWERS[i]!.atLeast).toBeLessThan(ANSWERS[i - 1]!.atLeast);
      expect(ANSWERS[i]!.fraction).toBeLessThanOrEqual(ANSWERS[i - 1]!.fraction);
    }
    expect(ANSWERS[0]!.answer).toBe<AnswerKind>('more-than-owed');
    expect(ANSWERS[0]!.atLeast).toBe(95);
    expect(ANSWERS[ANSWERS.length - 1]!.answer).toBe<AnswerKind>('turncoat');
    expect(ANSWERS[ANSWERS.length - 2]!.atLeast).toBe(3); // turncoat begins below three
  });

  it('is tested on BOTH sides of every boundary', () => {
    for (let i = 0; i < ANSWERS.length - 1; i++) {
      const band = ANSWERS[i]!;
      const below = ANSWERS[i + 1]!;

      // Exactly at the threshold: this band.
      expect(bandFor(band.atLeast).answer).toBe(band.answer);
      // A hair above: still this band.
      expect(bandFor(band.atLeast + 0.01).answer).toBe(band.answer);
      // A hair below: the next one down, and never a skip.
      expect(bandFor(band.atLeast - 0.01).answer).toBe(below.answer);
    }

    // Off both ends of the ladder.
    expect(bandFor(1000).answer).toBe<AnswerKind>('more-than-owed');
    expect(bandFor(2.99).answer).toBe<AnswerKind>('turncoat');
    expect(bandFor(-500).answer).toBe<AnswerKind>('turncoat');
  });

  it('is a step, never a slope: the same band gives the same fraction throughout', () => {
    for (let i = 0; i < ANSWERS.length - 1; i++) {
      const band = ANSWERS[i]!;
      const top = i === 0 ? 200 : ANSWERS[i - 1]!.atLeast - 0.01;
      expect(bandFor(band.atLeast).fraction).toBe(band.fraction);
      expect(bandFor(top).fraction).toBe(band.fraction);
      expect(bandFor((band.atLeast + top) / 2).fraction).toBe(band.fraction);
    }
  });

  it('sheds the BEST men first when a house comes short — worst-kept-LAST', () => {
    const c = warAtTheFord(aldmarch(), {});
    const occ = readOccasion(c, 'the-ford', DAY)!;

    // Quayford is sullen: its lady was passed over for the Stewardship.
    const sullen = readAnswer(c, 'the-ford', 'h-quayford', DAY);
    expect(bandFor(readWillingness(c, occ, 'h-quayford', DAY).value).fraction).toBeLessThan(1);

    const sent = sullen.units.filter((u) => u.sent).map((u) => u.unitId);
    const kept = sullen.units.filter((u) => !u.sent).map((u) => u.unitId);

    // The cheap town spears march; the expensive marines and crossbows — his
    // best men, and the reason his quota was worth having — stay at the quay.
    expect(sent).toContain(unitIdFor('quayford-town', 'militia-spears'));
    expect(kept).toContain(unitIdFor('quayford-port', 'marines'));
    expect(kept).toContain(unitIdFor('quayford-town', 'crossbowmen'));

    // And the sentence a player reads says why.
    const marines = sullen.units.find((u) => u.unitId === unitIdFor('quayford-port', 'marines'));
    expect(marines?.why).toContain('not sending his best');

    // A willing house does the opposite: best men first.
    const willing = readAnswer(c, 'the-ford', 'h-thornbury', DAY);
    const thornSent = willing.units.filter((u) => u.sent).map((u) => u.unitId);
    expect(thornSent[0]).toBe(unitIdFor('thornbury-run', 'knights')); // 600 crowns a wing
  });
});
