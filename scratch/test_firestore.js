require("dotenv").config({path: ".env.local"});
const admin = require("firebase-admin");

let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
let parsed;
try {
    parsed = JSON.parse(JSON.parse(key));
} catch(e) {
    parsed = JSON.parse(key);
}

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: parsed.project_id,
        privateKey: parsed.private_key.replace(/\\n/g, "\n").replace(/\\\\n/g, "\n"),
        clientEmail: parsed.client_email
    }),
    projectId: "strideiq-221"
});

console.log("Checking DB collection 'users'");
admin.firestore().collection("users").limit(1).get()
    .then(s => console.log("DB SUCCESS:", s.size))
    .catch(e => { console.error("DB_ERROR:", e); });
