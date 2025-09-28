export interface CampaignFilters {
  category?: string;
  status?: string;
  minBudget?: number;
  maxBudget?: number;
  currency?: string;
  limit?: number;
  offset?: number;
}

export interface CampaignAnalytics {
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageQualityScore: number;
  clickThroughRate: number;
  conversionRate: number;
  costPerAcquisition: number;
  totalSpent: number;
  remainingBudget: number;
  applicationCount: number;
  activeApplications: number;
}

export interface Campaign {
  _id: string;
  brandId: string;
  brandName: string;
  productName: string;
  description: string;
  category: string;
  targetAudience: string[];
  requirements: string[];
  budget: number;
  currency: string;
  duration: number;
  status: string;
  contractAddress?: string;
  brandLogo: string;
  applicants: number;
  analytics: CampaignAnalytics;
  createdAt: string;
  updatedAt: string;
  totalSpent?: number;
  totalViews?: number;
  matchedPodcasts?: any[];
}

export interface CampaignResponse {
  campaigns: Campaign[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ApiErrorResponse {
  message: string;
  error?: string;
  code?: string;
}

export class CampaignApiClient {
  private baseUrl: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithRetry(url: string, options: RequestInit, retries: number = this.maxRetries): Promise<Response> {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok && (response.status >= 500 || response.status === 0)) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        console.warn(`Request failed, retrying in ${this.retryDelay}ms... (${retries} retries left)`);
        await this.delay(this.retryDelay);
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    return (
      error.name === 'TypeError' ||
      error.name === 'AbortError' ||
      error.message.includes('fetch') ||
      error.message.includes('5')
    );
  }

  private handleApiError(error: any, operation: string): never {
    console.error(`${operation} failed:`, error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      throw new Error('Authentication failed. Please reconnect your wallet.');
    }
    
    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      throw new Error('Access denied. You do not have permission to perform this action.');
    }
    
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      throw new Error('The requested resource was not found.');
    }
    
    if (error.message.includes('5')) {
      throw new Error('Server error. Please try again later.');
    }
    
    throw error;
  }

  async getPublicCampaigns(filters: CampaignFilters = {}): Promise<CampaignResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());

      const response = await this.fetchWithRetry(`${this.baseUrl}/api/campaigns/public?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.message || 'Failed to fetch public campaigns');
      }

      return await response.json();
    } catch (error) {
      this.handleApiError(error, 'Get public campaigns');
    }
  }

  async getUserCampaigns(filters: CampaignFilters = {}, walletAddress?: string): Promise<CampaignResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (walletAddress) {
        headers['Authorization'] = `Bearer ${walletAddress}`;
      }

      const response = await this.fetchWithRetry(`${this.baseUrl}/api/campaigns?${params.toString()}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.message || 'Failed to fetch user campaigns');
      }

      return await response.json();
    } catch (error) {
      this.handleApiError(error, 'Get user campaigns');
    }
  }

  async getCampaignById(id: string, walletAddress?: string): Promise<Campaign> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (walletAddress) {
        headers['Authorization'] = `Bearer ${walletAddress}`;
      }

      const response = await fetch(`${this.baseUrl}/api/campaigns/${id}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.message || 'Failed to fetch campaign');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching campaign by ID:', error);
      throw error;
    }
  }

  async createCampaign(campaignData: any, walletAddress: string): Promise<Campaign> {
    try {
      const response = await fetch(`${this.baseUrl}/api/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${walletAddress}`,
        },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.message || 'Failed to create campaign');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }
}