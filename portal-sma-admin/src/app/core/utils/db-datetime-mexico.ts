/**
 * Fechas desde Supabase / Postgres suelen venir en ISO 8601 (UTC, p. ej. `...Z`).
 * Para mostrarlas siempre en horario de México, usa `timeZone` de `Intl` en lugar del
 * huso del navegador.
 *
 * Zona IANA del centro de México (la más usada en negocio). Sonora y Baja usan otras;
 * si lo necesitas, parametriza o añade constantes (`America/Hermosillo`, etc.).
 */
export const MEXICO_CITY_IANA = 'America/Mexico_City' as const;

const DEFAULT_DATETIME_OPTS: Intl.DateTimeFormatOptions = {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: MEXICO_CITY_IANA,
};

/**
 * Fecha y hora legibles en español (México), siempre en `America/Mexico_City`.
 */
export function formatDbDateTimeMexico(
  iso: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (iso == null || String(iso).trim() === '') {
    return '—';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }
  /**
   * No mezclar `dateStyle`/`timeStyle` en `toLocaleDateString` en Chromium (RangeError).
   * `toLocaleString` sí soporta ambos.
   */
  const opts: Intl.DateTimeFormatOptions = {
    ...DEFAULT_DATETIME_OPTS,
    ...options,
    timeZone: options?.timeZone ?? MEXICO_CITY_IANA,
  };
  return d.toLocaleString('es-MX', opts);
}

/**
 * Solo fecha (sin hora), calendario en México.
 */
export function formatDbDateMexico(iso: string | null | undefined): string {
  if (iso == null || String(iso).trim() === '') {
    return '—';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }
  return d.toLocaleString('es-MX', {
    dateStyle: 'short',
    timeZone: MEXICO_CITY_IANA,
  });
}

/**
 * Instante absoluto desde el ISO de la BD (para ordenar por tiempo real UTC).
 */
export function parseDbInstant(iso: string | null | undefined): Date | null {
  if (iso == null || String(iso).trim() === '') {
    return null;
  }
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function dbInstantToSortTimestamp(iso: string | null | undefined): number {
  if (iso == null || String(iso).trim() === '') {
    return Number.NEGATIVE_INFINITY;
  }
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
}

/**
 * `Date` cuyo **año/mes/día en el calendario local del navegador** coinciden con el
 * día civil en México para ese instante UTC. Sirve para que filtros tipo “solo fecha”
 * de PrimeNG se alineen mejor con lo que el usuario ve en pantalla (México), aunque el
 * usuario no esté físicamente en México.
 */
export function dateForMexicoCalendarFilter(
  iso: string | null | undefined
): Date | null {
  const d = parseDbInstant(iso);
  if (!d) {
    return null;
  }
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: MEXICO_CITY_IANA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(d);
  const y = Number(parts.find((p) => p.type === 'year')?.value);
  const m = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);
  if (!y || !m || !day) {
    return null;
  }
  /** Mediodía local evita saltos raros al comparar solo fechas. */
  return new Date(y, m - 1, day, 12, 0, 0, 0);
}
