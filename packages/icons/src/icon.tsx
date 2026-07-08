import { config } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type IconName, type IconSet, iconMeta } from './contract';
import { faFree } from './sets/fa-free';

// Deterministic CSS instead of runtime <style> injection: injection is
// unreliable in production/SSR bundles (this package is sideEffects:false).
// Every consuming app imports '@threadwick/icons/styles.css' once at its root.
config.autoAddCss = false;

/**
 * The active icon set. Font Awesome Free is the installable baseline; a build-time alias
 * swaps this for the Pro set when `FONTAWESOME_NPM_AUTH_TOKEN` is present.
 */
const activeSet: IconSet = faFree;

export type IconProps = {
	/** The action the icon represents (e.g. `rotate-stitch-right`) — never a glyph name. */
	name: IconName;
	/** Accessible name. Defaults to the action's label; pass `''` for a decorative icon. */
	label?: string;
	className?: string;
};

/** Renders the glyph the active set maps to `name`, labelled for assistive tech by default. */
export function Icon({ name, label, className }: IconProps) {
	const glyph = activeSet.resolve(name);
	if (label === '') {
		return (
			<FontAwesomeIcon icon={glyph} className={className} aria-hidden={true} />
		);
	}
	return (
		<FontAwesomeIcon
			icon={glyph}
			className={className}
			role="img"
			aria-hidden={false}
			aria-label={label ?? iconMeta[name].label}
		/>
	);
}
