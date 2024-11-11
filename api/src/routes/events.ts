import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import drizzle from '~drizzle';
import { events } from '~drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { Workflow } from '~drizzle/models/workflows';
import { Project } from '~drizzle/models/projects';
import { serviceManager } from '../services/service-manager';
import { logger } from "~utils/logger";
import { EventQueueManager } from '../services/event-queue-manager';

const eventQueue = new EventQueueManager();

const Events = new Hono<{
  Variables: {
    workflow: Workflow;
    project: Project;
    events: Event[];
    isApiKeyAuth: boolean;
    workflowName: string;
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

Events.get('/', async (c) => {
  const events = c.get('events');
  return c.json({ events }, 200);
});

// Create/Update event
Events.post(
  '/',
  zValidator('json', eventSchema),
  async (c) => {
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
      logger.error('Error processing event:', error);
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

export { Events }; 