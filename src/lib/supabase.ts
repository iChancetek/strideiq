import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// For general use (Realtime and Public DB access)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Service Role Client (Optional - if needed for administrative tasks in future)
 * For this migration, we are primarily using the Anon key for broadcasting
 * and direct Drizzle Postgres connection for DB writes.
 */
