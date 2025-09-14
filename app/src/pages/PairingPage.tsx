import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QrCode, Camera, Smartphone, Users, CheckCircle2 } from 'lucide-react'
import { QRGenerator } from '@/components/QRGenerator'
import { QRScanner } from '@/components/QRScanner'
import { SafetyWordsVerification } from '@/components/SafetyWordsVerification'
import { useDeviceStore } from '@/stores/deviceStore'
import { useLibP2PStore } from '@/stores/libp2pStore'
import type { PairingData } from '@/lib/qr'

type PairingStep = 'select-mode' | 'generate-qr' | 'scan-qr' | 'verify-safety-words' | 'pairing-complete'

export function PairingPage() {
  const [currentStep, setCurrentStep] = useState<PairingStep>('select-mode')
  const [pairingMode, setPairingMode] = useState<'generate' | 'scan' | null>(null)
  const [scannedPairingData, setScannedPairingData] = useState<PairingData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    deviceId,
    deviceName,
    isDeviceInitialized,
    initializeDevice,
    addTrustedDevice,
    getTrustedDevice,
    restoreDeviceKeys
  } = useDeviceStore()
  const { isConnected } = useLibP2PStore()

  // Initialize device and restore keys if needed
  useEffect(() => {
    const initDevice = async () => {
      try {
        if (deviceId && !isDeviceInitialized()) {
          // Device exists but keys need to be restored
          await restoreDeviceKeys()
          console.log('Device keys restored for existing device:', deviceId)
        } else if (!deviceId) {
          // Brand new device - initialize with default name
          const defaultName = `Device-${Date.now().toString(36).slice(-4)}`
          await initializeDevice(defaultName)
        }
      } catch (error) {
        console.error('Failed to initialize device:', error)
        setError('Failed to initialize device')
      }
    }

    initDevice()
  }, [deviceId, isDeviceInitialized, initializeDevice, restoreDeviceKeys])

  const handleModeSelect = (mode: 'generate' | 'scan') => {
    setPairingMode(mode)
    setCurrentStep(mode === 'generate' ? 'generate-qr' : 'scan-qr')
    setError(null)
  }

  const handlePairingDataCreated = (pairingId: string) => {
    console.log('Pairing data created:', pairingId)
  }

  const handlePairingDataScanned = (pairingData: PairingData) => {
    setScannedPairingData(pairingData)

    // Check if this device is already trusted
    const trustedDevice = getTrustedDevice(pairingData.deviceId)

    if (trustedDevice && trustedDevice.isPaired) {
      // Device is already trusted - skip verification and go straight to completion
      console.log('Recognized trusted device:', trustedDevice.name)
      setCurrentStep('pairing-complete')

      // Update last seen timestamp
      addTrustedDevice({
        id: pairingData.deviceId,
        name: pairingData.deviceName,
        publicKeyJwk: pairingData.publicKeyJwk,
        created: pairingData.timestamp,
        lastSeen: Date.now()
      }, true)
    } else {
      // New or untrusted device - proceed with verification
      setCurrentStep('verify-safety-words')
    }
  }

  const handleVerificationComplete = () => {
    if (scannedPairingData) {
      // Add the scanned device to trusted devices
      addTrustedDevice({
        id: scannedPairingData.deviceId,
        name: scannedPairingData.deviceName,
        publicKeyJwk: scannedPairingData.publicKeyJwk,
        created: scannedPairingData.timestamp,
        lastSeen: Date.now()
      }, true)

      setCurrentStep('pairing-complete')
    }
  }

  const handleVerificationRejected = () => {
    setCurrentStep('scan-qr')
    setScannedPairingData(null)
    setError('Device verification failed. Please try scanning again.')
  }

  const handleScanError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const resetPairing = () => {
    setCurrentStep('select-mode')
    setPairingMode(null)
    setScannedPairingData(null)
    setCurrentPairingId(null)
    setError(null)
  }

  const stepIndicator = (step: PairingStep, title: string, isActive: boolean, isCompleted: boolean) => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${
      isActive ? 'bg-primary text-primary-foreground' :
      isCompleted ? 'bg-green-100 text-green-800' :
      'bg-muted text-muted-foreground'
    }`}>
      {isCompleted ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <div className={`w-4 h-4 rounded-full border-2 ${
          isActive ? 'border-primary-foreground bg-primary-foreground' : 'border-current'
        }`} />
      )}
      <span className="text-sm font-medium">{title}</span>
    </div>
  )

  if (!isDeviceInitialized()) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Smartphone className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
              <div>
                <h3 className="text-lg font-semibold">Initializing Device</h3>
                <p className="text-muted-foreground">Setting up your device identity...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Device Pairing</h1>
          <p className="text-muted-foreground">
            Connect two devices securely to start syncing files
          </p>
        </div>

        {/* Device Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5" />
                <div>
                  <p className="font-medium">{deviceName}</p>
                  <p className="text-sm text-muted-foreground">
                    {deviceId?.substring(0, 16)}...
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={isConnected ? 'default' : 'secondary'}>
                  {isConnected ? 'Connected' : 'Connecting...'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        {currentStep !== 'select-mode' && (
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            {stepIndicator('select-mode', 'Mode', false, true)}
            <div className="h-px bg-border flex-1 min-w-4" />
            {stepIndicator(
              pairingMode === 'generate' ? 'generate-qr' : 'scan-qr',
              pairingMode === 'generate' ? 'Generate' : 'Scan',
              currentStep === 'generate-qr' || currentStep === 'scan-qr',
              currentStep !== 'select-mode' && currentStep !== 'generate-qr' && currentStep !== 'scan-qr'
            )}
            <div className="h-px bg-border flex-1 min-w-4" />
            {stepIndicator('verify-safety-words', 'Verify', currentStep === 'verify-safety-words', currentStep === 'pairing-complete')}
            <div className="h-px bg-border flex-1 min-w-4" />
            {stepIndicator('pairing-complete', 'Complete', currentStep === 'pairing-complete', false)}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 'select-mode' && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => handleModeSelect('generate')}>
                <CardHeader className="text-center">
                  <QrCode className="h-12 w-12 mx-auto text-primary" />
                  <CardTitle>Generate QR Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">
                    Create a QR code for another device to scan and connect to this device
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => handleModeSelect('scan')}>
                <CardHeader className="text-center">
                  <Camera className="h-12 w-12 mx-auto text-primary" />
                  <CardTitle>Scan QR Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">
                    Use your camera to scan a QR code from another device
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentStep === 'generate-qr' && (
          <div className="space-y-4">
            <QRGenerator onPairingDataCreated={handlePairingDataCreated} />
            <div className="flex justify-center">
              <Button variant="outline" onClick={resetPairing}>
                Back to Options
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'scan-qr' && (
          <div className="space-y-4">
            <QRScanner
              onPairingDataScanned={handlePairingDataScanned}
              onError={handleScanError}
            />
            <div className="flex justify-center">
              <Button variant="outline" onClick={resetPairing}>
                Back to Options
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'verify-safety-words' && scannedPairingData && (
          <div className="space-y-4">
            <SafetyWordsVerification
              pairingData={scannedPairingData}
              onVerified={handleVerificationComplete}
              onRejected={handleVerificationRejected}
            />
          </div>
        )}

        {currentStep === 'pairing-complete' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Pairing Successful!</h3>
                  <p className="text-muted-foreground">
                    {scannedPairingData ?
                      `Successfully paired with ${scannedPairingData.deviceName}` :
                      'Device pairing completed successfully'
                    }
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={resetPairing} variant="outline">
                    Pair Another Device
                  </Button>
                  <Button>
                    Start Syncing
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}