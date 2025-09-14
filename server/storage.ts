import { 
  type User, 
  type InsertUser, 
  type PasswordEntry, 
  type InsertPasswordEntry, 
  type MasterPassword, 
  type InsertMasterPassword,
  type Session,
  type InsertSession,
  type PasswordEntryData,
  users,
  passwordEntries,
  masterPassword,
  sessions
} from "@shared/schema";
import { randomUUID } from "crypto";
import { sql, eq, and, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import {
  encryptPasswordEntry,
  decryptPasswordEntry,
  hashMasterPassword,
  verifyMasterPassword,
  encryptMasterPasswordForSession,
  decryptMasterPasswordFromSession,
  type EncryptedData,
  type DecryptedData
} from "./crypto";

// Initialize database connection
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql_client = neon(process.env.DATABASE_URL);
const db = drizzle(sql_client);

export interface IStorage {
  // User management (legacy - keeping for compatibility)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Master password management
  getMasterPassword(): Promise<MasterPassword | undefined>;
  createMasterPassword(masterPassword: InsertMasterPassword): Promise<MasterPassword>;
  verifyMasterPassword(inputPassword: string): Promise<boolean>;
  
  // SECURITY FIX: Session-based authentication methods
  createSession(masterPassword: string): Promise<{ sessionToken: string; expiresAt: Date }>;
  verifySession(sessionToken: string): Promise<boolean>;
  invalidateSession(sessionToken: string): Promise<void>;
  cleanupExpiredSessions(): Promise<number>;
  
  // Password entry management with session-based authentication
  createPasswordEntry(entry: PasswordEntryData, sessionToken: string): Promise<PasswordEntry>;
  getAllPasswordEntries(sessionToken: string): Promise<PasswordEntryData[]>;
  deleteAllPasswordEntries(sessionToken: string): Promise<void>;
  deleteExpiredEntries(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Start cleanup intervals for expired entries and sessions (check every hour)
    setInterval(() => {
      this.deleteExpiredEntries().catch(console.error);
      this.cleanupExpiredSessions().catch(console.error);
    }, 60 * 60 * 1000);
  }

  // Legacy user methods - keeping for compatibility
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    await db.insert(users).values(user);
    return user;
  }

  // Master password management
  async getMasterPassword(): Promise<MasterPassword | undefined> {
    const result = await db.select().from(masterPassword).limit(1);
    return result[0];
  }

  async createMasterPassword(masterPasswordData: InsertMasterPassword): Promise<MasterPassword> {
    const id = randomUUID();
    const createdAt = new Date();
    
    const masterPasswordRecord: MasterPassword = {
      id,
      hashedPassword: masterPasswordData.hashedPassword,
      salt: masterPasswordData.salt,
      createdAt
    };
    
    await db.insert(masterPassword).values(masterPasswordRecord);
    return masterPasswordRecord;
  }

  async verifyMasterPassword(inputPassword: string): Promise<boolean> {
    const masterPasswordRecord = await this.getMasterPassword();
    if (!masterPasswordRecord) {
      return false;
    }
    
    // Verify password against stored hash using secure comparison
    return await verifyMasterPassword(inputPassword, masterPasswordRecord.hashedPassword);
  }

  // SECURITY FIX: Session-based authentication implementation
  async createSession(masterPassword: string): Promise<{ sessionToken: string; expiresAt: Date }> {
    // First verify the master password
    const isAuthenticated = await this.verifyMasterPassword(masterPassword);
    if (!isAuthenticated) {
      throw new Error("Invalid master password - session creation denied");
    }

    // Generate secure session token
    const sessionToken = randomUUID() + "-" + randomUUID(); // Extra entropy
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 4 * 60 * 60 * 1000); // 4 hours session

    // Encrypt master password for secure session storage
    const { encryptedMasterPassword, sessionSalt } = encryptMasterPasswordForSession(masterPassword);

    const session: Session = {
      id: randomUUID(),
      sessionToken,
      encryptedMasterPassword,
      sessionSalt,
      createdAt,
      expiresAt,
      isActive: true
    };

    await db.insert(sessions).values(session);
    return { sessionToken, expiresAt };
  }

  async verifySession(sessionToken: string): Promise<boolean> {
    try {
      const session = await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.sessionToken, sessionToken),
            eq(sessions.isActive, true),
            sql`${sessions.expiresAt} > NOW()`
          )
        )
        .limit(1);

      return session.length > 0;
    } catch (error) {
      console.error("Session verification error:", error);
      return false;
    }
  }

  // Helper method to get master password from session for encryption operations
  private async getMasterPasswordFromSession(sessionToken: string): Promise<string> {
    const sessionResult = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.sessionToken, sessionToken),
          eq(sessions.isActive, true),
          sql`${sessions.expiresAt} > NOW()`
        )
      )
      .limit(1);

    if (sessionResult.length === 0) {
      throw new Error("Invalid or expired session");
    }

    const session = sessionResult[0];
    return decryptMasterPasswordFromSession(
      session.encryptedMasterPassword,
      session.sessionSalt,
      sessionToken
    );
  }

  async invalidateSession(sessionToken: string): Promise<void> {
    await db
      .update(sessions)
      .set({ isActive: false })
      .where(eq(sessions.sessionToken, sessionToken));
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await db
      .delete(sessions)
      .where(sql`${sessions.expiresAt} <= NOW()`)
      .returning({ id: sessions.id });

    const deletedCount = result.length;
    if (deletedCount > 0) {
      console.log(`Deleted ${deletedCount} expired sessions from database`);
    }
    return deletedCount;
  }

  // SECURITY FIX: Password entry management with session-based authentication
  async createPasswordEntry(entryData: PasswordEntryData, sessionToken: string): Promise<PasswordEntry> {
    // CRITICAL: Verify session before any operations
    const isAuthenticated = await this.verifySession(sessionToken);
    if (!isAuthenticated) {
      throw new Error("Invalid session - access denied");
    }

    // Get master password from secure session storage for encryption
    const masterPassword = await this.getMasterPasswordFromSession(sessionToken);

    const id = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    // Encrypt the entry data using secure crypto functions
    const encrypted: EncryptedData = encryptPasswordEntry(entryData, masterPassword);
    
    const entry: PasswordEntry = {
      id,
      // SECURITY FIX: No plaintext title storage - title now encrypted with payload
      encryptedData: encrypted.encryptedData,
      salt: encrypted.salt,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      createdAt: now,
      expiresAt,
      isDeleted: false
    };
    
    await db.insert(passwordEntries).values(entry);
    return entry;
  }

  async getAllPasswordEntries(sessionToken: string): Promise<PasswordEntryData[]> {
    // CRITICAL: Verify session before any operations
    const isAuthenticated = await this.verifySession(sessionToken);
    if (!isAuthenticated) {
      throw new Error("Invalid session - access denied");
    }

    // Get master password from secure session storage for decryption
    const masterPassword = await this.getMasterPasswordFromSession(sessionToken);

    // Get all active, non-expired entries
    const activeEntries = await db
      .select()
      .from(passwordEntries)
      .where(
        and(
          eq(passwordEntries.isDeleted, false),
          sql`${passwordEntries.expiresAt} > NOW()`
        )
      )
      .orderBy(sql`${passwordEntries.createdAt} DESC`);
    
    const decryptedEntries: PasswordEntryData[] = [];
    
    for (const entry of activeEntries) {
      try {
        // Decrypt each entry using secure crypto functions
        const encryptedData: EncryptedData = {
          encryptedData: entry.encryptedData,
          salt: entry.salt,
          iv: entry.iv,
          authTag: entry.authTag
        };
        
        const decryptedData: DecryptedData = decryptPasswordEntry(encryptedData, masterPassword);
        
        // Convert to expected format
        const entryData: PasswordEntryData = {
          title: decryptedData.title,
          fields: decryptedData.fields
        };
        
        decryptedEntries.push(entryData);
      } catch (error) {
        console.error(`Failed to decrypt entry ${entry.id}:`, error);
        // Skip corrupted entries instead of failing the entire operation
        continue;
      }
    }
    
    return decryptedEntries;
  }

  async deleteAllPasswordEntries(sessionToken: string): Promise<void> {
    // CRITICAL: Verify session before any operations
    const isAuthenticated = await this.verifySession(sessionToken);
    if (!isAuthenticated) {
      throw new Error("Invalid session - access denied");
    }

    // Mark all entries as deleted (soft delete for security audit trail)
    await db
      .update(passwordEntries)
      .set({ isDeleted: true })
      .where(eq(passwordEntries.isDeleted, false));
  }

  async deleteExpiredEntries(): Promise<number> {
    // Hard delete expired entries from database (cleanup operation)
    const result = await db
      .delete(passwordEntries)
      .where(sql`${passwordEntries.expiresAt} <= NOW()`)
      .returning({ id: passwordEntries.id });
    
    const deletedCount = result.length;
    
    if (deletedCount > 0) {
      console.log(`Deleted ${deletedCount} expired password entries from database`);
    }
    
    return deletedCount;
  }
}

// Helper functions for master password setup
export async function setupMasterPassword(password: string): Promise<MasterPassword> {
  const storage = new DatabaseStorage();
  
  // Check if master password already exists
  const existing = await storage.getMasterPassword();
  if (existing) {
    throw new Error("Master password already exists");
  }
  
  // Hash the password securely
  const { hashedPassword, salt } = await hashMasterPassword(password);
  
  // Store in database
  const masterPasswordData: InsertMasterPassword = {
    hashedPassword,
    salt
  };
  
  return await storage.createMasterPassword(masterPasswordData);
}

export async function checkMasterPasswordExists(): Promise<boolean> {
  const storage = new DatabaseStorage();
  const existing = await storage.getMasterPassword();
  return !!existing;
}

// Create and export the storage instance
export const storage = new DatabaseStorage();