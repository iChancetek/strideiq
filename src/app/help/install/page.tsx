"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

export default function InstallHelpPage() {
    return (
        <DashboardLayout>
            <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "40px" }}>
                <header style={{ marginBottom: "40px", textAlign: "center" }}>
                    <h1 style={{ fontSize: "36px", marginBottom: "10px" }}>Install Stride<span className="text-gradient">IQ</span></h1>
                    <p style={{ color: "var(--foreground-muted)", fontSize: "18px" }}>Get the full app experience on any device.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* iOS */}
                    <div className="glass-panel" style={{ padding: "30px", borderRadius: "16px" }}>
                        <div style={{ fontSize: "40px", marginBottom: "15px" }}>🍎</div>
                        <h2 style={{ marginBottom: "15px" }}>iOS (iPhone/iPad)</h2>
                        <ol style={{ paddingLeft: "20px", lineHeight: "1.6", color: "var(--foreground-muted)" }}>
                            <li>Open <strong>Safari</strong> on your device.</li>
                            <li>Tap the <strong>Share</strong> button (box with arrow up) at the bottom.</li>
                            <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                            <li>Tap <strong>Add</strong> in the top right corner.</li>
                        </ol>
                    </div>

                    {/* Android */}
                    <div className="glass-panel" style={{ padding: "30px", borderRadius: "16px" }}>
                        <div style={{ fontSize: "40px", marginBottom: "15px" }}>🤖</div>
                        <h2 style={{ marginBottom: "15px" }}>Android</h2>
                        <ol style={{ paddingLeft: "20px", lineHeight: "1.6", color: "var(--foreground-muted)" }}>
                            <li>Open <strong>Chrome</strong> on your device.</li>
                            <li>Tap the <strong>Menu</strong> (three dots) in the top right.</li>
                            <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                            <li>Tap <strong>Install</strong> to confirm.</li>
                        </ol>
                    </div>

                    {/* Windows */}
                    <div className="glass-panel" style={{ padding: "30px", borderRadius: "16px" }}>
                        <div style={{ fontSize: "40px", marginBottom: "15px" }}>💻</div>
                        <h2 style={{ marginBottom: "15px" }}>Windows (Chrome/Edge)</h2>
                        <ol style={{ paddingLeft: "20px", lineHeight: "1.6", color: "var(--foreground-muted)" }}>
                            <li>Open the site in <strong>Chrome</strong> or <strong>Edge</strong>.</li>
                            <li>Look for the <strong>Install icon</strong> (monitor with down arrow) in the address bar.</li>
                            <li>Click it and select <strong>Install</strong>.</li>
                        </ol>
                    </div>

                    {/* Mac */}
                    <div className="glass-panel" style={{ padding: "30px", borderRadius: "16px" }}>
                        <div style={{ fontSize: "40px", marginBottom: "15px" }}>🖥️</div>
                        <h2 style={{ marginBottom: "15px" }}>Mac (Chrome/Safari)</h2>
                        <ol style={{ paddingLeft: "20px", lineHeight: "1.6", color: "var(--foreground-muted)" }}>
                            <li><strong>Chrome:</strong> Click the Install icon in the address bar.</li>
                            <li><strong>Safari (macOS Sonoma+):</strong> Click <strong>File</strong> {'>'} <strong>Add to Dock</strong>.</li>
                        </ol>
                    </div>
                </div>

                <div style={{ marginTop: "40px", textAlign: "center", padding: "20px", background: "rgba(204, 255, 0, 0.1)", borderRadius: "12px" }}>
                    <h3 style={{ color: "var(--primary)", marginBottom: "10px" }}>Why Install?</h3>
                    <p>Installing StrideIQ gives you a fullscreen experience, faster load times, and one-tap access from your home screen just like a native app.</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
