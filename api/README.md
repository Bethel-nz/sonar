# Sonar - Event Monitoring System 🚀

Sonar is a real-time event monitoring and notification system that helps you track your application workflows through multiple channels including Telegram and Discord.

## 🛠 Setup

### Prerequisites

- [Bun](https://bun.sh) installed or any other runtime
- PostgreSQL database
- Redis server
- Telegram account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/sonar.git
cd sonar
```

2. Install dependencies:

```bash
bun install
```

3. Set up environment variables:

```env
# API Configuration
PORT=5390
NODE_ENV=development

# Database Configuration
DATABASE_URL="postgresql://postgres:5437@localhost:5437/sonar-db"

# Redis Configuration
REDIS_URL="redis://localhost:6379"

# JWT Secrets
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN="your-bot-token"
```

4. Initialize drizzle:

```bash
bun run db::generate
```

5. Run database migrations:

```bash
bun run db::migrate
```

6. Push the schema to the database:

```bash
bun run db::push
```

7. Start the server:

```bash
bun run dev
```

## 🤖 Setting Up Telegram Bot

1. **Create a New Bot**
   - Open Telegram and search for [@BotFather](https://t.me/BotFather)
   - Send `/newbot` command
   - Follow the prompts to set a name and username for your bot
   - Save the API token provided by BotFather

2. **Add Bot Token to Environment** - If you plan to run the bot locally
   - Add your bot token to `.env`:

   ```env
   TELEGRAM_BOT_TOKEN="your-bot-token"
   ```

3. **Connect Your Project**
   - Start a chat with your bot
   - Use the `/connect` command with your project ID and API key:

```
   /connect your_project_id your_api_key
   ```

## 📝 Usage Example

```typescript
import { workflow } from '@sonar/sdk';
import { z } from 'zod';

const myWorkflow = workflow('MyWorkflow', (wf) => {
  wf.on(
    'start',
    {
      description: 'Workflow started',
      severity: 'info',
      tags: ['start'],
      schema: z.object({ userId: z.string() }),
    },
    (data) => ({ startedBy: data.userId }),
    { service: ['Telegram'] }
  );
});

// Emit an event
await myWorkflow.emit({
  event: 'start',
  data: { userId: '123' }
});
```

## 🔐 Security Notes

1. **API Keys**
   - Keep your API keys secure
   - Don't commit `.env` files
   - Rotate keys periodically

2. **Telegram Bot**
   - Don't share your bot token
   - Use `/refresh` command if you suspect any issues
   - Bot messages with sensitive data auto-delete after 5 seconds

## 🚀 Features

- Real-time event notifications
- Multiple notification channels (Telegram, Discord)
- Type-safe event definitions
- Event history tracking
- Message deduplication
- Automatic reconnection
- Health checks
- Rate limiting
- Connection status monitoring

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
