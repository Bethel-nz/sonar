import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { projects, workflows } from '~drizzle/schema';
import drizzle from '~drizzle';
import { generateProjectId, generateApiKey } from '~utils/api-key';
import { Project } from '~drizzle/models/projects';
import { User } from '~drizzle/models/users';
import { eq, count, desc } from 'drizzle-orm';
import { getRedisClient } from '~utils/redis';
import { CACHE_EXPIRY } from '~utils/constants';


// Create Project with custom ID
const createProject = async (name: string, userId: string) => {
  const projectId = generateProjectId();
  const apiKey = generateApiKey();
  const redis = await getRedisClient();

  const project = await drizzle
    .insert(projects)
    .values({
      id: projectId,
      name,
      userId,
      apiKey,
    })
    .returning();

  // Cache the new project in Redis
  await redis.set(`project:${projectId}`, JSON.stringify(project[0]), {
    EX: CACHE_EXPIRY,
  });

  return project[0];
};

// Function to handle cache invalidation
async function invalidateProjectCache(userId: string, projectId: string) {
  const redis = await getRedisClient();
  await Promise.all([
    redis.del(`project:${projectId}`),
    redis.del(`user:${userId}:projects`),
    redis.del(`user:${userId}:projectCount`),
  ]);
}

const project = new Hono<{
  Variables: {
    project: Project;
    user: User;
    isApiKeyAuth: boolean;
  };
}>();

project.post(
  '/',
  zValidator(
    'form',
    z.object({
      name: z.string().min(1).max(255),
    })
  ),
  async (c) => {
    const user = c.get('user');
    const { name } = await c.req.valid('form');

    console.log('Project route', 'HIT', 'GOT', name);

    if (
      !name ||
      typeof name !== 'string' ||
      name.length < 1 ||
      name.length > 255
    ) {
      return c.redirect(
        '/projects?error=' + encodeURIComponent('Invalid project name')
      );
    }

    const redis = await getRedisClient();

    try {
      // Check the number of existing projects from Redis
      const projectCount = await redis.get(`user:${user.id}:projectCount`);

      if (projectCount && parseInt(projectCount) >= 3) {
        return c.redirect(
          '/projects?error=' +
            encodeURIComponent('Maximum number of projects (3) reached')
        );
      }

      if (!projectCount) {
        const dbProjectCount = await drizzle
          .select({ count: count() })
          .from(projects)
          .where(eq(projects.userId, user.id));

        if (dbProjectCount[0].count >= 3) {
          return c.redirect(
            '/projects?error=' +
              encodeURIComponent('Maximum number of projects (3) reached')
          );
        }

        // Update Redis with the correct count
        await redis.set(
          `user:${user.id}:projectCount`,
          dbProjectCount[0].count.toString()
        );
      }

      const project = await createProject(name, user.id);

      await redis.incr(`user:${user.id}:projectCount`);

      return c.redirect(`/projects`, 303);
    } catch (error) {
      console.error('Error creating project:', error);
      return c.redirect(
        '/projects?error=' + encodeURIComponent('Failed to create project')
      );
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
    const projectId = c.req.param('projectId');
    const redis = await getRedisClient();

    // Try to get the project from Redis
    const cachedProject = await redis.get(`project:${projectId}`);

    if (cachedProject) {
      return c.json({ project: JSON.parse(cachedProject) });
    }

    // If not in Redis, get from database
    const project = c.get('project');

    // Cache the project in Redis,
    await redis.set(`project:${projectId}`, JSON.stringify(project), {
      EX: CACHE_EXPIRY,
    });

    return c.json({ project });
  }
);

project.get('/', async (c) => {
  const user = c.get('user');
  const redis = await getRedisClient();

  try {
    // Try to get projects from Redis
    const cachedProjects = await redis.get(`user:${user.id}:projects`);
    
    const dbProjects = await drizzle.query.projects.findMany({
      where: eq(projects.userId, user.id),
      orderBy: [desc(projects.createdAt)],
    });

    // Update cache with latest data
    if (dbProjects.length > 0) {
      await redis.set(`user:${user.id}:projects`, JSON.stringify(dbProjects), {
        EX: CACHE_EXPIRY,
      });
    }

    // Get associated workflows for each project
    const projectWorkflows: Record<string, any> = {};
    for (const project of dbProjects) {
      const projectWorkflowsList = await drizzle.query.workflows.findMany({
        where: eq(workflows.projectId, project.id),
      });
      projectWorkflows[project.id] = projectWorkflowsList;
    }


    return c.json({ 
      projects: dbProjects,
      workflows: projectWorkflows 
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
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
  async (c) => {
    const projectId = c.req.param('projectId');
    const { name } = await c.req.valid('form');
    const redis = await getRedisClient();

    try {
      const project = await drizzle.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      if (!project) {
        return c.text('Project not found', 404);
      }

      const updatedProject = await drizzle
        .update(projects)
        .set({ name, updatedAt: new Date() })
        .where(eq(projects.id, projectId))
        .returning();

      // Update the project in Redis
      await redis.set(
        `project:${projectId}`,
        JSON.stringify(updatedProject[0]),
        {
          EX: CACHE_EXPIRY,
        }
      );

      await invalidateProjectCache(project.userId!, projectId);

      return c.text('Project updated successfully', 200);
    } catch (error) {
      console.error('Error updating project:', error);
      return c.text('Failed to update project', 500);
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

      await invalidateProjectCache(project.userId!, projectId);

      return c.json({ message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Error deleting project:', error);
      return c.json({ error: 'Failed to delete project' }, 500);
    }
  }
);

// Regenerate API Key
project.post('/:projectId/regenerate-key', async (c) => {
  const project = c.get('project');
  const newApiKey = generateApiKey();
  const redis = await getRedisClient();

  try {
    const updatedProject = await drizzle
      .update(projects)
      .set({ apiKey: newApiKey, updatedAt: new Date() })
      .where(eq(projects.id, project.id))
      .returning();

    // Update the project in Redis
    await redis.set(
      `project:${project.id}`,
      JSON.stringify(updatedProject[0]),
      { EX: CACHE_EXPIRY }
    );

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
      const projectWorkflows = await drizzle.query.workflows.findMany({
        where: eq(workflows.projectId, projectId),
      });

      return c.json({ workflows: projectWorkflows }, 200);
    } catch (error) {
      console.error('Error fetching project workflows:', error);
      return c.json({ error: 'Failed to fetch project workflows' }, 500);
    }
  }
);

export default project;
