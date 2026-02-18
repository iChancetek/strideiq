"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase/config";
import { sendEmailVerification } from "firebase/auth";
import { logOut } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState("");
    const [checking, setChecking] = useState(false);

    // Poll for email verification — reads fresh user from auth.currentUser
    // instead of the stale React `user` object (which won't re-render on reload)
    const checkVerification = useCallback(async () => {
        const current = auth.currentUser;
        if (!current) return;

        try {
            await current.reload();
            // After reload, re-read from auth.currentUser (fresh reference)
            const refreshed = auth.currentUser;
            if (refreshed?.emailVerified) {
                // Force the auth state to update so AuthContext picks it up
                await refreshed.getIdToken(true);
                router.push("/dashboard");
            }
        } catch (err) {
            // Silently ignore — will retry on next poll
            console.debug("Verification poll error:", err);
        }
    }, [router]);

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }

        // Already verified — go straight to dashboard
        if (user.emailVerified) {
            router.push("/dashboard");
            return;
        }

        // Poll every 2 seconds
        const interval = setInterval(checkVerification, 2000);
        return () => clearInterval(interval);
    }, [user, router, checkVerification]);

    const handleResend = async () => {
        const current = auth.currentUser;
        if (!current) return;
        setSending(true);
        setMessage("");
        try {
            await sendEmailVerification(current);
            setMessage("Verification email sent! Check your inbox and spam folder.");
        } catch (error: any) {
            if (error?.code === "auth/too-many-requests") {
                setMessage("Please wait a moment before requesting another email.");
            } else {
                setMessage("Error: " + error.message);
            }
        } finally {
            setSending(false);
        }
    };

    const handleManualCheck = async () => {
        setChecking(true);
        setMessage("");
        await checkVerification();
        // If we're still here, it wasn't verified
        const current = auth.currentUser;
        if (current && !current.emailVerified) {
            setMessage("Email not verified yet. Please click the link in your email.");
        }
        setChecking(false);
    };

    const handleLogout = async () => {
        await logOut();
        router.push("/login");
    };

    if (!user) return null;

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#000",
            color: "#fff",
            padding: "20px"
        }}>
            <div className="glass-panel" style={{
                maxWidth: "500px",
                width: "100%",
                padding: "40px",
                borderRadius: "24px",
                textAlign: "center",
                border: "1px solid rgba(255,255,255,0.1)"
            }}>
                <div style={{ fontSize: "60px", marginBottom: "20px" }}>📧</div>
                <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "15px" }}>Verify your email</h1>
                <p style={{ color: "var(--foreground-muted)", marginBottom: "10px", lineHeight: "1.6" }}>
                    We've sent a verification link to <strong>{user.email}</strong>.<br />
                    Please click the link to unlock your account.
                </p>

                {/* Auto-check indicator */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginBottom: "25px",
                    fontSize: "13px",
                    color: "var(--primary)",
                    opacity: 0.7
                }}>
                    <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "var(--primary)", animation: "pulse 1.5s infinite" }} />
                    Auto-checking every 2 seconds...
                </div>

                {message && (
                    <div style={{
                        padding: "12px",
                        background: message.includes("Error") ? "rgba(255,50,50,0.1)" : "rgba(204,255,0,0.1)",
                        color: message.includes("Error") ? "#ff4444" : "var(--primary)",
                        borderRadius: "8px",
                        marginBottom: "20px",
                        fontSize: "14px"
                    }}>
                        {message}
                    </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <button
                        onClick={handleManualCheck}
                        className="btn-primary"
                        disabled={checking}
                        style={{ width: "100%", padding: "16px", opacity: checking ? 0.6 : 1 }}
                    >
                        {checking ? "Checking..." : "I've Verified My Email"}
                    </button>

                    <button
                        onClick={handleResend}
                        disabled={sending}
                        style={{
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "var(--foreground)",
                            padding: "16px",
                            borderRadius: "12px",
                            cursor: sending ? "not-allowed" : "pointer",
                            opacity: sending ? 0.5 : 1
                        }}
                    >
                        {sending ? "Sending..." : "Resend Verification Email"}
                    </button>

                    <button
                        onClick={handleLogout}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--foreground-muted)",
                            cursor: "pointer",
                            fontSize: "14px",
                            marginTop: "10px"
                        }}
                    >
                        Log Out
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
            `}</style>
        </div>
    );
}
