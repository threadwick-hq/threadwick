/**
 * check-contrast.ts — fail-closed WCAG 2.1 gate. Asserts every key text / UI pair clears
 * AA in BOTH modes, converting the OKLCH source (src/tokens/tokens.json) to sRGB.
 * Exits non-zero on any failure. Run: `npm run check:contrast`. (Shared math: ./contrast.ts.)
 */
import { join } from 'node:path';
import { auditContrast } from './contrast';

const rows = auditContrast(join(process.cwd(), 'src/tokens/tokens.json'));
let failed = 0;
const out = rows.map((r) => {
	if (!r.pass) failed++;
	return `  ${r.pass ? 'PASS' : 'FAIL'}  ${r.mode.padEnd(5)}  ${`${r.fg}/${r.bg}`.padEnd(26)} ${r.value
		.toFixed(2)
		.padStart(6)}:1  (>=${r.min})  ${r.note}`;
});

console.log('WCAG 2.1 contrast — OKLCH source converted to sRGB:\n');
console.log(out.join('\n'));
console.log(
	`\n${failed === 0 ? '✓ All pairs pass AA.' : `✗ ${failed} pair(s) below threshold.`}`,
);
process.exit(failed === 0 ? 0 : 1);
