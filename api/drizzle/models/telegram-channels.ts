import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { relations } from 'drizzle-orm';

export const telegramChannels = pgTable('telegram_channels', {
  projectId: text('project_id').references(() => projects.id).primaryKey(),
  chatId: text('chat_id').notNull(),
  apiKey: text('api_key').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  // Index for API key lookups
  apiKeyIdx: index('telegram_api_key_idx').on(table.apiKey),
  
  // Index for chat ID lookups
  chatIdIdx: index('telegram_chat_id_idx').on(table.chatId),
  
  // Index for creation time
  createdAtIdx: index('telegram_created_at_idx').on(table.createdAt),
}));

export const telegramChannelsRelations = relations(telegramChannels, ({ one }) => ({
  project: one(projects, {
    fields: [telegramChannels.projectId],
    references: [projects.id],
  }),
}));

export default telegramChannels;
