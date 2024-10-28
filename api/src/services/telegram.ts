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
  private static instance: TelegramService;
  private bot: Bot<MyContext>;
  private projectChannels: Map<string, string> = new Map(); // projectId -> chatId
  private isRunning: boolean = false;

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

    // Add refresh command to command list
    await this.bot.api.setMyCommands([
      { command: 'start', description: 'Start the bot' },
      { command: 'connect', description: 'Connect to a project' },
      { command: 'help', description: 'Show help' },
      { command: 'status', description: 'Check connection status' },
      { command: 'refresh', description: 'Refresh bot connection' },
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
        '/help - Show this help message\n\n' +
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
    }, 360000); // Check every minute

    // Error handling
    this.bot.catch((err) => {
      console.error('Telegram bot error:', err);
    });

    // Start the bot with runner for better concurrency handling
    const runner = run(this.bot);
    this.isRunning = true;

    // Load existing mappings
    await this.loadChannelMappings();

    // Handle graceful shutdown
    const stopRunner = () => {
      if (runner.isRunning()) {
        runner.stop();
        this.isRunning = false;
      }
    };
    
    process.once('SIGINT', stopRunner);
    process.once('SIGTERM', stopRunner);
  }

  private async loadChannelMappings() {
    const mappings = await drizzle.query.telegramChannels.findMany();
    mappings.forEach((mapping) => {
      this.projectChannels.set(mapping.projectId, mapping.chatId);
    });
  }

  async sendNotification(message: ServiceMessage): Promise<void> {
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
}
