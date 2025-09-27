'use client'

import { useEffect } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useAuth } from '@/lib/auth-context'
import { sessionManager } from '@/lib/session-manager'
import { toast } from 'sonner'

export function ConnectionMonitor() {
  const { isConnected, address, chain } = useAccount()
  const { isAuthenticated, disconnect } = useAuth()
  const { disconnect: wagmiDisconnect } = useDisconnect()

  // Monitor wallet connection status
  useEffect(() => {
    const checkConnection = () => {
      const session = sessionManager.getSession()
      
      // If we have a session but wallet is disconnected, clear session
      if (session && !isConnected) {
        sessionManager.clearSession()
        toast.info('Wallet disconnected', {
          description: 'Your wallet connection was lost. Please reconnect to continue.',
        })
      }
      
      // If wallet address changed, update session
      if (session && address && session.walletAddress !== address.toLowerCase()) {
        sessionManager.clearSession()
        if (isConnected && address) {
          sessionManager.createSession(address, chain?.id || 1)
        }
        toast.info('Wallet changed', {
          description: 'A different wallet was connected. Session updated.',
        })
      }
      
      // If chain changed, update session
      if (session && chain && session.chainId !== chain.id) {
        sessionManager.updateChainId(chain.id)
      }
    }

    // Check connection status periodically
    const interval = setInterval(checkConnection, 5000) // Check every 5 seconds
    
    return () => clearInterval(interval)
  }, [isConnected, address, chain, isAuthenticated])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        // Update activity when user returns to tab
        sessionManager.updateLastActivity()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isAuthenticated])

  // Handle beforeunload to update session
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isAuthenticated) {
        sessionManager.updateLastActivity()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isAuthenticated])

  return null
}