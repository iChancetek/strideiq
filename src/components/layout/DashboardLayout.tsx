"use client";

import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar />
            <main style={{
                flex: 1,
                marginLeft: "250px", // Desktop Sidebar width
                padding: "40px",
                width: "calc(100% - 250px)"
            }} className="main-content">
                {children}
            </main>

            <style jsx global>{`
        @media (max-width: 768px) {
          .main-content {
            margin-left: 0 !important;
            width: 100% !important;
            padding: 20px !important;
            padding-bottom: 80px !important; /* Space for FAB */
          }
        }
      `}</style>
        </div>
    );
}
