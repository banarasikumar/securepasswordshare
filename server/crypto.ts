import * as crypto from "crypto";
import * as bcrypt from "bcryptjs";

// Cryptographic constants for security
const PBKDF2_ITERATIONS = 100000; // OWASP recommended minimum
const SALT_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits for AES-GCM
const KEY_LENGTH = 32; // 256 bits for AES-256-GCM
const BCRYPT_ROUNDS = 12; // Strong bcrypt rounds

export interface EncryptedData {
  encryptedData: string; // Base64 encoded encrypted data
  salt: string; // Base64 encoded salt for key derivation
  iv: string; // Base64 encoded initialization vector
  authTag: string; // Base64 encoded authentication tag
}

export interface DecryptedData {
  title: string;
  fields: Array<{
    name: string;
    value: string;
    isPassword: boolean;
  }>;
}

/**
 * Generates a cryptographically secure random salt
 */
export function generateSalt(): string {
  return crypto.randomBytes(SALT_LENGTH).toString("base64");
}

/**
 * Generates a cryptographically secure random IV for AES-GCM
 */
export function generateIV(): string {
  return crypto.randomBytes(IV_LENGTH).toString("base64");
}

/**
 * Derives a key from master password using PBKDF2
 */
export function deriveKey(masterPassword: string, salt: string): Buffer {
  const saltBuffer = Buffer.from(salt, "base64");
  return crypto.pbkdf2Sync(masterPassword, saltBuffer, PBKDF2_ITERATIONS, KEY_LENGTH, "sha256");
}

/**
 * Encrypts data using AES-256-GCM with authenticated encryption
 * Each entry gets its own salt and IV for maximum security
 */
export function encryptPasswordEntry(
  data: DecryptedData,
  masterPassword: string
): EncryptedData {
  try {
    // Generate unique salt and IV for this entry
    const salt = generateSalt();
    const iv = generateIV();
    
    // Derive encryption key from master password + unique salt
    const key = deriveKey(masterPassword, salt);
    const ivBuffer = Buffer.from(iv, "base64");
    
    // Create cipher with AES-256-GCM - FIXED: use createCipheriv for proper GCM mode
    const cipher = crypto.createCipheriv("aes-256-gcm", key, ivBuffer);
    
    // Set additional authenticated data (prevents tampering with salt)
    cipher.setAAD(Buffer.from(salt, "base64"));
    
    // Encrypt the data
    const dataString = JSON.stringify(data);
    let encrypted = cipher.update(dataString, "utf8", "base64");
    encrypted += cipher.final("base64");
    
    // Get authentication tag
    const authTag = cipher.getAuthTag().toString("base64");
    
    return {
      encryptedData: encrypted,
      salt,
      iv,
      authTag
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Decrypts data using AES-256-GCM with authentication verification
 */
export function decryptPasswordEntry(
  encrypted: EncryptedData,
  masterPassword: string
): DecryptedData {
  try {
    // Derive the same key using stored salt
    const key = deriveKey(masterPassword, encrypted.salt);
    const ivBuffer = Buffer.from(encrypted.iv, "base64");
    
    // Create decipher with AES-256-GCM - FIXED: use createDecipheriv for proper GCM mode
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, ivBuffer);
    
    // Set additional authenticated data (same as encryption)
    decipher.setAAD(Buffer.from(encrypted.salt, "base64"));
    
    // Set auth tag for authentication verification
    decipher.setAuthTag(Buffer.from(encrypted.authTag, "base64"));
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted.encryptedData, "base64", "utf8");
    decrypted += decipher.final("utf8");
    
    // Parse and validate the decrypted data
    const data = JSON.parse(decrypted) as DecryptedData;
    
    // Basic validation
    if (!data || typeof data.title !== "string" || !Array.isArray(data.fields)) {
      throw new Error("Invalid decrypted data structure");
    }
    
    return data;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : "Invalid master password or corrupted data"}`);
  }
}

/**
 * Hashes master password using bcrypt with secure salt
 */
export async function hashMasterPassword(password: string): Promise<{ hashedPassword: string; salt: string }> {
  try {
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    return {
      hashedPassword,
      salt
    };
  } catch (error) {
    throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Verifies master password against stored hash
 */
export async function verifyMasterPassword(
  inputPassword: string,
  storedHash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(inputPassword, storedHash);
  } catch (error) {
    throw new Error(`Password verification failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Encrypts master password for secure session storage
 * Uses AES-256-GCM with session-specific salt and IV
 */
export function encryptMasterPasswordForSession(masterPassword: string): {
  encryptedMasterPassword: string;
  sessionSalt: string;
} {
  try {
    // Generate session-specific salt and IV
    const sessionSalt = generateSalt();
    const iv = generateIV();
    
    // Derive session key using session salt
    const sessionKey = crypto.pbkdf2Sync(masterPassword, Buffer.from(sessionSalt, "base64"), PBKDF2_ITERATIONS, KEY_LENGTH, "sha256");
    const ivBuffer = Buffer.from(iv, "base64");
    
    // Create cipher for session encryption
    const cipher = crypto.createCipheriv("aes-256-gcm", sessionKey, ivBuffer);
    
    // Encrypt the master password
    let encrypted = cipher.update(masterPassword, "utf8", "base64");
    encrypted += cipher.final("base64");
    
    // Get authentication tag
    const authTag = cipher.getAuthTag().toString("base64");
    
    // Combine encrypted data, IV, and auth tag
    const encryptedMasterPassword = `${encrypted}:${iv}:${authTag}`;
    
    return {
      encryptedMasterPassword,
      sessionSalt
    };
  } catch (error) {
    throw new Error(`Session encryption failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Decrypts master password from session storage
 */
export function decryptMasterPasswordFromSession(
  encryptedMasterPassword: string,
  sessionSalt: string,
  sessionToken: string
): string {
  try {
    // Parse encrypted data components
    const [encrypted, iv, authTag] = encryptedMasterPassword.split(":");
    if (!encrypted || !iv || !authTag) {
      throw new Error("Invalid encrypted session data format");
    }
    
    // Derive the same session key
    const sessionKey = crypto.pbkdf2Sync(sessionToken, Buffer.from(sessionSalt, "base64"), PBKDF2_ITERATIONS, KEY_LENGTH, "sha256");
    const ivBuffer = Buffer.from(iv, "base64");
    
    // Create decipher for session decryption
    const decipher = crypto.createDecipheriv("aes-256-gcm", sessionKey, ivBuffer);
    
    // Set auth tag for verification
    decipher.setAuthTag(Buffer.from(authTag, "base64"));
    
    // Decrypt the master password
    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    throw new Error(`Session decryption failed: ${error instanceof Error ? error.message : "Invalid session or corrupted data"}`);
  }
}

/**
 * Generates a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}