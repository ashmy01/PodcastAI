import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import BrandDealsPage from '@/app/brand-deals/page'

// Mock the auth context
const mockUseAuth = {
  isAuthenticated: false,
  address: null,
  connect: jest.fn(),
  disconnect: jest.fn(),
}

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => mockUseAuth,
}))

// Mock the API clients
const mockCampaignApiClient = {
  getPublicCampaigns: jest.fn(),
  getUserCampaigns: jest.fn(),
}

const mockMediaApiClient = {
  generateBrandLogo: jest.fn(),
}

jest.mock('@/lib/api/campaign-api-client', () => ({
  CampaignApiClient: jest.fn(() => mockCampaignApiClient),
}))

jest.mock('@/lib/api/media-api-client', () => ({
  MediaApiClient: jest.fn(() => mockMediaApiClient),
}))

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

describe('BrandDealsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.isAuthenticated = false
    mockUseAuth.address = null
  })

  describe('Browse Deals Tab', () => {
    it('should render loading state initially', async () => {
      mockCampaignApiClient.getPublicCampaigns.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      render(<BrandDealsPage />)

      expect(screen.getByText('Loading brand deals...')).toBeInTheDocument()
    })

    it('should display campaigns when loaded successfully', async () => {
      const mockCampaigns = [
        {
          _id: '1',
          brandName: 'Test Brand',
          productName: 'Test Product',
          description: 'Test description for the campaign',
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
            conversionRate: 0.1,
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ]

      mockCampaignApiClient.getPublicCampaigns.mockResolvedValue({
        campaigns: mockCampaigns,
        pagination: { total: 1, limit: 20, offset: 0, hasMore: false },
      })

      render(<BrandDealsPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Brand')).toBeInTheDocument()
        expect(screen.getByText('Test Product')).toBeInTheDocument()
        expect(screen.getByText('1000 ETH')).toBeInTheDocument()
        expect(screen.getByText('Technology')).toBeInTheDocument()
      })
    })

    it('should display error state when API call fails', async () => {
      mockCampaignApiClient.getPublicCampaigns.mockRejectedValue(
        new Error('Network error. Please check your internet connection and try again.')
      )

      render(<BrandDealsPage />)

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Campaigns')).toBeInTheDocument()
        expect(screen.getByText('Network error. Please check your internet connection and try again.')).toBeInTheDocument()
        expect(screen.getByText('Try Again')).toBeInTheDocument()
      })
    })

    it('should retry fetching campaigns when retry button is clicked', async () => {
      mockCampaignApiClient.getPublicCampaigns
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          campaigns: [],
          pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
        })

      render(<BrandDealsPage />)

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Campaigns')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Try Again'))

      await waitFor(() => {
        expect(screen.getByText('No Active Deals')).toBeInTheDocument()
      })

      expect(mockCampaignApiClient.getPublicCampaigns).toHaveBeenCalledTimes(2)
    })

    it('should display empty state when no campaigns are available', async () => {
      mockCampaignApiClient.getPublicCampaigns.mockResolvedValue({
        campaigns: [],
        pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
      })

      render(<BrandDealsPage />)

      await waitFor(() => {
        expect(screen.getByText('No Active Deals')).toBeInTheDocument()
        expect(screen.getByText('No brand partnerships are currently available')).toBeInTheDocument()
      })
    })
  })

  describe('My Deals Tab', () => {
    beforeEach(() => {
      mockUseAuth.isAuthenticated = true
      mockUseAuth.address = '0x123456789'
    })

    it('should display user campaigns when authenticated', async () => {
      const mockUserCampaigns = [
        {
          _id: '1',
          brandName: 'My Brand',
          productName: 'My Product',
          description: 'My campaign description',
          category: 'Technology',
          budget: 2000,
          currency: 'ETH',
          status: 'active',
          brandLogo: '🚀',
          totalSpent: 500,
          totalViews: 1000,
          matchedPodcasts: [],
          createdAt: '2024-01-01T00:00:00Z',
        },
      ]

      mockCampaignApiClient.getUserCampaigns.mockResolvedValue({
        campaigns: mockUserCampaigns,
        pagination: { total: 1, limit: 20, offset: 0, hasMore: false },
      })

      render(<BrandDealsPage />)

      // Switch to My Deals tab
      fireEvent.click(screen.getByText('My Deals'))

      await waitFor(() => {
        expect(screen.getByText('My Product')).toBeInTheDocument()
        expect(screen.getByText('My Brand • Technology')).toBeInTheDocument()
        expect(screen.getByText('Budget: 2000 ETH')).toBeInTheDocument()
      })
    })

    it('should display error state for user campaigns', async () => {
      mockCampaignApiClient.getUserCampaigns.mockRejectedValue(
        new Error('Authentication failed. Please reconnect your wallet.')
      )

      render(<BrandDealsPage />)

      // Switch to My Deals tab
      fireEvent.click(screen.getByText('My Deals'))

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Your Campaigns')).toBeInTheDocument()
        expect(screen.getByText('Authentication failed. Please reconnect your wallet.')).toBeInTheDocument()
      })
    })

    it('should display connect wallet message when not authenticated', () => {
      mockUseAuth.isAuthenticated = false
      mockUseAuth.address = null

      render(<BrandDealsPage />)

      // Switch to My Deals tab
      fireEvent.click(screen.getByText('My Deals'))

      expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument()
      expect(screen.getByText('Connect your wallet to view and manage your brand deals')).toBeInTheDocument()
    })
  })

  describe('Tab Navigation', () => {
    it('should switch between tabs correctly', () => {
      render(<BrandDealsPage />)

      // Initially on Browse Deals tab
      expect(screen.getByText('Active Brand Partnerships')).toBeInTheDocument()

      // Switch to Create Deal tab
      fireEvent.click(screen.getByText('Create Deal'))
      expect(screen.getByText('Create Brand Deal')).toBeInTheDocument()

      // Switch to My Deals tab
      fireEvent.click(screen.getByText('My Deals'))
      expect(screen.getByText('My Brand Deals')).toBeInTheDocument()

      // Switch back to Browse Deals tab
      fireEvent.click(screen.getByText('Browse Deals'))
      expect(screen.getByText('Active Brand Partnerships')).toBeInTheDocument()
    })
  })

  describe('Error Boundary', () => {
    it('should catch and display errors from child components', () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      // Force an error by making the API client throw during render
      mockCampaignApiClient.getPublicCampaigns.mockImplementation(() => {
        throw new Error('Render error')
      })

      render(<BrandDealsPage />)

      // The error boundary should catch the error and display fallback UI
      expect(screen.getByText('Campaign Loading Error')).toBeInTheDocument()

      consoleSpy.mockRestore()
    })
  })
})