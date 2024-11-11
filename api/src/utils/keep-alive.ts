import { CronJob } from 'cron';
import drizzle from '~drizzle';
import { logger } from './logger';

export function startKeepAliveJob() {
  const job = new CronJob('*/5 * * * *', async () => {
    try {
      await drizzle.query.projects.findFirst();
      logger.debug('Database keep-alive ping successful');
    } catch (error) {
      logger.error({ 
        err: error, 
        msg: 'Database keep-alive ping failed' 
      });
    }
  });

  job.start();
  logger.info('Database keep-alive job started');

  return job;
} 