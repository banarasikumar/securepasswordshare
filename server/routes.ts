import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, setupMasterPassword, checkMasterPasswordExists } from "./storage";
import { insertPasswordEntrySchema, insertMasterPasswordSchema, type PasswordEntryData } from "@shared/schema";
import { z } from "zod";

// SECURITY FIX: Updated validation schemas for session-based authentication
const masterPasswordCreateSchema = z.object({
  masterPassword: z.string().min(8, "Master password must be at least 8 characters"),
});

const sessionCreateSchema = z.object({
  masterPassword: z.string().min(1, "Master password is required"),
});

const sessionTokenSchema = z.object({
  sessionToken: z.string().min(1, "Session token is required"),
});

const passwordEntryCreateSchema = z.object({
  sessionToken: z.string().min(1, "Session token is required"),
  entry: z.object({
    title: z.string().min(1, "Title is required"),
    fields: z.array(z.object({
      name: z.string().min(1, "Field name is required"),
      value: z.string().min(1, "Field value is required"),
      isPassword: z.boolean(),
    })).min(1, "At least one field is required"),
  }),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware for JSON parsing and error handling
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Check if master password exists
  app.get("/api/master-password/exists", async (req, res) => {
    try {
      const exists = await checkMasterPasswordExists();
      res.json({ exists });
    } catch (error) {
      console.error("Error checking master password existence:", error);
      res.status(500).json({ 
        error: "Internal server error", 
        message: "Failed to check master password status" 
      });
    }
  });

  // Create master password (only if none exists)
  app.post("/api/master-password/create", async (req, res) => {
    try {
      const validation = masterPasswordCreateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Validation error", 
          message: validation.error.errors[0].message 
        });
      }

      const { masterPassword } = validation.data;

      // Check if master password already exists
      const exists = await checkMasterPasswordExists();
      if (exists) {
        return res.status(409).json({ 
          error: "Master password already exists", 
          message: "Cannot create master password - one already exists" 
        });
      }

      // Create master password with secure hashing
      await setupMasterPassword(masterPassword);
      
      res.status(201).json({ 
        message: "Master password created successfully",
        success: true 
      });
    } catch (error) {
      console.error("Error creating master password:", error);
      res.status(500).json({ 
        error: "Internal server error", 
        message: "Failed to create master password" 
      });
    }
  });

  // SECURITY FIX: Create secure session instead of just verifying password
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validation = sessionCreateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Validation error", 
          message: validation.error.errors[0].message 
        });
      }

      const { masterPassword } = validation.data;

      // Create secure session (includes master password verification)
      const { sessionToken, expiresAt } = await storage.createSession(masterPassword);
      
      res.json({ 
        sessionToken,
        expiresAt,
        message: "Authentication successful - session created" 
      });
    } catch (error) {
      console.error("Error creating session:", error);
      
      if (error instanceof Error && error.message.includes("Invalid session")) {
        return res.status(401).json({ 
          error: "Authentication failed", 
          message: "Invalid or expired session" 
        });
      }
      
      res.status(500).json({ 
        error: "Internal server error", 
        message: "Failed to create session" 
      });
    }
  });

  // Session logout endpoint
  app.post("/api/auth/logout", async (req, res) => {
    try {
      const validation = sessionTokenSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Validation error", 
          message: validation.error.errors[0].message 
        });
      }

      const { sessionToken } = validation.data;

      // Invalidate session
      await storage.invalidateSession(sessionToken);
      
      res.json({ 
        message: "Session terminated successfully" 
      });
    } catch (error) {
      console.error("Error terminating session:", error);
      res.status(500).json({ 
        error: "Internal server error", 
        message: "Failed to terminate session" 
      });
    }
  });

  // SECURITY FIX: Create password entry using session authentication
  app.post("/api/password-entries", async (req, res) => {
    try {
      const validation = passwordEntryCreateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Validation error", 
          message: validation.error.errors[0].message 
        });
      }

      const { sessionToken, entry } = validation.data;

      // Create encrypted entry using secure session authentication
      const createdEntry = await storage.createPasswordEntry(entry, sessionToken);
      
      res.status(201).json({ 
        message: "Password entry created successfully",
        entry: {
          id: createdEntry.id,
          // SECURITY FIX: No plaintext title in response - title now encrypted
          createdAt: createdEntry.createdAt,
          expiresAt: createdEntry.expiresAt,
        }
      });
    } catch (error) {
      console.error("Error creating password entry:", error);
      
      if (error instanceof Error && error.message.includes("Invalid session")) {
        return res.status(401).json({ 
          error: "Authentication failed", 
          message: "Invalid or expired session" 
        });
      }
      
      res.status(500).json({ 
        error: "Internal server error", 
        message: "Failed to create password entry" 
      });
    }
  });

  // SECURITY FIX: Get all password entries using session authentication
  app.post("/api/password-entries/list", async (req, res) => {
    try {
      const validation = sessionTokenSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Validation error", 
          message: validation.error.errors[0].message 
        });
      }

      const { sessionToken } = validation.data;

      // Get and decrypt entries using secure session authentication
      const entries = await storage.getAllPasswordEntries(sessionToken);
      
      res.json({ 
        entries,
        message: "Password entries retrieved successfully" 
      });
    } catch (error) {
      console.error("Error retrieving password entries:", error);
      
      if (error instanceof Error && error.message.includes("Invalid session")) {
        return res.status(401).json({ 
          error: "Authentication failed", 
          message: "Invalid or expired session" 
        });
      }
      
      res.status(500).json({ 
        error: "Internal server error", 
        message: "Failed to retrieve password entries" 
      });
    }
  });

  // SECURITY FIX: Delete all password entries using session authentication
  app.post("/api/password-entries/delete-all", async (req, res) => {
    try {
      const validation = sessionTokenSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Validation error", 
          message: validation.error.errors[0].message 
        });
      }

      const { sessionToken } = validation.data;

      // Delete all entries using secure session authentication
      await storage.deleteAllPasswordEntries(sessionToken);
      
      res.json({ 
        message: "All password entries deleted successfully" 
      });
    } catch (error) {
      console.error("Error deleting password entries:", error);
      
      if (error instanceof Error && error.message.includes("Invalid session")) {
        return res.status(401).json({ 
          error: "Authentication failed", 
          message: "Invalid or expired session" 
        });
      }
      
      res.status(500).json({ 
        error: "Internal server error", 
        message: "Failed to delete password entries" 
      });
    }
  });

  // Admin endpoint to get system stats (no authentication for monitoring)
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const deletedCount = await storage.deleteExpiredEntries();
      const hasMaster = await checkMasterPasswordExists();
      
      res.json({ 
        expiredEntriesCleanedUp: deletedCount,
        masterPasswordConfigured: hasMaster,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error getting admin stats:", error);
      res.status(500).json({ 
        error: "Internal server error", 
        message: "Failed to get system stats" 
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      service: "password-sharing-api"
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}