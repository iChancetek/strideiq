import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || "postgres://localhost:5432/mock";

// Log connection status (redact password)
const sanitized = connectionString.replace(/:([^@]+)@/, ':***@');
console.log(`[DB] Connecting to: ${sanitized}`);

const pool = new Pool({
  connectionString,
  // Production-safe: prevent hanging connections
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
});

// Log connection errors instead of crashing
pool.on('error', (err) => {
  console.error('[DB] Pool error:', err.message);
});

export const db = drizzle(pool, { schema });
