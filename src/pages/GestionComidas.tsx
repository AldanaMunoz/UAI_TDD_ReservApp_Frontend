import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import TopNavbar from '../components/Layout/TopNavbar';
import api from '../services/authService';
import './GestionComidas.css';

interface FoodType {
  id: number;
  name: string;
  description: string | null;
}

interface Food {
  id: number;
  foodTypeId: number;
  name: string;
  isSpecial: boolean;
  imageUrl: string | null;
  isActive: boolean;
}

interface FormData {
  foodTypeId: number | null;
  name: string;
  isSpecial: boolean;
  imageUrl: string;
  isActive: boolean;
}

function GestionComidas() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [loadingFoodTypes, setLoadingFoodTypes] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<FormData>({
    foodTypeId: null,
    name: '',
    isSpecial: false,
    imageUrl: '',
    isActive: true
  });

  useEffect(() => {
    loadFoods();
    loadFoodTypes();
  }, []);

  useEffect(() => {
    const filtered = foods.filter((food) =>
      food.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFoods(filtered);
  }, [searchTerm, foods]);

  const loadFoods = async () => {
    try {
      setLoadingFoods(true);
      const response = await api.get('/foods');
      setFoods(response.data);
      setFilteredFoods(response.data);
    } catch (err: any) {
      setError('Error al cargar las comidas');
      console.error(err);
    } finally {
      setLoadingFoods(false);
    }
  };

  const loadFoodTypes = async () => {
    try {
      setLoadingFoodTypes(true);
      const response = await api.get('/food-types');
      setFoodTypes(response.data);
    } catch (err: any) {
      setError('Error al cargar los tipos de comida');
      console.error(err);
    } finally {
      setLoadingFoodTypes(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleOpenModal = () => {
    setIsEditMode(false);
    setEditingFoodId(null);
    setFormData({
      foodTypeId: null,
      name: '',
      isSpecial: false,
      imageUrl: '',
      isActive: true
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleOpenEditModal = (food: Food) => {
    setIsEditMode(true);
    setEditingFoodId(food.id);
    setFormData({
      foodTypeId: food.foodTypeId,
      name: food.name,
      isSpecial: Boolean(food.isSpecial),
      imageUrl: food.imageUrl || '',
      isActive: Boolean(food.isActive)
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setEditingFoodId(null);
    setFormData({
      foodTypeId: null,
      name: '',
      isSpecial: false,
      imageUrl: '',
      isActive: true
    });
    setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.foodTypeId) {
      setError('Debe seleccionar un tipo de comida');
      setLoading(false);
      return;
    }

    try {
      if (isEditMode && editingFoodId) {
        await api.patch(`/foods/${editingFoodId}`, formData);
        setSuccess('Comida actualizada exitosamente');
      } else {
        await api.post('/foods', formData);
        setSuccess('Comida creada exitosamente');
      }

      setTimeout(() => {
        handleCloseModal();
        loadFoods();
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message ||
        (isEditMode ? 'Error al actualizar comida' : 'Error al crear comida');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (foodId: number, currentStatus: boolean) => {
    try {
      await api.patch(`/foods/${foodId}`, {
        isActive: !currentStatus
      });
      loadFoods();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar estado de la comida');
    }
  };

  const handleDelete = async (foodId: number, foodName: string) => {
    if (!window.confirm(`¿Está seguro de eliminar la comida "${foodName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await api.delete(`/foods/hard/${foodId}`);
      loadFoods();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar la comida');
    }
  };

  const getFoodTypeName = (foodTypeId: number): string => {
    const type = foodTypes.find(t => t.id === foodTypeId);
    return type?.name || '-';
  };

  return (
    <>
      <TopNavbar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h1>Gestión de Comidas</h1>
            <p className="subtitle">Administrar comidas del sistema</p>
          </div>
          <button className="btn-create" onClick={handleOpenModal}>
            + Crear Comida
          </button>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {loadingFoods ? (
          <div className="loading-state">Cargando comidas...</div>
        ) : (
          <div className="table-container">
            <table className="comidas-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Especial</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredFoods.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="no-data">
                      {searchTerm ? 'No se encontraron comidas' : 'No hay comidas registradas'}
                    </td>
                  </tr>
                ) : (
                  filteredFoods.map((food) => (
                    <tr key={food.id}>
                      <td>{food.id}</td>
                      <td>{food.name}</td>
                      <td>{getFoodTypeName(food.foodTypeId)}</td>
                      <td>
                        <span className={`badge ${food.isSpecial ? 'badge-special' : 'badge-regular'}`}>
                          {food.isSpecial ? 'Especial' : 'Regular'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${food.isActive ? 'badge-active' : 'badge-inactive'}`}>
                          {food.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => handleOpenEditModal(food)}
                            title="Editar comida"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button
                            className={`btn-toggle ${food.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                            onClick={() => handleToggleActive(food.id, food.isActive)}
                            title={food.isActive ? 'Desactivar' : 'Activar'}
                          >
                            {food.isActive ? (
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
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(food.id, food.name)}
                            title="Eliminar comida"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
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

        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{isEditMode ? 'Editar Comida' : 'Crear Nueva Comida'}</h2>
                <button className="modal-close" onClick={handleCloseModal}>
                  &times;
                </button>
              </div>

              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handleSubmit} className="modal-form">
                  <div className="form-section">
                    <h3>Información de la Comida</h3>
                    <div className="form-group">
                      <label htmlFor="name">Nombre *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        minLength={2}
                        maxLength={160}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="foodTypeId">Tipo de Comida *</label>
                      <select
                        id="foodTypeId"
                        name="foodTypeId"
                        value={formData.foodTypeId || ''}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Seleccionar tipo...</option>
                        {loadingFoodTypes ? (
                          <option disabled>Cargando tipos...</option>
                        ) : (
                          foodTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="imageUrl">URL de Imagen (opcional)</label>
                      <input
                        type="text"
                        id="imageUrl"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleChange}
                        placeholder="https://ejemplo.com/imagen.jpg"
                      />
                    </div>

                    <div className="form-checkboxes">
                      <div className="checkbox-item">
                        <input
                          type="checkbox"
                          id="isSpecial"
                          name="isSpecial"
                          checked={formData.isSpecial}
                          onChange={handleChange}
                        />
                        <label htmlFor="isSpecial">Es comida especial</label>
                      </div>

                      <div className="checkbox-item">
                        <input
                          type="checkbox"
                          id="isActive"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleChange}
                        />
                        <label htmlFor="isActive">Comida activa</label>
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" onClick={handleCloseModal} className="btn-secondary">
                      Cancelar
                    </button>
                    <button type="submit" disabled={loading} className="btn-primary">
                      {loading ? (isEditMode ? 'Actualizando...' : 'Creando...') : (isEditMode ? 'Actualizar Comida' : 'Crear Comida')}
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

export default GestionComidas;
