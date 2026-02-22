import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import TopNavbar from '../components/Layout/TopNavbar';
import menuService, { type Reserva } from '../services/menuService';
import './HistorialReservas.css';

interface ReservaHistorial {
  id: number;
  fecha_reservada: string;
  estado_reserva: 'confirmada' | 'cancelada' | 'noshow';
  entrada_nombre?: string;
  principal_nombre?: string;
  postre_nombre?: string;
  bebida_nombre?: string;
}

function HistorialReservas() {
  const { user } = useAuth();
  const [reservas, setReservas] = useState<ReservaHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estado para navegación de meses
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    loadReservas();
  }, [selectedMonth]);

  const loadReservas = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError('');

    try {
      // Por ahora, como no tenemos un endpoint específico para historial,
      // vamos a cargar las reservas y filtrarlas por mes en el frontend
      // TODO: Cuando tu compañero implemente GET /reservations/history/:userId
      // usar ese endpoint que devuelva solo reservas pasadas

      const response = await menuService.getMyReservations(user.id);

      // Filtrar por mes seleccionado
      const [year, month] = selectedMonth.split('-');
      const filteredReservas = response.filter((reserva: any) => {
        if (!reserva.fecha_reservada) return false;
        const reservaDate = new Date(reserva.fecha_reservada);
        return (
          reservaDate.getFullYear() === parseInt(year) &&
          reservaDate.getMonth() + 1 === parseInt(month)
        );
      }) as ReservaHistorial[];

      // Ordenar por fecha descendente (más reciente primero)
      filteredReservas.sort((a, b) => {
        return new Date(b.fecha_reservada).getTime() - new Date(a.fecha_reservada).getTime();
      });

      setReservas(filteredReservas);
    } catch (err: any) {
      console.error('Error cargando historial:', err);
      setError(err.response?.data?.message || 'Error al cargar el historial de reservas');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const day = date.getDate();
    const month = date.getMonth() + 1;

    return `${days[date.getDay()]} ${day}/${month}`;
  };

  const getEstadoBadgeClass = (estado: string): string => {
    switch (estado) {
      case 'confirmada':
        return 'badge-confirmada';
      case 'cancelada':
        return 'badge-cancelada';
      case 'noshow':
        return 'badge-noshow';
      default:
        return '';
    }
  };

  const getEstadoLabel = (estado: string): string => {
    switch (estado) {
      case 'confirmada':
        return 'Confirmada';
      case 'cancelada':
        return 'Cancelada';
      case 'noshow':
        return 'No Show';
      default:
        return estado;
    }
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);

    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }

    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const getMonthName = (): string => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${months[month - 1]} ${year}`;
  };

  return (
    <>
      <TopNavbar />
      <div className="page-container">
        <div className="page-content">
          <div className="page-header">
            <div>
              <h1>Historial de Reservas</h1>
              <p className="subtitle">Mis reservas anteriores</p>
            </div>
          </div>

          <div className="month-selector">
            <button
              className="month-nav-btn"
              onClick={() => changeMonth('prev')}
            >
              ← Mes Anterior
            </button>
            <h2 className="month-title">{getMonthName()}</h2>
            <button
              className="month-nav-btn"
              onClick={() => changeMonth('next')}
            >
              Mes Siguiente →
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading">Cargando historial...</div>
          ) : reservas.length === 0 ? (
            <div className="no-reservas">
              <p>No tienes reservas registradas en {getMonthName()}</p>
            </div>
          ) : (
            <div className="reservas-list">
              {reservas.map((reserva) => (
                <div key={reserva.id} className="reserva-card">
                  <div className="reserva-header">
                    <div className="reserva-date">
                      {formatDate(reserva.fecha_reservada)}
                    </div>
                    <span className={`estado-badge ${getEstadoBadgeClass(reserva.estado_reserva)}`}>
                      {getEstadoLabel(reserva.estado_reserva)}
                    </span>
                  </div>

                  <div className="reserva-details">
                    {reserva.entrada_nombre && (
                      <div className="detail-item">
                        <span className="detail-label">Entrada:</span>
                        <span className="detail-value">{reserva.entrada_nombre}</span>
                      </div>
                    )}

                    {reserva.principal_nombre && (
                      <div className="detail-item">
                        <span className="detail-label">Principal:</span>
                        <span className="detail-value">{reserva.principal_nombre}</span>
                      </div>
                    )}

                    {reserva.bebida_nombre && (
                      <div className="detail-item">
                        <span className="detail-label">Bebida:</span>
                        <span className="detail-value">{reserva.bebida_nombre}</span>
                      </div>
                    )}

                    {reserva.postre_nombre && (
                      <div className="detail-item">
                        <span className="detail-label">Postre:</span>
                        <span className="detail-value">{reserva.postre_nombre}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default HistorialReservas;
