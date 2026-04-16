const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
const admin = require('firebase-admin');

// Standalone migration script in JS to avoid TS compile issues
async function migrate() {
    console.log('Starting standalone JS migration with .env.local...');
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
        console.error('FIREBASE_SERVICE_ACCOUNT_KEY not found in environment!');
        return;
    }

    const serviceAccount = JSON.parse(serviceAccountKey);
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

        const activitiesSnap = await db.collection('entries')
            .where('userId', '==', userId)
            .where('isDeleted', '==', false)
            .get();

        console.log(`  Found ${activitiesSnap.size} activities.`);

        const activities = activitiesSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date?.toDate ? data.date.toDate() : new Date(data.date)
            };
        }).sort((a, b) => a.date.getTime() - b.date.getTime());

        // Reset stats for allTime only
        await db.collection('users').doc(userId).collection('stats').doc('allTime').delete();

        let totalMiles = 0;
        let totalRuns = 0;
        let totalTime = 0;
        let totalSteps = 0;
        let records = {};
        let levels = { Run: 'yellow', Walk: 'yellow', Bike: 'yellow', Hike: 'yellow' };
        let streaks = { current: 0, max: 0, lastDate: null };
        let badges = [];

        const MILESTONE_MARKS = [25, 50, 100, 250, 500, 1000];

        activities.forEach(activity => {
            const dist = Number(activity.distance) || 0;
            const dur = Number(activity.duration) || 0;
            const typeRaw = (activity.type || 'Run').toLowerCase();
            const dateObj = activity.date;

            totalMiles += dist;
            totalRuns += 1;
            totalTime += dur;
            totalSteps += (Number(activity.steps) || 0);

            if (!records.longestDistance || dist > records.longestDistance.value) {
                records.longestDistance = { value: dist, date: activity.date, display: `${dist.toFixed(2)} mi` };
            }

            if (typeRaw === 'run') {
                const pace = dist > 0 ? dur / dist : 0;
                const PB_MARKS = [
                    { key: "fastest1mi", dist: 1.0, label: "Fastest 1 Mile" },
                    { key: "fastest5k", dist: 3.106, label: "Fastest 5K" },
                    { key: "fastest10k", dist: 6.213, label: "Fastest 10K" },
                    { key: "fastestHalf", dist: 13.109, label: "Fastest Half Marathon" },
                    { key: "fastestFull", dist: 26.218, label: "Fastest Marathon" }
                ];
                PB_MARKS.forEach(mark => {
                    // Within 15% range for PBs (marathon training is long)
                    if (dist >= mark.dist * 0.95 && dist <= mark.dist * 1.15) {
                        if (!records[mark.key] || pace < records[mark.key].value) {
                             records[mark.key] = {
                                value: pace,
                                display: `${Math.floor(pace/60)}:${(pace%60).toFixed(0).padStart(2,'0')} /mi`,
                                duration: dur,
                                date: activity.date
                             };
                        }
                    }
                });
            }

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

            MILESTONE_MARKS.forEach(m => {
                if (totalMiles >= m && !badges.find(b => b.id === `${m}_miles`)) {
                    badges.push({ id: `${m}_miles`, earnedAt: activity.date });
                }
            });

            const getLevel = (m) => {
                if (m >= 9321) return "volt";
                if (m >= 3106) return "black";
                if (m >= 1553) return "purple";
                if (m >= 621) return "blue";
                if (m >= 155) return "green";
                if (m >= 31) return "orange";
                return "yellow";
            };
            
            // Per-activity type levels
            const capitalizedType = typeRaw.charAt(0).toUpperCase() + typeRaw.slice(1);
            // In this migration, we simplified by using totalMiles for levels. 
            // Future tracking in activity-service uses smarter per-type totals.
            if (levels[capitalizedType] !== undefined) {
                levels[capitalizedType] = getLevel(totalMiles);
            }
        });

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

        console.log(`  Finished user ${userId}: ${totalMiles.toFixed(2)} miles.`);
    }

    console.log('Migration complete.');
}

migrate().catch(console.error);
