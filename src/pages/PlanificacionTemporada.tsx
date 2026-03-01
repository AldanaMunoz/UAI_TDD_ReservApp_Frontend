import { useState, useEffect } from 'react';
import TopNavbar from '../components/Layout/TopNavbar';
import WeeklyPlanningModal from '../components/WeeklyPlanningModal';
import seasonService, { type Season } from '../services/seasonService';
import weeklyPlanningService, { type WeeklyPlanning } from '../services/weeklyPlanningService';
import './PlanificacionTemporada.css';

function PlanificacionTemporada() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [weeklyPlannings, setWeeklyPlannings] = useState<WeeklyPlanning[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [selectedWeeklyPlanning, setSelectedWeeklyPlanning] = useState<WeeklyPlanning | null>(null);

  const [showSeasonForm, setShowSeasonForm] = useState(false);
  const [seasonName, setSeasonName] = useState('');
  const [seasonYear, setSeasonYear] = useState('');
  const [seasonStartDate, setSeasonStartDate] = useState('');
  const [seasonEndDate, setSeasonEndDate] = useState('');

  useEffect(() => {
    loadSeasons();
    const now = new Date();
    setSeasonYear(now.getFullYear().toString());
  }, []);

  useEffect(() => {
    if (selectedSeason) {
      loadWeeklyPlannings(selectedSeason.id!);
    }
  }, [selectedSeason]);

  const loadSeasons = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await seasonService.getAll();
      setSeasons(data);
      if (data.length > 0 && !selectedSeason) {
        setSelectedSeason(data[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar temporadas');
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyPlannings = async (seasonId: number) => {
    try {
      setLoading(true);
      setError('');
      const data = await weeklyPlanningService.getBySeason(seasonId);
      setWeeklyPlannings(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar planificaciones semanales');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const year = parseInt(seasonYear);
    if (isNaN(year) || year < 2020 || year > 2050) {
      setError('Año inválido');
      return;
    }

    if (!seasonName || !seasonStartDate || !seasonEndDate) {
      setError('Todos los campos son requeridos');
      return;
    }

    try {
      setLoading(true);
      const newSeason = await seasonService.create({
        name: seasonName,
        year,
        startDate: seasonStartDate,
        endDate: seasonEndDate
      });
      setSuccess('Temporada creada exitosamente');
      setShowSeasonForm(false);
      resetSeasonForm();
      await loadSeasons();
      setSelectedSeason(newSeason);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear temporada');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWeeklyPlannings = async () => {
    console.log('handleGenerateWeeklyPlannings called', selectedSeason);

    if (!selectedSeason) {
      setError('Por favor seleccione una temporada primero');
      return;
    }

    if (weeklyPlannings.length > 0) {
      if (!window.confirm('Esta temporada ya tiene planificaciones semanales. ¿Generar nuevas? Esto no eliminará las existentes.')) {
        console.log('User cancelled generation');
        return;
      }
    }

    try {
      setLoading(true);
      setError('');
      console.log('Calling generateForSeason with seasonId:', selectedSeason.id);
      const result = await weeklyPlanningService.generateForSeason(selectedSeason.id!);
      console.log('Generation result:', result);
      setSuccess(`${result.count} planificaciones semanales generadas exitosamente`);
      await loadWeeklyPlannings(selectedSeason.id!);
    } catch (err: any) {
      console.error('Error generating plannings:', err);
      setError(err.response?.data?.message || 'Error al generar planificaciones semanales');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSeason = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta temporada? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      await seasonService.delete(id);
      setSuccess('Temporada eliminada exitosamente');
      await loadSeasons();
      setSelectedSeason(null);
      setWeeklyPlannings([]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar temporada');
    } finally {
      setLoading(false);
    }
  };

  const resetSeasonForm = () => {
    setSeasonName('');
    setSeasonStartDate('');
    setSeasonEndDate('');
    const now = new Date();
    setSeasonYear(now.getFullYear().toString());
  };

  const formatDate = (dateStr: string | Date): string => {
    if (!dateStr) return 'Invalid Date';

    // If it's already a Date object, use it directly
    let date: Date;
    if (dateStr instanceof Date) {
      date = dateStr;
    } else {
      // Convert string to Date
      // Check if it's already ISO format with time
      if (typeof dateStr === 'string' && dateStr.includes('T')) {
        date = new Date(dateStr);
      } else {
        // Add time component to avoid timezone issues
        date = new Date(dateStr + 'T00:00:00');
      }
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateStr);
      return 'Invalid Date';
    }

    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayOfWeek];
  };

  return (
    <div>
      <TopNavbar />
      <div className="page-container">
        <div className="page-content">
          <div className="page-header">
            <h1>Planificación por Temporada</h1>
            <p className="subtitle">Gestiona temporadas y planificaciones semanales de menús</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="action-buttons">
            <button
              className="btn btn-primary"
              onClick={() => setShowSeasonForm(!showSeasonForm)}
            >
              {showSeasonForm ? 'Cancelar' : 'Crear Nueva Temporada'}
            </button>
          </div>

          {showSeasonForm && (
            <div className="season-form-card">
              <h3>Nueva Temporada</h3>
              <form onSubmit={handleCreateSeason} className="season-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre de Temporada</label>
                    <input
                      type="text"
                      value={seasonName}
                      onChange={(e) => setSeasonName(e.target.value)}
                      placeholder="ej: Primavera, Verano, Otoño, Invierno"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Año</label>
                    <input
                      type="number"
                      value={seasonYear}
                      onChange={(e) => setSeasonYear(e.target.value)}
                      min="2020"
                      max="2050"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Fecha de Inicio</label>
                    <input
                      type="date"
                      value={seasonStartDate}
                      onChange={(e) => setSeasonStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha de Fin</label>
                    <input
                      type="date"
                      value={seasonEndDate}
                      onChange={(e) => setSeasonEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn-create-season" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Temporada'}
                </button>
              </form>
            </div>
          )}

          <div className="seasons-section">
            <h2>Temporadas</h2>
            {loading && !seasons.length ? (
              <div className="loading">Cargando temporadas...</div>
            ) : seasons.length === 0 ? (
              <div className="no-data">
                <p>No se encontraron temporadas</p>
                <p className="hint">Crea una temporada para comenzar la planificación</p>
              </div>
            ) : (
              <div className="seasons-grid">
                {seasons.map((season) => (
                  <div
                    key={season.id}
                    className={`season-card ${selectedSeason?.id === season.id ? 'selected' : ''}`}
                    onClick={() => setSelectedSeason(season)}
                  >
                    <div className="season-header">
                      <h3>{season.name} {season.year}</h3>
                      <button
                        className="btn-delete-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSeason(season.id!);
                        }}
                      >
                        ❌
                      </button>
                    </div>
                    <div className="season-dates">
                      {formatDate(season.startDate)} - {formatDate(season.endDate)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedSeason && (
            <div className="weekly-plannings-section">
              <div className="section-header">
                <h2>Planificaciones Semanales para {selectedSeason.name} {selectedSeason.year}</h2>
                <button
                  className="btn btn-secondary"
                  onClick={handleGenerateWeeklyPlannings}
                  disabled={loading}
                >
                  Generar Planificaciones Semanales
                </button>
              </div>

              {loading && !weeklyPlannings.length ? (
                <div className="loading">Cargando planificaciones semanales...</div>
              ) : weeklyPlannings.length === 0 ? (
                <div className="no-data">
                  <p>No se encontraron planificaciones semanales</p>
                  <p className="hint">Genera planificaciones semanales para esta temporada</p>
                </div>
              ) : (
                <div className="weekly-plannings-grid">
                  {weeklyPlannings.map((planning) => (
                    <div key={`${selectedSeason.id}-${planning.weekNumber}`} className="weekly-planning-card">
                      <div className="planning-header">
                        <h4>Semana {planning.weekNumber}</h4>
                      </div>
                      <div className="planning-dates">
                        {formatDate(planning.startDate)} - {formatDate(planning.endDate)}
                      </div>
                      <button
                        className="btn-assign-meals"
                        onClick={() => {
                          setSelectedWeeklyPlanning(planning);
                          setShowWeeklyModal(true);
                        }}
                      >
                        Asignar Comidas
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <WeeklyPlanningModal
        isOpen={showWeeklyModal}
        onClose={() => {
          setShowWeeklyModal(false);
          setSelectedWeeklyPlanning(null);
        }}
        weeklyPlanning={selectedWeeklyPlanning}
        onSave={() => {
          loadWeeklyPlannings(selectedSeason!.id!);
        }}
      />
    </div>
  );
}

export default PlanificacionTemporada;
