// Safety words fingerprint verification for device pairing

// BIP-39 wordlist subset for generating memorable safety words
const SAFETY_WORDS = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
  'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
  'acquire', 'across', 'act', 'action', 'actor', 'actual', 'adapt', 'add',
  'adjust', 'admit', 'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford',
  'afraid', 'again', 'age', 'agent', 'agree', 'ahead', 'aim', 'air',
  'airport', 'aisle', 'alarm', 'album', 'alert', 'alien', 'all', 'allow',
  'almost', 'alone', 'alpha', 'already', 'also', 'alter', 'always', 'amateur',
  'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger',
  'angle', 'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer',
  'antenna', 'antique', 'anxiety', 'any', 'apart', 'apology', 'appear', 'apple',
  'approve', 'april', 'area', 'arena', 'argue', 'arm', 'armed', 'armor',
  'army', 'around', 'arrange', 'arrest', 'arrive', 'arrow', 'art', 'article',
  'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist', 'assume',
  'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction',
  'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado',
  'avoid', 'awake', 'aware', 'away', 'awesome', 'awful', 'awkward', 'axis',
  'baby', 'bachelor', 'bacon', 'badge', 'bag', 'balance', 'balcony', 'ball',
  'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain', 'barrel', 'base',
  'basic', 'basket', 'battle', 'beach', 'bean', 'beauty', 'because', 'become',
  'beef', 'before', 'begin', 'behave', 'behind', 'believe', 'below', 'belt',
  'bench', 'benefit', 'best', 'betray', 'better', 'between', 'beyond', 'bicycle',
  'bid', 'bike', 'bind', 'biology', 'bird', 'birth', 'bitter', 'black',
  'blade', 'blame', 'blanket', 'blast', 'bleak', 'bless', 'blind', 'blood',
  'blossom', 'blow', 'blue', 'blur', 'blush', 'board', 'boat', 'body',
  'boil', 'bomb', 'bone', 'bonus', 'book', 'boost', 'border', 'boring',
  'borrow', 'boss', 'bottom', 'bounce', 'box', 'boy', 'bracket', 'brain',
  'brand', 'brass', 'brave', 'bread', 'breeze', 'brick', 'bridge', 'brief',
  'bright', 'bring', 'brisk', 'broccoli', 'broken', 'bronze', 'broom', 'brother',
  'brown', 'brush', 'bubble', 'buddy', 'budget', 'buffalo', 'build', 'bulb',
  'bulk', 'bullet', 'bundle', 'bunker', 'burden', 'burger', 'burst', 'bus'
];

export interface DeviceFingerprint {
  deviceId: string;
  safetyWords: string[];
  hash: string;
}

/**
 * Generate safety words from device public key for verification
 */
export async function generateSafetyWords(pubKeyJwk: JsonWebKey): Promise<string[]> {
  try {
    // Create deterministic string from public key
    const keyString = JSON.stringify({
      kty: pubKeyJwk.kty,
      crv: pubKeyJwk.crv,
      x: pubKeyJwk.x,
      y: pubKeyJwk.y,
    });

    // Hash the key to get deterministic bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(keyString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashBytes = new Uint8Array(hashBuffer);

    // Use first 6 bytes to select 6 words (48 bits = ~281 trillion combinations)
    const safetyWords: string[] = [];
    for (let i = 0; i < 6; i++) {
      const wordIndex = hashBytes[i] % SAFETY_WORDS.length;
      safetyWords.push(SAFETY_WORDS[wordIndex]);
    }

    return safetyWords;
  } catch (error) {
    throw new Error(`Failed to generate safety words: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate fingerprint for a device including safety words
 */
export async function generateDeviceFingerprint(
  deviceId: string,
  pubKeyJwk: JsonWebKey
): Promise<DeviceFingerprint> {
  try {
    const safetyWords = await generateSafetyWords(pubKeyJwk);
    
    // Create a hash of the entire key for additional verification
    const keyString = JSON.stringify(pubKeyJwk);
    const encoder = new TextEncoder();
    const data = encoder.encode(keyString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return {
      deviceId,
      safetyWords,
      hash,
    };
  } catch (error) {
    throw new Error(`Failed to generate device fingerprint: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify that two devices have matching fingerprints
 */
export async function verifyFingerprints(
  localFingerprint: DeviceFingerprint,
  remoteFingerprint: DeviceFingerprint
): Promise<boolean> {
  // Compare safety words (case-insensitive)
  if (localFingerprint.safetyWords.length !== remoteFingerprint.safetyWords.length) {
    return false;
  }

  for (let i = 0; i < localFingerprint.safetyWords.length; i++) {
    const localWord = localFingerprint.safetyWords[i].toLowerCase();
    const remoteWord = remoteFingerprint.safetyWords[i].toLowerCase();
    if (localWord !== remoteWord) {
      return false;
    }
  }

  // Also compare full hashes for extra security
  return localFingerprint.hash === remoteFingerprint.hash;
}

/**
 * Format safety words for display to user
 */
export function formatSafetyWords(words: string[]): string {
  return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' - ');
}

/**
 * Generate a short display version of safety words (first 3 words)
 */
export function formatSafetyWordsShort(words: string[]): string {
  const shortWords = words.slice(0, 3);
  return shortWords.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

/**
 * Parse safety words from user input (handles various formats)
 */
export function parseSafetyWords(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[\s\-,]+/) // Split on spaces, dashes, or commas
    .map(word => word.trim())
    .filter(word => word.length > 0);
}

/**
 * Validate that safety words are from the known wordlist
 */
export function validateSafetyWords(words: string[]): boolean {
  if (words.length !== 6) {
    return false;
  }

  return words.every(word => SAFETY_WORDS.includes(word.toLowerCase()));
}

/**
 * Calculate similarity between two sets of safety words (for fuzzy matching)
 */
export function calculateSimilarity(words1: string[], words2: string[]): number {
  if (words1.length !== words2.length) {
    return 0;
  }

  let matches = 0;
  for (let i = 0; i < words1.length; i++) {
    if (words1[i].toLowerCase() === words2[i].toLowerCase()) {
      matches++;
    }
  }

  return matches / words1.length;
}

/**
 * Get a human-readable device identifier from safety words
 */
export function getDeviceDisplayName(deviceName: string, safetyWords: string[]): string {
  const shortWords = formatSafetyWordsShort(safetyWords);
  return `${deviceName} (${shortWords})`;
}