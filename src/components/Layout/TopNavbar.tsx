import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './TopNavbar.css';

interface MenuItem {
  path: string;
  label: string;
  roles: string[];
}

const menuItems: MenuItem[] = [
  { path: '/menu', label: 'Menú del día', roles: ['Empleado'] },
  { path: '/planificacion', label: 'Planificación', roles: ['Empleado'] },
  { path: '/historial', label: 'Historial', roles: ['Empleado'] },

  { path: '/reservas-del-dia', label: 'Reservas del día', roles: ['Administrador'] },
  { path: '/gestion-comida', label: 'Gestión de comida', roles: ['Administrador'] },
  { path: '/planificacion-temporada', label: 'Planificación por temporada', roles: ['Administrador'] },
  { path: '/gestion-usuarios', label: 'Gestión de usuarios', roles: ['Administrador'] },
  { path: '/reportes', label: 'Reportes', roles: ['Administrador'] }
];

function TopNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Cerrar menús al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const userRoles = user?.roles || [];
  const filteredMenuItems = menuItems.filter(item =>
    item.roles.some(role => userRoles.includes(role))
  );

  const displayName = user?.nombre && user?.apellido
    ? `${user.nombre} ${user.apellido}`
    : user?.email || 'Usuario';

  return (
    <nav className="top-navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <h1>ReservApp</h1>
        </div>

        {/* Navigation Links - Desktop */}
        <div className="navbar-links">
          {filteredMenuItems.map((item) => (
            <button
              key={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => handleNavigation(item.path)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* User Menu */}
        <div className="navbar-user" ref={userMenuRef}>
          <button
            className="user-button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <span className="user-avatar">👤</span>
            <div className="user-info-desktop">
              <span className="user-name-nav">{displayName}</span>
              <span className="user-role-nav">{user?.roles?.[0]}</span>
            </div>
            <span className={`dropdown-arrow ${isUserMenuOpen ? 'open' : ''}`}>▼</span>
          </button>

          {/* Dropdown Menu */}
          {isUserMenuOpen && (
            <div className="user-dropdown">
              <div className="dropdown-header">
                <span className="dropdown-name">{displayName}</span>
                <span className="dropdown-email">{user?.email}</span>
                <span className="dropdown-role">{user?.roles?.[0]}</span>
              </div>
              <button className="dropdown-logout" onClick={handleLogout}>
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="mobile-menu" ref={menuRef}>
          {filteredMenuItems.map((item) => (
            <button
              key={item.path}
              className={`mobile-nav-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => handleNavigation(item.path)}
            >
              {item.label}
            </button>
          ))}
          <div className="mobile-user-info">
            <span className="mobile-user-name">{displayName}</span>
            <span className="mobile-user-role">{user?.roles?.[0]}</span>
          </div>
          <button className="mobile-logout" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      )}
    </nav>
  );
}

export default TopNavbar;
