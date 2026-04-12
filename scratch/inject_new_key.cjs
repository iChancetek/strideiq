const fs = require('fs');

// Read the new service account JSON
const newKeyFile = `c:\\Users\\chanc\\Downloads\\strideiq-221-firebase-adminsdk-fbsvc-3be5e649d1.json`;
const rawNewKey = fs.readFileSync(newKeyFile, 'utf8');

// Parse it so we can stringify it cleanly (minimizes whitespace, single line)
const keyObj = JSON.parse(rawNewKey);
const cleanKeyString = JSON.stringify(keyObj);

// Read .env.local
const envFile = '.env.local';
let envContent = fs.readFileSync(envFile, 'utf8');

// Replace the line. We use single quotes around the JSON payload so dotenv won't aggressively process escapes inside
const newEnvLine = `FIREBASE_SERVICE_ACCOUNT_KEY='${cleanKeyString}'`;
envContent = envContent.replace(/FIREBASE_SERVICE_ACCOUNT_KEY=.*/, newEnvLine);

// Write back
fs.writeFileSync(envFile, envContent, 'utf8');

console.log("Successfully updated .env.local with new service account key!");
console.log("New ID:", keyObj.private_key_id);
