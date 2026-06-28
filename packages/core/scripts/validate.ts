/**
 * validate.ts — conformance checker (the gate agents loop against). Returns violations:
 *   • non-token-colour — a raw #hex where a --tw-* token belongs
 *   • off-grid         — a px value off the 8-px grid in a CSS spacing declaration
 *   • missing-aria     — an SVG role="img" with no accessible name
 *   • contrast-aa      — a token text/UI pair below WCAG AA (audits tokens.json if present)
 *
 * Usage: tsx scripts/validate.ts [paths...] [--json] [--warn]
 *   default paths: src   (core's own token source is exempt). Type/font sizes are intentionally
 *   off-grid, so the off-grid check is scoped to spacing properties in CSS only.
 * Exits non-zero on any violation unless --warn.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { auditContrast } from './contrast';

interface Violation {
	file: string;
	line: number;
	rule: string;
	detail: string;
}

const ALLOWED_PX = new Set([
	0, 1, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 44, 48, 64, 80, 96, 264, 1120,
]);
const SPACING_PROP =
	/(margin|padding|gap|inset|top|right|bottom|left|width|height|translate)/i;
const EXCLUDE = /(node_modules|dist|\.d\.ts$|[\\/]tokens[\\/]|\.test\.)/;

const rawArgs = process.argv.slice(2);
const flags = new Set(rawArgs.filter((a) => a.startsWith('-')));
const paths = rawArgs.filter((a) => !a.startsWith('-'));
const targets = paths.length ? paths : ['src'];

function walk(p: string, out: string[]): void {
	if (EXCLUDE.test(p)) return;
	try {
		const st = statSync(p);
		if (st.isDirectory()) {
			for (const e of readdirSync(p)) walk(join(p, e), out);
		} else if (['.ts', '.tsx', '.css'].includes(extname(p))) {
			out.push(p);
		}
	} catch {
		/* unreadable path — skip */
	}
}

const files: string[] = [];
for (const t of targets) walk(t, files);

const violations: Violation[] = [];
for (const file of files) {
	const isCss = extname(file) === '.css';
	const content = readFileSync(file, 'utf8');
	const lines = content.split('\n');

	lines.forEach((line, i) => {
		const ln = i + 1;
		for (const h of line.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []) {
			violations.push({
				file,
				line: ln,
				rule: 'non-token-colour',
				detail: `raw hex ${h} — use a --tw-* token`,
			});
		}
		if (isCss && SPACING_PROP.test(line)) {
			for (const px of line.match(/\d+px/g) ?? []) {
				const n = parseInt(px, 10);
				if (!ALLOWED_PX.has(n)) {
					violations.push({
						file,
						line: ln,
						rule: 'off-grid',
						detail: `${px} is off the 8-px grid — use a space token`,
					});
				}
			}
		}
	});

	// SVG accessible-name check across the whole file (tags often span lines).
	const re = /role=["']img["']/g;
	let match = re.exec(content);
	while (match !== null) {
		const m = match;
		const win = content.slice(Math.max(0, m.index - 260), m.index + 260);
		if (!/aria-label|aria-labelledby|aria-hidden|<title/.test(win)) {
			const ln = content.slice(0, m.index).split('\n').length;
			violations.push({
				file,
				line: ln,
				rule: 'missing-aria',
				detail:
					'role="img" without an accessible name (aria-label / aria-labelledby / <title>)',
			});
		}
		match = re.exec(content);
	}
}

// Token contrast (AA) — audits the colour values themselves, not just their usage.
const tokensJson = join(process.cwd(), 'src/tokens/tokens.json');
if (existsSync(tokensJson)) {
	for (const r of auditContrast(tokensJson)) {
		if (!r.pass) {
			violations.push({
				file: 'src/tokens/tokens.json',
				line: 0,
				rule: 'contrast-aa',
				detail: `${r.mode} ${r.fg}/${r.bg} ${r.value.toFixed(2)}:1 < ${r.min}:1 (${r.note})`,
			});
		}
	}
}

if (flags.has('--json')) {
	console.log(
		JSON.stringify({ scanned: files.length, targets, violations }, null, 2),
	);
} else {
	console.log(
		`validate: scanned ${files.length} file(s) in ${targets.join(', ')} + token contrast`,
	);
	for (const v of violations)
		console.log(`  ${v.file}:${v.line}  [${v.rule}] ${v.detail}`);
	console.log(
		violations.length === 0
			? '  ✓ no violations'
			: `  ✗ ${violations.length} violation(s)`,
	);
}

process.exit(violations.length > 0 && !flags.has('--warn') ? 1 : 0);
