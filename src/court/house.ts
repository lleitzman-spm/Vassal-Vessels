// WHY THIS FILE EXISTS. One house, everything about it, on one screen — because
// the act a player wants to take is nearly always beside the record that made
// them want to take it, and a reading that reports a state and makes you go
// somewhere else to change it has failed.
//
// Not one field below is stored. The house record itself holds four things: an
// id, a name, who its lord is and who its heir is. Everything else here is
// arithmetic over the act list, done again every time it is asked for.

import type { Men, Stamp } from '../core/primitives.js';
import { holdingsOf } from './distance.js';
import { readFavours } from './favours.js';
import { readGrievances } from './grievances.js';
import { readHolding } from './land.js';
import { bandOf, readLoyalty } from './loyalty.js';
import type { Chronicle } from './records.js';
import { houseOf } from './records.js';
import type { HouseReading } from './types.js';
import { readVessel } from './vessel.js';

export function readHouse(c: Chronicle, houseId: string, at: Stamp): HouseReading {
  const house = houseOf(c, houseId) ?? { id: houseId, name: houseId, lordCaptainId: '' };
  const loyalty = readLoyalty(c, houseId, at);
  const holdings = holdingsOf(c, houseId, at).map((h) => readHolding(c, h.id, at));

  let marchable: Men = 0;
  for (const h of holdings) {
    for (const line of h.roll) marchable += Math.max(0, line.men - line.garrisonHeld);
  }

  return {
    house,
    loyalty,
    grievances: readGrievances(c, houseId, at),
    favours: readFavours(c, houseId, at),
    vessel: readVessel(c, houseId, at.year),
    holdings,
    marchable,
    band: bandOf(loyalty.value),
  };
}
