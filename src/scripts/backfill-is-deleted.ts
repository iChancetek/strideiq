const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
dotenv.config();

const { adminDb } = require('../lib/firebase/admin');

async function backfill() {
    console.log('--- BACKFILL isDeleted START ---');
    const db = adminDb;
    const snapshot = await db.collection('entries').get();
    console.log(`Checking ${snapshot.size} entries...`);

    let updatedCount = 0;
    const batch = db.batch();

    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.isDeleted === undefined) {
            batch.update(doc.ref, { isDeleted: false });
            updatedCount++;
            
            // Commit in chunks of 500
            if (updatedCount % 500 === 0) {
                await batch.commit();
                console.log(`  Processed ${updatedCount} updates...`);
            }
        }
    }

    if (updatedCount % 500 !== 0) {
        await batch.commit();
    }

    console.log(`--- BACKFILL isDeleted COMPLETE. Updated ${updatedCount} docs. ---`);
    process.exit(0);
}

backfill().catch(err => {
    console.error('Backfill failed:', err);
    process.exit(1);
});
