import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  Button,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  TablePagination
} from '@mui/material';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ClearIcon from '@mui/icons-material/Clear';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { ENDPOINTS } from '../../services/api';
import { useEsAdmin } from '../../components/ProtectorRuta';

// Herramientas de PDF
import BotonExportar from '../../components/BotonExportar';
import { generarPDF } from '../../utils/pdfExport';

// Modal de la historia REP-03 modularizado en la carpeta Reportes
import ReporteAltaRotacion from '../Reportes/ReporteAltaRotacion';
import ProductosSinMovimiento from '../Reportes/ProductosSinMovimiento'

const Movimientos = () => {
  const verdePapelitos = '#1E5631';
  const azulPapelitos = '#1976d2';

  const navigate = useNavigate();
  const esAdmin = useEsAdmin(); // Exportar y reportes: solo administrador

  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  // Estados de filtrado
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const manejarCambioDesde = (event) => {
    const nuevaFechaDesde = event.target.value;
    setFechaDesde(nuevaFechaDesde);

    if (nuevaFechaDesde && fechaHasta && nuevaFechaDesde > fechaHasta) {
      setFechaHasta(nuevaFechaDesde);
    }
  };

  const manejarCambioHasta = (event) => {
    const nuevaFechaHasta = event.target.value;
    setFechaHasta(
      fechaDesde && nuevaFechaHasta && nuevaFechaHasta < fechaDesde
        ? fechaDesde
        : nuevaFechaHasta
    );
  };

  // Control para abrir/cerrar el modal de alta rotación
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalSinMovimientoAbierto, setModalSinMovimientoAbierto] = useState(false);

  const cargarHistorial = async () => {
    setCargando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(ENDPOINTS.INVENTARIO.MOVIMIENTOS, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setMovimientos(data);
        setError('');
      } else {
        setError(`Error del servidor (${res.status}): No se pudo obtener el historial.`);
      }
    } catch {
      setError('Error de conexión con el servidor backend.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const getTipoChip = (tipo, tipoDisplay) => {
    const config = {
      ENTRADA: { color: '#2e7d32', bg: '#edf7ed', label: tipoDisplay || 'Entrada de Mercadería' },
      SALIDA: { color: '#0288d1', bg: '#e1f5fe', label: tipoDisplay || 'Salida (Despacho)' },
      TRASLADO: { color: '#ed6c02', bg: '#fff4e5', label: tipoDisplay || 'Traslado (Bodega a Vitrina)' },
      AVERIA: { color: '#d32f2f', bg: '#fdecea', label: tipoDisplay || 'Ajuste por Merma/Daño' },
      CORRECCION: { color: '#9c27b0', bg: '#f3e5f5', label: tipoDisplay || 'Ajuste Administrativo' },
    };
    const actual = config[tipo] || { color: '#555', bg: '#eee', label: tipoDisplay || tipo };
    return (
      <Chip
        size="small"
        label={actual.label}
        sx={{ bgcolor: actual.bg, color: actual.color, fontWeight: 'bold' }}
      />
    );
  };

  // Filtrado reactivo en tiempo real
  const listaFiltrada = movimientos.filter((m) => {
    const texto = `${m.producto_nombre || ''} ${m.responsable || ''} ${m.justificacion || ''}`.toLowerCase();
    const coincideTexto = texto.includes(filtroTexto.toLowerCase());

    const coincideTipo = filtroTipo === '' || m.tipo === filtroTipo;

    const fechaSoloDia = m.fecha_hora ? m.fecha_hora.split('T')[0] : '';
    let coincideDesde = true;
    let coincideHasta = true;

    if (fechaDesde) {
      coincideDesde = fechaSoloDia >= fechaDesde;
    }
    if (fechaHasta) {
      coincideHasta = fechaSoloDia <= fechaHasta;
    }

    return coincideTexto && coincideTipo && coincideDesde && coincideHasta;
  });

  // Filas visibles en la página actual (el PDF sigue exportando toda la lista filtrada)
  const movimientosPaginados = listaFiltrada.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // --- LÓGICA DE EXPORTACIÓN A PDF ---
  const handleExportarPDF = () => {
    const columnas = [
      { header: 'Fecha y Hora', field: 'fecha_hora_formateada' },
      { header: 'Producto', field: 'producto_nombre' },
      { header: 'Tipo', field: 'tipo_display' },
      { header: 'Cant.', field: 'cantidad' },
      { header: 'Origen', field: 'origen_display' },
      { header: 'Destino', field: 'destino_display' },
      { header: 'Responsable', field: 'responsable' }
    ];

    // Mapeamos listaFiltrada para asegurar que los datos estén limpios para el PDF
    const datosParaPDF = listaFiltrada.map(mov => ({
      ...mov,
      fecha_hora_formateada: new Date(mov.fecha_hora).toLocaleString('es-SV'),
      tipo_display: mov.tipo_display || mov.tipo,
      origen_display: mov.origen_display || mov.origen,
      destino_display: mov.destino_display || mov.destino,
      responsable: mov.responsable || 'Sin asignar'
    }));

    generarPDF('Historial de Movimientos de Inventario', columnas, datosParaPDF);
  };

  return (
    <Box sx={{ p: 4, fontFamily: '"Inter", sans-serif' }}>
      {/* 1. Título Limpio */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <SyncAltIcon sx={{ fontSize: 36, color: verdePapelitos }} />
        <Typography 
          variant="h4" 
          fontWeight="bold" 
          sx={{ color: '#222222', letterSpacing: '-0.5px' }}>
          Historial de Movimientos
        </Typography>
      </Box>

      {/* 2. Renglón Unificado con extremos alineados */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center', 
          mb: 3, 
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        {/* Lado Izquierdo: Buscador + Tipo + Recargar + Exportar + Botón Reporte */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Buscar por ID, nombre o responsable"
            value={filtroTexto}
            onChange={(e) => { setFiltroTexto(e.target.value); setPage(0); }}
            sx={{
              bgcolor: '#fff',
              width: { xs: '100%', sm: 380 },
              '& .MuiOutlinedInput-root': { 
                borderRadius: '8px',
                height: '40px'
              }
            }}
          />

          <FormControl size="small" sx={{ minWidth: 190 }}>
            <Select
              displayEmpty
              value={filtroTipo}
              onChange={(e) => { setFiltroTipo(e.target.value); setPage(0); }}
              renderValue={(selected) => {
                const labels = {
                  '': 'Todos los tipos',
                  'ENTRADA': 'Entrada de Mercadería',
                  'SALIDA': 'Salida (Despacho)',
                  'TRASLADO': 'Traslado Interno',
                  'AVERIA': 'Ajuste por Merma/Daño',
                  'CORRECCION': 'Ajuste Administrativo'
                };
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FilterListIcon sx={{ fontSize: 18, color: '#ffffff' }} />
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#ffffff' }}>
                      {labels[selected] || 'Todos los tipos'}
                    </Typography>
                  </Box>
                );
              }}
              sx={{
                backgroundColor: azulPapelitos,
                borderRadius: '8px',
                height: '40px',
                '& .MuiSelect-icon': { color: '#ffffff' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' }
              }}
            >
              <MenuItem value="">Todos los tipos</MenuItem>
              <MenuItem value="ENTRADA">Entrada de Mercadería</MenuItem>
              <MenuItem value="SALIDA">Salida (Despacho)</MenuItem>
              <MenuItem value="TRASLADO">Traslado Interno</MenuItem>
              <MenuItem value="AVERIA">Ajuste por Merma/Daño</MenuItem>
              <MenuItem value="CORRECCION">Ajuste Administrativo</MenuItem>
            </Select>
          </FormControl>

          {/* Botón Recargar */}
          <Button
            onClick={cargarHistorial}
            variant="outlined"
            startIcon={<RefreshIcon />}
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

          {/* Botón Exportar PDF */}
          <BotonExportar 
            onExportPDF={handleExportarPDF} 
            disabled={listaFiltrada.length === 0 || cargando} 
          />

          {/* Botón de REP-03: Abre el modal del reporte de demanda (solo admin) */}
          {esAdmin && (
          <Button
            onClick={() => setModalAbierto(true)}
            variant="contained"
            startIcon={<TrendingUpIcon />}
            sx={{
              backgroundColor: verdePapelitos,
              color: '#fff',
              textTransform: 'none',
              borderRadius: '8px',
              height: '40px',
              px: 2,
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(30,86,49,0.2)',
              '&:hover': { backgroundColor: '#143c22' }
            }}
          >
            Ver Más Vendidos
          </Button>
          )}
          {esAdmin && (
          <Button
            onClick={() => setModalSinMovimientoAbierto(true)}
            variant="contained"
            startIcon={<TrendingDownIcon />}
            sx={{
              backgroundColor: '#ed6c02',
              color: '#fff',
              textTransform: 'none',
              borderRadius: '8px',
              height: '40px',
              px: 2,
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(237,108,2,0.2)',
              '&:hover': { backgroundColor: '#e65100' }
            }}
          >
            Sin Movimientos
          </Button>
          )}
        </Box>

        {/* Lado Derecho: Filtro de Fechas profesional sin colisión de bordes */}
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 0.5,
            height: '40px',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid #c4c4c4',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}
        >
          <CalendarMonthIcon sx={{ color: verdePapelitos, fontSize: 20 }} />

          {/* Campo Desde */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Typography sx={{ fontSize: '0.8rem', color: '#666', fontWeight: 600 }}>
              Desde:
            </Typography>
            <TextField
              size="small"
              type="date"
              value={fechaDesde}
              onChange={manejarCambioDesde}
              sx={{
                width: 125,
                '& .MuiOutlinedInput-root': {
                  height: '30px',
                  fontSize: '0.8rem',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '6px',
                  '& fieldset': { borderColor: '#e0e0e0' },
                  '&:hover fieldset': { borderColor: verdePapelitos }
                },
                '& input': { py: 0, px: 1 }
              }}
            />
          </Box>

          <Typography sx={{ color: '#bbb', fontWeight: 'bold' }}>—</Typography>

          {/* Campo Hasta */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Typography sx={{ fontSize: '0.8rem', color: '#666', fontWeight: 600 }}>
              Hasta:
            </Typography>
            <TextField
              size="small"
              type="date"
              value={fechaHasta}
              onChange={manejarCambioHasta}
              sx={{
                width: 125,
                '& .MuiOutlinedInput-root': {
                  height: '30px',
                  fontSize: '0.8rem',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '6px',
                  '& fieldset': { borderColor: '#e0e0e0' },
                  '&:hover fieldset': { borderColor: verdePapelitos }
                },
                '& input': { py: 0, px: 1 }
              }}
            />
          </Box>

          {(fechaDesde || fechaHasta) && (
            <Tooltip title="Limpiar fechas">
              <IconButton 
                size="small" 
                onClick={() => { setFechaDesde(''); setFechaHasta(''); setPage(0); }}
                sx={{ color: '#d32f2f', p: 0.5, ml: 0.5 }}
              >
                <ClearIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Paper>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

{/* 3. Tabla de Movimientos con Scroll Horizontal */}
      {cargando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress sx={{ color: verdePapelitos }} />
        </Box>
      ) : (
        <Paper
          elevation={3}
          sx={{
            borderRadius: '12px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
          }}
        >
        <TableContainer
          sx={{
            width: '100%',
            overflowX: 'auto' // Mantiene el scroll hacia los lados
          }}
        >
          <Table sx={{ minWidth: 1050 }}>
            <TableHead sx={{ bgcolor: verdePapelitos }}>
              <TableRow>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Nº</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>FECHA Y HORA</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>PRODUCTO</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>TIPO</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }} align="right">CANTIDAD</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>ORIGEN</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>DESTINO</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>RESPONSABLE</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>JUSTIFICACIÓN</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {listaFiltrada.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: '#777' }}>
                    No se encontraron registros de movimientos con los filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                movimientosPaginados.map((mov, index) => (
                  <TableRow key={mov.id || index} hover>
                    <TableCell sx={{ color: '#555', whiteSpace: 'nowrap' }}>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', color: '#444' }}>
                      {new Date(mov.fecha_hora).toLocaleString('es-SV')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#222', whiteSpace: 'nowrap' }}>
                      {mov.producto_nombre}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {getTipoChip(mov.tipo, mov.tipo_display)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#222', whiteSpace: 'nowrap' }}>
                      {mov.cantidad}
                    </TableCell>
                    <TableCell sx={{ color: '#555', whiteSpace: 'nowrap' }}>
                      {mov.origen_display || mov.origen}
                    </TableCell>
                    <TableCell sx={{ color: '#555', whiteSpace: 'nowrap' }}>
                      {mov.destino_display || mov.destino}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Chip
                        label={mov.responsable || 'Sin asignar'}
                        size="small"
                        sx={{ bgcolor: '#EAF4EC', color: verdePapelitos, fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 200, maxWidth: 300, color: '#666' }}>
                      {mov.justificacion || '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación (fuera del scroll horizontal para que siempre se vea completa) */}
        <TablePagination
          rowsPerPageOptions={[10, 20, 30]}
          component="div"
          count={listaFiltrada.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`}
        />
        </Paper>
      )}
      {/* 4. Llamada al Modal Modularizado (Reportes/ReporteAltaRotacion.jsx) */}
      {esAdmin && (
        <>
          <ReporteAltaRotacion
            open={modalAbierto}
            onClose={() => setModalAbierto(false)}
            movimientos={movimientos}
          />

          <ProductosSinMovimiento
            open={modalSinMovimientoAbierto}
            onClose={() => setModalSinMovimientoAbierto(false)}
          />
        </>
      )}
    </Box>
  );
};

export default Movimientos;