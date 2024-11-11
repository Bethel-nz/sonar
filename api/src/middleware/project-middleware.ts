import { createMiddleware } from 'hono/factory';
import drizzle from '~drizzle';
import { projects } from '~drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { Project } from '~drizzle/models/projects';
import { User } from '~drizzle/models/users';
import { Context, Next } from "hono";
import { getRouteParams } from '~utils/routeMatcher';

type MiddlewareVariables = {
  Variables: {
    project: Project;
    projects: Project[];
    user: User;
    isApiKeyAuth: boolean;
    projectId:string
  };
};

const projectMiddleware = createMiddleware<MiddlewareVariables>(
  async (c, next) => {
    
    const {projectId} = getRouteParams(c.req.path)
    const isApiKeyAuth = c.get('isApiKeyAuth');
    const project = c.get('project');
    const user = c.get('user') as User
    

    if (isApiKeyAuth && project && projectId) {
      return next();
    }

    const dbProjects = await drizzle.query.projects.findMany({
      where: eq(projects.userId, user.id), 
    });

    if (dbProjects.length > 0) {
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
