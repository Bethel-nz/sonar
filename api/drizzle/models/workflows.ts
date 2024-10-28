import { pgTable, serial, varchar, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { projects } from './projects';
import { events } from './events';

export const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  projectId: varchar('project_id', { length: 255 }).references(
    () => projects.id,
    {
      onDelete: 'cascade',
      onUpdate: 'no action',
    }
  ),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  project: one(projects, {
    fields: [workflows.projectId],
    references: [projects.id],
  }),
  events: many(events),
}));

export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;

export default workflows;
