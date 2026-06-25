import { Outlet } from 'react-router';
import { Footer } from '../components/footer';
import { Header } from '../components/header';

/** Marketing layout: the public site chrome (header + footer) around the streaming-SSR routes. */
export default function MarketingLayout() {
	return (
		<>
			<a
				href="#main"
				className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
			>
				Skip to content
			</a>
			<Header />
			<main id="main">
				<Outlet />
			</main>
			<Footer />
		</>
	);
}
