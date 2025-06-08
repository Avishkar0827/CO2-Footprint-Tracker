// lib/auth.ts
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { NextApiResponse } from 'next';

const JWT_SECRET = process.env.JWT_SECRET as string;
const MAX_AGE = 60 * 60 * 24 * 7; // 1 week

interface TokenPayload {
  userId: string;
}

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: MAX_AGE,
  });
};

export const setTokenCookie = (res: NextApiResponse, token: string): void => {
  const cookieOptions = {
    maxAge: MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'strict' as const,
  };

  res.setHeader('Set-Cookie', serialize('token', token, cookieOptions));
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};

export const getTokenFromCookie = (req: { headers: { cookie?: string } }): string | null => {
  if (!req.headers.cookie) return null;
  
  const cookieArray = req.headers.cookie.split(';');
  const tokenCookie = cookieArray.find(c => c.trim().startsWith('token='));
  
  if (!tokenCookie) return null;
  
  return tokenCookie.split('=')[1];
};

export const getClientToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const cookies = document.cookie.split('; ');
  const tokenCookie = cookies.find(row => row.startsWith('token='));
  
  return tokenCookie ? tokenCookie.split('=')[1] : null;
};