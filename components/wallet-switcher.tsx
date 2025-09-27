'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { ChevronDown, Wallet, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export function WalletSwitcher() {
  const { connector, isConnected } = useAccount()
  const { connectors, connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [isOpen, setIsOpen] = useState(false)

  if (!isConnected || !connector) return null

  const handleSwitchWallet = async (newConnector: any) => {
    try {
      // Disconnect current wallet first
      disconnect()
      
      // Small delay to ensure disconnection
      setTimeout(() => {
        connect({ connector: newConnector })
      }, 100)
      
      setIsOpen(false)
      toast.success('Switching wallet...', {
        description: 'Please approve the connection in your new wallet.',
      })
    } catch (error) {
      toast.error('Failed to switch wallet', {
        description: 'Please try again or refresh the page.',
      })
    }
  }

  const availableConnectors = connectors.filter(c => c.id !== connector.id)

  if (availableConnectors.length === 0) return null

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Wallet className="h-4 w-4" />
          {connector.name}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableConnectors.map((availableConnector) => (
          <DropdownMenuItem
            key={availableConnector.id}
            onClick={() => handleSwitchWallet(availableConnector)}
            disabled={isPending}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span>Switch to {availableConnector.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}