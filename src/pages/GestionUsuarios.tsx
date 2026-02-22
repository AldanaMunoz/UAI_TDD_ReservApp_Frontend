import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import TopNavbar from '../components/Layout/TopNavbar';
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
  roleId: number | null; // Solo UN rol por usuario
  activo: number; // 1 = activo, 0 = inactivo
}

function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
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
    roleId: null,
    activo: 1
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

  const handleRoleChange = (roleId: number) => {
    setFormData(prev => ({
      ...prev,
      roleId: roleId
    }));
  };

  const handleOpenModal = () => {
    setIsEditMode(false);
    setEditingUserId(null);
    setFormData({
      email: '',
      password: '',
      nombre: '',
      apellido: '',
      turno: 'manana',
      tipo: 'interno',
      roleId: null,
      activo: 1
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleOpenEditModal = async (usuario: Usuario) => {
    setIsEditMode(true);
    setEditingUserId(usuario.id);

    // Obtener el rol del usuario desde el backend
    try {
      const response = await api.get(`/user-bundle/users/${usuario.id}/roles`);
      const userRole = response.data[0]?.id || null; // Solo el primer rol

      setFormData({
        email: usuario.email,
        password: '', // No mostramos la contraseña actual
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        turno: usuario.turno as 'manana' | 'tarde' | 'noche',
        tipo: usuario.tipo as 'interno' | 'externo',
        roleId: userRole,
        activo: usuario.activo
      });
    } catch (err) {
      // Si falla, intentamos inferir el rol del string
      const rolesString = usuario.roles || '';
      const role = roles.find(r => rolesString.includes(r.nombre));

      setFormData({
        email: usuario.email,
        password: '',
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        turno: usuario.turno as 'manana' | 'tarde' | 'noche',
        tipo: usuario.tipo as 'interno' | 'externo',
        roleId: role?.id || null,
        activo: usuario.activo
      });
    }

    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setEditingUserId(null);
    setFormData({
      email: '',
      password: '',
      nombre: '',
      apellido: '',
      turno: 'manana',
      tipo: 'interno',
      roleId: null,
      activo: 1
    });
    setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.roleId) {
      setError('Debe seleccionar un rol');
      setLoading(false);
      return;
    }

    try {
      if (isEditMode && editingUserId) {
        // Modo edición: actualizar usuario
        await handleUpdateUser(editingUserId);
      } else {
        // Modo creación: crear nuevo usuario
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
          roles: [formData.roleId] // El backend espera un array
        });

        setSuccess('Usuario creado exitosamente');
      }

      setTimeout(() => {
        handleCloseModal();
        loadUsuarios();
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || (isEditMode ? 'Error al actualizar usuario' : 'Error al crear usuario');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId: number) => {
    // Por ahora, la edición completa requiere endpoints adicionales en el backend
    // Simplemente mostramos un mensaje de error
    throw new Error('La edición de usuarios aún no está implementada. Por favor, crea un nuevo usuario con los datos correctos o usa el botón de Activar/Desactivar para cambiar el estado.');
  };

  const handleToggleActive = async (userId: number, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      await api.patch(`/users/${userId}/activo`, {
        activo: newStatus
      });
      loadUsuarios();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar estado del usuario');
    }
  };

  return (
    <>
      <TopNavbar />
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
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="no-data">
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
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => handleOpenEditModal(usuario)}
                            title="Editar usuario"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button
                            className={`btn-toggle ${usuario.activo === 1 ? 'btn-deactivate' : 'btn-activate'}`}
                            onClick={() => handleToggleActive(usuario.id, usuario.activo)}
                            title={usuario.activo === 1 ? 'Desactivar' : 'Activar'}
                          >
                            {usuario.activo === 1 ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                              </svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                              </svg>
                            )}
                          </button>
                        </div>
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
                <h2>{isEditMode ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h2>
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
                        <label htmlFor="password">Contraseña {isEditMode ? '(dejar en blanco para no cambiar)' : '*'}</label>
                        <input
                          type="password"
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required={!isEditMode}
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
                    <h3>Rol *</h3>
                    {loadingRoles ? (
                      <p>Cargando roles...</p>
                    ) : (
                      <div className="roles-grid">
                        {roles.map((role) => (
                          <div key={role.id} className="role-option">
                            <label>
                              <input
                                type="radio"
                                name="role"
                                checked={formData.roleId === role.id}
                                onChange={() => handleRoleChange(role.id)}
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
                      {loading ? (isEditMode ? 'Actualizando...' : 'Creando...') : (isEditMode ? 'Actualizar Usuario' : 'Crear Usuario')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default GestionUsuarios;
