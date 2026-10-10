import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Grid, Card, CardContent, 
  Tabs, Tab, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, 
  Chip, CircularProgress, Alert, List, ListItem, 
  ListItemText, ListItemAvatar, Avatar, Divider, Button, Tooltip
} from '@mui/material';

// IMPORTACIONES DE ÍCONOS INDIVIDUALES
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp'; 
import CategoryIcon from '@mui/icons-material/Category';
import ProductionQuantityLimitsIcon from '@mui/icons-material/ProductionQuantityLimits';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import BarChartIcon from '@mui/icons-material/BarChart';

import { ENDPOINTS } from '../../services/api';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const Dashboard = () => {
  const verdePapelitos = '#1E5631';
  const navigate = useNavigate();
  
  const [tabValue, setTabValue] = useState(0);
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [usuarioInfo, setUsuarioInfo] = useState(null);

  const handleTabChange = (event, newValue) => setTabValue(newValue);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      try {
        // Carga de usuario para roles
        const resUser = await fetch(`${ENDPOINTS.SEGURIDAD.LOGIN.replace('/login/', '')}/me/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        if (resUser.ok) setUsuarioInfo(await resUser.json());

        // Carga de productos
        const response = await fetch(ENDPOINTS.INVENTARIO.PRODUCTOS);
        if (response.ok) {
          const data = await response.json();
          setProductos(data);
        }

        // Carga de movimientos para métricas y gráfica en tiempo real
        const endpointMovimientos = ENDPOINTS.INVENTARIO?.MOVIMIENTOS || `${ENDPOINTS.INVENTARIO.PRODUCTOS.replace('/productos/', '')}/movimientos/`;
        const resMov = await fetch(endpointMovimientos, {
          headers: token ? { 'Authorization': `Token ${token}` } : {}
        });
        if (resMov.ok) {
          const dataMov = await resMov.json();
          const listaMov = Array.isArray(dataMov) ? dataMov : (dataMov.results || []);
          setMovimientos(listaMov);
        }
      } catch (error) {
        console.error('Error cargando los datos del dashboard', error);
      } finally {
        setCargando(false);
      }
    };
    fetchDashboardData();
  }, []); 

  // Seguridad: Solo ADMIN y BODEGA ven la reposición
  const esAdmin = usuarioInfo?.rol === 'Administrador' || usuarioInfo?.rol === 'ADMIN';
  const esBodega = usuarioInfo?.rol === 'BODEGA';
  const puedeVerReposicion = esAdmin || esBodega;

  // 1. Productos Agotados en su totalidad
  const productosAgotados = productos.filter(p => p.stock_total === 0);
  
  // 2. Alertas Críticas y en Riesgo
  const productosCriticos = productos.filter(p => p.stock_total > 0 && p.stock_total <= p.stock_minimo);
  const margenRiesgo = 5; 
  const productosEnRiesgo = productos.filter(p => p.stock_total > p.stock_minimo && p.stock_total <= (p.stock_minimo + margenRiesgo));
  const todasLasAlertas = [...productosAgotados, ...productosCriticos, ...productosEnRiesgo];
  
  // 3. Sugerencias de Traslado Interno
  const reposicionSugerida = productos.filter(p => p.stock_vitrina === 0 && p.stock_bodega > 0);

  // 4. Estadísticas Generales
  const totalCategorias = new Set(productos.map(p => p.categoria_nombre)).size;
  const top5MenorStock = [...productos].sort((a, b) => a.stock_total - b.stock_total).slice(0, 5);

  // 5. Contador de movimientos hoy
  const hoyISO = new Date().toISOString().slice(0, 10);
  const movimientosHoy = movimientos.filter(m => (m.fecha_hora || m.fecha || m.created_at || '').startsWith(hoyISO)).length;

  const formatearEtiquetaMes = (fecha) => {
    const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const mes = meses[fecha.getMonth()];
    const anio = fecha.getFullYear();
    return `${mes} ${anio}`;
  };

  // 6. Gráfica mensual dinámica y auto-acoplable (1 a máximo 3 meses reales)
  const datosGrafica = useMemo(() => {
    const mapaMeses = {};

    if (movimientos && movimientos.length > 0) {
      movimientos.forEach(m => {
        const fechaStr = m.fecha_hora || m.fecha || m.created_at;
        if (fechaStr) {
          const f = new Date(fechaStr);
          if (!isNaN(f)) {
            const claveMes = `${f.getFullYear()}-${String(f.getMonth()).padStart(2, '0')}`;
            if (!mapaMeses[claveMes]) {
              mapaMeses[claveMes] = {
                orden: f.getTime(),
                mes: formatearEtiquetaMes(f),
                entradas: 0,
                salidas: 0
              };
            }

            const tipo = (m.tipo || m.tipo_movimiento || '').toLowerCase();
            const cantidad = Number(m.cantidad) || 0;

            if (tipo.includes('salida') || tipo.includes('despacho') || tipo.includes('venta')) {
              mapaMeses[claveMes].salidas += cantidad;
            } else {
              mapaMeses[claveMes].entradas += cantidad;
            }
          }
        }
      });
    }

    // Ordenar cronológicamente y tomar máximo los últimos 3 meses reales que contengan actividad
    let mesesOrdenados = Object.values(mapaMeses)
      .sort((a, b) => a.orden - b.orden)
      .slice(-3);

    // Si aún no hay movimientos en la BD, mostrar el mes actual en blanco
    if (mesesOrdenados.length === 0) {
      const ahora = new Date();
      mesesOrdenados = [{
        mes: formatearEtiquetaMes(ahora),
        entradas: 0,
        salidas: 0
      }];
    }

    return mesesOrdenados;
  }, [movimientos]);

  // Cálculo de escala del eje Y y líneas divisorias
  const maxTotal = Math.max(...datosGrafica.map(d => Math.max(d.entradas, d.salidas)), 5);
  const valorMaximo = Math.ceil(maxTotal / 5) * 5;
  const lineasEjeY = [valorMaximo, Math.round(valorMaximo * 0.66), Math.round(valorMaximo * 0.33), 0];

  // Ajuste dinámico de ancho de barras según la cantidad de meses visibles
  const anchoBarra = datosGrafica.length === 1 
    ? { xs: 36, sm: 54, md: 65 }   // 1 solo mes: barra grandota y sólida
    : datosGrafica.length === 2 
      ? { xs: 26, sm: 40, md: 48 } // 2 meses: barras medianas y amplias
      : { xs: 18, sm: 28, md: 34 }; // 3 meses: balance perfecto

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress sx={{ color: verdePapelitos }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, color: verdePapelitos }}>
        Panel Principal
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          sx={{ 
            '& .MuiTabs-indicator': { backgroundColor: verdePapelitos }, 
            '& .Mui-selected': { color: verdePapelitos, fontWeight: 'bold' }
          }}
        >
          <Tab label="Resumen Operativo" />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Alertas de Compra
                {todasLasAlertas.length > 0 && (
                  <Chip label={todasLasAlertas.length} size="small" color={productosCriticos.length > 0 || productosAgotados.length > 0 ? "error" : "warning"} sx={{ height: 20, fontWeight: 'bold' }} />
                )}
              </Box>
            } 
          />
          {puedeVerReposicion && (
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Reposición Interna
                  {reposicionSugerida.length > 0 && (
                    <Chip label={reposicionSugerida.length} size="small" color="info" sx={{ height: 20, fontWeight: 'bold' }} />
                  )}
                </Box>
              } 
            />
          )}
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ boxShadow: 2, borderRadius: 2, borderLeft: `5px solid ${verdePapelitos}` }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <InventoryIcon sx={{ fontSize: 45, color: verdePapelitos }} />
                <Box>
                  <Typography co  lor="textSecondary" variant="body2" fontWeight="bold">TOTAL PRODUCTOS</Typography>
                  <Typography variant="h5" fontWeight="bold">{productos.length}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ boxShadow: 2, borderRadius: 2, borderLeft: '5px solid #0288d1' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CategoryIcon sx={{ fontSize: 45, color: '#0288d1' }} />
                <Box>
                  <Typography color="textSecondary" variant="body2" fontWeight="bold">CATEGORÍAS</Typography>
                  <Typography variant="h5" fontWeight="bold">{totalCategorias}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ boxShadow: 2, borderRadius: 2, borderLeft: '5px solid #d32f2f' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ProductionQuantityLimitsIcon sx={{ fontSize: 45, color: '#d32f2f' }} />
                <Box>
                  <Typography color="textSecondary" variant="body2" fontWeight="bold">AGOTADOS TOTALES</Typography>
                  <Typography variant="h5" fontWeight="bold" color="#d32f2f">{productosAgotados.length}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ boxShadow: 2, borderRadius: 2, borderLeft: '5px solid #ed6c02' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUpIcon sx={{ fontSize: 45, color: '#ed6c02' }} />
                <Box>
                  <Typography color="textSecondary" variant="body2" fontWeight="bold">MOVIMIENTOS HOY</Typography>
                  <Typography variant="h5" fontWeight="bold" color="#ed6c02">
                    {movimientosHoy > 0 ? movimientosHoy : (movimientos.length > 0 ? movimientos.length : 0)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#424242', display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningAmberIcon sx={{ color: '#ed6c02' }} /> Top 5: Menor Disponibilidad
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List disablePadding>
                {top5MenorStock.length > 0 ? top5MenorStock.map((prod, index) => (
                  <React.Fragment key={prod.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: prod.stock_total === 0 ? '#ffebee' : '#fff3e0', color: prod.stock_total === 0 ? '#d32f2f' : '#ed6c02' }}>
                          {prod.stock_total}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={<Typography fontWeight="bold">{prod.nombre}</Typography>} 
                        secondary={`${prod.categoria_nombre} | Stock Mínimo: ${prod.stock_minimo}`} 
                      />
                    </ListItem>
                    {index !== top5MenorStock.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                )) : (
                  <Typography color="textSecondary">No hay productos registrados.</Typography>
                )}
              </List>
            </Paper>
          </Grid>

          {/* Gráfica de Movimientos Auto-acoplable */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#424242', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BarChartIcon sx={{ color: verdePapelitos }} /> Gráfica de Movimientos
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: verdePapelitos, borderRadius: '3px' }} />
                    <Typography variant="caption" fontWeight="bold" sx={{ color: '#424242' }}>Entradas</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: '#ed6c02', borderRadius: '3px' }} />
                    <Typography variant="caption" fontWeight="bold" sx={{ color: '#424242' }}>Salidas</Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Contenedor relativo con líneas guía de fondo */}
              <Box sx={{ position: 'relative', height: 210, width: '100%', mt: 1 }}>
                
                {/* Líneas horizontales divisorias con valores del eje Y */}
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 25, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                  {lineasEjeY.map((val, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography variant="caption" sx={{ width: 26, color: '#9e9e9e', fontSize: '0.68rem', textAlign: 'right', pr: 0.8, fontWeight: 'medium' }}>
                        {val}
                      </Typography>
                      <Box sx={{ flexGrow: 1, borderBottom: i === lineasEjeY.length - 1 ? '1.5px solid #e0e0e0' : '1px dashed #e8e8e8' }} />
                    </Box>
                  ))}
                </Box>

                {/* Área de barras auto-acoplables */}
                <Box sx={{ 
                  position: 'absolute', top: 0, left: 32, right: 0, bottom: 0, 
                  display: 'flex', alignItems: 'flex-end', 
                  justifyContent: datosGrafica.length === 1 ? 'center' : 'space-around', 
                  gap: datosGrafica.length === 1 ? 0 : 3 
                }}>
                  {datosGrafica.map((item, idx) => {
                    const altoEntradas = valorMaximo > 0 ? (item.entradas / valorMaximo) * 100 : 0;
                    const altoSalidas = valorMaximo > 0 ? (item.salidas / valorMaximo) * 100 : 0;

                    return (
                      <Box 
                        key={idx} 
                        sx={{ 
                          width: datosGrafica.length === 1 ? '50%' : 'auto',
                          flex: datosGrafica.length === 1 ? 'none' : 1, 
                          display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' 
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: { xs: 1, sm: 2 }, width: '100%', height: '82%', justifyContent: 'center' }}>
                          
                          {/* Barra Entrada (Verde Papelitos) */}
                          <Tooltip title={`Entradas: ${item.entradas} unidades`} arrow>
                            <Box sx={{
                              width: anchoBarra,
                              height: item.entradas > 0 ? `${Math.max(6, altoEntradas)}%` : '3px',
                              bgcolor: item.entradas > 0 ? verdePapelitos : '#e0e0e0',
                              borderRadius: '5px 5px 0 0',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: item.entradas > 0 ? '#143d22' : '#bdbdbd' }
                            }} />
                          </Tooltip>

                          {/* Barra Salida (Naranja / Ámbar) */}
                          <Tooltip title={`Salidas / Despachos: ${item.salidas} unidades`} arrow>
                            <Box sx={{
                              width: anchoBarra,
                              height: item.salidas > 0 ? `${Math.max(6, altoSalidas)}%` : '3px',
                              bgcolor: item.salidas > 0 ? '#ed6c02' : '#e0e0e0',
                              borderRadius: '5px 5px 0 0',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: item.salidas > 0 ? '#b24f00' : '#bdbdbd' }
                            }} />
                          </Tooltip>
                        </Box>
                        
                        <Typography variant="caption" sx={{ mt: 1.5, fontWeight: 'bold', color: '#424242', fontSize: '0.85rem' }}>
                          {item.mes}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 1, borderTop: '1px solid #f0f0f0' }}>
                <Typography variant="caption" color="textSecondary">
                  Conexión activa con historial de movimientos
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => navigate('/movimientos')} 
                  sx={{ color: verdePapelitos, fontWeight: 'bold', textTransform: 'none', fontSize: '0.8rem' }}
                >
                  Ver Auditoría →
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {productosCriticos.length > 0 && (
            <Alert severity="error">
              <strong>Prioridad Alta (Rojo):</strong> Existen productos que han alcanzado su límite mínimo o están agotados. Se requiere compra inmediata.
            </Alert>
          )}
          {productosEnRiesgo.length > 0 && (
            <Alert severity="warning">
              <strong>Prioridad Media (Naranja):</strong> Existen productos acercándose a su stock mínimo (Umbral de 5 unidades). Vigilar inventario.
            </Alert>
          )}
        </Box>
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: '12px' }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>CÓDIGO</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>PRODUCTO</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>CATEGORÍA</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>MÍNIMO PERMITIDO</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>STOCK ACTUAL</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>ESTADO</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {todasLasAlertas.length > 0 ? (
                todasLasAlertas.sort((a, b) => a.stock_total - b.stock_total).map((producto) => {
                  let estadoTexto = producto.stock_total === 0 ? "Agotado" : (producto.stock_total <= producto.stock_minimo ? "Crítico" : "En Riesgo");
                  let estadoColor = producto.stock_total === 0 ? "error" : (producto.stock_total <= producto.stock_minimo ? "error" : "warning");
                  return (
                    <TableRow key={producto.id} hover>
                      <TableCell sx={{ color: 'text.secondary' }}>#{producto.id}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{producto.nombre}</TableCell>
                      <TableCell>{producto.categoria_nombre}</TableCell>
                      <TableCell align="center">{producto.stock_minimo}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: estadoColor === 'error' ? '#d32f2f' : '#ed6c02' }}>
                        {producto.stock_total}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={estadoTexto} color={estadoColor} size="small" sx={{ fontWeight: 'bold' }} />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <NotificationsActiveIcon sx={{ fontSize: 50, color: '#a5d6a7', mb: 1 }} />
                    <Typography variant="subtitle1" color="textSecondary">Todo en orden.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {puedeVerReposicion && (
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3 }}>
            <Alert severity="info" icon={<StorefrontIcon fontSize="inherit" />}>
              <strong>Oportunidad de Ventas:</strong> Productos agotados en vitrina pero disponibles en bodega.
            </Alert>
          </Box>
          <TableContainer component={Paper} elevation={3} sx={{ borderRadius: '12px' }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#e3f2fd' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#0277bd' }}>PRODUCTO</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#0277bd' }}>STOCK EN VITRINA</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#0277bd' }}>DISPONIBLE EN BODEGA</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#0277bd' }}>ACCIÓN RECOMENDADA</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reposicionSugerida.map((producto) => (
                  <TableRow key={producto.id} hover>
                    <TableCell><Typography fontWeight="bold">{producto.nombre}</Typography></TableCell>
                    <TableCell align="center"><Chip label="Agotado" color="error" size="small" variant="outlined" /></TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#1E5631' }}>{producto.stock_bodega} unidades</TableCell>
                    <TableCell align="center">
                      <Button variant="contained" size="small" startIcon={<SyncAltIcon />} onClick={() => navigate('/inventario/movimiento?contexto=traslado')} sx={{ backgroundColor: '#0288d1', textTransform: 'none', borderRadius: '8px' }}>
                        Hacer Traslado
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      )}
    </Box>
  );
};

export default Dashboard;