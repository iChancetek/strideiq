import * as admin from 'firebase-admin';
import * as fs from 'fs';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema';
import * as dotenv from 'dotenv';
import path from 'path';

// 1. Manually parse .env.local because dotenv/Node `--env-file` ruins escaped newlines in quoted JSON
const envLocalPath = path.resolve('.env.local');
let rawKey = '';
let dbUrl = '';
if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
        if (line.startsWith('FIREBASE_SERVICE_ACCOUNT_KEY=')) {
            rawKey = line.substring('FIREBASE_SERVICE_ACCOUNT_KEY='.length).trim();
            // Remove wrapping quotes if present
            if (rawKey.startsWith('"') && rawKey.endsWith('"')) {
                rawKey = rawKey.slice(1, -1);
            }
            // Now we have a string with `\"` instead of `"`, and `\\n` instead of actual newlines.
            // Let's manually replace `\"` with `"` and `\\n` with actual `\n` for the object itself.
        }
    }
}

// Load .env for DB URL
dotenv.config();
dbUrl = process.env.DATABASE_URL || '';

if (!dbUrl) {
    if (fs.existsSync('.env')) {
        const lines = fs.readFileSync('.env', 'utf8').split('\n');
        for (const line of lines) {
            if (line.startsWith('DATABASE_URL=')) dbUrl = line.substring('DATABASE_URL='.length).trim();
        }
    }
}

if (!dbUrl) {
    console.error("DATABASE_URL not found!");
    process.exit(1);
}

// Prepare Service Account Key
if (!admin.apps.length) {
    let serviceAccount;
    try {
        const unescapedQuote = rawKey.replace(/\\"/g, '"');
        const unescapedJson = JSON.parse(unescapedQuote);
        
        // Fix the private key newlines specifically
        if (unescapedJson.private_key) {
             unescapedJson.private_key = unescapedJson.private_key.replace(/\\n/g, '\n');
        }
        
        serviceAccount = unescapedJson;
    } catch (e) {
        console.error("Failed to parse key manually:", e);
        process.exit(1);
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'strideiq-221'
    });
    console.log("Firebase Admin initialized successfully.");
}

const adminDb = admin.firestore();
const sql = neon(dbUrl);
const db = drizzle(sql, { schema });

async function migrate() {
    try {
        console.log("Starting Migration...");

        // USERS
        const usersSnap = await adminDb.collection("users").get();
        console.log(`Migrating ${usersSnap.size} users...`);
        for (const userDoc of usersSnap.docs) {
            const userData = userDoc.data();
            const uid = userDoc.id;

            await db.insert(schema.users).values({
                id: uid,
                email: userData.email || "",
                displayName: userData.displayName || null,
                photoURL: userData.photoURL || null,
                role: userData.role || "user",
                createdAt: userData.createdAt?.toDate() || new Date(),
            }).onConflictDoUpdate({
                target: schema.users.id,
                set: {
                    displayName: userData.displayName || null,
                    photoURL: userData.photoURL || null,
                    role: userData.role || "user",
                }
            });

            // ACTIVITIES (Subcollection)
            const activitiesSnap = await adminDb.collection("users").doc(uid).collection("activities").get();
            if (!activitiesSnap.empty) {
                console.log(`Migrating ${activitiesSnap.size} activities for ${uid}...`);
                const activities = activitiesSnap.docs.map(doc => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        userId: uid,
                        type: d.type || "Run",
                        distance: Number(d.distance) || 0,
                        duration: Number(d.duration) || 0,
                        calories: Number(d.calories) || 0,
                        date: d.date?.toDate() || new Date(),
                        steps: d.steps || 0,
                        mileSplits: d.mileSplits || null,
                        path: d.path || null,
                        weatherSnapshot: d.weatherSnapshot || null,
                        title: d.title || null,
                        notes: d.notes || null,
                        createdAt: d.createdAt?.toDate() || new Date(),
                    };
                });
                
                await db.insert(schema.activities).values(activities).onConflictDoNothing();
            }
            
            // JOURNALS
            const journalsSnap = await adminDb.collection("users").doc(uid).collection("journals").get();
            if (!journalsSnap.empty) {
                const js = journalsSnap.docs.map(doc => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        userId: uid,
                        title: d.title || null,
                        content: d.content || null,
                        date: d.date?.toDate() || new Date(),
                        mood: d.mood || null,
                    };
                });
                await db.insert(schema.journals).values(js).onConflictDoNothing();
            }
        }

        console.log("Migration finished successfully!");
    } catch (err: any) {
        console.error("Migration Failed:", err.message || err);
    }
}

migrate();

export {};
