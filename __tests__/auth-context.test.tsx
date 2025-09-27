/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/lib/wagmi'

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  ...jest.requireActual('wagmi'),
  useAccount: jest.fn(),
  useConnect: jest.fn(),
  useDisconnect: jest.fn(),
}))

jest.mock('@reown/appkit/react', () => ({
  useAppKit: jest.fn(() => ({
    open: jest.fn(),
  })),
}))

const TestComponent = () => {
  const { isAuthenticated, isConnected, address, connect, disconnect } = useAuth()
  
  return (
    <div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="connected">{isConnected.toString()}</div>
      <div data-testid="address">{address || 'no-address'}</div>
      <button onClick={connect} data-testid="connect-btn">Connect</button>
      <button onClick={disconnect} data-testid="disconnect-btn">Disconnect</button>
    </div>
  )
}

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    })
  })

  it('should provide initial authentication state', () => {
    const { useAccount } = require('wagmi')
    useAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
      isConnecting: false,
    })

    render(
      <Wrapper>
        <TestComponent />
      </Wrapper>
    )

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    expect(screen.getByTestId('connected')).toHaveTextContent('false')
    expect(screen.getByTestId('address')).toHaveTextContent('no-address')
  })

  it('should update authentication state when wallet connects', async () => {
    const { useAccount } = require('wagmi')
    const mockAddress = '0x1234567890123456789012345678901234567890'
    
    useAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
      isConnecting: false,
      chain: { id: 1 },
    })

    render(
      <Wrapper>
        <TestComponent />
      </Wrapper>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('connected')).toHaveTextContent('true')
      expect(screen.getByTestId('address')).toHaveTextContent(mockAddress)
    })
  })

  it('should handle wallet disconnection', async () => {
    const { useAccount } = require('wagmi')
    
    // Start connected
    useAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
      isConnecting: false,
    })

    render(
      <Wrapper>
        <TestComponent />
      </Wrapper>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('connected')).toHaveTextContent('false')
    })
  })
})

export {}