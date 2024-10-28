import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { serveStatic } from 'hono/bun';
import { config } from 'dotenv';
import authMiddleware from './middleware/auth-middleware';
import auth from './routes/auth';
import project from './routes/project';
import workflows from './routes/workflows';
import { HomeView } from '../views/home.view';
import { LoginView } from '../views/login.view';
import { SignupView } from '../views/signup.view';
import { ProjectsView } from '../views/projects.view';
import { WorkflowDetailView } from '../views/workflow-detail.view';
import workflowMiddleware from './middleware/workflow-middleware';
import projectMiddleware from './middleware/project-middleware';

config();

const app = new Hono();
const api = new Hono().basePath('/api/v1');

app.use('*', logger());
app.use('/static/*', serveStatic({ root: './public' }));

// Public routes first
app.get('/auth/login', LoginView);
app.get('/auth/signup', SignupView);
api.route('/auth', auth);

// // Apply auth middleware to specific routes rather than globally
app.use('*', authMiddleware);
app.use('/projects/*', projectMiddleware);

app.get('/', HomeView);
app.get('/projects', ProjectsView);
app.get(
  '/projects/:projectId/workflows/:workflowName',
  WorkflowDetailView
);

// Test
app.use("*", authMiddleware, projectMiddleware, workflowMiddleware)

// API routes
api.use('*', authMiddleware);
api.use('/projects/*', projectMiddleware);
api.use('/projects/:projectId/workflows/:workflowName/*', workflowMiddleware);

// Define routes in correct order
api.route('/projects/:projectId/workflows/:workflowName/events', workflows); // More specific route first
api.route('/projects/:projectId/workflows', workflows);
api.route('/projects', project);

app.route('', api);

app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default {
  port: 5390,
  fetch: app.fetch,
};
