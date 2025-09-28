export interface PodcastAvatarData {
  id: string;
  title: string;
  tone?: string;
}

export interface MediaApiResponse {
  url: string;
  message: string;
}

export interface ApiErrorResponse {
  message: string;
  error?: string;
  code?: string;
}

export class MediaApiClient {
  private baseUrl: string;
  private maxRetries: number = 2;
  private retryDelay: number = 500;

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
        console.warn(`Media API request failed, retrying in ${this.retryDelay}ms... (${retries} retries left)`);
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

  async generateBrandLogo(brandName: string, brandId?: string): Promise<string> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/media/brand-logo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ brandName, brandId }),
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.message || 'Failed to generate brand logo');
      }

      const data: MediaApiResponse = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error generating brand logo:', error);
      return this.getFallbackBrandLogo(brandName);
    }
  }

  async generateBrandLogoGet(brandName: string, brandId?: string): Promise<string> {
    try {
      const params = new URLSearchParams();
      params.append('brandName', brandName);
      if (brandId) params.append('brandId', brandId);

      const response = await fetch(`${this.baseUrl}/api/media/brand-logo?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.message || 'Failed to generate brand logo');
      }

      const data: MediaApiResponse = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error generating brand logo:', error);
      return this.getFallbackBrandLogo(brandName);
    }
  }

  async generatePodcastAvatar(data: PodcastAvatarData): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/media/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'podcast-avatar', data }),
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.message || 'Failed to generate podcast avatar');
      }

      const result: MediaApiResponse = await response.json();
      return result.url;
    } catch (error) {
      console.error('Error generating podcast avatar:', error);
      return this.getFallbackPodcastAvatar(data);
    }
  }

  async generateUserAvatar(walletAddress: string, username?: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/media/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: 'user-avatar', 
          data: { walletAddress, username } 
        }),
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.message || 'Failed to generate user avatar');
      }

      const result: MediaApiResponse = await response.json();
      return result.url;
    } catch (error) {
      console.error('Error generating user avatar:', error);
      return this.getFallbackUserAvatar(walletAddress);
    }
  }
  private getFallbackBrandLogo(brandName: string): string {
    const logoMap: { [key: string]: string } = {
      'tech': '💻',
      'ai': '🤖',
      'eco': '🌱',
      'health': '💊',
      'finance': '💰',
      'education': '📚',
      'food': '🍕',
      'travel': '✈️',
      'fashion': '👗',
      'music': '🎵'
    };

    const lowerName = brandName.toLowerCase();
    for (const [key, emoji] of Object.entries(logoMap)) {
      if (lowerName.includes(key)) {
        return emoji;
      }
    }

    // Fallback to first letter avatar
    const firstLetter = brandName.charAt(0).toUpperCase();
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    const colorIndex = this.hashString(brandName) % colors.length;

    return `https://ui-avatars.com/api/?name=${firstLetter}&background=${colors[colorIndex].slice(1)}&color=fff&size=128`;
  }

  private getFallbackPodcastAvatar(data: PodcastAvatarData): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];

    const colorIndex = this.hashString(data.id) % colors.length;
    const seed = encodeURIComponent(data.id);
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=${colors[colorIndex].slice(1)}`;
  }

  private getFallbackUserAvatar(walletAddress: string): string {
    const seed = encodeURIComponent(walletAddress);
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}