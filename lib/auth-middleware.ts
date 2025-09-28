import { NextRequest, NextResponse } from 'next/server'

export interface AuthenticatedRequest extends NextRequest {
  walletAddress?: string
}

export function withAuth<T extends any[]>(
  handler: (req: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Extract wallet address using the updated function
      const walletAddress = extractWalletAddress(req)
      
      if (!walletAddress) {
        return NextResponse.json(
          { message: 'Wallet address is required' },
          { status: 401 }
        )
      }

      // Add wallet address to request object
      const authenticatedReq = req as AuthenticatedRequest
      authenticatedReq.walletAddress = walletAddress

      // Call the original handler with the authenticated request
      return await handler(authenticatedReq, ...args)
    } catch (error) {
      console.error('Authentication middleware error:', error)
      return NextResponse.json(
        { message: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}

export function extractWalletAddress(req: NextRequest): string | null {
  // Try x-wallet-address header first
  let walletAddress = req.headers.get('x-wallet-address')
  
  // If not found, try Authorization header (Bearer format)
  if (!walletAddress) {
    const authHeader = req.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      walletAddress = authHeader.substring(7) // Remove 'Bearer ' prefix
    }
  }
  
  if (!walletAddress) {
    return null
  }

  // Validate wallet address format
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/
  if (!ethAddressRegex.test(walletAddress)) {
    return null
  }

  return walletAddress.toLowerCase()
}

export function requireAuth(req: NextRequest): NextResponse | null {
  const walletAddress = extractWalletAddress(req)
  
  if (!walletAddress) {
    return NextResponse.json(
      { message: 'Authentication required. Please connect your wallet.' },
      { status: 401 }
    )
  }
  
  return null
}