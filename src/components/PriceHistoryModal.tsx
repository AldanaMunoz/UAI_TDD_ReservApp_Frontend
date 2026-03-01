import { useState, useEffect } from 'react';
import priceHistoryService, { type PriceHistory } from '../services/priceHistoryService';
import './PriceHistoryModal.css';

interface PriceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function PriceHistoryModal({ isOpen, onClose }: PriceHistoryModalProps) {
  const [priceHistories, setPriceHistories] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    price: '',
    startDate: '',
    toDate: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadPriceHistories();
    }
  }, [isOpen]);

  const loadPriceHistories = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await priceHistoryService.getAll();
      setPriceHistories(data.sort((a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      ));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar historial de precios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      setError('El precio debe ser un número positivo');
      return;
    }

    if (!formData.startDate) {
      setError('La fecha de inicio es obligatoria');
      return;
    }

    try {
      setLoading(true);

      if (editingId) {
        const updateData: Partial<Omit<PriceHistory, 'id'>> = {
          price,
          startDate: formData.startDate
        };
        if (formData.toDate) {
          updateData.toDate = formData.toDate;
        }
        await priceHistoryService.update(editingId, updateData);
        setSuccess('Precio actualizado exitosamente');
      } else {
        // Lógica para cerrar el precio vigente anterior
        const currentPrice = priceHistories.find(ph => !ph.toDate);

        if (currentPrice && new Date(formData.startDate) > new Date(currentPrice.startDate)) {
          // Calcular el día anterior a la nueva fecha de inicio
          const newStartDate = new Date(formData.startDate + 'T00:00:00');
          const previousDay = new Date(newStartDate);
          previousDay.setDate(previousDay.getDate() - 1);

          const previousDayStr = previousDay.toISOString().split('T')[0];

          // Actualizar el precio vigente para cerrarlo
          await priceHistoryService.update(currentPrice.id!, { toDate: previousDayStr });
        }

        // Crear el nuevo precio
        await priceHistoryService.create({
          price,
          startDate: formData.startDate,
          toDate: formData.toDate || null
        });
        setSuccess('Precio creado exitosamente');
      }

      setFormData({ price: '', startDate: '', toDate: '' });
      setIsEditing(false);
      setEditingId(null);
      await loadPriceHistories();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al guardar el precio';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (priceHistory: PriceHistory) => {
    setIsEditing(true);
    setEditingId(priceHistory.id!);
    setFormData({
      price: Number(priceHistory.price).toString(),
      startDate: priceHistory.startDate,
      toDate: priceHistory.toDate || ''
    });
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este precio? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await priceHistoryService.delete(id);
      setSuccess('Precio eliminado exitosamente');
      await loadPriceHistories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el precio');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ price: '', startDate: '', toDate: '' });
    setError('');
    setSuccess('');
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Gestión de Precios Históricos</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit} className="price-form">
            <h3>{isEditing ? 'Editar Precio' : 'Nuevo Precio'}</h3>

            <div className="form-group">
              <label>Precio ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                placeholder="100.00"
              />
            </div>

            <div className="form-group">
              <label>Fecha de Inicio</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Fecha de Fin (opcional)</label>
              <input
                type="date"
                value={formData.toDate}
                onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                placeholder="Dejar vacío para vigencia indefinida"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
              </button>
              {isEditing && (
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <div className="price-list">
            <h3>Historial de Precios</h3>
            {loading && !priceHistories.length ? (
              <div className="loading">Cargando...</div>
            ) : priceHistories.length === 0 ? (
              <p className="no-data">No hay precios registrados</p>
            ) : (
              <table className="price-table">
                <thead>
                  <tr>
                    <th>Precio</th>
                    <th>Fecha Inicio</th>
                    <th>Fecha Fin</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {priceHistories.map((ph) => (
                    <tr key={ph.id}>
                      <td className="price-cell">${Number(ph.price).toFixed(2)}</td>
                      <td>{formatDate(ph.startDate)}</td>
                      <td>{ph.toDate ? formatDate(ph.toDate) : 'Vigente'}</td>
                      <td className="actions-cell">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(ph)}
                          title="Editar"
                        >
                          Editar
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(ph.id!)}
                          title="Eliminar"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PriceHistoryModal;
