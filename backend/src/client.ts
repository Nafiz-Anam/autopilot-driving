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

// Enforce SSL only in production; local/Docker dev Postgres has no SSL configured
if (connectionString && config.env === 'production') {
  const url = new URL(connectionString);
  if (!url.searchParams.get('sslmode')) {
    url.searchParams.set('sslmode', 'require');
    connectionString = url.toString();
  }
}

const adapter = new PrismaPg({ connectionString });

const prisma = global.prisma || new PrismaClient({ adapter });

if (config.env === 'development') global.prisma = prisma;

export default prisma;
