import jwt, { JwtPayload } from 'jsonwebtoken';
import { User } from '~models/users';
import { password as Oven } from 'bun';
import drizzle from '~drizzle';
import { users } from '~drizzle/schema';
import { eq } from 'drizzle-orm';

export const secret = process.env.JWT_SECRET! as string;
export const refreshSecret = process.env.JWT_SECRET! as string;

export const generateToken = (user: User, time: '15m' | '1h' | '7d') => {
  try {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      secret,
      { expiresIn: time }
    );
  } catch (error) {
    console.error(error);
  }
};

export const verifyToken = <T>(token: string, jwtSecret: string) => {
  try {
    return jwt.verify(token, jwtSecret) as User;
  } catch (error) {
    console.error(error);
  }
};

export const hashPassword = (password: string): Awaited<string> => {
  return Oven.hashSync(password, {
    algorithm: 'bcrypt',
    cost: 4,
  });
};

export const comparePassword = (
  password: string,
  hashedPassword: string
): Awaited<boolean> => {
  return Oven.verifySync(password, hashedPassword);
};

export async function isEmailAvailable(email: string): Promise<boolean> {
  const result = await drizzle.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });

  return !!result;
}
