export type WorkflowStatus = 'active' | 'inactive' | 'error' | 'disabled';

export interface WorkflowTrend {
  timestamp: Date;
  eventCount: number;
}

export interface WorkflowStats {
  status: WorkflowStatus;
  trend: WorkflowTrend[];
  lastEventAt: Date | null;
  eventsToday: number;
  totalEvents: number;
  hourlyAverage: number;
} 