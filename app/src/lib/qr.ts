import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'

export interface PairingData {
  version: string
  deviceId: string
  deviceName: string
  publicKeyJwk: JsonWebKey
  pairingId: string
  timestamp: number
  libp2pMultiaddr?: string
}

/**
 * Generate QR code data for device pairing
 */
export function createPairingData(
  deviceId: string,
  deviceName: string,
  publicKeyJwk: JsonWebKey,
  libp2pMultiaddr?: string
): PairingData {
  return {
    version: '1.0',
    deviceId,
    deviceName,
    publicKeyJwk,
    pairingId: uuidv4(),
    timestamp: Date.now(),
    libp2pMultiaddr
  }
}

/**
 * Generate QR code as data URL
 */
export async function generateQRCode(pairingData: PairingData): Promise<string> {
  const dataString = JSON.stringify(pairingData)

  try {
    const qrDataURL = await QRCode.toDataURL(dataString, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    })

    return qrDataURL
  } catch (error) {
    console.error('Failed to generate QR code:', error)
    throw new Error('QR code generation failed')
  }
}

/**
 * Parse QR code data
 */
export function parsePairingData(qrDataString: string): PairingData | null {
  try {
    const data = JSON.parse(qrDataString)

    // Validate required fields
    if (!data.version || !data.deviceId || !data.deviceName || !data.publicKeyJwk || !data.pairingId) {
      throw new Error('Invalid pairing data: missing required fields')
    }

    // Check if data is not too old (10 minutes)
    const age = Date.now() - data.timestamp
    if (age > 10 * 60 * 1000) {
      throw new Error('Pairing data has expired')
    }

    return data as PairingData
  } catch (error) {
    console.error('Failed to parse pairing data:', error)
    return null
  }
}

/**
 * Validate pairing data structure
 */
export function isValidPairingData(data: unknown): data is PairingData {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  const obj = data as Record<string, unknown>
  return (
    typeof obj.version === 'string' &&
    typeof obj.deviceId === 'string' &&
    typeof obj.deviceName === 'string' &&
    typeof obj.publicKeyJwk === 'object' &&
    typeof obj.pairingId === 'string' &&
    typeof obj.timestamp === 'number'
  )
}