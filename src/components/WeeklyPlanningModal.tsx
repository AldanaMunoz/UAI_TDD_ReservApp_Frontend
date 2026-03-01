import { useState, useEffect } from 'react';
import weeklyPlanningService, { type WeeklyPlanning } from '../services/weeklyPlanningService';
import foodService, { type Food } from '../services/foodService';
import './WeeklyPlanningModal.css';

interface WeeklyPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  weeklyPlanning: WeeklyPlanning | null;
  onSave?: () => void;
}

// Only Monday to Friday (no Saturday/Sunday)
const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
];

// Meal types IDs from database
const MEAL_TYPES = {
  ENTRADA: 1,
  PRINCIPAL: 2,
  ALTERNATIVO: 5,
  VEGETARIANO: 6
};

interface DayMealAssignments {
  entradaId: number | null;
  principalId: number | null;
  alternativoId: number | null;
  vegetarianoId: number | null;
}

function WeeklyPlanningModal({ isOpen, onClose, weeklyPlanning, onSave }: WeeklyPlanningModalProps) {
  const [meals, setMeals] = useState<Food[]>([]);
  const [selectedMeals, setSelectedMeals] = useState<Record<number, DayMealAssignments>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadMeals();
      if (weeklyPlanning) {
        loadAssignedMeals();
      }
    }
  }, [isOpen, weeklyPlanning]);

  const loadMeals = async () => {
    try {
      const data = await foodService.getAll();
      setMeals(data.filter(m => m.isActive !== false));
    } catch (err: any) {
      console.error('Error loading meals:', err);
      setError('Error al cargar comidas');
    }
  };

  const loadAssignedMeals = async () => {
    if (!weeklyPlanning) return;

    try {
      const existingAssignments = await weeklyPlanningService.getMealAssignments(
        weeklyPlanning.seasonId,
        weeklyPlanning.weekNumber
      );

      // Initialize with existing or empty
      const initialSelected: Record<number, DayMealAssignments> = {};
      DAYS_OF_WEEK.forEach(day => {
        initialSelected[day.value] = existingAssignments[day.value] || {
          entradaId: null,
          principalId: null,
          alternativoId: null,
          vegetarianoId: null
        };
      });
      setSelectedMeals(initialSelected);
    } catch (err: any) {
      console.error('Error loading meal assignments:', err);
      // Initialize empty on error
      const initialSelected: Record<number, DayMealAssignments> = {};
      DAYS_OF_WEEK.forEach(day => {
        initialSelected[day.value] = {
          entradaId: null,
          principalId: null,
          alternativoId: null,
          vegetarianoId: null
        };
      });
      setSelectedMeals(initialSelected);
    }
  };

  const handleMealChange = (dayOfWeek: number, mealType: keyof DayMealAssignments, mealId: string) => {
    const mealIdNum = mealId ? parseInt(mealId) : null;
    setSelectedMeals(prev => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        [mealType]: mealIdNum
      }
    }));
  };

  const getMealsByType = (typeId: number): Food[] => {
    return meals.filter(m => m.foodTypeId === typeId);
  };

  const handleSave = async () => {
    if (!weeklyPlanning) return;

    try {
      setLoading(true);
      setError('');

      // Validate required fields for each day
      for (const day of DAYS_OF_WEEK) {
        const dayMeals = selectedMeals[day.value];
        if (!dayMeals) continue;

        if (!dayMeals.principalId) {
          setError(`${day.label}: Debe seleccionar un Plato Principal`);
          setLoading(false);
          return;
        }
        if (!dayMeals.alternativoId) {
          setError(`${day.label}: Debe seleccionar un Plato Alternativo`);
          setLoading(false);
          return;
        }
        if (!dayMeals.vegetarianoId) {
          setError(`${day.label}: Debe seleccionar un Plato Vegetariano`);
          setLoading(false);
          return;
        }
      }

      // Save meal assignments
      await weeklyPlanningService.saveMealAssignments(
        weeklyPlanning.seasonId,
        weeklyPlanning.weekNumber,
        selectedMeals
      );

      if (onSave) {
        onSave();
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar asignaciones de comidas');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!isOpen || !weeklyPlanning) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-weekly" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Asignar Comidas - Semana {weeklyPlanning.weekNumber}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="week-info">
            <p><strong>Período:</strong> {formatDate(weeklyPlanning.startDate)} - {formatDate(weeklyPlanning.endDate)}</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="days-list">
            {DAYS_OF_WEEK.map(day => (
              <div key={day.value} className="day-section">
                <div className="day-header">
                  <h3>{day.label}</h3>
                </div>

                <div className="meal-types-grid">
                  {/* Entrada - Optional */}
                  <div className="meal-type-row">
                    <label>Entrada (Opcional)</label>
                    <select
                      value={selectedMeals[day.value]?.entradaId || ''}
                      onChange={(e) => handleMealChange(day.value, 'entradaId', e.target.value)}
                      className="meal-select"
                    >
                      <option value="">-- Seleccionar comida --</option>
                      {getMealsByType(MEAL_TYPES.ENTRADA).map(meal => (
                        <option key={meal.id} value={meal.id}>
                          {meal.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Plato Principal - Required */}
                  <div className="meal-type-row">
                    <label>Plato Principal <span className="required">*</span></label>
                    <select
                      value={selectedMeals[day.value]?.principalId || ''}
                      onChange={(e) => handleMealChange(day.value, 'principalId', e.target.value)}
                      className="meal-select"
                      required
                    >
                      <option value="">-- Seleccionar comida --</option>
                      {getMealsByType(MEAL_TYPES.PRINCIPAL).map(meal => (
                        <option key={meal.id} value={meal.id}>
                          {meal.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Plato Alternativo - Required */}
                  <div className="meal-type-row">
                    <label>Plato Alternativo <span className="required">*</span></label>
                    <select
                      value={selectedMeals[day.value]?.alternativoId || ''}
                      onChange={(e) => handleMealChange(day.value, 'alternativoId', e.target.value)}
                      className="meal-select"
                      required
                    >
                      <option value="">-- Seleccionar comida --</option>
                      {getMealsByType(MEAL_TYPES.ALTERNATIVO).map(meal => (
                        <option key={meal.id} value={meal.id}>
                          {meal.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Plato Vegetariano - Required */}
                  <div className="meal-type-row">
                    <label>Plato Vegetariano <span className="required">*</span></label>
                    <select
                      value={selectedMeals[day.value]?.vegetarianoId || ''}
                      onChange={(e) => handleMealChange(day.value, 'vegetarianoId', e.target.value)}
                      className="meal-select"
                      required
                    >
                      <option value="">-- Seleccionar comida --</option>
                      {getMealsByType(MEAL_TYPES.VEGETARIANO).map(meal => (
                        <option key={meal.id} value={meal.id}>
                          {meal.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Asignaciones'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeeklyPlanningModal;
