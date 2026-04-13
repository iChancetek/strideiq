
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

async function test() {
    if (!admin.apps.length) {
        admin.initializeApp({
            projectId: 'strideiq-221'
        });
    }

    console.log("Testing (default)...");
    try {
        const db1 = getFirestore(admin.app());
        await db1.collection('test').limit(1).get();
        console.log("SUCCESS: (default) works");
    } catch (e) {
        console.log("FAILURE: (default) fails:", e.message);
    }

    console.log("\nTesting 'default'...");
    try {
        const db2 = getFirestore(admin.app(), 'default');
        await db2.collection('test').limit(1).get();
        console.log("SUCCESS: 'default' works");
    } catch (e) {
        console.log("FAILURE: 'default' fails:", e.message);
    }
}

test();
