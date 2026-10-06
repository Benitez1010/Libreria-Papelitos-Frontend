import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  IconButton,
  Alert
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import StarIcon from '@mui/icons-material/Star';
import CloseIcon from '@mui/icons-material/Close';

const ReporteAltaRotacion = ({ open, onClose, movimientos = [] }) => {
  const verdePapelitos = '#1E5631';

  // Fechas por defecto: últimos 30 días
  const hoy = new Date().toISOString().split('T')[0];
  const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [fechaDesde, setFechaDesde] = useState(hace30Dias);
  const [fechaHasta, setFechaHasta] = useState(hoy);
  const [datosRanking, setDatosRanking] = useState([]);
  const [errorFecha, setErrorFecha] = useState('');

  // Lógica de cálculo: agrupa salidas por producto y las ordena de mayor a menor
  const procesarAltaRotacion = (desde, hasta) => {
    if (desde && hasta && hasta < desde) {
      setErrorFecha('La fecha "Hasta" no puede ser anterior a la fecha "Desde".');
      return;
    }
    setErrorFecha('');

    const salidasEnRango = movimientos.filter((m) => {
      if (m.tipo !== 'SALIDA') return false;
      const dia = m.fecha_hora ? m.fecha_hora.split('T')[0] : '';
      let okDesde = true;
      let okHasta = true;
      if (desde) okDesde = dia >= desde;
      if (hasta) okHasta = dia <= hasta;
      return okDesde && okHasta;
    });

    const conteo = {};
    salidasEnRango.forEach((m) => {
      const nombre = m.producto_nombre || 'Sin nombre';
      conteo[nombre] = (conteo[nombre] || 0) + Number(m.cantidad || 0);
    });

    const lista = Object.entries(conteo)
      .map(([producto, total_salidas]) => ({ producto, total_salidas }))
      .sort((a, b) => b.total_salidas - a.total_salidas)
      .map((item, idx) => ({ ...item, ranking: idx + 1 }));

    setDatosRanking(lista);
  };

  useEffect(() => {
    if (open) {
      procesarAltaRotacion(fechaDesde, fechaHasta);
    }
  }, [open, movimientos]);

  // Si se cambia la fecha "Desde", ajusta "Hasta" automáticamente si queda desfasada
  const handleCambioDesde = (nuevaFechaDesde) => {
    setFechaDesde(nuevaFechaDesde);
    if (fechaHasta && fechaHasta < nuevaFechaDesde) {
      setFechaHasta(nuevaFechaDesde);
    }
  };

  const handleGenerarReporte = () => {
    procesarAltaRotacion(fechaDesde, fechaHasta);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TrendingUpIcon sx={{ color: verdePapelitos, fontSize: 32 }} />
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ color: verdePapelitos }}>
              Reporte: Productos con Mayor Demanda y Rotación
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Análisis de unidades despachadas para compras y reabastecimiento estratégico
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Barra de Filtro de Fechas dentro del Reporte */}
        <Paper elevation={0} sx={{ p: 2, bgcolor: '#fbfbfb', border: '1px solid #e0e0e0', borderRadius: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Desde"
                value={fechaDesde}
                onChange={(e) => handleCambioDesde(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Hasta"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                InputLabelProps={{ shrink: true }}
                // Bloquea en el selector del calendario los días anteriores a 'Desde'
                inputProps={{
                  min: fechaDesde || undefined
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<FilterAltIcon />}
                onClick={handleGenerarReporte}
                sx={{
                  bgcolor: verdePapelitos,
                  textTransform: 'none',
                  fontWeight: 'bold',
                  height: '40px',
                  '&:hover': { bgcolor: '#143c22' }
                }}
              >
                Generar Reporte
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {errorFecha && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorFecha}
          </Alert>
        )}

        {datosRanking.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            No se encontraron registros de salidas (despachos) en el rango de fechas seleccionado.
          </Alert>
        ) : (
          <>
            {/* Tarjeta del Producto Top 1 */}
            <Card sx={{ bgcolor: '#f4fbf7', border: `1.5px solid ${verdePapelitos}`, borderRadius: 2, mb: 3 }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StarIcon sx={{ color: '#d32f2f', fontSize: 20 }} />
                  <Typography variant="caption" sx={{ color: verdePapelitos, fontWeight: 'bold', textTransform: 'uppercase' }}>
                    Líder en Demanda Estacional
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#222', mt: 0.5 }}>
                  {datosRanking[0].producto}
                </Typography>
                <Typography variant="body2" sx={{ color: '#555' }}>
                  Total despachado: <strong style={{ color: verdePapelitos, fontSize: '1.05rem' }}>{datosRanking[0].total_salidas} unidades</strong>
                </Typography>
              </CardContent>
            </Card>

            {/* Tabla de Ranking Ordenada */}
            <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: verdePapelitos }}>
                  <TableRow>
                    <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold' }}>RANKING</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>PRODUCTO</TableCell>
                    <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold' }}>UNIDADES DESPACHADAS</TableCell>
                    <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold' }}>NIVEL DE ROTACIÓN</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datosRanking.map((item) => (
                    <TableRow key={item.ranking} hover>
                      <TableCell align="center" sx={{ fontWeight: 'bold', color: verdePapelitos }}>
                        #{item.ranking}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{item.producto}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                        {item.total_salidas}
                      </TableCell>
                      <TableCell align="center">
                        {item.ranking === 1 ? (
                          <Chip size="small" label="Líder en Demanda" sx={{ bgcolor: '#fde8e8', color: '#d32f2f', fontWeight: 'bold' }} />
                        ) : item.ranking <= 3 ? (
                          <Chip size="small" label="Alta Demanda" sx={{ bgcolor: '#fff4e5', color: '#ed6c02', fontWeight: 'bold' }} />
                        ) : (
                          <Chip size="small" label="Rotación Regular" sx={{ bgcolor: '#f0f0f0', color: '#555' }} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ color: '#666', textTransform: 'none', fontWeight: 'bold' }}>
          Cerrar Vista
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReporteAltaRotacion;