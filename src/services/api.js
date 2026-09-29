// 1. Limpiamos la URL que viene de las variables de entorno (quitamos la barra final si existe)
const RAW_URL = import.meta.env.VITE_API_URL || "";
const DOMAIN_URL = RAW_URL.endsWith("/") ? RAW_URL.slice(0, -1) : RAW_URL;

// 2. Validación inteligente: solo agregamos '/api' si la URL no lo tiene ya
const BASE_URL = DOMAIN_URL.endsWith("/api") ? DOMAIN_URL : `${DOMAIN_URL}/api`;

export const ENDPOINTS = {
  // Módulo de Inventario
  INVENTARIO: {
    CATEGORIAS: `${BASE_URL}/categorias/`,
    PRODUCTOS: `${BASE_URL}/productos/`,
    MOVIMIENTOS: `${BASE_URL}/movimientos/`,
    PROCESAR_MOVIMIENTO: `${BASE_URL}/movimientos/procesar/`, // Barra diagonal añadida aquí
  },

  // Módulo de Seguridad
  SEGURIDAD: {
    LOGIN: `${BASE_URL}/login/`,
    RECUPERAR_PASSWORD: `${BASE_URL}/recuperar-password/`,
    RESTABLECER_PASSWORD: `${BASE_URL}/restablecer-password/`,
    BITACORA_BLOQUEO: `${BASE_URL}/bitacora-bloqueo/`,
  },
  
  // Módulo de Usuarios
  USUARIOS: `${BASE_URL}/usuarios/`,

  // Módulo de Alertas
  ALERTAS: {
    DESTINATARIOS: `${BASE_URL}/destinatarios/`,
    HISTORIAL: `${BASE_URL}/historial-alertas/`,
  }
}