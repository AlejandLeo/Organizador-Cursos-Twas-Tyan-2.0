import axios from 'axios';

import { useUIStore } from '@/stores/ui';
import { SIN_IMAGEN } from '@/utils/imageFallback';

export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envUrl) return envUrl.replace(/\/$/, '');
  // En `vite` el origen es el puerto del frontend (5173). Sin VITE_API_URL
  // las llamadas caían ahí y el home interpretaba el HTML como “sin eventos”.
  if (import.meta.env.DEV) return 'http://localhost:3000';
  if (typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:3000';
};

// Mantener por compatibilidad si es requerido por algún módulo
export const getBaseUrl = getApiBaseUrl;

/**
 * Normaliza URLs de medios devueltas por el API.
 * Corrige rutas con localhost y rutas relativas /uploads/... en producción HTTPS.
 */
export const resolveMediaUrl = (url: string | null | undefined, fallback = ''): string => {
  if (!url) return fallback;

  const base = getApiBaseUrl();

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);
      const isLocal =
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        parsed.hostname.endsWith('.local');
      if (isLocal && parsed.pathname.startsWith('/uploads/')) {
        return `${base}${parsed.pathname}${parsed.search}`;
      }
      return url;
    } catch {
      return url;
    }
  }

  if (url.startsWith('/uploads/')) {
    return `${base}${url}`;
  }

  return url || fallback || SIN_IMAGEN;
};

const urlGuardada = (valor: string | null | undefined, carpeta: string) => {
  if (!valor) return '';
  return getImageUrl(carpeta, valor, '');
};

/** Imagen del evento: el fondo guardado y, si no hay, el logo. */
export const imagenEvento = (evento: any): string => {
  if (!evento) return SIN_IMAGEN;
  return urlGuardada(evento.imagen_fondo, 'fondos')
    || urlGuardada(evento.logo, 'logo')
    || SIN_IMAGEN;
};

/** Imagen de la actividad y, si no tiene, la del evento al que pertenece. */
export const imagenActividad = (actividad: any): string => {
  if (!actividad) return SIN_IMAGEN;
  const propia = urlGuardada(actividad.imagen, 'cursos');
  if (propia) return propia;
  return imagenEvento(actividad.evento);
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores globales (como caídas del servidor)
api.interceptors.response.use(
  (response) => {
    // Si la respuesta llega bien, aseguramos que el estado sea online
    try {
      const ui = useUIStore();
      if (!ui.isServerOnline) ui.setServerStatus(true);
    } catch (e) { }
    return response;
  },
  (error) => {
    // Si no hay respuesta del servidor (ERR_CONNECTION_REFUSED, etc)
    if (!error.response || error.code === 'ERR_NETWORK') {
      try {
        useUIStore().setServerStatus(false);
      } catch (e) { }
    }
    return Promise.reject(error);
  }
);

/**
 * Construye la URL completa para una imagen almacenada en el servidor.
 * @param carpeta Nombre de la subcarpeta en /uploads (ej: 'eventos', 'cursos', 'perfiles')
 * @param nombreArchivo Nombre del archivo guardado en la BD
 * @param fallback URL opcional si no hay imagen
 */
export const getImageUrl = (carpeta: string, nombreArchivo: string, fallback = '') => {
  if (!nombreArchivo) return fallback;

  const uploadsAt = nombreArchivo.indexOf('/uploads/');
  if (nombreArchivo.startsWith('http') || uploadsAt >= 0) {
    const path = uploadsAt > 0 && !nombreArchivo.startsWith('http')
      ? nombreArchivo.slice(uploadsAt)
      : nombreArchivo;
    return resolveMediaUrl(path, fallback);
  }

  const baseUrl = api.defaults.baseURL || window.location.origin;
  let cleanName = nombreArchivo;
  try {
    cleanName = decodeURIComponent(decodeURIComponent(nombreArchivo));
  } catch (e) {
    try {
      cleanName = decodeURIComponent(nombreArchivo);
    } catch (e2) { }
  }
  if (cleanName.includes('/')) {
    cleanName = cleanName.split('/').pop() || cleanName;
  }
  return `${baseUrl}/uploads/${carpeta}/${encodeURIComponent(cleanName)}`;
};

export default api;
