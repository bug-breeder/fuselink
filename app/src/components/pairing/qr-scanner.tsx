import { useRef, useEffect, useState } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Spinner } from '@heroui/spinner';
import { QRScanner } from '../../crypto/scanner';
import { parsePairingData, validatePairingTimestamp, expandPublicKey } from '../../crypto/qr';
import { generateDeviceFingerprint, formatSafetyWords } from '../../crypto/fingerprint';
import type { PairingQRData } from '../../crypto/qr';

interface QRScannerProps {
  onScanSuccess: (data: PairingQRData) => void;
  onCancel: () => void;
  className?: string;
}

export function QRScannerComponent({ onScanSuccess, onCancel, className }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QRScanner | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [scanResult, setScanResult] = useState<PairingQRData | null>(null);
  const [safetyWords, setSafetyWords] = useState<string>('');
  const [showVerification, setShowVerification] = useState(false);

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      setIsScanning(true);
      setError('');

      scannerRef.current = new QRScanner(videoRef.current);
      
      await scannerRef.current.start(
        handleScanResult,
        handleScanError,
        {
          preferredCamera: 'back',
          maxScanTime: 60000, // 1 minute timeout
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start camera');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScanResult = async (result: { data: string }) => {
    try {
      // Parse QR code data
      const pairingData = parsePairingData(result.data);
      
      // Validate timestamp
      if (!validatePairingTimestamp(pairingData)) {
        throw new Error('QR code has expired. Please generate a new one.');
      }

      // Generate safety words for verification (expand compact key format)
      const fullPublicKey = expandPublicKey(pairingData.key);
      const fingerprint = await generateDeviceFingerprint(pairingData.id, fullPublicKey);
      setSafetyWords(formatSafetyWords(fingerprint.safetyWords));
      
      setScanResult(pairingData);
      setShowVerification(true);
      stopScanning();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid QR code');
      // Continue scanning
    }
  };

  const handleScanError = (error: Error) => {
    setError(error.message);
    setIsScanning(false);
  };

  const handleVerificationConfirm = () => {
    if (scanResult) {
      onScanSuccess(scanResult);
    }
  };

  const handleVerificationCancel = () => {
    setShowVerification(false);
    setScanResult(null);
    setSafetyWords('');
    startScanning(); // Resume scanning
  };

  const handleRetry = () => {
    setError('');
    startScanning();
  };

  if (showVerification && scanResult) {
    return (
      <Card className={className}>
        <CardBody className="flex flex-col items-center p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold">Verify Device</h3>
            <p className="text-sm text-default-500 mt-1">
              Confirm the device details before pairing
            </p>
          </div>

          {/* Device Info */}
          <div className="bg-default-50 rounded-lg p-4 w-full mb-6">
            <div className="text-center mb-4">
              <p className="font-medium text-lg">Device Pairing</p>
              <p className="text-xs text-default-500 font-mono">
                ID: {scanResult.id.slice(0, 16)}...
              </p>
            </div>
          </div>

          {/* Safety Words Verification */}
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 w-full mb-6">
            <p className="text-sm font-medium text-warning-800 mb-2">
              Verify Safety Words:
            </p>
            <p className="text-lg font-mono text-warning-900 text-center mb-2">
              {safetyWords}
            </p>
            <p className="text-xs text-warning-700">
              These words should match exactly on both devices
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full">
            <Button 
              variant="light" 
              onPress={handleVerificationCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              color="primary" 
              onPress={handleVerificationConfirm}
              className="flex-1"
            >
              Pair Device
            </Button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-default-500">
              Only pair if the safety words match exactly
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardBody className="flex flex-col items-center p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold">Scan QR Code</h3>
          <p className="text-sm text-default-500 mt-1">
            Point your camera at the QR code on the other device
          </p>
        </div>

        {/* Camera View */}
        <div className="relative w-full max-w-sm aspect-square mb-6 bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          
          {/* Scanning Overlay */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-primary w-48 h-48 rounded-lg">
                <div className="w-full h-full border-2 border-dashed border-primary/50 rounded-lg animate-pulse" />
              </div>
            </div>
          )}

          {/* Loading State */}
          {!isScanning && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
              <Spinner size="lg" color="primary" />
              <p className="text-white text-sm mt-2">Starting camera...</p>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 w-full mb-4">
            <p className="text-danger-800 text-sm text-center">
              {error}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 w-full">
          <Button 
            variant="light" 
            onPress={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          {error && (
            <Button 
              color="primary" 
              onPress={handleRetry}
              className="flex-1"
            >
              Retry
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center">
          <p className="text-xs text-default-500">
            Make sure the QR code is well-lit and clearly visible
          </p>
        </div>
      </CardBody>
    </Card>
  );
}