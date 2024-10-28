import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './drizzle/schema/index.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://postgres:5437@localhost:5437/sonar-db',
    ssl: false,
  },
  verbose: true,
  strict: true,
});
