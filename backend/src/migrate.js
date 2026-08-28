require('dotenv').config();
const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const sql = fs.readFileSync(
    path.join(__dirname, '../migrations/001_init.sql'),
    'utf8'
  );
  try {
    await pool.query(sql);
    console.log('✅ Migration complete');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
