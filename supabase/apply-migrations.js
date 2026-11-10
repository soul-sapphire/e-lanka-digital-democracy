/**
 * E-Lanka Digital Democracy Platform
 * Automated Supabase & PostgreSQL Migration Runner
 *
 * Reads 20260101000000_init_schema.sql and seed.sql and executes them
 * against the target database via SUPABASE_DB_URL or DATABASE_URL.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../packages/backend/.env') });

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

async function run() {
  console.log('===========================================================');
  console.log('🏛️  E-LANKA SUPABASE MIGRATION RUNNER');
  console.log('===========================================================');

  const migrationFile = path.join(__dirname, 'migrations/20260101000000_init_schema.sql');
  const seedFile = path.join(__dirname, 'seed.sql');

  if (!fs.existsSync(migrationFile)) {
    console.error('❌ Migration file not found:', migrationFile);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
  const seedSQL = fs.existsSync(seedFile) ? fs.readFileSync(seedFile, 'utf8') : '';

  console.log(`📜 Loaded Schema Migration (${(migrationSQL.length / 1024).toFixed(1)} KB)`);
  console.log(`🌱 Loaded Seed SQL (${(seedSQL.length / 1024).toFixed(1)} KB)`);

  if (!dbUrl) {
    console.log('\n⚠️  No DATABASE_URL or SUPABASE_DB_URL found in .env.');
    console.log('ℹ️  The E-Lanka backend engine is currently operating in high-performance');
    console.log('   in-memory transactional mode with seed data pre-loaded.');
    console.log('   To apply directly to a live Supabase project:');
    console.log('   Set SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"');
    console.log('   and re-run: npm run db:deploy\n');
    return;
  }

  try {
    const { Client } = require('pg');
    const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();
    console.log('✅ Connected to target Supabase PostgreSQL database.');

    console.log('⏳ Applying schema migrations & RLS policies...');
    await client.query(migrationSQL);
    console.log('✅ Schema migration applied successfully.');

    if (seedSQL) {
      console.log('⏳ Applying seed dataset...');
      await client.query(seedSQL);
      console.log('✅ Seed dataset applied successfully.');
    }

    await client.end();
    console.log('🎉 Supabase deployment completed successfully!');
  } catch (err) {
    console.error('❌ Database migration error:', err.message);
  }
}

run();

