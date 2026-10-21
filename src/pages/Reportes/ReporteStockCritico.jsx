import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ENDPOINTS } from '../../services/api';

// Herramientas PDF
import BotonExportar from '../../components/BotonExportar';
import { generarPDF } from '../../utils/pdfExport';

const verdePapelitos = '#1E5631';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Token ${token}` } : {})
  };
};

const estiloEncabezado = { color: 'white', fontWeight: 'bold' };

export default function ReporteStockCritico() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const cargarReporte = (categoria) => {
    const query = categoria ? `?categoria=${categoria}` : '';
    setCargando(true);
    setError('');

    fetch(`${ENDPOINTS.REPORTES.STOCK_CRITICO}${query}`, { headers: getHeaders() })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || data?.detail || 'No se pudo generar el reporte.');
        }
        return data;
      })
      .then((data) => setProductos(Array.isArray(data) ? data : []))
      .catch((err) => {
        setProductos([]);
        setError(err instanceof TypeError ? 'No se pudo conectar con el servidor.' : err.message);
      })
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    fetch(ENDPOINTS.INVENTARIO.CATEGORIAS, { headers: getHeaders() })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCategorias(Array.isArray(data) ? data : []))
      .catch(() => setCategorias([]));
  }, []);

  useEffect(() => {
    cargarReporte(categoriaSeleccionada);
  }, [categoriaSeleccionada]);

  const handleCategoryChange = (e) => {
    setCategoriaSeleccionada(e.target.value);
    setPage(0);
  };

  const handleRecargar = () => {
    setPage(0);
    cargarReporte(categoriaSeleccionada);
  };

  const totalAgotados = productos.filter((p) => p.total_consolidado === 0).length;
  const totalSugerido = productos.reduce((suma, p) => suma + (p.cantidad_sugerida || 0), 0);

  const resumen = [
    { titulo: 'Productos en stock crítico', valor: productos.length, color: verdePapelitos },
    { titulo: 'Productos agotados', valor: totalAgotados, color: '#d32f2f' },
    { titulo: 'Unidades a reabastecer', valor: totalSugerido, color: '#ed6c02' }
  ];

  const productosPaginados = productos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // --- LÓGICA DE EXPORTACIÓN A PDF ---
  const handleExportarPDF = () => {
    const columnas = [
      { header: 'Producto', field: 'nombre' },
      { header: 'Categoría', field: 'categoria_nombre' },
      { header: 'Bodega', field: 'stock_bodega' },
      { header: 'Vitrina', field: 'stock_vitrina' },
      { header: 'Total', field: 'total_consolidado' },
      { header: 'Stock Mín.', field: 'stock_minimo' },
      { header: 'A Reabastecer', field: 'cantidad_sugerida' },
      { header: 'Estado', field: 'estado_texto' }
    ];

    // Preparamos los datos inyectando el texto de estado que en pantalla es un Chip
    const datosParaPDF = productos.map(p => ({
      ...p,
      estado_texto: p.total_consolidado === 0 ? 'Agotado' : 'Crítico'
    }));

    const nombreCategoria = categoriaSeleccionada === '' 
      ? 'Todas las categorías' 
      : categorias.find(c => c.id === categoriaSeleccionada)?.nombre || 'Filtrado';

    const titulo = `Reporte de Stock Crítico - ${nombreCategoria}`;
    generarPDF(titulo, columnas, datosParaPDF);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <WarningAmberIcon sx={{ color: verdePapelitos, fontSize: 35 }} />
        <Typography variant="h4" fontWeight="bold" color={verdePapelitos}>
          Reporte de Stock Crítico
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        {resumen.map((item) => (
          <Paper
            key={item.titulo}
            elevation={3}
            sx={{ flex: '1 1 200px', p: 2, borderRadius: '12px', borderLeft: `4px solid ${item.color}` }}
          >
            <Typography variant="body2" color="text.secondary">
              {item.titulo}
            </Typography>
            <Typography variant="h5" fontWeight="bold" sx={{ color: item.color }}>
              {item.valor}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        {/* Lado Izquierdo: Filtro */}
        <FormControl size="small" sx={{ minWidth: 200, backgroundColor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
          <Select displayEmpty value={categoriaSeleccionada} onChange={handleCategoryChange}>
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

        {/* Lado Derecho: Botones */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            onClick={handleRecargar}
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

          <BotonExportar 
            onExportPDF={handleExportarPDF} 
            disabled={productos.length === 0 || cargando} 
          />
        </Box>
      </Box>

      <Paper elevation={3} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: verdePapelitos }}>
              <TableRow>
                <TableCell sx={estiloEncabezado}>NOMBRE DEL PRODUCTO</TableCell>
                <TableCell sx={estiloEncabezado}>CATEGORÍA</TableCell>
                <TableCell align="center" sx={estiloEncabezado}>BODEGA</TableCell>
                <TableCell align="center" sx={estiloEncabezado}>VITRINA</TableCell>
                <TableCell align="center" sx={estiloEncabezado}>TOTAL</TableCell>
                <TableCell align="center" sx={estiloEncabezado}>STOCK MÍNIMO</TableCell>
                <TableCell align="center" sx={estiloEncabezado}>A REABASTECER</TableCell>
                <TableCell align="center" sx={estiloEncabezado}>ESTADO</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cargando ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} sx={{ color: verdePapelitos }} />
                  </TableCell>
                </TableRow>
              ) : productosPaginados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    No hay productos en stock crítico.
                  </TableCell>
                </TableRow>
              ) : (
                productosPaginados.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>{p.nombre}</TableCell>
                    <TableCell>{p.categoria_nombre}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: verdePapelitos }}>
                      {p.stock_bodega}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#1565c0' }}>
                      {p.stock_vitrina}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      {p.total_consolidado}
                    </TableCell>
                    <TableCell align="center">{p.stock_minimo}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#ed6c02' }}>
                      {p.cantidad_sugerida}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={p.total_consolidado === 0 ? 'Agotado' : 'Crítico'}
                        color="error"
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 20, 30]}
          component="div"
          count={productos.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`}
        />
      </Paper>
    </Box>
  );
}