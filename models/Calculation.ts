import mongoose, { Document, Schema, model, models } from 'mongoose';

interface ICalculation extends Document {
  userId: mongoose.Types.ObjectId;
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
  updatedAt: Date;
}

const CalculationSchema = new Schema<ICalculation>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dateRange: {
      from: { type: Date, required: true },
      to: { type: Date, required: true },
      days: { type: Number, required: true },
    },
    userType: {
      type: String,
      enum: ['individual', 'family'],
      required: true,
    },
    householdSize: {
      type: Number,
      required: true,
    },
    inputs: {
      energy: {
        electricity: { type: Number, default: 0 },
        naturalGas: { type: Number, default: 0 },
        gasoline: { type: Number, default: 0 },
        diesel: { type: Number, default: 0 },
      },
      transportation: {
        carDistance: { type: Number, default: 0 },
        flightDistance: { type: Number, default: 0 },
        busDistance: { type: Number, default: 0 },
        trainDistance: { type: Number, default: 0 },
      },
      waste: {
        landfill: { type: Number, default: 0 },
        recycling: { type: Number, default: 0 },
      },
      water: {
        consumption: { type: Number, default: 0 },
      },
      food: {
        meat: { type: Number, default: 0 },
        dairy: { type: Number, default: 0 },
      },
    },
    results: {
      energy: { type: Number, required: true },
      transport: { type: Number, required: true },
      waste: { type: Number, required: true },
      water: { type: Number, required: true },
      food: { type: Number, required: true },
      total: { type: Number, required: true },
      perPerson: { type: Number, required: true },
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
CalculationSchema.index({ userId: 1 });

const Calculation: mongoose.Model<ICalculation> =
  models.Calculation || model<ICalculation>('Calculation', CalculationSchema);

export default Calculation;