import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Device } from './types';

interface DeviceState {
  // Current device info
  currentDevice: Device | null;
  deviceId: string | null;
  deviceName: string;
  
  // Paired devices
  pairedDevices: Device[];
  
  // Actions
  setCurrentDevice: (device: Device) => void;
  setDeviceName: (name: string) => void;
  addPairedDevice: (device: Device) => void;
  removePairedDevice: (deviceId: string) => void;
  updateDeviceStatus: (deviceId: string, isOnline: boolean, lastSeen?: number) => void;
  updateDeviceInfo: (deviceId: string, updates: Partial<Device>) => void;
  clearAllDevices: () => void;
}

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set) => ({
      currentDevice: null,
      deviceId: null,
      deviceName: 'My Device',
      pairedDevices: [],
      
      setCurrentDevice: (device) => 
        set({ currentDevice: device, deviceId: device.id }),
      
      setDeviceName: (name) => 
        set({ deviceName: name }),
      
      addPairedDevice: (device) => 
        set((state) => {
          const existing = state.pairedDevices.find(d => d.id === device.id);
          if (existing) {
            // Update existing device
            return {
              pairedDevices: state.pairedDevices.map(d => 
                d.id === device.id ? { ...d, ...device } : d
              )
            };
          }
          return {
            pairedDevices: [...state.pairedDevices, device]
          };
        }),
      
      removePairedDevice: (deviceId) => 
        set((state) => ({
          pairedDevices: state.pairedDevices.filter(d => d.id !== deviceId)
        })),
      
      updateDeviceStatus: (deviceId, isOnline, lastSeen) =>
        set((state) => ({
          pairedDevices: state.pairedDevices.map(device =>
            device.id === deviceId
              ? { ...device, isOnline, lastSeen: lastSeen || Date.now() }
              : device
          )
        })),
      
      updateDeviceInfo: (deviceId, updates) =>
        set((state) => ({
          pairedDevices: state.pairedDevices.map(device =>
            device.id === deviceId ? { ...device, ...updates } : device
          )
        })),
      
      clearAllDevices: () => 
        set({ pairedDevices: [], currentDevice: null, deviceId: null }),
    }),
    {
      name: 'fuselink-devices',
      partialize: (state) => ({
        deviceName: state.deviceName,
        pairedDevices: state.pairedDevices,
        currentDevice: state.currentDevice,
        deviceId: state.deviceId,
      }),
    }
  )
);