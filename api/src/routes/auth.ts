import { Hono } from 'hono';
import { z } from 'zod';
import {
  hashPassword,
  generateToken,
  isEmailAvailable,
  comparePassword,
  secret,
  refreshSecret,
} from '../utils/auth';
import drizzle from '../../drizzle';
import { users } from '../../drizzle/schema';
import { setSignedCookie, deleteCookie } from 'hono/cookie';
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

auth.post('/signup', zValidator('form', signupSchema), async (c) => {
  const body = await c.req.valid('form');
  const result = signupSchema.safeParse(body);

  if (!result.success) return c.json({error: 'Input doesnt Match Expected Data'}, 400);

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
  const token = generateToken(user, '15m');
  const refreshToken = generateToken(user, '7d');

  await setSignedCookie(c, 'sonar_token', token!, secret, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'None',
    maxAge: 900, // 15 minutes
    domain: isProduction ? '.sonar.sh' : 'localhost',
  });

  await setSignedCookie(
    c,
    'sonar_refresh_token',
    refreshToken!,
    refreshSecret,
    {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'None',
      maxAge: 604800, // 7 days
      domain: isProduction ? '.sonar.sh' : 'localhost',
    }
  );

  return c.json({message: 'User created successfully'}, 201);
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
  

  const token = generateToken(user, '15m');
  const refreshToken = generateToken(user, '7d');

  await setSignedCookie(c, 'sonar_token', token!, secret, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'None',
    maxAge: 900, // 15 minutes
    domain: isProduction ? '.sonar.sh' : 'localhost',
  });

  await setSignedCookie(
    c,
    'sonar_refresh_token',
    refreshToken!,
    refreshSecret,
    {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'None',
      maxAge: 604800, // 7 days
      domain: isProduction ? '.sonar.sh' : 'localhost',
    }
  );

  return c.json({message: 'User logged in successfully'}, 200);
});

auth.post('/logout', async (c) => {
  deleteCookie(c, 'sonar_token');
  deleteCookie(c, 'sonar_refresh_token');

  return c.json({message: 'User logged out successfully'}, 200);
});

export default auth;
