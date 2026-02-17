"use client";

import { useState } from "react";
import { signInWithGoogle, signUpWithEmail } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            router.push("/dashboard");
        } catch (err) {
            setError("Failed to sign up with Google.");
            console.error(err);
        }
    };

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signUpWithEmail(email, password);
            router.push("/dashboard");
        } catch (err) {
            setError("Failed to create account. Try again.");
            console.error(err);
        }
    };

    return (
        <main style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "radial-gradient(circle at bottom left, rgba(204, 255, 0, 0.1) 0%, rgba(5, 5, 5, 0) 70%)"
        }}>
            <div className="glass-panel" style={{
                width: "100%",
                maxWidth: "400px",
                padding: "40px",
                borderRadius: "var(--radius-lg)"
            }}>
                <div style={{ textAlign: "center", marginBottom: "30px" }}>
                    <h1 style={{ fontSize: "28px", marginBottom: "10px" }}>Join StrideIQ</h1>
                    <p style={{ color: "var(--foreground-muted)" }}>Start your elite training today.</p>
                </div>

                {error && (
                    <div style={{
                        background: "rgba(255, 0, 85, 0.1)",
                        color: "var(--error)",
                        padding: "10px",
                        borderRadius: "var(--radius-sm)",
                        marginBottom: "20px",
                        fontSize: "14px",
                        textAlign: "center"
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleEmailSignUp} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--foreground-muted)" }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "var(--radius-sm)",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "#fff",
                                outline: "none"
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--foreground-muted)" }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "var(--radius-sm)",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "#fff",
                                outline: "none"
                            }}
                        />
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: "10px", width: "100%", justifyContent: "center" }}>
                        Create Account
                    </button>
                </form>

                <div style={{
                    margin: "20px 0",
                    textAlign: "center",
                    color: "var(--foreground-muted)",
                    fontSize: "14px",
                    position: "relative"
                }}>
                    <span style={{ background: "#000", padding: "0 10px", position: "relative", zIndex: 1 }}>OR</span>
                    <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "rgba(255,255,255,0.1)" }}></div>
                </div>

                <button
                    onClick={handleGoogleSignIn}
                    style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "var(--radius-full)",
                        background: "#fff",
                        color: "#000",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px"
                    }}
                >
                    <span style={{ fontSize: "18px" }}>G</span> Sign up with Google
                </button>

                <p style={{ marginTop: "30px", textAlign: "center", fontSize: "14px", color: "var(--foreground-muted)" }}>
                    Already have an account? <Link href="/login" className="text-gradient" style={{ fontWeight: 600 }}>Log In</Link>
                </p>
            </div>
        </main>
    );
}
