import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { relations } from 'drizzle-orm';

export const telegramChannels = pgTable('telegram_channels', {
  projectId: text('project_id').references(() => projects.id).primaryKey(),
  chatId: text('chat_id').notNull(),
  apiKey: text('api_key').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const telegramChannelsRelations = relations(telegramChannels, ({ one }) => ({
  project: one(projects, {
    fields: [telegramChannels.projectId],
    references: [projects.id],
  }),
}));
export default telegramChannels
