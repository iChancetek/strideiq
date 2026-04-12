import { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

const DEFAULT_TIMEOUT = 8000;
const MAX_RETRIES = 3;

/**
 * Robust wrapper for Supabase calls with Retry + Timeout logic.
 */
export async function supabaseWithRetry<T>(
    operation: () => Promise<PostgrestResponse<T> | PostgrestSingleResponse<T>>,
    retries = MAX_RETRIES,
    timeout = DEFAULT_TIMEOUT
): Promise<PostgrestResponse<T> | PostgrestSingleResponse<T>> {
    let lastError: any;

    for (let attempt = 1; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const result = await operation();
            clearTimeout(timeoutId);

            if (result.error) {
                throw result.error;
            }

            return result;
        } catch (err: any) {
            clearTimeout(timeoutId);
            lastError = err;
            
            if (err.name === 'AbortError') {
                console.warn(`[Supabase Wrapper] Attempt ${attempt} timed out after ${timeout}ms`);
            } else {
                console.warn(`[Supabase Wrapper] Attempt ${attempt} failed:`, err.message);
            }

            if (attempt < retries) {
                const backoff = 1000 * Math.pow(2, attempt - 1);
                await new Promise(r => setTimeout(r, backoff));
            }
        }
    }

    throw lastError || new Error("Supabase operation failed after max retries");
}
