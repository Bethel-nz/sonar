import drizzle from '~drizzle';
import { users, projects } from '~drizzle/schema';
import { User } from '~models/users';
import { Project } from '~models/projects';
import { getSignedCookie, setSignedCookie } from 'hono/cookie';
import { generateToken, verifyToken, secret, refreshSecret } from '~utils/auth';
import { and, eq } from 'drizzle-orm';
import { createMiddleware } from 'hono/factory';

const publicRoutes = [
  '/login',
  '/signup',
  '/api/v1/auth/login',
  '/api/v1/auth/signup',
  '/api/v1/auth/logout',
];

export const authMiddleware = createMiddleware<{
  Variables: {
    project: Project;
    isApiKeyAuth: boolean;
    user: User;
    workflowName: string,
    projectId: string
  };
}>(async (c, next) => {
  const path = c.req.path;


    /** 
    - Apparently i cant read the params here i have to use a regex to extract it
    */
    const projectIdMatch = path.match(/\/projects\/([^\/]+)/);
    const workflowMatch = path.match(/\/workflows\/([^\/]+)/);

    
    const projectId = projectIdMatch ? projectIdMatch[1] : null;
    const workflowName = workflowMatch ? workflowMatch[1] : null;


  if (publicRoutes.includes(path)) {
    return next();
  }

  const apiKey = c.req.header('Authorization')?.replace('SONAR_API_KEY ', '');

  const token = await getSignedCookie(c, secret, 'sonar_token');
  const refreshToken = await getSignedCookie(
    c,
    refreshSecret,
    'sonar_refresh_token'
  );

  if (apiKey && projectId ) {
      c.set("projectId", projectId);
      c.set('isApiKeyAuth', true);
      
      const project = await drizzle.query.projects.findFirst({
        where: and(eq(projects.apiKey, apiKey), eq(projects.id, projectId)),
      });
          
      if (!project) {
        return c.json({ error: 'Invalid API key or project not found' }, 401);
      }
      c.set('project', project);
      if (workflowName) {
        c.set('workflowName', workflowName);
      }
      return next();
  }

  // Token-based Authentication
  if (token) {
    try {
      const decoded = verifyToken(token, secret);
      const user = await drizzle.query.users.findFirst({
        where: eq(users.email, decoded!.email),
      });
      if (!user) {
        throw new Error('User not found');
      }
      c.set('user', user);
      c.set('isApiKeyAuth', false);
      return next();
    } catch (error) {
      console.log('Token verification error:', error);
    }
  }

  if (!token && refreshToken) {
    try {
      const decodedRefresh = verifyToken(refreshToken, refreshSecret) as User;
      const newToken = generateToken(decodedRefresh, '15m');
      await setSignedCookie(c, 'sonar_token', newToken!, secret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: 900,
      });
      c.set('user', decodedRefresh);
      c.set('isApiKeyAuth', false);
      return next();
    } catch (error) {
      console.log('Refresh token error:', error);
    }
  }

  if (path.startsWith('/api') && !apiKey && !token && !refreshToken) {
    console.log('API route unauthorized - no valid auth method found');
    return c.json(
      {
        error:
          'Unauthorized - Please provide valid API key or authentication token',
        path,
        hasApiKey: !!apiKey,
        hasToken: !!token,
        hasRefreshToken: !!refreshToken,
      },
      401
    );
  }

  if (!token && !refreshToken && !publicRoutes.includes(path)) {
    return c.redirect('/auth/login', 303);
  }

  return next();
});

export default authMiddleware;
