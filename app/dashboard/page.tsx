"use client";

import { format } from "date-fns";
import { Leaf, TrendingDown, TrendingUp, Calendar, Car, Home, Plane, Utensils, Droplet, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { getCalculations, deleteCalculation } from '@/services/calculationService';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface DashboardCalculation {
  _id: string;
  dateRange: {
    from: Date;
    to: Date;
    days: number;
  };
  userType: 'individual' | 'family';
  householdSize: number;
  inputs: any;
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

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [calculations, setCalculations] = useState<DashboardCalculation[]>([]);
  const [loadingCalculations, setLoadingCalculations] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalculations = async () => {
      if (!user) return;
      
      try {
        setLoadingCalculations(true);
        const data = await getCalculations(user._id) as DashboardCalculation[];
        // Ensure data is properly sorted by date (newest first)
        const sortedData = data.sort((a, b) => 
          new Date(b.dateRange.from).getTime() - new Date(a.dateRange.from).getTime()
        );
        setCalculations(sortedData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch calculations:', err);
        setError('Failed to load calculations. Please try again later.');
      } finally {
        setLoadingCalculations(false);
      }
    };

    fetchCalculations();
  }, [user]);

  const handleDeleteCalculation = async (id: string) => {
    setIsDeleting(id);
    try {
      await deleteCalculation(id);
      setCalculations(calculations.filter(calc => calc._id !== id));
      toast.success('Calculation deleted successfully');
    } catch (err) {
      console.error('Failed to delete calculation:', err);
      toast.error('Failed to delete calculation');
    } finally {
      setIsDeleting(null);
    }
  };

  if (loading || loadingCalculations) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div>Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // Calculate aggregated data from saved calculations
  const calculateAggregates = () => {
    if (calculations.length === 0) return null;

    // Get the most recent calculation
    const latest = calculations[0];
    const totalEmissions = latest.results.total;
    const perPersonEmissions = latest.results.perPerson;

    // Calculate monthly average (convert from kg to tonnes for display)
    const monthlyAverage = calculations.reduce((sum, calc) => {
      return sum + (calc.results.total / (calc.dateRange.days / 30));
    }, 0) / calculations.length;

    // Calculate by category percentages
    const categoryTotals = {
      transport: calculations.reduce((sum, calc) => sum + calc.results.transport, 0),
      energy: calculations.reduce((sum, calc) => sum + calc.results.energy, 0),
      food: calculations.reduce((sum, calc) => sum + calc.results.food, 0),
      waste: calculations.reduce((sum, calc) => sum + calc.results.waste, 0),
      water: calculations.reduce((sum, calc) => sum + calc.results.water, 0),
    };

    const totalAllCategories = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

    return {
      latestEmission: totalEmissions,
      perPersonEmission: perPersonEmissions,
      monthlyAverage: monthlyAverage,
      categories: {
        transport: (categoryTotals.transport / totalAllCategories) * 100,
        energy: (categoryTotals.energy / totalAllCategories) * 100,
        food: (categoryTotals.food / totalAllCategories) * 100,
        waste: (categoryTotals.waste / totalAllCategories) * 100,
        water: (categoryTotals.water / totalAllCategories) * 100,
      },
    };
  };

  const aggregates = calculateAggregates() || {
    latestEmission: 0,
    perPersonEmission: 0,
    monthlyAverage: 0,
    categories: {
      transport: 0,
      energy: 0,
      food: 0,
      waste: 0,
      water: 0,
    }
  };

  // Get last 6 calculations for the chart (newest first)
  const monthlyEmissions = calculations.slice(0, 6).map(calc => ({
    month: format(new Date(calc.dateRange.from), "MMM"),
    emissions: calc.results.total,
    target: calc.results.total * 0.9, // Example: target is 10% reduction
    percentage: 100 // This would need actual calculation
  }));

  const emissionsByCategory = [
    { category: "Transportation", value: aggregates.categories.transport, color: "bg-red-500", icon: Car },
    { category: "Home Energy", value: aggregates.categories.energy, color: "bg-orange-500", icon: Home },
    { category: "Food", value: aggregates.categories.food, color: "bg-yellow-500", icon: Utensils },
    { category: "Waste", value: aggregates.categories.waste, color: "bg-green-500", icon: Leaf },
    { category: "Water", value: aggregates.categories.water, color: "bg-blue-500", icon: Droplet },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, <span className="text-green-600">{user?.name || 'User'}</span>!
          </h1>
          <p className="text-gray-600">Here's your carbon footprint overview and environmental impact summary.</p>
          
          <Button 
            onClick={() => router.push('/calculator')}
            className="mt-4 bg-green-600 hover:bg-green-700"
          >
            New Calculation
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-green-200 bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Current Emissions</CardTitle>
              <TrendingDown className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {calculations.length > 0 ? aggregates.latestEmission.toFixed(1) : '0'} kg
              </div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                {calculations.length > 1 ? (
                  <>
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {((aggregates.latestEmission - calculations[1].results.total) / calculations[1].results.total * 100).toFixed(1)}% from last period
                  </>
                ) : calculations.length === 1 ? (
                  'First calculation'
                ) : (
                  'No data'
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Monthly Average</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {calculations.length > 0 ? aggregates.monthlyAverage.toFixed(1) : '0'} kg
              </div>
              <Progress value={calculations.length > 0 ? 50 : 0} className="mt-2" />
              <p className="text-xs text-gray-600 mt-1">Compared to your goal</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Per Person</CardTitle>
              <Leaf className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {calculations.length > 0 ? aggregates.perPersonEmission.toFixed(1) : '0'} kg
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 mt-1">
                {calculations.length > 0 ? (aggregates.perPersonEmission < 1000 ? 'Good' : 'Needs improvement') : 'No data'}
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Trees Equivalent</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {calculations.length > 0 ? Math.ceil(aggregates.latestEmission / 21) : '0'} trees
              </div>
              <p className="text-xs text-gray-600 mt-1">needed to offset (21kg per tree)</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Emissions Trend */}
          <Card className="border-green-200 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Emissions History</CardTitle>
              <CardDescription>Your CO2 emissions over time</CardDescription>
            </CardHeader>
            <CardContent>
              {calculations.length > 0 ? (
                <div className="space-y-4">
                  {monthlyEmissions.map((month, index) => (
                    <div key={calculations[index]._id} className="space-y-2 group relative">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700">{month.month}</span>
                        <span className="text-gray-600">{month.emissions.toFixed(1)} kg</span>
                      </div>
                      <div className="flex space-x-2">
                        <div className="flex-1">
                          <Progress value={month.percentage} className="h-2" />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteCalculation(calculations[index]._id)}
                        disabled={isDeleting === calculations[index]._id}
                      >
                        {isDeleting === calculations[index]._id ? (
                          <span className="animate-pulse">Deleting...</span>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No calculation data available yet. <br />
                  <Button 
                    onClick={() => router.push('/calculator')}
                    className="mt-2"
                  >
                    Create your first calculation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emissions by Category */}
          <Card className="border-green-200 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Emissions by Category</CardTitle>
              <CardDescription>Breakdown of your carbon footprint sources</CardDescription>
            </CardHeader>
            <CardContent>
              {calculations.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {emissionsByCategory.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full ${item.color}`} />
                            <span className="text-sm font-medium text-gray-700">{item.category}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-900">{item.value.toFixed(1)}%</span>
                        </div>
                        <Progress value={item.value} className="h-2" />
                      </div>
                    ))}
                  </div>

                  {/* Donut Chart Representation */}
                  <div className="mt-6 flex justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="3"
                        />
                        {emissionsByCategory.map((item, index) => (
                          <path
                            key={index}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke={item.color.replace('bg-', '').replace('-500', '')}
                            strokeWidth="3"
                            strokeDasharray={`${item.value}, 100`}
                            strokeDashoffset={index === 0 ? 0 : 
                              emissionsByCategory.slice(0, index).reduce((sum, cat) => sum - cat.value, 0)}
                          />
                        ))}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">100%</div>
                          <div className="text-xs text-gray-600">Total</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No category data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Items */}
        {calculations.length > 0 && (
          <Card className="mt-8 border-green-200 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Recommended Actions</CardTitle>
              <CardDescription>Personalized suggestions to reduce your carbon footprint</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {aggregates.categories.transport > 30 && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">Reduce Car Usage</h4>
                    <p className="text-sm text-green-700 mb-3">Could save {(aggregates.latestEmission * 0.15).toFixed(1)} kg CO2</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                    >
                      Learn More
                    </Button>
                  </div>
                )}
                
                {aggregates.categories.energy > 25 && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Energy Efficient Appliances</h4>
                    <p className="text-sm text-blue-700 mb-3">Reduce home emissions by {(aggregates.latestEmission * 0.1).toFixed(1)} kg</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                    >
                      Explore
                    </Button>
                  </div>
                )}
                
                {aggregates.categories.food > 20 && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-900 mb-2">Plant-Based Meals</h4>
                    <p className="text-sm text-purple-700 mb-3">3 meals/week saves {(aggregates.latestEmission * 0.05).toFixed(1)} kg</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                    >
                      Try Now
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}