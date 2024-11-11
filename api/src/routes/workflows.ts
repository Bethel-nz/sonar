import { Hono, Context, Next } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import drizzle from '~drizzle';
import { events, workflows } from '~drizzle/schema';
import { eq, and, desc, inArray, gt, sql } from 'drizzle-orm';
import { Workflow } from '~drizzle/models/workflows';
import { Project } from '~drizzle/models/projects';
import { serviceManager } from '../services/service-manager';
import { WorkflowStatus } from '~src/types/workflow';
import {logger} from "~utils/logger"

// Create an event queue manager
//since we arent using redis, we create an event queue manager to queue events then process them one by one
class EventQueueManager {
  private queues: Map<string, Promise<any>>;

  constructor() {
    this.queues = new Map();
  }

    async enqueue(queueKey: string, task: () => Promise<any>): Promise<any> {
    const currentQueue = this.queues.get(queueKey) || Promise.resolve();

    const newQueue = currentQueue.then(task).catch(error => {
      logger.error(`Error processing event in queue ${queueKey}:`, error);
      throw error;
    }).finally(() => {
      if (this.queues.get(queueKey) === newQueue) {
        this.queues.delete(queueKey);
      }
    });

    this.queues.set(queueKey, newQueue);
    return newQueue;
  }
}

interface TrendData {
  timestamp: string;
  eventCount: number;
}

type TrendMap = Record<string, TrendData[]>;

const eventQueue = new EventQueueManager();

const workflow = new Hono<{
  Variables: {
    workflow: Workflow;
    project: Project;
    isApiKeyAuth: boolean;
  };
}>();

// Validate event payload
const eventSchema = z
  .object({
    event: z.string(),
    config: z
      .object({
        description: z.string(),
        severity: z.enum(['info', 'warn', 'error', 'critical']),
        tags: z.array(z.string()),
      })
      .strict(),
    payload: z.record(z.unknown()),
    services: z.array(z.string()),
    nextEvent: z.string().nullable(),
  })
  .strict();

workflow.get(
  '/:workflowName',
  zValidator('param', z.object({
    workflowName: z.string().min(1),
  })),
  async (c) => {
    const project = c.get('project');
    const { workflowName } = c.req.valid("param");

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const workflow = await drizzle.query.workflows.findFirst({
      where: and(
        eq(workflows.name, workflowName),
        eq(workflows.projectId, project.id)
      ),
    });

    if (!workflow) {
      return c.json({ error: 'Workflow not found' }, 404);
    }
  
    try {
      return c.json({ workflow }, 200);
    } catch (error) {
      logger.error('Error fetching workflow:', error);
      return c.json({ error: 'Failed to fetch workflow' }, 500);
    }
  }
);

