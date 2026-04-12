// Rewrite .env.local with a properly formatted service account key
const fs = require('fs');

const content = fs.readFileSync('.env.local', 'utf8');

// Extract the raw key value between the outer quotes
const match = content.match(/FIREBASE_SERVICE_ACCOUNT_KEY="(.+)"/s);
if (!match) {
    console.error("Could not find FIREBASE_SERVICE_ACCOUNT_KEY in .env.local");
    process.exit(1);
}

let rawValue = match[1];
console.log("Raw value first 50 chars:", JSON.stringify(rawValue.substring(0, 50)));

// Unescape: replace \\\" with " and \\\\ with \\
let cleaned = rawValue.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
console.log("Cleaned first 50 chars:", JSON.stringify(cleaned.substring(0, 50)));

// Verify it parses as valid JSON
try {
    const parsed = JSON.parse(cleaned);
    console.log("SUCCESS - Valid JSON with project_id:", parsed.project_id);
    console.log("client_email:", parsed.client_email);
    console.log("private_key starts with:", parsed.private_key.substring(0, 30));
    
    // Write back with single quotes wrapping (dotenv won't process escapes inside single quotes)
    const newEnvLine = `FIREBASE_SERVICE_ACCOUNT_KEY='${cleaned}'`;
    const newContent = content
        .replace(/\r/g, '') // strip all \r
        .replace(/FIREBASE_SERVICE_ACCOUNT_KEY=".*"/s, newEnvLine);
    
    fs.writeFileSync('.env.local', newContent, 'utf8');
    console.log("\n.env.local rewritten successfully with single-quoted clean JSON!");
} catch(e) {
    console.error("STILL INVALID JSON after cleanup:", e.message);
    console.error("Cleaned value:", cleaned.substring(0, 200));
}
