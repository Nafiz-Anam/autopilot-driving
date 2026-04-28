import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import config from './config/config';
import logger from './config/logger';

// add prisma to the NodeJS global type
interface CustomNodeJsGlobal {
  prisma: PrismaClient;
}

// Prevent multiple instances of Prisma Client in development
declare const global: CustomNodeJsGlobal;

let connectionString = process.env.DATABASE_URL;

// Fix SSL mode to avoid PostgreSQL warnings
if (connectionString) {
  // Remove any existing sslmode parameter
  const url = new URL(connectionString);
  const originalSslMode = url.searchParams.get('sslmode');
  url.searchParams.delete('sslmode');
  // Add the correct sslmode
  url.searchParams.set('sslmode', 'verify-full');
  connectionString = url.toString();

  if (originalSslMode !== 'verify-full') {
    logger.info('Fixed SSL mode from', { originalSSL: originalSslMode, newSSL: 'verify-full' });
  }
}

const adapter = new PrismaPg({ connectionString });

const prisma = global.prisma || new PrismaClient({ adapter });

if (config.env === 'development') global.prisma = prisma;

export default prisma;
