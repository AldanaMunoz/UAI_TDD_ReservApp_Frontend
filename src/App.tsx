import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeMenu from './pages/EmployeeMenu';
import type { ReactNode } from 'react';
import ReservasDelDia from './pages/ReservasDelDia';
import GestionComidas from './pages/GestionComidas';
import PlanificacionTemporada from './pages/PlanificacionTemporada';
import GestionUsuarios from './pages/GestionUsuarios';
import HistorialReservas from './pages/HistorialReservas';
import PlanificacionEmpleado from './pages/PlanificacionEmpleado';
import LiquidacionMensual from './pages/LiquidacionMensual';

interface PrivateRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.some(role => user.roles?.includes(role))) {
    if (user.roles?.includes('Administrador')) {
      return <Navigate to="/reservas-del-dia" />;
    }
    return <Navigate to="/menu" />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Rutas de Administrador */}
          <Route
            path="/reservas-del-dia"
            element={
              <PrivateRoute allowedRoles={['Administrador']}>
                <ReservasDelDia />
              </PrivateRoute>
            }
          />
          <Route
            path="/gestion-comida"
            element={
              <PrivateRoute allowedRoles={['Administrador']}>
                <GestionComidas />
              </PrivateRoute>
            }
          />
          <Route
            path="/planificacion-temporada"
            element={
              <PrivateRoute allowedRoles={['Administrador']}>
                <PlanificacionTemporada />
              </PrivateRoute>
            }
          />

          <Route
            path="/reportes"
            element={
              <PrivateRoute allowedRoles={['Administrador']}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/gestion-usuarios"
            element={
              <PrivateRoute allowedRoles={['Administrador']}>
                <GestionUsuarios />
              </PrivateRoute>
            }
          />

          <Route
            path="/liquidacion-mensual"
            element={
              <PrivateRoute allowedRoles={['Administrador']}>
                <LiquidacionMensual />
              </PrivateRoute>
            }
          />

          {/* Rutas de Empleado */}
          <Route
            path="/menu"
            element={
              <PrivateRoute allowedRoles={['Empleado']}>
                <EmployeeMenu />
              </PrivateRoute>
            }
          />
          <Route
            path="/historial"
            element={
              <PrivateRoute allowedRoles={['Empleado']}>
                <HistorialReservas />
              </PrivateRoute>
            }
          />
          <Route
            path="/planificacion"
            element={
              <PrivateRoute allowedRoles={['Empleado']}>
                <PlanificacionEmpleado />
              </PrivateRoute>
            }
          />

          {/* Redirección por default */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <RoleBasedRedirect />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function RoleBasedRedirect() {
  const { user } = useAuth();

  if (user?.roles?.includes('Administrador')) {
    return <Navigate to="/reservas-del-dia" />;
  }

  return <Navigate to="/menu" />;
}



export default App;
