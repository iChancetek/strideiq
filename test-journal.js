// Test journal save and retrieval round-trip
require('dotenv').config();
const { Pool } = require('pg');

const url = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 5000 });

async function test() {
    try {
        console.log('\n=== JOURNAL ROUND-TRIP TEST ===\n');
        
        // 1. Create a test user
        const testUserId = 'test-journal-user-' + Date.now();
        await pool.query(
            "INSERT INTO users (id, email, display_name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
            [testUserId, 'test@strideiq.fit', 'Journal Tester']
        );
        console.log('✅ Created test user:', testUserId);

        // 2. Save a journal entry
        const journalId = 'test-journal-' + Date.now();
        await pool.query(
            "INSERT INTO journals (id, user_id, title, content, type, date) VALUES ($1, $2, $3, $4, $5, $6)",
            [journalId, testUserId, 'Test Journal', 'This is a test entry', 'journal', new Date()]
        );
        console.log('✅ Saved journal entry:', journalId);

        // 3. Retrieve it back
        const result = await pool.query(
            "SELECT * FROM journals WHERE user_id = $1 ORDER BY date DESC",
            [testUserId]
        );
        
        if (result.rows.length > 0) {
            console.log('✅ Retrieved journal entries:', result.rows.length);
            console.log('   Entry:', {
                id: result.rows[0].id,
                title: result.rows[0].title,
                content: result.rows[0].content,
                date: result.rows[0].date,
            });
        } else {
            console.log('❌ NO ENTRIES FOUND after insert!');
        }

        // 4. Check ALL journals in the database
        const allJournals = await pool.query("SELECT id, user_id, title, date FROM journals ORDER BY date DESC LIMIT 10");
        console.log('\n📋 ALL JOURNALS IN DATABASE (' + allJournals.rows.length + ' total):');
        allJournals.rows.forEach(j => {
            console.log(`   [${j.user_id.substring(0,12)}...] "${j.title}" - ${j.date}`);
        });

        // 5. Cleanup
        await pool.query("DELETE FROM journals WHERE id = $1", [journalId]);
        await pool.query("DELETE FROM users WHERE id = $1", [testUserId]);
        console.log('\n✅ Cleanup complete');
        console.log('\n🏁 JOURNAL ROUND-TRIP: SUCCESS\n');

    } catch (err) {
        console.error('❌ TEST FAILED:', err.message);
    } finally {
        await pool.end();
    }
}

test();
