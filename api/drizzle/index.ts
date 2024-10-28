import { drizzle as drizzle_orm } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!);
const drizzle = drizzle_orm(client, {
  schema
});
export default drizzle;
