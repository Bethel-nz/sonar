import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { relations } from 'drizzle-orm';

const discordChannels = pgTable('discord_channels', {
  projectId: text('project_id').references(() => projects.id).primaryKey(),
  channelId: text('channel_id').notNull(),
  guildId: text('guild_id').notNull(),
  apiKey: text('api_key').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  // Index for API key lookups
  apiKeyIdx: index('discord_api_key_idx').on(table.apiKey),
  
  // Composite index for guild and channel lookups
  guildChannelIdx: index('discord_guild_channel_idx').on(table.guildId, table.channelId),
  
  // Index for creation time
  createdAtIdx: index('discord_created_at_idx').on(table.createdAt),
}));

export const discordChannelsRelations = relations(discordChannels, ({ one }) => ({
  project: one(projects, {
    fields: [discordChannels.projectId],
    references: [projects.id],
  }),
}));

export default discordChannels;
