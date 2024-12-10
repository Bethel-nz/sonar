# 🚀 Sonar: Event Notification System

Sonar is an open-source self hostable event notification system that helps you monitor your application workflows in real-time through Discord and Telegram.

## 🌟 Features

- **Self-Hostable**: Sonar is completely open-sourced and self-hostable, you own your own data
- **Real-time Notifications**: Instant updates about your workflow events
- **Multiple Services**: Support for both Discord and Telegram
- **Type-Safe SDK**: Built with TypeScript for reliable integration
- **Flexible Workflows**: Define custom workflows with event chains
- **Rich Notifications**: Detailed event information with customizable formatting
- **Pause Control**: Temporarily pause notifications when needed
- **Multiple Projects**: Manage multiple projects from one interface
- **Event Chaining**: Define what happens next after each event
- **Custom Callbacks**: Execute code after specific events

## 🛠️ Installation

```bash
npm install @sonar/sdk
# or
yarn add @sonar/sdk
# or
pnpm add @sonar/sdk
# or
bun add @sonar/sdk
```

## ⚙️ Configuration

Add these environment variables to your `.env` file:

```env
SONAR_API_KEY=your_api_key
SONAR_BASE_URL=your_api_endpoint
SONAR_PROJECT_ID=your_project_id
```

## 🚀 Quick Start

```typescript
import { workflow } from '@sonar/sdk';
import { z } from 'zod';

// Define your workflow events
type UserSignupEvents = {
  started: {
    data: { email: string; username: string };
  };
  completed: {
    data: { userId: string; email: string };
  };
};

// Create a workflow
const signupFlow = workflow<UserSignupEvents>('UserSignup', (wf) => {
  wf.on(
    'started',
    {
      description: 'User signup initiated',
      severity: 'info',
      tags: ['auth', 'signup'],
      schema: z.object({ 
        email: z.string().email(),
        username: z.string() 
      })
    },
    (data) => ({
      user: data.username,
      email: data.email
    }),
    { service: ['Discord', 'Telegram'] }
  ).next('completed');
});

// Emit events
await signupFlow.emit({
  event: 'started',
  data: {
    email: 'user@example.com',
    username: 'newuser'
  }
});
```

## 📱 Bot Setup

### Discord
1. Invite the bot to your server using the provided link
2. Use `/connect <project_id> <api_key>` in your desired channel
3. Use `/help` to see all available commands

### Telegram
1. Start a chat with @SonarNotifyBot
2. Use `/connect <project_id> <api_key>` to link your project
3. Use `/help` to see all available commands

## 🤖 Bot Commands

Both Discord and Telegram bots support:
- `/connect` - Link a channel to your project
- `/disconnect` - Remove project link
- `/status` - Check connection status
- `/pause` - Pause notifications temporarily
- `/resume` - Resume notifications
- `/help` - Show all commands

## 📚 Documentation

Still a work in progress

See [examples](./usage) directory for more use cases and patterns.

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- [GitHub Repository](https://github.com/Bethel-nz/sonar)
- [Issue Tracker](https://github.com/Bethel-nz/sonar/issues)
- [Privacy Policy](privacy-policy.md)
