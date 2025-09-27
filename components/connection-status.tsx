'use client'

import { useAuth } from '@/lib/auth-context'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function ConnectionStatus() {
  const { isConnected, isConnecting } = useAuth()

  if (isConnecting) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Connecting
      </Badge>
    )
  }

  if (isConnected) {
    return (
      <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
        <CheckCircle className="h-3 w-3" />
        Connected
      </Badge>
    )
  }

  return (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="h-3 w-3" />
      Disconnected
    </Badge>
  )
}