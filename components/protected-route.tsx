'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Loader2 } from 'lucide-react'
import { WalletConnectButton } from './wallet-connect-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { FullPageLoader } from './loading-spinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  showConnectPrompt?: boolean
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/', 
  showConnectPrompt = true 
}: ProtectedRouteProps) {
  const { isAuthenticated, isConnecting, isConnected } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If not connecting and not authenticated, redirect
    if (!isConnecting && !isAuthenticated && !showConnectPrompt) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isConnecting, router, redirectTo, showConnectPrompt])

  // Show loading while checking authentication
  if (isConnecting) {
    return <FullPageLoader text="Connecting to wallet..." />
  }

  // Show connect prompt if not authenticated and showConnectPrompt is true
  if (!isAuthenticated && showConnectPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              You need to connect your wallet to access this page. Your podcasts will be associated with your wallet address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <WalletConnectButton className="w-full" size="lg">
              Connect Wallet to Continue
            </WalletConnectButton>
            <p className="text-xs text-muted-foreground text-center">
              We support MetaMask, WalletConnect, and other popular wallets.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If not authenticated and not showing connect prompt, don't render anything
  // (will redirect via useEffect)
  if (!isAuthenticated) {
    return null
  }

  // Render children if authenticated
  return <>{children}</>
}