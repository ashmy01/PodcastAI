'use client'

export interface UserSession {
  walletAddress: string
  chainId: number
  connectedAt: Date
  lastActivity: Date
  isActive: boolean
}

const SESSION_STORAGE_KEY = 'podcast-ai-session'
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24 hours

export class SessionManager {
  private static instance: SessionManager
  private session: UserSession | null = null

  private constructor() {
    this.loadSession()
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  private loadSession(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const session: UserSession = {
          ...parsed,
          connectedAt: new Date(parsed.connectedAt),
          lastActivity: new Date(parsed.lastActivity)
        }

        // Check if session is still valid
        if (this.isSessionValid(session)) {
          this.session = session
          this.updateLastActivity()
        } else {
          this.clearSession()
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error)
      this.clearSession()
    }
  }

  private saveSession(): void {
    if (typeof window === 'undefined' || !this.session) return

    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.session))
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  }

  private isSessionValid(session: UserSession): boolean {
    const now = new Date()
    const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime()
    return timeSinceLastActivity < SESSION_TIMEOUT && session.isActive
  }

  createSession(walletAddress: string, chainId: number): void {
    const now = new Date()
    this.session = {
      walletAddress: walletAddress.toLowerCase(),
      chainId,
      connectedAt: now,
      lastActivity: now,
      isActive: true
    }
    this.saveSession()
  }

  updateLastActivity(): void {
    if (this.session) {
      this.session.lastActivity = new Date()
      this.saveSession()
    }
  }

  updateChainId(chainId: number): void {
    if (this.session) {
      this.session.chainId = chainId
      this.saveSession()
    }
  }

  getSession(): UserSession | null {
    if (this.session && this.isSessionValid(this.session)) {
      return this.session
    }
    return null
  }

  clearSession(): void {
    this.session = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }

  isSessionActive(): boolean {
    const session = this.getSession()
    return session !== null && session.isActive
  }

  getWalletAddress(): string | null {
    const session = this.getSession()
    return session?.walletAddress || null
  }

  // Auto-cleanup expired sessions
  startSessionCleanup(): void {
    if (typeof window === 'undefined') return

    setInterval(() => {
      if (this.session && !this.isSessionValid(this.session)) {
        this.clearSession()
      }
    }, 60000) // Check every minute
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance()

// Auto-start session cleanup
if (typeof window !== 'undefined') {
  sessionManager.startSessionCleanup()
}