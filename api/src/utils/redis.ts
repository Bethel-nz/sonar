import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL!,
      socket: {
        connectTimeout: 10000, // 10 seconds
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000), // Exponential backoff
      }
    });

    redisClient.on('error', (err) => console.error('Redis Client Error', err));

    await redisClient.connect();
  }

  return redisClient;
}
