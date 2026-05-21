import axios from 'axios';

import { useUIStore } from '@/stores/ui';

export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envUrl) return envUrl.replace(/\/$/, '');
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

  const defaultFallback =
    'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=1600&q=80';

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

  return url || fallback || defaultFallback;
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
  if (nombreArchivo.startsWith('http') || nombreArchivo.startsWith('/uploads/')) {
    return resolveMediaUrl(nombreArchivo, fallback);
  }

  const baseUrl = api.defaults.baseURL || window.location.origin;
  // Decodificamos varias veces por si viene con doble codificación desde el backend (ej: %2520 -> %20 -> " ")
  let cleanName = nombreArchivo;
  try {
    cleanName = decodeURIComponent(decodeURIComponent(nombreArchivo));
  } catch (e) {
    try {
      cleanName = decodeURIComponent(nombreArchivo);
    } catch (e2) { }
  }
  return `${baseUrl}/uploads/${carpeta}/${cleanName}`;
};

export default api;
