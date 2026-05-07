import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import httpStatus from 'http-status';
import prisma from '../client';
import config from '../config/config';
import ApiError from '../utils/ApiError';

const BRIDGE_TYP = 'nextauth_bridge';

const loginWithEmailPassword = async (email: string, password: string) => {
  const normalized = email.trim().toLowerCase();
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      email: string;
      name: string | null;
      passwordHash: string | null;
      role: string;
    }>
  >(
    `SELECT id, email, name, "passwordHash", role::text AS role FROM "User" WHERE LOWER(email) = $1 LIMIT 1`,
    normalized
  );
  const user = rows[0];
  if (!user?.passwordHash) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  const secret = config.nextAuthBridge.secret;
  if (!secret || secret.length < 32) {
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'App authentication is not configured');
  }

  const signOptions: SignOptions = {
    expiresIn: (process.env.APP_LOGIN_JWT_EXPIRES ?? '12h') as SignOptions['expiresIn'],
    algorithm: 'HS256',
  };
  const token = jwt.sign({ sub: user.id, typ: BRIDGE_TYP }, secret, signOptions);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
};

export default {
  loginWithEmailPassword,
};
