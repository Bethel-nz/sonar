# Contributing to Sonar

We love your input! We want to make contributing to Sonar as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## We Develop with GitHub

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Development Process

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Any contributions you make will be under the MIT Software License

When you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project.

## Report bugs using GitHub's [issue tracker](https://github.com/Bethel-nz/sonar/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/Bethel-nz/sonar/issues/new).

## Write bug reports with detail, background, and sample code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can.
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Local Development Setup

1. Clone the repository
```bash
git clone https://github.com/Bethel-nz/sonar.git
cd sonar
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
```bash
# Copy example env file
cp .env.example .env

# Required variables:
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
DATABASE_URL=your_database_url
FRONTEND_ORIGIN=http://localhost:3000
```

4. Setup the database
```bash
pnpm db:push
```

5. Start development server
```bash
# Start API server
pnpm dev:api

# In another terminal, start SDK development
pnpm dev:sdk
```

## Project Structure

```
sonar/
├── api/              # API server
│   ├── src/
│   │   ├── routes/   # API routes
│   │   ├── services/ # Bot services
│   │   └── middleware/
├── sdk/              # SDK package
│   ├── src/
│   │   └── index.ts
└── usage/         # Usage examples
```

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Make your code as readable as it can be,No code is bad code except unreadable code
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Commits
- Use clear, descriptive commit messages
- Reference issues and pull requests liberally
- Keep commits focused and atomic

### Testing
- Add tests for new features
- Update tests when modifying existing features
- Ensure all tests pass before submitting PR

### Documentation
- Update README.md with new features
- Update API documentation when needed
- Include examples for new features

## Pull Request Process

1. Update the README.md with details of changes to the interface
2. Update the documentation with any new features
3. The PR will be merged once you have the sign-off of at least one maintainer

## Community

- Be welcoming to newcomers
- Help others learn and grow

## Questions?

Feel free to [open an issue](https://github.com/Bethel-nz/sonar/issues/new) with your question.

## License

By contributing, you agree that your contributions will be licensed under its MIT License.