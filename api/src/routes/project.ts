import { Hono,Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { events, projects, workflows } from '~drizzle/schema';
import drizzle from '~drizzle';
import { generateProjectId, generateApiKey } from '~utils/api-key';
import { Project } from '~drizzle/models/projects';
import users, { User } from '~drizzle/models/users';

import { eq, count, desc, sql, and, gt, inArray } from 'drizzle-orm';

const createProject = async (name: string, userId: string, projectUrl: string, githubUrl: string, description: string) => {
  const projectId = generateProjectId();
  const apiKey = generateApiKey();

const project = await drizzle.transaction(async (tx) => {

    const [newProject] = await tx
      .insert(projects)
      .values({
        id: projectId,
        name,
        userId,
        apiKey,
        projectUrl,
        githubUrl,
        description,
      })
      .returning();

    await tx
      .update(users)
      .set({
        project_count: sql`project_count + 1`,
      })
      .where(eq(users.id, userId));

    return newProject;
  });



  return project;
};



const project = new Hono<{
  Variables: {
    project: Project;
    user: User;
    isApiKeyAuth: boolean;
  };
}>();

project.post(
  '/new',
  zValidator(
    'form',
    z.object({
      name: z.string().min(1).max(255),
      projectLink: z.string().url().min(1).max(255),
      githubUrl: z.string().url().min(1).max(255),
      description: z.string().min(1).max(255),
    })
  ),
  async (c) => {
    const user = c.get('user');
    const { name , projectLink, githubUrl, description} = await c.req.valid('form');

    if (
      !name ||
      typeof name !== 'string' ||
      name.length < 1 ||
      name.length > 255
    ) {
      return c.json({error: 'Invalid project name'}, 400);
    }

    if(!description) return c.json({error: "project description is required"}, 400)

    try {
      const existingProject = await drizzle.query.projects.findFirst({
        where: (projects) => 
          sql`${projects.name} = ${name} AND ${projects.userId} = ${user.id}`
      });

      if (existingProject) {
        console.error(`Name ${name} already exists for user ${user.id}`);
        return c.json({
          error: `A project with the name "${name}" already exists`
        }, 400);
      }
    
      const dbProjectCount = await drizzle
        .select({ count: count() })
        .from(projects)
        .where(eq(projects.userId, user.id));

      if (dbProjectCount[0].count >= 5) {
        console.error(`Maximum number of projects (5) reached for user ${user.id}`);
        return c.json({error: 'Maximum number of projects (5) reached'}, 400);
      }
      
      const project = await createProject(name, user.id, projectLink, githubUrl, description );

      return c.json({project}, 200);
    } catch (error) {
      console.error('Error creating project:', error);
      return c.json({error: 'Failed to create project'}, 500);
    }
  }
);

project.get(
  '/:projectId',
  zValidator(
    'param',
    z.object({
      projectId: z.string().min(1).max(255),
    })
  ),
  async (c) => {
    try {
      
      const { projectId } = c.req.valid('param');
  
      if(!projectId) return c.json({error: 'Project ID is required'}, 400);
  
      const project = await drizzle.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });
  
      if(!project) return c.json({error: `No project with id ${projectId} found`}, 404);
  
      return c.json({ project });
    } catch (error) {
      console.error('Error fetching project:', error);
      return c.json({error: 'Failed to fetch project'}, 500);
    }
  }
);

project.get('/', async (c) => {
  const user = c.get('user');

  try {
    const dbProjects = await drizzle.query.projects.findMany({
      where: eq(projects.userId, user.id),
      orderBy: [desc(projects.createdAt)],
    });

    return c.json({ 
      dbProjects,
    }, 200);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return c.json({error: 'Failed to fetch projects'}, 500);
  }
});

// Update Project
project.put(
  '/:projectId',
  zValidator(
    'form',
    z.object({
      name: z.string().min(1).max(255),
    })
  ),
  zValidator(
    'param',
    z.object({
      projectId: z.string().min(1).max(255),
    })
  ),
  async (c) => {
    const { projectId } = c.req.valid('param');
    const { name } = await c.req.valid('form');

    try {
      const project = await drizzle.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      if (!project) return c.json({error: `No project with id ${projectId} found`}, 404);

      const updatedProject = await drizzle
        .update(projects)
        .set({ name, updatedAt: new Date() })
        .where(eq(projects.id, projectId))
        .returning();

      return c.json({message: 'Project updated successfully'}, 200);
    } catch (error) {
      console.error('Error updating project:', error);
      return c.json({error: 'Failed to update project'}, 500);
    }
  }
);

