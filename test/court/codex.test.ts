// WHY THIS FILE EXISTS. Law 6 says the wiki IS the data and a number that is not
// in `data/` does not exist. The court needs its constants at module scope —
// the writ gives every reading a signature with no codex argument — and the
// layer is forbidden any I/O, so `src/court/codex.ts` transcribes them.
//
// A transcription is a second copy, and a second copy drifts. This test is the
// fence: it reads the JSON off disk and fails if one digit has moved, so the
// file in `data/` stays the authority and the TypeScript stays its echo. If this
// goes red, the JSON is right and the code is wrong — never the other way round.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COURT, UNIT_TYPES } from '../../src/court/index.js';

interface Json {
  [key: string]: unknown;
}

function readJson(path: string): Json {
  return JSON.parse(readFileSync(path, 'utf8')) as Json;
}

describe('the codex is a faithful transcription of data/', () => {
  it('matches data/constants.json → court, key for key and digit for digit', () => {
    const onDisk = (readJson('data/constants.json')['court'] ?? {}) as Json;

    // Every group the court transcribes must exist on disk with the same
    // numbers. `explains` and `chose` are prose for the reader and are not
    // transcribed, so they are the only keys allowed to be missing here.
    for (const [group, values] of Object.entries(COURT)) {
      const theirs = onDisk[group] as Json | undefined;
      expect(theirs, `data/constants.json → court.${group} is missing`).toBeDefined();
      for (const [key, mine] of Object.entries(values as Json)) {
        // `toStrictEqual` rather than `toBe`, because a few rows (the act-day
        // table) are objects rather than bare numbers.
        expect(theirs![key], `court.${group}.${key}`).toStrictEqual(mine);
      }
    }
  });

  it('leaves no number on disk that the court silently ignores', () => {
    const onDisk = (readJson('data/constants.json')['court'] ?? {}) as Json;
    for (const [group, values] of Object.entries(onDisk)) {
      const mine = (COURT as unknown as Json)[group] as Json | undefined;
      expect(mine, `court.${group} is on disk and not in the codex`).toBeDefined();
      for (const key of Object.keys(values as Json)) {
        if (key === 'explains' || key === 'chose') continue;
        expect(Object.hasOwn(mine!, key), `court.${group}.${key} is on disk and not in the codex`).toBe(true);
      }
    }
  });

  it('matches the court’s half of data/units.json', () => {
    const armour: Record<string, number> = {
      none: 8,
      padded: 25,
      'leather-and-helm': 34,
      mail: 55,
      'mail-and-plates': 70,
      harness: 88,
      barded: 88,
    };
    const onDisk = readJson('data/units.json')['units'] as Json[];
    expect(onDisk.length).toBe(Object.keys(UNIT_TYPES).length);

    for (const unit of onDisk) {
      const id = unit['id'] as string;
      const mine = UNIT_TYPES[id];
      expect(mine, `${id} is in data/units.json and not in the codex`).toBeDefined();
      expect(mine!.name).toBe(unit['name']);
      expect(mine!.typicalMen).toBe(unit['typicalMen']);
      expect(mine!.marchSpeed).toBe(unit['marchSpeed']);
      expect(mine!.dailyWear).toBe(unit['dailyWear']);
      expect(mine!.skill).toBe(unit['skill']);
      expect(mine!.drillBase).toBe(unit['drillBase']);
      expect(mine!.musterCost).toBe(unit['musterCost']);
      expect([...mine!.raisedBy]).toEqual(unit['raisedBy']);
      expect([...mine!.traits]).toEqual(unit['traits']);
      expect([...mine!.defaultQuirks]).toEqual((unit['defaultQuirks'] as string[]) ?? []);
      // Armour is the one derived number: the court carries a score, the file
      // carries the name of the harness, and data/equipment.json is the bridge.
      expect(mine!.armour).toBe(armour[unit['armour'] as string]);
    }
  });

  it('checks the armour scores against data/equipment.json rather than a memory', () => {
    const rows = readJson('data/equipment.json')['armour'] as Json[];
    const byId = new Map(rows.map((r) => [r['id'] as string, r['armour'] as number]));
    const onDisk = readJson('data/units.json')['units'] as Json[];
    for (const unit of onDisk) {
      const id = unit['id'] as string;
      expect(UNIT_TYPES[id]!.armour, `${id} armour`).toBe(byId.get(unit['armour'] as string));
    }
  });

  it('raises only unit types the roster knows, from holdings the roster mentions', () => {
    const onDisk = readJson('data/units.json')['units'] as Json[];
    for (const unit of onDisk) {
      const raisedBy = unit['raisedBy'] as string[];
      expect(raisedBy.length).toBeGreaterThan(0);
    }
  });
});
