import { useState, useEffect } from 'react';
import TopNavbar from '../components/Layout/TopNavbar';
import menuService, { type MenuDelDia } from '../services/menuService';
import './PlanificacionEmpleado.css';

function PlanificacionEmpleado() {
  const [weekMenus, setWeekMenus] = useState<{date: string; menu: MenuDelDia | null}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // 0 = semana actual, 1 = próxima, -1 = anterior

  useEffect(() => {
    loadWeekMenus();
  }, [currentWeekOffset]);

  const loadWeekMenus = async () => {
    try {
      setLoading(true);
      setError('');
      const dates: {date: string; menu: MenuDelDia | null}[] = [];

      // Función helper para formatear fecha en zona horaria local
      const toLocalDateString = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Calcular el lunes de la semana actual
      const today = new Date();
      const currentDay = today.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado

      let daysFromMonday: number;
      if (currentDay === 0) {
        // Domingo: ir al lunes de la semana pasada (-6 días)
        daysFromMonday = -6;
      } else if (currentDay === 6) {
        // Sábado: ir al lunes de esta semana (-5 días)
        daysFromMonday = -5;
      } else {
        // Lunes a viernes: ir al lunes de esta semana
        daysFromMonday = 1 - currentDay;
      }

      const monday = new Date(today);
      monday.setDate(today.getDate() + daysFromMonday);

      // Aplicar el offset de semanas
      monday.setDate(monday.getDate() + (currentWeekOffset * 7));

      // Obtener los 5 días laborables de la semana (lunes a viernes)
      for (let i = 0; i < 5; i++) {
        const weekDay = new Date(monday);
        weekDay.setDate(monday.getDate() + i);
        const dateStr = toLocalDateString(weekDay);

        try {
          const menuData = await menuService.getMenuByDate(dateStr);
          dates.push({ date: dateStr, menu: menuData.menu });
        } catch {
          dates.push({ date: dateStr, menu: null });
        }
      }

      setWeekMenus(dates);
    } catch (err) {
      console.error('Error cargando menús de la semana:', err);
      setError('Error al cargar la planificación semanal');
    } finally {
      setLoading(false);
    }
  };

  const formatDateDisplay = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    return `${days[date.getDay()]} ${date.getDate()}/${months[date.getMonth()]}`;
  };

  const getWeekRange = (): string => {
    if (weekMenus.length === 0) return '';

    const firstDate = new Date(weekMenus[0].date + 'T00:00:00');
    const lastDate = new Date(weekMenus[weekMenus.length - 1].date + 'T00:00:00');

    const formatShort = (date: Date) => {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    return `${formatShort(firstDate)} - ${formatShort(lastDate)}`;
  };

  const getWeekNumber = (): string => {
    if (currentWeekOffset === 0) return 'Semana Actual';
    if (currentWeekOffset === 1) return 'Próxima Semana';
    if (currentWeekOffset === -1) return 'Semana Anterior';
    if (currentWeekOffset > 1) return `Semana +${currentWeekOffset}`;
    return `Semana ${currentWeekOffset}`;
  };

  const handlePreviousWeek = () => {
    setCurrentWeekOffset(prev => prev - 1);
  };

  const handleNextWeek = () => {
    setCurrentWeekOffset(prev => prev + 1);
  };

  return (
    <>
      <TopNavbar />
      <div className="page-container">
        <div className="page-content">
          <div className="page-header">
            <h1>Planificación Semanal</h1>
            <p className="subtitle">Menú de los próximos días</p>
          </div>

          <div className="week-selector">
            <button
              className="week-nav-btn"
              onClick={handlePreviousWeek}
              disabled={loading}
            >
              ← Semana Anterior
            </button>
            <div className="week-info">
              <span className="week-label">{getWeekNumber()}</span>
              {weekMenus.length > 0 && (
                <span className="week-range">{getWeekRange()}</span>
              )}
            </div>
            <button
              className="week-nav-btn"
              onClick={handleNextWeek}
              disabled={loading}
            >
              Semana Siguiente →
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading">Cargando planificación...</div>
          ) : (
            <div className="week-menus">
              {weekMenus.map((item, index) => (
                <div key={item.date} className="day-menu-card">
                  <h3 className="day-title">
                    Día {index + 1} - {formatDateDisplay(item.date)}
                  </h3>

                  {item.menu ? (
                    <div className="menu-content">
                      {item.menu.entrada_nombre && (
                        <div className="menu-item">
                          <strong>Entrada:</strong> {item.menu.entrada_nombre}
                        </div>
                      )}

                      <div className="menu-section">
                        <strong>Platos Principales:</strong>
                        <ul className="platos-list">
                          {item.menu.principal_nombre && (
                            <li>{item.menu.principal_nombre}</li>
                          )}
                          {item.menu.alternativo_nombre && (
                            <li>{item.menu.alternativo_nombre}</li>
                          )}
                          {item.menu.vegetariana_nombre && (
                            <li>{item.menu.vegetariana_nombre} (Vegetariana)</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="no-menu">
                      No hay menú planificado para este día
                    </p>
                  )}
                </div>
              ))}

              {weekMenus.length === 0 && !loading && (
                <div className="no-data">
                  <p>No hay planificación disponible para los próximos días</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default PlanificacionEmpleado;
