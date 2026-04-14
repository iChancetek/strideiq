const admin = require('firebase-admin');
const serviceAccount = require('./strideiq-221-firebase-adminsdk-fbsvc-3be5e649d1.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
db.settings({ databaseId: 'default' });

async function checkFastingEntries() {
    console.log("=== Checking Fasting Entries for Chancellor ===");
    const userId = "7veZQx0WFNaTAjxQRYnTfqgfFKF2";
    
    // Check all fasting entries for this user
    const snapshot = await db.collection('entries')
        .where('userId', '==', userId)
        .where('type', '==', 'Fasting')
        .get();

    if (snapshot.empty) {
        console.log("No fasting entries found.");
        return;
    }

    const entries = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        entries.push({
            id: doc.id,
            ...data,
            // Convert timestamps for readability
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            startTime: data.startTime?.toDate?.()?.toISOString() || data.startTime,
            endTime: data.endTime?.toDate?.()?.toISOString() || data.endTime,
        });
    });

    // Sort by createdAt desc
    entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log(JSON.stringify(entries, null, 2));
}

checkFastingEntries();
