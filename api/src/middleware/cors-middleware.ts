import { createMiddleware } from 'hono/factory';

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN as string;

const cors = createMiddleware(async (c, next) => {
  const origin = c.req.header('Origin');
  const method = c.req.method;

  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.res.headers.set('Access-Control-Allow-Credentials', 'true');
  
  if (origin === FRONTEND_ORIGIN) {
    c.res.headers.set('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
    c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    if (method === 'OPTIONS') {
      return c.json(null, 204);
    }
    
    return next();
  } else {
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

export default cors;
