#!/usr/bin/env node
/**
 * Aplica migrations SQL do LogStoka no Postgres (Supabase).
 * Requer LOGSTOKA_DATABASE_URL no server/.env (Connection string do painel Supabase).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from '../../zaptro/node_modules/postgres/src/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, 'server/.env');

function loadDatabaseUrl() {
  const fromEnv = process.env.LOGSTOKA_DATABASE_URL?.trim();
  if (fromEnv) return fromEnv;
  try {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const t = line.trim();
      if (t.startsWith('LOGSTOKA_DATABASE_URL=') && !t.startsWith('#')) {
        return t.slice('LOGSTOKA_DATABASE_URL='.length).trim();
      }
    }
  } catch {
    /* ignore */
  }
  return '';
}

const databaseUrl = loadDatabaseUrl();
if (!databaseUrl) {
  console.error(
    'Defina LOGSTOKA_DATABASE_URL em apps/logstoka/server/.env\n' +
      '(Supabase → Project Settings → Database → Connection string → URI)',
  );
  process.exit(1);
}

const migrationsDir = join(root, 'supabase/migrations');
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const sql = postgres(databaseUrl, { max: 1, idle_timeout: 1, connect_timeout: 15 });

try {
  for (const file of files) {
    const body = readFileSync(join(migrationsDir, file), 'utf8');
    console.log(`→ ${file}`);
    await sql.unsafe(body);
    console.log(`  ok`);
  }
  console.log('Migrations aplicadas.');
} catch (err) {
  console.error('Falha:', err.message);
  process.exit(1);
} finally {
  await sql.end({ timeout: 2 });
}
