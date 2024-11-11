export type WorkflowStatus = 'active' | 'inactive';

export interface Workflow {
  id: string;
  name: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  status: WorkflowStatus;
  eventsToday: number;
  lastEventAt: string | null;
  hourlyAverage: number;
  lastHourEvents: number;
  lastThirtyMinEvents: number;
  trend: Array<{ timestamp: string; eventCount: number }>;
  comparisons: {
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
  };
} 