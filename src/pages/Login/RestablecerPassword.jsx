import { useState, useEffect } from 'react';
import {
  Box, Button, TextField, Typography, Paper,
  Zoom, CircularProgress, Collapse, IconButton, InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import { ENDPOINTS } from '../../services/api';

const RestablecerPassword = () => {
  const { uid, token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmacion, setShowConfirmacion] = useState(false);
  const [error, setError] = useState('');
  const [mostrarError, setMostrarError] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);
  const [segundos, setSegundos] = useState(10);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMostrarError(false);

    if (!password.trim() || !confirmacion.trim()) {
      setError('Por favor complete todos los campos');
      setMostrarError(true);
      return;
    }

    if (password !== confirmacion) {
      setError('Las contraseñas no coinciden');
      setMostrarError(true);
      return;
    }

    setCargando(true);

    try {
      const response = await fetch(ENDPOINTS.SEGURIDAD.RESTABLECER_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid, token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const mensajeError =
          data.error ||
          data.password?.[0] ||
          data.non_field_errors?.[0] ||
          'No fue posible actualizar la contraseña';

        setError(mensajeError);
        setMostrarError(true);
        setCargando(false);
        return;
      }

      setExito(true);
    } catch (err) {
      setError('Error de conexión con el servidor');
      setMostrarError(true);
    } finally {
      setCargando(false);
    }
  };
    useEffect(() => {
    if (!exito) return;

    if (segundos === 0) {
      navigate('/login');
      return;
    }

    const temporizador = setTimeout(() => setSegundos(segundos - 1), 1000);
    return () => clearTimeout(temporizador);
  }, [exito, segundos, navigate]);

  const estiloCampo = {
    backgroundColor: 'white',
    borderRadius: 2,
    '& .MuiOutlinedInput-root': { borderRadius: 2 }
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
            {!exito ? (
              <>
                <Zoom in={true} style={{ transitionDelay: '300ms' }}>
                  <Box>
                    <Typography
                      variant="h4"
                      fontWeight="900"
                      sx={{ color: '#1E5631', letterSpacing: 1 }}
                    >
                      NUEVA CONTRASEÑA
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4A6B57', mt: 1.5 }}>
                      Cree una contraseña segura de al menos 8 caracteres que no sea
                      demasiado común ni completamente numérica.
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
                        Nueva Contraseña:
                      </Typography>
                      <TextField
                        fullWidth
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Ingrese su nueva contraseña"
                        disabled={cargando}
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => setShowPassword(!showPassword)}
                                  edge="end"
                                >
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                            sx: {
                              '& input::-ms-reveal, & input::-ms-clear': { display: 'none !important' }
                            }
                          },
                        }}
                        sx={estiloCampo}
                      />
                    </Box>
                  </Zoom>

                  <Zoom in={true} style={{ transitionDelay: '700ms' }}>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ mb: 1, color: 'black', fontWeight: 'bold' }}
                      >
                        Confirmar Contraseña:
                      </Typography>
                      <TextField
                        fullWidth
                        type={showConfirmacion ? 'text' : 'password'}
                        value={confirmacion}
                        onChange={(e) => setConfirmacion(e.target.value)}
                        placeholder="Repita su nueva contraseña"
                        disabled={cargando}
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => setShowConfirmacion(!showConfirmacion)}
                                  edge="end"
                                >
                                  {showConfirmacion ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                            sx: {
                              '& input::-ms-reveal, & input::-ms-clear': { display: 'none !important' }
                            }
                          },
                        }}
                        sx={estiloCampo}
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

                  <Zoom in={true} style={{ transitionDelay: '900ms' }}>
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
                      {cargando ? <CircularProgress size={24} color="inherit" /> : 'Guardar Contraseña'}
                    </Button>
                  </Zoom>
                </Box>
              </>
            ) : (
              /* ========== CONFIRMACIÓN DE CAMBIO ========== */
              <Zoom in={true} timeout={500}>
                <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box>
                    <CheckCircleOutlinedIcon sx={{ fontSize: 80, color: '#1E5631' }} />
                  </Box>

                  <Typography
                    variant="h5"
                    fontWeight="900"
                    sx={{ color: '#1E5631', letterSpacing: 1 }}
                  >
                    CONTRASEÑA ACTUALIZADA
                  </Typography>

                  <Box sx={{
                    backgroundColor: 'white',
                    p: 2.5,
                    borderRadius: 2,
                    border: '1px solid #C5DFD0'
                  }}>
                    <Typography variant="body2" sx={{ color: '#37474F' }}>
                      Su contraseña ha sido actualizada correctamente.
                      Ya puede iniciar sesión con sus nuevas credenciales.
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#78909C', display: 'block', mt: 1.5 }}>
                      Será redirigido al inicio de sesión en{' '}
                      <Box component="span" sx={{ color: '#1E5631', fontWeight: 'bold' }}>
                        {segundos}
                      </Box>
                      {segundos === 1 ? ' segundo' : ' segundos'}.
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
                    Ir al Inicio de Sesión
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

export default RestablecerPassword;