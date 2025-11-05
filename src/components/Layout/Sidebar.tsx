import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

interface MenuItem {
  path: string;
  label: string;
  roles: string[];
}

const menuItems: MenuItem[] = [
  { path: '/menu', label: 'Menú del día', roles: ['Empleado'] },
  { path: '/reserva', label: 'Reserva del día', roles: ['Empleado'] },
  { path: '/historial', label: 'Historial de reservas', roles: ['Empleado'] },

  { path: '/reservas-del-dia', label: 'Reservas del día', roles: ['Administrador'] },
  { path: '/gestion-comida', label: 'Gestión de comida', roles: ['Administrador'] },
  { path: '/planificacion-temporada', label: 'Planificación por temporada', roles: ['Administrador'] },
  { path: '/gestion-usuarios', label: 'Gestión de usuarios', roles: ['Administrador'] },
  { path: '/reportes', label: 'Reportes', roles: ['Administrador'] }
];

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userRoles = user?.roles || [];
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.some(role => userRoles.includes(role))
  );

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>ReservApp</h2>
      </div>

      <nav className="sidebar-nav">
        {filteredMenuItems.map((item) => (
          <div
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-label">{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <span className="user-icon">👤</span>
          <div className="user-details">
            <span className="user-name">
              {user?.email} ({user?.roles?.[0]})
            </span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

export default Sidebar;