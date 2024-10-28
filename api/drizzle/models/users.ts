import { pgTable, uuid, integer, varchar, timestamp, index} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { projects } from './projects';

const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    username: varchar('username', { length: 255 }).notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
	project_count: integer("project_count").notNull().default(0),
	createdAt: timestamp('created_at').defaultNow(),
  	updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => {
    return {
      emailIndex: index('emailIndex').on(table.email),
    };
  }
);
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export default users;


