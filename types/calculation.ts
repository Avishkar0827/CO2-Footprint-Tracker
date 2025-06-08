// types/calculation.ts
import { Document } from 'mongoose';

export interface ICalculation extends Document {
  userId: string;
  dateRange: {
    from: Date;
    to: Date;
    days: number;
  };
  userType: 'individual' | 'family';
  householdSize: number;
  inputs: {
    energy: {
      electricity: number;
      naturalGas: number;
      gasoline: number;
      diesel: number;
    };
    transportation: {
      carDistance: number;
      flightDistance: number;
      busDistance: number;
      trainDistance: number;
    };
    waste: {
      landfill: number;
      recycling: number;
    };
    water: {
      consumption: number;
    };
    food: {
      meat: number;
      dairy: number;
    };
  };
  results: {
    energy: number;
    transport: number;
    waste: number;
    water: number;
    food: number;
    total: number;
    perPerson: number;
  };
  createdAt: Date;
}