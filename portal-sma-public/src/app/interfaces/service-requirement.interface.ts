/** Fila de `requirement_catalog` devuelta dentro del vínculo servicio–requisito. */
export interface ServiceRequirementCatalogDto {
  id: string;
  name: string;
  title: string;
  description: string | null;
  legal_reference: string | null;
  accept: string | null;
  max_size_mb: number;
}

/** Elemento de GET /api/services/:id/requirements */
export interface ServiceRequirementLinkDto {
  sort_order: number;
  is_required: boolean;
  catalog: ServiceRequirementCatalogDto;
}
