'use client'

import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config, projectId, wagmiAdapter, metadata, chains } from '@/lib/wagmi'
import { AuthProvider } from '@/lib/auth-context'
import { WalletErrorHandler } from '@/components/wallet-error-handler'
import { ConnectionMonitor } from '@/components/connection-monitor'
import { NetworkHandler } from '@/components/network-handler'
import { ConnectionFeedback } from '@/components/connection-feedback'

// Set up queryClient
const queryClient = new QueryClient()

// Create the modal
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: chains,
  defaultNetwork: chains[0],
  metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  }
})

export function WagmiProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WalletErrorHandler />
          <ConnectionMonitor />
          <NetworkHandler />
          <ConnectionFeedback />
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}