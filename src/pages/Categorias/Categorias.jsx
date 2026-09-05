import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Tooltip, 
  CircularProgress, TextField, InputAdornment, Button, Alert,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CategoryIcon from '@mui/icons-material/Category';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { ENDPOINTS } from '../../services/api';
import EditarCategoria from './EditarCategoria';
import RegistrarCategoriaModal from './RegistrarCategoriaModal';

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [esAdmin, setEsAdmin] = useState(false);
  const [permisos, setPermisos] = useState({});

  const [modalOpen, setModalOpen] = useState(false);
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

  // Estados para modal de confirmación de borrado
  const [dialogoEliminarOpen, setDialogoEliminarOpen] = useState(false);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);

  const [alertaGlobal, setAlertaGlobal] = useState({ tipo: '', mensaje: '' });
  const verdePapelitos = '#1E5631';

  const cargarCategorias = async () => {
    try {
      const response = await fetch(ENDPOINTS.INVENTARIO.CATEGORIAS);
      if (response.ok) {
        const data = await response.json();
        setCategorias(data);
      }
    } catch (error) {
      setAlertaGlobal({ tipo: 'error', mensaje: 'Error al actualizar listado.' });
    }
  };

  useEffect(() => {
    const inicializarDatos = async () => {
      const token = localStorage.getItem('token');
      try {
        if (token) {
          const resUser = await fetch(`${ENDPOINTS.SEGURIDAD.LOGIN.replace('/login/', '')}/me/`, {
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json',
            }
          });
          if (resUser.ok) {
            const dataUser = await resUser.json();
            setEsAdmin(dataUser.rol === 'ADMIN');
            setPermisos(dataUser.permisos || {});
          }
        }
        await cargarCategorias();
      } catch (error) {
        setAlertaGlobal({ tipo: 'error', mensaje: 'Error al sincronizar datos iniciales.' });
      } finally {
        setCargando(false);
      }
    };

    inicializarDatos();
  }, []);

  const abrirConfirmacionEliminar = (cat) => {
    setCategoriaAEliminar(cat);
    setDialogoEliminarOpen(true);
  };

  const cerrarConfirmacionEliminar = () => {
    setCategoriaAEliminar(null);
    setDialogoEliminarOpen(false);
  };

  const confirmarEliminacion = async () => {
    if (!categoriaAEliminar) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${ENDPOINTS.INVENTARIO.CATEGORIAS}${categoriaAEliminar.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Token ${token}` : '',
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setAlertaGlobal({ tipo: 'success', mensaje: 'Categoría eliminada con éxito.' });
        await cargarCategorias();
      } else {
        // Criterio de Aceptación: Advertencia exacta
        setAlertaGlobal({ 
          tipo: 'warning', 
          mensaje: data.message || 'No se puede eliminar: existen productos bajo esta categoría.' 
        });
      }
    } catch (error) {
      setAlertaGlobal({ tipo: 'error', mensaje: 'Error de comunicación con el servidor.' });
    } finally {
      cerrarConfirmacionEliminar();
      setTimeout(() => setAlertaGlobal({ tipo: '', mensaje: '' }), 7000);
    }
  };

  const categoriasFiltradas = categorias
    .filter((cat) => cat.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const puedeAgregar = esAdmin || permisos.categorias?.agregar;
  const puedeEditar = esAdmin || permisos.categorias?.editar;
  const puedeEliminar = esAdmin || permisos.categorias?.eliminar;

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress color="success" />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <CategoryIcon sx={{ color: verdePapelitos, fontSize: 35 }} />
        <Typography variant="h4" fontWeight="bold" color={verdePapelitos}>
          Listado de Categorías
        </Typography>
      </Box>

      {alertaGlobal.mensaje && (
        <Alert severity={alertaGlobal.tipo} sx={{ mb: 3 }}>
          {alertaGlobal.mensaje}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <TextField
          size="small"
          placeholder="Buscar categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: verdePapelitos }} />
              </InputAdornment>
            )
          }}
          sx={{ backgroundColor: '#fff', width: '350px', '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
        />
        
        {puedeAgregar && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setModalCrearOpen(true)} 
            sx={{ backgroundColor: verdePapelitos, '&:hover': { backgroundColor: '#143d22' }, borderRadius: '8px', textTransform: 'none' }}
          >
            Agregar Categoría
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ backgroundColor: verdePapelitos }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>N°</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>NOMBRE DE LA CATEGORÍA</TableCell>
              {(puedeEditar || puedeEliminar) && (
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>ACCIONES</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {categoriasFiltradas.length > 0 ? (
              categoriasFiltradas.map((cat, index) => (
                <TableRow key={cat.id} hover>
                  <TableCell sx={{ fontWeight: 'bold' }}>#{index + 1}</TableCell>
                  <TableCell>{cat.nombre}</TableCell>
                  
                  {(puedeEditar || puedeEliminar) && (
                    <TableCell sx={{ textAlign: 'center' }}>
                      {puedeEditar && (
                        <Tooltip title="Editar Categoría">
                          <IconButton onClick={() => { setCategoriaSeleccionada(cat); setModalOpen(true); }} sx={{ color: verdePapelitos, mr: 1 }}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {puedeEliminar && (
                        <Tooltip title="Eliminar Categoría">
                          <IconButton onClick={() => abrirConfirmacionEliminar(cat)} sx={{ color: '#d32f2f' }}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={(puedeEditar || puedeEliminar) ? 3 : 2} sx={{ textAlign: 'center', py: 4 }}>
                  No se encontraron categorías.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* MODAL DE CONFIRMACIÓN DE BORRADO FÍSICO */}
      <Dialog open={dialogoEliminarOpen} onClose={cerrarConfirmacionEliminar} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="warning" />
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar permanentemente la categoría <strong>{categoriaAEliminar?.nombre}</strong>? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={cerrarConfirmacionEliminar} color="inherit">
            Cancelar
          </Button>
          <Button onClick={confirmarEliminacion} variant="contained" color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <RegistrarCategoriaModal 
        open={modalCrearOpen}
        onClose={() => setModalCrearOpen(false)}
        onSuccess={async () => {
          await cargarCategorias();
          setAlertaGlobal({ tipo: 'success', mensaje: 'Categoría guardada correctamente.' });
          setTimeout(() => setAlertaGlobal({ tipo: '', mensaje: '' }), 3000);
        }}
      />

      {categoriaSeleccionada && (
        <EditarCategoria 
          open={modalOpen} 
          onClose={() => { setModalOpen(false); setCategoriaSeleccionada(null); }} 
          categoria={categoriaSeleccionada}
          onSuccess={async () => {
            await cargarCategorias();
            setAlertaGlobal({ tipo: 'success', mensaje: 'Categoría actualizada correctamente.' }); 
            setTimeout(() => setAlertaGlobal({ tipo: '', mensaje: '' }), 3000); 
          }}
        />
      )}
    </Box>
  );
};

export default Categorias;