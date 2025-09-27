'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { Loader2 } from 'lucide-react'

interface WalletConnectButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  children?: React.ReactNode
}

export function WalletConnectButton({ 
  variant = 'default', 
  size = 'default', 
  className,
  children 
}: WalletConnectButtonProps) {
  const { connect, isConnecting, error, clearError } = useAuth()

  const handleConnect = () => {
    clearError()
    connect()
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      variant={variant}
      size={size}
      className={className}
    >
      {isConnecting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        children || 'Connect Wallet'
      )}
    </Button>
  )
}