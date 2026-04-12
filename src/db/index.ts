import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://localhost:5432/mock"
});
export const db = drizzle(pool, { schema });
