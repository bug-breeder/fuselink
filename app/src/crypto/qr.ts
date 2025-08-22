// QR code generation and parsing for device pairing

import QRCode from 'qrcode';
import type { Device } from '../state/types';

export interface PairingQRData {
  v: number;           // version (shortened)
  id: string;          // deviceId (shortened)
  key: [string, string]; // pubKeyJwk as [x, y] coordinates only
  signal: string;      // signalingURL (shortened)
  ts: number;          // timestamp (shortened)
}

// Legacy interface for backward compatibility
export interface LegacyPairingQRData {
  version: number;
  deviceId: string;
  deviceName: string;
  pubKeyJwk: JsonWebKey;
  signalingURL: string;
  iceServers: RTCIceServer[];
  timestamp: number;
}

// Intermediate format (compact with device name)
export interface CompactPairingQRData {
  v: number;
  id: string;
  name: string;
  key: JsonWebKey;
  signal: string;
  ts: number;
}

/**
 * Generate QR code data for device pairing
 */
export function generatePairingData(
  device: Device,
  signalingURL: string
): PairingQRData {
  // Ultra-compact format: remove device name and use minimal key representation
  // Device name will be exchanged after pairing establishment
  // Public key uses only x,y coordinates (P-256, EC, ext:true, key_ops:[] are implied)
  return {
    v: 1,              // version
    id: device.id,     // deviceId
    key: [device.pubKeyJwk.x!, device.pubKeyJwk.y!], // pubKeyJwk as [x, y] coordinates
    signal: signalingURL,   // signalingURL
    ts: Date.now(),    // timestamp
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
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256, // Good size for mobile scanning
    });

    return qrCodeDataURL;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    throw new Error(`Failed to generate QR code SVG: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse QR code data from scanned string
 */
export function parsePairingData(qrString: string): PairingQRData {
  try {
    const data = JSON.parse(qrString);
    
    // Support multiple format versions for backward compatibility
    let normalizedData: PairingQRData;
    
    if (data.v !== undefined && Array.isArray(data.key)) {
      // New ultra-compact format (v1 with key as [x, y] array)
      if (!data.v || !data.id || !data.key || !Array.isArray(data.key) || data.key.length !== 2) {
        throw new Error('Invalid pairing QR code format');
      }
      
      if (!data.signal) {
        throw new Error('Missing signaling information');
      }
      
      normalizedData = data as PairingQRData;
    } else if (data.v !== undefined) {
      // Compact format with device name (intermediate version)
      if (!data.v || !data.id || !data.name || !data.key) {
        throw new Error('Invalid pairing QR code format');
      }
      
      if (!data.signal) {
        throw new Error('Missing signaling information');
      }
      
      // Convert intermediate format to ultra-compact
      normalizedData = {
        v: data.v,
        id: data.id,
        key: [data.key.x, data.key.y],
        signal: data.signal,
        ts: data.ts,
      };
    } else {
      // Legacy format - convert to ultra-compact format
      if (!data.version || !data.deviceId || !data.deviceName || !data.pubKeyJwk) {
        throw new Error('Invalid pairing QR code format');
      }
      
      if (!data.signalingURL) {
        throw new Error('Missing signaling information');
      }
      
      normalizedData = {
        v: data.version,
        id: data.deviceId,
        key: [data.pubKeyJwk.x, data.pubKeyJwk.y],
        signal: data.signalingURL,
        ts: data.timestamp,
      };
    }

    // Validate deviceId format (64-character hex string)
    if (typeof normalizedData.id !== 'string' || normalizedData.id.length !== 64) {
      throw new Error('Invalid device ID format');
    }

    // Validate key format (should be array of 2 base64url strings)
    if (!Array.isArray(normalizedData.key) || normalizedData.key.length !== 2) {
      throw new Error('Invalid public key format');
    }
    
    if (typeof normalizedData.key[0] !== 'string' || typeof normalizedData.key[1] !== 'string') {
      throw new Error('Invalid public key format');
    }

    return normalizedData;
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
  const age = now - data.ts;
  const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds
  
  return age <= maxAge;
}

/**
 * Get default ICE servers configuration
 * Uses multiple Google STUN servers for redundancy and reliability
 */
export function getDefaultIceServers(): RTCIceServer[] {
  return [
    // Google STUN servers (primary endpoints)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:3478' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:3478' },
    { urls: 'stun:stun4.l.google.com:19302' },
    
    // Google STUN servers (alternative ports)
    { urls: 'stun:stun1.l.google.com:5349' },
    { urls: 'stun:stun2.l.google.com:5349' },
    { urls: 'stun:stun3.l.google.com:5349' },
    { urls: 'stun:stun4.l.google.com:5349' },
    
    // Twilio public STUN server as additional fallback
    { urls: 'stun:global.stun.twilio.com:3478' },
    
    // TODO: Add configured TURN servers for production
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
  const deviceId = data.id.slice(0, 8) + '...';
  const timestamp = new Date(data.ts).toLocaleString();
  
  return `Device ID: ${deviceId}\nGenerated: ${timestamp}`;
}

/**
 * Convert compact key format back to full JWK for crypto operations
 */
export function expandPublicKey(compactKey: [string, string]): JsonWebKey {
  return {
    kty: 'EC',
    crv: 'P-256',
    x: compactKey[0],
    y: compactKey[1],
    ext: true,
    key_ops: [],
  };
}

/**
 * Get the ICE servers configuration for WebRTC
 * Since ICE servers are no longer in QR codes, this provides the default configuration
 */
export function getIceServersForPairing(): RTCIceServer[] {
  return getDefaultIceServers();
}