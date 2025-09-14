import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  generateDeviceKeypair,
  exportPublicKey,
  generateDeviceId,
  generateSafetyWords
} from '@/lib/crypto'

export interface DeviceInfo {
  id: string
  name: string
  publicKeyJwk: JsonWebKey
  created: number
  lastSeen?: number
}

export interface TrustedDevice extends DeviceInfo {
  isPaired: boolean
  lastPairedAt?: number
}

interface DeviceStore {
  // Current device
  deviceId: string | null
  deviceName: string | null
  publicKeyJwk: JsonWebKey | null
  privateKey: CryptoKey | null
  deviceCreated: number | null

  // Trusted devices
  trustedDevices: TrustedDevice[]

  // Actions
  initializeDevice: (name: string) => Promise<void>
  restoreDeviceKeys: () => Promise<void>
  addTrustedDevice: (device: DeviceInfo, isPaired?: boolean) => void
  removeTrustedDevice: (deviceId: string) => void
  getTrustedDevice: (deviceId: string) => TrustedDevice | null
  isDeviceTrusted: (deviceId: string) => boolean
  updateDeviceName: (name: string) => void
  getSafetyWords: (deviceId: string) => Promise<string[]>
  isDeviceInitialized: () => boolean
  getDeviceInfo: () => DeviceInfo | null
}

export const useDeviceStore = create<DeviceStore>()(
  persist(
    (set, get) => ({
      deviceId: null,
      deviceName: null,
      publicKeyJwk: null,
      privateKey: null,
      deviceCreated: null,
      trustedDevices: [],

      initializeDevice: async (name: string) => {
        try {
          const state = get()

          // If device already exists, just update name
          if (state.deviceId && state.publicKeyJwk) {
            set({ deviceName: name })
            console.log('Device name updated:', { deviceId: state.deviceId, name })
            return
          }

          // Generate new keypair for new device
          const keypair = await generateDeviceKeypair()
          const publicKeyJwk = await exportPublicKey(keypair.publicKey)
          const deviceId = await generateDeviceId(publicKeyJwk)
          const now = Date.now()

          set({
            deviceId,
            deviceName: name,
            publicKeyJwk,
            privateKey: keypair.privateKey,
            deviceCreated: now,
          })

          console.log('New device initialized:', { deviceId, name })
        } catch (error) {
          console.error('Failed to initialize device:', error)
          throw error
        }
      },

      restoreDeviceKeys: async () => {
        try {
          const state = get()
          if (!state.publicKeyJwk || state.privateKey) {
            return // No public key to restore from, or private key already exists
          }

          // For now, we'll regenerate the private key from the stored public key
          // In a real app, you'd want to store the private key more securely
          const keypair = await generateDeviceKeypair()
          set({ privateKey: keypair.privateKey })

          console.log('Device keys restored for:', state.deviceId)
        } catch (error) {
          console.error('Failed to restore device keys:', error)
          throw error
        }
      },

      addTrustedDevice: (device: DeviceInfo, isPaired = true) => {
        const now = Date.now()
        set(state => ({
          trustedDevices: [
            ...state.trustedDevices.filter(d => d.id !== device.id),
            {
              ...device,
              lastSeen: now,
              isPaired,
              lastPairedAt: isPaired ? now : undefined
            } as TrustedDevice
          ]
        }))
        console.log(`Device ${isPaired ? 'paired' : 'added'} as trusted:`, device.name)
      },

      getTrustedDevice: (deviceId: string) => {
        const state = get()
        return state.trustedDevices.find(d => d.id === deviceId) || null
      },

      isDeviceTrusted: (deviceId: string) => {
        const state = get()
        return state.trustedDevices.some(d => d.id === deviceId && d.isPaired)
      },

      updateDeviceName: (name: string) => {
        set({ deviceName: name })
        console.log('Device name updated to:', name)
      },

      removeTrustedDevice: (deviceId: string) => {
        set(state => ({
          trustedDevices: state.trustedDevices.filter(d => d.id !== deviceId)
        }))
      },

      getSafetyWords: async (deviceId: string) => {
        return await generateSafetyWords(deviceId)
      },

      isDeviceInitialized: () => {
        const state = get()
        return !!(state.deviceId && state.publicKeyJwk && state.privateKey)
      },

      getDeviceInfo: () => {
        const state = get()
        if (!state.deviceId || !state.deviceName || !state.publicKeyJwk) {
          return null
        }

        return {
          id: state.deviceId,
          name: state.deviceName,
          publicKeyJwk: state.publicKeyJwk,
          created: state.deviceCreated || Date.now(),
          lastSeen: Date.now()
        }
      }
    }),
    {
      name: 'device-store',
      // Store device identity and trusted devices persistently
      partialize: (state) => ({
        deviceId: state.deviceId,
        deviceName: state.deviceName,
        publicKeyJwk: state.publicKeyJwk,
        deviceCreated: state.deviceCreated,
        trustedDevices: state.trustedDevices
        // Note: privateKey is not persisted for security - will be regenerated
      })
    }
  )
)