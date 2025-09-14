import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Camera, CameraOff, AlertCircle } from 'lucide-react'
import { parsePairingData, type PairingData } from '@/lib/qr'

interface QRScannerProps {
  onPairingDataScanned?: (pairingData: PairingData) => void
  onError?: (error: string) => void
}

export function QRScanner({ onPairingDataScanned, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)

  const startScanning = async () => {
    if (!videoRef.current) return

    try {
      setError(null)
      setIsScanning(true)

      // Initialize the reader
      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader()
      }

      // Get video input devices
      const videoDevices = await readerRef.current.listVideoInputDevices()

      if (videoDevices.length === 0) {
        throw new Error('No camera devices found')
      }

      // Use the first available device or the previously selected one
      const selectedDeviceId = deviceId || videoDevices[0].deviceId
      setDeviceId(selectedDeviceId)

      // Start decoding from video device
      await readerRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const text = result.getText()
            const pairingData = parsePairingData(text)

            if (pairingData) {
              onPairingDataScanned?.(pairingData)
              stopScanning()
            } else {
              setError('Invalid QR code format')
              onError?.('Invalid QR code format')
            }
          }

          if (error && !(error instanceof NotFoundException)) {
            console.error('QR Scanner Error:', error)
            setError(error.message)
            onError?.(error.message)
          }
        }
      )

      setHasPermission(true)
    } catch (err) {
      console.error('Failed to start camera:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to start camera'
      setError(errorMessage)
      onError?.(errorMessage)
      setHasPermission(false)
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset()
    }
    setIsScanning(false)
  }

  const requestPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
      setHasPermission(true)
      setError(null)
    } catch (err) {
      console.error('Camera permission denied:', err)
      setHasPermission(false)
      setError('Camera permission denied')
      onError?.('Camera permission denied')
    }
  }

  // Check camera permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach(track => track.stop()) // Stop immediately after checking
        setHasPermission(true)
      } catch {
        setHasPermission(false)
      }
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      checkPermission()
    } else {
      setHasPermission(false)
      setError('Camera not supported in this browser')
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (readerRef.current) {
        readerRef.current.reset()
      }
    }
  }, [])

  if (hasPermission === null) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Camera className="h-8 w-8 mx-auto text-muted-foreground animate-pulse" />
              <p className="text-sm text-muted-foreground">Checking camera permissions...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (hasPermission === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CameraOff className="h-5 w-5" />
            Camera Access Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Camera permission needed</p>
              <p className="text-yellow-700">
                To scan QR codes for device pairing, please allow camera access.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button onClick={requestPermission} className="w-full">
            <Camera className="h-4 w-4 mr-2" />
            Grant Camera Access
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Scan QR Code</CardTitle>
          <Badge variant={isScanning ? "default" : "secondary"}>
            {isScanning ? "Scanning..." : "Ready"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="relative">
          <video
            ref={videoRef}
            className="w-full aspect-square object-cover rounded-lg bg-black"
            playsInline
            muted
          />

          {!isScanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <div className="text-center space-y-2">
                <Camera className="h-8 w-8 mx-auto text-white" />
                <p className="text-sm text-white">Camera ready</p>
              </div>
            </div>
          )}

          {/* Scanning overlay with targeting square */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-48 h-48 border-2 border-white/80 rounded-lg">
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-blue-500 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-blue-500 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-blue-500 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-blue-500 rounded-br-lg"></div>
                </div>
              </div>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <p className="text-sm text-white bg-black/50 px-3 py-1 rounded">
                  Position QR code within the frame
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!isScanning ? (
            <Button onClick={startScanning} className="flex-1">
              <Camera className="h-4 w-4 mr-2" />
              Start Scanning
            </Button>
          ) : (
            <Button variant="outline" onClick={stopScanning} className="flex-1">
              <CameraOff className="h-4 w-4 mr-2" />
              Stop Scanning
            </Button>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Point your camera at a pairing QR code from another device
          </p>
        </div>
      </CardContent>
    </Card>
  )
}