// Este archivo debe ser importado PRIMERO antes que cualquier otro módulo
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Intentar cargar .env desde diferentes ubicaciones
const envPath1 = join(__dirname, '../.env');
const envPath2 = join(process.cwd(), '.env');

let envPath = null;

if (existsSync(envPath1)) {
  envPath = envPath1;
} else if (existsSync(envPath2)) {
  envPath = envPath2;
}

if (envPath) {
  // Leer y parsear manualmente línea por línea
  const envContent = readFileSync(envPath, 'utf8');
  const lines = envContent.split(/\r?\n/);

  let parsedCount = 0;
  for (const line of lines) {
    const trimmedLine = line.trim();
    // Ignorar comentarios y líneas vacías
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;

    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex === -1) continue;

    const key = trimmedLine.substring(0, equalIndex).trim();
    let value = trimmedLine.substring(equalIndex + 1).trim();

    // Remover comillas si existen
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
    parsedCount++;
  }

  console.log(`✅ Variables de entorno cargadas desde: ${envPath} (${parsedCount} variables)`);
} else {
  // Intentar sin path (buscará en el directorio actual)
  dotenv.config();
  console.log('✅ Variables de entorno cargadas desde directorio actual');
}

// Verificar que las variables críticas estén cargadas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  console.error('📁 Archivo .env:', envPath || 'no encontrado');
  console.error('📁 Directorio actual:', process.cwd());
  process.exit(1);
}

// Exportar las variables para uso directo si es necesario
export const supabaseUrl = process.env.SUPABASE_URL;
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export default true;
