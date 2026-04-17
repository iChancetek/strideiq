/**
 * Run this script ONCE from the browser console while logged in to StrideIQ.
 * It calls the /api/activity/deduplicate endpoint to clean up duplicate activities.
 * 
 * Steps:
 * 1. Open StrideIQ in your browser and make sure you're logged in
 * 2. Open browser DevTools (F12) → Console tab
 * 3. Paste this entire script and press Enter
 */

(async () => {
    // Get the current user's token from Firebase Auth
    const { getAuth } = await import("https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js");
    
    // The app should already be initialized in the page context
    const user = getAuth().currentUser;
    if (!user) {
        console.error("❌ Not logged in! Please log in first.");
        return;
    }

    const token = await user.getIdToken();
    console.log("🔍 Running deduplication for user:", user.uid);
    
    const res = await fetch("/api/activity/deduplicate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await res.json();
    
    if (data.success) {
        console.log(`✅ Removed ${data.removed} duplicate(s)!`);
        console.log("Duplicate IDs:", data.duplicateIds);
        console.log("Refreshing page in 2 seconds...");
        setTimeout(() => location.reload(), 2000);
    } else {
        console.log("ℹ️", data.message || data.error);
    }
})();
