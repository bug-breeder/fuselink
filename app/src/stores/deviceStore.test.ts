import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDeviceStore, type DeviceInfo } from './deviceStore'
import { act, renderHook } from '@testing-library/react'
import * as crypto from '@/lib/crypto'

// Mock the crypto module
vi.mock('@/lib/crypto', () => ({
  generateDeviceKeypair: vi.fn(),
  exportPublicKey: vi.fn(),
  generateDeviceId: vi.fn(),
  generateSafetyWords: vi.fn(),
}))

describe('Device Store', () => {
  const mockKeypair = {
    publicKey: { type: 'public' } as CryptoKey,
    privateKey: { type: 'private' } as CryptoKey
  }

  const mockPublicKeyJwk = {
    kty: 'EC',
    crv: 'P-256',
    x: 'mock-x',
    y: 'mock-y'
  }

  const mockDeviceId = 'abcd1234efgh5678'

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Clear localStorage
    localStorage.clear()

    // Reset store state
    useDeviceStore.setState({
      deviceId: null,
      deviceName: null,
      publicKeyJwk: null,
      privateKey: null,
      deviceCreated: null,
      trustedDevices: []
    })

    // Set up crypto mocks
    vi.mocked(crypto.generateDeviceKeypair).mockResolvedValue(mockKeypair)
    vi.mocked(crypto.exportPublicKey).mockResolvedValue(mockPublicKeyJwk)
    vi.mocked(crypto.generateDeviceId).mockResolvedValue(mockDeviceId)
    vi.mocked(crypto.generateSafetyWords).mockResolvedValue(['test', 'safety', 'words', 'here'])
  })

  describe('initializeDevice', () => {
    it('should initialize a new device with keypair and identity', async () => {
      const { result } = renderHook(() => useDeviceStore())

      await act(async () => {
        await result.current.initializeDevice('Test Device')
      })

      expect(crypto.generateDeviceKeypair).toHaveBeenCalledOnce()
      expect(crypto.exportPublicKey).toHaveBeenCalledWith(mockKeypair.publicKey)
      expect(crypto.generateDeviceId).toHaveBeenCalledWith(mockPublicKeyJwk)

      expect(result.current.deviceId).toBe(mockDeviceId)
      expect(result.current.deviceName).toBe('Test Device')
      expect(result.current.publicKeyJwk).toEqual(mockPublicKeyJwk)
      expect(result.current.privateKey).toEqual(mockKeypair.privateKey)
      expect(result.current.deviceCreated).toBeTypeOf('number')
      expect(result.current.isDeviceInitialized()).toBe(true)
    })

    it('should update device name if device already exists', async () => {
      const { result } = renderHook(() => useDeviceStore())

      // First initialization
      await act(async () => {
        await result.current.initializeDevice('Original Name')
      })

      const originalDeviceId = result.current.deviceId
      const originalPublicKey = result.current.publicKeyJwk
      const originalPrivateKey = result.current.privateKey

      // Reset mocks to ensure no new crypto operations
      vi.clearAllMocks()

      // Second initialization with different name
      await act(async () => {
        await result.current.initializeDevice('Updated Name')
      })

      // Should not generate new crypto materials
      expect(crypto.generateDeviceKeypair).not.toHaveBeenCalled()
      expect(crypto.exportPublicKey).not.toHaveBeenCalled()
      expect(crypto.generateDeviceId).not.toHaveBeenCalled()

      // Should keep same identity but update name
      expect(result.current.deviceId).toBe(originalDeviceId)
      expect(result.current.publicKeyJwk).toEqual(originalPublicKey)
      expect(result.current.privateKey).toEqual(originalPrivateKey)
      expect(result.current.deviceName).toBe('Updated Name')
    })

    it('should handle initialization errors', async () => {
      const { result } = renderHook(() => useDeviceStore())

      const mockError = new Error('Crypto operation failed')
      vi.mocked(crypto.generateDeviceKeypair).mockRejectedValue(mockError)

      await expect(
        act(async () => {
          await result.current.initializeDevice('Test Device')
        })
      ).rejects.toThrow('Crypto operation failed')

      expect(result.current.deviceId).toBeNull()
      expect(result.current.deviceName).toBeNull()
      expect(result.current.isDeviceInitialized()).toBe(false)
    })
  })

  describe('restoreDeviceKeys', () => {
    it('should restore private key when public key exists but private key is missing', async () => {
      const { result } = renderHook(() => useDeviceStore())

      // Simulate persisted state without private key
      act(() => {
        useDeviceStore.setState({
          deviceId: mockDeviceId,
          deviceName: 'Test Device',
          publicKeyJwk: mockPublicKeyJwk,
          privateKey: null,
          deviceCreated: Date.now(),
          trustedDevices: []
        })
      })

      expect(result.current.isDeviceInitialized()).toBe(false)

      await act(async () => {
        await result.current.restoreDeviceKeys()
      })

      expect(crypto.generateDeviceKeypair).toHaveBeenCalledOnce()
      expect(result.current.privateKey).toEqual(mockKeypair.privateKey)
      expect(result.current.isDeviceInitialized()).toBe(true)
    })

    it('should not restore keys if private key already exists', async () => {
      const { result } = renderHook(() => useDeviceStore())

      act(() => {
        useDeviceStore.setState({
          deviceId: mockDeviceId,
          deviceName: 'Test Device',
          publicKeyJwk: mockPublicKeyJwk,
          privateKey: mockKeypair.privateKey,
          deviceCreated: Date.now(),
          trustedDevices: []
        })
      })

      await act(async () => {
        await result.current.restoreDeviceKeys()
      })

      expect(crypto.generateDeviceKeypair).not.toHaveBeenCalled()
    })

    it('should not restore keys if no public key exists', async () => {
      const { result } = renderHook(() => useDeviceStore())

      await act(async () => {
        await result.current.restoreDeviceKeys()
      })

      expect(crypto.generateDeviceKeypair).not.toHaveBeenCalled()
    })
  })

  describe('trusted device management', () => {

    const createMockDevice = (id: string, name: string): DeviceInfo => ({
      id,
      name,
      publicKeyJwk: { kty: 'EC', crv: 'P-256', x: `x-${id}`, y: `y-${id}` },
      created: Date.now(),
      lastSeen: Date.now()
    })

    it('should add trusted device with pairing status', () => {
      const { result } = renderHook(() => useDeviceStore())
      const device = createMockDevice('device-1', 'Device 1')

      act(() => {
        result.current.addTrustedDevice(device, true)
      })

      const trusted = result.current.getTrustedDevice('device-1')
      expect(trusted).toBeDefined()
      expect(trusted?.id).toBe('device-1')
      expect(trusted?.name).toBe('Device 1')
      expect(trusted?.isPaired).toBe(true)
      expect(trusted?.lastPairedAt).toBeTypeOf('number')
      expect(result.current.isDeviceTrusted('device-1')).toBe(true)
    })

    it('should add device without pairing status', () => {
      const { result } = renderHook(() => useDeviceStore())
      const device = createMockDevice('device-2', 'Device 2')

      act(() => {
        result.current.addTrustedDevice(device, false)
      })

      const trusted = result.current.getTrustedDevice('device-2')
      expect(trusted?.isPaired).toBe(false)
      expect(trusted?.lastPairedAt).toBeUndefined()
      expect(result.current.isDeviceTrusted('device-2')).toBe(false)
    })

    it('should update existing device when added again', () => {
      const { result } = renderHook(() => useDeviceStore())
      const device = createMockDevice('device-3', 'Original Name')

      act(() => {
        result.current.addTrustedDevice(device, false)
      })

      const updatedDevice = { ...device, name: 'Updated Name' }

      act(() => {
        result.current.addTrustedDevice(updatedDevice, true)
      })

      expect(result.current.trustedDevices).toHaveLength(1)

      const trusted = result.current.getTrustedDevice('device-3')
      expect(trusted?.name).toBe('Updated Name')
      expect(trusted?.isPaired).toBe(true)
    })

    it('should remove trusted device', () => {
      const { result } = renderHook(() => useDeviceStore())
      const device1 = createMockDevice('device-1', 'Device 1')
      const device2 = createMockDevice('device-2', 'Device 2')

      act(() => {
        result.current.addTrustedDevice(device1, true)
        result.current.addTrustedDevice(device2, true)
      })

      expect(result.current.trustedDevices).toHaveLength(2)

      act(() => {
        result.current.removeTrustedDevice('device-1')
      })

      expect(result.current.trustedDevices).toHaveLength(1)
      expect(result.current.getTrustedDevice('device-1')).toBeNull()
      expect(result.current.getTrustedDevice('device-2')).toBeDefined()
    })

    it('should handle removing non-existent device', () => {
      const { result } = renderHook(() => useDeviceStore())

      act(() => {
        result.current.removeTrustedDevice('non-existent')
      })

      expect(result.current.trustedDevices).toHaveLength(0)
    })
  })

  describe('device name management', () => {
    it('should update device name', () => {
      const { result } = renderHook(() => useDeviceStore())

      act(() => {
        useDeviceStore.setState({
          deviceName: 'Original Name'
        })
      })

      act(() => {
        result.current.updateDeviceName('New Name')
      })

      expect(result.current.deviceName).toBe('New Name')
    })
  })

  describe('safety words', () => {
    it('should generate safety words for device ID', async () => {
      const { result } = renderHook(() => useDeviceStore())

      const words = await act(async () => {
        return await result.current.getSafetyWords('test-device-id')
      })

      expect(crypto.generateSafetyWords).toHaveBeenCalledWith('test-device-id')
      expect(words).toEqual(['test', 'safety', 'words', 'here'])
    })
  })

  describe('device info', () => {
    it('should return device info when initialized', () => {
      const { result } = renderHook(() => useDeviceStore())
      const now = Date.now()

      act(() => {
        useDeviceStore.setState({
          deviceId: mockDeviceId,
          deviceName: 'Test Device',
          publicKeyJwk: mockPublicKeyJwk,
          deviceCreated: now
        })
      })

      const info = result.current.getDeviceInfo()
      expect(info).toEqual({
        id: mockDeviceId,
        name: 'Test Device',
        publicKeyJwk: mockPublicKeyJwk,
        created: now,
        lastSeen: expect.any(Number)
      })
    })

    it('should return null when not initialized', () => {
      const { result } = renderHook(() => useDeviceStore())

      const info = result.current.getDeviceInfo()
      expect(info).toBeNull()
    })

    it('should use current time as created if deviceCreated is null', () => {
      const { result } = renderHook(() => useDeviceStore())

      act(() => {
        useDeviceStore.setState({
          deviceId: mockDeviceId,
          deviceName: 'Test Device',
          publicKeyJwk: mockPublicKeyJwk,
          deviceCreated: null
        })
      })

      const info = result.current.getDeviceInfo()
      expect(info?.created).toBeTypeOf('number')
      expect(info?.created).toBeCloseTo(Date.now(), -2) // Within 100ms
    })
  })

  describe('isDeviceInitialized', () => {
    it('should return true when fully initialized', () => {
      const { result } = renderHook(() => useDeviceStore())

      act(() => {
        useDeviceStore.setState({
          deviceId: mockDeviceId,
          publicKeyJwk: mockPublicKeyJwk,
          privateKey: mockKeypair.privateKey
        })
      })

      expect(result.current.isDeviceInitialized()).toBe(true)
    })

    it('should return false when missing deviceId', () => {
      const { result } = renderHook(() => useDeviceStore())

      act(() => {
        useDeviceStore.setState({
          deviceId: null,
          publicKeyJwk: mockPublicKeyJwk,
          privateKey: mockKeypair.privateKey
        })
      })

      expect(result.current.isDeviceInitialized()).toBe(false)
    })

    it('should return false when missing publicKeyJwk', () => {
      const { result } = renderHook(() => useDeviceStore())

      act(() => {
        useDeviceStore.setState({
          deviceId: mockDeviceId,
          publicKeyJwk: null,
          privateKey: mockKeypair.privateKey
        })
      })

      expect(result.current.isDeviceInitialized()).toBe(false)
    })

    it('should return false when missing privateKey', () => {
      const { result } = renderHook(() => useDeviceStore())

      act(() => {
        useDeviceStore.setState({
          deviceId: mockDeviceId,
          publicKeyJwk: mockPublicKeyJwk,
          privateKey: null
        })
      })

      expect(result.current.isDeviceInitialized()).toBe(false)
    })
  })

  describe('persistence', () => {
    it('should persist device identity to localStorage', () => {
      const mockSetItem = vi.mocked(localStorage.setItem)

      act(() => {
        useDeviceStore.setState({
          deviceId: mockDeviceId,
          deviceName: 'Test Device',
          publicKeyJwk: mockPublicKeyJwk,
          deviceCreated: 12345,
          trustedDevices: []
        })
      })

      // Zustand should persist the state
      expect(mockSetItem).toHaveBeenCalledWith(
        'device-store',
        expect.stringContaining(mockDeviceId)
      )
    })

    it('should not persist private key', () => {
      const mockSetItem = vi.mocked(localStorage.setItem)

      act(() => {
        useDeviceStore.setState({
          privateKey: mockKeypair.privateKey
        })
      })

      // Should not include privateKey in persisted data
      const persistedData = mockSetItem.mock.calls.find(call =>
        call[0] === 'device-store'
      )?.[1]

      if (persistedData) {
        expect(persistedData).not.toContain('privateKey')
      }
    })
  })
})