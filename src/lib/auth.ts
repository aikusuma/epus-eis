// JWT Authentication utilities using jose
// Used for: Token generation and verification

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'your-super-secret-key-change-in-production'
);

const JWT_ISSUER = 'epus-eis';
const JWT_AUDIENCE = 'epus-eis-users';

export interface UserPayload extends JWTPayload {
  userId: string;
  email: string;
  roleCode: string;
  puskesmasId?: string;
  wilayahId?: string;
  permissions: string[];
}

export async function createToken(
  payload: Omit<UserPayload, 'iat' | 'exp' | 'iss' | 'aud'>
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime('8h') // 8 hours session
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });
    return payload as UserPayload;
  } catch {
    return null;
  }
}

export async function createRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setExpirationTime('7d') // 7 days refresh
    .sign(JWT_SECRET);
}
