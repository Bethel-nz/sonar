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

  if (!result.success) {
    console.log(result.error);
    return c.redirect(
      '/auth/signup?error=' + encodeURIComponent('Invalid input')
    );
  }

  const { username, email, password } = result.data;
  if (await isEmailAvailable(email)) {
    return c.redirect(
      '/auth/signup?error=' + encodeURIComponent('Email already in use')
    );
  }

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
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 900, // 15 minutes
  });

  await setSignedCookie(
    c,
    'sonar_refresh_token',
    refreshToken!,
    refreshSecret,
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 604800, // 7 days
    }
  );

  return c.redirect('/', 303);
});

auth.post('/login', zValidator('form', loginSchema), async (c) => {
  const body = await c.req.valid('form');
  const result = loginSchema.safeParse(body);

  if (!result.success) {
    return c.redirect(
      '/auth/login?error=' + encodeURIComponent('Invalid input')
    );
  }

  const { email, password } = result.data;

  const user = await drizzle.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email),
  });

  if (!user || !(await comparePassword(password, user.password))) {
    return c.redirect(
      '/auth/login?error=' + encodeURIComponent('Invalid credentials')
    );
  }

  const token = generateToken(user, '15m');
  const refreshToken = generateToken(user, '7d');

  await setSignedCookie(c, 'sonar_token', token!, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 900, // 15 minutes
  });

  await setSignedCookie(
    c,
    'sonar_refresh_token',
    refreshToken!,
    refreshSecret,
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 604800, // 7 days
    }
  );

  return c.redirect('/', 303);
});

auth.post('/logout', async (c) => {
  // Delete the authentication cookies
  deleteCookie(c, 'sonar_token');
  deleteCookie(c, 'sonar_refresh_token');

  // Redirect to the login page
  return c.redirect('/auth/login');
});

export default auth;
