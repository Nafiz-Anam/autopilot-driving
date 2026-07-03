import { Server } from 'http';
import app from './app';
import prisma from './client';
import config from './config/config';
import logger from './config/logger';
import tokenCleanupService from './services/tokenCleanup.service';
import { initializeWebSocket } from './controllers/websocket.controller';
import { initializeTracing } from './utils/tracing';
import googleCalendarSyncService from './services/googleCalendarSync.service';
import appleCalendarService from './services/appleCalendar.service';

// Initialize OpenTelemetry tracing
initializeTracing();

logger.debug('Starting application initialization...');

let server: Server;
prisma
  .$connect()
  .then(() => {
    logger.info('Connected to SQL Database');
    logger.debug('Attempting to start HTTP server...');

    // Initialize WebSocket server
    initializeWebSocket();

    server = app.listen(config.port, () => {
      logger.info(`Listening to port ${config.port}`);
      logger.info(`🚀 API Server running at http://localhost:${config.port}`);
      logger.info(`📚 API Documentation available at http://localhost:${config.port}/v1/docs`);
      logger.info(`🔌 WebSocket server running on port ${process.env.WS_PORT || '8080'}`);
      logger.debug('Server started successfully');

      // Schedule token cleanup to run every 15 minutes
      tokenCleanupService.scheduleTokenCleanup(15);

      // Google Calendar sync: renew expiring watches every 6h, cleanup past busy blocks daily.
      // Kick a first pass 30s after boot so restarts w/ soon-to-expire channels self-heal.
      const SIX_HOURS = 6 * 60 * 60 * 1000;
      const ONE_DAY = 24 * 60 * 60 * 1000;

      setTimeout(() => {
        googleCalendarSyncService.renewExpiringWatches().catch(e =>
          logger.warn('watch renewal failed', { error: e?.message })
        );
      }, 30_000);

      setInterval(() => {
        googleCalendarSyncService.renewExpiringWatches().catch(e =>
          logger.warn('watch renewal failed', { error: e?.message })
        );
      }, SIX_HOURS);

      setInterval(() => {
        googleCalendarSyncService.cleanupPastBusyBlocks().catch(e =>
          logger.warn('busy block cleanup failed', { error: e?.message })
        );
      }, ONE_DAY);

      // Apple Calendar: pull all connected ICS feeds every 15min
      const FIFTEEN_MIN = 15 * 60 * 1000;
      setTimeout(() => {
        appleCalendarService.syncAll().catch(e =>
          logger.warn('apple ics sync failed', { error: e?.message })
        );
      }, 45_000);
      setInterval(() => {
        appleCalendarService.syncAll().catch(e =>
          logger.warn('apple ics sync failed', { error: e?.message })
        );
      }, FIFTEEN_MIN);
    });
  })
  .catch((error: Error) => {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  });

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error: unknown) => {
  logger.error(error);
  // Only exit on critical errors, not on SMTP or non-critical issues
  if (
    error instanceof Error &&
    (error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('SMTP') ||
      error.message.includes('email'))
  ) {
    // Don't exit on SMTP/email related errors
    logger.warn('Non-critical error detected, server will continue running');
    return;
  }
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
