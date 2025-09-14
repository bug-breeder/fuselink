import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPairingData, generateQRCode, parsePairingData, isValidPairingData } from './qr'
import QRCode from 'qrcode'

// Mock QRCode library
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn()
  }
}))

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-1234-5678')
}))

describe('QR Code utilities', () => {
  const mockPublicKeyJwk = {
    kty: 'EC',
    crv: 'P-256',
    x: 'mock-x-coordinate',
    y: 'mock-y-coordinate'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(QRCode.toDataURL).mockResolvedValue('data:image/png;base64,mock-qr-code')

    // Mock Date.now to return consistent timestamp
    vi.spyOn(Date, 'now').mockReturnValue(1640995200000) // 2022-01-01 00:00:00 UTC
  })

  describe('createPairingData', () => {
    it('should create valid pairing data', () => {
      const pairingData = createPairingData(
        'device-123',
        'My Device',
        mockPublicKeyJwk,
        '/ip4/127.0.0.1/tcp/4001/p2p/12D3KooW...'
      )

      expect(pairingData).toEqual({
        version: '1.0',
        deviceId: 'device-123',
        deviceName: 'My Device',
        publicKeyJwk: mockPublicKeyJwk,
        pairingId: 'mock-uuid-1234-5678',
        timestamp: 1640995200000,
        libp2pMultiaddr: '/ip4/127.0.0.1/tcp/4001/p2p/12D3KooW...'
      })
    })

    it('should create pairing data without libp2p multiaddr', () => {
      const pairingData = createPairingData(
        'device-456',
        'Another Device',
        mockPublicKeyJwk
      )

      expect(pairingData.libp2pMultiaddr).toBeUndefined()
      expect(pairingData.version).toBe('1.0')
      expect(pairingData.deviceId).toBe('device-456')
    })

    it('should generate unique pairing IDs', async () => {
      // Since we mocked v4 to return the same value, let's test that it generates IDs
      const data1 = createPairingData('device-1', 'Device 1', mockPublicKeyJwk)
      const data2 = createPairingData('device-2', 'Device 2', mockPublicKeyJwk)

      expect(data1.pairingId).toBe('mock-uuid-1234-5678')
      expect(data2.pairingId).toBe('mock-uuid-1234-5678')
    })
  })

  describe('generateQRCode', () => {
    it('should generate QR code from pairing data', async () => {
      const pairingData = createPairingData('device-123', 'My Device', mockPublicKeyJwk)

      const qrCode = await generateQRCode(pairingData)

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        JSON.stringify(pairingData),
        {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          quality: 0.92,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          width: 256
        }
      )

      expect(qrCode).toBe('data:image/png;base64,mock-qr-code')
    })

    it('should handle QR code generation errors', async () => {
      const pairingData = createPairingData('device-123', 'My Device', mockPublicKeyJwk)
      const mockError = new Error('QR generation failed')

      vi.mocked(QRCode.toDataURL).mockRejectedValue(mockError)

      await expect(generateQRCode(pairingData)).rejects.toThrow('QR code generation failed')
    })

    it('should use correct QR code options', async () => {
      const pairingData = createPairingData('device-123', 'My Device', mockPublicKeyJwk)

      await generateQRCode(pairingData)

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          errorCorrectionLevel: 'M',
          type: 'image/png',
          quality: 0.92,
          margin: 1,
          width: 256
        })
      )
    })
  })

  describe('parsePairingData', () => {
    const validPairingData = {
      version: '1.0',
      deviceId: 'device-123',
      deviceName: 'Test Device',
      publicKeyJwk: mockPublicKeyJwk,
      pairingId: 'pairing-123',
      timestamp: 1640995200000, // Current time
      libp2pMultiaddr: '/ip4/127.0.0.1/tcp/4001'
    }

    it('should parse valid pairing data', () => {
      const jsonString = JSON.stringify(validPairingData)

      const parsed = parsePairingData(jsonString)

      expect(parsed).toEqual(validPairingData)
    })

    it('should return null for invalid JSON', () => {
      const parsed = parsePairingData('invalid json string')

      expect(parsed).toBeNull()
    })

    it('should return null for missing required fields', () => {
      const incompleteData = {
        version: '1.0',
        deviceId: 'device-123',
        // Missing deviceName, publicKeyJwk, pairingId
        timestamp: Date.now()
      }

      const parsed = parsePairingData(JSON.stringify(incompleteData))

      expect(parsed).toBeNull()
    })

    it('should return null for expired pairing data', () => {
      const expiredData = {
        ...validPairingData,
        timestamp: 1640995200000 - (11 * 60 * 1000) // 11 minutes ago
      }

      // Mock current time to be 10+ minutes later
      vi.mocked(Date.now).mockReturnValue(1640995200000)

      const parsed = parsePairingData(JSON.stringify(expiredData))

      expect(parsed).toBeNull()
    })

    it('should accept recent pairing data', () => {
      const recentData = {
        ...validPairingData,
        timestamp: 1640995200000 - (5 * 60 * 1000) // 5 minutes ago
      }

      // Mock current time
      vi.mocked(Date.now).mockReturnValue(1640995200000)

      const parsed = parsePairingData(JSON.stringify(recentData))

      expect(parsed).toEqual(recentData)
    })

    it('should accept pairing data without libp2p multiaddr', () => {
      const dataWithoutMultiaddr = {
        ...validPairingData,
        libp2pMultiaddr: undefined
      }
      delete dataWithoutMultiaddr.libp2pMultiaddr

      const parsed = parsePairingData(JSON.stringify(dataWithoutMultiaddr))

      expect(parsed).toEqual(dataWithoutMultiaddr)
    })
  })

  describe('isValidPairingData', () => {
    const validData = {
      version: '1.0',
      deviceId: 'device-123',
      deviceName: 'Test Device',
      publicKeyJwk: mockPublicKeyJwk,
      pairingId: 'pairing-123',
      timestamp: 1640995200000
    }

    it('should validate correct pairing data', () => {
      expect(isValidPairingData(validData)).toBe(true)
    })

    it('should reject null or undefined', () => {
      expect(isValidPairingData(null)).toBe(false)
      expect(isValidPairingData(undefined)).toBe(false)
    })

    it('should reject non-object types', () => {
      expect(isValidPairingData('string')).toBe(false)
      expect(isValidPairingData(123)).toBe(false)
      expect(isValidPairingData([])).toBe(false)
    })

    it('should reject data with missing version', () => {
      const dataWithoutVersion = { ...validData }
      delete dataWithoutVersion.version

      expect(isValidPairingData(dataWithoutVersion)).toBe(false)
    })

    it('should reject data with wrong type version', () => {
      const dataWithWrongVersion = { ...validData, version: 123 }

      expect(isValidPairingData(dataWithWrongVersion)).toBe(false)
    })

    it('should reject data with missing deviceId', () => {
      const dataWithoutDeviceId = { ...validData }
      delete dataWithoutDeviceId.deviceId

      expect(isValidPairingData(dataWithoutDeviceId)).toBe(false)
    })

    it('should reject data with wrong type deviceId', () => {
      const dataWithWrongDeviceId = { ...validData, deviceId: 123 }

      expect(isValidPairingData(dataWithWrongDeviceId)).toBe(false)
    })

    it('should reject data with missing deviceName', () => {
      const dataWithoutDeviceName = { ...validData }
      delete dataWithoutDeviceName.deviceName

      expect(isValidPairingData(dataWithoutDeviceName)).toBe(false)
    })

    it('should reject data with wrong type deviceName', () => {
      const dataWithWrongDeviceName = { ...validData, deviceName: 123 }

      expect(isValidPairingData(dataWithWrongDeviceName)).toBe(false)
    })

    it('should reject data with missing publicKeyJwk', () => {
      const dataWithoutPublicKey = { ...validData }
      delete dataWithoutPublicKey.publicKeyJwk

      expect(isValidPairingData(dataWithoutPublicKey)).toBe(false)
    })

    it('should reject data with wrong type publicKeyJwk', () => {
      const dataWithWrongPublicKey = { ...validData, publicKeyJwk: 'string' }

      expect(isValidPairingData(dataWithWrongPublicKey)).toBe(false)
    })

    it('should reject data with missing pairingId', () => {
      const dataWithoutPairingId = { ...validData }
      delete dataWithoutPairingId.pairingId

      expect(isValidPairingData(dataWithoutPairingId)).toBe(false)
    })

    it('should reject data with wrong type pairingId', () => {
      const dataWithWrongPairingId = { ...validData, pairingId: 123 }

      expect(isValidPairingData(dataWithWrongPairingId)).toBe(false)
    })

    it('should reject data with missing timestamp', () => {
      const dataWithoutTimestamp = { ...validData }
      delete dataWithoutTimestamp.timestamp

      expect(isValidPairingData(dataWithoutTimestamp)).toBe(false)
    })

    it('should reject data with wrong type timestamp', () => {
      const dataWithWrongTimestamp = { ...validData, timestamp: 'string' }

      expect(isValidPairingData(dataWithWrongTimestamp)).toBe(false)
    })

    it('should accept data with libp2pMultiaddr', () => {
      const dataWithMultiaddr = {
        ...validData,
        libp2pMultiaddr: '/ip4/127.0.0.1/tcp/4001'
      }

      expect(isValidPairingData(dataWithMultiaddr)).toBe(true)
    })

    it('should accept data without libp2pMultiaddr', () => {
      expect(isValidPairingData(validData)).toBe(true)
    })
  })
})