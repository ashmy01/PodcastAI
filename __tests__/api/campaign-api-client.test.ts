import { CampaignApiClient } from '@/lib/api/campaign-api-client'

// Mock fetch globally
global.fetch = jest.fn()

describe('CampaignApiClient', () => {
  let client: CampaignApiClient
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    client = new CampaignApiClient()
    mockFetch.mockClear()
  })

  describe('getPublicCampaigns', () => {
    it('should fetch public campaigns successfully', async () => {
      const mockResponse = {
        campaigns: [
          {
            _id: '1',
            brandName: 'Test Brand',
            productName: 'Test Product',
            description: 'Test Description',
            category: 'Technology',
            budget: 1000,
            currency: 'ETH',
            status: 'active',
            brandLogo: '💻',
            applicants: 5,
            analytics: {
              totalImpressions: 1000,
              totalClicks: 50,
              clickThroughRate: 0.05,
              conversionRate: 0.1
            }
          }
        ],
        pagination: {
          total: 1,
          limit: 20,
          offset: 0,
          hasMore: false
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await client.getPublicCampaigns({ status: 'active', limit: 20 })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/campaigns/public?status=active&limit=20',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal server error' }),
      } as Response)

      await expect(client.getPublicCampaigns()).rejects.toThrow('Server error. Please try again later.')
    })

    it('should handle network errors with retry', async () => {
      // First call fails with network error
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
      
      // Second call succeeds
      const mockResponse = { campaigns: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await client.getPublicCampaigns()

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getUserCampaigns', () => {
    it('should fetch user campaigns with authentication', async () => {
      const mockResponse = {
        campaigns: [],
        pagination: { total: 0, limit: 20, offset: 0, hasMore: false }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await client.getUserCampaigns({}, 'test-wallet-address')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/campaigns?',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-wallet-address',
          },
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

      await expect(client.getUserCampaigns({}, 'invalid-wallet')).rejects.toThrow('Authentication failed. Please reconnect your wallet.')
    })
  })

  describe('getCampaignById', () => {
    it('should fetch campaign by ID', async () => {
      const mockCampaign = {
        _id: '1',
        brandName: 'Test Brand',
        productName: 'Test Product',
        description: 'Test Description'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCampaign,
      } as Response)

      const result = await client.getCampaignById('1', 'wallet-address')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/campaigns/1',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer wallet-address',
          },
        })
      )
      expect(result).toEqual(mockCampaign)
    })

    it('should handle not found errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Campaign not found' }),
      } as Response)

      await expect(client.getCampaignById('nonexistent')).rejects.toThrow('The requested resource was not found.')
    })
  })
})