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

const ControlInactividad = ({ children }) => {
  const navigate = useNavigate();

  // Colores institucionales de Librería Papelitos
  const verdePapelitos = '#1E5631';
  const verdeOscuro = '#0D472E';

  // Configuración de tiempos:
  // 14 minutos inactivo -> Salta el modal (14 * 60 * 1000 = 840,000 ms)
  // 60 segundos de gracia dentro del modal (Total = 15 min)
  const TIEMPO_PREVIO_AVISO = 14 * 60 * 1000;
  const SEGUNDOS_GRACIA = 60;

  const [modalAbierto, setModalAbierto] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(SEGUNDOS_GRACIA);

  const timeoutInactividadRef = useRef(null);

  // 1. Cierre total de sesión y expulsión limpia
  const ejecutarCierreSesion = useCallback(() => {
    if (timeoutInactividadRef.current) clearTimeout(timeoutInactividadRef.current);
    setModalAbierto(false);
    localStorage.removeItem('token');
    localStorage.removeItem('ultima_actividad');

    navigate('/login', {
      replace: true,
      state: { sesionExpirada: 'Su sesión ha caducado por inactividad. Inicie sesión nuevamente.' }
    });
  }, [navigate]);

  // 2. Reiniciar el temporizador de inactividad de 14 minutos
  const reiniciarInactividad = useCallback(() => {
    if (timeoutInactividadRef.current) clearTimeout(timeoutInactividadRef.current);

    const token = localStorage.getItem('token');
    if (!token) return;

    timeoutInactividadRef.current = setTimeout(() => {
      setSegundosRestantes(SEGUNDOS_GRACIA);
      setModalAbierto(true);
    }, TIEMPO_PREVIO_AVISO);
  }, [TIEMPO_PREVIO_AVISO]);

  // 3. Botón "Continuar en el sistema": restablece todo y cierra el modal
  const handleContinuarSesion = () => {
    setModalAbierto(false);
    setSegundosRestantes(SEGUNDOS_GRACIA);
    reiniciarInactividad();
  };

  // 4. Temporizador activo del modal (Cuenta regresiva fluida 60 -> 0)
  useEffect(() => {
    let intervalo = null;

    if (modalAbierto) {
      intervalo = setInterval(() => {
        setSegundosRestantes((prev) => {
          if (prev <= 1) {
            clearInterval(intervalo);
            ejecutarCierreSesion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [modalAbierto, ejecutarCierreSesion]);

  // 5. Escucha de eventos de usuario mientras el modal NO esté abierto
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || modalAbierto) return;

    const eventos = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'wheel'];

    const manejarActividad = () => {
      reiniciarInactividad();
    };

    eventos.forEach((evento) => {
      window.addEventListener(evento, manejarActividad, { passive: true });
    });

    reiniciarInactividad();

    return () => {
      if (timeoutInactividadRef.current) clearTimeout(timeoutInactividadRef.current);
      eventos.forEach((evento) => {
        window.removeEventListener(evento, manejarActividad);
      });
    };
  }, [modalAbierto, reiniciarInactividad]);

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