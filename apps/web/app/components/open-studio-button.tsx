import { Button, type ButtonProps } from '@threadwick/core/components';
import { Icon } from '@threadwick/icons';

/** The primary call to action → the Studio editor (internal `/studio` route). Reused across the page. */
export function OpenStudioButton({
	children = 'Open Studio',
	...rest
}: ButtonProps) {
	return (
		<Button asChild size="lg" {...rest}>
			<a href="/studio">
				{children}
				<Icon name="next" label="" />
			</a>
		</Button>
	);
}
