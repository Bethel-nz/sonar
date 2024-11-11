import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import users from './users';
import { workflows } from './workflows';

export const projects = pgTable('projects', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  projectUrl: varchar('project_url', { length: 255 }),
  githubUrl: varchar('github_url', { length: 255 }),
  apiKey: varchar('api_key', { length: 255 }).notNull().unique(),
  userId: uuid('user_id').references(() => users.id, {
    onDelete: 'cascade',
    onUpdate: 'no action',
  }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  // Index for user's projects lookup
  userIdIdx: index('project_user_id_idx').on(table.userId),
  
  // Index for API key lookups (though it's already unique)
  apiKeyIdx: index('project_api_key_idx').on(table.apiKey),
  
  // Composite index for name search within user's projects
  nameUserIdx: index('project_name_user_idx').on(table.name, table.userId),
  
  // Index for sorting by creation/update time
  createdAtIdx: index('project_created_at_idx').on(table.createdAt),
  updatedAtIdx: index('project_updated_at_idx').on(table.updatedAt),
  
  // Full text search index for name and description
  nameDescriptionIdx: index('project_name_description_idx')
    .on(table.name, table.description)
}));

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
