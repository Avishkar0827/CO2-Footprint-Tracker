import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import Calculation from '@/models/Calculation';
import rateLimit from 'express-rate-limit';
import { runMiddleware } from '@/lib/middleware';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  keyGenerator: (req) => {
    // Use user ID if available, otherwise fall back to IP
    return req.query.userId?.toString() || req.ip || 'unknown';
  },
  skip: (req) => {
    // Skip rate limiting for development
    return process.env.NODE_ENV === 'development';
  }
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await runMiddleware(req, res, limiter);

    // Set cache-control headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (req.method !== 'GET') {
      return res.status(405).json({ 
        success: false, 
        message: 'Method not allowed' 
      });
    }

    await dbConnect();

    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid user ID is required' 
      });
    }

    // Add debug log before query
    console.log(`Fetching calculations for user: ${userId}`);
    
    const calculations = await Calculation.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // Enhanced debug logging
    console.log(`Fetched ${calculations.length} calculations for user ${userId}`);
    if (calculations.length > 0) {
      console.log('Sample calculation:', {
        id: calculations[0]._id,
        createdAt: calculations[0].createdAt
      });
    }

    return res.status(200).json({
      success: true,
      data: calculations,
      message: 'Calculations retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching calculations:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}