-- Script simple para corregir SOLO la restricción única
-- Ejecuta este script si solo quieres corregir el problema del ON CONFLICT

-- 1. Eliminar restricción anterior si existe
ALTER TABLE IF EXISTS species DROP CONSTRAINT IF EXISTS species_external_id_unique;

-- 2. Crear nueva restricción compuesta
ALTER TABLE species ADD CONSTRAINT species_external_id_client_id_unique
UNIQUE (external_id, client_id);

-- 3. Crear índice para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_species_external_id_client_id
ON species(external_id, client_id);

-- 4. Verificar que se creó correctamente
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'species'::regclass
AND contype = 'u';
