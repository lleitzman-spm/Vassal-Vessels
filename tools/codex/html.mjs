/**
 * The READ verb of the Codex — one self-contained page for the whole manual.
 * Ported from LandLord's Great Book (`tools/vault/html.mjs` in the sibling
 * `ll-public` repo); the mechanism is unchanged, the front page and the ledger are
 * re-aimed at a game's own vocabulary instead of a knowledge-mined `facts.json`.
 *
 *   node tools/codex/html.mjs
 *   node tools/codex/html.mjs --book codex --out renders/CODEX.html \
 *     --title "The Codex" --subtitle "Vassal Vessels" --accent "#7a1f1f"
 *
 * Takes the directory of generated pages (`codex/`), plus `data/constants.json`
 * where it exists, and binds the lot into ONE html file that opens by
 * double-click. No server, no plugin, no install, no network: every style,
 * every script, every byte of every page is inlined, and the file ships its
 * own Content-Security-Policy so that even a mistake cannot reach out. A page
 * that quietly loads from a CDN publishes as an empty shell that still looks
 * fine at a glance — that whole class of failure is what this file and its
 * verifier (html-check.mjs) exist to keep dead.
 *
 * What the renderer does, in order:
 *   1. walks the codex directory for markdown pages, reads their frontmatter
 *      (type, id, standing, source_path, generated — all tolerated missing);
 *   2. converts each body with its OWN small markdown converter — headings,
 *      lists, tables, fences, blockquotes, callouts, links and wikilinks.
 *      No library, on purpose: the read verb must never gain a dependency;
 *   3. resolves every [[Wikilink]] against the union of page ids, titles,
 *      filename stems and constant ledger ids. What resolves becomes a
 *      working link; what does not is rendered VISIBLY dead and reported —
 *      never left looking like a link that merely forgot to work;
 *   4. flattens `data/constants.json` straight into a ledger page — every
 *      leaf governing number, at its canonical home, so this and the
 *      per-group `constant` pages can never carry two different copies;
 *   5. builds the front page as a spine, not a dump: the laws, the writs,
 *      the units, the keywords, the equipment, the formations, the numbers,
 *      what is contested, what is merely proposed — with everything else
 *      reachable through the shelves, not front-loaded;
 *   6. embeds a search corpus and the link graph as JSON, page bodies as
 *      inert <template> elements, and the client script from html.client.js.
 *
 * Standing is rendered on the FACE of every page — chips everywhere the page
 * is named, and a banner across proposed / contested / retired / settled
 * pages. A `proposed` design sitting next to a `built` one in plain prose is
 * exactly the failure this axis exists to prevent; here they are never
 * dressed alike.
 *
 * Honest limits, so nobody discovers them the hard way:
 *   - The markdown converter covers the subset the emitter writes. Raw HTML
 *     in a source is ESCAPED, not passed through; reference-style links,
 *     footnotes and setext headings are not understood.
 *   - Images cannot travel inside one file unless they are data: URIs, so
 *     any other image renders as a labelled figure box naming its path.
 *   - External [text](https://…) links in prose stay clickable — following
 *     one is a reader's choice, not a page load — but they are the ONLY
 *     outward references the file may contain, and the verifier counts them.
 *   - Frontmatter parsing is a deliberate flat subset of YAML: scalars,
 *     quoted strings, inline [a, b] lists and simple `- item` blocks.
 *     Nested maps are ignored rather than guessed at.
 *
 * Exit 0 = rendered; 1 = the codex directory is missing or unreadable.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve, basename, extname, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');

// ── The writ's standings. Anything else renders neutrally as "unmarked" ──
const STANDINGS = ['canon', 'built', 'proposed', 'contested', 'retired', 'settled'];

// ─────────────────────────────────────────────────────────────────────────
// Arguments — parameterised the same way the sibling ll-public repo's tool is,
// even though nothing here currently shares the file across repos. Defaults are
// Vassal Vessels' own.
// ─────────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const a = {
    book: 'codex',
    facts: 'data/constants.json',
    out: 'renders/CODEX.html',
    title: 'The Codex',
    subtitle: 'Vassal Vessels',
    accent: '#7a1f1f', // an oxblood banner-red; calm, not theme-park
  };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const take = () => argv[++i] ?? '';
    if (k === '--book') a.book = take();
    else if (k === '--facts') a.facts = take();
    else if (k === '--out') a.out = take();
    else if (k === '--title') a.title = take();
    else if (k === '--subtitle') a.subtitle = take();
    else if (k === '--accent') a.accent = take();
    else if (k === '--help' || k === '-h') {
      console.log('usage: node tools/codex/html.mjs [--book DIR] [--facts FILE] [--out FILE]');
      console.log('                                 [--title T] [--subtitle S] [--accent #hex]');
      process.exit(0);
    }
  }
  return a;
}

// ─────────────────────────────────────────────────────────────────────────
// Small shared helpers
// ─────────────────────────────────────────────────────────────────────────
const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** A slug for heading anchors and derived ids. */
const slug = (s) =>
  String(s).toLowerCase().normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'x';

/**
 * The normal form every wikilink target and every registered name is folded
 * to before matching. Colons survive because ids like `rule:1` and
 * `constant:battle-shock` carry them; everything else that is not a letter or
 * number collapses to a dash, so `[[Law 1 — Recognizable Words]]` finds the
 * page titled "Law 1 — recognizable words".
 */
