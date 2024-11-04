import { Hono, Context, Next } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import drizzle from '~drizzle';
import { events, workflows } from '~drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { Workflow } from '~drizzle/models/workflows';
import { Project } from '~drizzle/models/projects';
import { serviceManager } from '../services/service-manager';

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
      console.error(`Error processing event in queue ${queueKey}:`, error);
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
    const workflow = c.get('workflow');
  
    try {
      return c.json({ workflow },200);
    } catch (error) {
      console.error('Error fetching workflow:', error);
      return c.json({ error: 'Failed to fetch workflow' }, 500);
    }
  }
);

// List Workflows
workflow.get('/', async (c) => {
  try {
    const project = c.get("project");
      
    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }

    const projectWorkflows = await drizzle.query.workflows.findMany({
      where: eq(workflows.projectId, project.id),
    });

    return c.json({ projectWorkflows }, 200);

  } catch (error) {
    console.error("Error fetching workflows:", error);
    return c.json({ error: "Failed to fetch workflows" }, 500);
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
      console.error('Error updating workflow:', error);
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
    console.error('Error deleting workflow:', error);
    return c.json({ error: 'Failed to delete workflow' }, 500);
  }
});

workflow.post(
  '/:workflowName/events',
  zValidator('json', eventSchema),
  zValidator('param', z.object({
    workflowName: z.string().min(1),
  })),
  async (c) => {
    const { workflowName } = c.req.valid('param');
    const workflow = c.get('workflow');
    const project = c.get('project');
    const eventData = c.req.valid('json');
    const queueKey = `${project.id}:${workflow.id}`;


    try {
      return await eventQueue.enqueue(queueKey, async () => {
        let event = await drizzle.query.events.findFirst({
          where: and(
            eq(events.name, eventData.event),
            eq(events.workflowId, workflow.id)
          ),
        });

        if (event && JSON.stringify(event.payload) === JSON.stringify(eventData.payload)) {
          await drizzle
            .update(events)
            .set({ count: event.count + 1 })
            .where(eq(events.id, event.id));
        } else {
          [event] = await drizzle
            .insert(events)
            .values({
              name: eventData.event,
              workflowId: workflow.id,
              config: eventData.config,
              payload: eventData.payload,
              services: eventData.services,
            })
            .returning();
        }

        if (eventData.services.length > 0) {
          const serviceMessage = {
            projectId: project.id,
            workflowName: workflow.name,
            eventName: eventData.event,
            description: eventData.config.description,
            tags: eventData.config.tags,
            severity: eventData.config.severity,
            payload: eventData.payload,
            timestamp: new Date(),
            nextEvent: eventData.nextEvent,
          };

          await serviceManager.notify(eventData.services, serviceMessage);
        }

        return c.json({ 
          success: true, 
          message: 'Event Emitted successfully',
          event: event.id 
        }, 200);
      });
    } catch (error) {
      console.error('Error processing event:', error);
      return c.json(
        {
          error: 'Failed to process event',
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  }
);

export default workflow;
