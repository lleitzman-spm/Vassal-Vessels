// WHY THIS FILE EXISTS. `tsconfig.json` sets `"types": []` on purpose: the
// engine is headless, and a module that can see Node's globals can also see
// `fetch`, which is exactly the guard the missing "DOM" lib is there to keep.
//
// One test needs to read its own source tree — the integer-law scan, which
// refuses to let `Math.random`, a wall clock or a decimal point into the
// simulation. Rather than switch the whole project's types on and weaken that
// guard everywhere, the two functions that test needs are declared here, by
// hand, and nothing else is.

declare module "node:fs" {
  export function readFileSync(path: string, encoding: string): string;
  export function readdirSync(
    path: string,
    options: { withFileTypes: true },
  ): { name: string; isDirectory(): boolean; isFile(): boolean }[];
}

declare module "node:path" {
  export function join(...parts: string[]): string;
}
