// 1. Obtenemos la URL y eliminamos la barra final si existe para evitar duplicados (//)
const RAW_URL = import.meta.env.VITE_API_URL || "";
const BASE_URL = RAW_URL.endsWith("/") ? RAW_URL.slice(0, -1) : RAW_URL;

export const ENDPOINTS = {
  // Módulo de Inventario
  INVENTARIO: {
    CATEGORIAS: `${BASE_URL}/categorias/`,
    PRODUCTOS: `${BASE_URL}/productos/`,
    PROCESAR_MOVIMIENTO: `${BASE_URL}/movimientos/procesar/`,
  },

  // Módulo de Seguridad
  SEGURIDAD: {
    LOGIN: `${BASE_URL}/login/`,
    RECUPERAR_PASSWORD: `${BASE_URL}/recuperar-password/`,
    RESTABLECER_PASSWORD: `${BASE_URL}/restablecer-password/`,
  },
  
  // Módulo de Usuarios
  USUARIOS: `${BASE_URL}/usuarios/`,

  // Módulo de Alertas
  ALERTAS: {
    DESTINATARIOS: `${BASE_URL}/destinatarios/`,
    HISTORIAL: `${BASE_URL}/historial-alertas/`,
  }
}