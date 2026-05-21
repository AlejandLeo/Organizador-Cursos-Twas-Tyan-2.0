import axios from 'axios';

import { useUIStore } from '@/stores/ui';

export const getBaseUrl = () => {
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
  if (isLocal) {
    return import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }
  return window.location.origin;
};

const api = axios.create({
  baseURL: getBaseUrl(),
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
  if (nombreArchivo.startsWith('http')) return nombreArchivo;

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
