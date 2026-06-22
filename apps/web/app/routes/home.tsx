import { AccountBand } from '../components/account-band';
import { Features } from '../components/features';
import { Hero } from '../components/hero';
import { HowItWorks } from '../components/how-it-works';
import { OurPromise } from '../components/promise';

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
	return (
		<>
			<Hero />
			<OurPromise />
			<HowItWorks />
			<Features />
			<AccountBand />
		</>
	);
}
