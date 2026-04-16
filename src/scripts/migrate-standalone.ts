import 'dotenv/config';
import * as admin from 'firebase-admin';

// Standalone migration script with embedded logic to avoid import issues
async function migrate() {
    console.log('Starting standalone migration...');
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
    const db = admin.firestore();
    const FieldValue = admin.firestore.FieldValue;

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

        const activities = activitiesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
        })).sort((a, b) => a.date.getTime() - b.date.getTime());

        // Reset stats for fresh start
        await db.collection('users').doc(userId).collection('stats').doc('allTime').delete();

        // Local state for calculation
        let totalMiles = 0;
        let totalRuns = 0;
        let totalTime = 0;
        let totalSteps = 0;
        let records: any = {};
        let levels: any = { Run: 'yellow', Walk: 'yellow', Bike: 'yellow', Hike: 'yellow' };
        let streaks = { current: 0, max: 0, lastDate: null as string | null };
        let badges: any[] = [];

        const MILESTONE_MARKS = [25, 50, 100, 250, 500, 1000];

        for (const activity of activities) {
            const dist = Number(activity.distance) || 0;
            const dur = Number(activity.duration) || 0;
            const type = (activity.type || 'Run').toLowerCase();
            const dateObj = activity.date;

            totalMiles += dist;
            totalRuns += 1;
            totalTime += dur;
            totalSteps += (Number(activity.steps) || 0);

            // Records (PB)
            if (!records.longestDistance || dist > records.longestDistance.value) {
                records.longestDistance = { value: dist, date: activity.date, display: `${dist.toFixed(2)} mi` };
            }

            if (type === 'run') {
                const pace = dist > 0 ? dur / dist : 0;
                const PB_MARKS = [
                    { key: "fastest1mi", dist: 1.0, label: "Fastest 1 Mile" },
                    { key: "fastest5k", dist: 3.106, label: "Fastest 5K" },
                    { key: "fastest10k", dist: 6.213, label: "Fastest 10K" },
                    { key: "fastestHalf", dist: 13.109, label: "Fastest Half Marathon" },
                    { key: "fastestFull", dist: 26.218, label: "Fastest Marathon" }
                ];
                PB_MARKS.forEach(mark => {
                    if (dist >= mark.dist && dist <= mark.dist * 1.1) {
                        if (!records[mark.key] || pace < records[mark.key].value) {
                             records[mark.key] = {
                                value: pace,
                                display: `${Math.floor(pace/60)}:${(pace%60).toFixed(0).padStart(2,'0')} /mi`,
                                date: activity.date
                             };
                        }
                    }
                });
            }

            // Streak
            const todayStr = dateObj.toDateString();
            if (streaks.lastDate !== todayStr) {
                const lastDate = streaks.lastDate ? new Date(streaks.lastDate) : null;
                const yesterday = new Date(dateObj);
                yesterday.setDate(yesterday.getDate() - 1);
                
                if (lastDate && lastDate.toDateString() === yesterday.toDateString()) {
                    streaks.current += 1;
                } else {
                    streaks.current = 1;
                }
                if (streaks.current > streaks.max) streaks.max = streaks.current;
                streaks.lastDate = todayStr;
            }

            // Milestone Badges
            MILESTONE_MARKS.forEach(m => {
                if (totalMiles >= m && !badges.find(b => b.id === `${m}_miles`)) {
                    badges.push({ id: `${m}_miles`, earnedAt: activity.date });
                }
            });

            // Level Up
            const getLevel = (m: number) => {
                if (m >= 9321) return "volt";
                if (m >= 3106) return "black";
                if (m >= 1553) return "purple";
                if (m >= 621) return "blue";
                if (m >= 155) return "green";
                if (m >= 31) return "orange";
                return "yellow";
            };
            const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
            if (levels[capitalizedType] !== undefined) {
                levels[capitalizedType] = getLevel(totalMiles); // Simplified level system
            }
        }

        // Save back to Firestore
        await db.collection('users').doc(userId).collection('stats').doc('allTime').set({
            totalMiles,
            totalRuns,
            totalTime,
            totalSteps,
            records,
            streaks,
            levels,
            badges,
            lastUpdated: FieldValue.serverTimestamp()
        });

        console.log(`  Finished user ${userId}: ${totalMiles.toFixed(2)} miles, ${totalRuns} runs, ${streaks.max} day max streak.`);
    }

    console.log('Migration complete.');
}

migrate().catch(console.error);
