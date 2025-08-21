// QR code generation and parsing for device pairing

import QRCode from 'qrcode';
import type { Device } from '../state/types';

export interface PairingQRData {
  version: number;
  deviceId: string;
  deviceName: string;
  pubKeyJwk: JsonWebKey;
  signalingURL: string;
  iceServers: RTCIceServer[];
  timestamp: number;
}

/**
 * Generate QR code data for device pairing
 */
export function generatePairingData(
  device: Device,
  signalingURL: string,
  iceServers: RTCIceServer[]
): PairingQRData {
  return {
    version: 1,
    deviceId: device.id,
    deviceName: device.name,
    pubKeyJwk: device.pubKeyJwk,
    signalingURL,
    iceServers,
    timestamp: Date.now(),
  };
}

/**
 * Generate QR code as data URL for display
 */
export async function generateQRCodeDataURL(data: PairingQRData): Promise<string> {
  try {
    const jsonString = JSON.stringify(data);
    
    // Generate QR code with optimal settings for device pairing
    const qrCodeDataURL = await QRCode.toDataURL(jsonString, {
      errorCorrectionLevel: 'M', // Medium error correction
      type: 'image/png',
      quality: 0.92,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256, // Good size for mobile scanning
    });

    return qrCodeDataURL;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
}

/**
 * Generate QR code as SVG string for better scaling
 */
export async function generateQRCodeSVG(data: PairingQRData): Promise<string> {
  try {
    const jsonString = JSON.stringify(data);
    
    const svgString = await QRCode.toString(jsonString, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256,
    });

    return svgString;
  } catch (error) {
    throw new Error(`Failed to generate QR code SVG: ${error.message}`);
  }
}

/**
 * Parse QR code data from scanned string
 */
export function parsePairingData(qrString: string): PairingQRData {
  try {
    const data = JSON.parse(qrString);
    
    // Validate required fields
    if (!data.version || !data.deviceId || !data.deviceName || !data.pubKeyJwk) {
      throw new Error('Invalid pairing QR code format');
    }

    if (!data.signalingURL || !data.iceServers) {
      throw new Error('Missing signaling or ICE server information');
    }

    // Validate deviceId format (64-character hex string)
    if (typeof data.deviceId !== 'string' || data.deviceId.length !== 64) {
      throw new Error('Invalid device ID format');
    }

    // Basic JWK validation
    if (!data.pubKeyJwk.kty || !data.pubKeyJwk.crv || !data.pubKeyJwk.x || !data.pubKeyJwk.y) {
      throw new Error('Invalid public key format');
    }

    return data as PairingQRData;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('QR code does not contain valid JSON data');
    }
    throw error;
  }
}

/**
 * Validate that a pairing QR code is not expired
 */
export function validatePairingTimestamp(data: PairingQRData, maxAgeMinutes: number = 10): boolean {
  const now = Date.now();
  const age = now - data.timestamp;
  const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds
  
  return age <= maxAge;
}

/**
 * Get default ICE servers configuration
 */
export function getDefaultIceServers(): RTCIceServer[] {
  return [
    // Public STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // TODO: Add configured TURN servers
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'username',
    //   credential: 'password'
    // }
  ];
}

/**
 * Generate a human-readable summary of QR data for display
 */
export function formatPairingDataSummary(data: PairingQRData): string {
  const device = data.deviceName || data.deviceId.slice(0, 8) + '...';
  const timestamp = new Date(data.timestamp).toLocaleString();
  
  return `Device: ${device}\nGenerated: ${timestamp}`;
}