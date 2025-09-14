/**
 * Cryptographic utilities for device identity and pairing
 * Uses Web Crypto API for ECDH key generation and device fingerprints
 */

// Generate ECDH keypair for device identity
export async function generateDeviceKeypair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    true, // extractable
    ['deriveKey', 'deriveBits']
  )
}

// Export public key to JWK format
export async function exportPublicKey(publicKey: CryptoKey): Promise<JsonWebKey> {
  return await crypto.subtle.exportKey('jwk', publicKey)
}

// Import public key from JWK format
export async function importPublicKey(publicKeyJwk: JsonWebKey): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'jwk',
    publicKeyJwk,
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    false,
    []
  )
}

// Generate device ID from public key
export async function generateDeviceId(publicKeyJwk: JsonWebKey): Promise<string> {
  const keyString = JSON.stringify(publicKeyJwk)
  const encoder = new TextEncoder()
  const data = encoder.encode(keyString)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = new Uint8Array(hashBuffer)
  const hashHex = Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return hashHex.substring(0, 16) // Use first 16 characters for device ID
}

// Generate safety words for fingerprint verification
export async function generateSafetyWords(data: string): Promise<string[]> {
  // Simple word list for safety verification (subset of BIP-39)
  const words = [
    'abandon', 'ability', 'able', 'about', 'above', 'absorb', 'abstract', 'absurd',
    'academy', 'accept', 'access', 'account', 'accuse', 'achieve', 'acid', 'acoustic',
    'acquire', 'across', 'action', 'actor', 'actress', 'actual', 'adapt', 'add',
    'address', 'adjust', 'admit', 'adult', 'advance', 'advice', 'aerobic', 'affair',
    'afford', 'afraid', 'again', 'agent', 'agree', 'ahead', 'aim', 'air',
    'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert', 'alien', 'all',
    'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter', 'always',
    'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient',
    'anger', 'angle', 'angry', 'animal', 'ankle', 'announce', 'annual', 'another'
  ]

  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = new Uint8Array(hashBuffer)

  // Use hash bytes to select 4 words
  const safetyWords: string[] = []
  for (let i = 0; i < 4; i++) {
    const index = hashArray[i] % words.length
    safetyWords.push(words[index])
  }

  return safetyWords
}

// Derive shared secret using ECDH
export async function deriveSharedSecret(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<ArrayBuffer> {
  return await crypto.subtle.deriveBits(
    {
      name: 'ECDH',
      public: publicKey
    },
    privateKey,
    256 // 256 bits = 32 bytes
  )
}

// Generate AES key from shared secret using HKDF
export async function deriveAESKey(sharedSecret: ArrayBuffer, salt: Uint8Array): Promise<CryptoKey> {
  // Import shared secret as raw key material
  const baseKey = await crypto.subtle.importKey(
    'raw',
    sharedSecret,
    'HKDF',
    false,
    ['deriveKey']
  )

  // Derive AES-GCM key using HKDF
  return await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt,
      info: new TextEncoder().encode('fuselink-session-key')
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  )
}