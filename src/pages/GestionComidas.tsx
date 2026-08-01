import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import TopNavbar from '../components/Layout/TopNavbar';
import api, { resolveApiAssetUrl } from '../services/api';
import foodService, { type Food } from '../services/foodService';
import './GestionComidas.css';

interface FoodType {
  id: number;
  name: string;
  description: string | null;
}

interface FoodForm {
  foodTypeId: number | null;
  name: string;
  isSpecial: boolean;
  isActive: boolean;
}

const EMPTY_FORM: FoodForm = {
  foodTypeId: null,
  name: '',
  isSpecial: false,
  isActive: true,
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function messageFromError(error: any, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback;
}

async function validateJpeg(file: File): Promise<string | null> {
  if (!/\.jpe?g$/i.test(file.name)) {
    return 'Formato no permitido: el archivo debe terminar en .jpg o .jpeg.';
  }
  if (file.size > MAX_IMAGE_BYTES) return 'La imagen no puede superar los 5 MB.';
  if (file.size < 4) return 'El archivo JPEG esta vacio o dañado.';

  const first = new Uint8Array(await file.slice(0, 3).arrayBuffer());
  const last = new Uint8Array(await file.slice(-2).arrayBuffer());
  if (first[0] !== 0xff || first[1] !== 0xd8 || first[2] !== 0xff || last[0] !== 0xff || last[1] !== 0xd9) {
    return 'La extension es .jpg/.jpeg, pero el contenido real no es JPEG. Converti la imagen a JPG antes de subirla.';
  }
  return null;
}

function FoodImage({ food, large = false }: { food: Food; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const src = resolveApiAssetUrl(food.imageUrl);

  if (!src || failed) {
    return <div className={large ? 'food-image-placeholder large' : 'food-image-placeholder'}>Sin imagen</div>;
  }
  return (
    <img
      className={large ? 'food-image large' : 'food-image'}
      src={src}
      alt={`Comida ${food.name}`}
      onError={() => setFailed(true)}
    />
  );
}

function GestionComidas() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [form, setForm] = useState<FoodForm>(EMPTY_FORM);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImageName, setSelectedImageName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void Promise.all([loadFoods(), loadFoodTypes()]);
  }, []);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const filteredFoods = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return term ? foods.filter(food => food.name.toLowerCase().includes(term)) : foods;
  }, [foods, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredFoods.length / itemsPerPage));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * itemsPerPage;
  const visibleFoods = filteredFoods.slice(startIndex, startIndex + itemsPerPage);

  async function loadFoods() {
    try {
      setLoadingFoods(true);
      setFoods(await foodService.getAll());
    } catch (loadError) {
      setError(messageFromError(loadError, 'Error al cargar las comidas.'));
    } finally {
      setLoadingFoods(false);
    }
  }

  async function loadFoodTypes() {
    try {
      const response = await api.get('/food-types');
      setFoodTypes(response.data);
    } catch (loadError) {
      setError(messageFromError(loadError, 'Error al cargar los tipos de comida.'));
    }
  }

  function replaceFood(updated: Food) {
    setFoods(current => current.map(food => food.id === updated.id ? updated : food));
    setEditingFood(updated);
  }

  function clearSelectedImage() {
    setSelectedImage(null);
    setSelectedImageName('');
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function openCreateModal() {
    setEditingFood(null);
    setForm(EMPTY_FORM);
    clearSelectedImage();
    setError('');
    setShowModal(true);
  }

  function openEditModal(food: Food) {
    setEditingFood(food);
    setForm({
      foodTypeId: food.foodTypeId ?? null,
      name: food.name,
      isSpecial: Boolean(food.isSpecial),
      isActive: Boolean(food.isActive),
    });
    clearSelectedImage();
    setError('');
    setShowModal(true);
  }

  function closeModal() {
    if (saving || uploading || deletingImage) return;
    setShowModal(false);
    clearSelectedImage();
    setEditingFood(null);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, type } = event.target;
    const value = type === 'checkbox' ? (event.target as HTMLInputElement).checked : event.target.value;
    setForm(current => ({
      ...current,
      [name]: name === 'foodTypeId' ? Number(value) || null : value,
    }));
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return clearSelectedImage();

    setSelectedImage(null);
    setSelectedImageName(file.name);
    setPreviewUrl(null);

    const validationError = await validateJpeg(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.foodTypeId) return setError('Selecciona un tipo de comida.');
    setSaving(true);
    setError('');
    setSuccess('');

    let savedFood: Food | undefined;
    const foodPayload: Food = { ...form, foodTypeId: form.foodTypeId };
    try {
      if (editingFood?.id) {
        const response = await foodService.update(editingFood.id, foodPayload);
        savedFood = response.food;
        replaceFood(savedFood);
      } else {
        savedFood = await foodService.create(foodPayload);
        setFoods(current => [savedFood!, ...current]);
      }

      if (selectedImage && savedFood.id) {
        setUploading(true);
        try {
          const response = await foodService.uploadImage(savedFood.id, selectedImage);
          savedFood = response.food;
          replaceFood(savedFood);
        } catch (imageError) {
          setError(`La comida se guardo, pero no se pudo subir la imagen: ${messageFromError(imageError, 'error de carga')}`);
          setShowModal(false);
          clearSelectedImage();
          return;
        } finally {
          setUploading(false);
        }
      }

      setSuccess(editingFood ? 'Comida actualizada correctamente.' : 'Comida creada correctamente.');
      setShowModal(false);
      clearSelectedImage();
    } catch (saveError) {
      setError(messageFromError(saveError, 'No se pudo guardar la comida.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteImage() {
    if (!editingFood?.id || !editingFood.imageUrl) return;
    if (!window.confirm(`¿Quitar la imagen de ${editingFood.name}?`)) return;
    try {
      setDeletingImage(true);
      setError('');
      const response = await foodService.deleteImage(editingFood.id);
      replaceFood(response.food);
      setSuccess('Imagen eliminada correctamente.');
    } catch (deleteError) {
      setError(messageFromError(deleteError, 'No se pudo eliminar la imagen.'));
    } finally {
      setDeletingImage(false);
    }
  }

  async function handleToggleActive(food: Food) {
    if (!food.id) return;
    try {
      const response = await foodService.update(food.id, { isActive: !food.isActive });
      replaceFood(response.food);
    } catch (toggleError) {
      setError(messageFromError(toggleError, 'No se pudo cambiar el estado.'));
    }
  }

  async function handleDelete(food: Food) {
    if (!food.id || !window.confirm(`¿Eliminar permanentemente ${food.name}?`)) return;
    try {
      await foodService.delete(food.id);
      setFoods(current => current.filter(item => item.id !== food.id));
      setSuccess('Comida eliminada correctamente.');
    } catch (deleteError) {
      setError(messageFromError(deleteError, 'No se pudo eliminar la comida.'));
    }
  }

  return (
    <>
      <TopNavbar />
      <main className="main-content foods-page">
        <header className="page-header">
          <div>
            <h1>Gestion de Comidas</h1>
            <p className="subtitle">Administra el catalogo y sus imagenes</p>
          </div>
          <button className="btn-create" onClick={openCreateModal}>Crear comida</button>
        </header>

        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {success && <div className="alert alert-success" role="status">{success}</div>}

        <div className="foods-toolbar">
          <label className="search-label" htmlFor="food-search">Buscar comidas</label>
          <input
            id="food-search"
            className="search-input"
            type="search"
            value={searchTerm}
            onChange={event => { setSearchTerm(event.target.value); setCurrentPage(1); }}
            placeholder="Nombre de la comida"
          />
        </div>

        {loadingFoods ? <div className="loading-state">Cargando comidas...</div> : (
          <div className="table-container">
            <table className="comidas-table">
              <thead><tr><th>Imagen</th><th>Nombre</th><th>Tipo</th><th>Clase</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {!visibleFoods.length ? (
                  <tr><td colSpan={6} className="no-data">No se encontraron comidas.</td></tr>
                ) : visibleFoods.map(food => (
                  <tr key={food.id}>
                    <td><FoodImage food={food} /></td>
                    <td className="food-name">{food.name}</td>
                    <td>{foodTypes.find(type => type.id === food.foodTypeId)?.name || '-'}</td>
                    <td><span className={`badge ${food.isSpecial ? 'badge-special' : 'badge-regular'}`}>{food.isSpecial ? 'Especial' : 'Regular'}</span></td>
                    <td><span className={`badge ${food.isActive ? 'badge-active' : 'badge-inactive'}`}>{food.isActive ? 'Activa' : 'Inactiva'}</span></td>
                    <td><div className="action-buttons">
                      <button className="action-button" onClick={() => openEditModal(food)}>Editar</button>
                      <button className="action-button" onClick={() => void handleToggleActive(food)}>{food.isActive ? 'Desactivar' : 'Activar'}</button>
                      <button className="action-button danger" onClick={() => void handleDelete(food)}>Eliminar</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loadingFoods && filteredFoods.length > 0 && <div className="pagination-container">
          <span>Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredFoods.length)} de {filteredFoods.length}</span>
          <label>Filas <select value={itemsPerPage} onChange={event => { setItemsPerPage(Number(event.target.value)); setCurrentPage(1); }}>
            {[5, 10, 25, 50].map(size => <option key={size} value={size}>{size}</option>)}
          </select></label>
          <div className="pagination-controls">
            <button disabled={page === 1} onClick={() => setCurrentPage(page - 1)}>Anterior</button>
            <span>Pagina {page} de {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setCurrentPage(page + 1)}>Siguiente</button>
          </div>
        </div>}
      </main>

      {showModal && <div className="modal-overlay" onMouseDown={event => event.target === event.currentTarget && closeModal()}>
        <section className="modal-content" role="dialog" aria-modal="true" aria-labelledby="food-modal-title">
          <header className="modal-header">
            <h2 id="food-modal-title">{editingFood ? 'Editar comida' : 'Crear comida'}</h2>
            <button className="modal-close" onClick={closeModal} aria-label="Cerrar">×</button>
          </header>
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="food-form-grid">
              <div className="form-fields">
                <label>Nombre<input name="name" value={form.name} onChange={handleChange} minLength={2} maxLength={160} required /></label>
                <label>Tipo<select name="foodTypeId" value={form.foodTypeId || ''} onChange={handleChange} required>
                  <option value="">Seleccionar tipo</option>
                  {foodTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                </select></label>
                <label className="checkbox-item"><input type="checkbox" name="isSpecial" checked={form.isSpecial} onChange={handleChange} />Comida especial</label>
                <label className="checkbox-item"><input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />Comida activa</label>
              </div>
              <div className="image-editor">
                <span className="image-editor-label">Imagen JPEG</span>
                {previewUrl ? <img className="food-image large" src={previewUrl} alt="Vista previa de la imagen seleccionada" /> : editingFood ? <FoodImage food={editingFood} large /> : <div className="food-image-placeholder large">Sin imagen</div>}
                <input ref={fileInputRef} id="food-image" type="file" accept="image/jpeg,.jpg,.jpeg" onChange={event => void handleImageChange(event)} />
                <p className="image-help">Solo JPG o JPEG, maximo 5 MB.</p>
                {selectedImageName && <p className={selectedImage ? 'image-file-name' : 'image-file-name invalid'}>{selectedImageName}</p>}
                <div className="image-actions">
                  {selectedImage && <button type="button" className="action-button" onClick={clearSelectedImage}>Cancelar seleccion</button>}
                  {editingFood?.imageUrl && !selectedImage && <button type="button" className="action-button danger" disabled={deletingImage} onClick={() => void handleDeleteImage()}>{deletingImage ? 'Quitando...' : 'Quitar imagen'}</button>}
                </div>
              </div>
            </div>
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={closeModal}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving || uploading || deletingImage}>
                {uploading ? 'Subiendo imagen...' : saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </section>
      </div>}
    </>
  );
}

export default GestionComidas;