const norm = (s) =>
  String(s).toLowerCase().normalize('NFKD')
    .replace(/[^\p{L}\p{N}:]+/gu, '-')
    .replace(/^-+|-+$/g, '');

/**
 * The standing chip — the same small badge everywhere a page is named, so a
 * proposed thing can never dress as a built one. An unknown standing gets a
 * neutral chip carrying its own word; a missing one reads "unmarked". Neither
 * is hidden — a proposed page dressed as a built one is exactly the failure
 * this whole axis exists to prevent.
 */
const chip = (standing) => {
  const s = String(standing || '');
  const cls = STANDINGS.includes(s) ? `s-${s}` : s ? 's-other' : 's-none';
  return `<span class="chip ${cls}">${escapeHtml(s || 'unmarked')}</span>`;
};

// ─────────────────────────────────────────────────────────────────────────
// Frontmatter — a flat, forgiving subset of YAML. The emitter writes simple
// scalars and simple lists; anything fancier is somebody's bug, and this
// parser refuses to guess at it rather than silently misread it.
// ─────────────────────────────────────────────────────────────────────────
function parseFrontmatter(raw) {
  const text = raw.replace(/\r\n/g, '\n');
  if (!text.startsWith('---')) return { meta: {}, body: text };
  const end = text.indexOf('\n---', 3);
  if (end === -1) return { meta: {}, body: text }; // an unclosed fence is a body, not a header
  const head = text.slice(text.indexOf('\n') + 1, end);
  const body = text.slice(text.indexOf('\n', end + 1) + 1);
  const meta = {};
  let listKey = null;
  for (const line of head.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const li = line.match(/^\s+-\s+(.*)$/);
    if (li && listKey) { meta[listKey].push(unquote(li[1])); continue; }
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue; // an indented nested map, or noise — tolerated, ignored
    const [, key, rawVal] = kv;
    listKey = null;
    if (rawVal === '') { meta[key] = []; listKey = key; continue; }
    if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
      meta[key] = rawVal.slice(1, -1).split(',').map((v) => unquote(v.trim())).filter(Boolean);
      continue;
    }
    meta[key] = unquote(rawVal);
  }
  return { meta, body };
}
const unquote = (v) => {
  const s = String(v).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
  return s;
};

// ─────────────────────────────────────────────────────────────────────────
// Markdown → HTML. Line-based, no lookbehind tricks, no library.
// The converter takes a `ctx` so wikilinks can be resolved and recorded as
// they are met — links are found during rendering, never invented after.
// ─────────────────────────────────────────────────────────────────────────

/** Stash-and-restore placeholders keep code spans out of the way of the
 *  other inline rules (a `**` inside backticks must stay literal). */
const PH_OPEN = '\uE000', PH_CLOSE = '\uE001'; // private-use: no source text contains these
const BR = '\uE002';       // stands in for markdown's two-trailing-space hard break

function renderInline(text, ctx) {
  let out = escapeHtml(text);
  const stash = [];
  const put = (html) => { stash.push(html); return PH_OPEN + (stash.length - 1) + PH_CLOSE; };

  // code spans first, so nothing inside them is touched again
  out = out.replace(/`([^`\n]+)`/g, (_, code) => put(`<code>${code}</code>`));

  // wikilinks: [[Target]], [[Target|Label]], [[Target#Section]].
  // The text was HTML-escaped above, so a target like "profile & wielding"
  // arrives as "profile &amp; wielding" — unescape before resolving, or a
  // real page renders dead (an early version of this tool caught exactly this).
  const unesc = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  out = out.replace(/\[\[([^\]|#]+)(?:#([^\]|]*))?(?:\|([^\]]+))?\]\]/g, (_, target, section, label) => {
    const t = unesc(target).trim();
    const shown = unesc(label || target).trim();
    const hit = ctx.resolve(t);
    if (hit) {
      ctx.recordLink(hit);
      const anchor = section ? '@' + slug(section) : '';
      return put(`<a class="wl" data-target="${escapeHtml(hit.id)}" href="#${escapeHtml(encodeURIComponent(hit.id))}${anchor}">${escapeHtml(shown)}</a>`);
    }
    ctx.recordDead(t);
    // Visibly dead: a reader must see at a glance that the road ends here.
    return put(`<span class="wl-dead" data-raw="${escapeHtml(t)}" title="No page answers to “${escapeHtml(t)}”">${escapeHtml(shown)}</span>`);
  });

  // images. One file cannot carry a neighbouring image, so only data: URIs
  // render; anything else becomes an honest labelled box, never a broken icon.
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    const url = src.trim().split(/\s+/)[0];
    if (/^data:image\//i.test(url)) return put(`<img alt="${alt}" src="${url}">`);
    return put(`<span class="img-ref" title="Images cannot travel inside one file">▤ figure: ${alt || url}</span>`);
  });

  // ordinary links. Internal #anchors and relative paths keep their href;
  // external ones are marked so the eye (and the verifier) can count them.
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, dest) => {
    const url = dest.trim().split(/\s+/)[0];
    if (/^(https?:)?\/\//i.test(url) || /^[a-z][a-z0-9+.-]*:/i.test(url)) {
      ctx.recordExternal(url);
      return put(`<a class="ext" href="${url}" rel="noopener noreferrer">${label}<span class="ext-mark" aria-hidden="true">↗</span></a>`);
    }
    if (url.startsWith('#')) return put(`<a href="${url}">${label}</a>`);
    // A relative path is a pointer into the repo — real, but not walkable
    // from inside one file. Shown as a path, styled as a reference.
    return put(`<span class="path-ref" title="A path in the repo, not a page in the Codex">${label}</span>`);
  });

  out = out
    .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>')
    .replace(/(^|[\s(])_([^_\s][^_]*?)_(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>');

  return out.replace(new RegExp(PH_OPEN + '(\\d+)' + PH_CLOSE, 'g'), (_, i) => stash[+i]);
}

const plainOfInline = (t) => t
  .replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_, a, b) => (b || a))
  .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/[`*_~]+/g, '');

