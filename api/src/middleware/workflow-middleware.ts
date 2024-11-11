import drizzle from '~drizzle';
import { workflows, events } from '~drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { Workflow } from '~drizzle/models/workflows';
import { Project } from '~drizzle/models/projects';
import { Event } from '~drizzle/models/events';
import { createMiddleware } from 'hono/factory';
import { getRouteParams } from '~utils/routeMatcher';

const workflowMiddleware = createMiddleware<{
  Variables: {
    workflow: Workflow;
    project: Project;
    events: Event[];
    isApiKeyAuth: boolean;
    workflowName: string;
  };
}>(async (c, next) => {
  const {workflowName} = getRouteParams(c.req.path)
  const project = await c.get('project') as Project;
  const isApiKeyAuth = c.get('isApiKeyAuth');

  console.log({
    context: 'workflow-middleware',
    workflowName,
    projectId: project.id,
    projectName: project.name
  });

  if (!workflowName) {
    return c.json({ error: 'Workflow name is required' }, 400);
  }

  // Find existing workflow
  const existingWorkflow = await drizzle.query.workflows.findFirst({
    where: and(
      eq(workflows.name, workflowName),
      eq(workflows.projectId, project.id)
    ),
  });

  let workflow: Workflow;

  if (!existingWorkflow && isApiKeyAuth) {
    try {
      workflow = await drizzle
        .insert(workflows)
        .values({
          name: workflowName,
          projectId: project.id,
        })
        .returning()
        .then((rows) => rows[0]);
    } catch (error) {
      console.error('Error creating workflow:', error);
      return c.json({ error: 'Failed to create workflow' }, 500);
    }
  } else if (!existingWorkflow) {
    return c.json({ error: 'Workflow not found' }, 404);
  } else {
    workflow = existingWorkflow;
  }

  c.set('workflow', workflow);
  const AllEvents = await drizzle.query.events.findMany({
    where: eq(events.workflowId, workflow.id),
    orderBy: [desc(events.createdAt)],
  });
  c.set('events', AllEvents);

  await next();
});

export default workflowMiddleware;