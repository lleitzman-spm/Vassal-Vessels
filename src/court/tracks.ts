// WHY THIS FILE EXISTS. The court is a game of days, and a seat is TIME before
// it is anything else. Against a forty-one-day deadline with two seats filled
// you have roughly forty-one crown-days and eighty-two officer-days, and eleven
// things worth doing. You cannot do them all. That is the game, and this module
// is where a player can see it.
//
// A track you do not have is shown anyway, with a null holder — because "the
// Chancellery is empty and that is why these six days are coming off your own
// book" is exactly the sentence the screen exists to say.

import type { Stamp } from '../core/primitives.js';
import { addDays } from './calendar.js';
import type { Chronicle } from './records.js';
import { holderOf } from './tenure.js';
import type { Track } from './types.js';

export function readTracks(c: Chronicle, at: Stamp): Track[] {
  const tracks: Track[] = [
    {
      id: 'crown',
      name: 'The crown’s own day-book',
      holderCaptainId: null,
      occupied: [],
      freeOn: at,
    },
  ];

  for (const seat of c.founding.seats) {
    const held = holderOf(c, seat.id, at);
    tracks.push({
      id: seat.id,
      name: seat.name,
      holderCaptainId: held?.captainId ?? null,
      occupied: [],
      freeOn: at,
    });
  }

  for (const a of c.acts) {
    if (!a.track) continue;
    const track = tracks.find((t) => t.id === a.track?.seatId);
    if (!track) continue;
    const until = addDays(a.at, a.track.days);
    track.occupied.push({ actId: a.id, until });
    if (until.absolute > track.freeOn.absolute) track.freeOn = until;
  }

  return tracks;
}

/** How many days a track has left before a deadline. The one number the court
 *  screen is really about. */
export function daysAvailable(track: Track, before: Stamp): number {
  return Math.max(0, before.absolute - track.freeOn.absolute);
}
