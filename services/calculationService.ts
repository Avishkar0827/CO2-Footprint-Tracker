// services/calculationService.ts
import { ICalculation } from '../types/calculation';

// Helper function for consistent error handling
function handleServiceError(error: unknown, context: string): never {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  console.error(`[calculationService] ${context} error:`, error);
  throw new Error(errorMessage);
}

// Enhanced fetch wrapper with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getCalculations(userId: string): Promise<ICalculation[]> {
  try {
    if (!userId?.trim()) {
      throw new Error('Invalid user ID');
    }

    // Debug log
    console.debug(`[calculationService] Fetching calculations for user: ${userId}`);

    const response = await fetchWithTimeout(
      `/api/calculations/get?userId=${encodeURIComponent(userId)}&_=${Date.now()}`
    );

    const responseData = await response.json();

    if (!responseData?.success) {
      throw new Error(responseData?.message || 'Invalid response format');
    }

    if (!Array.isArray(responseData.data)) {
      console.warn('Unexpected data format received:', responseData);
      return [];
    }

    // Transform and validate data
    return responseData.data.map((calc: any) => {
      try {
        return {
          ...calc,
          _id: calc._id?.toString(),
          dateRange: {
            from: new Date(calc.dateRange?.from || Date.now()),
            to: new Date(calc.dateRange?.to || Date.now()),
            days: Number(calc.dateRange?.days) || 0,
          },
          userType: calc.userType === 'family' ? 'family' : 'individual',
          householdSize: Number(calc.householdSize) || 1,
          createdAt: calc.createdAt ? new Date(calc.createdAt) : new Date(),
          updatedAt: calc.updatedAt ? new Date(calc.updatedAt) : new Date(),
          results: {
            energy: Number(calc.results?.energy) || 0,
            transport: Number(calc.results?.transport) || 0,
            waste: Number(calc.results?.waste) || 0,
            water: Number(calc.results?.water) || 0,
            food: Number(calc.results?.food) || 0,
            total: Number(calc.results?.total) || 0,
            perPerson: Number(calc.results?.perPerson) || 0,
          },
        };
      } catch (transformError) {
        console.error('Data transformation error:', transformError, 'for calculation:', calc);
        return null;
      }
    }).filter(Boolean) as ICalculation[]; // Filter out any null values from failed transformations

  } catch (error) {
    return handleServiceError(error, 'getCalculations');
  }
}

export async function saveCalculation(
  calculationData: Omit<ICalculation, '_id' | 'createdAt'>
): Promise<ICalculation> {
  try {
    if (!calculationData?.userId?.trim()) {
      throw new Error('User ID is required');
    }

    // Validate required fields
    if (!calculationData.dateRange?.from || !calculationData.dateRange?.to) {
      throw new Error('Date range is required');
    }

    // Debug log
    console.debug('[calculationService] Saving calculation for user:', calculationData.userId);

    const response = await fetchWithTimeout('/api/calculations/save', {
      method: 'POST',
      body: JSON.stringify({
        ...calculationData,
        dateRange: {
          from: calculationData.dateRange.from.toISOString(),
          to: calculationData.dateRange.to.toISOString(),
          days: calculationData.dateRange.days,
        },
      }),
    });

    const responseData = await response.json();

    if (!responseData?.success) {
      throw new Error(responseData?.message || 'Calculation save failed');
    }

    // Transform response data
    return {
      ...responseData.data,
      _id: responseData.data._id?.toString(),
      dateRange: {
        from: new Date(responseData.data.dateRange.from),
        to: new Date(responseData.data.dateRange.to),
        days: Number(responseData.data.dateRange.days),
      },
      createdAt: new Date(responseData.data.createdAt),
      updatedAt: new Date(responseData.data.updatedAt),
      results: {
        energy: Number(responseData.data.results?.energy) || 0,
        transport: Number(responseData.data.results?.transport) || 0,
        waste: Number(responseData.data.results?.waste) || 0,
        water: Number(responseData.data.results?.water) || 0,
        food: Number(responseData.data.results?.food) || 0,
        total: Number(responseData.data.results?.total) || 0,
        perPerson: Number(responseData.data.results?.perPerson) || 0,
      },
    };
  } catch (error) {
    return handleServiceError(error, 'saveCalculation');
  }
}

// Add this to your existing calculationService.ts
export async function deleteCalculation(id: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!id?.trim()) {
      throw new Error('Invalid calculation ID');
    }

    console.debug(`[calculationService] Deleting calculation: ${id}`);

    const response = await fetchWithTimeout(`/api/calculations/${id}`, {
      method: 'DELETE',
    });

    const responseData = await response.json();

    if (!responseData?.success) {
      throw new Error(responseData?.message || 'Calculation deletion failed');
    }

    return {
      success: true,
      message: responseData.message || 'Calculation deleted successfully',
    };
  } catch (error) {
    return handleServiceError(error, 'deleteCalculation');
  }
}