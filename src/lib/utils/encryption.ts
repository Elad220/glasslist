import crypto from 'crypto'

// Use environment variable for encryption key, fallback for demo
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-char-secret-key-here!!'
const ALGORITHM = 'aes-256-cbc'

export interface EncryptionResult {
  success: boolean
  data?: string
  error?: string
}

export interface DecryptionResult {
  success: boolean
  data?: string
  error?: string
}

/**
 * Encrypt a string (like an API key)
 */
export function encryptApiKey(plaintext: string): EncryptionResult {
  try {
    if (!plaintext || typeof plaintext !== 'string') {
      return { success: false, error: 'Invalid input for encryption' }
    }

    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY)
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Combine IV and encrypted data
    const result = iv.toString('hex') + ':' + encrypted
    
    return { success: true, data: result }
  } catch (error) {
    console.error('Encryption error:', error)
    return { success: false, error: 'Failed to encrypt data' }
  }
}

/**
 * Decrypt a string (like an API key)
 */
export function decryptApiKey(encryptedData: string): DecryptionResult {
  try {
    if (!encryptedData || typeof encryptedData !== 'string') {
      return { success: false, error: 'Invalid input for decryption' }
    }

    const parts = encryptedData.split(':')
    if (parts.length !== 2) {
      return { success: false, error: 'Invalid encrypted data format' }
    }

    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]
    
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return { success: true, data: decrypted }
  } catch (error) {
    console.error('Decryption error:', error)
    return { success: false, error: 'Failed to decrypt data' }
  }
}

/**
 * Check if a string appears to be encrypted (has the expected format)
 */
export function isEncryptedApiKey(value: string): boolean {
  if (!value || typeof value !== 'string') return false
  
  const parts = value.split(':')
  return parts.length === 2 && parts[0].length === 32 && parts[1].length > 0
}

/**
 * Safely handle API key - encrypt if not already encrypted
 */
export function ensureEncrypted(apiKey: string): EncryptionResult {
  if (!apiKey) {
    return { success: false, error: 'No API key provided' }
  }
  
  if (isEncryptedApiKey(apiKey)) {
    return { success: true, data: apiKey }
  }
  
  return encryptApiKey(apiKey)
}

/**
 * Safely handle API key - decrypt if encrypted, return as-is if not
 */
export function ensureDecrypted(apiKey: string): DecryptionResult {
  if (!apiKey) {
    return { success: false, error: 'No API key provided' }
  }
  
  if (isEncryptedApiKey(apiKey)) {
    return decryptApiKey(apiKey)
  }
  
  // If not encrypted, return as-is (for backward compatibility)
  return { success: true, data: apiKey }
} 