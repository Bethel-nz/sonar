export { default as users, usersRelations } from '~models/users';
export { default as projects, projectsRelations } from '~models/projects';
export { default as workflows, workflowsRelations } from '~models/workflows';
export { default as events, eventsRelations } from '~models/events';
export { default as telegramChannels, telegramChannelsRelations } from "~models/telegram-channels"
export { default as discordChannels, discordChannelsRelations } from "~models/discord-channel"

console.log('DB Schema Generated!');
