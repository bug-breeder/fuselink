import React, { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';
import { useDeviceStore } from '../state/deviceStore';
import { initializeDevice } from '../crypto/device';
import { QRDisplay } from '../components/pairing/qr-display';
import { QRScannerComponent } from '../components/pairing/qr-scanner';
import { useToast } from '../hooks/useToast';
import DefaultLayout from '../layouts/default';
import type { PairingQRData } from '../crypto/qr';
import type { Device } from '../state/types';

type PairingMode = 'select' | 'generate' | 'scan';

export default function PairingPage() {
  const [mode, setMode] = useState<PairingMode>('select');
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [initializing, setInitializing] = useState(true);
  
  const { setCurrentDevice: setStoreCurrentDevice, addPairedDevice } = useDeviceStore();
  const { success, error } = useToast();

  useEffect(() => {
    initializeCurrentDevice();
  }, []);

  const initializeCurrentDevice = async () => {
    try {
      setInitializing(true);
      const device = await initializeDevice();
      setCurrentDevice(device);
      setStoreCurrentDevice(device);
    } catch (err) {
      error('Device Initialization Failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setInitializing(false);
    }
  };

  const handleScanSuccess = async (pairingData: PairingQRData) => {
    try {
      // Create device object from QR data
      const pairedDevice: Device = {
        id: pairingData.deviceId,
        name: pairingData.deviceName,
        pubKeyJwk: pairingData.pubKeyJwk,
        lastSeen: pairingData.timestamp,
        isOnline: false,
      };

      // Add to paired devices
      addPairedDevice(pairedDevice);
      
      success('Device Paired Successfully', `${pairingData.deviceName} has been added to your paired devices`);
      
      // TODO: Initiate WebRTC connection for verification
      // TODO: Register pairing with server
      
      setMode('select');
    } catch (err) {
      error('Pairing Failed', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleModeSelect = (newMode: PairingMode) => {
    setMode(newMode);
  };

  const handleBack = () => {
    setMode('select');
  };

  if (initializing) {
    return (
      <DefaultLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Initializing Device</h1>
            <p className="text-default-500">Setting up device identity...</p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  if (!currentDevice) {
    return (
      <DefaultLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardBody className="text-center p-8">
              <h2 className="text-xl font-semibold text-danger mb-4">
                Device Initialization Failed
              </h2>
              <p className="text-default-500 mb-6">
                Unable to initialize device identity. Please try again.
              </p>
              <Button color="primary" onPress={initializeCurrentDevice}>
                Retry
              </Button>
            </CardBody>
          </Card>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Device Pairing</h1>
          <p className="text-default-500 mt-2">
            Connect your devices securely with end-to-end encryption
          </p>
        </div>

        {/* Current Device Info */}
        <Card className="mb-8">
          <CardBody className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">This Device</h3>
              <p className="font-medium">{currentDevice.name}</p>
              <p className="text-xs text-default-500 font-mono mt-1">
                {currentDevice.id.slice(0, 16)}...
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Mode Selection */}
        {mode === 'select' && (
          <div className="space-y-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardBody 
                className="p-6 text-center"
                onClick={() => handleModeSelect('generate')}
              >
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-lg font-semibold mb-2">Share QR Code</h3>
                <p className="text-default-500">
                  Generate a QR code for another device to scan and pair with this device
                </p>
              </CardBody>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardBody 
                className="p-6 text-center"
                onClick={() => handleModeSelect('scan')}
              >
                <div className="text-4xl mb-4">📷</div>
                <h3 className="text-lg font-semibold mb-2">Scan QR Code</h3>
                <p className="text-default-500">
                  Scan a QR code displayed on another device to pair with it
                </p>
              </CardBody>
            </Card>
          </div>
        )}

        {/* QR Code Generation */}
        {mode === 'generate' && (
          <QRDisplay
            device={currentDevice}
            onClose={handleBack}
            className="max-w-md mx-auto"
          />
        )}

        {/* QR Code Scanning */}
        {mode === 'scan' && (
          <QRScannerComponent
            onScanSuccess={handleScanSuccess}
            onCancel={handleBack}
            className="max-w-md mx-auto"
          />
        )}

        {/* Back Button for non-select modes */}
        {mode !== 'select' && (
          <div className="text-center mt-6">
            <Button variant="light" onPress={handleBack}>
              ← Back to Options
            </Button>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}