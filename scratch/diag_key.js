
// Load .env.local manually for test
require('dotenv').config({ path: '.env.local' });

const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
console.log("Original key length:", key ? key.length : "UNDEFINED");

if (key) {
    const trimmedKey = key.trim();
    console.log("Starts with:", trimmedKey[0]);
    console.log("Ends with:", trimmedKey[trimmedKey.length - 1]);

    try {
        let parsedKey;
        if (trimmedKey.startsWith("{")) {
            parsedKey = JSON.parse(trimmedKey);
            console.log("SUCCESS: Standard JSON parse");
        } else if (trimmedKey.startsWith("'") && trimmedKey.endsWith("'")) {
             console.log("DETECTED: Single quotes wrapper");
             const unwrapped = trimmedKey.slice(1, -1);
             parsedKey = JSON.parse(unwrapped);
             console.log("SUCCESS: Unwrapped single quotes parse");
        } else if (trimmedKey.startsWith('"')) {
             console.log("DETECTED: Double quotes wrapper");
             parsedKey = JSON.parse(JSON.parse(trimmedKey));
             console.log("SUCCESS: Double escaped parse");
        } else {
             console.log("ERROR: Unrecognized format");
        }
    } catch (e) {
        console.log("PARSE ERROR:", e.message);
    }
}