// List Workflows
workflow.get('/', async (c) => {
  try {
    const project = c.get("project");
      const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    
    // Debug logs
    logger.debug('Fetching workflows for project:', project.id);

    const trendQuery = sql`
      WITH hours AS (
        SELECT generate_series(
          date_trunc('hour', now()) - interval '23 hours',
          date_trunc('hour', now()),
          interval '1 hour'
        ) AS hour
      )
      SELECT 
        w.id as workflow_id,
        h.hour as timestamp,
        COALESCE(
          (
            SELECT count(*)::integer
            FROM ${events} e
            WHERE e.workflow_id = w.id
            AND date_trunc('hour', e.created_at) = h.hour
          ),
          0
        ) as event_count
      FROM hours h
      CROSS JOIN ${workflows} w
      WHERE w.project_id = ${project.id}
      ORDER BY h.hour ASC, w.id
    `;

    const trends = await drizzle.execute(trendQuery);
    
    // Debug log
    logger.debug('Raw trends data:', trends);

    const trendsMap: TrendMap = {};
    trends.forEach((row: any) => {
      if (!trendsMap[row.workflow_id]) {
        trendsMap[row.workflow_id] = [];
      }
      trendsMap[row.workflow_id].push({
        timestamp: row.timestamp,
        eventCount: Number(row.event_count)
      });
    });

    // Debug log
    logger.debug('Processed trends map:', trendsMap);

    // Update workflow stats query to include hourly comparisons
    const workflowStats = await drizzle
      .select({
        workflowId: events.workflowId,
        eventsToday: sql<number>`count(CASE WHEN ${events.createdAt} >= ${today} THEN 1 END)::integer`,
        lastEventAt: sql<string>`max(${events.createdAt})::text`,
        hourlyAverage: sql<number>`round(count(*)::numeric / 24, 2)::float`,
        lastHourEvents: sql<number>`count(CASE WHEN ${events.createdAt} >= ${oneHourAgo} THEN 1 END)::integer`,
        lastThirtyMinEvents: sql<number>`count(CASE WHEN ${events.createdAt} >= ${thirtyMinutesAgo} THEN 1 END)::integer`,
        previousHourEvents: sql<number>`count(CASE WHEN ${events.createdAt} >= ${sql`now() - interval '2 hours'`} AND ${events.createdAt} < ${oneHourAgo} THEN 1 END)::integer`,
        previousThirtyMinEvents: sql<number>`count(CASE WHEN ${events.createdAt} >= ${sql`now() - interval '1 hour'`} AND ${events.createdAt} < ${thirtyMinutesAgo} THEN 1 END)::integer`
      })
      .from(events)
      .where(
        and(
          eq(events.workflowId, workflows.id),
          gt(events.createdAt, sql`now() - interval '24 hours'`)
        )
      )
      .groupBy(events.workflowId);

    // Combine everything
    const enrichedWorkflows = await drizzle.query.workflows.findMany({
      where: eq(workflows.projectId, project.id),
      orderBy: [desc(workflows.updatedAt)],
    }).then(projectWorkflows => {
      // Calculate total stats for the project
      const totalStats = {
        currentHour: workflowStats.reduce((sum, s) => sum + (s.lastHourEvents || 0), 0),
        previousHour: workflowStats.reduce((sum, s) => sum + (s.previousHourEvents || 0), 0),
        currentThirtyMin: workflowStats.reduce((sum, s) => sum + (s.lastThirtyMinEvents || 0), 0),
        previousThirtyMin: workflowStats.reduce((sum, s) => sum + (s.previousThirtyMinEvents || 0), 0),
        activeWorkflows: projectWorkflows.filter(w => determineWorkflowStatus(
          workflowStats.find(s => s.workflowId === w.id)?.lastEventAt || null,
          workflowStats.find(s => s.workflowId === w.id)?.eventsToday || 0
        ) === 'active').length
      };

      return {
        projectWorkflows: projectWorkflows.map(workflow => {
          const stats = workflowStats.find(s => s.workflowId === workflow.id);
          const status = determineWorkflowStatus(stats?.lastEventAt || null, stats?.eventsToday || 0);

          return {
            ...workflow,
            status,
            trend: trendsMap[workflow.id] || [],
            eventsToday: stats?.eventsToday || 0,
            lastEventAt: stats?.lastEventAt || null,
            hourlyAverage: stats?.hourlyAverage || 0,
            lastHourEvents: stats?.lastHourEvents || 0,
            lastThirtyMinEvents: stats?.lastThirtyMinEvents || 0,
            comparisons: {
              oneHour: {
                eventsDiff: (stats?.lastHourEvents || 0) - (stats?.previousHourEvents || 0),
                triggeredDiff: stats?.lastHourEvents! > 0 ? 1 : 0,
                activeDiff: 0  // Will be calculated in total stats
              },
              thirtyMin: {
                eventsDiff: (stats?.lastThirtyMinEvents || 0) - (stats?.previousThirtyMinEvents || 0),
                triggeredDiff: stats?.lastThirtyMinEvents! > 0 ? 1 : 0,
                activeDiff: 0  // Will be calculated in total stats
              }
            }
          };
        }),
        stats: {
          current: {
            totalWorkflows: projectWorkflows.length,
            totalTriggeredToday: workflowStats.filter(s => s.eventsToday > 0).length,
            activeWorkflows: totalStats.activeWorkflows,
            totalEventsToday: workflowStats.reduce((sum, s) => sum + (s.eventsToday || 0), 0),
          },
          comparisons: {
            thirtyMin: {
              triggeredDiff: totalStats.currentThirtyMin - totalStats.previousThirtyMin,
              activeDiff: 0,  // You'll need to track this separately if needed
              eventsDiff: totalStats.currentThirtyMin - totalStats.previousThirtyMin
            },
            oneHour: {
              triggeredDiff: totalStats.currentHour - totalStats.previousHour,
              activeDiff: 0,  // You'll need to track this separately if needed
              eventsDiff: totalStats.currentHour - totalStats.previousHour
            }
          }
        }
      };
    });

    return c.json(enrichedWorkflows);
  } catch (error) {
    logger.error('Error fetching workflows:', error);
    return c.json({ error: 'Failed to fetch workflows' }, 500);
  }
});

function determineWorkflowStatus(lastEventAt: string | null, eventsToday: number): WorkflowStatus {
  if (!lastEventAt) return 'inactive';
  
  const lastEventDate = new Date(lastEventAt);
  const hoursSinceLastEvent = (Date.now() - lastEventDate.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceLastEvent <= 1) return 'active';
  if (hoursSinceLastEvent <= 24) return eventsToday > 0 ? 'active' : 'inactive';
  return 'inactive';
}

workflow.delete('/:workflowName', zValidator('param', z.object({
  workflowName: z.string().min(1),
})), async (c) => {
  const {workflowName} = c.req.valid('param');
  const workflow = c.get('workflow');

  try {
    if (!workflow) return c.json({ error: 'Workflow not found' }, 404);

    await drizzle.delete(workflows).where(and(eq(workflows.id, workflow.id), eq(workflows.name, workflowName)));

    return c.json({ message: 'Workflow deleted successfully' }, 200 );
  } catch (error) {
    logger.error('Error deleting workflow:', error);
    return c.json({ error: 'Failed to delete workflow' }, 500);
  }
});




// Update Workflow
workflow.put(
  '/:workflowName',
  zValidator(
    'form',
    z.object({
      name: z.string().min(1).max(255),
    })
  ),
  async (c) => {
    const workflow = c.get('workflow');
    const { name } = c.req.valid('form');
 
    try {
      const updatedWorkflow = await drizzle
        .update(workflows)
        .set({ name, updatedAt: new Date() })
        .where(eq(workflows.id, workflow.id))
        .returning();


      return c.json({
        message: 'Workflow updated successfully',
        workflow: updatedWorkflow[0],
      });
    } catch (error) {
      logger.error('Error updating workflow:', error);
      return c.json({ error: 'Failed to update workflow' }, 500);
    }
  }
);

workflow.delete('/:workflowName', zValidator('param', z.object({
  workflowName: z.string().min(1),
})), async (c) => {
  const {workflowName} = c.req.valid('param');
  const workflow = c.get('workflow');

  try {
    if (!workflow) return c.json({ error: 'Workflow not found' }, 404);

    await drizzle.delete(workflows).where(and(eq(workflows.id, workflow.id), eq(workflows.name, workflowName)));

    return c.json({ message: 'Workflow deleted successfully' }, 200 );
  } catch (error) {
    logger.error('Error deleting workflow:', error);
    return c.json({ error: 'Failed to delete workflow' }, 500);
  }
});



export default workflow;
