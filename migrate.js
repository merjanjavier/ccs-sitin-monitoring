const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const localDb = createClient({
  url: 'file:ccs_database.db',
});

const remoteDb = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrateTable(tableName) {
  console.log(`\n----------------------------------------`);
  console.log(`Migrating table: ${tableName}...`);
  try {
    const { rows: localRows } = await localDb.execute(`SELECT * FROM ${tableName}`);
    console.log(`Found ${localRows.length} rows in local SQLite ${tableName}`);
    
    if (localRows.length === 0) {
      console.log(`No rows to migrate for ${tableName}`);
      return;
    }
    
    // Get column names
    const columns = Object.keys(localRows[0]);
    const colsStr = columns.join(', ');
    const placeholders = columns.map(() => '?').join(', ');
    
    let count = 0;
    for (const row of localRows) {
      const values = columns.map(col => row[col]);
      
      await remoteDb.execute({
        sql: `INSERT OR REPLACE INTO ${tableName} (${colsStr}) VALUES (${placeholders})`,
        args: values
      });
      count++;
    }
    console.log(`Successfully migrated ${count}/${localRows.length} rows into Turso ${tableName}`);
  } catch (error) {
    console.error(`Error migrating ${tableName}:`, error.message);
  }
}

async function run() {
  console.log('Starting migration to Turso cloud database...');
  
  // Migrate each table in dependency order
  await migrateTable('users');
  await migrateTable('admin');
  await migrateTable('announcements');
  await migrateTable('sitin_records');
  await migrateTable('reservations');
  await migrateTable('feedback');
  await migrateTable('lab_software');
  await migrateTable('settings');
  await migrateTable('disabled_pcs');
  
  console.log('\n========================================');
  console.log('Migration finished successfully!');
  console.log('========================================');
}

run();
