import { useSearchParams } from 'react-router';

export type PatternInteriorMode = 'view' | 'edit';

/** View mode is activated with `?view=1` on pattern interior routes (§4.4). */
export function usePatternInteriorMode(): PatternInteriorMode {
	const [searchParams] = useSearchParams();
	return searchParams.get('view') === '1' ? 'view' : 'edit';
}

export function usePatternPaidDemo(): boolean {
	const [searchParams] = useSearchParams();
	return searchParams.get('paid') === '1';
}
