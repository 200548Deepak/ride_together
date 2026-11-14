import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'blablacar_ride_together_super_secret_jwt_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'blablacar_ride_together_refresh_secret_jwt_key_2026';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: 'driver' | 'passenger';
}

/**
 * Sign a standard access token (valid for 24 hours)
 */
export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Sign a refresh token (valid for 30 days)
 */
export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '30d' });
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extract authenticated user payload from incoming NextRequest
 * Checks Authorization header first, then auth_token cookie
 */
export function getAuthUserFromRequest(req: NextRequest): TokenPayload | null {
  // 1. Check Authorization: Bearer <token>
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const verified = verifyAccessToken(token);
    if (verified) return verified;
  }

  // 2. Check cookies
  const cookieToken = req.cookies.get('auth_token')?.value;
  if (cookieToken) {
    const verified = verifyAccessToken(cookieToken);
    if (verified) return verified;
  }

  return null;
}
