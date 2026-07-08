import { deriveRecents, type RecentsModel } from '@threadwick/editor';
import { usePatternLibrary } from './pattern-store';
import { useStudioStore } from './studio-store';

/**
 * The Home "Continue" read model over the two top-level collections
 * (workbench patterns + makes), re-derived on any change to either store.
 *
 * @returns the recents model, or `null` until the studio store hydrates
 */
export function useRecents(shelfSize?: number): RecentsModel | null {
	const patterns = usePatternLibrary();
	const store = useStudioStore();
	if (!store) return null;
	return deriveRecents(patterns, store.state.library.projects, { shelfSize });
}
