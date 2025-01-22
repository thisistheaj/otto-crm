import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// TypeScript-friendly way to get __dirname in ESM
const currentDir = dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  if (!process.env.SUPABASE_URL) throw new Error('SUPABASE_URL is required');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // Read all migration files
  const migrationsDir = path.join(currentDir, '..', 'supabase', 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', {
        query: statement
      });

      if (error) {
        console.error(`Error running statement from ${file}:`, error);
        console.error('Statement:', statement);
        process.exit(1);
      }
    }

    console.log(`Successfully ran migration: ${file}`);
  }

  console.log('All migrations completed successfully');
}

runMigrations().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
}); 