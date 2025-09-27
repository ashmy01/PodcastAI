/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { extractWalletAddress, requireAuth } from '@/lib/auth-middleware'

describe('API Middleware', () => {
  describe('extractWalletAddress', () => {
    it('should extract valid wallet address from headers', () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('0x1234567890123456789012345678901234567890'),
        },
      } as unknown as NextRequest

      const address = extractWalletAddress(mockRequest)
      expect(address).toBe('0x1234567890123456789012345678901234567890')
    })

    it('should return null for missing header', () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as unknown as NextRequest

      const address = extractWalletAddress(mockRequest)
      expect(address).toBeNull()
    })

    it('should return null for invalid address format', () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('invalid-address'),
        },
      } as unknown as NextRequest

      const address = extractWalletAddress(mockRequest)
      expect(address).toBeNull()
    })

    it('should convert address to lowercase', () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('0X1234567890123456789012345678901234567890'),
        },
      } as unknown as NextRequest

      const address = extractWalletAddress(mockRequest)
      expect(address).toBe('0x1234567890123456789012345678901234567890')
    })
  })

  describe('requireAuth', () => {
    it('should return null for valid wallet address', () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('0x1234567890123456789012345678901234567890'),
        },
      } as unknown as NextRequest

      const result = requireAuth(mockRequest)
      expect(result).toBeNull()
    })

    it('should return error response for missing wallet address', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as unknown as NextRequest

      const result = requireAuth(mockRequest)
      expect(result).not.toBeNull()
      
      if (result) {
        const json = await result.json()
        expect(json.message).toContain('Authentication required')
        expect(result.status).toBe(401)
      }
    })

    it('should return error response for invalid wallet address', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('invalid-address'),
        },
      } as unknown as NextRequest

      const result = requireAuth(mockRequest)
      expect(result).not.toBeNull()
      
      if (result) {
        const json = await result.json()
        expect(json.message).toContain('Authentication required')
        expect(result.status).toBe(401)
      }
    })
  })
})

export {}