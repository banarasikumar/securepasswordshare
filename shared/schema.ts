import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const passwordEntries = pgTable("password_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // SECURITY FIX: Removed plaintext title storage - title now encrypted with payload
  encryptedData: text("encrypted_data").notNull(), // AES-GCM encrypted JSON of title + fields
  salt: text("salt").notNull(), // Unique salt for key derivation
  iv: text("iv").notNull(), // Initialization vector for AES-GCM
  authTag: text("auth_tag").notNull(), // Authentication tag for AES-GCM
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  expiresAt: timestamp("expires_at").notNull(),
  isDeleted: boolean("is_deleted").notNull().default(false),
});

// Create index for efficient cleanup queries
export const passwordEntriesExpiryIndex = sql`CREATE INDEX IF NOT EXISTS idx_password_entries_expiry ON password_entries(expires_at, is_deleted)`;

export const masterPassword = pgTable("master_password", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hashedPassword: text("hashed_password").notNull(),
  salt: text("salt").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// SECURITY FIX: Add session management for secure authentication
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionToken: text("session_token").notNull().unique(),
  // Store encrypted master password for encryption operations (session-scoped)
  encryptedMasterPassword: text("encrypted_master_password").notNull(),
  sessionSalt: text("session_salt").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPasswordEntrySchema = createInsertSchema(passwordEntries).pick({
  // SECURITY FIX: Removed title from insert schema - no plaintext storage
  encryptedData: true,
  salt: true,
  iv: true,
  authTag: true,
});

export const insertMasterPasswordSchema = createInsertSchema(masterPassword).pick({
  hashedPassword: true,
  salt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  sessionToken: true,
  encryptedMasterPassword: true,
  sessionSalt: true,
  expiresAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type PasswordEntry = typeof passwordEntries.$inferSelect;
export type InsertPasswordEntry = z.infer<typeof insertPasswordEntrySchema>;
export type MasterPassword = typeof masterPassword.$inferSelect;
export type InsertMasterPassword = z.infer<typeof insertMasterPasswordSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

// Frontend-only types for the password fields
export type PasswordField = {
  name: string;
  value: string;
  isPassword: boolean;
};

export type PasswordEntryData = {
  title: string;
  fields: PasswordField[];
};