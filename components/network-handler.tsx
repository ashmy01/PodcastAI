'use client'

import { useEffect } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { toast } from 'sonner'
import { Button } from './ui/button'

const SUPPORTED_CHAINS = [mainnet, sepolia]

export function NetworkHandler() {
  const { chain, isConnected } = useAccount()
  const { switchChain, isPending } = useSwitchChain()

  useEffect(() => {
    if (isConnected && chain) {
      const isSupported = SUPPORTED_CHAINS.some(supportedChain => supportedChain.id === chain.id)
      
      if (!isSupported) {
        toast.error('Unsupported Network', {
          description: `You're connected to ${chain.name}. Please switch to Ethereum Mainnet or Sepolia.`,
          duration: 8000,
          action: {
            label: 'Switch to Mainnet',
            onClick: () => switchChain({ chainId: mainnet.id })
          }
        })
      }
    }
  }, [chain, isConnected, switchChain])

  // Don't render anything, this is just a handler
  return null
}

export function NetworkSwitcher() {
  const { chain } = useAccount()
  const { switchChain, isPending } = useSwitchChain()

  if (!chain) return null

  const isSupported = SUPPORTED_CHAINS.some(supportedChain => supportedChain.id === chain.id)

  if (isSupported) return null

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-yellow-800">
            Unsupported Network
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            You're connected to {chain.name}. Please switch to a supported network.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => switchChain({ chainId: mainnet.id })}
            disabled={isPending}
          >
            {isPending ? 'Switching...' : 'Mainnet'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => switchChain({ chainId: sepolia.id })}
            disabled={isPending}
          >
            {isPending ? 'Switching...' : 'Sepolia'}
          </Button>
        </div>
      </div>
    </div>
  )
}