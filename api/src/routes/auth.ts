import { Hono } from 'hono';
import { z } from 'zod';
import {
  hashPassword,
  generateToken,
  isEmailAvailable,
  comparePassword,
  secret,
  refreshSecret,
  verifyToken,
} from '../utils/auth';
import drizzle from '../../drizzle';
import { users } from '../../drizzle/schema';
import { setSignedCookie, deleteCookie, getSignedCookie } from 'hono/cookie';
import { isProduction } from '~utils/constants';
import { zValidator } from '@hono/zod-validator';

const auth = new Hono();

const signupSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(12),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(12),
});

// Common cookie settings
const cookieSettings = {
  httpOnly: true,
  secure: true,
  sameSite: 'None' as const,
  path: '/',
  domain: isProduction ? process.env.COOKIE_DOMAIN : undefined
};

auth.post('/signup', zValidator('form', signupSchema), async (c) => {
  const body = await c.req.valid('form');
  const result = signupSchema.safeParse(body);

  if (!result.success) {
    console.log(result.error);
    return c.json({ error: 'Input doesnt Match Expected Data' }, 400);
  }

  const { username, email, password } = result.data;

  if (await isEmailAvailable(email)) return c.json({error: 'Email already in use'}, 400);
  

  const hashedPassword = await hashPassword(password);

  const [user] = await drizzle
    .insert(users)
    .values({
      username,
      email,
      password: hashedPassword,
    })
    .returning();
  const token = generateToken(user, '1h');
  const refreshToken = generateToken(user, '7d');

  await setSignedCookie(c, 'sonar_token', token!, secret, {
    ...cookieSettings,
    maxAge: 3600, // 1 hour
  });

  await setSignedCookie(
    c,
    'sonar_refresh_token',
    refreshToken!,
    refreshSecret,
    {
      ...cookieSettings,
      maxAge: 604800, // 7 days
    }
  );

  return c.json({
    message: 'User created successfully',
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt
    }
  }, 201);
});

auth.post('/login', zValidator('form', loginSchema), async (c) => {
  const body = await c.req.valid('form');
  const result = loginSchema.safeParse(body);

  if (!result.success) return c.json({error: 'Input doesnt Match Expected Data'}, 400);
  

  const { email, password } = result.data;

  const user = await drizzle.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email),
  });

  if (!user || !(await comparePassword(password, user.password))) return c.json({error: 'Invalid credentials or user doesnt exist'}, 400);
  

  const token = generateToken(user, '1h');
  const refreshToken = generateToken(user, '7d');

  await setSignedCookie(c, 'sonar_token', token!, secret, {
    ...cookieSettings,
    maxAge: 900, // 15 minutes
  });

  await setSignedCookie(
    c,
    'sonar_refresh_token',
    refreshToken!,
    refreshSecret,
    {
      ...cookieSettings,
      maxAge: 604800, // 7 days
    }
  );

  return c.json({
    message: 'User logged in successfully',
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt
    }
  }, 200);
});

auth.get('/me', async (c) => {
  const token = await getSignedCookie(c, secret, 'sonar_token');
  if (!token) return c.json({message: 'No active session found'}, 401);
  
  const decoded = verifyToken(token, secret);
  if (!decoded) return c.json({message: 'Invalid token'}, 401);

  const user = await drizzle.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, decoded.id),
    columns: {
      id: true,
      email: true,
      username: true,
      createdAt: true
    }
  });

  return c.json({ 
    status: 'active', 
    message: 'User logged in successfully',
    user
  }, 200);
});

auth.post('/logout', async (c) => {
  deleteCookie(c, 'sonar_token');
  deleteCookie(c, 'sonar_refresh_token');

  return c.json({message: 'User logged out successfully'}, 200);
});

export default auth;
