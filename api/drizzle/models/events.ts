import {
  pgTable,
  varchar,
  timestamp,
  jsonb,
  text,
  uuid,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { workflows } from './workflows';

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  workflowId: uuid('workflow_id').references(() => workflows.id, {
    onDelete: 'cascade',
    onUpdate: 'no action',
  }),
  config: jsonb('config').notNull().$type<{
    description: string;
    severity: 'info' | 'critical' | 'warn' | 'error';
    tags: string[];
  }>(),
  nextEvent: text('next_event').$type<string | null>(),
  payload: jsonb('payload').notNull(),
  services: text('services').array().notNull(),
  count: integer('count').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  workflowIdIdx: index('event_workflow_id_idx').on(table.workflowId),
  nameWorkflowIdx: index('event_name_workflow_idx').on(table.name, table.workflowId),
  createdAtIdx: index('event_created_at_idx').on(table.createdAt),
}));

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export const eventsRelations = relations(events, ({ one }) => ({
  workflow: one(workflows, {
    fields: [events.workflowId],
    references: [workflows.id],
  }),
}));

export default events;
