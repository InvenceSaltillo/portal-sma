import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, './.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8');
  const lines = envContent.split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    process.env[key.trim()] = value.replace(/^["']|["']$/g, '');
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function listClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, short_name');

  if (error) {
    console.error('Error:', error);
    writeFileSync('clients_error.json', JSON.stringify(error, null, 2));
    process.exit(1);
  }

  writeFileSync('clients_output.json', JSON.stringify(data, null, 2));
}

listClients();
