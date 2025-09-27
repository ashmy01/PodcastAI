/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react'
import { ProtectedRoute } from '@/components/protected-route'
import { useAuth } from '@/lib/auth-context'

// Mock the auth context
jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

const TestContent = () => <div data-testid="protected-content">Protected Content</div>

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should show loading when connecting', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isConnecting: true,
      isConnected: false,
    })

    render(
      <ProtectedRoute>
        <TestContent />
      </ProtectedRoute>
    )

    expect(screen.getByText('Connecting to wallet...')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('should show connect prompt when not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isConnecting: false,
      isConnected: false,
    })

    render(
      <ProtectedRoute>
        <TestContent />
      </ProtectedRoute>
    )

    expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument()
    expect(screen.getByText('Connect Wallet to Continue')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('should render children when authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isConnecting: false,
      isConnected: true,
    })

    render(
      <ProtectedRoute>
        <TestContent />
      </ProtectedRoute>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(screen.queryByText('Connect Your Wallet')).not.toBeInTheDocument()
  })

  it('should not show connect prompt when showConnectPrompt is false', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isConnecting: false,
      isConnected: false,
    })

    render(
      <ProtectedRoute showConnectPrompt={false}>
        <TestContent />
      </ProtectedRoute>
    )

    expect(screen.queryByText('Connect Your Wallet')).not.toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })
})

export {}