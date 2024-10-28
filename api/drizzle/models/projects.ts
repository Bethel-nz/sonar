import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import users from './users';
import { workflows } from './workflows';

export const projects = pgTable('projects', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  apiKey: varchar('api_key', { length: 255 }).notNull().unique(),
  userId: uuid('user_id').references(() => users.id, {
    onDelete: 'cascade',
    onUpdate: 'no action',
  }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  workflow: one(workflows, {
    fields: [projects.id],
    references: [workflows.projectId],
  }),
}));

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export default projects;
