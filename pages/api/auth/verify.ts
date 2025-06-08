// pages/api/auth/verify.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ valid: false });
  }

  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ valid: false });
  }

  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ valid: false });
  }

  return res.status(200).json({ valid: true });
}