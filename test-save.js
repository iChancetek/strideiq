require('dotenv').config({ path: '.env.local' });

async function test() {
    console.log("Testing POST /api/journal/save...");
    try {
        const res = await fetch("http://localhost:3000/api/journal/save", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: "test-user-id", // mock user ID
                title: "Test Entry",
                content: "Testing the API route directly.",
                imageUrls: []
            })
        });

        const text = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Response: ${text}`);
    } catch (e) {
        console.error(e);
    }
}

test();
