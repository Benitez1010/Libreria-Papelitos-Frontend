import React from 'react';
import { Snackbar, Alert, Typography, Box } from '@mui/material';

//Alerta que se muestra cuando el stock de un producto llega a un nivel crítico.
const AlertaStockCritico = ({ open, onClose, productos, notificaciones = [] }) => {
  const enviadas = notificaciones.filter(estado => estado === 'enviada').length;
  const desactivadas = notificaciones.filter(estado => estado === 'desactivada').length;
  let mensajeCorreo = 'No se confirmó el envío de correo para esta alerta.';
  if (notificaciones.length > 0 && desactivadas === notificaciones.length) {
    mensajeCorreo = 'No se enviaron correos porque las alertas globales están desactivadas.';
  } else if (notificaciones.length > 0 && enviadas === notificaciones.length) {
    mensajeCorreo = 'Se enviaron las alertas por correo a los destinatarios activos.';
  } else if (enviadas > 0) {
    mensajeCorreo = 'Se enviaron algunas alertas por correo, pero otras no se enviaron.';
  }

  return (
    <Snackbar 
      open={open} 
      autoHideDuration={8000} 
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      {/* Usamos 'error' para que salga en un rojo intenso de advertencia */}
      <Alert 
        onClose={onClose} 
        severity="error" 
        variant="filled" 
        sx={{ width: '100%', boxShadow: 3, borderRadius: '8px' }}
      >
        <Typography variant="subtitle2" fontWeight="bold">
          ¡ALERTA DE REABASTECIMIENTO!
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          El stock ha llegado al nivel crítico en los siguientes productos:
        </Typography>
        
        <ul style={{ margin: '4px 0 12px 0', paddingLeft: '20px' }}>
          {productos.map((prod, index) => (
            <li key={index}><strong>{prod}</strong></li>
          ))}
        </ul>

        {/* Nuevo bloque visual para confirmar la acción en segundo plano */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mt: 1, 
          pt: 1, 
          borderTop: '1px solid rgba(255, 255, 255, 0.4)' // Línea sutil divisoria
        }}>
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 500 }}>
            {mensajeCorreo}
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default AlertaStockCritico;