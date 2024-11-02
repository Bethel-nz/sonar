import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { projects, workflows } from '~drizzle/schema';
import drizzle from '~drizzle';
import { generateProjectId, generateApiKey } from '~utils/api-key';
import { Project } from '~drizzle/models/projects';
import users, { User } from '~drizzle/models/users';

import { eq, count, desc, sql } from 'drizzle-orm';

const createProject = async (name: string, userId: string) => {
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


    if (
      !name ||
      typeof name !== 'string' ||
      name.length < 1 ||
      name.length > 255
    ) {
      return c.json({error: 'Invalid project name'}, 400);
    }

    try {
    
        const dbProjectCount = await drizzle
          .select({ count: count() })
          .from(projects)
          .where(eq(projects.userId, user.id));

        if (dbProjectCount[0].count >= 3) return c.json({error: 'Maximum number of projects (3) reached'}, 400);
      

      const project = await createProject(name, user.id);


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
      projects: dbProjects,
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
