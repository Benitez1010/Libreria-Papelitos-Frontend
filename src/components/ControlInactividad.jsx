import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  CircularProgress
} from '@mui/material';

// Configuración de tiempos:
// 14 minutos inactivo -> Salta el modal
// 60 segundos de gracia dentro del modal (Total = 15 min)
const TIEMPO_PREVIO_AVISO = 14 * 60 * 1000;
const SEGUNDOS_GRACIA = 60;
const TIEMPO_TOTAL = TIEMPO_PREVIO_AVISO + SEGUNDOS_GRACIA * 1000;

const ControlInactividad = ({ children }) => {
  const navigate = useNavigate();

  // Colores institucionales de Librería Papelitos
  const verdePapelitos = '#1E5631';
  const verdeOscuro = '#0D472E';

  const [modalAbierto, setModalAbierto] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(SEGUNDOS_GRACIA);

  const modalAbiertoRef = useRef(false);
  const ultimoRegistroRef = useRef(0);
  const cerrandoRef = useRef(false);

  // 1. Cierre total de sesión y expulsión limpia
  const ejecutarCierreSesion = useCallback(() => {
    if (cerrandoRef.current) return;
    cerrandoRef.current = true;

    modalAbiertoRef.current = false;
    setModalAbierto(false);
    localStorage.removeItem('token');
    localStorage.removeItem('ultima_actividad');

    navigate('/login', {
      replace: true,
      state: { sesionExpirada: 'Su sesión ha caducado por inactividad. Inicie sesión nuevamente.' }
    });
  }, [navigate]);

  // 2. Guarda la hora de la última actividad (máx. 1 vez por segundo).
  //    Mientras el modal está abierto la actividad se ignora: solo "Continuar" reinicia.
  const registrarActividad = useCallback(() => {
    if (modalAbiertoRef.current) return;
    const ahora = Date.now();
    if (ahora - ultimoRegistroRef.current < 1000) return;
    ultimoRegistroRef.current = ahora;
    localStorage.setItem('ultima_actividad', String(ahora));
  }, []);

  // 3. Calcula la inactividad con la HORA REAL (no con contadores de setTimeout/setInterval,
  //    que el navegador frena cuando la pestaña está en segundo plano o el equipo se suspende).
  const evaluarInactividad = useCallback(() => {
    if (!localStorage.getItem('token')) return;

    const ultima = Number(localStorage.getItem('ultima_actividad')) || Date.now();
    const inactivo = Date.now() - ultima;

    if (inactivo >= TIEMPO_TOTAL) {
      ejecutarCierreSesion();
      return;
    }

    if (inactivo >= TIEMPO_PREVIO_AVISO) {
      modalAbiertoRef.current = true;
      setModalAbierto(true);
      setSegundosRestantes(Math.max(0, Math.ceil((TIEMPO_TOTAL - inactivo) / 1000)));
    } else {
      modalAbiertoRef.current = false;
      setModalAbierto(false);
      setSegundosRestantes(SEGUNDOS_GRACIA);
    }
  }, [ejecutarCierreSesion]);

  // 4. Botón "Continuar en el sistema": restablece todo y cierra el modal
  const handleContinuarSesion = () => {
    modalAbiertoRef.current = false;
    ultimoRegistroRef.current = 0;
    localStorage.setItem('ultima_actividad', String(Date.now()));
    setModalAbierto(false);
    setSegundosRestantes(SEGUNDOS_GRACIA);
  };

  // 5. Eventos de usuario + revisión cada segundo + revisión inmediata al volver a la pestaña
  useEffect(() => {
    if (!localStorage.getItem('token')) return;

    // Al montar (inicio de sesión o recarga) la cuenta empieza desde cero
    cerrandoRef.current = false;
    ultimoRegistroRef.current = 0;
    localStorage.setItem('ultima_actividad', String(Date.now()));

    const eventos = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'wheel'];
    eventos.forEach((evento) => {
      window.addEventListener(evento, registrarActividad, { passive: true });
    });

    const intervalo = setInterval(evaluarInactividad, 1000);

    // Al regresar a la pestaña, o al despertar el equipo, se recalcula al instante
    const alVolver = () => {
      if (document.visibilityState === 'visible') evaluarInactividad();
    };
    document.addEventListener('visibilitychange', alVolver);
    window.addEventListener('focus', evaluarInactividad);
    window.addEventListener('pageshow', evaluarInactividad);

    return () => {
      clearInterval(intervalo);
      eventos.forEach((evento) => {
        window.removeEventListener(evento, registrarActividad);
      });
      document.removeEventListener('visibilitychange', alVolver);
      window.removeEventListener('focus', evaluarInactividad);
      window.removeEventListener('pageshow', evaluarInactividad);
    };
  }, [registrarActividad, evaluarInactividad]);

  // Progreso visual del anillo circular
  const porcentajeProgreso = ((SEGUNDOS_GRACIA - segundosRestantes) / SEGUNDOS_GRACIA) * 100;

  return (
    <>
      {children}

      <Dialog
        open={modalAbierto}
        disableEscapeKeyDown
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 2.5,
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            textAlign: 'center'
          }
        }}
      >
        <DialogTitle sx={{ p: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              bgcolor: '#EAF4EC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: verdePapelitos
            }}
          >
            {/* Ícono de seguridad integrado */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
          </Box>
          <Typography variant="h6" fontWeight="bold" sx={{ color: verdeOscuro }}>
            Cierre de Sesión por Inactividad
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ px: 2, py: 1, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#555', mb: 3 }}>
            Has permanecido inactivo. La sesión se cerrará automáticamente en:
          </Typography>

          {/* CONTENEDOR FLEX CENTRADO AL 100% */}
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', my: 1 }}>
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress
                variant="determinate"
                value={100}
                size={120}
                thickness={4.5}
                sx={{ color: '#f0f0f0' }}
              />
              <CircularProgress
                variant="determinate"
                value={100 - porcentajeProgreso}
                size={120}
                thickness={4.5}
                sx={{
                  color: segundosRestantes <= 15 ? '#d32f2f' : verdePapelitos,
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  transition: 'all 0.3s ease'
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography
                  variant="h3"
                  fontWeight="bold"
                  sx={{
                    color: segundosRestantes <= 15 ? '#d32f2f' : '#222',
                    fontSize: '2.4rem'
                  }}
                >
                  {segundosRestantes}s
                </Typography>
              </Box>
            </Box>
          </Box>

          <Typography variant="caption" sx={{ display: 'block', color: '#777', mt: 2.5 }}>
            ¿Deseas continuar trabajando en el sistema de Librería Papelitos?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 1, flexDirection: 'column', gap: 1 }}>
          <Button
            onClick={handleContinuarSesion}
            variant="contained"
            fullWidth
            sx={{
              bgcolor: verdePapelitos,
              '&:hover': { bgcolor: verdeOscuro },
              py: 1.2,
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 'bold',
              fontSize: '0.95rem',
              boxShadow: 'none'
            }}
          >
            Continuar en el sistema
          </Button>

          <Button
            onClick={ejecutarCierreSesion}
            variant="text"
            fullWidth
            sx={{
              color: '#666',
              '&:hover': { color: '#d32f2f', bgcolor: 'transparent' },
              textTransform: 'none',
              fontSize: '0.85rem'
            }}
          >
            Cerrar sesión ahora
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ControlInactividad;