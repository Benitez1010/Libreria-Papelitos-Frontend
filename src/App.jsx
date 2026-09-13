import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import Usuarios from './pages/Usuarios/Usuarios';
import RutaPrivada from './components/RutaPrivada';
import Login from './pages/Login/Login';
import RecuperarPassword from './pages/Login/RecuperarPassword';
import RestablecerPassword from './pages/Login/RestablecerPassword';
import EditarCategoria from './pages/Categorias/EditarCategoria'; 
import Categorias from './pages/Categorias/Categorias';
import UsuarioAcceso from './pages/Configuracion/UsuarioAcceso';
import AccesoRol from './pages/Configuracion/AccesoRol';
import ProtectorRuta from './components/ProtectorRuta'; // Ajusta la ruta si es necesario
import ControlInactividad from './components/ControlInactividad';
import RegistrarMovimiento from './pages/Productos/RegistrarMovimiento';
import ListaProductos from './pages/Productos/ListaProductos';
import EditarProducto from './pages/Productos/EditarProducto';
import Destinatarios from './pages/Configuracion/Destinatarios'; // Importa el componente Destinatarios
import HistorialAlertas from './pages/Configuracion/HistorialAlertas'; // Importa el componente HistorialAlertas
import BitacoraBloqueo from './pages/Configuracion/BitacoraBloqueo'; // Importa el componente BitacoraBloqueo
import Movimientos from './pages/Productos/Movimientos'; // Importa el componente Movimientos


function App() {
  return (
    <Routes>
      {/* Ruta pública: Login no requiere autenticación y no tiene Sidebar */}
      <Route path="/login" element={<Login />} />

      {/* Ruta pública: solicitud de recuperación de contraseña */}
      <Route path="/recuperar-password" element={<RecuperarPassword />} />

      {/* Ruta pública: formulario de nueva contraseña desde el enlace del correo */}
      <Route path="/restablecer/:uid/:token" element={<RestablecerPassword />} />

      {/* Rutas protegidas: requieren iniciar sesión */}
      <Route element={<RutaPrivada />}>
        <Route path="/" element={
          <ControlInactividad>
            <MainLayout />
          </ControlInactividad>
        }>
          {/* Cualquier ruta que se ponga aquí dentro, lo tendra el Sidebar automáticamente */}

          {/* Vista del Dashboard */}
          <Route index element={<Dashboard />} />
          
          {/* Nueva Vista enlazada (localhost:5173/usuarios) */}
          <Route path="usuarios" element={
            <ProtectorRuta modulo="usuarios">
              <Usuarios />
            </ProtectorRuta>
          } />

           {/* Módulo de Categorías en App.jsx */}
          <Route path="categorias" element={
            <ProtectorRuta modulo="categorias">
              <Categorias />
            </ProtectorRuta>
          } />

          <Route path="categorias/editar/:id" element={
            <ProtectorRuta modulo="categorias">
              <EditarCategoria />
            </ProtectorRuta>
          } />

          {/*Vista de menu de acceso por usuario*/}
          <Route path="acceso-rol" element={
            <ProtectorRuta modulo="acceso_rol">
              <UsuarioAcceso />
            </ProtectorRuta>
          } />

          {/*Vista de Destinatarios de alertas*/}
          <Route path="destinatarios" element={
            <ProtectorRuta modulo="destinatarios">
              <Destinatarios />
            </ProtectorRuta>
          } />

          {/*Vista del Historial de Alertas*/}
          <Route path="historial-alertas" element={
            <ProtectorRuta modulo="historial_alertas">
              <HistorialAlertas />
            </ProtectorRuta>
          } />

          {/* Rutas para productos y movimientos */}
          <Route path="inventario/movimiento" element={<
            ProtectorRuta modulo="movimientos">
              <RegistrarMovimiento />
            </ProtectorRuta>
            } />
          
          <Route path="productos" element={
            <ProtectorRuta modulo="productos">
              <ListaProductos />
            </ProtectorRuta>
          } />

          <Route path="productos/editar/:id" element={
            <ProtectorRuta modulo="productos">
              <EditarProducto />
            </ProtectorRuta>
          } />

          <Route path="bitacora-bloqueo" element={
            <ProtectorRuta modulo="bitacora_bloqueo">
              <BitacoraBloqueo />
            </ProtectorRuta>
          } />
          <Route path="movimientos" element={<Movimientos />} />
          
        </Route>
      </Route>
    </Routes>
  );
}

export default App;