import { NextApiRequest, NextApiResponse } from 'next';
import Calculation from '@/models/Calculation';
import connectToDB from '@/lib/dbConnect';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectToDB();

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ success: false, message: 'ID required' });
      }

      const deletedCalc = await Calculation.findByIdAndDelete(id);
      
      if (!deletedCalc) {
        return res.status(404).json({ success: false, message: 'Not found' });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Deleted successfully',
        data: deletedCalc 
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Server error' 
      });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}