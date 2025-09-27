'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { setStoredWalletAddress, clearStoredWalletAddress } from './api-client'
import { parseWalletError, showWalletError, WalletErrorType } from '@/components/wallet-error-handler'
import { sessionManager } from './session-manager'

interface AuthContextType {
  isConnected: boolean
  address: string | undefined
  isConnecting: boolean
  connect: () => void
  disconnect: () => void
  isAuthenticated: boolean
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected, isConnecting, chain } = useAccount()
  const { disconnect } = useDisconnect()
  const { open } = useAppKit()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update authentication state when wallet connection changes
  useEffect(() => {
    const authenticated = isConnected && !!address
    setIsAuthenticated(authenticated)
    
    // Manage session
    if (authenticated && address) {
      setStoredWalletAddress(address)
      sessionManager.createSession(address, chain?.id || 1)
    } else {
      clearStoredWalletAddress()
      sessionManager.clearSession()
    }
  }, [isConnected, address, chain?.id])

  // Update session activity periodically
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        sessionManager.updateLastActivity()
      }, 30000) // Update every 30 seconds

      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  // Check for existing session on mount
  useEffect(() => {
    const existingSession = sessionManager.getSession()
    if (existingSession && !isConnected) {
      // Session exists but wallet is not connected, clear it
      sessionManager.clearSession()
    }
  }, [])

  // Handle wallet connection
  const connect = () => {
    try {
      setError(null)
      open()
    } catch (err: any) {
      const walletError = parseWalletError(err)
      setError(walletError.message)
      showWalletError(walletError)
    }
  }

  // Clear error state
  const clearError = () => {
    setError(null)
  }

  // Handle wallet disconnection
  const handleDisconnect = () => {
    disconnect()
    setIsAuthenticated(false)
    clearStoredWalletAddress()
    sessionManager.clearSession()
  }

  const value: AuthContextType = {
    isConnected,
    address,
    isConnecting,
    connect,
    disconnect: handleDisconnect,
    isAuthenticated,
    error,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Additional hooks for convenience
export function useWalletAddress() {
  const { address } = useAuth()
  return address
}

export function useIsAuthenticated() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated
}