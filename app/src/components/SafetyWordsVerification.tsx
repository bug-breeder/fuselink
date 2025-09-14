import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Shield, AlertTriangle } from 'lucide-react'
import { useDeviceStore } from '@/stores/deviceStore'
import { generateSafetyWords } from '@/lib/crypto'
import type { PairingData } from '@/lib/qr'

interface SafetyWordsVerificationProps {
  pairingData: PairingData
  onVerified?: () => void
  onRejected?: () => void
}

export function SafetyWordsVerification({
  pairingData,
  onVerified,
  onRejected
}: SafetyWordsVerificationProps) {
  const [localSafetyWords, setLocalSafetyWords] = useState<string[]>([])
  const [remoteSafetyWords, setRemoteSafetyWords] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [verificationState, setVerificationState] = useState<'pending' | 'verified' | 'rejected'>('pending')

  const { deviceId } = useDeviceStore()

  // Generate safety words for both devices
  useEffect(() => {
    const generateWords = async () => {
      try {
        setIsLoading(true)
        setError(null)

        if (!deviceId) {
          throw new Error('Device not initialized')
        }

        // Generate safety words for local device
        const localWords = await generateSafetyWords(deviceId)
        setLocalSafetyWords(localWords)

        // Generate safety words for remote device
        const remoteWords = await generateSafetyWords(pairingData.deviceId)
        setRemoteSafetyWords(remoteWords)

      } catch (err) {
        console.error('Failed to generate safety words:', err)
        setError(err instanceof Error ? err.message : 'Failed to generate safety words')
      } finally {
        setIsLoading(false)
      }
    }

    generateWords()
  }, [deviceId, pairingData.deviceId])

  const handleVerify = () => {
    setVerificationState('verified')
    onVerified?.()
  }

  const handleReject = () => {
    setVerificationState('rejected')
    onRejected?.()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Shield className="h-8 w-8 mx-auto text-muted-foreground animate-pulse" />
              <p className="text-sm text-muted-foreground">Generating security verification...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verify Device Identity
          </CardTitle>
          <Badge variant={verificationState === 'verified' ? 'default' : verificationState === 'rejected' ? 'destructive' : 'secondary'}>
            {verificationState === 'verified' ? 'Verified' : verificationState === 'rejected' ? 'Rejected' : 'Pending'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 mb-1">Security Verification Required</p>
            <p className="text-amber-700">
              Compare these safety words with the other device to ensure you're connecting to the correct device.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Your Device ({deviceId?.substring(0, 8)}...)</h4>
            <div className="grid grid-cols-2 gap-2">
              {localSafetyWords.map((word, index) => (
                <div key={index} className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                  <span className="text-sm font-mono text-blue-900">{word}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Other Device ({pairingData.deviceName})
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {remoteSafetyWords.map((word, index) => (
                <div key={index} className="bg-green-50 border border-green-200 rounded-md px-3 py-2">
                  <span className="text-sm font-mono text-green-900">{word}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-muted rounded-md">
          <h4 className="text-sm font-medium mb-2">Verification Instructions:</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
            <li>Ask the other person to read their safety words aloud</li>
            <li>Compare their words with the "Other Device" words shown above</li>
            <li>Ensure all 4 words match exactly</li>
            <li>Only proceed if ALL words match perfectly</li>
          </ol>
        </div>

        {verificationState === 'pending' && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReject} className="flex-1">
              <XCircle className="h-4 w-4 mr-2" />
              Words Don't Match
            </Button>
            <Button onClick={handleVerify} className="flex-1">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Words Match
            </Button>
          </div>
        )}

        {verificationState === 'verified' && (
          <div className="flex items-center justify-center gap-2 text-green-600 py-2">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Device identity verified successfully</span>
          </div>
        )}

        {verificationState === 'rejected' && (
          <div className="flex items-center justify-center gap-2 text-red-600 py-2">
            <XCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Device identity verification failed</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}