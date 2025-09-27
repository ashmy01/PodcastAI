import { toast } from 'sonner'

export interface ApiError {
  message: string
  status: number
  code?: string
}

export function parseApiError(response: Response, data?: any): ApiError {
  const status = response.status
  const message = data?.message || response.statusText || 'An error occurred'
  
  return {
    message,
    status,
    code: data?.code
  }
}

export function handleApiError(error: ApiError) {
  switch (error.status) {
    case 401:
      toast.error('Authentication Required', {
        description: 'Please connect your wallet to continue.',
        duration: 5000,
      })
      break
    case 403:
      toast.error('Access Denied', {
        description: 'You do not have permission to access this resource.',
        duration: 5000,
      })
      break
    case 404:
      toast.error('Not Found', {
        description: 'The requested resource was not found.',
        duration: 4000,
      })
      break
    case 429:
      toast.error('Rate Limited', {
        description: 'Too many requests. Please wait a moment and try again.',
        duration: 6000,
      })
      break
    case 500:
      toast.error('Server Error', {
        description: 'An internal server error occurred. Please try again later.',
        duration: 5000,
        action: {
          label: 'Retry',
          onClick: () => window.location.reload()
        }
      })
      break
    default:
      toast.error('Request Failed', {
        description: error.message,
        duration: 4000,
      })
  }
}

export async function handleApiResponse(response: Response) {
  if (!response.ok) {
    let errorData
    try {
      errorData = await response.json()
    } catch {
      // Response might not be JSON
      errorData = null
    }
    
    const apiError = parseApiError(response, errorData)
    handleApiError(apiError)
    throw new Error(apiError.message)
  }
  
  return response
}