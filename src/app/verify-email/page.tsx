"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { sendEmailVerification, reload } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState("");

    // Check status on mount and interval
    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }

        if (user.emailVerified) {
            router.push("/dashboard");
        }

        const interval = setInterval(async () => {
            await reload(user);
            if (user.emailVerified) {
                router.push("/dashboard");
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [user, router]);

    const handleResend = async () => {
        if (!user) return;
        setSending(true);
        try {
            await sendEmailVerification(user);
            setMessage("Verification email sent! Check your inbox (and spam).");
        } catch (error: any) {
            setMessage("Error: " + error.message);
        } finally {
            setSending(false);
        }
    };

    const handleManualCheck = async () => {
        if (!user) return;
        await reload(user);
        if (user.emailVerified) {
            router.push("/dashboard");
        } else {
            setMessage("Email not verified yet. Please click the link in your email.");
        }
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
                <p style={{ color: "var(--foreground-muted)", marginBottom: "30px", lineHeight: "1.6" }}>
                    We've sent a verification link to <strong>{user.email}</strong>.<br />
                    Please click the link to unlock your account.
                </p>

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
                        style={{ width: "100%", padding: "16px" }}
                    >
                        I've Verified My Email
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
                        onClick={() => router.push("/")} // Or logout
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
        </div>
    );
}
