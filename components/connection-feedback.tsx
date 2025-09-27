'use client'

import { useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

export function ConnectionFeedback() {
  const { isConnected, address, chain } = useAccount()
  const { isAuthenticated } = useAuth()

  // Show success message when wallet connects
  useEffect(() => {
    if (isConnected && address && isAuthenticated) {
      toast.success('Wallet Connected', {
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)} on ${chain?.name || 'Unknown Network'}`,
        duration: 3000,
      })
    }
  }, [isConnected, address, isAuthenticated, chain?.name])

  // Show message when wallet disconnects
  useEffect(() => {
    if (!isConnected && !isAuthenticated) {
      toast.info('Wallet Disconnected', {
        description: 'Your wallet has been disconnected.',
        duration: 2000,
      })
    }
  }, [isConnected, isAuthenticated])

  return null
}