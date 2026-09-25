import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Alert, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TextField, InputAdornment, 
  Button, IconButton, Tooltip, CircularProgress, FormControl, Select, 
  MenuItem, TablePagination, Dialog, DialogTitle, DialogContent, 
  DialogContentText, DialogActions
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import InventoryIcon from '@mui/icons-material/Inventory';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ENDPOINTS } from '../../services/api';
import RegistrarProductoModal from './RegistrarProductoModal';

// IMPORTACIONES DE COMPONENTES REUTILIZABLES
import BotonTransacciones from '../../components/BotonTransacciones';
import BotonExportar from '../../components/BotonExportar';

const ListaProductos = () => {
  const navigate = useNavigate();

  // Paleta de colores institucional
  const verdePapelitos = '#1E5631';

  // Estados de datos
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [usuarioInfo, setUsuarioInfo] = useState(null); // Estado para permisos
  
  // Estados para Búsqueda y Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  // Estados para Paginación (Iniciando en 10 por página)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Control de errores / alertas
  const [alertaGlobal, setAlertaGlobal] = useState({ tipo: '', mensaje: '' });

  // Modal de registro
  const [modalAgregarOpen, setModalAgregarOpen] = useState(false);

  // Estados para el modal de doble confirmación de borrado
  const [dialogoEliminarOpen, setDialogoEliminarOpen] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [pasoConfirmacion, setPasoConfirmacion] = useState(1);
  const [eliminando, setEliminando] = useState(false);

  // Función principal de carga de datos
  const obtenerDatosInventario = async (esRecargaManual = false) => {
    if (esRecargaManual) setCargando(true);
    const token = localStorage.getItem('token');
    
    try {
      const [respuestaProductos, respuestaCategorias, respuestaUsuario] = await Promise.all([
        fetch(ENDPOINTS.INVENTARIO.PRODUCTOS),
        fetch(ENDPOINTS.INVENTARIO.CATEGORIAS),
        fetch(`${ENDPOINTS.SEGURIDAD.LOGIN.replace('/login/', '')}/me/`, {
          headers: { 'Authorization': `Token ${token}` }
        })
      ]);

      if (respuestaProductos.ok && respuestaCategorias.ok && respuestaUsuario.ok) {
        const datosProductos = await respuestaProductos.json();
        const datosCategorias = await respuestaCategorias.json();
        const datosUsuario = await respuestaUsuario.json();
        
        setProductos(datosProductos);
        setCategorias(datosCategorias);
        setUsuarioInfo(datosUsuario);
        
        if (esRecargaManual) {
          setAlertaGlobal({ tipo: 'success', mensaje: 'Tabla actualizada con los últimos datos.' });
          setTimeout(() => setAlertaGlobal({ tipo: '', mensaje: '' }), 3000);
        }
      } else {
        setAlertaGlobal({ tipo: 'error', mensaje: 'Error al recuperar los registros del servidor.' });
      }
    } catch (error) {
      setAlertaGlobal({ tipo: 'error', mensaje: 'No se pudo establecer conexión con la base de datos.' });
    } finally {
      setCargando(false);
    }
  };

  // Efecto de carga inicial
  useEffect(() => {
    obtenerDatosInventario();
  }, []);

  // Lógica de Permisos
  const rol = usuarioInfo?.rol || '';
  const esAdmin = rol === 'ADMIN' || rol === 'Administrador';
  const esBodega = rol === 'BODEGA' || rol === 'Operador de Bodega';

  const puedeExportar = esAdmin;
  const puedeGestionarProducto = esAdmin || esBodega; // Agregar, Editar, 
  const puedeEliminarProducto = esAdmin; // Solo eliminar para Admin
  

  // Función del Botón "Recargar"
  const handleRecargarTabla = () => {
    setPage(0);
    obtenerDatosInventario(true);
  };

  // Abre el modal de confirmación (paso 1) para el producto seleccionado
  const abrirConfirmacionEliminar = (producto) => {
    setProductoAEliminar(producto);
    setPasoConfirmacion(1);
    setDialogoEliminarOpen(true);
  };

  // Cierra y resetea el modal de confirmación
  const cerrarConfirmacionEliminar = () => {
    if (eliminando) return;
    setDialogoEliminarOpen(false);
    setProductoAEliminar(null);
    setPasoConfirmacion(1);
  };

  // Avanza del paso 1 (advertencia) al paso 2 (confirmación final)
  const avanzarAConfirmacionFinal = () => {
    setPasoConfirmacion(2);
  };

  // Ejecuta la eliminación real contra el backend
  const confirmarEliminacionProducto = async () => {
    if (!productoAEliminar) return;
    setEliminando(true);

    try {
      const response = await fetch(`${ENDPOINTS.INVENTARIO.PRODUCTOS}${productoAEliminar.id}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProductos((prev) => prev.filter((p) => p.id !== productoAEliminar.id));
        setAlertaGlobal({ tipo: 'success', mensaje: 'Producto eliminado correctamente del inventario.' });
      } else {
        const data = await response.json().catch(() => ({}));
        setAlertaGlobal({
          tipo: 'warning',
          mensaje: data.message || 'No se puede eliminar: el producto tiene existencias o movimientos registrados.',
        });
      }
    } catch (error) {
      setAlertaGlobal({ tipo: 'error', mensaje: 'Error de red al intentar eliminar el producto.' });
    } finally {
      setEliminando(false);
      cerrarConfirmacionEliminar();
      setTimeout(() => setAlertaGlobal({ tipo: '', mensaje: '' }), 5000);
    }
  };

  // Manejadores de cambios en los filtros
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleCategoryChange = (e) => {
    setFiltroCategoria(e.target.value);
    setPage(0);
  };

  // Lógica de filtrado en vivo
  const productosFiltrados = productos.filter((producto) => {
    const termino = searchTerm.toLowerCase();
    const coincideBusqueda = 
      producto.nombre.toLowerCase().includes(termino) || 
      String(producto.id).toLowerCase().includes(termino);

    const coincideCategoria = 
      filtroCategoria === '' || 
      String(producto.categoria_id) === String(filtroCategoria) ||
      producto.categoria === filtroCategoria;

    return coincideBusqueda && coincideCategoria;
  });

  // Funciones de Paginación
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const productosPaginados = productosFiltrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress sx={{ color: verdePapelitos }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      
      {/* Encabezado */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <InventoryIcon sx={{ color: verdePapelitos, fontSize: 35 }} />
        <Typography variant="h4" fontWeight="bold" color={verdePapelitos}>
          Listado de Productos
        </Typography>
      </Box>

      {alertaGlobal.mensaje && (
        <Alert severity={alertaGlobal.tipo} sx={{ mb: 3 }}>
          {alertaGlobal.mensaje}
        </Alert>
      )}

      {/* Barra de Herramientas Principal */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        
        {/* Filtros */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexGrow: 1 }}>
          <TextField
            size="small"
            placeholder="Buscar por ID o Nombre..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{ 
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: verdePapelitos }} />
                </InputAdornment>
              ) 
            }}
            sx={{ backgroundColor: '#fff', width: '350px', '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />

          <FormControl size="small" sx={{ minWidth: 200, backgroundColor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
            <Select
              displayEmpty
              value={filtroCategoria}
              onChange={handleCategoryChange}
            >
              <MenuItem value="">
                <em>Todas las categorías</em>
              </MenuItem>
              {categorias.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Panel de Opciones Integrado y Botones de Acción */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          
          <Button 
            onClick={handleRecargarTabla} 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            sx={{ 
              backgroundColor: '#fff', 
              color: '#424242', 
              borderColor: '#bdbdbd', 
              textTransform: 'none', 
              borderRadius: '8px',
              '&:hover': { backgroundColor: '#f5f5f5', borderColor: '#9e9e9e' } 
            }}
          >
            Recargar
          </Button>

          {/* COMPONENTE DE EXPORTACIÓN (Solo Admin) */}
          {puedeExportar && <BotonExportar />}

          {/* COMPONENTE DE TRANSACCIONES INTEGRADO */}
          <BotonTransacciones />

          {/* Botón original de Agregar Producto (Solo Admin) */}
          {puedeGestionarProducto && (
            <Button 
              onClick={() => setModalAgregarOpen(true)}
              variant="contained" 
              startIcon={<AddIcon />} 
              sx={{ backgroundColor: verdePapelitos, '&:hover': { backgroundColor: '#143d22' }, borderRadius: '8px', textTransform: 'none' }}
            >
              Agregar Producto
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabla e Integración de Paginación */}
      <Paper elevation={3} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: verdePapelitos }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>NOMBRE DEL PRODUCTO</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>CATEGORÍA</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>BODEGA</TableCell>
                <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>VITRINA</TableCell>
                {(puedeGestionarProducto || puedeEliminarProducto) && (
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>ACCIONES</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {productosPaginados.length > 0 ? (
                productosPaginados.map((producto) => (
                  <TableRow key={producto.id} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>#{producto.id}</TableCell>
                    <TableCell>{producto.nombre}</TableCell>
                    <TableCell>{producto.categoria_nombre || producto.categoria}</TableCell>
                    
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: verdePapelitos }}>
                      {producto.stock_bodega ?? producto.cantidad_inicial}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#1565c0' }}>
                      {producto.stock_vitrina ?? 0}
                    </TableCell>

                    {/* Celda de Acciones - Lógica separada por permisos */}
                  {(puedeGestionarProducto || puedeEliminarProducto) && (
                    <TableCell align="center">
                      {/* El Administrador y Bodega pueden editar */}
                      {puedeGestionarProducto && (
                        <Tooltip title="Editar Producto">
                          <IconButton 
                            onClick={() => navigate(`/productos/editar/${producto.id}`)} 
                            sx={{ color: verdePapelitos, mr: 0.5 }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {/* SOLO el Administrador puede eliminar */}
                      {puedeEliminarProducto && (
                        <Tooltip title="Eliminar Producto">
                          <IconButton 
                            onClick={() => abrirConfirmacionEliminar(producto)} 
                            sx={{ color: '#d32f2f' }}
                          >
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
                  <TableCell colSpan={puedeGestionarProducto ? 6 : 5} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    No se encontraron productos que coincidan con la búsqueda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Componente de Paginación */}
        <TablePagination
          rowsPerPageOptions={[10, 20, 30]}
          component="div"
          count={productosFiltrados.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`}
        />
      </Paper>
    
      {/* MODAL DE DOBLE CONFIRMACIÓN DE BORRADO PERMANENTE */}
      <Dialog open={dialogoEliminarOpen} onClose={cerrarConfirmacionEliminar} maxWidth="xs" fullWidth>
        {pasoConfirmacion === 1 ? (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningAmberIcon color="warning" />
              Eliminar Producto
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                ¿Estás seguro de que deseas eliminar el producto{' '}
                <strong>{productoAEliminar?.nombre}</strong> del catálogo? Esta acción
                no se puede deshacer.
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={cerrarConfirmacionEliminar} color="inherit">
                Cancelar
              </Button>
              <Button onClick={avanzarAConfirmacionFinal} variant="contained" color="error">
                Continuar
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#c62828' }}>
              <WarningAmberIcon color="error" />
              Confirmación Final
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                Esta es tu última oportunidad. El producto{' '}
                <strong>{productoAEliminar?.nombre}</strong> y su configuración de
                stock mínimo se eliminarán <strong>permanentemente</strong> del
                sistema.
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={cerrarConfirmacionEliminar} color="inherit" disabled={eliminando}>
                Cancelar
              </Button>
              <Button
                onClick={confirmarEliminacionProducto}
                variant="contained"
                color="error"
                disabled={eliminando}
              >
                {eliminando ? 'Eliminando...' : 'Sí, eliminar permanentemente'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <RegistrarProductoModal 
        open={modalAgregarOpen}
        onClose={() => setModalAgregarOpen(false)}
        onSuccess={() => obtenerDatosInventario(false)} 
      />
    </Box>
  );
};

export default ListaProductos;