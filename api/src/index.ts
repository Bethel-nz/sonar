import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { config } from 'dotenv';
import authMiddleware from './middleware/auth-middleware';
import auth from './routes/auth';
import project from './routes/project';
import workflows from './routes/workflows';
import workflowMiddleware from './middleware/workflow-middleware';
import projectMiddleware from './middleware/project-middleware';
import { TelegramService } from './services/telegram';

config();

const app = new Hono();
const api = new Hono().basePath('/api/v1');

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN as string;

app.use('*', logger());

// Custom CORS middleware limits requests to the frontend and SDK
app.use('*', async (c, next) => {
  const origin = c.req.header('Origin');
  const method = c.req.method;

  // Set basic CORS headers for all requests
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, SONAR_API_KEY');
  c.res.headers.set('Access-Control-Allow-Credentials', 'true');
  
  if (origin === FRONTEND_ORIGIN) {
    // Frontend can access all methods
    c.res.headers.set('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
    c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    
    if (method === 'OPTIONS') {
      return c.json(null, 204);
    }
    
    return next();
  } else {
    // SDK/External origins can only make POST requests
    c.res.headers.set('Access-Control-Allow-Origin', '*');
    c.res.headers.set('Access-Control-Allow-Methods', 'POST');
    
    if (method === 'OPTIONS') {
      return c.json(null, 204);
    }
    
    if (method === 'POST') {
      return next();
    }
    
    return c.json({ 
      error: 'Forbidden',
      message: 'Only POST requests are allowed from external origins'
    }, 403);
  }
});

// Public auth routes
api.route('/auth', auth);

// Protected routes with middleware
api.use('*', authMiddleware);
api.use('/projects/*', projectMiddleware);
api.use('/projects/:projectId/workflows/:workflowName/*', workflowMiddleware);

// API routes
api.route('/projects/:projectId/workflows/:workflowName/events', workflows);
api.route('/projects/:projectId/workflows', workflows);
api.route('/projects', project);

// Mount API routes
app.route('', api);

// Global error handler
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined 
  }, 500);
});

export default {
  port: process.env.PORT || 5390,
  fetch: app.fetch,
};
