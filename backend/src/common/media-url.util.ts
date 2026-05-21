/**
 * Construye la URL pública de un archivo en /uploads.
 * Si BACKEND_URL o APP_URL están definidos, devuelve URL absoluta.
 * Si no, devuelve ruta relativa (/uploads/...) para que el frontend la resuelva según el dominio actual.
 */
export function formatMediaUrl(
  filenameOrUrl: string | null | undefined,
  folder: string,
): string | null {
  if (!filenameOrUrl) return null;

  const backendBase = (process.env.BACKEND_URL || process.env.APP_URL || '').replace(
    /\/$/,
    '',
  );

  const toAbsolute = (path: string) => (backendBase ? `${backendBase}${path}` : path);

  // URL absoluta existente (p. ej. datos antiguos con localhost)
  if (filenameOrUrl.startsWith('http://') || filenameOrUrl.startsWith('https://')) {
    try {
      const u = new URL(filenameOrUrl);
      if (u.pathname.startsWith('/uploads/')) {
        return toAbsolute(u.pathname);
      }
    } catch {
      /* mantener URL original */
    }
    return filenameOrUrl;
  }

  if (filenameOrUrl.startsWith('/uploads/')) {
    return toAbsolute(filenameOrUrl);
  }

  let cleanFilename = filenameOrUrl;
  try {
    cleanFilename = decodeURIComponent(filenameOrUrl);
  } catch {
    /* usar valor original */
  }

  return toAbsolute(`/uploads/${folder}/${encodeURIComponent(cleanFilename)}`);
}
