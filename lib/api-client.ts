'use client'

import { handleApiResponse } from './api-error-handler'

// Utility function to make authenticated API requests
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
  walletAddress?: string
): Promise<Response> {
  const headers = new Headers(options.headers)
  
  // Add wallet address to headers if provided
  if (walletAddress) {
    headers.set('x-wallet-address', walletAddress)
  }
  
  // Add content-type if not already set and body is present
  if (options.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Handle API errors and show appropriate messages
  return handleApiResponse(response)
}

// Hook to create an authenticated fetch function with the current wallet address
export function useAuthenticatedFetch() {
  return (url: string, options: RequestInit = {}) => {
    // Get wallet address from localStorage or context
    const walletAddress = typeof window !== 'undefined' 
      ? localStorage.getItem('walletAddress') 
      : null

    return authenticatedFetch(url, options, walletAddress || undefined)
  }
}

// Utility to store wallet address in localStorage
export function setStoredWalletAddress(address: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('walletAddress', address.toLowerCase())
  }
}

// Utility to get wallet address from localStorage
export function getStoredWalletAddress(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('walletAddress')
  }
  return null
}

// Utility to clear stored wallet address
export function clearStoredWalletAddress() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('walletAddress')
  }
}