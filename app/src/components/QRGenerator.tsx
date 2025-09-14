import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw } from 'lucide-react'
import { useDeviceStore } from '@/stores/deviceStore'
import { useLibP2PStore } from '@/stores/libp2pStore'
import { createPairingData, generateQRCode } from '@/lib/qr'

interface QRGeneratorProps {
  onPairingDataCreated?: (pairingId: string) => void
}

export function QRGenerator({ onPairingDataCreated }: QRGeneratorProps) {
  const [qrDataURL, setQrDataURL] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)

  const { deviceId, deviceName, publicKeyJwk, isDeviceInitialized } = useDeviceStore()
  const { node, isConnected } = useLibP2PStore()

  const generateQR = async () => {
    if (!isDeviceInitialized() || !deviceId || !deviceName || !publicKeyJwk) {
      setError('Device not initialized')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Get libp2p multiaddr if available
      const libp2pMultiaddr = node?.getMultiaddrs()?.[0]?.toString()

      // Create pairing data
      const pairingData = createPairingData(
        deviceId,
        deviceName,
        publicKeyJwk,
        libp2pMultiaddr
      )

      // Generate QR code
      const qrCode = await generateQRCode(pairingData)
      setQrDataURL(qrCode)
      setExpiresAt(Date.now() + 10 * 60 * 1000) // 10 minutes from now

      onPairingDataCreated?.(pairingData.pairingId)
    } catch (error) {
      console.error('QR generation failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate QR code')
    } finally {
      setIsGenerating(false)
    }
  }

  // Auto-generate QR on mount if device is ready
  useEffect(() => {
    if (isDeviceInitialized() && isConnected && !qrDataURL) {
      generateQR()
    }
  }, [isDeviceInitialized, isConnected, qrDataURL])

  // Auto-refresh countdown
  useEffect(() => {
    if (!expiresAt) return

    const interval = setInterval(() => {
      const timeLeft = expiresAt - Date.now()
      if (timeLeft <= 0) {
        setQrDataURL(null)
        setExpiresAt(null)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  const timeLeft = expiresAt ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)) : 0
  const minutesLeft = Math.floor(timeLeft / 60)
  const secondsLeft = timeLeft % 60

  if (!isDeviceInitialized()) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Device not initialized. Please set up your device first.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Generate QR Code</CardTitle>
          <div className="flex gap-2">
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "libp2p Ready" : "Connecting..."}
            </Badge>
            {expiresAt && (
              <Badge variant="outline">
                {minutesLeft}:{secondsLeft.toString().padStart(2, '0')}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {qrDataURL ? (
          <div className="text-center space-y-4">
            <div className="inline-block p-4 bg-white rounded-lg">
              <img
                src={qrDataURL}
                alt="Pairing QR Code"
                className="w-64 h-64"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Scan this QR code with another device to pair</p>
              <p>Code expires in {minutesLeft}:{secondsLeft.toString().padStart(2, '0')}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm text-muted-foreground">Generating QR code...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">Click to generate a new pairing QR code</p>
                <Button onClick={generateQR} disabled={!isConnected}>
                  Generate QR Code
                </Button>
              </div>
            )}
          </div>
        )}

        {qrDataURL && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={generateQR}
              disabled={isGenerating}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate New Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}