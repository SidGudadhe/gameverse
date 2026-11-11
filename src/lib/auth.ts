import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'gameverse-secure-production-jwt-key-2026';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: {
  userId: string;
  email: string;
  role: UserRole;
  name?: string;
}): string {
  const completePayload: TokenPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    name: payload.name || payload.email.split('@')[0],
  };
  return jwt.sign(completePayload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  GUEST: 0,
  PLAYER: 1,
  DEVELOPER: 2,
  MODERATOR: 3,
  FINANCE: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5,
};

export function hasRequiredRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
