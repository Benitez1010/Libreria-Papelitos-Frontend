import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, CircularProgress, Chip, Alert 
} from '@mui/material';
import LockClockIcon from '@mui/icons-material/LockClock';


const BitacoraBloqueo = () => {
  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

const cargarBitacora = async () => {
    try {
      const token = localStorage.getItem('token');
      // URL corregida a la ruta real de Django
      const res = await fetch('http://127.0.0.1:8000/api/bitacora-bloqueo/', {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        setError('');
      } else {
        console.error("Error backend status:", res.status);
        setError(`Error del servidor (${res.status}): No se pudieron obtener los registros.`);
      }
    } catch (err) {
      console.error("Error de conexión:", err);
      setError('Error de conexión con el servidor. Verifica que Django esté encendido.');
    } finally {
      setCargando(false);
    }
  };
  
  useEffect(() => {
    cargarBitacora();
  }, []);

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <LockClockIcon sx={{ fontSize: 40, color: '#009F4D' }} />
        <Typography variant="h4" fontWeight="bold">
          Bitácora de Bloqueos
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {cargando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress color="success" />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#1E5631' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: '#ffffff' }}>Nº</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#ffffff' }}>Usuario</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#ffffff' }}>Evento Registrado</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#ffffff' }}>Fecha y Hora</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#666' }}>
                    No hay incidentes de bloqueo registrados en el sistema.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, index) => {
                  const esBloqueoTotal = log.evento.toLowerCase().includes('bloqueo');
                  return (
                    <TableRow key={log.id || index} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography fontWeight="bold">{log.usuario}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={log.evento} 
                          color={esBloqueoTotal ? "error" : "warning"} 
                          size="small" 
                          variant="outlined" 
                        />
                      </TableCell>
                      <TableCell>{log.fecha_hora}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default BitacoraBloqueo;