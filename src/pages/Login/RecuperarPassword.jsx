import { useState } from 'react';
import {
  Box, Button, TextField, Typography, Paper,
  Zoom, CircularProgress, Collapse, Link
} from '@mui/material';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { ENDPOINTS } from '../../services/api';

const RecuperarPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [mostrarError, setMostrarError] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMostrarError(false);

    if (!email.trim()) {
      setError('Por favor ingrese su correo electrónico');
      setMostrarError(true);
      return;
    }

    setCargando(true);

    try {
      const response = await fetch(ENDPOINTS.SEGURIDAD.RECUPERAR_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        const mensajeError =
          data.email?.[0] ||
          data.non_field_errors?.[0] ||
          'No fue posible procesar la solicitud';

        setError(mensajeError);
        setMostrarError(true);
        setCargando(false);
        return;
      }

      setEnviado(true);
    } catch (err) {
      setError('Error de conexión con el servidor');
      setMostrarError(true);
    } finally {
      setCargando(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#A3C9B8',
        p: 2
      }}
    >
      <Zoom in={true} timeout={600}>
        <Paper
          elevation={10}
          sx={{
            display: 'flex',
            width: { xs: '100%', sm: '900px' },
            minHeight: '550px',
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}
        >
          {/* ========== PANEL IZQUIERDO ========== */}
          <Box
            sx={{
              width: { xs: '0%', md: '50%' },
              backgroundColor: '#1E5631',
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="Logo Papelitos"
              sx={{
                width: 320,
                height: 'auto',
                transition: 'transform 0.5s ease',
                '&:hover': {
                  transform: 'scale(1.05) rotate(2deg)',
                }
              }}
            />
          </Box>

          {/* ========== PANEL DERECHO ========== */}
          <Box
            sx={{
              width: { xs: '100%', md: '50%' },
              backgroundColor: '#EAF4EC',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              p: { xs: 4, md: 6 },
              gap: 4
            }}
          >
            {!enviado ? (
              <>
                <Zoom in={true} style={{ transitionDelay: '300ms' }}>
                  <Box>
                    <Typography
                      variant="h4"
                      fontWeight="900"
                      sx={{ color: '#1E5631', letterSpacing: 1 }}
                    >
                      RECUPERAR ACCESO
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4A6B57', mt: 1.5 }}>
                      Ingrese el correo asociado a su cuenta y le enviaremos un enlace
                      para crear una nueva contraseña.
                    </Typography>
                  </Box>
                </Zoom>

                <Box
                  component="form"
                  onSubmit={handleSubmit}
                  sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
                >
                  <Zoom in={true} style={{ transitionDelay: '500ms' }}>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ mb: 1, color: 'black', fontWeight: 'bold' }}
                      >
                        Correo Electrónico:
                      </Typography>
                      <TextField
                        fullWidth
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ingrese su correo electrónico"
                        disabled={cargando}
                        sx={{
                          backgroundColor: 'white',
                          borderRadius: 2,
                          '& .MuiOutlinedInput-root': { borderRadius: 2 }
                        }}
                      />
                    </Box>
                  </Zoom>

                  <Collapse in={mostrarError}>
                    <Box sx={{
                      backgroundColor: '#ffebee',
                      color: '#d32f2f',
                      p: 1.5,
                      borderRadius: 2,
                      textAlign: 'center',
                      border: '1px solid #ffcdd2'
                    }}>
                      <Typography variant="caption" fontWeight="bold">{error}</Typography>
                    </Box>
                  </Collapse>

                  <Zoom in={true} style={{ transitionDelay: '700ms' }}>
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={cargando}
                      sx={{
                        backgroundColor: '#1E5631',
                        color: 'white',
                        py: 1.8,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(30, 86, 49, 0.3)',
                        '&:hover': {
                          backgroundColor: '#143D22',
                          transform: 'scale(1.02)'
                        }
                      }}
                    >
                      {cargando ? <CircularProgress size={24} color="inherit" /> : 'Enviar Enlace'}
                    </Button>
                  </Zoom>

                  <Zoom in={true} style={{ transitionDelay: '900ms' }}>
                    <Box sx={{ textAlign: 'center' }}>
                    <Typography
                        variant="body2"
                        onClick={() => navigate('/login')}
                        sx={{
                          color: '#1E5631',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        <ArrowBackIcon sx={{ fontSize: '1rem' }} />
                        Volver al inicio de sesión
                      </Typography>
                    </Box>
                  </Zoom>
                </Box>
              </>
            ) : (
              /* ========== CONFIRMACIÓN DE ENVÍO ========== */
              <Zoom in={true} timeout={500}>
                <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box>
                    <MarkEmailReadOutlinedIcon sx={{ fontSize: 80, color: '#1E5631' }} />
                  </Box>

                  <Typography
                    variant="h5"
                    fontWeight="900"
                    sx={{ color: '#1E5631', letterSpacing: 1 }}
                  >
                    REVISE SU CORREO
                  </Typography>

                  <Box sx={{
                    backgroundColor: 'white',
                    p: 2.5,
                    borderRadius: 2,
                    border: '1px solid #C5DFD0'
                  }}>
                    <Typography variant="body2" sx={{ color: '#37474F' }}>
                      Si el correo está registrado, recibirá un enlace de recuperación
                      en los próximos minutos.
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#78909C', display: 'block', mt: 1.5 }}>
                      El enlace es válido por 1 hora. Revise su bandeja de spam
                      si no lo encuentra.
                    </Typography>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/login')}
                    sx={{
                      backgroundColor: '#1E5631',
                      color: 'white',
                      py: 1.8,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 12px rgba(30, 86, 49, 0.3)',
                      '&:hover': {
                        backgroundColor: '#143D22',
                        transform: 'scale(1.02)'
                      }
                    }}
                  >
                    Volver al Inicio de Sesión
                  </Button>
                </Box>
              </Zoom>
            )}
          </Box>
        </Paper>
      </Zoom>
    </Box>
  );
};

export default RecuperarPassword;