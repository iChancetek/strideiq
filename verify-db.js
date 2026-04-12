// Final Comprehensive Database Verification Script
require('dotenv').config();
const { Pool } = require('pg');

const url = process.env.DATABASE_URL;
console.log('--- DB INTEGRITY CHECK ---');
console.log('Using URL:', url?.replace(/:([^@]+)@/, ':***@'));

const pool = new Pool({ 
    connectionString: url,
    connectionTimeoutMillis: 5000 
});

async function runTests() {
    try {
        // 1. Connection Test
        console.log('\n[1/3] Testing Connection...');
        const timeRes = await pool.query('SELECT NOW()');
        console.log('✅ Connection Successful! Server time:', timeRes.rows[0].now);

        // 2. Table Count Check
        console.log('\n[2/3] Verifying Required Tables...');
        const tableRes = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
        const tables = tableRes.rows.map(r => r.tablename);
        
        const requiredTables = [
            'users', 'activities', 'journals', 'fasting_sessions', 
            'friendships', 'likes', 'comments', 'leaderboards', 
            'achievements', 'training_plans', 'user_settings', 'user_stats'
        ];

        let missing = 0;
        requiredTables.forEach(t => {
            if (tables.includes(t)) {
                console.log(`   ✅ Table '${t}' exists.`);
            } else {
                console.log(`   ❌ Table '${t}' is MISSING!`);
                missing++;
            }
        });

        if (missing === 0) {
            console.log('✅ ALL REQUIRED TABLES ARE PRESENT.');
        } else {
            throw new Error(`${missing} tables are missing from the database.`);
        }

        // 3. Write Permission Test
        console.log('\n[3/3] Testing Write/Delete Permissions...');
        const testId = 'test-connection-id-' + Date.now();
        
        // Insert
        await pool.query("INSERT INTO users (id, email, display_name) VALUES ($1, $2, $3)", 
            [testId, 'test-db@strideiq.fit', 'Database Connectivity Tester']);
        console.log('   ✅ Write Test: SUCCESS (Created test user)');

        // Delete
        await pool.query("DELETE FROM users WHERE id = $1", [testId]);
        console.log('   ✅ Delete Test: SUCCESS (Cleaned up test user)');

        console.log('\n🏁 --- VERIFICATION COMPLETE: DATABASE IS FULLY OPERATIONAL ---');
        process.exit(0);

    } catch (err) {
        console.error('\n❌ --- VERIFICATION FAILED ---');
        console.error('Error Details:', err.message);
        if (err.message.includes('authentication failed')) {
            console.error('TIP: Check that the password in .env and Secret Manager matches exactly.');
        }
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runTests();
