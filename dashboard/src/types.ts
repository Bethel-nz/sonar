export interface Project {
    id: string;
    name: string;
    description?: string | null;
    projectUrl?: string | null;
    githubUrl?: string | null;
    apiKey: string;
    createdAt: string;
    updatedAt: string;
}

export type WorkflowStatus = 'active' | 'inactive';

export interface WorkflowTrend {
    timestamp: string;
    eventCount: number;
}

export interface WorkflowComparisons {
    oneHour: {
        eventsDiff: number;
        triggeredDiff: number;
        activeDiff: number;
    };
    thirtyMin: {
        eventsDiff: number;
        triggeredDiff: number;
        activeDiff: number;
    };
}

export interface Workflow {
    id: string;
    name: string;
    projectId: string;
    description?: string;
    status: WorkflowStatus;
    eventsToday: number;
    lastEventAt: string | null;
    trend: WorkflowTrend[];
    hourlyAverage: number;
    lastHourEvents: number;
    lastThirtyMinEvents: number;
    comparisons: WorkflowComparisons;
    createdAt: string;
    updatedAt: string;
}

export interface ProjectStats {
    current: {
        totalWorkflows: number;
        totalTriggeredToday: number;
        activeWorkflows: number;
        totalEventsToday: number;
        totalEvents: number;
    };
    comparisons: {
        thirtyMin: {
            triggeredDiff: number;
            activeDiff: number;
            eventsDiff: number;
        };
        oneHour: {
            triggeredDiff: number;
            activeDiff: number;
            eventsDiff: number;
        };
    };
}

export interface ProjectActivity {
    timestamp: string;
    workflowCount: number;
}

export type Event = {
    id: string;
    name: string;
    createdAt: Date | null;
    updatedAt: Date | null;
    workflowId: string | null;
    config: {
        description: string;
        severity: "info" | "critical" | "warn" | "error";
        tags: string[];
    };
    nextEvent: string | null;
    payload: unknown;
    services: string[];
    count: number;
}

export type User = {
    username: string;
    password: string;
    email: string;
    id?: string;
    project_count?: number;
    createdAt?: Date | null;
    updatedAt?: Date | null;
} 