import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Box, Typography, CircularProgress, Alert, Accordion, 
    AccordionSummary, AccordionDetails, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, Paper 
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ENDPOINTS } from '../../services/api';
import BotonExportar from '../../components/BotonExportar';
import { generarPDFAgrupado } from '../../utils/pdfExport';

const ProductosSinMovimiento = ({ open, onClose }) => {
    const [reporte, setReporte] = useState({});
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;

        const obtenerReporte = async () => {
            setCargando(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(ENDPOINTS.REPORTES.SIN_MOVIMIENTO, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setReporte(data);
                    setError('');
                } else {
                    setError(`Error del servidor (${res.status}): No se pudo obtener el reporte.`);
                }
            } catch (err) {
                setError('Error de conexión con el servidor backend.');
            } finally {
                setCargando(false);
            }
        };
        obtenerReporte();
    }, [open]);

    const formatearFecha = (fecha) => {
        if (!fecha) return 'Sin registro de ingresos';
        return new Intl.DateTimeFormat('es-SV', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(new Date(fecha));
    };

    // --- LÓGICA DE EXPORTACIÓN A PDF AGRUPADO ---
    const handleExportarPDF = () => {
        const columnas = [
            { header: 'Producto', field: 'nombre' },
            { header: 'Bodega', field: 'stock_bodega' },
            { header: 'Vitrina', field: 'stock_vitrina' },
            { header: 'Total', field: 'stock_total' },
            { header: 'Última Venta', field: 'ultimo_movimiento_formateado' }
        ];

        // Preparamos los datos con la fecha ya formateada en texto plano para el PDF
        const reporteFormateado = {};
        Object.entries(reporte).forEach(([categoria, productos]) => {
            reporteFormateado[categoria] = productos.map(prod => ({
                ...prod,
                ultimo_movimiento_formateado: formatearFecha(prod.ultimo_movimiento)
            }));
        });

        generarPDFAgrupado('Reporte de Productos sin Movimiento (Últimos 3 Meses)', columnas, reporteFormateado);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ bgcolor: '#ed6c02', color: '#fff', fontWeight: 'bold' }}>
                Análisis de Productos sin Movimiento
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
                <Typography variant="subtitle1" color="textSecondary" gutterBottom sx={{ mb: 3 }}>
                    Listado de mercancía que no ha registrado salidas por ventas en los últimos 3 meses.
                </Typography>
                
                {cargando ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress sx={{ color: '#ed6c02' }} />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
                ) : Object.keys(reporte).length === 0 ? (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        Excelente. Todo el catálogo ha registrado ventas en el último trimestre.
                    </Alert>
                ) : (
                    Object.entries(reporte).map(([categoria, productos]) => (
                        <Accordion key={categoria} defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6">
                                    {categoria} ({productos.length} artículos estancados)
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                            <TableRow>
                                                <TableCell><strong>Producto</strong></TableCell>
                                                <TableCell align="center"><strong>Bodega</strong></TableCell>
                                                <TableCell align="center"><strong>Vitrina</strong></TableCell>
                                                <TableCell align="center"><strong>Total</strong></TableCell>
                                                <TableCell align="right"><strong>Última Venta Registrada</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {productos.map((prod) => (
                                                <TableRow key={prod.id}>
                                                    <TableCell>{prod.nombre}</TableCell>
                                                    <TableCell align="center">{prod.stock_bodega}</TableCell>
                                                    <TableCell align="center">{prod.stock_vitrina}</TableCell>
                                                    <TableCell align="center"><strong>{prod.stock_total}</strong></TableCell>
                                                    <TableCell align="right" sx={{ color: '#666' }}>
                                                        {formatearFecha(prod.ultimo_movimiento)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </AccordionDetails>
                        </Accordion>
                    ))
                )}
            </DialogContent>
            
            <DialogActions sx={{ p: 2, bgcolor: '#f9f9f9', display: 'flex', justifyContent: 'space-between' }}>
                <BotonExportar 
                    onExportPDF={handleExportarPDF} 
                    disabled={Object.keys(reporte).length === 0 || cargando} 
                />
                <Button onClick={onClose} variant="outlined" sx={{ color: '#555', borderColor: '#ccc' }}>
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProductosSinMovimiento;