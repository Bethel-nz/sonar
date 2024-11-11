import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { config } from 'dotenv';
import authMiddleware from './middleware/auth-middleware';
import auth from './routes/auth';
import project from './routes/project';
import workflows from './routes/workflows';
import workflowMiddleware from './middleware/workflow-middleware';
import projectMiddleware from './middleware/project-middleware';
import { startKeepAliveJob } from './utils/keep-alive';
import {Events as events} from "./routes/events"
import cors from './middleware/cors-middleware';

config();

const app = new Hono();
const api = new Hono().basePath('/api/v1');


app.use('*', logger());

// Custom CORS middleware limits requests to the frontend and SDK
app.use('*', cors);

// Public auth routes
api.route('/auth', auth);

// Protected routes with middleware
api.use('*', authMiddleware);
api.use('/projects/*', projectMiddleware);
api.use('/projects/:projectId/workflows/:workflowName/*', workflowMiddleware);

// API routes
api.route('/projects', project);  
api.route('/projects/:projectId/workflows', workflows);
api.route('/projects/:projectId/workflows/:workflowName/events', events);
api.route('/projects/:projectId/workflows/:workflowName', workflows);

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

startKeepAliveJob();

export default {
  port: process.env.PORT || 5390,
  fetch: app.fetch,
};
