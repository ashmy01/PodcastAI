"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} retry={this.retry} />
      }

      return (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="text-red-600">Something went wrong</CardTitle>
            <CardDescription>
              An unexpected error occurred while loading this section.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {this.state.error && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                {this.state.error.message}
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={this.retry} size="sm">
                Try Again
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// Fallback component for campaign-related errors
export const CampaignErrorFallback: React.FC<{ error?: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="text-center py-12">
    <div className="text-red-500 mb-4 text-4xl">⚠️</div>
    <h3 className="text-lg font-semibold mb-2">Campaign Loading Error</h3>
    <p className="text-muted-foreground mb-4">
      {error?.message || 'Failed to load campaign data'}
    </p>
    <div className="flex gap-4 justify-center">
      <Button onClick={retry}>
        Try Again
      </Button>
      <Button variant="ghost" onClick={() => window.location.href = '/brand-deals'}>
        Go Back
      </Button>
    </div>
  </div>
)