import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import TopNavbar from '../components/Layout/TopNavbar';
import menuService from '../services/menuService';
import './HistorialReservas.css';

interface ReservaHistorial {
  id: number;
  fecha_reservada: string;
  estado_reserva: 'confirmada' | 'cancelada' | 'noshow' | 'asistio' | 'liquidada';
  entrada_nombre?: string;
  principal_nombre?: string;
  postre_nombre?: string;
  bebida_nombre?: string;
}

function HistorialReservas() {
  const { user } = useAuth();
  const [reservas, setReservas] = useState<ReservaHistorial[]>([]);
  const [filteredReservas, setFilteredReservas] = useState<ReservaHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadReservas();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [reservas, fechaInicio, fechaFin, estadoFiltro]);

  const loadReservas = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError('');

    try {
      const response = await menuService.getMyReservations(user.id);

      // Ordenar por fecha descendente (más reciente primero)
      const sortedReservas = (response as ReservaHistorial[]).sort((a, b) => {
        return new Date(b.fecha_reservada).getTime() - new Date(a.fecha_reservada).getTime();
      });

      setReservas(sortedReservas);
    } catch (err: any) {
      console.error('Error cargando historial:', err);
      setError(err.response?.data?.message || 'Error al cargar el historial de reservas');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let filtered = [...reservas];

    // Filtrar por rango de fechas
    if (fechaInicio) {
      filtered = filtered.filter((reserva) => {
        const fechaReserva = new Date(reserva.fecha_reservada).toISOString().split('T')[0];
        return fechaReserva >= fechaInicio;
      });
    }

    if (fechaFin) {
      filtered = filtered.filter((reserva) => {
        const fechaReserva = new Date(reserva.fecha_reservada).toISOString().split('T')[0];
        return fechaReserva <= fechaFin;
      });
    }

    // Filtrar por estado
    if (estadoFiltro !== 'todos') {
      filtered = filtered.filter((reserva) => reserva.estado_reserva === estadoFiltro);
    }

    setFilteredReservas(filtered);
    setCurrentPage(1); // Reset a la primera página cuando cambian los filtros
  };

  const limpiarFiltros = () => {
    setFechaInicio('');
    setFechaFin('');
    setEstadoFiltro('todos');
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getEstadoBadgeClass = (estado: string): string => {
    switch (estado) {
      case 'confirmada':
        return 'badge-confirmada';
      case 'cancelada':
        return 'badge-cancelada';
      case 'noshow':
        return 'badge-noshow';
      case 'asistio':
        return 'badge-asistio';
      case 'liquidada':
        return 'badge-liquidada';
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
        return 'No asistió';
      case 'asistio':
        return 'Asistió';
      case 'liquidada':
        return 'Liquidada';
      default:
        return estado;
    }
  };

  // Calcular paginación
  const totalPages = Math.ceil(filteredReservas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReservas = filteredReservas.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Generar números de página a mostrar (con elipsis)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage <= 3) {
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
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

          {/* Filtros */}
          <div className="filtros-container">
            <div className="filtros-row">
              <div className="filtro-grupo">
                <label htmlFor="fecha-inicio">Desde:</label>
                <input
                  type="date"
                  id="fecha-inicio"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="filtro-input"
                />
              </div>

              <div className="filtro-grupo">
                <label htmlFor="fecha-fin">Hasta:</label>
                <input
                  type="date"
                  id="fecha-fin"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="filtro-input"
                />
              </div>

              <div className="filtro-grupo">
                <label htmlFor="estado">Estado:</label>
                <select
                  id="estado"
                  value={estadoFiltro}
                  onChange={(e) => setEstadoFiltro(e.target.value)}
                  className="filtro-select"
                >
                  <option value="todos">Todos</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="asistio">Asistió</option>
                  <option value="noshow">No asistió</option>
                  <option value="cancelada">Cancelada</option>
                  <option value="liquidada">Liquidada</option>
                </select>
              </div>

              <button onClick={limpiarFiltros} className="btn-limpiar">
                Limpiar filtros
              </button>
            </div>

            <div className="stats-container">
              <div className="stat-item">
                <span className="stat-label">Total:</span>
                <span className="stat-value">{filteredReservas.length}</span>
              </div>
              <div className="stat-item stat-confirmada">
                <span className="stat-label">Confirmadas:</span>
                <span className="stat-value">{filteredReservas.filter(r => r.estado_reserva === 'confirmada').length}</span>
              </div>
              <div className="stat-item stat-asistio">
                <span className="stat-label">Asistió:</span>
                <span className="stat-value">{filteredReservas.filter(r => r.estado_reserva === 'asistio').length}</span>
              </div>
              <div className="stat-item stat-noshow">
                <span className="stat-label">No asistió:</span>
                <span className="stat-value">{filteredReservas.filter(r => r.estado_reserva === 'noshow').length}</span>
              </div>
              <div className="stat-item stat-cancelada">
                <span className="stat-label">Canceladas:</span>
                <span className="stat-value">{filteredReservas.filter(r => r.estado_reserva === 'cancelada').length}</span>
              </div>
              <div className="stat-item stat-liquidada">
                <span className="stat-label">Liquidadas:</span>
                <span className="stat-value">{filteredReservas.filter(r => r.estado_reserva === 'liquidada').length}</span>
              </div>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading">Cargando historial...</div>
          ) : filteredReservas.length === 0 ? (
            <div className="no-reservas">
              <p>No se encontraron reservas con los filtros seleccionados</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="reservas-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Entrada</th>
                      <th>Principal</th>
                      <th>Postre</th>
                      <th>Bebida</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReservas.map((reserva) => (
                      <tr key={reserva.id}>
                        <td className="fecha-col">{formatDate(reserva.fecha_reservada)}</td>
                        <td>
                          <span className={`estado-badge ${getEstadoBadgeClass(reserva.estado_reserva)}`}>
                            {getEstadoLabel(reserva.estado_reserva)}
                          </span>
                        </td>
                        <td>{reserva.entrada_nombre || '-'}</td>
                        <td>{reserva.principal_nombre || '-'}</td>
                        <td>{reserva.postre_nombre || '-'}</td>
                        <td>{reserva.bebida_nombre || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination-container">
                <div className="pagination-info">
                  <span>Mostrando {startIndex + 1} - {Math.min(endIndex, filteredReservas.length)} de {filteredReservas.length} registros</span>
                  <div className="items-per-page">
                    <label htmlFor="items-per-page">Registros por página:</label>
                    <select
                      id="items-per-page"
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      className="page-size-select"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="pagination-controls">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      ← Anterior
                    </button>

                    <div className="pagination-pages">
                      {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => goToPage(page as number)}
                            className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                          >
                            {page}
                          </button>
                        )
                      ))}
                    </div>

                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="pagination-btn"
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default HistorialReservas;
