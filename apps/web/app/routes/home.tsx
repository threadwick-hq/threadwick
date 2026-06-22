import { Hero } from '../components/hero';

export function meta() {
	return [
		{ title: 'Threadwick — a home for fiber artists' },
		{
			name: 'description',
			content:
				'A free, browser-based home for fiber artists to design, keep, and share their patterns — and for makers to follow them.',
		},
	];
}

export default function Home() {
	return <Hero />;
}
