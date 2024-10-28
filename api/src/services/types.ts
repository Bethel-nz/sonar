export interface ServiceMessage {
  projectId: string;
  workflowName: string;
  eventName: string;
  description: string;
  severity: 'info' | 'warn' | 'error' | 'critical';
  payload: Record<string, unknown>;
  timestamp: Date;
  nextEvent?: string | null;
}

export interface NotificationService {
  sendNotification(message: ServiceMessage): Promise<void>;
}
