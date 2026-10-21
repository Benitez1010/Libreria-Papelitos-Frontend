import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import RefreshIcon from '@mui/icons-material/Refresh';

// Herramientas PDF
import BotonExportar from '../../components/BotonExportar';
import { generarPDF } from '../../utils/pdfExport';

export default function ReporteExistencias() {
  const verdePapelitos = '#1E5631';

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Normaliza API_BASE: quita barras finales y asegura el prefijo /api
  const rawApi = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  const cleanUrl = rawApi.replace(/\/+$/, '');
  const API_BASE = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {})
    };
  };

  useEffect(() => {
    // Cargar categorías para el filtro
    fetch(`${API_BASE}/categorias/`, { headers: getHeaders() })
      .then(res => (res.ok ? res.json() : []))
      .then(data => setCategorias(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error al cargar categorías:', err));
  }, []);

  const cargarReporte = () => {
    setCargando(true);
    setError(null);
    const query = categoriaSeleccionada === 'todas' ? '' : `?categoria=${categoriaSeleccionada}`;

    fetch(`${API_BASE}/reportes/existencias-ubicacion/${query}`, { headers: getHeaders() })
      .then(res => {
        if (!res.ok) throw new Error('Error al consultar existencias');
        return res.json();
      })
      .then(data => {
        setProductos(Array.isArray(data) ? data : []);
        setCargando(false);
      })
      .catch(err => {
        setError(err.message);
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarReporte();
  }, [categoriaSeleccionada]);

  const totalBodega = productos.reduce((sum, p) => sum + (p.stock_bodega || 0), 0);
  const totalVitrina = productos.reduce((sum, p) => sum + (p.stock_vitrina || 0), 0);
  const totalConsolidado = productos.reduce((sum, p) => sum + (p.total_consolidado || 0), 0);

  // --- LÓGICA DE EXPORTACIÓN A PDF ---
  const handleExportarPDF = () => {
    const columnas = [
      { header: 'ID', field: 'id' },
      { header: 'Nombre del Producto', field: 'nombre' },
      { header: 'Categoría', field: 'categoria_nombre' },
      { header: 'Bodega', field: 'stock_bodega' },
      { header: 'Vitrina', field: 'stock_vitrina' },
      { header: 'Total', field: 'total_consolidado' }
    ];

    // Copiamos los productos y agregamos la fila de totales al final para el PDF
    const datosParaPDF = [...productos];
    if (productos.length > 0) {
      datosParaPDF.push({
        id: '',
        nombre: 'TOTAL CONSOLIDADO:',
        categoria_nombre: '',
        stock_bodega: totalBodega,
        stock_vitrina: totalVitrina,
        total_consolidado: totalConsolidado
      });
    }

    // Buscamos el nombre de la categoría para el título del PDF
    const nombreCategoria = categoriaSeleccionada === 'todas' 
      ? 'Todas las categorías' 
      : categorias.find(c => c.id === categoriaSeleccionada)?.nombre || 'Filtrado';

    const titulo = `Reporte de Existencias - ${nombreCategoria}`;
    generarPDF(titulo, columnas, datosParaPDF);
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      {/* Encabezado fuera de tarjeta, con fondo transparente */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <InventoryIcon sx={{ color: verdePapelitos, fontSize: 40 }} />
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ color: verdePapelitos }}>
            Control de Inventario - Existencias por Ubicación
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Separación física de existencias en Bodega y Vitrina con balance consolidado.
          </Typography>
        </Box>
      </Box>

      {/* Filtro compacto y Botones */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 3 }}>
        <FormControl size="small" sx={{ bgcolor: '#fff', borderRadius: 1, minWidth: 250 }}>
          <InputLabel id="categoria-select-label">Filtrar por Categoría</InputLabel>
          <Select
            labelId="categoria-select-label"
            value={categoriaSeleccionada}
            label="Filtrar por Categoría"
            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
          >
            <MenuItem value="todas">Todas las categorías</MenuItem>
            {categorias.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={cargarReporte}
          sx={{
            backgroundColor: '#fff',
            color: '#424242',
            borderColor: '#c4c4c4',
            textTransform: 'none',
            borderRadius: '8px',
            height: '40px',
            px: 2,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            '&:hover': { backgroundColor: '#f8f9fa', borderColor: '#9e9e9e' }
          }}
        >
          Recargar
        </Button>

        <BotonExportar 
          onExportPDF={handleExportarPDF} 
          disabled={productos.length === 0 || cargando} 
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabla del Reporte dentro de contenedor con estilo unificado */}
      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: verdePapelitos }}>
            <TableRow>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>NOMBRE DEL PRODUCTO</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>CATEGORÍA</TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold' }}>SALDO EN BODEGA</TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold' }}>SALDO EN VITRINA</TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold' }}>TOTAL CONSOLIDADO</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cargando ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={30} sx={{ color: verdePapelitos, mb: 1 }} />
                  <Typography variant="body2" color="textSecondary">
                    Generando reporte...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : productos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#666' }}>
                  No se encontraron registros de existencias.
                </TableCell>
              </TableRow>
            ) : (
              productos.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell sx={{ color: '#718096' }}>#{p.id}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{p.nombre}</TableCell>
                  <TableCell sx={{ color: '#4a5568' }}>{p.categoria_nombre}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#2b6cb0' }}>
                    {p.stock_bodega}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#2f855a' }}>
                    {p.stock_vitrina}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#1a202c' }}>
                    {p.total_consolidado}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>

          {productos.length > 0 && !cargando && (
            <TableHead sx={{ bgcolor: '#f7fafc' }}>
              <TableRow sx={{ borderTop: '2px solid #e2e8f0' }}>
                <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                  TOTAL CONSOLIDADO:
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#2b6cb0' }}>
                  {totalBodega}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#2f855a' }}>
                  {totalVitrina}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#1a202c' }}>
                  {totalConsolidado}
                </TableCell>
              </TableRow>
            </TableHead>
          )}
        </Table>
      </TableContainer>
    </Box>
  );
}