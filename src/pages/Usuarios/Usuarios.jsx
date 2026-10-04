import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow,TablePagination, Button, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Chip, Snackbar, Alert,
  CircularProgress, TextField, Grid, MenuItem, FormControl,
  InputLabel, Select, FormHelperText, TableSortLabel, Tooltip
} from '@mui/material';
import { PersonAdd, Visibility, VisibilityOff } from '@mui/icons-material';
import GroupIcon from '@mui/icons-material/Group';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import { IconButton, InputAdornment } from '@mui/material';
import { ENDPOINTS } from '../../services/api';

const ROLES = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'BODEGA', label: 'Operador de Bodega' },
  { value: 'CAJA', label: 'Operador de Caja' },
];

const COLUMNAS = [
  { id: 'username', label: 'Usuario', minWidth: 150 },
  { id: 'nombre_completo', label: 'Nombre Completo', minWidth: 180 },
  { id: 'email', label: 'Correo Electrónico', minWidth: 220 },
  { id: 'rol_display', label: 'Rol', minWidth: 160 },
  { id: 'estado', label: 'Estado', minWidth: 110 },
  { id: 'date_joined', label: 'Fecha de Registro', minWidth: 150 },
];

const Usuarios = () => {
  const verdePapelitos = '#1E5631';

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [accion, setAccion] = useState('');
  const [snackbar, setSnackbar] = useState({ abierto: false, mensaje: '', tipo: 'success' });

  
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);
  const [formData, setFormData] = useState({
    nombre_completo: '',
    username: '',
    email: '',
    password: '',
    rol: 'BODEGA'
  });
  const [errores, setErrores] = useState({});
  const [cargandoRegistro, setCargandoRegistro] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estado para saber si el usuario actual es admin
  const [usuarioActual, setUsuarioActual] = useState(null);

  // Estados para la edición de datos personales
  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formEdicion, setFormEdicion] = useState({ username: '', nombre_completo: '', email: '' });
  const [erroresEdicion, setErroresEdicion] = useState({});
  const [cargandoEdicion, setCargandoEdicion] = useState(false);

  //para busqueda
  const [busqueda, setBusqueda] = useState('');

  //para ordenamiento por columna
  const [ordenPor, setOrdenPor] = useState('username');
  const [ordenDireccion, setOrdenDireccion] = useState('asc');

  //para paginacion
  const [pagina, setPagina] = useState(0);
  const [filasPorPagina, setFilasPorPagina] = useState(25);

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  // Obtener usuario actual para saber si es admin
  useEffect(() => {
    const obtenerUsuarioActual = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`${ENDPOINTS.SEGURIDAD.LOGIN.replace('/login/', '')}/me/`, {
          headers: { 'Authorization': `Token ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUsuarioActual(data);
        }
      } catch (error) {
        console.error('Error al obtener usuario actual:', error);
      }
    };
    obtenerUsuarioActual();
  }, []);

  const obtenerUsuarios = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${ENDPOINTS.SEGURIDAD.LOGIN.replace('/login/', '')}/usuarios/`, {
        headers: { 'Authorization': `Token ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      } else {
        setSnackbar({ abierto: true, mensaje: 'Error al cargar usuarios', tipo: 'error' });
      }
    } catch (error) {
      setSnackbar({ abierto: true, mensaje: 'Error de conexión', tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  const abrirModal = (usuario, tipoAccion) => {
    setUsuarioSeleccionado(usuario);
    setAccion(tipoAccion);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setUsuarioSeleccionado(null);
    setAccion('');
  };

  const ejecutarAccion = async () => {
    if (!usuarioSeleccionado || !accion) return;
    const token = localStorage.getItem('token');
    const endpoint = accion === 'desactivar' ? 'desactivar' : 'reactivar';
    try {
      const response = await fetch(
        `${ENDPOINTS.SEGURIDAD.LOGIN.replace('/login/', '')}/usuarios/${usuarioSeleccionado.id}/${endpoint}/`,
        {
          method: 'POST',
          headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setSnackbar({ abierto: true, mensaje: data.mensaje, tipo: 'success' });
        obtenerUsuarios();
      } else {
        setSnackbar({ abierto: true, mensaje: data.error || `Error al ${accion} usuario`, tipo: 'error' });
      }
    } catch (error) {
      setSnackbar({ abierto: true, mensaje: 'Error de conexión', tipo: 'error' });
    } finally {
      cerrarModal();
    }
  };

  const cerrarSnackbar = () => {
    setSnackbar({ ...snackbar, abierto: false });
  };

  const getColorRol = (rol) => rol === 'ADMIN' ? 'primary' : 'default';
  const getColorEstado = (isActive) => isActive ? 'success' : 'error';

  // ========== FUNCIONES DE REGISTRO ==========
  const abrirModalRegistro = () => {
    setFormData({ nombre_completo: '', username: '', email: '', password: '', rol: 'BODEGA' });
    setErrores({});
    setModalRegistroAbierto(true);
  };

  const cerrarModalRegistro = () => {
    setModalRegistroAbierto(false);
    setErrores({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errores[name]) {
      setErrores({ ...errores, [name]: '' });
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

    const evaluarFortaleza = (password) => {
    let puntos = 0;
    if (password.length >= 8) puntos += 1;
    if (password.length >= 12) puntos += 1;
    if (/[A-Z]/.test(password)) puntos += 1;
    if (/[0-9]/.test(password)) puntos += 1;
    if (/[^A-Za-z0-9]/.test(password)) puntos += 1;
    
    if (puntos <= 2) return { nivel: 'Débil', color: '#d32f2f', ancho: 33 };
    if (puntos <= 4) return { nivel: 'Media', color: '#f9a825', ancho: 66 };
    return { nivel: 'Fuerte', color: '#2e7d32', ancho: 100 };
  };

  const obtenerValorOrden = (usuario, columna) => {
    if (columna === 'estado') return usuario.is_active ? 'Activo' : 'Inactivo';
    if (columna === 'rol_display') return usuario.rol_display || usuario.rol || '';
    if (columna === 'date_joined') return usuario.date_joined || '';
    return usuario[columna] || '';
  };

  const handleOrdenar = (columna) => {
    const esDescendente = ordenPor === columna && ordenDireccion === 'asc';
    setOrdenDireccion(esDescendente ? 'desc' : 'asc');
    setOrdenPor(columna);
    setPagina(0);
  };

    const usuariosFiltrados = usuarios.filter((usuario) => {
    const termino = busqueda.toLowerCase();
    return (
      (usuario.username || '').toLowerCase().includes(termino) ||
      (usuario.nombre_completo || '').toLowerCase().includes(termino) ||
      (usuario.email || '').toLowerCase().includes(termino) ||
      (usuario.rol_display || '').toLowerCase().includes(termino)
    );
  }).sort((a, b) => {
    const valorA = obtenerValorOrden(a, ordenPor);
    const valorB = obtenerValorOrden(b, ordenPor);
    const comparacion = ordenPor === 'date_joined'
      ? new Date(valorA) - new Date(valorB)
      : String(valorA).localeCompare(String(valorB), 'es', { sensitivity: 'base' });
    return ordenDireccion === 'asc' ? comparacion : -comparacion;
  });

    const handleChangePage = (event, newPage) => {
    setPagina(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setFilasPorPagina(parseInt(event.target.value, 10));
    setPagina(0);
  };
  const validarFormulario = () => {
    const nuevosErrores = {};
    if (!formData.nombre_completo.trim()) nuevosErrores.nombre_completo = 'El nombre completo es obligatorio';
    if (!formData.username.trim()) nuevosErrores.username = 'El nombre de usuario es obligatorio';
    if (!formData.email.trim()) nuevosErrores.email = 'El correo electrónico es obligatorio';
    if (!formData.password) nuevosErrores.password = 'La contraseña es obligatoria';
    else if (formData.password.length < 8) nuevosErrores.password = 'La contraseña debe tener al menos 8 caracteres';
    
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const registrarUsuario = async () => {
    if (!validarFormulario()) return;

    setCargandoRegistro(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `${ENDPOINTS.SEGURIDAD.LOGIN.replace('/login/', '')}/usuarios/registrar/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSnackbar({ abierto: true, mensaje: 'Usuario creado con éxito.', tipo: 'success' });
        cerrarModalRegistro();
        obtenerUsuarios();
      } else {
        const mensajeError = data.username?.[0] || data.email?.[0] || data.nombre_completo?.[0] || data.password?.[0] || 'Error al crear usuario';
        setSnackbar({ abierto: true, mensaje: mensajeError, tipo: 'error' });
      }
    } catch (error) {
      setSnackbar({ abierto: true, mensaje: 'Error de conexión', tipo: 'error' });
    } finally {
      setCargandoRegistro(false);
    }
  };

  // ========== FUNCIONES DE EDICIÓN ==========
  const abrirModalEdicion = (usuario) => {
    setUsuarioEditando(usuario);
    setFormEdicion({
      username: usuario.username || '',
      nombre_completo: usuario.nombre_completo || '',
      email: usuario.email || ''
    });
    setErroresEdicion({});
    setModalEdicionAbierto(true);
  };

  const cerrarModalEdicion = () => {
    setModalEdicionAbierto(false);
    setUsuarioEditando(null);
    setErroresEdicion({});
  };

  const handleChangeEdicion = (e) => {
    const { name, value } = e.target;
    setFormEdicion({ ...formEdicion, [name]: value });
    if (erroresEdicion[name]) {
      setErroresEdicion({ ...erroresEdicion, [name]: '' });
    }
  };

  const validarFormularioEdicion = () => {
    const nuevosErrores = {};
    if (!formEdicion.username.trim()) nuevosErrores.username = 'El nombre de usuario es obligatorio';
    if (!formEdicion.nombre_completo.trim()) nuevosErrores.nombre_completo = 'El nombre completo es obligatorio';
    if (!formEdicion.email.trim()) nuevosErrores.email = 'El correo electrónico es obligatorio';

    setErroresEdicion(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const guardarEdicion = async () => {
    if (!validarFormularioEdicion()) return;

    setCargandoEdicion(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `${ENDPOINTS.USUARIOS}${usuarioEditando.id}/editar/`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formEdicion),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSnackbar({ abierto: true, mensaje: data.mensaje, tipo: 'success' });
        cerrarModalEdicion();
        obtenerUsuarios();
      } else {
        const mensajeError = data.username?.[0] || data.email?.[0] || data.nombre_completo?.[0] || data.error || 'Error al actualizar usuario';
        setSnackbar({ abierto: true, mensaje: mensajeError, tipo: 'error' });
      }
    } catch (error) {
      setSnackbar({ abierto: true, mensaje: 'Error de conexión', tipo: 'error' });
    } finally {
      setCargandoEdicion(false);
    }
  };

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: verdePapelitos }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <GroupIcon sx={{ fontSize: 40, color: verdePapelitos }} />
          <Typography variant="h4" fontWeight="bold">
            Gestión de Usuarios
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Buscar por usuario, nombre, correo o rol"
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(0); }}
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: verdePapelitos }} />
                  </InputAdornment>
                )
              }
            }}
            sx={{
              backgroundColor: 'white',
              '& .MuiOutlinedInput-root': { borderRadius: '8px' },
              width: { xs: '100%', sm: '340px' }
            }}
          />
          {usuarioActual?.rol === 'ADMIN' && (
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={abrirModalRegistro}
              sx={{
                backgroundColor: verdePapelitos,
                textTransform: 'none',
                borderRadius: '8px',
                '&:hover': { backgroundColor: '#143D22' }
              }}
            >
              Nuevo Usuario
            </Button>
          )}
        </Box>
      </Box>
      

      <Paper elevation={3} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: verdePapelitos }}>
              <TableRow>
                {COLUMNAS.map((columna) => (
                  <TableCell
                    key={columna.id}
                    sortDirection={ordenPor === columna.id ? ordenDireccion : false}
                    sx={{ color: 'white', fontWeight: 'bold', minWidth: columna.minWidth }}
                  >
                    <TableSortLabel
                      active={ordenPor === columna.id}
                      direction={ordenPor === columna.id ? ordenDireccion : 'asc'}
                      onClick={() => handleOrdenar(columna.id)}
                      sx={{
                        color: 'white',
                        '&:hover': { color: '#d7e8dc' },
                        '&.Mui-active': { color: 'white' },
                        '& .MuiTableSortLabel-icon': { color: 'white !important' }
                      }}
                    >
                      {columna.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuariosFiltrados.length > 0 ? (
                usuariosFiltrados
                  .slice(pagina * filasPorPagina, pagina * filasPorPagina + filasPorPagina)
                  .map((usuario) => (
                  <TableRow key={usuario.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{usuario.username}</TableCell>
                    <TableCell>{usuario.nombre_completo || '—'}</TableCell>
                    <TableCell>{usuario.email || '—'}</TableCell>
                    <TableCell>
                      <Chip label={usuario.rol_display || usuario.rol} color={getColorRol(usuario.rol)} size="small" sx={{ fontWeight: 500 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={usuario.estado || (usuario.is_active ? 'Activo' : 'Inactivo')} color={getColorEstado(usuario.is_active)} size="small" sx={{ fontWeight: 500 }} />
                    </TableCell>
                    <TableCell>{new Date(usuario.date_joined).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</TableCell>
                    <TableCell align="center">
                      {usuarioActual?.rol === 'ADMIN' && (
                        <Tooltip title="Editar Datos">
                          <IconButton onClick={() => abrirModalEdicion(usuario)} sx={{ color: verdePapelitos, mr: 0.5 }}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {usuario.is_active ? (
                        <Tooltip title="Dar de Baja">
                          <IconButton onClick={() => abrirModal(usuario, 'desactivar')} sx={{ color: '#d32f2f' }}>
                            <PersonOffIcon />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Reactivar Usuario">
                          <IconButton onClick={() => abrirModal(usuario, 'reactivar')} sx={{ color: '#2e7d32' }}>
                            <HowToRegIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    No se encontraron usuarios que coincidan con la búsqueda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={usuariosFiltrados.length}
          page={pagina}
          onPageChange={handleChangePage}
          rowsPerPage={filasPorPagina}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[25, 50, 100]}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          sx={{
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { color: verdePapelitos, fontWeight: 500 },
          }}
        />
      </Paper>

      {/* ========== MODAL DAR DE BAJA / REACTIVAR ========== */}
      <Dialog open={modalAbierto} onClose={cerrarModal} PaperProps={{ sx: { borderRadius: 3, minWidth: '400px' } }}>
        <DialogTitle sx={{ color: verdePapelitos, fontWeight: 'bold' }}>
          {accion === 'desactivar' ? 'Confirmar Desactivación' : 'Confirmar Reactivación'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {accion === 'desactivar' ? (
              <span>
                ¿Está seguro que desea desactivar al usuario <strong>{usuarioSeleccionado?.username}</strong>?
                <br /><br />
                Esta acción impedirá que el usuario inicie sesión, pero su historial de acciones se mantendrá.
              </span>
            ) : (
              <span>
                ¿Está seguro que desea reactivar al usuario <strong>{usuarioSeleccionado?.username}</strong>?
                <br /><br />
                El usuario podrá volver a iniciar sesión en el sistema.
              </span>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={cerrarModal} variant="outlined" sx={{ textTransform: 'none', borderRadius: 2, color: '#666', borderColor: '#ccc' }}>Cancelar</Button>
          <Button onClick={ejecutarAccion} variant="contained" color={accion === 'desactivar' ? 'error' : 'success'} sx={{ textTransform: 'none', borderRadius: 2 }}>
            {accion === 'desactivar' ? 'Dar de Baja' : 'Reactivar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/*  MODAL REGISTRO DE NUEVO USUARIO */}
      <Dialog open={modalRegistroAbierto} onClose={cerrarModalRegistro} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ color: verdePapelitos, fontWeight: 'bold' }}>
          Registrar Nuevo Usuario
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre Completo"
                  name="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  error={!!errores.nombre_completo}
                  helperText={errores.nombre_completo}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre de Usuario"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  error={!!errores.username}
                  helperText={errores.username}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
                            <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Correo Electrónico"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errores.email}
                  helperText={errores.email}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contraseña"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  error={!!errores.password}
                  helperText={errores.password || 'Mínimo 8 caracteres'}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={toggleShowPassword}
                            edge="end"
                            sx={{ color: '#666' }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ 
                    '& input::-ms-reveal': { display: 'none' },
                    '& input::-webkit-textfield-decoration-container': { display: 'none' },
                    '& .MuiOutlinedInput-root': { borderRadius: 2 }
                  }}
                />
                   <Box sx={{ mt: 1, mb: 1, minHeight: 32 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 500, color: '#666' }}>
                      Fortaleza:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: formData.password ? evaluarFortaleza(formData.password).color : '#999' }}>
                      {formData.password ? evaluarFortaleza(formData.password).nivel : '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ width: '100%', height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
                    <Box sx={{
                      width: formData.password ? `${evaluarFortaleza(formData.password).ancho}%` : '0%',
                      height: '100%',
                      backgroundColor: formData.password ? evaluarFortaleza(formData.password).color : 'transparent',
                      transition: 'all 0.3s ease',
                      borderRadius: 3
                    }} />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errores.rol}>
                  <InputLabel>Rol</InputLabel>
                  <Select
                    name="rol"
                    value={formData.rol}
                    label="Rol"
                    onChange={handleChange}
                    sx={{ borderRadius: 2 }}
                  >
                    {ROLES.map((rol) => (
                      <MenuItem key={rol.value} value={rol.value}>{rol.label}</MenuItem>
                    ))}
                  </Select>
                  {errores.rol && <FormHelperText>{errores.rol}</FormHelperText>}
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={cerrarModalRegistro} variant="outlined" sx={{ textTransform: 'none', borderRadius: 2, color: '#666', borderColor: '#ccc' }}>
            Cancelar
          </Button>
          <Button
            onClick={registrarUsuario}
            variant="contained"
            disabled={cargandoRegistro}
            sx={{
              backgroundColor: verdePapelitos,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { backgroundColor: '#143D22' }
            }}
          >
            {cargandoRegistro ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========== MODAL EDITAR DATOS PERSONALES ========== */}
      <Dialog open={modalEdicionAbierto} onClose={cerrarModalEdicion} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ color: verdePapelitos, fontWeight: 'bold' }}>
          Editar Datos del Usuario
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre de Usuario"
                  name="username"
                  value={formEdicion.username}
                  onChange={handleChangeEdicion}
                  error={!!erroresEdicion.username}
                  helperText={erroresEdicion.username}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre Completo"
                  name="nombre_completo"
                  value={formEdicion.nombre_completo}
                  onChange={handleChangeEdicion}
                  error={!!erroresEdicion.nombre_completo}
                  helperText={erroresEdicion.nombre_completo}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Correo Electrónico"
                  name="email"
                  type="email"
                  value={formEdicion.email}
                  onChange={handleChangeEdicion}
                  error={!!erroresEdicion.email}
                  helperText={erroresEdicion.email}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={cerrarModalEdicion} variant="outlined" sx={{ textTransform: 'none', borderRadius: 2, color: '#666', borderColor: '#ccc' }}>
            Cancelar
          </Button>
          <Button
            onClick={guardarEdicion}
            variant="contained"
            disabled={cargandoEdicion}
            sx={{
              backgroundColor: verdePapelitos,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { backgroundColor: '#143D22' }
            }}
          >
            {cargandoEdicion ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========== SNACKBAR ========== */}
      <Snackbar open={snackbar.abierto} autoHideDuration={4000} onClose={cerrarSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={cerrarSnackbar} severity={snackbar.tipo} variant="filled" sx={{ boxShadow: 3, borderRadius: '8px' }}>
          {snackbar.mensaje}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Usuarios;