// Delete Project
project.delete(
  '/:projectId',
  zValidator(
    'param',
    z.object({
      projectId: z.string().min(1).max(255),
    })
  ),
  async (c) => {
    const { projectId } = c.req.valid('param');

    if (!projectId) {
      return c.json({ error: 'Project ID is required' }, 400);
    }

    try {
      const project = await drizzle.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      if (!project) {
        return c.json({ error: 'Project not found' }, 404);
      }

      await drizzle.delete(projects).where(eq(projects.id, project.id));

      return c.json({ message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Error deleting project:', error);
      return c.json({ error: 'Failed to delete project' }, 500);
    }
  }
);

// Regenerate API Key
project.post('/:projectId/regenerate-key', zValidator(
  'param',
  z.object({
    projectId: z.string().min(1).max(255),
  })
), async (c) => {
  const { projectId } = c.req.valid('param');
  const newApiKey = generateApiKey();

  try {
    const updatedProject = await drizzle
      .update(projects)
      .set({ apiKey: newApiKey, updatedAt: new Date() })
      .where(eq(projects.id, projectId))
      .returning();


    return c.json({
      message: 'API key regenerated successfully',
      apiKey: updatedProject[0].apiKey,
    });
  } catch (error) {
    console.error('Error regenerating API key:', error);
    return c.json({ error: 'Failed to regenerate API key' }, 500);
  }
});

project.get(
  '/workflows',
  async (c) => {
    try {
      const allWorkflows = await drizzle.query.workflows.findMany();
      return c.json({ workflows: allWorkflows }, 200);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      return c.json({ error: 'Failed to fetch workflows' }, 500);
    }
  }
);

project.get(
  '/:projectId/workflows',
  zValidator(
    'param',
    z.object({
      projectId: z.string().min(1).max(255),
    })
  ),
  async (c) => {
    const { projectId } = c.req.valid('param');

    try {
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get workflows with their event counts
      const projectWorkflows = await drizzle.query.workflows.findMany({
        where: eq(workflows.projectId, projectId),
      });

      // Get event stats for each workflow
      const workflowStats = await Promise.all(
        projectWorkflows.map(async (workflow) => {
          // Get today's events count
          const todayEvents = await drizzle
            .select({ count: sql<number>`count(*)::integer` })
            .from(events)
            .where(
              and(
                eq(events.workflowId, workflow.id),
                gt(events.createdAt, today)
              )
            );

          // Get last event
          const lastEvent = await drizzle.query.events.findFirst({
            where: eq(events.workflowId, workflow.id),
            orderBy: [desc(events.createdAt)],
          });

          return {
            workflowId: workflow.id,
            eventsToday: todayEvents[0]?.count ?? 0,
            lastEventAt: lastEvent?.createdAt ?? null,
            totalEvents: await drizzle
              .select({ count: sql<number>`count(*)::integer` })
              .from(events)
              .where(eq(events.workflowId, workflow.id))
              .then(rows => rows[0]?.count ?? 0)
          };
        })
      );

      // Combine workflow data with stats
      const enrichedWorkflows = projectWorkflows.map(workflow => {
        const stats = workflowStats.find(stat => stat.workflowId === workflow.id);
        return {
          ...workflow,
          eventsToday: stats?.eventsToday || 0,
          lastEventAt: stats?.lastEventAt,
          totalEvents: stats?.totalEvents || 0,
          status: stats?.lastEventAt && isWithinLast24Hours(stats.lastEventAt) ? 'active' : 'inactive'
        };
      });

      return c.json({ projectWorkflows: enrichedWorkflows }, 200);
    } catch (error) {
      console.error('Error fetching project workflows:', error);
      return c.json({ error: 'Failed to fetch project workflows' }, 500);
    }
  }
);

// Helper function to check if date is within last 24 hours
function isWithinLast24Hours(date: Date) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return date > twentyFourHoursAgo;
}

project.get(
  '/:projectId/stats',
  zValidator(
    'param',
    z.object({
      projectId: z.string().min(1).max(255),
    })
  ),
  async (c) => {
    const { projectId } = c.req.valid('param');

    try {
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      // Get all workflows
      const allWorkflows = await drizzle.query.workflows.findMany({
        where: eq(workflows.projectId, projectId),
      });

      const workflowIds = allWorkflows.map(w => w.id);

      // Get current day's stats
      const currentStats = await drizzle
        .select({
          eventsCount: sql<number>`count(*)::integer`,
          triggeredCount: sql<number>`count(distinct ${events.workflowId})::integer`,
          activeCount: sql<number>`count(distinct case when ${events.createdAt} > now() - interval '24 hours' then ${events.workflowId} end)::integer`
        })
        .from(events)
        .where(
          and(
            inArray(events.workflowId, workflowIds),
            gt(events.createdAt, today)
          )
        );

      // Get total events (all time)
      const totalEvents = await drizzle
        .select({
          count: sql<number>`count(*)::integer`
        })
        .from(events)
        .where(inArray(events.workflowId, workflowIds));

      // Get 30-minute comparison
      const thirtyMinStats = await drizzle
        .select({
          eventsCount: sql<number>`count(*)::integer`,
          triggeredCount: sql<number>`count(distinct ${events.workflowId})::integer`,
          activeCount: sql<number>`count(distinct case when ${events.createdAt} > now() - interval '24 hours' then ${events.workflowId} end)::integer`
        })
        .from(events)
        .where(
          and(
            inArray(events.workflowId, workflowIds),
            gt(events.createdAt, thirtyMinutesAgo)
          )
        );

      // Get 1-hour comparison
      const oneHourStats = await drizzle
        .select({
          eventsCount: sql<number>`count(*)::integer`,
          triggeredCount: sql<number>`count(distinct ${events.workflowId})::integer`,
          activeCount: sql<number>`count(distinct case when ${events.createdAt} > now() - interval '24 hours' then ${events.workflowId} end)::integer`
        })
        .from(events)
        .where(
          and(
            inArray(events.workflowId, workflowIds),
            gt(events.createdAt, oneHourAgo)
          )
        );

      return c.json({
        stats: {
          current: {
            totalWorkflows: allWorkflows.length,
            totalTriggeredToday: currentStats[0]?.triggeredCount ?? 0,
            activeWorkflows: currentStats[0]?.activeCount ?? 0,
            totalEventsToday: currentStats[0]?.eventsCount ?? 0,
            totalEvents: totalEvents[0]?.count ?? 0,
          },
          comparisons: {
            thirtyMin: {
              triggeredDiff: (currentStats[0]?.triggeredCount ?? 0) - (thirtyMinStats[0]?.triggeredCount ?? 0),
              activeDiff: (currentStats[0]?.activeCount ?? 0) - (thirtyMinStats[0]?.activeCount ?? 0),
              eventsDiff: (currentStats[0]?.eventsCount ?? 0) - (thirtyMinStats[0]?.eventsCount ?? 0),
            },
            oneHour: {
              triggeredDiff: (currentStats[0]?.triggeredCount ?? 0) - (oneHourStats[0]?.triggeredCount ?? 0),
              activeDiff: (currentStats[0]?.activeCount ?? 0) - (oneHourStats[0]?.activeCount ?? 0),
              eventsDiff: (currentStats[0]?.eventsCount ?? 0) - (oneHourStats[0]?.eventsCount ?? 0),
            }
          }
        }
      });
    } catch (error) {
      console.error('Error fetching project stats:', error);
      return c.json({ error: 'Failed to fetch project stats' }, 500);
    }
  }
);

project.get(
  '/:projectId/activity',
  zValidator(
    'param',
    z.object({
      projectId: z.string().min(1).max(255),
    })
  ),
  async (c) => {
    const { projectId } = c.req.valid('param');

    try {
      // Get all workflows for this project
      const projectWorkflows = await drizzle.query.workflows.findMany({
        where: eq(workflows.projectId, projectId),
      });

      if (projectWorkflows.length === 0) {
        return c.json({ activity: [] });
      }

      // Get events for the last 24 hours, grouped by hour
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const hourlyActivity = await drizzle
        .select({
          hour: sql<string>`date_trunc('hour', ${events.createdAt})::text`,
          count: sql<number>`count(*)::integer`,
        })
        .from(events)
        .where(
          and(
            inArray(events.workflowId, projectWorkflows.map(w => w.id)),
            gt(events.createdAt, twentyFourHoursAgo)
          )
        )
        .groupBy(sql`date_trunc('hour', ${events.createdAt})`)
        .orderBy(sql`date_trunc('hour', ${events.createdAt})`);

      const activity = hourlyActivity.map(({ hour, count }) => ({
        timestamp: hour,
        workflowCount: Number(count),
      }));

      return c.json({ activity });
    } catch (error) {
      console.error('Error fetching project activity:', error);
      return c.json({ error: 'Failed to fetch project activity' }, 500);
    }
  }
);

const updateProjectSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  projectUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
});

// Add PATCH endpoint for updating project metadata
project.patch('/:projectId', zValidator('json', updateProjectSchema), async (c) => {
  try {
    const project = c.get('project');
    const body = c.req.valid('json');

    const updatedProject = await drizzle
      .update(projects)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, project.id))
      .returning()
      .then(rows => rows[0]);

    return c.json({ project: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);
    return c.json({ error: 'Failed to update project' }, 500);
  }
});

// Update GET endpoint to include new fields
project.get('/:projectId', async (c) => {
  try {
    const project = c.get('project');
    
    return c.json({
      project: {
        ...project,
        description: project.description || null,
        projectUrl: project.projectUrl || null,
        githubUrl: project.githubUrl || null,
      }
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return c.json({ error: 'Failed to fetch project' }, 500);
  }
});

export default project;
