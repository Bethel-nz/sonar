import { Bot, Context, session, SessionFlavor } from 'grammy';
import { FileAdapter } from '@grammyjs/storage-file';
import { NotificationService, ServiceMessage } from './types';
import drizzle from '~drizzle';
import { telegramChannels } from '~drizzle/schema';
import { run, sequentialize } from '@grammyjs/runner';
import { apiThrottler } from '@grammyjs/transformer-throttler';
import { hydrateReply, ParseModeFlavor, parseMode } from '@grammyjs/parse-mode';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';

interface SessionData {
  projectId?: string;
  lastCommandMessageId?: number;
}

type MyContext = ParseModeFlavor<Context & SessionFlavor<SessionData>>;

export class TelegramService implements NotificationService {
  public static instance: TelegramService;
  private bot: Bot<MyContext>;
  private projectChannels: Map<string, string> = new Map(); // projectId -> chatId
  private isRunning: boolean = false;
  private runner: { isRunning(): boolean; stop(): Promise<void> } | null = null;
  private pausedProjects: Map<string, Date> = new Map();

  private constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('BOT_TOKEN environment variable is not set');
    }

    this.bot = new Bot<MyContext>(token);
    
    this.bot.api.config.use(apiThrottler());

    this.bot.api.config.use(parseMode('Markdown'));
    
    this.bot.use(hydrateReply);

    this.bot.use(session({
      initial: (): SessionData => ({
        projectId: undefined,
        lastCommandMessageId: undefined
      }),
      storage: new FileAdapter({
        dirName: "sessions"
      })
    }));

  this.bot.use(sequentialize((ctx) => ctx.chat?.id.toString()));
    this.setupBot();

    this.setupCleanupHandlers();
  }

  public static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  private async setupBot() {
    if (this.isRunning) {
      console.log('Bot is already running');
      return;
    }

    try {
      // Stop existing runner if it exists
      if (this.runner?.isRunning()) {
        await this.runner.stop();
      }

      // Add refresh command to command list
      await this.bot.api.setMyCommands([
        { command: 'start', description: 'Start the bot' },
        { command: 'connect', description: 'Connect to a project' },
        { command: 'help', description: 'Show help' },
        { command: 'status', description: 'Check connection status' },
        { command: 'refresh', description: 'Refresh bot connection' },
        { command: 'pause', description: 'Pause notifications (1-60 minutes)' },
        { command: 'resume', description: 'Resume notifications' },
        { command: 'privacy', description: 'View our privacy policy' },
      ]);

      this.bot.command('start', async (ctx) => {
        const message = await ctx.api.sendMessage(
          ctx.chat.id,
          'Welcome to Sonar Bot! 🚀\n\n' +
          'Use /connect <project_id> <api_key> to connect this chat to your project.\n\n' +
          'Example:\n/connect prj_123456 sonar_abcdef'
        );
        ctx.session.lastCommandMessageId = message.message_id;
      });

      this.bot.command('help', async (ctx) => {
        await ctx.api.sendMessage(
          ctx.chat.id,
          '🤖 *Sonar Bot Help*\n\n' +
          'Available commands:\n' +
          '/start - Start the bot\n' +
          '/connect <project_id> <api_key> - Connect to a project\n' +
          '/status - Check current connection status\n' +
          '/help - Show this help message\n' +
          '/privacy - View our privacy policy\n\n' +
          'Once connected, you\'ll receive notifications for your workflow events here.',
          { parse_mode: 'Markdown' }
        );
      });

      // Handle /status command
      this.bot.command('status', async (ctx) => {
        const chatId = ctx.chat.id.toString();
        const connection = await drizzle.query.telegramChannels.findFirst({
          where: eq(telegramChannels.chatId, chatId)
        });

        if (connection) {
          await ctx.api.sendMessage(
            ctx.chat.id,
            '✅ *Connected*\n\n' +
            `Project ID: \`${connection.projectId}\`\n` +
            `Connected since: ${connection.createdAt?.toLocaleString()}`,
            { parse_mode: 'Markdown' }
          );
        } else {
          await ctx.api.sendMessage(
            ctx.chat.id,
            '❌ *Not Connected*\n\n' +
            'Use /connect <project_id> <api_key> to connect this chat to your project.',
            { parse_mode: 'Markdown' }
          );
        }
      });

      // Handle /connect command
      this.bot.command('connect', async (ctx) => {
        if (!ctx.message?.text) {
          await ctx.api.sendMessage(ctx.chat.id, '❌ Invalid command format');
          return;
        }

        // Store the command message ID for later deletion
        const commandMessageId = ctx.message.message_id;

        const message = ctx.message.text.split(' ');
        if (message.length !== 3) {
          const errorMessage = await ctx.api.sendMessage(
            ctx.chat.id,
            '❌ Invalid format!\n\n' +
            'Usage: /connect <project_id> <api_key>\n' +
            'Example: /connect prj_123456 sonar_abcdef'
          );
          
          setTimeout(async () => {
            try {
              await ctx.api.deleteMessage(ctx.chat.id, commandMessageId);
              await ctx.api.deleteMessage(ctx.chat.id, errorMessage.message_id);
            } catch (error) {
              console.error('Error deleting messages:', error);
            }
          }, 5000);
          return;
        }

        const [_, projectId, apiKey] = message;
        const chatId = ctx.chat.id.toString();

        try {

          await drizzle
            .insert(telegramChannels)
            .values({
              projectId,
              chatId,
              apiKey,
            })
            .onConflictDoUpdate({
              target: telegramChannels.projectId,
              set: { chatId, apiKey },
            });

          this.projectChannels.set(projectId, chatId);
          
          const successMessage = await ctx.api.sendMessage(
            ctx.chat.id,
            '✅ Successfully connected!\n\n' +
            'You will now receive notifications for this project in this chat.',
            { parse_mode: 'Markdown' }
          );

          setTimeout(async () => {
            try {
              await ctx.api.deleteMessage(ctx.chat.id, commandMessageId);
              await ctx.api.deleteMessage(ctx.chat.id, successMessage.message_id);
            } catch (error) {
              console.error('Error deleting messages:', error);
            }
          }, 5000);
        } catch (error) {
          console.error('Error connecting chat:', error);
          const errorMessage = await ctx.api.sendMessage(
            ctx.chat.id,
            '❌ Failed to connect. Please check your project ID and API key.'
          );

          setTimeout(async () => {
            try {
              await ctx.api.deleteMessage(ctx.chat.id, commandMessageId);
              await ctx.api.deleteMessage(ctx.chat.id, errorMessage.message_id);
            } catch (error) {
              console.error('Error deleting messages:', error);
            }
          }, 5000);
        }
      });

      // Add refresh command handler
      this.bot.command('refresh', async (ctx) => {
        const chatId = ctx.chat.id.toString();
        
        try {
          // Reload channel mappings
          await this.loadChannelMappings();
          
          // Check connection
          const connection = await drizzle.query.telegramChannels.findFirst({
            where: eq(telegramChannels.chatId, chatId)
          });

          if (connection) {
            const pingMessage = await ctx.api.sendMessage(
              ctx.chat.id,
              '🔄 Refreshing connection...'
            );

            await ctx.api.deleteMessage(ctx.chat.id, pingMessage.message_id);

            await ctx.api.sendMessage(
              ctx.chat.id,
              '✅ *Connection Refreshed Successfully*\n\n' +
              `Project ID: \`${connection.projectId}\`\n` +
              'Bot is ready to receive notifications.',
              { parse_mode: 'Markdown' }
            );

            this.messageStore.clear();
            this.eventCountStore.clear();
          } else {
            await ctx.api.sendMessage(
              ctx.chat.id,
              '❌ *No Active Connection*\n\n' +
              'Use /connect <project_id> <api_key> to connect this chat to your project.',
              { parse_mode: 'Markdown' }
            );
          }
        } catch (error) {
          console.error('Error refreshing connection:', error);
          await ctx.api.sendMessage(
            ctx.chat.id,
            '❌ *Error Refreshing Connection*\n\n' +
            'Please try reconnecting with /connect command.',
            { parse_mode: 'Markdown' }
          );
        }
      });

      // Add pause command handler
      this.bot.command('pause', async (ctx) => {
        const chatId = ctx.chat.id.toString();
        const minutes = parseInt(ctx.message?.text?.split(' ')[1] || '0');

        if (!minutes || minutes < 1 || minutes > 60) {
          await ctx.reply(
            '❌ Invalid duration!\n\n' +
            'Usage: /pause <minutes>\n' +
            'Example: /pause 30\n\n' +
            'Duration must be between 1 and 60 minutes.'
          );
          return;
        }

        try {
          const registration = await drizzle.query.telegramChannels.findFirst({
            where: eq(telegramChannels.chatId, chatId)
          });

          if (!registration) {
            await ctx.reply('❌ This chat is not connected to any project.');
            return;
          }

          const until = new Date(Date.now() + minutes * 60 * 1000);
          this.pausedProjects.set(registration.projectId, until);

          await ctx.reply(
            `✅ Notifications paused for ${minutes} minutes.\n` +
            `Will resume at: ${until.toLocaleTimeString()}`
          );
        } catch (error) {
          console.error('Pause error:', error);
          await ctx.reply('❌ Failed to pause notifications.');
        }
      });

      // Add resume command handler
      this.bot.command('resume', async (ctx) => {
        const chatId = ctx.chat.id.toString();

        try {
          const registration = await drizzle.query.telegramChannels.findFirst({
            where: eq(telegramChannels.chatId, chatId)
          });

          if (!registration) {
            await ctx.reply('❌ This chat is not connected to any project.');
            return;
          }

          const wasPaused = this.pausedProjects.delete(registration.projectId);

          await ctx.reply(
            wasPaused 
              ? '✅ Notifications resumed successfully.'
              : '❓ Notifications were not paused.'
          );
        } catch (error) {
          console.error('Resume error:', error);
          await ctx.reply('❌ Failed to resume notifications.');
        }
      });

      // Add privacy command handler
      this.bot.command('privacy', async (ctx) => {
        await ctx.reply(
          '🔒 View our privacy policy:\nhttps://github.com/Bethel-nz/sonar/blob/main/privacy-policy.md'
        );
      });

      setInterval(async () => {
        try {
          const mappings = await drizzle.query.telegramChannels.findMany();
          for (const mapping of mappings) {
            try {
              await this.bot.api.sendChatAction(mapping.chatId, "typing");
            } catch (error) {
              console.warn(`Lost connection to chat ${mapping.chatId}, removing mapping`);
              this.projectChannels.delete(mapping.projectId);
            }
          }
        } catch (error) {
          console.error('Error in health check:', error);
        }
      }, 360000);

      // Error handling
      this.bot.catch((err) => {
        console.error('Telegram bot error:', err);
      });

      // Start the bot with runner
      this.runner = run(this.bot, {runner: {
        retryInterval: 1000,
        maxRetryTime: 10000
      }});
      this.isRunning = true;

      // Load existing mappings
      await this.loadChannelMappings();

      // Handle graceful shutdown
      const stopBot = async () => {
        if (this.runner?.isRunning()) {
          await this.runner.stop();
          this.isRunning = false;
          this.runner = null;
        }
      };

      process.once('SIGINT', stopBot);
      process.once('SIGTERM', stopBot);
      
      // Add this to handle hot reloading
      if (process.env.NODE_ENV === 'development') {
        process.once('SIGUSR2', async () => {
          await stopBot();
          process.kill(process.pid, 'SIGUSR2');
        });
      }
    } catch (error) {
      console.error('Error setting up bot:', error);
      this.isRunning = false;
      this.runner = null;
      throw error;
    }
  }

  private async loadChannelMappings() {
    const mappings = await drizzle.query.telegramChannels.findMany();
    mappings.forEach((mapping) => {
      this.projectChannels.set(mapping.projectId, mapping.chatId);
    });
  }

  async sendNotification(message: ServiceMessage): Promise<void> {
    // Check if project is paused
    const pausedUntil = this.pausedProjects.get(message.projectId);
    if (pausedUntil) {
      if (pausedUntil > new Date()) {
        // Still paused
        return;
      }
      // Pause expired, remove it
      this.pausedProjects.delete(message.projectId);
    }

    const chatId = this.projectChannels.get(message.projectId);
    if (!chatId) {
      console.warn(`No Telegram chat found for project ${message.projectId}`);
      return;
    }

    try {
      await this.bot.api.sendChatAction(chatId, "typing");
      
      const severityEmoji = {
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
        critical: '🚨',
      };

      const formattedTime = format(message.timestamp, 'PPpp');

      const currentCount = this.getEventCount(message.projectId, message.eventName) || 0;
      const newCount = currentCount + 1;
      this.storeEventCount(message.projectId, message.eventName, newCount);

      const formattedMessage = `
${severityEmoji[message.severity]} *New Event in ${message.workflowName}*

*Event:* ${message.eventName}
*Description:* ${message.description}
*Severity:* ${message.severity}
*Tags:* ${message.tags.join(', ')}
*Next Event:* ${message.nextEvent || 'Not specified'}
*Time:* ${formattedTime}
*Count:* ${newCount}

*Payload:*
\`\`\`json
${JSON.stringify(message.payload, null, 2)}
\`\`\`
`;

      try {
        const existingMessageId = this.getExistingMessageId(message.projectId, message.eventName);
        if (existingMessageId) {
          await this.bot.api.editMessageText(chatId, existingMessageId, formattedMessage, {
            parse_mode: 'Markdown',
          });
        } else {
          const sentMessage = await this.bot.api.sendMessage(chatId, formattedMessage, {
            parse_mode: 'Markdown',
          });
          this.storeMessageId(message.projectId, message.eventName, sentMessage.message_id);
        }
      } catch (error) {
        if (error instanceof Error && ( error.message.includes('bot was blocked') || error.message.includes('chat not found'))) {
        
          this.projectChannels.delete(message.projectId);
          console.error(`Removed invalid chat mapping for project ${message.projectId}`);
        }
        throw error;
      }
    } catch (error) {
      console.error('Failed to send or edit Telegram notification:', error);
      throw error;
    }
  }

  // Helper methods to store and retrieve message IDs and counts
  private messageStore: Map<string, Map<string, number>> = new Map();
  private eventCountStore: Map<string, Map<string, number>> = new Map();

  private getExistingMessageId(projectId: string, eventName: string): number | undefined {
    return this.messageStore.get(projectId)?.get(eventName);
  }

  private storeMessageId(projectId: string, eventName: string, messageId: number): void {
    if (!this.messageStore.has(projectId)) {
      this.messageStore.set(projectId, new Map());
    }
    this.messageStore.get(projectId)!.set(eventName, messageId);
  }

  private getEventCount(projectId: string, eventName: string): number | undefined {
    return this.eventCountStore.get(projectId)?.get(eventName);
  }

  private storeEventCount(projectId: string, eventName: string, count: number): void {
    if (!this.eventCountStore.has(projectId)) {
      this.eventCountStore.set(projectId, new Map());
    }
    this.eventCountStore.get(projectId)!.set(eventName, count);
  }

  // Add a cleanup method
  public async cleanup() {
    if (this.runner?.isRunning()) {
      await this.runner.stop();
      this.isRunning = false;
      this.runner = null;
    }
  }

  // this is neccessa
    private setupCleanupHandlers() {
    process.on('exit', () => {
      console.debug('🧹 Cleaning up Telegram service on exit');
      this.cleanup();
    });

    process.on('uncaughtException', async (error) => {
      console.error('❌ Uncaught Exception:', error);
      console.debug('🧹 Cleaning up Telegram service after error');
      await this.cleanup();
      process.exit(1);
    });

    process.on('SIGINT', () => {
      console.debug('🛑 Received SIGINT, cleaning up Telegram service');
      this.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.debug('🛑 Received SIGTERM, cleaning up Telegram service');
      this.cleanup();
      process.exit(0);
    });
  }
}

