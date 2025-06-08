// pages/api/calculations/save.ts
import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import Calculation from '@/models/Calculation';
import rateLimit from 'express-rate-limit';
import { runMiddleware } from '@/lib/middleware';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  keyGenerator: (req) => {
    // Get IP address from x-forwarded-for header or fallback to connection remoteAddress
    const forwarded = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwarded) 
      ? forwarded[0]?.split(',')[0]?.trim()
      : forwarded?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    return ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later'
    });
  }
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await runMiddleware(req, res, limiter);
    
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    await dbConnect();

    // Extract userId from request body
    const { userId, ...calculationData } = req.body;

    // Validate userId exists
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    // Validate calculation data exists
    if (!calculationData || Object.keys(calculationData).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Calculation data is required' 
      });
    }

    // Create calculation with userId
    const calculation = await Calculation.create({
      userId,
      ...calculationData
    });

    return res.status(201).json({
      success: true,
      data: calculation,
      message: 'Calculation saved successfully'
    });
  } catch (error) {
    console.error('Error saving calculation:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('validation failed')) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation error: ' + error.message 
        });
      }
      
      if (error.message === 'Too many requests') {
        return res.status(429).json({ 
          success: false, 
          message: 'Too many requests, please try again later' 
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error while saving calculation'
    });
  }
}