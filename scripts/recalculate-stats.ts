const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
dotenv.config();

const { adminDb } = require('../src/lib/firebase/admin');
const { updateUserStats } = require('../src/lib/server/activity-service');

async function recalculate() {
    console.log('--- RECALCULATE STATS START ---');
    const db = adminDb;
    const usersSnap = await db.collection('users').get();
    console.log(`Found ${usersSnap.size} users.`);

    for (const userDoc of usersSnap.docs) {
        const userId = userDoc.id;
        console.log(`Processing user: ${userId}`);

        // 1. Delete all existing stats to ensure clean start
        const statsColl = db.collection('users').doc(userId).collection('stats');
        const statsDocs = await statsColl.get();
        const batch = db.batch();
        statsDocs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log(`  Deleted ${statsDocs.size} stats documents.`);

        // 2. Get all non-deleted activities
        const activitiesSnap = await db.collection('entries')
            .where('userId', '==', userId)
            .where('isDeleted', '==', false)
            .get();

        console.log(`  Found ${activitiesSnap.size} active entries.`);

        const activities = activitiesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
        })).sort((a, b) => a.date.getTime() - b.date.getTime());

        // 3. Re-process chronologically
        for (const activity of activities) {
            try {
                await updateUserStats(userId, activity);
            } catch (err) {
                console.error(`  Error processing activity ${activity.id}:`, err);
            }
        }
        console.log(`  Successfully recalculated stats for ${userId}`);
    }

    console.log('--- RECALCULATE STATS COMPLETE ---');
    process.exit(0);
}

recalculate().catch(err => {
    console.error('Recalculation failed:', err);
    process.exit(1);
});

export {};