function renderBlocks(lines, ctx) {
  const html = [];
  const text = []; // the plain text twin, for the search corpus
  let i = 0;
  const n = lines.length;

  while (i < n) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    // fenced code
    const fence = line.match(/^(\s*)(```|~~~)\s*(\S*)\s*$/);
    if (fence) {
      const close = fence[2];
      const lang = fence[3];
      const buf = [];
      i++;
      while (i < n && !lines[i].trim().startsWith(close)) { buf.push(lines[i]); i++; }
      i++; // past the closing fence (or the end — an unclosed fence swallows to EOF, honestly)
      html.push(`<pre class="code"${lang ? ` data-lang="${escapeHtml(lang)}"` : ''}><code>${escapeHtml(buf.join('\n'))}</code></pre>`);
      text.push(buf.join('\n'));
      continue;
    }

    // heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const inner = renderInline(h[2], ctx);
      const plain = plainOfInline(h[2]);
      html.push(`<h${level} id="${slug(plain)}">${inner}</h${level}>`);
      text.push(plain);
      ctx.recordHeading?.(level, plain);
      i++;
      continue;
    }

    // horizontal rule
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { html.push('<hr>'); i++; continue; }

    // blockquote — and the callout dressed as one
    if (/^\s*>/.test(line)) {
      const buf = [];
      while (i < n && /^\s*>/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
      const callout = buf[0]?.match(/^\[!(\w+)\]\s*(.*)$/);
      if (callout) {
        const kind = callout[1].toLowerCase();
        const known = ['note', 'tip', 'important', 'warning', 'caution'].includes(kind) ? kind : 'note';
        const title = callout[2].trim() || callout[1][0] + callout[1].slice(1).toLowerCase();
        const inner = renderBlocks(buf.slice(1), ctx);
        html.push(`<aside class="callout c-${known}"><p class="callout-title">${escapeHtml(title)}</p>${inner.html}</aside>`);
        text.push(title, inner.text);
      } else {
        const inner = renderBlocks(buf, ctx);
        html.push(`<blockquote>${inner.html}</blockquote>`);
        text.push(inner.text);
      }
      continue;
    }

    // table: a pipe row followed by the |---|---| separator
    if (line.includes('|') && i + 1 < n && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes('-')) {
      const splitRow = (row) => {
        // pipes inside code spans must not split cells
        const guarded = row.replace(/`[^`]*`/g, (m) => m.replace(/\|/g, PH_OPEN));
        return guarded.replace(/^\s*\|/, '').replace(/\|\s*$/, '')
          .split('|').map((c) => c.replace(new RegExp(PH_OPEN, 'g'), '|').trim());
      };
      const headCells = splitRow(line);
      const aligns = splitRow(lines[i + 1]).map((c) =>
        /^:-+:$/.test(c) ? 'center' : /^-+:$/.test(c) ? 'right' : '');
      i += 2;
      const rows = [];
      while (i < n && lines[i].includes('|') && lines[i].trim()) { rows.push(splitRow(lines[i])); i++; }
      const td = (cells, tag) => '<tr>' + cells.map((c, j) =>
        `<${tag}${aligns[j] ? ` style="text-align:${aligns[j]}"` : ''}>${renderInline(c, ctx)}</${tag}>`).join('') + '</tr>';
      html.push('<div class="table-wrap"><table><thead>' + td(headCells, 'th') + '</thead><tbody>'
        + rows.map((r) => td(r, 'td')).join('') + '</tbody></table></div>');
      text.push(headCells.map(plainOfInline).join(' '), ...rows.map((r) => r.map(plainOfInline).join(' ')));
      continue;
    }

    // list — unordered or ordered, one style of nesting: deeper indent
    const li = line.match(/^(\s*)([-*+]|\d+[.)])\s+/);
    if (li) {
      const { html: listHtml, textParts, next } = parseList(lines, i, li[1].length, ctx);
      html.push(listHtml);
      text.push(...textParts);
      i = next;
      continue;
    }

    // paragraph: gather until a blank line or the start of any other block
    const buf = [line];
    i++;
    while (i < n && lines[i].trim()
      && !/^(#{1,6})\s/.test(lines[i]) && !/^\s*>/.test(lines[i])
      && !/^(\s*)(```|~~~)/.test(lines[i]) && !/^(\s*)([-*+]|\d+[.)])\s+/.test(lines[i])
      && !/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i])) {
      buf.push(lines[i]); i++;
    }
    const para = buf.map((l) => l.replace(/\s{2,}$/, BR)).join(' ');
    html.push(`<p>${renderInline(para, ctx).replace(new RegExp(BR, 'g'), '<br>')}</p>`);
    text.push(plainOfInline(buf.join(' ')));
  }

  return { html: html.join('\n'), text: text.join('\n') };
}

function parseList(lines, start, baseIndent, ctx) {
  const items = [];
  const marker = lines[start].match(/^\s*([-*+]|\d+[.)])/)[1];
  const ordered = /\d/.test(marker);
  let i = start;
  let cur = null;

  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
    if (m && m[1].length === baseIndent) {
      if (cur) items.push(cur);
      cur = { head: m[3], kids: [] };
      i++;
    } else if (m && m[1].length > baseIndent) {
      cur?.kids.push(line); i++;
    } else if (!line.trim()) {
      // a blank line ends the list unless another item of ours follows
      const nx = lines[i + 1]?.match(/^(\s*)([-*+]|\d+[.)])\s+/);
      const cont = lines[i + 1] && /^\s+\S/.test(lines[i + 1]) && (!nx || nx[1].length > baseIndent);
      if ((nx && nx[1].length >= baseIndent) || cont) { i++; continue; }
      break;
    } else if (/^\s+\S/.test(line) && line.match(/^(\s*)/)[1].length > baseIndent) {
      cur?.kids.push(line); i++; // continuation prose inside the item
    } else break;
  }
  if (cur) items.push(cur);

  const textParts = [];
  const body = items.map((it) => {
    let inner = renderInline(it.head, ctx);
    textParts.push(plainOfInline(it.head));
    if (it.kids.length) {
      const dedent = Math.min(...it.kids.filter((k) => k.trim()).map((k) => k.match(/^(\s*)/)[1].length));
      const sub = renderBlocks(it.kids.map((k) => k.slice(dedent)), ctx);
      inner += '\n' + sub.html;
      textParts.push(sub.text);
    }
    return `<li>${inner}</li>`;
  }).join('\n');

  const tag = ordered ? 'ol' : 'ul';
  return { html: `<${tag}>${body}</${tag}>`, textParts, next: i };
}

// ─────────────────────────────────────────────────────────────────────────
// Reading the codex off disk
// ─────────────────────────────────────────────────────────────────────────
function walk(dir) {
  const found = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) found.push(...walk(p));
    else if (extname(name).toLowerCase() === '.md') found.push(p);
  }
  return found;
}

function loadPages(bookDir) {
  const pages = [];
  for (const path of walk(bookDir)) {
    const rel = relative(bookDir, path);
    const stem = basename(path, extname(path));
    let meta = {}, body = '';
    try {
      ({ meta, body } = parseFrontmatter(readFileSync(path, 'utf8')));
    } catch (e) {
      console.error(`  warn  could not read ${rel}: ${e.message} — skipped`);
      continue;
    }
    const firstH1 = body.match(/^#\s+(.+)$/m);
    const dirName = dirname(rel) === '.' ? '' : dirname(rel).split('/')[0];
    const isStart = /^00[\s-]/.test(stem);
    const page = {
      id: String(meta.id || (isStart ? 'start-here' : slug(stem))),
      title: String(meta.title || (firstH1 ? plainOfInline(firstH1[1]) : stem.replace(/^00[\s-]+/, ''))),
      // frontmatter wins over the shelf it sits on; the shelf is the fallback
      type: String(meta.type || (dirName ? dirName.replace(/s$/, '') : isStart ? 'note' : 'page')),
      standing: STANDINGS.includes(meta.standing) ? meta.standing : (meta.standing ? String(meta.standing) : ''),
      source: String(meta.source_path || ''),
      generated: String(meta.generated || ''),
      stem, rel, bodyMd: body,
      pinned: isStart,
    };
    pages.push(page);
  }
  // deterministic order: shelf, then id — so a re-render with no change
  // produces an identical file
  pages.sort((a, b) => (a.type + '\0' + a.id).localeCompare(b.type + '\0' + b.id));
  return pages;
}

/**
 * Flatten `data/constants.json` into one row per LEAF number — the ledger is meant
 * to be exhaustive, unlike the compiled `constant` pages (one per GROUP, because a
 * group is where the design has something to say). `explains`/`chose`/`worked` are
 * the group's own prose, not a governing number, and are skipped here; they are
 * fully rendered on the group's own page, which every row links back to.
 */
function loadFacts(factsPath) {
  if (!existsSync(factsPath)) return [];
  let doc;
  try {
    doc = JSON.parse(readFileSync(factsPath, 'utf8'));
  } catch (e) {
    console.error(`  warn  ${factsPath} exists but did not parse (${e.message}) — the ledger will be empty`);
    return [];
  }
  const rows = [];
  for (const root of ['battle', 'court']) {
    const branch = doc[root];
    if (!branch || typeof branch !== 'object') continue;
    for (const [groupKey, group] of Object.entries(branch)) {
      if (!group || typeof group !== 'object' || Array.isArray(group)) continue;
      for (const [leafKey, value] of Object.entries(group)) {
        if (['explains', 'chose', 'worked'].includes(leafKey)) continue;
        if (value !== null && typeof value === 'object') continue; // an unforeseen nested shape, read honestly as absent
        rows.push({
          id: `${root}.${groupKey}.${leafKey}`,
          label: leafKey,
          value,
          scope: `${root}.${groupKey}`,
          groupPageId: `constant:${normSlug(`${root}.${groupKey}`)}`,
        });
      }
    }
  }
  return rows;
}
/** The same slug shape `tools/codex/lib.mjs` uses for a constant group's id — kept
 *  in step by hand, on purpose: this file has no dependency on that one, by design
 *  (the read verb must never gain one), so the two small functions are duplicated
 *  rather than shared. If they ever drift, a ledger row's "open the group" link
 *  would point at a page that does not exist — `html-check.mjs` would catch it. */
function normSlug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'page';
}

// ─────────────────────────────────────────────────────────────────────────
// The build
// ─────────────────────────────────────────────────────────────────────────
function main() {
  const args = parseArgs(process.argv.slice(2));
  const bookDir = resolve(ROOT, args.book);
  const factsPath = resolve(ROOT, args.facts);
  const outPath = resolve(ROOT, args.out);

  if (!existsSync(bookDir)) {
    console.error(`FAIL  no codex at ${args.book}/ — run the compile verb first (npm run codex),`);
    console.error('      or point --book at the directory of generated pages.');
    process.exit(1);
  }

  const pages = loadPages(bookDir);
  const facts = loadFacts(factsPath);
  if (!pages.length) console.error('  warn  the codex directory holds no pages — rendering the shell anyway');

  // ── The name registry every wikilink resolves against ──────────────────
  // Ids, titles and filename stems all answer; first claim on a name wins
  // and a collision is reported, because a silently re-aimed link is worse
  // than a dead one.
  const registry = new Map(); // norm(name) → { id, kind }
  const collisions = [];
  const claim = (name, id, kind) => {
    const k = norm(name);
    if (!k) return;
    const prior = registry.get(k);
    if (prior && prior.id !== id) { collisions.push({ name, held: prior.id, wanted: id }); return; }
    registry.set(k, { id, kind });
  };

  const FACTS_PAGE_ID = 'facts-ledger';
  for (const p of pages) { claim(p.id, p.id, 'page'); }
  for (const p of pages) { claim(p.title, p.id, 'page'); claim(p.stem, p.id, 'page'); }
  // an emitter may write per-fact PAGES as well; when one already holds the
  // fact's id, the page wins quietly — that is a choice, not a collision
  for (const f of facts) { if (f.id && !registry.has(norm(f.id))) claim(f.id, FACTS_PAGE_ID, 'fact'); }

  // ── Render every page body, recording links as they are found ──────────
  const deadLinks = []; // { page, target }
  const externals = []; // { page, url }
  const idToIndex = new Map();

  const rendered = pages.map((p, idx) => {
    idToIndex.set(p.id, idx);
    const links = new Set();     // page ids this page reaches
    const factRefs = new Set();  // fact ids this page cites
    const ctx = {
      resolve: (target) => {
        const hit = registry.get(norm(target));
        if (!hit) return null;
        if (hit.kind === 'fact') return { id: norm(target), fact: true };
        return { id: hit.id };
      },
      recordLink: (hit) => { if (hit.fact) factRefs.add(hit.id); else if (hit.id !== p.id) links.add(hit.id); },
      recordDead: (target) => deadLinks.push({ page: p.id, target }),
      recordExternal: (url) => externals.push({ page: p.id, url }),
    };
    // resolve() for facts hands back the normalised fact id and the client
    // routes `#fact:x` to the ledger row — one copy of every number, always.
    const { html, text } = renderBlocks(p.bodyMd.split('\n'), ctx);
    return { html, text, links, factRefs };
  });

  // ── The ledger of governing numbers — data/constants.json flattened, not
  // copied. Standing is a GROUP property here (the group's own page carries the
  // chip, along with why the number is what it is and a worked example where one
  // exists) — a bare leaf number has no standing of its own to show, so each row
  // links back to the group instead of repeating a chip on every one of a hundred
  // rows.
  const factRows = facts.map((f) => {
    const groupKnown = registry.has(norm(f.groupPageId));
    const groupLink = groupKnown
      ? `<a class="wl" data-target="${escapeHtml(f.groupPageId)}" href="#${escapeHtml(encodeURIComponent(f.groupPageId))}">${escapeHtml(f.scope)}</a>`
      : `<span class="path-ref">${escapeHtml(f.scope)}</span>`;
    const value = `<span class="fact-value">${escapeHtml(String(f.value))}</span>`;
    return `<tr id="fr-${escapeHtml(norm(f.id))}" data-fact="${escapeHtml(norm(f.id))}">
      <td><div class="fact-label">${escapeHtml(f.label)}</div><div class="fact-id">${escapeHtml(f.id)}</div></td>
      <td>${value}</td>
      <td class="fact-scope">${groupLink}</td>
    </tr>`;
  });

  const factsLedgerHtml = facts.length
    ? `<p class="ledger-note">Every governing number, flattened straight from <span class="path-ref">${escapeHtml(args.facts)}</span> — its one canonical home. To change a number, change it there and re-render; a copy would only learn to drift. Open a group (the third column) for WHY the number is what it is, and a worked example where the design wrote one.</p>
       <div class="table-wrap"><table class="facts-table">
       <thead><tr><th>Constant</th><th>Value</th><th>Group</th></tr></thead>
       <tbody>${factRows.join('\n')}</tbody></table></div>`
    : `<p class="ledger-note">No <span class="path-ref">${escapeHtml(args.facts)}</span> was found, so the ledger stands empty. The governing numbers live there when it exists.</p>`;

  // ── The front page: a spine, not a dump ─────────────────────────────────
  const byType = new Map();
  for (const p of pages) {
    if (!byType.has(p.type)) byType.set(p.type, []);
    byType.get(p.type).push(p);
  }
  const numOf = (p) => { const m = p.id.match(/(\d+)\s*$/) || p.title.match(/(\d+)/); return m ? +m[1] : 1e9; };
  const sortLawful = (list) => [...list].sort((a, b) => numOf(a) - numOf(b) || a.title.localeCompare(b.title));

  const pageRow = (p) =>
    `<li class="spine-row"><a class="wl" data-target="${escapeHtml(p.id)}" href="#${escapeHtml(encodeURIComponent(p.id))}">${escapeHtml(p.title)}</a> ${chip(p.standing)}</li>`;
  const section = (heading, body, note) => body
    ? `<section class="spine-sec"><h2>${escapeHtml(heading)}</h2>${note ? `<p class="spine-note">${note}</p>` : ''}${body}</section>` : '';
  const listOf = (arr) => arr?.length ? `<ul class="spine-list">${arr.map(pageRow).join('\n')}</ul>` : '';
  // A divider is a chapter break, not a section — it exists so the front page reads
  // as a book with an ORDER, cover to cover, rather than a pile of type-buckets. See
  // `docs/WRIT-THE-CODEX.md`: the sequence below is deliberate — the constitution,
  // then one worked example to anchor it, then what fights and what beats what, then
  // how you command it, then the court that produced the army in the first place,
  // then the numbers as reference, then build status, then the engine.
  const divider = (numeral, label, sub) =>
    `<div class="spine-divider"><span class="spine-divider-num">${escapeHtml(numeral)}</span><div><span class="spine-divider-label">${escapeHtml(label)}</span>${sub ? `<span class="spine-divider-sub">${escapeHtml(sub)}</span>` : ''}</div></div>`;
  // A combined section for several small shelves at once, so "Command" and "The
  // Court" read as ONE chapter with sub-headings rather than a wall of h2's each
  // claiming equal weight with "Units" or "The Laws".
  const subsection = (heading, body, note) => body
    ? `<div class="spine-sub"><h3>${escapeHtml(heading)}</h3>${note ? `<p class="spine-note">${note}</p>` : ''}${body}</div>` : '';

  const contestedPages = pages.filter((p) => p.standing === 'contested');
  const proposedPages = pages.filter((p) => p.standing === 'proposed');
  const startPage = pages.find((p) => p.pinned);
  const byTitle = (list) => [...(list || [])].sort((a, b) => a.title.localeCompare(b.title));
  const examplePages = byTitle(byType.get('example'));
  // The primary spine, front-loaded and in reading order — the game's own
  // vocabulary, not an application's. Every type placed into a chapter below belongs
  // here so "the rest of the shelves" catches only a genuine leftover, never a whole
  // category of content the reading order forgot.
  const spineTypes = new Set([
    'rule', 'writ', 'example', 'unit', 'keyword', 'equipment', 'formation', 'terrain',
    'order', 'standing-plan', 'trait', 'quirk',
    'seat', 'obligation', 'holding', 'grievance', 'favour', 'answer', 'troop-source', 'season',
    'constant', 'module', 'invariant', 'map', 'note',
  ]);
  const shelfLinks = [...byType.entries()]
    .filter(([t]) => !spineTypes.has(t))
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([t, list]) =>
      `<a class="shelf-link" href="#browse:type=${escapeHtml(encodeURIComponent(t))}">${escapeHtml(t)}<span class="shelf-count">${list.length}</span></a>`)
    .join('');

  const startInlined = startPage
    ? `<section class="spine-sec start-sec">${rendered[idToIndex.get(startPage.id)].html}</section>`
    : '';

  const contestedBody = contestedPages.length ? listOf(contestedPages) : '<p class="spine-note quiet">Nothing stands contested.</p>';

  // Most of the Codex is `proposed` right now, honestly — the engine has not been
  // built yet (see `docs/WRIT-THE-CODEX.md`). Listing every one of them inline on the
  // front page would turn the spine back into the dump it is trying not to be, so
  // this section states the count and hands off to the filterable browse view.
  const proposedBody = proposedPages.length
    ? `<p class="spine-note">${proposedPages.length} page${proposedPages.length === 1 ? '' : 's'} — a design in \`data/\`, nothing in the tree reading it yet. <a class="wl" href="#browse:standing=proposed">browse them all</a>.</p>`
    : '<p class="spine-note quiet">Nothing merely proposed.</p>';

  const homeHtml = `
    ${startInlined}

    ${divider('I', 'The Rules', 'The constitution’s numbered laws — canon, and it wins until amended.')}
    ${section('The Laws', listOf(sortLawful(byType.get('rule') || [])), '')}
    ${section('The Writs', listOf(sortLawful(byType.get('writ') || [])),
      'The implementable specs. A writ is a design, not proof that anything works.')}

    ${divider('II', 'A Worked Example', 'Meet the rules once, filled in — a whole Host, standing in one field at once.')}
    ${section('The Example Host', listOf(examplePages),
      examplePages.length ? 'Every idea in this project, in one place, before the catalog below breaks them apart again.' : '')}

    ${divider('III', 'Units, and What Beats What', 'What shows up at the muster, what it carries, and the physical facts that decide a fight.')}
    ${section('Units', listOf(byTitle(byType.get('unit'))), '')}
    ${section('Keywords', listOf(byTitle(byType.get('keyword'))),
      'The short words printed on a unit’s sheet. Each means exactly one rule — never "plus twenty percent".')}
    ${section('Equipment', listOf(byTitle(byType.get('equipment'))),
      'Weapons, missile weapons, armour and shields — what a unit carries, and what that does to the physics.')}
    ${section('Formations', listOf(byTitle(byType.get('formation'))),
      'How a unit stands. Every formation is a bet; the commander’s craft is making the enemy’s bets wrong.')}
    ${section('Terrain', listOf(byTitle(byType.get('terrain'))),
      'The ground itself — cover, slope, line of sight. The same unit fights differently depending on where you put it.')}

    ${divider('IV', 'Command', 'The three channels a battle is actually steered through, and the captains who carry them out — or do not.')}
    <section class="spine-sec">
      ${subsection('Orders', listOf(byTitle(byType.get('order'))),
        'Standing charges, improvised orders and pursuit policies — dear, late, and filtered through a soul.')}
      ${subsection('Standing Plans', listOf(byTitle(byType.get('standing-plan'))),
        'Bound in advance, instant, unchecked — the loophole that lets you get a disloyal captain to agree to something hypothetical.')}
      ${subsection('Traits', listOf(byTitle(byType.get('trait'))),
        'The seven numbers a captain is made of — competence and temper.')}
      ${subsection('Quirks', listOf(byTitle(byType.get('quirk'))),
        'Named, documented behaviours a contingent or a captain carries onto the field.')}
    </section>

    ${divider('V', 'The Court', 'What produced this army before the first letter was ever sent.')}
    <section class="spine-sec">
      ${subsection('Seats', listOf(byTitle(byType.get('seat'))),
        'Seven offices. Each is a track on the calendar, a lever on the muster, and a grievance machine in both directions.')}
      ${subsection('Obligations', listOf(byTitle(byType.get('obligation'))),
        'The bargains a house owes its men under — the vessel, the household, the charter, the contract.')}
      ${subsection('Holdings', listOf(byTitle(byType.get('holding'))),
        'The land that raises the men — manor, castle, town, and the rest.')}
      ${subsection('Grievances', listOf(byTitle(byType.get('grievance'))),
        'How a slight at court becomes a refusal on the battlefield. Read this before you wonder why a house answered badly.')}
      ${subsection('Favours', listOf(byTitle(byType.get('favour'))),
        'The other half of the ledger — generosity is a subscription, not a purchase.')}
      ${subsection('Answers', listOf(byTitle(byType.get('answer'))),
        'The fixed thresholds a player reads BEFORE sending a letter — the whole no-dice design rests on these being legible.')}
      ${subsection('Troop Sources', listOf(byTitle(byType.get('troop-source'))),
        'Where men actually come from, and the political price attached to each.')}
      ${subsection('Seasons', listOf(byTitle(byType.get('season'))),
        'Four seasons of ninety days, each changing march speed, wear, forage and willingness.')}
    </section>

    ${divider('VI', 'Reference', 'Every governing number, resolved — no plugin required to read a single table here.')}
    ${section('The Governing Numbers',
      facts.length
        ? `<p class="spine-note">${facts.length} number${facts.length === 1 ? '' : 's'} on the ledger — <a class="wl" data-target="${FACTS_PAGE_ID}" href="#${FACTS_PAGE_ID}">open the full ledger</a>, or browse the ${(byType.get('constant') || []).length} grouped pages that say WHY each one is what it is.</p>`
        : '<p class="spine-note quiet">No ledger yet.</p>')}

    ${divider('VII', 'Build Status', 'What is designed versus what an engine actually checks — read this before you cite anything as working.')}
    ${section('Contested', contestedBody, contestedPages.length
      ? 'Two designs disagreed and no decision has been made. Settle these before citing either side.' : '')}
    ${section('Merely Proposed', proposedBody,
      proposedPages.length ? 'Designs not yet built. May never be cited as evidence that the game plays this way.' : '')}
    ${section('The Engine', listOf(byType.get('module')),
      (byType.get('module') || []).length ? 'The code that actually runs the game.' : 'No engine yet — `src/` is still being built, in parallel with this Codex.')}
    ${section('Invariants',
      (byType.get('invariant') || []).length
        ? `<p class="spine-note">${(byType.get('invariant') || []).length} test${(byType.get('invariant') || []).length === 1 ? '' : 's'} — the rules the game actually enforces by machine. <a class="wl" href="#browse:type=invariant">browse them all</a>.</p>`
        : '', (byType.get('invariant') || []).length ? 'One page per `it()`/`test()` in `test/`, once it exists.' : '')}

    ${shelfLinks ? `<section class="spine-sec"><h2>The Rest of the Shelves</h2>
      <p class="spine-note">Anything not placed into a chapter above — reachable, not front-loaded, and ideally empty.</p>
      <div class="shelf-row">${shelfLinks}</div></section>` : ''}`;

  // ── Assemble the data the client needs ──────────────────────────────────
  const pagesMeta = pages.map((p, i) => ({
    id: p.id, title: p.title, type: p.type, standing: p.standing,
    source: p.source, generated: p.generated,
  }));
  // synthetic surfaces ride along at the end: the ledger and the front page
  pagesMeta.push({ id: FACTS_PAGE_ID, title: 'The Ledger of Governing Numbers', type: 'ledger', standing: '', source: args.facts, generated: '', synthetic: true });
  pagesMeta.push({ id: 'home', title: args.title, type: 'spine', standing: '', source: '', generated: '', synthetic: true });

  // Search corpus: title + full body text per page, capped per page so one
  // pathological page cannot bloat the file. 60k chars of prose is ~10x the
  // longest real page today; the cap is a fuse, not a feature.
  const corpus = rendered.map((r) => r.text.slice(0, 60000));
  corpus.push(facts.map((f) => [f.id, f.label, f.scope, f.value].filter((x) => x !== null && x !== undefined && x !== '').join(' ')).join('\n'));
  corpus.push(''); // home searches by its title alone

  // Link graph as index adjacency; fact citations point at the ledger page.
  const ledgerIdx = pagesMeta.length - 2;
  const graph = rendered.map((r) => {
    const out = [...r.links].map((id) => idToIndex.get(id)).filter((x) => x !== undefined);
    if (r.factRefs.size) out.push(ledgerIdx);
    return [...new Set(out)];
  });
  graph.push([], []);

  const data = {
    title: args.title, subtitle: args.subtitle,
    generated: new Date().toISOString(),
    standings: STANDINGS,
    pages: pagesMeta, corpus, graph,
    factRows: facts.map((f) => norm(String(f.id || ''))),
    startId: startPage ? startPage.id : null,
  };

  // ── Templates: every page body inert until the router mounts it ────────
  const templates = pages.map((p, i) =>
    `<template data-page="${escapeHtml(p.id)}">${rendered[i].html}</template>`);
  templates.push(`<template data-page="${FACTS_PAGE_ID}">${factsLedgerHtml}</template>`);
  templates.push(`<template data-page="home">${homeHtml}</template>`);

  // ── The shell ───────────────────────────────────────────────────────────
  const css = readFileSync(join(HERE, 'html.css'), 'utf8');
  const clientJs = readFileSync(join(HERE, 'html.client.js'), 'utf8');
  const jsonSafe = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

  // The page carries its own strict CSP: even a bug cannot phone out.
  // Inline style and script are the ONLY things allowed, plus data: images —
  // which is precisely the shape of a self-contained file.
  const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:;">
