// Round -> human-readable instruction line. Lifted (pure) from the studio's files.ts so the
// SSR-safe core barrel can expose it to the Follow view; the DOM helpers stay in files.ts.

import { chainOrder } from './connectivity';
import { isStart, STITCHES } from './symbols';
import type { ChartPattern } from './types';

export function summarizeRound(pattern: ChartPattern, roundId: string): string {
	const order = chainOrder(pattern.stitches, roundId).filter(
		(s) => !isStart(s.type),
	);
	if (!order.length) return '';
	const parts: string[] = [];
	let i = 0;
	while (i < order.length) {
		const t = order[i]!.type;
		let n = 1;
		while (i + n < order.length && order[i + n]!.type === t) n++;
		const abbr = (STITCHES[t] && STITCHES[t].abbr) || t;
		parts.push(t === 'ch' && n > 1 ? `ch ${n}` : n > 1 ? `${n} ${abbr}` : abbr);
		i += n;
	}
	return parts.join(', ');
}
