const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const key = envConfig.FIREBASE_SERVICE_ACCOUNT_KEY;

let cleanedKey = key.trim();
console.log('Original key starts with:', cleanedKey.substring(0, 20));

// Step 1: Unwrap double-quoted representations (common in .env)
if (cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) {
    try {
        const unquoted = JSON.parse(cleanedKey);
        if (typeof unquoted === 'string') {
            cleanedKey = unquoted;
        }
    } catch(e) {}
}

console.log('After unquoting starts with:', cleanedKey.substring(0, 20));

// Step 2: Fix literal escaped quotes (e.g. from copy-pasting stringified json)
if (cleanedKey.includes('\\"')) {
    cleanedKey = cleanedKey.replace(/\\"/g, '"');
}

console.log('After unescaping quotes starts with:', cleanedKey.substring(0, 20));

// Step 3: Fix missing braces
if (!cleanedKey.startsWith('{')) {
    if (cleanedKey.startsWith('"type"')) {
        cleanedKey = '{' + cleanedKey;
    } else if (cleanedKey.startsWith('type"')) {
        cleanedKey = '{"' + cleanedKey;
    } else {
        cleanedKey = '{' + cleanedKey;
    }
}
if (!cleanedKey.endsWith('}')) {
    cleanedKey = cleanedKey + '}';
}

try {
    let parsed = JSON.parse(cleanedKey);
    console.log('--- PARSE SUCCESS ---');
    console.log('Parsed type:', parsed.type);
    console.log('Private key length:', parsed.private_key ? parsed.private_key.length : 'missing');
} catch(e) {
    console.log('--- PARSE ERROR ---');
    console.log(e.message);
    console.log('Key starting with:', cleanedKey.substring(0, 20));
}
