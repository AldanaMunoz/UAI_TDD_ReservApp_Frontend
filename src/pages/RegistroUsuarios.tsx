import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import api from '../services/authService';
import './RegistroUsuarios.css';

interface Role {
  id: number;
  nombre: string;
}

interface FormData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  turno: 'manana' | 'tarde' | 'noche';
  tipo: 'interno' | 'externo';
  roles: number[];
}

function RegistroUsuarios() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    turno: 'manana',
    tipo: 'interno',
    roles: []
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await api.get('/user-bundle/roles');
      setRoles(response.data);
    } catch (err: any) {
      setError('Error al cargar los roles');
      console.error(err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleToggle = (roleId: number) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(roleId)
        ? prev.roles.filter(id => id !== roleId)
        : [...prev.roles, roleId]
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.roles.length === 0) {
      setError('Debe seleccionar al menos un rol');
      setLoading(false);
      return;
    }

    try {
      await api.post('/user-bundle/create', {
        user: {
          email: formData.email,
          password: formData.password,
          activo: 1
        },
        person: {
          nombre: formData.nombre,
          apellido: formData.apellido
        },
        employee: {
          turno: formData.turno,
          tipo: formData.tipo
        },
        roles: formData.roles
      });

      setSuccess('Usuario creado exitosamente');

      // Limpiar formulario
      setFormData({
        email: '',
        password: '',
        nombre: '',
        apellido: '',
        turno: 'manana',
        tipo: 'interno',
        roles: []
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al crear usuario';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h1>Registro de Usuarios</h1>
          <p className="subtitle">Crear nuevos usuarios y asignar roles</p>
        </div>

        <div className="registro-form-container">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit} className="registro-form">
            <div className="form-section">
              <h3>Información de Usuario</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Contraseña *</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Información Personal</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nombre">Nombre *</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="apellido">Apellido *</label>
                  <input
                    type="text"
                    id="apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Información de Empleado</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="turno">Turno *</label>
                  <select
                    id="turno"
                    name="turno"
                    value={formData.turno}
                    onChange={handleChange}
                    required
                  >
                    <option value="manana">Mañana</option>
                    <option value="tarde">Tarde</option>
                    <option value="noche">Noche</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="tipo">Tipo de Empleado *</label>
                  <select
                    id="tipo"
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    required
                  >
                    <option value="interno">Interno</option>
                    <option value="externo">Externo</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Roles *</h3>
              {loadingRoles ? (
                <p>Cargando roles...</p>
              ) : (
                <div className="roles-grid">
                  {roles.map((role) => (
                    <div key={role.id} className="role-checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={formData.roles.includes(role.id)}
                          onChange={() => handleRoleToggle(role.id)}
                        />
                        <span>{role.nombre}</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegistroUsuarios;
