import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { NotificationService, ServiceMessage } from './types';
import drizzle from '~drizzle';
import { discordChannels } from '~drizzle/schema';
import { eq } from 'drizzle-orm';

export class DiscordService implements NotificationService {
  private client: Client;
  private ready: boolean = false;
  private static instance: DiscordService;

  private readonly severityColors = {
    info: 0x3498db,    // Blue
    warn: 0xf1c40f,    // Yellow
    error: 0xe74c3c,   // Red
    critical: 0x992d22 // Dark Red
  };

  constructor() {
    this.client = new Client({
      intents: ['Guilds', 'GuildMessages', 'MessageContent', 'DirectMessages']
    });
    this.initializeClient();
  }

  static getInstance(): DiscordService {
    if (!DiscordService.instance) {
      DiscordService.instance = new DiscordService();
    }
    return DiscordService.instance;
  }

  private async initializeClient() {
    try {
      this.client.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        if (message.content.startsWith('!sonar')) {
          await this.handleCommand(message);
        }
      });

      this.client.once('ready', () => {
        console.log('Discord bot is ready!');
        this.ready = true;
      });

      await this.client.login(process.env.DISCORD_BOT_TOKEN);
    } catch (error) {
      console.error('Discord initialization failed:', error);
      this.ready = false;
    }
  }

  private async ensureReady(): Promise<void> {
    if (!this.ready) {
      await new Promise<void>((resolve) => {
        const checkReady = () => {
          if (this.ready) resolve();
          else setTimeout(checkReady, 100);
        };
        checkReady();
      });
    }
  }

  private async handleCommand(message: any) {
    const args = message.content.split(' ').slice(1);
    const command = args[0]?.toLowerCase();

    try {
      switch (command) {
        case 'register':
          await this.handleRegister(message, args);
          break;
        case 'unregister':
          await this.handleUnregister(message);
          break;
        case 'status':
          await this.handleStatus(message);
          break;
        case 'help':
          await this.handleHelp(message);
          break;
        default:
          await message.reply('Unknown command. Use `!sonar help` for available commands.');
      }
    } catch (error) {
      console.error('Command handling error:', error);
      await message.reply('An error occurred while processing your command.');
    }
  }

  private async handleRegister(message: any, args: string[]) {
    if (!message.member?.permissions.has('ManageChannels')) {
      await message.reply('You need "Manage Channels" permission to register this channel.');
      return;
    }

    const [_, projectId, apiKey] = args;

    if (!projectId || !apiKey) {
      await message.reply('Usage: !sonar register <project_id> <api_key>');
      return;
    }

    try {
      const existing = await drizzle.query.discordChannels.findFirst({
        where: eq(discordChannels.projectId, projectId),
      });

      if (existing) {
        await message.reply('This project is already registered to a channel.');
        return;
      }

      await drizzle.insert(discordChannels).values({
        projectId,
        channelId: message.channel.id,
        guildId: message.guild!.id,
        apiKey
      });

      await message.reply('Channel successfully registered! You will now receive event notifications here.');
    } catch (error) {
      console.error('Registration error:', error);
      await message.reply('Failed to register channel. Please try again later.');
    }
  }

  private async handleUnregister(message: any) {
  if (!message.member?.permissions.has('ManageChannels')) {
    await message.reply('You need "Manage Channels" permission to unregister this channel.');
    return;
  }

  try {
    const deleted = await drizzle.delete(discordChannels)
      .where(eq(discordChannels.channelId, message.channel.id))
      .returning();

    if (deleted.length === 0) {
      await message.reply('This channel is not registered.');
      return;
    }

    await message.reply('Channel successfully unregistered.');
  } catch (error) {
    console.error('Unregister error:', error);
    await message.reply('Failed to unregister channel.');
  }
}

private async handleStatus(message: any) {
  try {
    const registration = await drizzle.query.discordChannels.findFirst({
      where: eq(discordChannels.channelId, message.channel.id),
    });

    if (!registration) {
      await message.reply('This channel is not registered.');
      return;
    }

    await message.reply(`
Channel Status:
• Project ID: ${registration.projectId}
• Registered: ${registration!.createdAt?.toLocaleDateString() ?? 'Unknown'}
    `.trim());
  } catch (error) {
    console.error('Status check error:', error);
    await message.reply('Failed to check channel status.');
  }
}

private async handleHelp(message: any) {
  await message.reply(`
Available commands:
• \`!sonar register <project_id> <api_key>\` - Register this channel
• \`!sonar unregister\` - Unregister this channel
• \`!sonar status\` - Check registration status
• \`!sonar help\` - Show this help message
  `.trim());
}

async updateNotification(messageId: string, message: ServiceMessage): Promise<void> {
  try {
    await this.ensureReady();

    // Get channel from project registration
    const registration = await drizzle.query.discordChannels.findFirst({
      where: eq(discordChannels.projectId, message.projectId),
    });

    if (!registration) {
      throw new Error(`No registered channel found for project: ${message.projectId}`);
    }

    const channel = await this.client.channels.fetch(registration.channelId);
    if (!(channel instanceof TextChannel)) {
      throw new Error(`Channel ${registration.channelId} is not a text channel`);
    }

    const discordMessage = await channel.messages.fetch(messageId);
    if (!discordMessage) {
      throw new Error(`Message not found: ${messageId}`);
    }

    const embed = new EmbedBuilder()
      .setTitle(`Updated Event in ${message.workflowName}`)
      .setColor(this.severityColors[message.severity])
      .addFields(
        { name: 'Event', value: message.eventName, inline: true },
        { name: 'Severity', value: message.severity, inline: true },
        {
          name: 'Next Event',
          value: message.nextEvent || 'Not specified',
          inline: true,
        },
        { name: 'Description', value: message.description },
        {
          name: 'Payload',
          value: `\`\`\`json\n${JSON.stringify(
            message.payload,
            null,
            2
          )}\n\`\`\``,
        }
      )
      .setTimestamp(message.timestamp);

    await discordMessage.edit({ embeds: [embed] });
  } catch (error) {
    console.error('Discord update error:', error);
    throw new Error(`Failed to update Discord notification: ${(error as Error).message}`);
  }
}


  async sendNotification(message: ServiceMessage): Promise<void> {
    try {
      await this.ensureReady();

      const registration = await drizzle.query.discordChannels.findFirst({
        where: eq(discordChannels.projectId, message.projectId),
      });

      if (!registration) {
        throw new Error(`No registered channel found for project: ${message.projectId}`);
      }

      const channel = await this.client.channels.fetch(registration.channelId);
      if (!channel?.isTextBased()) {
        throw new Error(`Invalid channel type for ID: ${registration.channelId}`);
      }

      const embed = new EmbedBuilder()
        .setTitle(`New Event in ${message.workflowName}`)
        .setColor(this.severityColors[message.severity])
        .addFields(
          { name: 'Event', value: message.eventName, inline: true },
          { name: 'Severity', value: message.severity, inline: true },
          {
            name: 'Next Event',
            value: message.nextEvent || 'Not specified',
            inline: true,
          },
          { name: 'Description', value: message.description },
          {
            name: 'Payload',
            value: `\`\`\`json\n${JSON.stringify(
              message.payload,
              null,
              2
            )}\n\`\`\``,
          }
        )
        .setTimestamp(message.timestamp);

      await (channel as TextChannel).send({ embeds: [embed] });
    } catch (error) {
      console.error('Discord notification error:', error);
      throw new Error(`Failed to send Discord notification: ${(error as Error).message}`);
    }
  }

  async disconnect(): Promise<void> {
    this.client.destroy();
    this.ready = false;
  }
}
