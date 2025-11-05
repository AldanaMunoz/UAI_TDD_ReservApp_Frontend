import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import api from '../services/authService';
import './GestionUsuarios.css';

interface Role {
  id: number;
  nombre: string;
}

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  turno: string;
  tipo: string;
  roles: string;
  activo: number;
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

function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    turno: 'manana',
    tipo: 'interno',
    roles: []
  });

  useEffect(() => {
    loadUsuarios();
    loadRoles();
  }, []);

  useEffect(() => {
    const filtered = usuarios.filter(
      (usuario) =>
        usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.roles?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsuarios(filtered);
  }, [searchTerm, usuarios]);

  const loadUsuarios = async () => {
    try {
      setLoadingUsuarios(true);
      const response = await api.get('/user-bundle/users');
      setUsuarios(response.data);
      setFilteredUsuarios(response.data);
    } catch (err: any) {
      setError('Error al cargar los usuarios');
      console.error(err);
    } finally {
      setLoadingUsuarios(false);
    }
  };

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

  const handleOpenModal = () => {
    setFormData({
      email: '',
      password: '',
      nombre: '',
      apellido: '',
      turno: 'manana',
      tipo: 'interno',
      roles: []
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      email: '',
      password: '',
      nombre: '',
      apellido: '',
      turno: 'manana',
      tipo: 'interno',
      roles: []
    });
    setError('');
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
      setTimeout(() => {
        handleCloseModal();
        loadUsuarios();
      }, 1500);
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
          <div>
            <h1>Gestión de Usuarios</h1>
            <p className="subtitle">Administrar usuarios del sistema</p>
          </div>
          <button className="btn-create" onClick={handleOpenModal}>
            + Crear Usuario
          </button>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar por email, nombre, apellido o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {loadingUsuarios ? (
          <div className="loading-state">Cargando usuarios...</div>
        ) : (
          <div className="table-container">
            <table className="usuarios-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Turno</th>
                  <th>Tipo</th>
                  <th>Roles</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="no-data">
                      {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                    </td>
                  </tr>
                ) : (
                  filteredUsuarios.map((usuario) => (
                    <tr key={usuario.id}>
                      <td>{usuario.id}</td>
                      <td>{usuario.email}</td>
                      <td>{usuario.nombre || '-'}</td>
                      <td>{usuario.apellido || '-'}</td>
                      <td className="capitalize">{usuario.turno || '-'}</td>
                      <td className="capitalize">{usuario.tipo || '-'}</td>
                      <td>
                        <span className="roles-cell">{usuario.roles || 'Sin roles'}</span>
                      </td>
                      <td>
                        <span className={`badge ${usuario.activo === 1 ? 'badge-active' : 'badge-inactive'}`}>
                          {usuario.activo === 1 ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal de Creación */}
        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Crear Nuevo Usuario</h2>
                <button className="modal-close" onClick={handleCloseModal}>
                  &times;
                </button>
              </div>

              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handleSubmit} className="modal-form">
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
                    <button type="button" onClick={handleCloseModal} className="btn-secondary">
                      Cancelar
                    </button>
                    <button type="submit" disabled={loading} className="btn-primary">
                      {loading ? 'Creando...' : 'Crear Usuario'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GestionUsuarios;
