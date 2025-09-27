'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useAccount, useConnect } from 'wagmi'

export enum WalletErrorType {
  USER_REJECTED = 'USER_REJECTED',
  NETWORK_ERROR = 'NETWORK_ERROR', 
  WALLET_LOCKED = 'WALLET_LOCKED',
  UNSUPPORTED_CHAIN = 'UNSUPPORTED_CHAIN',
  CONNECTION_LOST = 'CONNECTION_LOST',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

interface WalletError {
  type: WalletErrorType
  message: string
  originalError?: Error
}

export function parseWalletError(error: any): WalletError {
  const errorMessage = error?.message?.toLowerCase() || ''
  
  if (errorMessage.includes('user rejected') || errorMessage.includes('user denied')) {
    return {
      type: WalletErrorType.USER_REJECTED,
      message: 'Connection request was rejected. Please try again and approve the connection.',
      originalError: error
    }
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('rpc')) {
    return {
      type: WalletErrorType.NETWORK_ERROR,
      message: 'Network connection failed. Please check your internet connection and try again.',
      originalError: error
    }
  }
  
  if (errorMessage.includes('locked') || errorMessage.includes('unlock')) {
    return {
      type: WalletErrorType.WALLET_LOCKED,
      message: 'Your wallet is locked. Please unlock your wallet and try again.',
      originalError: error
    }
  }
  
  if (errorMessage.includes('chain') || errorMessage.includes('network')) {
    return {
      type: WalletErrorType.UNSUPPORTED_CHAIN,
      message: 'Unsupported network. Please switch to Ethereum Mainnet or Sepolia.',
      originalError: error
    }
  }
  
  return {
    type: WalletErrorType.UNKNOWN_ERROR,
    message: 'An unexpected error occurred. Please try again.',
    originalError: error
  }
}

export function showWalletError(error: WalletError) {
  switch (error.type) {
    case WalletErrorType.USER_REJECTED:
      toast.error('Connection Rejected', {
        description: error.message,
        duration: 4000,
      })
      break
    case WalletErrorType.NETWORK_ERROR:
      toast.error('Network Error', {
        description: error.message,
        duration: 5000,
        action: {
          label: 'Retry',
          onClick: () => window.location.reload()
        }
      })
      break
    case WalletErrorType.WALLET_LOCKED:
      toast.error('Wallet Locked', {
        description: error.message,
        duration: 6000,
      })
      break
    case WalletErrorType.UNSUPPORTED_CHAIN:
      toast.error('Unsupported Network', {
        description: error.message,
        duration: 6000,
      })
      break
    default:
      toast.error('Connection Error', {
        description: error.message,
        duration: 4000,
      })
  }
}

export function WalletErrorHandler() {
  const { error } = useConnect()
  
  useEffect(() => {
    if (error) {
      const walletError = parseWalletError(error)
      showWalletError(walletError)
    }
  }, [error])
  
  return null
}