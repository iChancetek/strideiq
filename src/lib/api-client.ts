import { auth } from "@/lib/firebase/config";

/**
 * A standard wrapper around fetch that automatically injects the Firebase ID Token
 * for backend authentication.
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.warn("[API Client] No user logged in, sending unauthenticated request to:", url);
            return fetch(url, options);
        }

        const token = await user.getIdToken();
        
        const headers = new Headers(options.headers || {});
        headers.set("Authorization", `Bearer ${token}`);
        
        if (!headers.has("Content-Type") && (options.method === "POST" || options.method === "PUT" || options.method === "PATCH")) {
            headers.set("Content-Type", "application/json");
        }

        return fetch(url, {
            ...options,
            headers,
            cache: 'no-store' // Ensure we never serve stale data for authenticated routes
        });
    } catch (error) {
        console.error("[API Client] Failed to get auth token:", error);
        return fetch(url, options); // Fallback to unauthenticated fetch
    }
}
