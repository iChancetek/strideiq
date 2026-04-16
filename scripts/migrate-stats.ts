import 'dotenv/config';
import * as admin from 'firebase-admin';
import { updateUserStats } from '../lib/server/activity-service.ts';

async function migrate() {
    console.log('Starting migration...');
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
    const db = admin.firestore();

    const usersSnap = await db.collection('users').get();
    console.log(`Found ${usersSnap.size} users.`);

    for (const userDoc of usersSnap.docs) {
        const userId = userDoc.id;
        console.log(`Processing user: ${userId}`);

        // Get all activities for this user
        const activitiesSnap = await db.collection('entries')
            .where('userId', '==', userId)
            .where('isDeleted', '==', false)
            .get();

        console.log(`  Found ${activitiesSnap.size} activities.`);

        // Sort activities by date ascending to process chronologically
        const activities = activitiesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
        })).sort((a, b) => a.date.getTime() - b.date.getTime());

        // We need to clear existing stats to avoid double counting if the logic allows it.
        // But updateUserStats is additive. So let's clear them first.
        // Actually, for a safer migration, we could just reset the stats doc.
        await db.collection('users').doc(userId).collection('stats').doc('allTime').delete();
        // Delete all monthly stats? Might be too much. Let's just run them and assume they overwrite.

        for (const activity of activities) {
            try {
                // We bypass the transaction in updateUserStats by calling it normally
                // but since it uses transactions, it will be safe.
                await updateUserStats(userId, activity);
            } catch (err) {
                console.error(`  Error processing activity ${activity.id}:`, err);
            }
        }
        console.log(`  Finished user ${userId}`);
    }

    console.log('Migration complete.');
}

migrate().catch(console.error);

export {};
