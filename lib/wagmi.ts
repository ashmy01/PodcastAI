import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, sepolia } from 'wagmi/chains'

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id'

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Create the metadata object
export const metadata = {
  name: 'Podcast AI',
  description: 'Create dynamic AI-powered podcasts with natural language',
  url: 'https://podcast-ai.vercel.app', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Create wagmiConfig
export const chains = [mainnet, sepolia] as const

export const wagmiAdapter = new WagmiAdapter({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  ssr: true,
  projectId,
  networks: chains
})

export const config = wagmiAdapter.wagmiConfig