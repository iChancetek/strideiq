"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, onIdTokenChanged, User, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

interface AuthContextType {
    user: User | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Handle basic auth state
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        // Handle session revocation
        // onIdTokenChanged triggers when the user is signed in, signed out, or the token is refreshed.
        const unsubscribeToken = onIdTokenChanged(auth, async (user) => {
            if (user) {
                try {
                    // Force refresh to check for revocation
                    await user.getIdTokenResult(true);
                } catch (error: any) {
                    if (error.code === "auth/user-token-revoked") {
                        console.warn("[AuthContext] Session revoked by admin. Logging out...");
                        await signOut(auth);
                    }
                }
            }
        });

        // Periodic check (every 5 minutes) to ensure admin kill-switch is eventually applied even without navigation
        const interval = setInterval(async () => {
            if (auth.currentUser) {
                try {
                    await auth.currentUser.getIdTokenResult(true);
                } catch (error: any) {
                    if (error.code === "auth/user-token-revoked") {
                        await signOut(auth);
                    }
                }
            }
        }, 5 * 60 * 1000);

        return () => {
            unsubscribeAuth();
            unsubscribeToken();
            clearInterval(interval);
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
