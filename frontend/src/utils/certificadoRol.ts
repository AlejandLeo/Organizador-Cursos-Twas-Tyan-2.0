/**
 * El certificado se muestra en el portal del rol al que pertenece.
 * Un estudiante no ve el certificado de ponente de su misma clase.
 * 1 Asistente y 4 Aprobación → estudiante
 * 2 Expositor → ponente
 * 3 Logística → logística
 */
export function certificadoDelPortal(tipo: number | null | undefined, path: string): boolean {
  const t = Number(tipo);
  if (path.startsWith('/estudiante')) return t === 1 || t === 4 || !tipo;
  if (path.startsWith('/ponente')) return t === 2;
  if (path.startsWith('/logistica')) return t === 3;
  return true;
}
