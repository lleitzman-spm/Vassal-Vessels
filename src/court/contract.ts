// WHY THIS FILE EXISTS. The Host and the Aftermath are declared in the court's
// own writ (`docs/WRIT-THE-COURT.md` §4 and §5), but they are not the court's
// property: they are the join, and the battle has to read them without reading
// anything else of ours. So the shapes live once, in `src/core/contract.ts`,
// where neither half owns the other, and this file only points at them.
//
// It exists at all so that a reader who opens `src/court/` looking for "what do
// we hand the battle?" finds the answer here instead of guessing, and so the
// court's own modules import the contract by one name. There is deliberately no
// second declaration: two Hosts that drift apart by one optional field is
// exactly the bug this arrangement makes impossible.
//
// The one renaming: the shared file calls a contingent, unit and captain of a
// host `HostContingent`, `HostUnit` and `HostCaptain`, because the battle keeps
// objects of its own with those plain words for names. The court has no such
// clash, so it uses the writ's spelling below.

export type {
  Host,
  Occasion,
  Command,
  HostContingent as Contingent,
  HostUnit as Unit,
  HostCaptain as Captain,
  Supply,
  Latecomer,
  Absence,
  HostStanding,
  Ground,
  Aftermath,
  UnitFate,
  CaptainFate,
  ContingentFate,
  Spoils,
  Captive,
  GroundResult,
  Deed,
  AnswerKind,
  ContingentSource,
  Disposition,
  TroopKind,
  ReachBand,
  WeightBand,
} from '../core/contract.js';

export { CONTRACT } from '../core/primitives.js';
