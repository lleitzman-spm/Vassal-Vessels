// WHY THIS FILE EXISTS. The game is named for the vessel, and a game named for a
// mechanic had better have that mechanic right. A house is a cup holding one
// year of service — so many men, for so many days, written into the grant of
// land itself. Summonses drink from it. It refills at the new year, never on a
// timer. Drawing past it is priced, escalating, and shown before the letter is
// sent.

import { describe, expect, it } from 'vitest';
import {
  readAnswer,
  readPrice,
  readVessel,
  stampOf,
  COURT,
  type Act,
} from '../../src/court/index.js';
import { overCalledGrievance } from '../../src/court/vessel.js';
import { aldmarch, FORD, warAtTheFord } from './realm.js';

function summons(campaign: string, on: ReturnType<typeof stampOf>, days = 40): Act[] {
  return [
    {
      id: `a:proclaim-${campaign}`,
      at: on,
      by: 'crown',
      kind: 'proclaim',
      campaignId: campaign,
      causeId: 'a-just-claim',
      defending: false,
      blessed: false,
    },
    {
      id: `a:summon-${campaign}`,
      at: on,
      by: 'crown',
      kind: 'summon',
      campaignId: campaign,
      calledIds: ['h-millrow'],
      musteringPlaceId: FORD,
      standBy: stampOf(on.year, on.season, on.day + days),
      great: false,
    },
  ];
}

describe('the vessel', () => {
  it('is the enfeoffment: the terms are in the record, not in a ledger', () => {
    const c = aldmarch();
    const vessel = readVessel(c, 'h-millrow', 1);
    expect(vessel.owedMen).toBe(60); // exactly what the grant of land says
    expect(vessel.capacityDays).toBe(COURT.obligation.serviceDaysPerYear);
    expect(vessel.drawnDays).toBe(0);
    expect(vessel.daysLeft).toBe(40);
    expect(vessel.beyond).toBe(0);
  });

  it('regranting on better terms is permanent, and the vessel is bigger from that day', () => {
    const better: Act = {
      id: 'a:regrant-millrow',
      at: stampOf(1, 'seedtime', 30),
      by: 'crown',
      kind: 'enfeoff',
      holdingId: 'millrow-manor',
      houseId: 'h-millrow',
      owedMen: 90,
      owedDays: 40,
      note: 'Millrow is regranted on harder terms: ninety men, not sixty.',
    };
    const c = aldmarch([better]);
    expect(readVessel(c, 'h-millrow', 1).owedMen).toBe(90);
    // And striking the regrant puts the old bargain back, because the record IS
    // the contract.
    expect(readVessel({ ...c, acts: c.acts.filter((a) => a.id !== 'a:regrant-millrow') }, 'h-millrow', 1).owedMen).toBe(60);
  });

  it('drains as summonses drink and refills at the new year', () => {
    const first = stampOf(1, 'seedtime', 5);
    const c = aldmarch(summons('war-one', first));

    const drunk = readVessel(c, 'h-millrow', 1);
    expect(drunk.drawnDays).toBe(40);
    expect(drunk.daysLeft).toBe(0);
    expect(drunk.beyond).toBe(0);

    // The new year. The cup is full again, and not because a timer ran.
    const nextYear = readVessel(c, 'h-millrow', 2);
    expect(nextYear.drawnDays).toBe(0);
    expect(nextYear.daysLeft).toBe(40);
  });

  it('counts every draw past the bond, and the price escalates', () => {
    const c = aldmarch([
      ...summons('war-one', stampOf(1, 'seedtime', 5)),
      ...summons('war-two', stampOf(1, 'highsun', 5)),
      ...summons('war-three', stampOf(1, 'harvest', 5)),
      ...summons('war-four', stampOf(1, 'wolfmoon', 5)),
    ]);

    const vessel = readVessel(c, 'h-millrow', 1);
    expect(vessel.daysLeft).toBe(0);
    expect(vessel.beyond).toBe(3); // three letters after the cup ran dry

    // The escalating penalty the data declares: six the first time past the
    // bond, eight every time after.
    expect(overCalledGrievance(0)).toBe(COURT.obligation.beyondTheVesselGrievanceFirst);
    expect(overCalledGrievance(1)).toBe(COURT.obligation.beyondTheVesselGrievanceFurther);
    expect(overCalledGrievance(2)).toBe(COURT.obligation.beyondTheVesselGrievanceFurther);
    expect(overCalledGrievance(1)).toBeGreaterThan(overCalledGrievance(0));
  });

  it('prices a dry-cup summons BEFORE the letter is sent', () => {
    const c = aldmarch(summons('war-one', stampOf(1, 'seedtime', 5)));
    const at = stampOf(1, 'highsun', 5);
    const proposed: Act = {
      id: 'proposed:summon',
      at,
      by: 'crown',
      kind: 'summon',
      campaignId: 'war-two',
      calledIds: ['h-millrow'],
      musteringPlaceId: FORD,
      standBy: stampOf(1, 'highsun', 45),
      great: false,
    };

    const price = readPrice(c, proposed, at);
    const overCall = price.grievances.find((g) => g.kind === 'over-called');
    expect(overCall).toBeDefined();
    expect(overCall?.houseId).toBe('h-millrow');
    expect(overCall?.weight).toBe(COURT.obligation.beyondTheVesselGrievanceFirst);
    expect(overCall?.explains).toContain('dry');
  });

  it('shows a dry cup as a named term in the answer, at the escalating rate', () => {
    const on = stampOf(1, 'highsun', 20);
    const drained = aldmarch(summons('war-one', stampOf(1, 'seedtime', 5)));
    const c = warAtTheFord(drained, { on, called: ['h-millrow'] });

    const answer = readAnswer(c, 'the-ford', 'h-millrow', stampOf(1, 'highsun', 61));
    const dry = answer.willingness.terms.find((t) => t.label === 'His vessel is dry');
    expect(dry).toBeDefined();
    expect(dry?.value).toBe(COURT.willingness.dryVesselFirst);
    expect(dry?.explains).toContain('40 days a year');
  });

  it('lets custom rot after three straight years of coin instead of men', () => {
    const scutage = (year: number): Act => ({
      id: `a:scutage-${year}`,
      at: stampOf(year, 'highsun', 10),
      by: 'crown',
      kind: 'accept-scutage',
      houseId: 'h-millrow',
      campaignId: `war-${year}`,
      crowns: 120,
    });
    const c = aldmarch([scutage(1), scutage(2), scutage(3), scutage(4), scutage(5)]);

    expect(readVessel(c, 'h-millrow', 4).owedMen).toBe(60); // three years is still fine
    expect(readVessel(c, 'h-millrow', 5).owedMen).toBe(54); // a tenth gone
    expect(readVessel(c, 'h-millrow', 6).owedMen).toBe(49); // and another
  });
});
