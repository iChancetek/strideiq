const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
db.settings({ databaseId: 'default' });

async function findApril13Fast() {
    console.log("=== Searching for April 13, 2026 Fast ===");
    const userId = "7veZQx0WFNaTAjxQRYnTfqgfFKF2";
    
    // Look for anything on April 13 or 14
    const entriesRef = db.collection('entries');
    const snapshot = await entriesRef
        .where('userId', '==', userId)
        .where('type', '==', 'Fasting')
        .get();

    const results = [];
    snapshot.forEach(doc => {
        const d = doc.data();
        const start = d.startTime?.toDate?.() || new Date(d.startTime);
        
        // Filter for April 2026
        if (start.getFullYear() === 2026 && start.getMonth() === 3) { // 3 is April
            results.push({
                id: doc.id,
                ...d,
                readableStart: start.toString(),
                readableEnd: (d.endTime?.toDate?.() || new Date(d.endTime)).toString(),
                durationHrs: d.duration / 3600 || (new Date(d.endTime) - start) / 3600000
            });
        }
    });

    console.log(JSON.stringify(results, null, 2));
}

findApril13Fast();
