import * as Ably from 'ably';

// Server-side Ably instance (Full Access)
export const ablyRest = typeof window === 'undefined' 
    ? new Ably.Rest({ key: process.env.ABLY_API_KEY }) 
    : null;

// Client-side Ably instance (Subscribe-only Access)
export const ablyRealtime = typeof window !== 'undefined' 
    ? new Ably.Realtime({ 
        key: process.env.NEXT_PUBLIC_ABLY_SUBSCRIBE_KEY,
        // Using a subscriber key directly is fine for restricted channels, 
        // but for elite-level security, Ably recommends token authentication.
        // For this phase, we'll use the subscribe-only key provided.
    })
    : null;
