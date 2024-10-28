import { WebhookClient, EmbedBuilder } from 'discord.js';
import { NotificationService, ServiceMessage } from './types';

export class DiscordService implements NotificationService {
  private webhook: WebhookClient;

  constructor() {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      throw new Error('Discord webhook URL missing');
    }

    this.webhook = new WebhookClient({ url: webhookUrl });
  }

  async sendNotification(message: ServiceMessage): Promise<void> {
    const severityColors = {
      info: 0x3498db, // Blue
      warn: 0xf1c40f, // Yellow
      error: 0xe74c3c, // Red
      critical: 0x992d22, // Dark Red
    };

    const embed = new EmbedBuilder()
      .setTitle(`New Event in ${message.workflowName}`)
      .setColor(severityColors[message.severity])
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

    try {
      await this.webhook.send({
        embeds: [embed],
      });
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
      throw error;
    }
  }
}
