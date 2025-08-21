// ECDH key generation and management for device identity

export interface DeviceKeyPair {
  publicKeyJwk: JsonWebKey;
  privateKey: CryptoKey;
  deviceId: string;
}

/**
 * Generate a new ECDH key pair for device identity
 * Uses P-256 curve for compatibility and security
 */
export async function generateDeviceKeyPair(): Promise<DeviceKeyPair> {
  try {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true, // extractable - needed for JWK export
      ['deriveKey', 'deriveBits']
    );

    // Export public key as JWK for storage and transmission
    const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    
    // Generate deviceId from public key
    const deviceId = await deriveDeviceId(publicKeyJwk);

    return {
      publicKeyJwk,
      privateKey: keyPair.privateKey,
      deviceId,
    };
  } catch (error) {
    throw new Error(`Failed to generate device key pair: ${error.message}`);
  }
}

/**
 * Derive a unique deviceId from a public key
 * Uses SHA-256 hash of the JWK representation
 */
export async function deriveDeviceId(publicKeyJwk: JsonWebKey): Promise<string> {
  try {
    // Create deterministic string representation of the public key
    const keyString = JSON.stringify({
      kty: publicKeyJwk.kty,
      crv: publicKeyJwk.crv,
      x: publicKeyJwk.x,
      y: publicKeyJwk.y,
    });

    // Hash the key string to create deviceId
    const encoder = new TextEncoder();
    const data = encoder.encode(keyString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const deviceId = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return deviceId;
  } catch (error) {
    throw new Error(`Failed to derive device ID: ${error.message}`);
  }
}

/**
 * Import a private key from stored JWK format
 */
export async function importPrivateKey(privateKeyJwk: JsonWebKey): Promise<CryptoKey> {
  try {
    return await crypto.subtle.importKey(
      'jwk',
      privateKeyJwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      false, // not extractable after import
      ['deriveKey', 'deriveBits']
    );
  } catch (error) {
    throw new Error(`Failed to import private key: ${error.message}`);
  }
}

/**
 * Import a public key from JWK format
 */
export async function importPublicKey(publicKeyJwk: JsonWebKey): Promise<CryptoKey> {
  try {
    return await crypto.subtle.importKey(
      'jwk',
      publicKeyJwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      false,
      []
    );
  } catch (error) {
    throw new Error(`Failed to import public key: ${error.message}`);
  }
}

/**
 * Derive a shared secret from our private key and their public key
 * Used for session key derivation
 */
export async function deriveSharedSecret(
  privateKey: CryptoKey,
  publicKeyJwk: JsonWebKey
): Promise<ArrayBuffer> {
  try {
    const otherPublicKey = await importPublicKey(publicKeyJwk);
    
    return await crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: otherPublicKey,
      },
      privateKey,
      256 // 32 bytes
    );
  } catch (error) {
    throw new Error(`Failed to derive shared secret: ${error.message}`);
  }
}