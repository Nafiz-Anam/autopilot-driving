import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import httpStatus from 'http-status';
import prisma from '../client';
import config from '../config/config';
import ApiError from '../utils/ApiError';

const BRIDGE_TYP = 'nextauth_bridge';
const BRIDGE_REFRESH_TYP = 'nextauth_bridge_refresh';

const loginWithEmailPassword = async (email: string, password: string) => {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email: { equals: normalized, mode: 'insensitive' } },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      role: true,
    },
  });

  if (!user?.password) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  const secret = config.nextAuthBridge.secret;
  if (!secret || secret.length < 32) {
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'App authentication is not configured');
  }

  const accessSignOptions: SignOptions = {
    expiresIn: (process.env.APP_LOGIN_JWT_EXPIRES ?? '30m') as SignOptions['expiresIn'],
    algorithm: 'HS256',
  };
  const token = jwt.sign({ sub: user.id, typ: BRIDGE_TYP }, secret, accessSignOptions);

  const refreshSecret = config.nextAuthBridge.refreshSecret;
  const refreshSignOptions: SignOptions = {
    expiresIn: (process.env.APP_LOGIN_JWT_REFRESH_EXPIRES ?? '30d') as SignOptions['expiresIn'],
    algorithm: 'HS256',
  };
  const refreshToken = jwt.sign(
    { sub: user.id, typ: BRIDGE_REFRESH_TYP },
    refreshSecret,
    refreshSignOptions
  );

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
};

const refreshAccessToken = async (refreshToken: string) => {
  const refreshSecret = config.nextAuthBridge.refreshSecret;

  let payload: { sub?: string; typ?: string };
  try {
    payload = jwt.verify(refreshToken, refreshSecret) as { sub?: string; typ?: string };
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired refresh token');
  }

  if (payload.typ !== BRIDGE_REFRESH_TYP) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired refresh token');
  }

  const userId = payload.sub;
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired refresh token');
  }

  const secret = config.nextAuthBridge.secret;
  if (!secret || secret.length < 32) {
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'App authentication is not configured');
  }

  const accessSignOptions: SignOptions = {
    expiresIn: (process.env.APP_LOGIN_JWT_EXPIRES ?? '30m') as SignOptions['expiresIn'],
    algorithm: 'HS256',
  };
  const token = jwt.sign({ sub: user.id, typ: BRIDGE_TYP }, secret, accessSignOptions);

  return { token };
};

export default {
  loginWithEmailPassword,
  refreshAccessToken,
};