<title>${escapeHtml(args.title)} — ${escapeHtml(args.subtitle)}</title>
<style>
:root { --accent: ${escapeHtml(args.accent)}; }
${css}
</style>
</head>
<body>
<div class="app">
  <nav class="spine-nav" id="spine-nav" aria-label="The Codex">
    <div class="brand">
      <a href="#home" class="brand-title">${escapeHtml(args.title)}</a>
      <div class="brand-sub">${escapeHtml(args.subtitle)}</div>
    </div>
    <div class="nav-search">
      <button id="search-open" class="search-hint" title="Search the whole Codex ( / )">Search… <kbd>/</kbd></button>
    </div>
    <div class="nav-links" id="nav-links"></div>
    <div class="nav-foot">
      <button id="theme-toggle" title="Cycle theme: follow the system, light, dark">theme: <span id="theme-name">auto</span></button>
      <div class="key-help">
        <kbd>/</kbd> search &nbsp;<kbd>j</kbd><kbd>k</kbd> move &nbsp;<kbd>⏎</kbd> open<br>
        <kbd>g</kbd> then <kbd>h</kbd>ome <kbd>b</kbd>rowse <kbd>l</kbd>aws <kbd>w</kbd>rits<br>
        <kbd>u</kbd>nits <kbd>k</kbd>eywords <kbd>f</kbd>acts <kbd>c</kbd>ontested <kbd>p</kbd>roposed
      </div>
      <div class="colophon">rendered ${escapeHtml(data.generated.slice(0, 10))} · ${pages.length} pages</div>
    </div>
  </nav>
  <main class="page-pane" id="page-pane">
    <article id="page-root" class="page" aria-live="polite"></article>
  </main>
