import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge class names with Tailwind conflict resolution — shadcn/ui's standard helper. */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
