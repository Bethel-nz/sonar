import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

// Browser-specific transport configuration
const browserTransport = {
  target: 'pino/browser',
  options: {
    // Only show debug logs in development
    transmit: {
      level: isDevelopment ? 'debug' : 'error',
      send: (level: string, logEvent: any) => {
        const { time, ...rest } = logEvent;
        const console = window.console as any;
        console[level]?.({
          ...rest,
          time: new Date(time).toISOString()
        });
      },
    },
  },
};

export const logger = pino({
  level: isDevelopment ? 'debug' : 'error',
  browser: {
    asObject: true,
  },
  transport: browserTransport,
}); 