</div>
<div id="search-layer" class="search-layer" hidden>
  <div class="search-box" role="dialog" aria-label="Search">
    <input id="search-input" type="search" placeholder="Search titles and text…" autocomplete="off" spellcheck="false">
    <div id="search-results" class="search-results" role="listbox"></div>
    <div class="search-foot"><kbd>↑</kbd><kbd>↓</kbd> or <kbd>j</kbd><kbd>k</kbd> move · <kbd>⏎</kbd> open · <kbd>esc</kbd> close</div>
  </div>
</div>
${templates.join('\n')}
<script type="application/json" id="codex-data">${jsonSafe(data)}</script>
<script>
${clientJs}
</script>
</body>
</html>
`;

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, doc);

  // ── The reckoning ───────────────────────────────────────────────────────
  const typeCounts = [...byType.entries()].map(([t, l]) => `${t} ${l.length}`).join(', ');
  console.log(`RENDERED  ${relative(ROOT, outPath)}  (${(doc.length / 1024).toFixed(0)} KB)`);
  console.log(`  pages   ${pages.length}${typeCounts ? `  (${typeCounts})` : ''}`);
  console.log(`  facts   ${facts.length}${existsSync(factsPath) ? '' : '  (no ledger file — tolerated)'}`);
  if (collisions.length) {
    console.log(`  note    ${collisions.length} name collision(s) — first claim held:`);
    for (const c of collisions.slice(0, 10)) console.log(`          "${c.name}" stays with ${c.held}; ${c.wanted} also answers to it`);
  }
  if (deadLinks.length) {
    console.log(`  dead    ${deadLinks.length} wikilink(s) resolve to nothing — rendered visibly dead:`);
    for (const d of deadLinks.slice(0, 20)) console.log(`          ${d.page} → [[${d.target}]]`);
    if (deadLinks.length > 20) console.log(`          …and ${deadLinks.length - 20} more`);
  }
  if (externals.length) {
    console.log(`  ext     ${externals.length} outward link(s) in prose (clickable, never loaded):`);
    for (const e of externals.slice(0, 10)) console.log(`          ${e.page} → ${e.url}`);
  }
}

main();
