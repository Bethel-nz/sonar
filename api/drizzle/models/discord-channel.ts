import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { relations } from 'drizzle-orm';

 const discordChannels = pgTable('discord_channels', {
  projectId: text('project_id').references(() => projects.id).primaryKey(),
  channelId: text('channel_id').notNull(),
  guildId: text('guild_id').notNull(),
  apiKey: text('api_key').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const discordChannelsRelations = relations(discordChannels, ({ one }) => ({
  project: one(projects, {
    fields: [discordChannels.projectId],
    references: [projects.id],
  }),
}));

export default discordChannels;
