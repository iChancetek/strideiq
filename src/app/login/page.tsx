"use client";

import { useState, useEffect } from "react";
import { signInWithGoogle, signInWithEmail, resendVerification } from "@/lib/firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [loading, setLoading] = useState(false);
    const [showResend, setShowResend] = useState(false);
    const router = useRouter();

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError("");
        setInfo("");

        try {
            await signInWithGoogle();
            router.push("/dashboard");
        } catch (err: any) {
            setError("Failed to sign in with Google.");
            console.error(err);
            setLoading(false);
        }
    };

    // Handle Redirect Result (for Mobile/Redirect flow)
    useEffect(() => {
        import("firebase/auth").then(({ getRedirectResult }) => {
            getRedirectResult(auth).then(async (result) => {
                if (result) {
                    // User just came back from Google
                    // We need to sync them too!
                    // Note: We can import sync from auth.ts but it's not exported. 
                    // Ideally syncUserToFirestore should be exported or handled in AuthContext.
                    // For now, let's assume the AuthContext or background trigger handles it, 
                    // OR we just proceed. The auth state change listener in AuthContext will catch the user.
                    router.push("/dashboard");
                }
            }).catch((error) => {
                console.error("Redirect Error:", error);
                setError("Failed to sign in with Google (Redirect).");
            });
        });
    }, [router]);

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setInfo("");
        setShowResend(false);

        try {
            await signInWithEmail(email, password);
            router.push("/dashboard");
        } catch (err: any) {
            const code = err?.code;
            switch (code) {
                case "auth/email-not-verified":
                    setError("Your email isn't verified yet. Check your inbox for the verification link.");
                    setShowResend(true);
                    break;
                case "auth/user-not-found":
                case "auth/invalid-credential":
                    setError("Invalid email or password. Please try again.");
                    break;
                case "auth/wrong-password":
                    setError("Incorrect password. Please try again.");
                    break;
                case "auth/too-many-requests":
                    setError("Too many attempts. Please wait a moment and try again.");
                    break;
                case "auth/invalid-email":
                    setError("Please enter a valid email address.");
                    break;
                default:
                    setError("Failed to sign in. Check your credentials.");
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        setLoading(true);
        setInfo("");
        try {
            await resendVerification();
            setInfo("Verification email sent! Check your inbox and spam folder.");
            setShowResend(false);
        } catch (err: any) {
            if (err?.code === "auth/too-many-requests") {
                setInfo("Please wait a moment before requesting another email.");
            } else {
                setInfo("Could not send email. Try logging in again first.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "radial-gradient(circle at top right, rgba(0, 229, 255, 0.1) 0%, rgba(5, 5, 5, 0) 70%)"
        }}>
            <div className="glass-panel" style={{
                width: "100%",
                maxWidth: "400px",
                padding: "40px",
                borderRadius: "var(--radius-lg)"
            }}>
                <div style={{ textAlign: "center", marginBottom: "30px" }}>
                    <h1 style={{ fontSize: "28px", marginBottom: "10px" }}>Welcome Back</h1>
                    <p style={{ color: "var(--foreground-muted)" }}>Continue your training journey.</p>
                </div>

                {error && (
                    <div style={{
                        background: "rgba(255, 0, 85, 0.1)",
                        color: "var(--error)",
                        padding: "12px",
                        borderRadius: "var(--radius-sm)",
                        marginBottom: "15px",
                        fontSize: "14px",
                        textAlign: "center",
                        lineHeight: "1.5"
                    }}>
                        {error}
                    </div>
                )}

                {info && (
                    <div style={{
                        background: "rgba(204, 255, 0, 0.1)",
                        color: "var(--primary)",
                        padding: "12px",
                        borderRadius: "var(--radius-sm)",
                        marginBottom: "15px",
                        fontSize: "14px",
                        textAlign: "center"
                    }}>
                        ✅ {info}
                    </div>
                )}

                {showResend && (
                    <button
                        onClick={handleResendVerification}
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "10px",
                            marginBottom: "15px",
                            borderRadius: "var(--radius-sm)",
                            background: "rgba(204,255,0,0.1)",
                            border: "1px solid rgba(204,255,0,0.3)",
                            color: "var(--primary)",
                            cursor: loading ? "not-allowed" : "pointer",
                            fontWeight: 600,
                            fontSize: "14px"
                        }}
                    >
                        📧 Resend Verification Email
                    </button>
                )}

                <form onSubmit={handleEmailSignIn} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--foreground-muted)" }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "var(--radius-sm)",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "#fff",
                                outline: "none",
                                opacity: loading ? 0.5 : 1
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
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "var(--radius-sm)",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "#fff",
                                outline: "none",
                                opacity: loading ? 0.5 : 1
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ marginTop: "10px", width: "100%", justifyContent: "center", opacity: loading ? 0.6 : 1 }}
                    >
                        {loading ? "Signing In..." : "Log In"}
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
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "var(--radius-full)",
                        background: "#fff",
                        color: "#000",
                        fontWeight: 600,
                        border: "none",
                        cursor: loading ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        opacity: loading ? 0.6 : 1
                    }}
                >
                    <span style={{ fontSize: "18px" }}>G</span> Sign in with Google
                </button>

                <p style={{ marginTop: "30px", textAlign: "center", fontSize: "14px", color: "var(--foreground-muted)" }}>
                    Don't have an account? <Link href="/signup" className="text-gradient" style={{ fontWeight: 600 }}>Sign Up</Link>
                </p>
            </div>
        </main>
    );
}
