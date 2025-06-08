"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Car, Trash2, Droplet, ShoppingCart, Home, User, ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import { DateRange } from "react-day-picker";
import { addDays, format, differenceInDays } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { saveCalculation } from "@/services/calculationService";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// Emission factors
const EMISSION_FACTORS = {
  electricity: 0.85,
  naturalGas: 2.0,
  gasoline: 2.3,
  diesel: 2.7,
  flight: 0.25,
  car: 0.12,
  bus: 0.08,
  train: 0.05,
  waste: 0.5,
  water: 0.3,
  meat: 15,
  dairy: 5,
};

export default function CarbonCalculator() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [userType, setUserType] = useState<"individual" | "family" | "">("");
  const [householdSize, setHouseholdSize] = useState(1);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    energy: { electricity: 0, naturalGas: 0, gasoline: 0, diesel: 0 },
    transportation: { carDistance: 0, flightDistance: 0, busDistance: 0, trainDistance: 0 },
    waste: { landfill: 0, recycling: 0 },
    water: { consumption: 0 },
    food: { meat: 0, dairy: 0 },
  });

  const categories = [
    {
      name: "Energy",
      icon: Zap,
      subCategories: [
        { name: "Electricity", unit: "kWh", key: "electricity" },
        { name: "Natural Gas", unit: "m³", key: "naturalGas" },
        { name: "Gasoline", unit: "L", key: "gasoline" },
        { name: "Diesel", unit: "L", key: "diesel" },
      ],
    },
    {
      name: "Transportation",
      icon: Car,
      subCategories: [
        { name: "Car Distance", unit: "km", key: "carDistance" },
        { name: "Flight Distance", unit: "km", key: "flightDistance" },
        { name: "Bus Distance", unit: "km", key: "busDistance" },
        { name: "Train Distance", unit: "km", key: "trainDistance" },
      ],
    },
    {
      name: "Waste",
      icon: Trash2,
      subCategories: [
        { name: "Landfill Waste", unit: "kg", key: "landfill" },
        { name: "Recycling", unit: "kg", key: "recycling" },
      ],
    },
    {
      name: "Water",
      icon: Droplet,
      subCategories: [
        { name: "Water Consumption", unit: "m³", key: "consumption" },
      ],
    },
    {
      name: "Food",
      icon: ShoppingCart,
      subCategories: [
        { name: "Meat Consumption", unit: "kg", key: "meat" },
        { name: "Dairy Consumption", unit: "kg", key: "dairy" },
      ],
    },
  ];

  const currentCategory = categories[currentCategoryIndex];

  const calculateEmissions = () => {
    if (!dateRange?.from || !dateRange?.to) return {
      energy: 0,
      transport: 0,
      waste: 0,
      water: 0,
      food: 0,
      total: 0,
      perPerson: 0,
      days: 0,
    };

    const days = differenceInDays(dateRange.to, dateRange.from) + 1;
    const periodFactor = days / 30; // Normalize to monthly equivalent

    const energyEmissions =
      (formData.energy.electricity * EMISSION_FACTORS.electricity) +
      (formData.energy.naturalGas * EMISSION_FACTORS.naturalGas) +
      (formData.energy.gasoline * EMISSION_FACTORS.gasoline) +
      (formData.energy.diesel * EMISSION_FACTORS.diesel);

    const transportEmissions =
      (formData.transportation.carDistance * EMISSION_FACTORS.car) +
      (formData.transportation.flightDistance * EMISSION_FACTORS.flight) +
      (formData.transportation.busDistance * EMISSION_FACTORS.bus) +
      (formData.transportation.trainDistance * EMISSION_FACTORS.train);

    const wasteEmissions = formData.waste.landfill * EMISSION_FACTORS.waste;
    const waterEmissions = formData.water.consumption * EMISSION_FACTORS.water;
    const foodEmissions =
      (formData.food.meat * EMISSION_FACTORS.meat) +
      (formData.food.dairy * EMISSION_FACTORS.dairy);

    const total = (energyEmissions + transportEmissions + wasteEmissions + waterEmissions + foodEmissions) * periodFactor;

    return {
      energy: energyEmissions * periodFactor,
      transport: transportEmissions * periodFactor,
      waste: wasteEmissions * periodFactor,
      water: waterEmissions * periodFactor,
      food: foodEmissions * periodFactor,
      total: total,
      perPerson: total / (userType === "family" ? householdSize : 1),
      days: days,
    };
  };

  const emissions = calculateEmissions();

  const handleInputChange = (category: keyof typeof formData, key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: parseFloat(value) || 0,
      },
    }));
  };

  const getReductionSuggestions = () => {
    const suggestions = [];
    if (emissions.energy > 1000) suggestions.push("Use renewable energy sources or install solar panels.");
    if (emissions.transport > 500) suggestions.push("Prefer public transport, carpool, or cycle.");
    if (emissions.food > 300) suggestions.push("Reduce meat and dairy consumption.");
    if (emissions.waste > 200) suggestions.push("Recycle and compost more.");
    if (suggestions.length === 0) suggestions.push("Great job! Your carbon footprint is low.");
    return suggestions;
  };

  const handleSaveCalculation = async () => {
    if (!user) {
      alert('Please sign in to save calculations');
      return;
    }

    if (!dateRange?.from || !dateRange?.to || !userType) {
      alert('Please complete all required fields');
      return;
    }

    const hasInputs = Object.values(formData).some(category => 
      Object.values(category).some(value => value > 0)
    );
    
    if (!hasInputs) {
      alert('Please enter at least one calculation input');
      return;
    }

    setIsSaving(true);
    try {
      const calculationData = {
        userId: user._id,
        dateRange: {
          from: dateRange.from,
          to: dateRange.to,
          days: differenceInDays(dateRange.to, dateRange.from) + 1
        },
        userType,
        householdSize,
        inputs: formData,
        results: {
          energy: emissions.energy,
          transport: emissions.transport,
          waste: emissions.waste,
          water: emissions.water,
          food: emissions.food,
          total: emissions.total,
          perPerson: emissions.perPerson
        }
      };

      await saveCalculation(calculationData as Omit<any, '_id' | 'createdAt'>);
      setSaveSuccess(true);
    } catch (error) {
      console.error('Failed to save calculation:', error);
      alert('Failed to save calculation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 flex justify-center items-center">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg p-10 space-y-10">

        {/* Title */}
        <h1 className="text-4xl font-bold text-center mb-6">Carbon Footprint Calculator</h1>

        {/* Step 0 */}
        {step === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex flex-col md:flex-row justify-center items-center gap-8">
              <Button variant="outline" className="h-48 w-72 flex flex-col justify-center items-center space-y-4 text-xl" onClick={() => { setUserType("individual"); setStep(1); }}>
                <User size={60} className="mb-2" />
                <span>Individual</span>
              </Button>
              <Button variant="outline" className="h-48 w-72 flex flex-col justify-center items-center space-y-4 text-xl" onClick={() => { setUserType("family"); setStep(1); }}>
                <Home size={60} className="mb-2" />
                <span>Family</span>
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="space-y-4">
              <Label className="text-xl">Select Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className="w-full h-14 justify-start text-left font-normal text-lg"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" side="bottom">
  <div className="max-h-[80vh] overflow-y-auto">
    <CalendarComponent
      initialFocus
      mode="range"
      defaultMonth={dateRange?.from}
      selected={dateRange}
      onSelect={setDateRange}
      numberOfMonths={1} // Changed from 2 to 1 for better mobile experience
    />
  </div>
</PopoverContent>
              </Popover>
              {dateRange?.from && dateRange?.to && (
                <div className="text-sm text-gray-500">
                  Selected period: {differenceInDays(dateRange.to, dateRange.from) + 1} days
                </div>
              )}
            </div>

            {userType === "family" && (
              <div className="space-y-4">
                <Label className="text-xl">Household Size</Label>
                <Input
                  type="number"
                  min="1"
                  value={householdSize}
                  onChange={(e) => setHouseholdSize(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-14 text-lg"
                />
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-2xl font-semibold text-center mb-6">{currentCategory.name} Inputs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentCategory.subCategories.map((sub) => (
                <div key={sub.key} className="space-y-2">
                  <Label className="text-lg">{sub.name} ({sub.unit})</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    className="h-16 text-lg"
                    value={(formData as any)[currentCategory.name.toLowerCase()][sub.key] || ""}
                    onChange={(e) => handleInputChange(currentCategory.name.toLowerCase() as keyof typeof formData, sub.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {saveSuccess ? (
              <div className="text-center space-y-4">
                <div className="text-2xl font-bold text-green-600">Emissions saved successfully!</div>
                <p className="text-lg">Your carbon footprint data has been saved to your dashboard.</p>
                <Button 
                  onClick={() => router.push('/dashboard')}
                  className="h-12 text-lg bg-green-600 hover:bg-green-700"
                >
                  Go to Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12 text-lg" 
                  onClick={() => {
                    setSaveSuccess(false);
                    setStep(0);
                    setUserType("");
                    setHouseholdSize(1);
                    setFormData({
                      energy: { electricity: 0, naturalGas: 0, gasoline: 0, diesel: 0 },
                      transportation: { carDistance: 0, flightDistance: 0, busDistance: 0, trainDistance: 0 },
                      waste: { landfill: 0, recycling: 0 },
                      water: { consumption: 0 },
                      food: { meat: 0, dairy: 0 },
                    });
                    setCurrentCategoryIndex(0);
                    setDateRange({
                      from: new Date(),
                      to: addDays(new Date(), 7),
                    });
                  }}
                >
                  Start New Calculation
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-center">Results</h2>

                <div className="space-y-2">
                  <div>Energy: {emissions.energy.toFixed(2)} kg CO₂</div>
                  <div>Transport: {emissions.transport.toFixed(2)} kg CO₂</div>
                  <div>Waste: {emissions.waste.toFixed(2)} kg CO₂</div>
                  <div>Water: {emissions.water.toFixed(2)} kg CO₂</div>
                  <div>Food: {emissions.food.toFixed(2)} kg CO₂</div>
                  
                  {userType === "family" ? (
                    <>
                      <div className="font-bold mt-4">Total Family Emissions: {emissions.total.toFixed(2)} kg CO₂ over {emissions.days} days</div>
                      <div className="font-bold">Per Person Emissions: {emissions.perPerson.toFixed(2)} kg CO₂ (for {householdSize} {householdSize === 1 ? 'person' : 'people'})</div>
                    </>
                  ) : (
                    <div className="font-bold mt-4">Total: {emissions.total.toFixed(2)} kg CO₂ over {emissions.days} days</div>
                  )}
                </div>

                <div className="bg-green-100 p-4 rounded-lg space-y-2">
                  <h3 className="font-semibold">Suggestions:</h3>
                  <ul className="list-disc pl-5">
                    {getReductionSuggestions().map((s, i) => (<li key={i}>{s}</li>))}
                  </ul>
                </div>

                <div className="flex justify-center gap-4">
                  <Button 
                    onClick={handleSaveCalculation}
                    className="h-12 text-lg"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Calculation'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12 text-lg" 
                    onClick={() => {
                      setStep(0);
                      setUserType("");
                      setHouseholdSize(1);
                      setFormData({
                        energy: { electricity: 0, naturalGas: 0, gasoline: 0, diesel: 0 },
                        transportation: { carDistance: 0, flightDistance: 0, busDistance: 0, trainDistance: 0 },
                        waste: { landfill: 0, recycling: 0 },
                        water: { consumption: 0 },
                        food: { meat: 0, dairy: 0 },
                      });
                      setCurrentCategoryIndex(0);
                      setDateRange({
                        from: new Date(),
                        to: addDays(new Date(), 7),
                      });
                    }}
                  >
                    Start Over
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Navigation buttons */}
        {step !== 3 && !saveSuccess && (
          <div className="flex justify-between">
            {step > 0 && (
              <Button variant="outline" className="h-12 text-lg" onClick={() => {
                if (step === 2 && currentCategoryIndex > 0) {
                  setCurrentCategoryIndex(currentCategoryIndex - 1);
                } else {
                  setStep(step - 1);
                }
              }}>
                <ArrowLeft className="mr-2" /> Back
              </Button>
            )}
            <Button className="h-12 text-lg" onClick={() => {
              if (step === 1 && (!dateRange?.from || !dateRange?.to)) {
                alert("Please select a date range");
                return;
              }
              if (step === 2 && currentCategoryIndex < categories.length - 1) {
                setCurrentCategoryIndex(currentCategoryIndex + 1);
              } else {
                setStep(step + 1);
              }
            }}>
              Next <ArrowRight className="ml-2" />
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}