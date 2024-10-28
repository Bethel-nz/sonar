import drizzle from '~drizzle';
import { workflows, events } from '~drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { Workflow } from '~drizzle/models/workflows';
import { Project } from '~drizzle/models/projects';
import { Event } from '~drizzle/models/events';
import { createMiddleware } from 'hono/factory';
import { getRedisClient } from '~utils/redis';
import { CACHE_EXPIRY } from '~utils/constants';

const workflowMiddleware = createMiddleware<{
  Variables: {
    workflow: Workflow;
    project: Project;
    events: Event[];
    isApiKeyAuth: boolean;
	workflowName:string
  };
}>(async (c, next) => {

  const workflowName = c.get('workflowName');
  const project = c.get('project');
  const isApiKeyAuth = c.get('isApiKeyAuth');
  const redis = await getRedisClient();

  if (!workflowName) {
    return c.json({ error: 'Workflow name is required' }, 400);
  }

  // Try to get workflow from Redis
  const cachedWorkflow = await redis.get(
    `workflow:${project.id}:${workflowName}`
  );
  let workflow = cachedWorkflow ? JSON.parse(cachedWorkflow) : null;

  if (!workflow) {
    workflow = await drizzle.query.workflows.findFirst({
      where: and(
        eq(workflows.name, workflowName),
        eq(workflows.projectId, project.id)
      ),
    });
    console.log(workflowName, workflow, cachedWorkflow);

    if (workflow) {
      await redis.set(
        `workflow:${project.id}:${workflowName}`,
        JSON.stringify(workflow)
      );
    }
  }

  if (!workflow && isApiKeyAuth) {
    try {
      workflow = await drizzle
        .insert(workflows)
        .values({
          name: workflowName,
          projectId: project.id,
        })
        .returning()
        .then((rows) => rows[0]);

      // Cache the new workflow in Redis
      await redis.set(
        `workflow:${project.id}:${workflowName}`,
        JSON.stringify(workflow),
        {
          EX: CACHE_EXPIRY,
        }
      );
    } catch (error) {
      console.error('Error creating workflow:', error);
      return c.json({ error: 'Failed to create workflow' }, 500);
    }
  } else if (!workflow) {
    return c.json({ error: 'Workflow not found' }, 404);
  }

  if (workflow) {
    c.set('workflow', workflow);
    const AllEvents = await drizzle.query.events.findMany({
      where: eq(events.workflowId, workflow.id),
      orderBy: [desc(events.createdAt)],
    });
    c.set('events', AllEvents);
  }

  await next();
});

export default workflowMiddleware;