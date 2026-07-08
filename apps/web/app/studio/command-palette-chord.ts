/**
 * Whether a keyboard event is the command-palette chord: Cmd+K on macOS, Ctrl+K
 * elsewhere. A `Pick` of the fields we read keeps this testable without a DOM
 * `KeyboardEvent` and pure — no listener side effects live here.
 *
 * @param event - The subset of `KeyboardEvent` the chord check needs.
 * @returns `true` when the event is an unhandled Cmd/Ctrl+K press.
 */
export function matchesCommandPaletteChord(
	event: Pick<
		KeyboardEvent,
		'metaKey' | 'ctrlKey' | 'key' | 'defaultPrevented'
	>,
): boolean {
	if (event.defaultPrevented) return false;
	if (!event.metaKey && !event.ctrlKey) return false;
	return event.key.toLowerCase() === 'k';
}
