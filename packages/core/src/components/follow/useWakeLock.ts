import { useCallback, useEffect, useRef, useState } from 'react';

type WakeLockSentinel = {
	release: () => Promise<void>;
	addEventListener: (
		type: 'release',
		listener: () => void,
		options?: boolean | AddEventListenerOptions,
	) => void;
};

type WakeLockNavigator = Navigator & {
	wakeLock?: {
		request: (type: 'screen') => Promise<WakeLockSentinel>;
	};
};

/** Screen Wake Lock while Follow is active — re-acquires when the tab becomes visible again. */
export function useWakeLock(defaultEnabled = true) {
	const [supported] = useState(
		() =>
			typeof navigator !== 'undefined' &&
			'wakeLock' in navigator &&
			typeof (navigator as WakeLockNavigator).wakeLock?.request ===
				'function',
	);
	const [enabled, setEnabled] = useState(defaultEnabled && supported);
	const [active, setActive] = useState(false);
	const lockRef = useRef<WakeLockSentinel | null>(null);
	const enabledRef = useRef(enabled);

	useEffect(() => {
		enabledRef.current = enabled;
	}, [enabled]);

	const release = useCallback(async () => {
		if (!lockRef.current) return;
		try {
			await lockRef.current.release();
		} catch {
			// already released
		}
		lockRef.current = null;
		setActive(false);
	}, []);

	const request = useCallback(async () => {
		const nav = navigator as WakeLockNavigator;
		if (!nav.wakeLock) return false;
		try {
			await release();
			const lock = await nav.wakeLock.request('screen');
			lockRef.current = lock;
			setActive(true);
			lock.addEventListener('release', () => {
				lockRef.current = null;
				setActive(false);
			});
			return true;
		} catch {
			setActive(false);
			return false;
		}
	}, [release]);

	const setWakeLockEnabled = useCallback(
		async (next: boolean) => {
			setEnabled(next);
			if (next) await request();
			else await release();
		},
		[release, request],
	);

	useEffect(() => {
		if (!supported || !enabled) return;
		void request();
		return () => {
			void release();
		};
	}, [enabled, release, request, supported]);

	useEffect(() => {
		if (!supported) return;
		const onVisibility = () => {
			if (
				document.visibilityState === 'visible' &&
				enabledRef.current &&
				!lockRef.current
			) {
				void request();
			}
		};
		document.addEventListener('visibilitychange', onVisibility);
		return () => document.removeEventListener('visibilitychange', onVisibility);
	}, [request, supported]);

	return {
		supported,
		enabled,
		active,
		setEnabled: setWakeLockEnabled,
	};
}
