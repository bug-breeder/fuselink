import { useEffect, useState } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Spinner } from '@heroui/spinner';
import { generateQRCodeDataURL, generatePairingData } from '../../crypto/qr';
import { generateDeviceFingerprint, formatSafetyWords } from '../../crypto/fingerprint';
import type { Device } from '../../state/types';

interface QRDisplayProps {
  device: Device;
  onClose: () => void;
  className?: string;
}

export function QRDisplay({ device, onClose, className }: QRDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [safetyWords, setSafetyWords] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    generateQRData();
  }, [device]);

  const generateQRData = async () => {
    try {
      setLoading(true);
      setError('');

      // Generate pairing data (ICE servers now use defaults, not embedded in QR)
      const signalingURL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/signaling`;
      
      const pairingData = generatePairingData(device, signalingURL);
      
      // Generate QR code
      const qrUrl = await generateQRCodeDataURL(pairingData);
      setQrCodeUrl(qrUrl);

      // Generate safety words for verification
      const fingerprint = await generateDeviceFingerprint(device.id, device.pubKeyJwk);
      setSafetyWords(formatSafetyWords(fingerprint.safetyWords));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    generateQRData();
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardBody className="flex flex-col items-center justify-center p-8">
          <Spinner size="lg" />
          <p className="mt-4 text-default-500">Generating QR code...</p>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardBody className="flex flex-col items-center justify-center p-8">
          <div className="text-danger text-center mb-4">
            <p className="font-medium">Failed to generate QR code</p>
            <p className="text-sm text-default-500">{error}</p>
          </div>
          <div className="flex gap-2">
            <Button color="primary" onPress={handleRefresh}>
              Try Again
            </Button>
            <Button variant="light" onPress={onClose}>
              Close
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardBody className="flex flex-col items-center p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold">Share this QR Code</h3>
          <p className="text-sm text-default-500 mt-1">
            Scan with the other device to pair
          </p>
        </div>

        {/* QR Code */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <img 
            src={qrCodeUrl} 
            alt="Pairing QR Code" 
            className="w-64 h-64"
          />
        </div>

        {/* Device Info */}
        <div className="text-center mb-6">
          <p className="font-medium">{device.name}</p>
          <p className="text-xs text-default-500 font-mono">
            {device.id.slice(0, 16)}...
          </p>
        </div>

        {/* Safety Words */}
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 w-full mb-6">
          <p className="text-sm font-medium text-warning-800 mb-2">
            Safety Words (for verification):
          </p>
          <p className="text-lg font-mono text-warning-900 text-center">
            {safetyWords}
          </p>
          <p className="text-xs text-warning-700 mt-2">
            Verify these words match on both devices before pairing
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 w-full">
          <Button 
            variant="light" 
            onPress={handleRefresh}
            className="flex-1"
          >
            Refresh
          </Button>
          <Button 
            color="primary" 
            onPress={onClose}
            className="flex-1"
          >
            Done
          </Button>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center">
          <p className="text-xs text-default-500">
            This QR code expires in 10 minutes for security
          </p>
        </div>
      </CardBody>
    </Card>
  );
}