//Tried Implementing a Cache Aside Pattern but err didnt work as i through
/***
import { getRedisClient } from './redis';
import drizzle from '~drizzle';
import { SQL } from 'drizzle-orm';
import { CACHE_EXPIRY } from '~utils/constants';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export async function cacheAside<T>(
  key: string,
  query: typeof drizzle,
  transform?: (data: Record<string, unknown>) => T
): Promise<T | null> {
  const redis = await getRedisClient();

  // Try to get data from Redis
  const cachedData = await redis.get(key);

  if (cachedData) {
    return transform
      ? transform(JSON.parse(cachedData))
      : (JSON.parse(cachedData) as T);
  }

  // If not in cache, fetch from database
  const data = (await query) as PostgresJsDatabase<T>[] 

  if (data && data.length > 0) {
    const result = data[0] as Record<string, unknown>;
    await redis.set(key, JSON.stringify(result), { EX: CACHE_EXPIRY });
    return transform ? transform(result) : (result as unknown as T);
  }

  return null;
}

export async function invalidateCache(key: string): Promise<void> {
  const redis = await getRedisClient();
  await redis.del(key);
}

export async function updateCache<T>(key: string, data: T): Promise<void> {
  const redis = await getRedisClient();
  await redis.set(key, JSON.stringify(data), { EX: CACHE_EXPIRY });
}

*/
