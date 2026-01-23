/**
 * Mapeo de Service IDs a componentes de trámites
 * Este archivo mapea cada servicio (trámite) con su componente correspondiente
 */

export const SERVICE_TO_COMPONENT_MAP: Record<string, string> = {
  // Autorizaciones
  '123e4567-e89b-42d3-a456-426614174008': 'autorizacion-aprovechamiento-extractivo-cinegetico',
  '123e4567-e89b-42d3-a456-426614174014': 'autorizacion-aprovechamiento-extractivo-comercial',
  '123e4567-e89b-42d3-a456-426614174004': 'autorizacion-aprovechamiento-no-extractivo',
  '123e4567-e89b-42d3-a456-426614174021': 'autorizacion-ejemplares-exoticos-mascota',
  // SEMARNAT-08-041: Autorización para el manejo, control y remediación... (dentro de UMA)
  '123e4567-e89b-42d3-a456-426614174005': 'autorizacion-ejemplares-perjudiciales',
  // Variante FUERA DE UMA (usa por ahora formulario genérico)
  '123e4567-e89b-42d3-a456-426614174006': 'autorizacion-ejemplares-perjudiciales-fuera-uma',
  '123e4567-e89b-42d3-a456-426614174010': 'autorizacion-liberacion-ejemplares',
  '123e4567-e89b-42d3-a456-426614174007': 'aviso-aprovechamiento-exoticos',
  '123e4567-e89b-42d3-a456-426614174011': 'aviso-aves-migratorias',
  '123e4567-e89b-42d3-a456-426614174013': 'informe-actividades',
  '123e4567-e89b-42d3-a456-426614174009': 'informe-resultados-perjudiciales',
  '123e4567-e89b-42d3-a456-426614174012': 'transferencia-derechos',

  // Registros
  '123e4567-e89b-42d3-a456-426614174019': 'conservacion-vida-silvestre-a',
  '123e4567-e89b-42d3-a456-426614174018': 'conservacion-vida-silvestre-b',
  '123e4567-e89b-42d3-a456-426614174017': 'incorporacion-mascotas-aves-presa',
  '123e4567-e89b-42d3-a456-426614174016': 'incorporacion-prestadores-servicios',
  '123e4567-e89b-42d3-a456-426614174022': 'incorporacion-sistema-uma',
  '123e4567-e89b-42d3-a456-426614174015': 'modificacion-umma',
  '123e4567-e89b-42d3-a456-426614174023': 'registro-organizaciones',
  '123e4567-e89b-42d3-a456-426614174020': 'registro-renovacion-uma',

  // Licencias
  '123e4567-e89b-42d3-a456-426614174002': 'licencia-caza-deportiva-anual',
  '123e4567-e89b-42d3-a456-426614174000': 'licencia-caza-deportiva-indefinida',
  '123e4567-e89b-42d3-a456-426614174001': 'licencia-prestador-servicios-caza',

  // Varios
  '123e4567-e89b-42d3-a456-426614174003': 'solicitud-informacion',
};

/**
 * Obtener el nombre del componente para un service ID
 */
export function getComponentNameForService(serviceId: string): string | null {
  return SERVICE_TO_COMPONENT_MAP[serviceId] || null;
}

/**
 * Verificar si un servicio tiene componente específico
 */
export function hasSpecificComponent(serviceId: string): boolean {
  return serviceId in SERVICE_TO_COMPONENT_MAP;
}
