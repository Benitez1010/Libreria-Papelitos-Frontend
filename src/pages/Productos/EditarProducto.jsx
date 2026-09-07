import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, TextField, Button, Paper, CircularProgress, Alert, Grid, MenuItem 
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ENDPOINTS } from '../../services/api';

const EditarProducto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const verdePapelitos = '#1E5631';

  // Estados
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [alerta, setAlerta] = useState({ tipo: '', mensaje: '' });
  const [categorias, setCategorias] = useState([]);
  
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    stock_minimo: 1,
  });

  // Cargar producto y categorías disponibles
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resProducto, resCategorias] = await Promise.all([
          fetch(`${ENDPOINTS.INVENTARIO.PRODUCTOS}${id}/`),
          fetch(ENDPOINTS.INVENTARIO.CATEGORIAS)
        ]);

        if (resProducto.ok) {
          const prodData = await resProducto.json();
          setFormData({
            nombre: prodData.nombre,
            categoria: prodData.categoria || '',
            stock_minimo: prodData.stock_minimo,
          });
        } else {
          setAlerta({ tipo: 'error', mensaje: 'No se pudo cargar la información del producto.' });
        }

        if (resCategorias.ok) {
          const catData = await resCategorias.json();
          setCategorias(Array.isArray(catData) ? catData : catData.results || []);
        }
      } catch (error) {
        setAlerta({ tipo: 'error', mensaje: 'Error de conexión con el servidor.' });
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlerta({ tipo: '', mensaje: '' });

    const stockMinimoNumerico = Number(formData.stock_minimo);
    if (!Number.isInteger(stockMinimoNumerico) || stockMinimoNumerico <= 0) {
      setAlerta({ tipo: 'error', mensaje: 'Ingrese una cantidad numérica válida mayor a cero' });
      return;
    }

    setGuardando(true);

    try {
      const response = await fetch(`${ENDPOINTS.INVENTARIO.PRODUCTOS}${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          categoria: formData.categoria,
          stock_minimo: stockMinimoNumerico,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAlerta({ tipo: 'success', mensaje: 'Datos del producto actualizados correctamente.' });
        setTimeout(() => navigate('/productos'), 1500);
      } else {
        // Extracción de errores específicos del backend (nombre duplicado, stock o genérico)
        let errorMsg = 'Error al guardar los cambios.';
        
        if (data.nombre) {
          errorMsg = Array.isArray(data.nombre) ? data.nombre[0] : data.nombre;
        } else if (data.stock_minimo) {
          errorMsg = Array.isArray(data.stock_minimo) ? data.stock_minimo[0] : data.stock_minimo;
        } else if (data.message) {
          errorMsg = data.message;
        } else if (data.errors) {
          const primerError = Object.values(data.errors)[0];
          errorMsg = Array.isArray(primerError) ? primerError[0] : String(primerError);
        }

        setAlerta({ tipo: 'error', mensaje: errorMsg });
      }
    } catch (error) {
      setAlerta({ tipo: 'error', mensaje: 'Error de conexión al intentar actualizar.' });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress sx={{ color: verdePapelitos }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: '800px', margin: '0 auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/productos')}
          sx={{ color: '#555' }}
        >
          Volver
        </Button>
        <Typography variant="h4" fontWeight="bold" color={verdePapelitos}>
          Editar Producto
        </Typography>
      </Box>

      {alerta.mensaje && (
        <Alert severity={alerta.tipo} sx={{ mb: 3 }}>
          {alerta.mensaje}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 4, borderRadius: '12px' }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            
            {/* Nombre del Producto */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre del Producto"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </Grid>

            {/* Selector de Categoría Editable */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Categoría"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                required
              >
                {categorias.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Configuración de Parámetro de Alerta */}
            <Grid item xs={12}>
              <Box sx={{ p: 3, backgroundColor: 'rgba(211, 47, 47, 0.05)', borderRadius: '8px', borderLeft: '4px solid #d32f2f' }}>
                <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 'bold', mb: 3, display: 'block' }}>
                  Parámetros de Alerta
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  label="Stock Mínimo Permitido"
                  name="stock_minimo"
                  value={formData.stock_minimo}
                  onChange={handleChange}
                  required
                  inputProps={{ min: "1", step: "1" }}
                  onKeyDown={(e) => {
                    if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  helperText="Define en qué cantidad el sistema debe considerar el producto en nivel crítico."
                />
              </Box>
            </Grid>

            {/* Botón de Guardado */}
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={guardando}
                startIcon={guardando ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                sx={{ backgroundColor: verdePapelitos, '&:hover': { backgroundColor: '#143d22' }, py: 1.5, px: 4 }}
              >
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </Grid>
            
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default EditarProducto;