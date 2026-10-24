import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, TextField, Button, Table, TableBody, 
  TableCell, TableHead, TableRow, Switch, IconButton, Alert,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  FormControlLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import HistoryIcon from '@mui/icons-material/History';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import { useNavigate } from 'react-router-dom';
import { ENDPOINTS } from '../../services/api';

const Destinatarios = () => {
  const [destinatarios, setDestinatarios] = useState([]);
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  // Nuevo estado para la configuración maestra
  const [alertasGlobales, setAlertasGlobales] = useState(true);
  
  // Estados para controlar el modal de confirmación
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [destinatarioAEliminar, setDestinatarioAEliminar] = useState(null);

  const navigate = useNavigate();

  const cargarDatos = async () => {
    try {
      // Cargamos tanto la lista de correos como el interruptor maestro en paralelo
      const [resDestinatarios, resConfig] = await Promise.all([
        fetch(ENDPOINTS.ALERTAS.DESTINATARIOS),
        fetch(ENDPOINTS.ALERTAS.CONFIGURACION)
      ]);

      if (resDestinatarios.ok) {
        const data = await resDestinatarios.json();
        setDestinatarios(data);
      }
      if (resConfig.ok) {
        const configData = await resConfig.json();
        setAlertasGlobales(configData.notificaciones_globales_activas);
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al cargar los datos del servidor.' });
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Interruptor 
  const handleToggleGlobal = async () => {
    const nuevoEstado = !alertasGlobales;
    try {
      const response = await fetch(ENDPOINTS.ALERTAS.CONFIGURACION, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificaciones_globales_activas: nuevoEstado }),
      });
      if (response.ok) {
        setAlertasGlobales(nuevoEstado);
        setMensaje({ 
          tipo: nuevoEstado ? 'success' : 'warning', 
          texto: `Las notificaciones globales han sido ${nuevoEstado ? 'ACTIVADAS' : 'DESACTIVADAS'}.` 
        });
        
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error de red al actualizar la configuración global.' });
    }
  };

  const handleAgregar = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(ENDPOINTS.ALERTAS.DESTINATARIOS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: nuevoCorreo, activo: true }),
      });
      const data = await response.json();
      
      if (response.ok) {
        setMensaje({ tipo: 'success', texto: data.mensaje || 'Destinatario agregado.' });
        setNuevoCorreo('');
        cargarDatos();
      } else {
        setMensaje({ tipo: 'error', texto: 'Este correo ya está registrado o es inválido.' });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error de red.' });
    }
  };

  const handleToggleActivo = async (id, estadoActual) => {
    try {
      await fetch(`${ENDPOINTS.ALERTAS.DESTINATARIOS}${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !estadoActual }),
      });
      cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al actualizar el estado.' });
    }
  };

  const solicitarEliminacion = (id) => {
    setDestinatarioAEliminar(id);
    setDialogoAbierto(true);
  };

  const cancelarEliminacion = () => {
    setDialogoAbierto(false);
    setDestinatarioAEliminar(null);
  };

  const confirmarEliminacion = async () => {
    try {
      const response = await fetch(`${ENDPOINTS.ALERTAS.DESTINATARIOS}${destinatarioAEliminar}/`, { method: 'DELETE' });
      const data = await response.json(); 
      
      if (response.ok) {
        setMensaje({ tipo: 'success', texto: data.message });
        cargarDatos();
      } else {
        setMensaje({ tipo: 'error', texto: data.message || 'Error al eliminar.' });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error de red al intentar eliminar.' });
    } finally {
      setDialogoAbierto(false);
      setDestinatarioAEliminar(null);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="#1E5631">
          Configuración de Alertas
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<HistoryIcon />}
          onClick={() => navigate('/historial-alertas')}
          sx={{ 
            backgroundColor: '#ffffff', 
            color: '#1E5631',
            border: '2px solid #1E5631',
            fontWeight: 'bold',
            boxShadow: 'none',
            marginLeft: 'auto',
            '&:hover': { 
              backgroundColor: '#f4f7f5',
              boxShadow: 'none',
            }
          }}
        >
          Ver Historial
        </Button>
      </Box>

      {mensaje.texto && (
        <Alert severity={mensaje.tipo} sx={{ mb: 3 }}>{mensaje.texto}</Alert>
      )}

      {/* --- PANEL DE CONTROL MAESTRO --- */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, mb: 4, 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: alertasGlobales ? '#f4fbf7' : '#fff3f3',
          border: `2px solid ${alertasGlobales ? '#4caf50' : '#ef5350'}`,
          borderRadius: '12px'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {alertasGlobales ? 
            <NotificationsActiveIcon sx={{ color: '#4caf50', fontSize: 40 }} /> : 
            <NotificationsOffIcon sx={{ color: '#ef5350', fontSize: 40 }} />
          }
          <Box>
            <Typography variant="h6" fontWeight="bold" color={alertasGlobales ? '#2e7d32' : '#c62828'}>
              Envío Automático de Alertas
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {alertasGlobales 
                ? "El sistema evaluará el stock y enviará notificaciones por correo de forma activa."
                : "Las alertas están pausadas globalmente. No se enviará ningún correo hasta reactivar el servicio."}
            </Typography>
          </Box>
        </Box>
        <FormControlLabel
          control={
            <Switch 
              checked={alertasGlobales} 
              onChange={handleToggleGlobal} 
              color={alertasGlobales ? "success" : "error"}
              sx={{ transform: 'scale(1.3)' }}
            />
          }
          label=""
        />
      </Paper>

      <Typography variant="h6" fontWeight="bold" color="#1E5631" sx={{ mb: 2 }}>
        Directorio de Destinatarios
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleAgregar} style={{ display: 'flex', gap: '16px' }}>
          <TextField
            label="Nuevo Correo Electrónico"
            type="email"
            value={nuevoCorreo}
            onChange={(e) => setNuevoCorreo(e.target.value)}
            required
            fullWidth
            size="small"
          />
          <Button variant="contained" type="submit" sx={{ backgroundColor: '#1E5631', minWidth: '160px' }}>
            Añadir y Probar
          </Button>
        </form>
      </Paper>

      <Paper>
        <Table>
          <TableHead sx={{ backgroundColor: '#1E5631' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Correo</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Recibir Alertas (Activo)</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {destinatarios.map((dest) => (
              <TableRow key={dest.id}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <EmailIcon color="action" /> {dest.correo}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Switch 
                    checked={dest.activo} 
                    onChange={() => handleToggleActivo(dest.id, dest.activo)} 
                    color="success"
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => solicitarEliminacion(dest.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* ========== MODAL DE CONFIRMACIÓN DE ELIMINACIÓN ========== */}
      <Dialog 
        open={dialogoAbierto} 
        onClose={cancelarEliminacion}
        PaperProps={{
          sx: { borderRadius: '12px', padding: '8px' }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#1E5631', fontSize: '1.25rem' }}>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#37474F' }}>
            ¿Estás seguro de que deseas eliminar este correo de la lista de destinatarios? 
            Esta dirección dejará de recibir alertas de stock crítico de forma permanente.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ paddingX: 3, paddingBottom: 2 }}>
          <Button 
            onClick={cancelarEliminacion} 
            sx={{ color: '#555', fontWeight: 'bold', textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={confirmarEliminacion} 
            variant="contained" 
            color="error"
            sx={{ fontWeight: 'bold', textTransform: 'none', borderRadius: '8px' }}
          >
            Eliminar Correo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Destinatarios;