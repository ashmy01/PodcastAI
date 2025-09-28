import { MediaApiClient } from '@/lib/api/media-api-client'

// Mock fetch globally
global.fetch = jest.fn()

describe('MediaApiClient', () => {
  let client: MediaApiClient
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    client = new MediaApiClient()
    mockFetch.mockClear()
  })

  describe('generateBrandLogo', () => {
    it('should generate brand logo successfully', async () => {
      const mockResponse = {
        url: 'https://example.com/logo.png',
        message: 'Brand logo generated successfully'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await client.generateBrandLogo('Test Brand')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/media/brand-logo',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ brandName: 'Test Brand', brandId: undefined }),
        })
      )
      expect(result).toBe(mockResponse.url)
    })

    it('should return fallback logo on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal server error' }),
      } as Response)

      const result = await client.generateBrandLogo('Tech Company')

      // Should return fallback logo (emoji or avatar URL)
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      // For tech companies, should return tech emoji or avatar URL
      expect(result === '💻' || result.includes('ui-avatars.com')).toBe(true)
    })

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      const result = await client.generateBrandLogo('Test Brand')

      // Should return fallback logo instead of throwing
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('should retry on server errors', async () => {
      // First call fails with 500 error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)

      // Second call succeeds
      const mockResponse = {
        url: 'https://example.com/logo.png',
        message: 'Brand logo generated successfully'
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await client.generateBrandLogo('Test Brand')

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result).toBe(mockResponse.url)
    })
  })

  describe('generateBrandLogoGet', () => {
    it('should generate brand logo using GET method', async () => {
      const mockResponse = {
        url: 'https://example.com/logo.png',
        message: 'Brand logo generated successfully'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await client.generateBrandLogoGet('Test Brand', 'brand-123')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/media/brand-logo?brandName=Test+Brand&brandId=brand-123',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
      expect(result).toBe(mockResponse.url)
    })
  })

  describe('generatePodcastAvatar', () => {
    it('should generate podcast avatar successfully', async () => {
      const mockResponse = {
        url: 'https://api.dicebear.com/7.x/shapes/svg?seed=podcast123',
        message: 'Asset generated successfully'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const podcastData = {
        id: 'podcast123',
        title: 'Test Podcast',
        tone: 'professional'
      }

      const result = await client.generatePodcastAvatar(podcastData)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/media/generate',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'podcast-avatar', data: podcastData }),
        })
      )
      expect(result).toBe(mockResponse.url)
    })

    it('should return fallback avatar on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const podcastData = {
        id: 'podcast123',
        title: 'Test Podcast'
      }

      const result = await client.generatePodcastAvatar(podcastData)

      // Should return fallback avatar URL
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result).toContain('dicebear.com')
    })
  })

  describe('generateUserAvatar', () => {
    it('should generate user avatar successfully', async () => {
      const mockResponse = {
        url: 'https://api.dicebear.com/7.x/identicon/svg?seed=0x123',
        message: 'Asset generated successfully'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await client.generateUserAvatar('0x123456789', 'testuser')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/media/generate',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            type: 'user-avatar', 
            data: { walletAddress: '0x123456789', username: 'testuser' } 
          }),
        })
      )
      expect(result).toBe(mockResponse.url)
    })

    it('should return fallback avatar on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API error'))

      const result = await client.generateUserAvatar('0x123456789')

      // Should return fallback avatar URL
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result).toContain('dicebear.com')
      expect(result).toContain('identicon')
    })
  })
})