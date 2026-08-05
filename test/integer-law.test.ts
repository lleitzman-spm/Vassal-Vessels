// THE INTEGER LAW, ENFORCED RATHER THAN PROMISED (WRIT-THE-BATTLE §7.5).
//
// "There is not one floating-point number anywhere in the simulation. Not in
// state, not in an intermediate, not in a constant." A comment saying so lasts
// until the first person in a hurry. This test reads the simulation's own source
// and refuses it.
//
// The writ asks the BUILD to fail on these; this repository's build is `tsc`,
// which cannot express the rule, so it is a test instead — it runs in the same
// CI gate and fails the same way.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = "src";

function sources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) sources(path, out);
    else if (entry.name.endsWith(".ts")) out.push(path);
  }
  return out;
}

/** Strip comments and string literals so the scan reads CODE, not prose. The
 *  house voice puts fractions and slashes in comments constantly ("half a
 *  turn", "and/or"), and a check that cries wolf is a check somebody switches
 *  off. */
function code(text: string): string {
  let out = "";
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i] as string;
    const next = text[i + 1];
    if (c === "/" && next === "/") {
      while (i < n && text[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && next === "*") {
      i += 2;
      // Newlines are KEPT so that line numbers still line up with the file: the
      // exemption marker lives in a comment and is looked up by line.
      while (i < n && !(text[i] === "*" && text[i + 1] === "/")) {
        if (text[i] === "\n") out += "\n";
        i++;
      }
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      i++;
      while (i < n && text[i] !== quote) {
        if (text[i] === "\\") i++;
        i++;
      }
      i++;
      out += '""';
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

// The simulation proper. `test/` is not the simulation and may do as it likes.
const SIM = sources(ROOT).filter((p) => !p.includes("src/court"));

describe("the integer law", () => {
  it("names no wall clock and no library randomness or trigonometry", () => {
    const banned = [
      "Math.random",
      "Date.now",
      "performance.now",
      "Math.sqrt",
      "Math.sin",
      "Math.cos",
      "Math.tan",
      "Math.atan2",
      "Math.atan",
      "Math.pow",
      "Math.log",
      "Math.exp",
      "Math.round",
      "new Date",
    ];
    const findings: string[] = [];
    for (const file of SIM) {
      const body = code(readFileSync(file, "utf8"));
      for (const bad of banned) {
        if (body.includes(bad)) findings.push(`${file}: ${bad}`);
      }
    }
    expect(findings, findings.join("\n")).toEqual([]);
  });

  it("holds no numeric literal with a decimal point", () => {
    const findings: string[] = [];
    for (const file of SIM) {
      const body = code(readFileSync(file, "utf8"));
      const re = /(^|[^\w.])\d+\.\d/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(body)) !== null) findings.push(`${file}: ${m[0].trim()}`);
    }
    expect(findings, findings.join("\n")).toEqual([]);
  });

  it("divides only through idiv, and idiv is the only place a slash divides", () => {
    const findings: string[] = [];
    for (const file of SIM) {
      const raw = readFileSync(file, "utf8");
      // Comments are stripped for the SCAN but the original lines are kept for
      // the exemption marker, which is itself written in a comment.
      const stripped = code(raw).split("\n");
      const original = raw.split("\n");
      for (let i = 0; i < stripped.length; i++) {
        const line = stripped[i] as string;
        // Regular expressions and JSX are not used anywhere in the simulation,
        // so any surviving slash outside a comment is arithmetic.
        if (!line.includes("/")) continue;
        // Two doors, both named on the line itself so a reader can find them:
        // `idiv`'s own body, and the single fraction the Aftermath produces at
        // the contract boundary because the court counts in 0..1.
        if ((original[i] ?? "").includes("integer-law:")) continue;
        findings.push(`${file}:${i + 1}  ${line.trim()}`);
      }
    }
    expect(findings, findings.join("\n")).toEqual([]);
  });

  it("the boundary fractions are confined to the Aftermath", () => {
    // The contract speaks in fractions (`brokeAt`, `lossShare`, `atFraction`)
    // and in one float the court hands IN (`entersAtFraction`). Those are the
    // only crossings, and they are all named `integer-law:` — this asserts the
    // list has not quietly grown.
    const allowed = new Set(["src/core/primitives.ts", "src/battle/aftermath.ts"]);
    const marked: string[] = [];
    for (const file of SIM) {
      if (readFileSync(file, "utf8").includes("integer-law:")) marked.push(file);
    }
    for (const file of marked) expect(allowed.has(file), `${file} claims an integer-law exemption`).toBe(true);
  });
});
