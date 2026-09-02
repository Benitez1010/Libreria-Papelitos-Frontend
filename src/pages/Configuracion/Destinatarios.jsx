import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, TextField, Button, Table, TableBody, 
  TableCell, TableHead, TableRow, Switch, IconButton, Alert 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import HistoryIcon from '@mui/icons-material/History';
import { useNavigate } from 'react-router-dom';
import { ENDPOINTS } from '../../services/api';

const Destinatarios = () => {
  const [destinatarios, setDestinatarios] = useState([]);
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const navigate = useNavigate();

  const obtenerDestinatarios = async () => {
    try {
      const response = await fetch(ENDPOINTS.ALERTAS.DESTINATARIOS);
      if (response.ok) {
        const data = await response.json();
        setDestinatarios(data);
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al cargar destinatarios.' });
    }
  };

  useEffect(() => {
    obtenerDestinatarios();
  }, []);

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
        obtenerDestinatarios();
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
      obtenerDestinatarios();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al actualizar el estado.' });
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este correo?")) return;
    try {
      await fetch(`${ENDPOINTS.ALERTAS.DESTINATARIOS}${id}/`, { method: 'DELETE' });
      obtenerDestinatarios();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al eliminar.' });
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="#1E5631">
          Destinatarios de Alertas
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
            marginLeft: 'auto', // Fuerza el empuje a la derecha
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
                  <IconButton onClick={() => handleEliminar(dest.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default Destinatarios;