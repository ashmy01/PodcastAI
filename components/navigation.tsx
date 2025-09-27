"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "./ui/button"
import { HomeIcon, PlusIcon, SpeakerLoudIcon, PlayIcon, GearIcon, PersonIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons"
import { useAuth } from "@/lib/auth-context"
import { WalletConnectButton } from "./wallet-connect-button"
import { WalletAddressDisplay } from "./wallet-address-display"
import { ConnectionStatus } from "./connection-status"
import { WalletSwitcher } from "./wallet-switcher"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Create", href: "/create", icon: PlusIcon },
  { name: "My Podcasts", href: "/podcasts", icon: SpeakerLoudIcon },
  { name: "Episodes", href: "/episodes", icon: PlayIcon },
  { name: "Settings", href: "/settings", icon: GearIcon },
]

export function Navigation() {
  const pathname = usePathname()
  const { isAuthenticated, isConnected } = useAuth()

  return (
    <nav className="flex items-center justify-between w-full px-6 py-4 bg-card border-b border-border">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          <SpeakerLoudIcon className="w-6 h-6 text-primary" />
          <span className="font-serif text-xl font-bold text-foreground">Podcast AI</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {/* Explore is always visible */}
          <Link href="/explore">
            <Button variant={pathname === "/explore" ? "default" : "ghost"} size="sm" className="gap-2">
              <MagnifyingGlassIcon className="w-4 h-4" />
              Explore
            </Button>
          </Link>

          {/* Only show other navigation items when authenticated */}
          {isAuthenticated && (
            <>
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link key={item.name} href={item.href}>
                    <Button variant={isActive ? "default" : "ghost"} size="sm" className="gap-2">
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Button>
                  </Link>
                )
              })}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Connection status indicator */}
        <ConnectionStatus />
        
        {/* Wallet switcher (only show when connected) */}
        {isConnected && <WalletSwitcher />}
        
        {/* Wallet connection/address display */}
        {isConnected ? (
          <WalletAddressDisplay />
        ) : (
          <WalletConnectButton variant="outline" size="sm">
            Connect Wallet
          </WalletConnectButton>
        )}
      </div>
    </nav>
  )
}
