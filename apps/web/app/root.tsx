import type { ReactNode } from 'react';
import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useRouteError,
} from 'react-router';
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

// Last-resort boundary: React Router renders it inside Layout, so document chrome survives.
// Kept dependency-free (plain elements, no store/context reads) so it cannot crash itself.
export function ErrorBoundary() {
	const error = useRouteError();
	const isResponse = isRouteErrorResponse(error);
	const isNotFound = isResponse && error.status === 404;
	const detail = isResponse
		? `${error.status} ${error.statusText}`.trim()
		: import.meta.env.DEV && error instanceof Error
			? error.message
			: undefined;
	return (
		<main className="mx-auto flex min-h-svh max-w-lg flex-col items-center justify-center gap-3 px-6 text-center">
			<h1 className="text-2xl font-medium tracking-tight">
				{isNotFound ? 'Page not found' : 'Something went wrong'}
			</h1>
			<p className="text-sm text-muted-foreground">
				{isNotFound
					? 'The page you are looking for does not exist or has moved.'
					: 'An unexpected error interrupted this page.'}
			</p>
			{detail ? (
				<p className="text-xs text-muted-foreground/80">{detail}</p>
			) : null}
			<a href="/" className="text-sm underline underline-offset-4">
				Back to the homepage
			</a>
		</main>
	);
}
