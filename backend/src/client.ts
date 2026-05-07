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

// Respect DATABASE_URL as-is. Some production deployments (Docker internal Postgres)
// intentionally run without SSL and fail if sslmode=require is forced.

const adapter = new PrismaPg({ connectionString });

const prisma = global.prisma || new PrismaClient({ adapter });

if (config.env === 'development') global.prisma = prisma;

export default prisma;
