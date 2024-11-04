import { ComponentType, RefAttributes, useLayoutEffect, useRef } from 'react';

type WithTimingProps = {
	id?: string;
	onRenderTime?: (time: number) => void;
};

/**
 * pc was slow thought it was a rendering issue
 * needed to track the time component renders
 * not sure if this is ideal but it works temporarily
 *
 * Note to self: remove when done
 *
 */
//@ts-ignore
export function withTiming<P extends object, T = any>(
	WrappedComponent: ComponentType<P>,
	options: WithTimingProps = {},
) {
	const WithTiming = (props: P) => {
		const componentName =
			options.id || WrappedComponent.displayName || WrappedComponent.name || 'Component';
		const startTimeRef = useRef<number | null>(performance.now()); // Set on initial mount
		const hasLogged = useRef(false); // To track if the initial render has been logged

		useLayoutEffect(() => {
			if (!hasLogged.current && startTimeRef.current !== null) {
				const endTime = performance.now();
				const renderTime = endTime - startTimeRef.current;
				hasLogged.current = true;

				if (options.onRenderTime) {
					options.onRenderTime(renderTime);
				}

				console.log(
					`%c[Render Timing] ${componentName} (initial): ${renderTime.toFixed(2)}ms`,
					'color: #00b4d8; font-weight: bold;',
				);
			}
		}, []);

		return <WrappedComponent {...props} />;
	};

	return WithTiming;
}

export function measureRender<P extends object, T = any>(
	Component: ComponentType<P & RefAttributes<T>>,
	onRenderComplete?: (time: number) => void,
) {
	return withTiming<P, T>(Component, {
		onRenderTime: (time) => {
			onRenderComplete?.(time);
			// Optional: send this data to an analytics service
			// analytics.track('component_render', { component: Component.name, time });
		},
	});
}
