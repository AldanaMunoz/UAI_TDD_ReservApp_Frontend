import { useState, useEffect, useRef } from 'react';
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

interface SearchableSelectProps {
  value: number | null;
  onChange: (value: string) => void;
  options: Food[];
  placeholder?: string;
  required?: boolean;
}

function SearchableSelect({ value, onChange, options, placeholder, required }: SearchableSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedMeal = options.find(m => m.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(meal =>
    meal.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (mealId: number) => {
    onChange(mealId.toString());
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setSearchTerm('');
  };

  return (
    <div className="searchable-select" ref={wrapperRef}>
      <div className="searchable-select-input">
        <input
          type="text"
          value={isOpen ? searchTerm : (selectedMeal?.name || '')}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="meal-search-input"
        />
        {selectedMeal && !isOpen && (
          <button
            type="button"
            className="clear-btn"
            onClick={handleClear}
            title="Limpiar selección"
          >
            ×
          </button>
        )}
      </div>
      {isOpen && (
        <div className="searchable-select-dropdown">
          {filteredOptions.length === 0 ? (
            <div className="no-results">No se encontraron comidas</div>
          ) : (
            filteredOptions.map(meal => (
              meal.id != null && (
                <div
                  key={meal.id}
                  className={`searchable-select-option ${value != null && meal.id === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(meal.id!)}
                >
                  {meal.name}
                </div>
              )
            ))
          )}
        </div>
      )}
    </div>
  );
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
                    <SearchableSelect
                      value={selectedMeals[day.value]?.entradaId || null}
                      onChange={(value) => handleMealChange(day.value, 'entradaId', value)}
                      options={getMealsByType(MEAL_TYPES.ENTRADA)}
                      placeholder="Buscar entrada..."
                    />
                  </div>

                  {/* Plato Principal - Required */}
                  <div className="meal-type-row">
                    <label>Plato Principal <span className="required">*</span></label>
                    <SearchableSelect
                      value={selectedMeals[day.value]?.principalId || null}
                      onChange={(value) => handleMealChange(day.value, 'principalId', value)}
                      options={getMealsByType(MEAL_TYPES.PRINCIPAL)}
                      placeholder="Buscar plato principal..."
                      required
                    />
                  </div>

                  {/* Plato Alternativo - Required */}
                  <div className="meal-type-row">
                    <label>Plato Alternativo <span className="required">*</span></label>
                    <SearchableSelect
                      value={selectedMeals[day.value]?.alternativoId || null}
                      onChange={(value) => handleMealChange(day.value, 'alternativoId', value)}
                      options={getMealsByType(MEAL_TYPES.ALTERNATIVO)}
                      placeholder="Buscar plato alternativo..."
                      required
                    />
                  </div>

                  {/* Plato Vegetariano - Required */}
                  <div className="meal-type-row">
                    <label>Plato Vegetariano <span className="required">*</span></label>
                    <SearchableSelect
                      value={selectedMeals[day.value]?.vegetarianoId || null}
                      onChange={(value) => handleMealChange(day.value, 'vegetarianoId', value)}
                      options={getMealsByType(MEAL_TYPES.VEGETARIANO)}
                      placeholder="Buscar plato vegetariano..."
                      required
                    />
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
