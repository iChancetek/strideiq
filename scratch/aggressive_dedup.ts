import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'))
    });
}

const db = getFirestore(admin.app(), "default");

async function dedup() {
    const users = await db.collection("users").where("email", "==", "chancellor@ichancetek.com").get();
    if (users.empty) return;
    const uid = users.docs[0].id;

    console.log(`[DEDUP] Fetching entries for Chancellor...`);
    const snapshot = await db.collection("entries")
        .where("userId", "==", uid)
        .get();

    console.log(`[DEDUP] Found ${snapshot.size} total entries.`);

    const signatureMap = new Map<string, string[]>();
    
    snapshot.docs.forEach(doc => {
        const d = doc.data();
        
        // Final aggressive signature: Type + Distance + Duration + Notes
        // Ignoring date entirely to catch multi-day duplicates of identical activities
        const signature = `${d.type}|${d.distance}|${d.duration}|${d.notes}`;
        
        if (!signatureMap.has(signature)) {
            signatureMap.set(signature, []);
        }
        signatureMap.get(signature)!.push(doc.id);
    });

    let deleteCount = 0;
    const batch = db.batch();

    for (const [sig, ids] of signatureMap.entries()) {
        if (ids.length > 1) {
            console.log(`[DEDUP] Found ${ids.length} duplicates for signature: ${sig}`);
            // Keep the first one, delete the rest
            const toDelete = ids.slice(1);
            toDelete.forEach(id => {
                batch.delete(db.collection("entries").doc(id));
                deleteCount++;
            });
        }
    }

    if (deleteCount > 0) {
        await batch.commit();
        console.log(`[DEDUP] Successfully deleted ${deleteCount} duplicate entries.`);
    } else {
        console.log(`[DEDUP] No duplicates found with current fuzzy logic.`);
    }
}

dedup().catch(console.error);
