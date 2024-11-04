import { 
    Client, 
    EmbedBuilder, 
    TextChannel, 
    REST, 
    Routes,
    SlashCommandBuilder,
    GatewayIntentBits,
    Interaction,
    PermissionFlagsBits,
    ActivityType,
    Events
} from 'discord.js';
import { NotificationService, ServiceMessage } from './types';
import drizzle from '~drizzle';
import { discordChannels } from '~drizzle/schema';
import { eq } from 'drizzle-orm';

export class DiscordService implements NotificationService {
  private client: Client;
  private ready: boolean = false;
  private static instance: DiscordService;
  private messageStore: Map<string, Map<string, string>> = new Map();
  private eventCountStore: Map<string, Map<string, number>> = new Map();
  private pausedProjects: Map<string, Date> = new Map();

  private readonly severityColors = {
    info: 0x3498db,    // Blue
    warn: 0xf1c40f,    // Yellow
    error: 0xe74c3c,   // Red
    critical: 0x992d22 // Dark Red
  };

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
      ]
    });
    this.initializeClient();
    this.setupCleanupHandlers();
  }

  static getInstance(): DiscordService {
    if (!DiscordService.instance) {
      DiscordService.instance = new DiscordService();
    }
    return DiscordService.instance;
  }

  private async registerCommands() {
    const commands = [
      new SlashCommandBuilder()
        .setName('connect')
        .setDescription('Connect this channel to your project')
        .addStringOption(option => 
          option.setName('project_id')
            .setDescription('Your project ID (e.g., prj_123456)')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('api_key')
            .setDescription('Your API key (e.g., sonar_abcdef)')
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

      new SlashCommandBuilder()
        .setName('disconnect')
        .setDescription('Disconnect this channel from your project')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

      new SlashCommandBuilder()
        .setName('status')
        .setDescription('Check connection status'),

      new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show available commands'),

      new SlashCommandBuilder()
        .setName('refresh')
        .setDescription('Refresh bot connection')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

      new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Get the bot invite URL'),

      new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause notifications for a duration')
        .addIntegerOption(option => 
          option.setName('minutes')
            .setDescription('Duration in minutes (1-60)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(60))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

      new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume notifications')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

      new SlashCommandBuilder()
        .setName('privacy')
        .setDescription('View our privacy policy'),
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!);

    try {
      console.log('Started refreshing application (/) commands.');
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
        { body: commands }
      );
      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error('Error registering slash commands:', error);
    }
  }

  private async initializeClient() {
    try {
      this.client.on(Events.InteractionCreate, async (interaction: Interaction) => {
        if (!interaction.isChatInputCommand()) return;
        
        try {
          switch (interaction.commandName) {
            case 'connect':
              await this.handleConnect(interaction);
              break;
            case 'disconnect':
              await this.handleDisconnect(interaction);
              break;
            case 'status':
              await this.handleStatus(interaction);
              break;
            case 'help':
              await this.handleHelp(interaction);
              break;
            case 'refresh':
              await this.handleRefresh(interaction);
              break;
            case 'invite':
              await this.handleInvite(interaction);
              break;
            case 'pause':
              await this.handlePause(interaction);
              break;
            case 'resume':
              await this.handleResume(interaction);
              break;
            case 'privacy':
              await this.handlePrivacy(interaction);
              break;
          }
        } catch (error) {
          console.error('Command handling error:', error);
          await interaction.reply({ 
            content: 'An error occurred while processing your command.',
            ephemeral: true 
          });
        }
      });

      // Set bot status when ready
      this.client.once(Events.ClientReady, () => {
        console.log(`Discord bot logged in as ${this.client.user?.tag}`);
        this.client.user?.setActivity({
          name: 'your workflows',
          type: ActivityType.Watching
        });
        this.ready = true;
        this.registerCommands();
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
          {name:"Tags",value:message.tags.join(', '),inline:true},
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

  private setupCleanupHandlers() {
    process.on('exit', () => {
      console.debug('🧹 Cleaning up Discord service on exit');
      this.disconnect();
    });

    process.on('uncaughtException', async (error) => {
      console.error('❌ Uncaught Exception:', error);
      console.debug('🧹 Cleaning up Discord service after error');
      await this.disconnect();
      process.exit(1);
    });

    process.on('SIGINT', () => {
      console.debug('🛑 Received SIGINT, cleaning up Discord service');
      this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.debug('🛑 Received SIGTERM, cleaning up Discord service');
      this.disconnect();
      process.exit(0);
    });
  }

  private async handleConnect(interaction: any) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      await interaction.reply({
        content: 'You need "Manage Channels" permission to connect this channel.',
        ephemeral: true
      });
      return;
    }

    const projectId = interaction.options.getString('project_id');
    const apiKey = interaction.options.getString('api_key');

    try {
      const existing = await drizzle.query.discordChannels.findFirst({
        where: eq(discordChannels.projectId, projectId),
      });

      if (existing) {
        await interaction.reply({
          content: 'This project is already connected to a channel.',
          ephemeral: true
        });
        return;
      }

      await drizzle.insert(discordChannels).values({
        projectId,
        channelId: interaction.channelId,
        guildId: interaction.guildId!,
        apiKey
      });

      await interaction.reply({
        content: '✅ Channel successfully connected! You will now receive event notifications here.',
        ephemeral: true
      });
    } catch (error) {
      console.error('Connection error:', error);
      await interaction.reply({
        content: '❌ Failed to connect channel. Please try again later.',
        ephemeral: true
      });
    }
  }

  private async handleDisconnect(interaction: any) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      await interaction.reply({
        content: 'You need "Manage Channels" permission to disconnect this channel.',
        ephemeral: true
      });
      return;
    }

    try {
      const deleted = await drizzle.delete(discordChannels)
        .where(eq(discordChannels.channelId, interaction.channelId))
        .returning();

      if (deleted.length === 0) {
        await interaction.reply({
          content: '❌ This channel is not connected.',
          ephemeral: true
        });
        return;
      }

      await interaction.reply({
        content: '✅ Channel successfully disconnected.',
        ephemeral: true
      });
    } catch (error) {
      console.error('Disconnect error:', error);
      await interaction.reply({
        content: '❌ Failed to disconnect channel.',
        ephemeral: true
      });
    }
  }

  private async handleStatus(interaction: any) {
    try {
      const registration = await drizzle.query.discordChannels.findFirst({
        where: eq(discordChannels.channelId, interaction.channelId),
      });

      if (!registration) {
        await interaction.reply({
          content: '❌ This channel is not connected.\n\nUse `/connect` to connect to a project.',
          ephemeral: true
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('Channel Status')
        .setColor(this.severityColors.info)
        .addFields(
          { name: 'Project ID', value: registration.projectId, inline: true },
          { name: 'Connected Since', value: registration.createdAt?.toLocaleDateString() ?? 'Unknown', inline: true }
        )
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    } catch (error) {
      console.error('Status check error:', error);
      await interaction.reply({
        content: '❌ Failed to check channel status.',
        ephemeral: true
      });
    }
  }

  private async handleHelp(interaction: any) {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Sonar Bot Help')
      .setColor(this.severityColors.info)
      .setDescription('Here are the available commands:')
      .addFields(
        { 
          name: '/connect <project_id> <api_key>', 
          value: 'Connect this channel to your project' 
        },
        { 
          name: '/disconnect', 
          value: 'Disconnect this channel from your project' 
        },
        { 
          name: '/status', 
          value: 'Check current connection status' 
        },
        { 
          name: '/help', 
          value: 'Show this help message' 
        },
        {
          name: '/refresh',
          value: 'Refresh bot connection'
        },
        { 
          name: '/invite', 
          value: 'Get the bot invite URL to add it to other servers' 
        },
        {
          name: '/pause',
          value: 'Pause notifications for a duration'
        },
        {
          name: '/resume',
          value: 'Resume notifications'
        },
        {
          name: '/privacy',
          value: 'View our privacy policy'
        }
      )
      .setFooter({ text: 'You need "Manage Channels" permission for some commands' });

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }

  private async handleRefresh(interaction: any) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      await interaction.reply({
        content: 'You need "Manage Channels" permission to refresh the connection.',
        ephemeral: true
      });
      return;
    }

    try {
      const registration = await drizzle.query.discordChannels.findFirst({
        where: eq(discordChannels.channelId, interaction.channelId),
      });

      if (!registration) {
        await interaction.reply({
          content: '❌ No active connection.\n\nUse `/connect` to connect to a project.',
          ephemeral: true
        });
        return;
      }

      this.messageStore.clear();
      this.eventCountStore.clear();

      await interaction.reply({
        content: '✅ Connection refreshed successfully!',
        ephemeral: true
      });
    } catch (error) {
      console.error('Refresh error:', error);
      await interaction.reply({
        content: '❌ Failed to refresh connection.',
        ephemeral: true
      });
    }
  }

  private async handleInvite(interaction: any) {
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID!}&permissions=${process.env.DISCORD_APP_PERMISSION!}&scope=bot%20applications.commands`;
    
    const embed = new EmbedBuilder()
      .setTitle('🤖 Add Sonar Bot to Your Server')
      .setColor(this.severityColors.info)
      .setDescription('Click the link below to add Sonar Bot to your Discord server:')
      .addFields({
        name: 'Invite Link',
        value: `[Click Here to Add Bot](${inviteUrl})`
      })
      .setFooter({ text: 'You need "Manage Server" permission to add the bot' });

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }

  private async handlePause(interaction: any) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      await interaction.reply({
        content: 'You need "Manage Channels" permission to pause notifications.',
        ephemeral: true
      });
      return;
    }

    try {
      const registration = await drizzle.query.discordChannels.findFirst({
        where: eq(discordChannels.channelId, interaction.channelId),
      });

      if (!registration) {
        await interaction.reply({
          content: '❌ This channel is not connected to any project.',
          ephemeral: true
        });
        return;
      }

      const minutes = interaction.options.getInteger('minutes');
      const until = new Date(Date.now() + minutes * 60 * 1000);
      this.pausedProjects.set(registration.projectId, until);

      await interaction.reply({
        content: `✅ Notifications paused for ${minutes} minutes.\nWill resume at: ${until.toLocaleTimeString()}`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Pause error:', error);
      await interaction.reply({
        content: '❌ Failed to pause notifications.',
        ephemeral: true
      });
    }
  }

  private async handleResume(interaction: any) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      await interaction.reply({
        content: 'You need "Manage Channels" permission to resume notifications.',
        ephemeral: true
      });
      return;
    }

    try {
      const registration = await drizzle.query.discordChannels.findFirst({
        where: eq(discordChannels.channelId, interaction.channelId),
      });

      if (!registration) {
        await interaction.reply({
          content: '❌ This channel is not connected to any project.',
          ephemeral: true
        });
        return;
      }

      const wasPaused = this.pausedProjects.delete(registration.projectId);

      await interaction.reply({
        content: wasPaused 
          ? '✅ Notifications resumed successfully.' 
          : '❓ Notifications were not paused.',
        ephemeral: true
      });
    } catch (error) {
      console.error('Resume error:', error);
      await interaction.reply({
        content: '❌ Failed to resume notifications.',
        ephemeral: true
      });
    }
  }

  private async handlePrivacy(interaction: any) {
    await interaction.reply({
      content: '🔒 View our privacy policy: https://github.com/Bethel-nz/sonar/blob/main/privacy-policy.md',
      ephemeral: true
    });
  }
}
