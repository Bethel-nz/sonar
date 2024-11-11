import { useEffect, useState } from 'react';

export function useIsMobile(breakpoint: number = 768) {
	const [isMobile, setIsMobile] = useState(
		typeof window !== 'undefined' ? window.innerWidth < breakpoint : false,
	);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const handleResize = () => {
			setIsMobile(window.innerWidth < breakpoint);
		};

		window.addEventListener('resize', handleResize);

		// Initial check
		handleResize();

		return () => window.removeEventListener('resize', handleResize);
	}, [breakpoint]);

	return isMobile;
}
