import { TelegramService } from './telegram';
import { DiscordService } from './discord';
import { NotificationService, ServiceMessage } from './types';

export class ServiceManager {
  private services: Map<string, NotificationService>;

  constructor() {
    this.services = new Map();
    this.initializeServices();
  }

  private initializeServices() {
    if (process.env.TELEGRAM_BOT_TOKEN!) {
      this.services.set('Telegram', TelegramService.getInstance());
    }

    if (process.env.DISCORD_WEBHOOK_URL) {
      this.services.set('Discord', new DiscordService());
    }
  }

  async notify(services: string[], message: ServiceMessage): Promise<void> {
    const notifications = services.map(serviceName => {
      const service = this.services.get(serviceName);
      if (!service) {
        console.warn(`Service ${serviceName} not configured`);
        return Promise.resolve();
      }
      return service.sendNotification(message);
    });

    await Promise.all(notifications);
  }
}

export const serviceManager = new ServiceManager();
