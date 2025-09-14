import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateDeviceKeypair,
  exportPublicKey,
  importPublicKey,
  generateDeviceId,
  generateSafetyWords,
  deriveSharedSecret,
  deriveAESKey
} from './crypto'

describe('Crypto utilities', () => {
  beforeEach(() => {
    // Mock crypto.subtle methods
    vi.mocked(crypto.subtle.generateKey).mockResolvedValue({
      publicKey: { type: 'public', algorithm: { name: 'ECDH', namedCurve: 'P-256' } },
      privateKey: { type: 'private', algorithm: { name: 'ECDH', namedCurve: 'P-256' } }
    } as CryptoKeyPair)

    vi.mocked(crypto.subtle.exportKey).mockResolvedValue({
      kty: 'EC',
      crv: 'P-256',
      x: 'mock-x-coordinate',
      y: 'mock-y-coordinate'
    } as JsonWebKey)

    vi.mocked(crypto.subtle.importKey).mockResolvedValue({
      type: 'public',
      algorithm: { name: 'ECDH', namedCurve: 'P-256' }
    } as CryptoKey)

    vi.mocked(crypto.subtle.digest).mockResolvedValue(
      new Uint8Array(32).fill(0).buffer
    )

    vi.mocked(crypto.subtle.deriveBits).mockResolvedValue(
      new Uint8Array(32).fill(0).buffer
    )

    vi.mocked(crypto.subtle.deriveKey).mockResolvedValue({
      type: 'secret',
      algorithm: { name: 'AES-GCM', length: 256 }
    } as CryptoKey)
  })

  describe('generateDeviceKeypair', () => {
    it('should generate ECDH P-256 keypair', async () => {
      const keypair = await generateDeviceKeypair()

      expect(crypto.subtle.generateKey).toHaveBeenCalledWith(
        {
          name: 'ECDH',
          namedCurve: 'P-256'
        },
        true,
        ['deriveKey', 'deriveBits']
      )

      expect(keypair).toHaveProperty('publicKey')
      expect(keypair).toHaveProperty('privateKey')
    })

    it('should generate extractable keys', async () => {
      await generateDeviceKeypair()

      expect(crypto.subtle.generateKey).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'ECDH',
          namedCurve: 'P-256'
        }),
        true, // extractable
        ['deriveKey', 'deriveBits']
      )
    })
  })

  describe('exportPublicKey', () => {
    it('should export public key to JWK format', async () => {
      const mockPublicKey = { type: 'public' } as CryptoKey
      const jwk = await exportPublicKey(mockPublicKey)

      expect(crypto.subtle.exportKey).toHaveBeenCalledWith('jwk', mockPublicKey)
      expect(jwk).toEqual({
        kty: 'EC',
        crv: 'P-256',
        x: 'mock-x-coordinate',
        y: 'mock-y-coordinate'
      })
    })
  })

  describe('importPublicKey', () => {
    it('should import public key from JWK format', async () => {
      const mockJwk = {
        kty: 'EC',
        crv: 'P-256',
        x: 'mock-x-coordinate',
        y: 'mock-y-coordinate'
      }

      const key = await importPublicKey(mockJwk)

      expect(crypto.subtle.importKey).toHaveBeenCalledWith(
        'jwk',
        mockJwk,
        {
          name: 'ECDH',
          namedCurve: 'P-256'
        },
        false,
        []
      )

      expect(key).toHaveProperty('type', 'public')
    })
  })

  describe('generateDeviceId', () => {
    it('should generate consistent device ID from public key', async () => {
      const mockJwk = {
        kty: 'EC',
        crv: 'P-256',
        x: 'test-x',
        y: 'test-y'
      }

      // Mock digest to return specific hash
      const mockHash = new Uint8Array([
        0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0,
        0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
        0x99, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF, 0x00,
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08
      ])

      vi.mocked(crypto.subtle.digest).mockResolvedValue(mockHash.buffer)

      const deviceId1 = await generateDeviceId(mockJwk)
      const deviceId2 = await generateDeviceId(mockJwk)

      expect(deviceId1).toBe(deviceId2) // Should be deterministic
      expect(deviceId1).toBe('123456789abcdef0') // First 16 chars
      expect(deviceId1).toHaveLength(16)

      // Should call digest with proper input
      expect(crypto.subtle.digest).toHaveBeenCalledWith('SHA-256', expect.any(Object))
    })

    it('should produce different IDs for different keys', async () => {
      const jwk1 = { kty: 'EC', crv: 'P-256', x: 'test-x-1', y: 'test-y-1' }
      const jwk2 = { kty: 'EC', crv: 'P-256', x: 'test-x-2', y: 'test-y-2' }

      // Mock different hashes for different inputs
      vi.mocked(crypto.subtle.digest)
        .mockResolvedValueOnce(new Uint8Array(32).fill(0x11).buffer)
        .mockResolvedValueOnce(new Uint8Array(32).fill(0x22).buffer)

      const deviceId1 = await generateDeviceId(jwk1)
      const deviceId2 = await generateDeviceId(jwk2)

      expect(deviceId1).not.toBe(deviceId2)
    })
  })

  describe('generateSafetyWords', () => {
    it('should generate 4 safety words from data', async () => {
      const testData = 'test-device-id'

      // Mock hash with specific values to predict word selection
      const mockHash = new Uint8Array([
        5, 10, 15, 20, // Will select words at indices 5, 10, 15, 20
        25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80,
        85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140,
        145, 150, 155, 160
      ])

      vi.mocked(crypto.subtle.digest).mockResolvedValue(mockHash.buffer)

      const words = await generateSafetyWords(testData)

      expect(words).toHaveLength(4)
      expect(words).toEqual(['absorb', 'access', 'acoustic', 'actress'])

      // Verify digest was called correctly
      expect(crypto.subtle.digest).toHaveBeenCalledWith('SHA-256', expect.any(Object))
    })

    it('should generate consistent words for same input', async () => {
      const testData = 'same-device-id'
      const mockHash = new Uint8Array(32).fill(42)
      vi.mocked(crypto.subtle.digest).mockResolvedValue(mockHash.buffer)

      const words1 = await generateSafetyWords(testData)
      const words2 = await generateSafetyWords(testData)

      expect(words1).toEqual(words2)
    })

    it('should generate different words for different inputs', async () => {
      vi.mocked(crypto.subtle.digest)
        .mockResolvedValueOnce(new Uint8Array(32).fill(1).buffer)
        .mockResolvedValueOnce(new Uint8Array(32).fill(50).buffer)

      const words1 = await generateSafetyWords('device-1')
      const words2 = await generateSafetyWords('device-2')

      expect(words1).not.toEqual(words2)
    })
  })

  describe('deriveSharedSecret', () => {
    it('should derive shared secret using ECDH', async () => {
      const mockPrivateKey = { type: 'private' } as CryptoKey
      const mockPublicKey = { type: 'public' } as CryptoKey
      const mockSecret = new ArrayBuffer(32)

      vi.mocked(crypto.subtle.deriveBits).mockResolvedValue(mockSecret)

      const secret = await deriveSharedSecret(mockPrivateKey, mockPublicKey)

      expect(crypto.subtle.deriveBits).toHaveBeenCalledWith(
        {
          name: 'ECDH',
          public: mockPublicKey
        },
        mockPrivateKey,
        256
      )

      expect(secret).toBe(mockSecret)
    })
  })

  describe('deriveAESKey', () => {
    it('should derive AES-GCM key from shared secret', async () => {
      const mockSharedSecret = new ArrayBuffer(32)
      const mockSalt = new Uint8Array([1, 2, 3, 4])
      const mockBaseKey = { type: 'secret' } as CryptoKey
      const mockDerivedKey = {
        type: 'secret',
        algorithm: { name: 'AES-GCM', length: 256 }
      } as CryptoKey

      vi.mocked(crypto.subtle.importKey).mockResolvedValue(mockBaseKey)
      vi.mocked(crypto.subtle.deriveKey).mockResolvedValue(mockDerivedKey)

      const aesKey = await deriveAESKey(mockSharedSecret, mockSalt)

      // Should import shared secret as raw key material
      expect(crypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        mockSharedSecret,
        'HKDF',
        false,
        ['deriveKey']
      )

      // Should derive AES key using HKDF
      expect(crypto.subtle.deriveKey).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'HKDF',
          hash: 'SHA-256',
          salt: mockSalt,
          info: expect.any(Object)
        }),
        mockBaseKey,
        {
          name: 'AES-GCM',
          length: 256
        },
        false,
        ['encrypt', 'decrypt']
      )

      expect(aesKey).toBe(mockDerivedKey)
    })

    it('should use correct info parameter', async () => {
      const mockSharedSecret = new ArrayBuffer(32)
      const mockSalt = new Uint8Array([1, 2, 3, 4])

      await deriveAESKey(mockSharedSecret, mockSalt)

      const expectedInfo = new TextEncoder().encode('fuselink-session-key')

      expect(crypto.subtle.deriveKey).toHaveBeenCalledWith(
        expect.objectContaining({
          info: expectedInfo
        }),
        expect.any(Object),
        expect.any(Object),
        false,
        ['encrypt', 'decrypt']
      )
    })
  })
})