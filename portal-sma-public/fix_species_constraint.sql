-- Script para corregir la restricción única en la tabla species
-- Ejecuta este script directamente en tu base de datos

-- 1. Verificar restricciones existentes
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'species'::regclass
AND contype = 'u';

-- 2. Eliminar la restricción única anterior si existe
ALTER TABLE IF EXISTS species DROP CONSTRAINT IF EXISTS species_external_id_unique;

-- 3. Crear la nueva restricción única compuesta
ALTER TABLE species ADD CONSTRAINT species_external_id_client_id_unique
UNIQUE (external_id, client_id);

-- 4. Crear índice compuesto para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_species_external_id_client_id
ON species(external_id, client_id);

-- 5. Verificar que la nueva restricción se creó correctamente
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'species'::regclass
AND contype = 'u';

-- 6. Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'species';
