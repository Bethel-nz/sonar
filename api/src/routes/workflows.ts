import { Hono, Context, Next } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import drizzle from '~drizzle';
import { events, workflows } from '~drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { Workflow } from '~drizzle/models/workflows';
import { Project } from '~drizzle/models/projects';
import { getRedisClient } from '~utils/redis';
import { serviceManager } from '../services/service-manager';

// Create an event queue manager
class EventQueueManager {
  private queues: Map<string, Promise<any>>;

  constructor() {
    this.queues = new Map();
  }

  async enqueue(queueKey: string, task: () => Promise<any>): Promise<any> {
    // Get the current queue for this workflow or create a new one
    const currentQueue = this.queues.get(queueKey) || Promise.resolve();

    // Create a new promise that waits for the previous task and then executes the new one
    const newQueue = currentQueue.then(task).catch(error => {
      console.error(`Error processing event in queue ${queueKey}:`, error);
      throw error;
    }).finally(() => {
      // If this was the last task in the queue, clean up
      if (this.queues.get(queueKey) === newQueue) {
        this.queues.delete(queueKey);
      }
    });

    // Update the queue
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
    const redis = await getRedisClient();

    // Update cache
    await redis.set(
      `workflow:${workflow.projectId}:${workflow.name}`,
      JSON.stringify(workflow)
    );

    return c.json({ workflow });
  }
);

// List Workflows
workflow.get('/', async (c) => {
  try {
    const project = c.get("project");
    
    // Check if project exists
    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }

    const redis = await getRedisClient();
    
    // Get cached workflows for this project
    const cachedWorkflows = await redis.get(`project:${project.id}:workflows`);
    
    if (cachedWorkflows) {
      return c.json({ projectWorkflows: JSON.parse(cachedWorkflows) });
    }

    // If no cached data, return empty array
    return c.json({ projectWorkflows: [] });

  } catch (error) {
    console.error("Error fetching workflows:", error);
    return c.json({ error: "Failed to fetch workflows" }, 500);
  }
});

// Update Workflow
workflow.put(
  '/:workflowName',
  zValidator(
    'json',
    z.object({
      name: z.string().min(1).max(255),
    })
  ),
  async (c) => {
    const workflow = c.get('workflow');
    const { name } = c.req.valid('json');
    const redis = await getRedisClient();

    try {
      const updatedWorkflow = await drizzle
        .update(workflows)
        .set({ name, updatedAt: new Date() })
        .where(eq(workflows.id, workflow.id))
        .returning();

      // Update the workflow in Redis
      await redis.set(
        `workflow:${workflow.projectId}:${workflow.name}`,
        JSON.stringify(updatedWorkflow[0])
      );

      // Invalidate the project's workflows cache
      await redis.del(`project:${workflow.projectId}:workflows`);

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

workflow.delete('/:workflowName', async (c) => {
  const workflow = c.get('workflow');
  const redis = await getRedisClient();

  try {
    await drizzle.delete(workflows).where(eq(workflows.id, workflow.id));

    // Remove the workflow from Redis
    await redis.del(`workflow:${workflow.projectId}:${workflow.name}`);

    // Invalidate the project's workflows cache
    await redis.del(`project:${workflow.projectId}:workflows`);

    return c.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return c.json({ error: 'Failed to delete workflow' }, 500);
  }
});

workflow.post(
  '/:workflowName/events',
  zValidator('json', eventSchema),
  async (c) => {
    const workflow = c.get('workflow');
    const project = c.get('project');
    const eventData = c.req.valid('json');
    const queueKey = `${project.id}:${workflow.id}`;

    console.log('📨 Received event:', {
      workflow: workflow.name,
      event: eventData.event,
      services: eventData.services
    });

    try {
      // Process event in queue
      return await eventQueue.enqueue(queueKey, async () => {
        let event = await drizzle.query.events.findFirst({
          where: and(
            eq(events.name, eventData.event),
            eq(events.workflowId, workflow.id)
          ),
        });

        // Handle event storage
        if (event && JSON.stringify(event.payload) === JSON.stringify(eventData.payload)) {
          console.log('📝 Updating existing event count:', eventData.event);
          await drizzle
            .update(events)
            .set({ count: event.count + 1 })
            .where(eq(events.id, event.id));
        } else {
          console.log('✨ Creating new event:', eventData.event);
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
            severity: eventData.config.severity,
            payload: eventData.payload,
            timestamp: new Date(),
            nextEvent: eventData.nextEvent,
          };

          console.log('📤 Sending to services:', eventData.services);
          // Wait for service notifications to complete
          await serviceManager.notify(eventData.services, serviceMessage);
        }

        return c.json({ 
          success: true, 
          message: 'Event Emitted successfully',
          event: event.id 
        });
      });
    } catch (error) {
      console.error('❌ Error processing event:', error);
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

workflow.post('/events', zValidator('json', eventSchema), async (c) => {
  const workflow = c.get('workflow');
  const project = c.get('project');
  const body = await c.req.valid('json');
  const queueKey = `${project.id}:${workflow.id}`;

  try {
    return await eventQueue.enqueue(queueKey, async () => {
      // Create event record
      const [event] = await drizzle
        .insert(events)
        .values({
          name: body.event,
          workflowId: workflow.id,
          config: body.config,
          payload: body.payload,
          services: body.services,
          nextEvent: body.nextEvent,
        })
        .returning();

      // Send notifications through configured services
      await serviceManager.notify(body.services, {
        projectId: project.id,
        workflowName: workflow.name,
        eventName: body.event,
        description: body.config.description,
        severity: body.config.severity,
        payload: body.payload,
        timestamp: new Date(),
        nextEvent: body.nextEvent,
      });

      return c.json({ success: true, event });
    });
  } catch (error) {
    console.error('Error processing event:', error);
    return c.json({ error: 'Failed to process event' }, 500);
  }
});

export default workflow;
