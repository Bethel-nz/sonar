export const BREAKPOINTS = {
	MOBILE: 640,
	TABLET: 768,
	DESKTOP: 1024,
	WIDE: 1280,
} as const;

export const QUERY_KEYS = {
	projects: ['projects'] as const,
	project: ['project'] as const,
	workflows: ['workflows'] as const,
	workflow: ['workflow'] as const,
	projectStats: ['projectStats'] as const,
	projectActivity: ['projectActivity'] as const,
	workflowEvents: ['workflowEvents'] as const,
} as const;

export const REFRESH_INTERVAL = 30000; // 30 seconds in milliseconds

