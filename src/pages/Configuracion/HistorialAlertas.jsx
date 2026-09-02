import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Chip, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { ENDPOINTS } from '../../services/api';

const HistorialAlertas = () => {
  const [historial, setHistorial] = useState([]);
  const navigate = useNavigate(); // Inicializamos el hook

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const response = await fetch(ENDPOINTS.ALERTAS.HISTORIAL);
        if (response.ok) {
          const data = await response.json();
          setHistorial(data);
        }
      } catch (error) {
        console.error("Error al cargar la bitácora", error);
      }
    };
    cargarHistorial();
  }, []);

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{
            color: '#1E5631',
            borderColor: '#1E5631',
            fontWeight: 'bold',
            mb: 2,
            '&:hover': { 
              backgroundColor: '#f4f7f5', 
              borderColor: '#1E5631' 
            }
          }}
        >
          Volver
        </Button>
        <Typography variant="h4" fontWeight="bold" color="#1E5631" sx={{ m: 0 }}>
          Bitácora de Alertas de Stock
        </Typography>
      </Box>

      <Paper>
        <Table>
          <TableHead sx={{ backgroundColor: '#1E5631' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha y Hora</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Producto</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Saldo al Disparar</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Estado del Envío</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {historial.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">No hay registros de alertas.</TableCell>
              </TableRow>
            ) : (
              historial.map((alerta) => (
                <TableRow key={alerta.id}>
                  <TableCell>{alerta.fecha_hora}</TableCell>
                  <TableCell>{alerta.producto_nombre}</TableCell>
                  <TableCell align="center">
                    <Typography fontWeight="bold" color="error">
                      {alerta.saldo_momento} unds.
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={alerta.notificacion_enviada ? "Enviado con éxito" : "Fallo técnico"} 
                      color={alerta.notificacion_enviada ? "success" : "error"} 
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default HistorialAlertas;