import React, { useState, useEffect } from 'react';

export default function ReporteExistencias() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Normaliza API_BASE eliminando barras al final si existen para evitar //
  const rawApi = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const API_BASE = rawApi.replace(/\/+$/, '');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {})
    };
  };

  useEffect(() => {
    // Cargar categorías para el filtro
    fetch(`${API_BASE}/categorias/`, { headers: getHeaders() })
      .then(res => res.ok ? res.json() : [])
      .then(data => setCategorias(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error al cargar categorías:', err));
  }, []);

  const cargarReporte = () => {
    setCargando(true);
    setError(null);
    const query = categoriaSeleccionada === 'todas' ? '' : `?categoria=${categoriaSeleccionada}`;
    
    fetch(`${API_BASE}/reportes/existencias-ubicacion/${query}`, { headers: getHeaders() })
      .then(res => {
        if (!res.ok) throw new Error('Error al consultar existencias');
        return res.json();
      })
      .then(data => {
        setProductos(Array.isArray(data) ? data : []);
        setCargando(false);
      })
      .catch(err => {
        setError(err.message);
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarReporte();
  }, [categoriaSeleccionada]);

  const totalBodega = productos.reduce((sum, p) => sum + (p.stock_bodega || 0), 0);
  const totalVitrina = productos.reduce((sum, p) => sum + (p.stock_vitrina || 0), 0);
  const totalConsolidado = productos.reduce((sum, p) => sum + (p.total_consolidado || 0), 0);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f4f6f8', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ color: '#1E5631', fontSize: '24px', margin: 0, fontWeight: 'bold' }}>
          Control de Inventario - Existencias por Ubicación
        </h1>
        <p style={{ color: '#555', marginTop: '6px', fontSize: '14px' }}>
          Separación física de existencias en Bodega y Vitrina con balance consolidado.
        </p>
      </div>

      {/* Barra de Filtro */}
      <div style={{
        backgroundColor: '#fff',
        padding: '16px 20px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <label style={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>Filtrar por Categoría:</label>
        <select
          value={categoriaSeleccionada}
          onChange={(e) => setCategoriaSeleccionada(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            minWidth: '220px',
            fontSize: '14px',
            outline: 'none'
          }}
        >
          <option value="todas">Todas las categorías</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
          ))}
        </select>
        <button
          onClick={cargarReporte}
          style={{
            backgroundColor: '#1E5631',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Recargar
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fed7d7', color: '#9b2c2c', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Tabla del Reporte */}
      <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#1E5631', color: '#fff', fontSize: '13px', textTransform: 'uppercase' }}>
              <th style={{ padding: '14px 16px' }}>ID</th>
              <th style={{ padding: '14px 16px' }}>Nombre del Producto</th>
              <th style={{ padding: '14px 16px' }}>Categoría</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>Saldo en Bodega</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>Saldo en Vitrina</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>Total Consolidado</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>Generando reporte...</td>
              </tr>
            ) : productos.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>No hay registros para mostrar.</td>
              </tr>
            ) : (
              productos.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #edf2f7', fontSize: '14px' }}>
                  <td style={{ padding: '12px 16px', color: '#718096' }}>#{p.id}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>{p.nombre}</td>
                  <td style={{ padding: '12px 16px', color: '#4a5568' }}>{p.categoria_nombre}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 'bold', color: '#2b6cb0' }}>{p.stock_bodega}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 'bold', color: '#2f855a' }}>{p.stock_vitrina}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 'bold', color: '#1a202c' }}>{p.total_consolidado}</td>
                </tr>
              ))
            )}
          </tbody>
          {productos.length > 0 && !cargando && (
            <tfoot>
              <tr style={{ backgroundColor: '#f7fafc', fontWeight: 'bold', borderTop: '2px solid #e2e8f0', fontSize: '14px' }}>
                <td colSpan="3" style={{ padding: '14px 16px', textAlign: 'right' }}>TOTAL CONSOLIDADO:</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: '#2b6cb0' }}>{totalBodega}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: '#2f855a' }}>{totalVitrina}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: '#1a202c' }}>{totalConsolidado}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}