-- Script seguro para corregir la restricción única en la tabla species
-- Este script maneja casos donde la tabla ya existe

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

-- 3. Crear la nueva restricción única compuesta (solo si no existe)
DO $$
BEGIN
    -- Verificar si la restricción compuesta ya existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'species'::regclass
        AND conname = 'species_external_id_client_id_unique'
    ) THEN
        ALTER TABLE species ADD CONSTRAINT species_external_id_client_id_unique
        UNIQUE (external_id, client_id);
        RAISE NOTICE 'Restricción única compuesta creada exitosamente';
    ELSE
        RAISE NOTICE 'La restricción única compuesta ya existe';
    END IF;
END $$;

-- 4. Crear índice compuesto para optimizar consultas (solo si no existe)
CREATE INDEX IF NOT EXISTS idx_species_external_id_client_id
ON species(external_id, client_id);

-- 5. Verificar que la función del trigger existe (solo si no existe)
CREATE OR REPLACE FUNCTION update_species_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear el trigger (solo si no existe)
DO $$
BEGIN
    -- Verificar si el trigger ya existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trigger_update_species_updated_at'
        AND tgrelid = 'species'::regclass
    ) THEN
        CREATE TRIGGER trigger_update_species_updated_at
            BEFORE UPDATE ON species
            FOR EACH ROW
            EXECUTE FUNCTION update_species_updated_at();
        RAISE NOTICE 'Trigger creado exitosamente';
    ELSE
        RAISE NOTICE 'El trigger ya existe';
    END IF;
END $$;

-- 7. Verificar que todo se creó correctamente
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'species'::regclass
AND contype = 'u';

-- 8. Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'species';

-- 9. Verificar triggers
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'species';
