// WHY THIS FILE EXISTS. The engine is headless on purpose: `tsconfig.json` omits
// the DOM lib and names no `types`, so a domain module that reaches for a
// browser or a host runtime will not compile. That is a feature and it stays.
//
// Tests, though, have two honest needs the domain does not: reading the JSON in
// `data/` off disk to prove the codex transcription has not drifted, and saying
// something out loud when a worked example is meant to be READ. Rather than pull
// a whole runtime type package into the project — which would also make
// `document` and `fetch` compile everywhere — the two things the tests actually
// use are declared here, minimally, and nowhere else.
//
// Nothing under `src/` may use either of them. If a domain module ever needs
// `readFileSync`, something has gone wrong: this layer is pure, and its data is
// handed to it, never fetched.

declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf8'): string;
}

declare const console: {
  log(...args: unknown[]): void;
};
