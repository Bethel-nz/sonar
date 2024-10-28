import { createMiddleware } from 'hono/factory';
import drizzle from '~drizzle';
import { projects } from '~drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { Project } from '~drizzle/models/projects';
import { User } from '~drizzle/models/users';
import { getRedisClient } from '~utils/redis';
import { CACHE_EXPIRY } from '~utils/constants';
import { Context, Next } from "hono";

type MiddlewareVariables = {
  Variables: {
    project: Project;
    projects: Project[];
    user: User;
    isApiKeyAuth: boolean;
    projectId:string
  };
};

async function getProjectWithCache(projectId: string, userId: string) {
  const redis = await getRedisClient();
  const cacheKey = `project:${projectId}`;

  const cachedProject = await redis.get(cacheKey);
  if (cachedProject) {
    const project = JSON.parse(cachedProject);
    if (project.userId === userId) {
      return project;
    }
    return null;
  }

  const project = await drizzle.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
  });

  if (project) {
    await redis.set(cacheKey, JSON.stringify(project), {
      EX: CACHE_EXPIRY,
    });
  }

  return project;
}

const projectMiddleware = createMiddleware<MiddlewareVariables>(
  async (c, next) => {
    const projectId = c.get('projectId') as string;
    const isApiKeyAuth = c.get('isApiKeyAuth');
    const project = c.get('project');
    const user = c.get('user');

    if (isApiKeyAuth && project && projectId) {
      return next();
    }

    const dbProjects = await drizzle.query.projects.findMany({
      where: eq(projects.userId, user.id), 
    });


    if (dbProjects.length > 0) {
      const redis = await getRedisClient();
      await redis.set(`user:${user.id}:projects`, JSON.stringify(dbProjects), {
        EX: CACHE_EXPIRY,
      });
      c.set('projects', dbProjects);
    }

    if (projectId) {
      const userProject = dbProjects.find((p) => p.id === projectId);

      if (!userProject) {
        return c.json(
          {
            error: `Project with ID: ${projectId} not found or you don't have access to it`,
          },
          404
        );
      }

      c.set('project', userProject);
    }

    return next();
  }
);

export default projectMiddleware;
