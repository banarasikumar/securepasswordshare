import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create pg connection pool with SSL enabled (Render requires this)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Create Drizzle client
const db = drizzle(pool);

// ----------------- Your Storage Class -----------------
export class DatabaseStorage {
  private db;

  constructor() {
    this.db = db;
  }

  async savePassword(id: string, password: string) {
    // TODO: replace with your schema/table
    await this.db.execute(
      `INSERT INTO passwords (id, password) VALUES ($1, $2)`,
      [id, password]
    );
  }

  async getPassword(id: string) {
    const result = await this.db.execute(
      `SELECT password FROM passwords WHERE id = $1`,
      [id]
    );
    return result.rows[0]?.password || null;
  }

  async deletePassword(id: string) {
    await this.db.execute(`DELETE FROM passwords WHERE id = $1`, [id]);
  }
                          }
