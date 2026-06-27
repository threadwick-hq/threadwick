import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';

/** TW-025 contract: interiors register chrome; StudioShell swaps the craft-picker slot 1:1. */
export type InteriorChrome = {
	identityTile: ReactNode;
	breadcrumb: ReactNode;
	rail: ReactNode;
	pinnedTile: ReactNode;
};

type InteriorChromeContextValue = {
	chrome: InteriorChrome | null;
	setChrome: (chrome: InteriorChrome | null) => void;
};

const InteriorChromeContext = createContext<InteriorChromeContextValue | null>(null);

export function InteriorChromeProvider({ children }: { children: ReactNode }) {
	const [chrome, setChrome] = useState<InteriorChrome | null>(null);
	const value = useMemo(() => ({ chrome, setChrome }), [chrome]);
	return (
		<InteriorChromeContext.Provider value={value}>{children}</InteriorChromeContext.Provider>
	);
}

export function useInteriorChrome() {
	return useContext(InteriorChromeContext)?.chrome ?? null;
}

/** Mount interior chrome for the lifetime of a drill-in surface. */
export function InteriorChromeSlot({ chrome }: { chrome: InteriorChrome }) {
	const ctx = useContext(InteriorChromeContext);
	useEffect(() => {
		if (!ctx) return;
		ctx.setChrome(chrome);
		return () => ctx.setChrome(null);
	}, [ctx, chrome]);
	return null;
}
