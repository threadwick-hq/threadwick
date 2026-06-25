import type { ReactNode } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import './app.css';

export function Layout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" data-theme="light" className="scroll-pt-20">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body className="bg-background text-foreground font-sans antialiased">
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

// The root renders only the matched layout's outlet; marketing chrome (header/footer) lives in
// routes/marketing.tsx, and the studio runs in its own full-takeover shell (routes/studio.tsx).
export default function App() {
	return <Outlet />;
}
