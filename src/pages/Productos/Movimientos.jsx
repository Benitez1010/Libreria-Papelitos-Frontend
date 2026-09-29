import React, { useState, useEffect } from 'react';
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
  Tooltip
} from '@mui/material';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ClearIcon from '@mui/icons-material/Clear';
import { ENDPOINTS } from '../../services/api';

const Movimientos = () => {
  const verdePapelitos = '#1E5631';
  const azulPapelitos = '#1976d2';

  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  // Estados de filtrado
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

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
    } catch (err) {
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
        {/* Lado Izquierdo: Buscador + Tipo + Recargar */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Buscar por ID, nombre o responsable"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
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
              onChange={(e) => setFiltroTipo(e.target.value)}
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
              onChange={(e) => setFechaDesde(e.target.value)}
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
              onChange={(e) => setFechaHasta(e.target.value)}
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
                onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
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

      {/* 3. Tabla de Movimientos */}
      {cargando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress sx={{ color: verdePapelitos }} />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: verdePapelitos }}>
              <TableRow>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.85rem' }}>Nº</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.85rem' }}>FECHA Y HORA</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.85rem' }}>PRODUCTO</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.85rem' }}>TIPO</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.85rem' }} align="right">CANTIDAD</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.85rem' }}>ORIGEN</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.85rem' }}>DESTINO</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.85rem' }}>RESPONSABLE</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.85rem' }}>JUSTIFICACIÓN</TableCell>
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
                listaFiltrada.map((mov, index) => (
                  <TableRow key={mov.id || index} hover>
                    <TableCell sx={{ color: '#555' }}>{index + 1}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', color: '#444' }}>
                      {new Date(mov.fecha_hora).toLocaleString('es-SV')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#222' }}>{mov.producto_nombre}</TableCell>
                    <TableCell>{getTipoChip(mov.tipo, mov.tipo_display)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#222' }}>{mov.cantidad}</TableCell>
                    <TableCell sx={{ color: '#555' }}>{mov.origen_display || mov.origen}</TableCell>
                    <TableCell sx={{ color: '#555' }}>{mov.destino_display || mov.destino}</TableCell>
                    <TableCell>
                      <Chip
                        label={mov.responsable || 'Sin asignar'}
                        size="small"
                        sx={{ bgcolor: '#EAF4EC', color: verdePapelitos, fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#666' }}>
                      {mov.justificacion || '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default Movimientos;