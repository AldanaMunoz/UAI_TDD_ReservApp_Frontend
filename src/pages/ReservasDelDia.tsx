import { useState, useEffect } from 'react';
import TopNavbar from '../components/Layout/TopNavbar';
import './ReservasDelDia.css';

interface Reserva {
  id: number;
  nombre_completo: string;
  tipo_empleado: string;
  turno: string;
  entrada: string | null;
  plato_principal: string;
  postre: string;
  bebida: string;
  codigo_qr: string;
  estado_reserva: string;
  asistio?: boolean;
}

function ReservasDelDia() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [filteredReservas, setFilteredReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);

  // Selección de turno
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<string>('');
  const [turnoLocked, setTurnoLocked] = useState(false);

  // Filtros
  const [searchName, setSearchName] = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (turnoSeleccionado && turnoLocked) {
      loadReservas();
    }
  }, [turnoSeleccionado, turnoLocked]);

  useEffect(() => {
    let filtered = reservas;

    // Filtrar por turno seleccionado (siempre)
    if (turnoSeleccionado) {
      filtered = filtered.filter(r => r.turno === turnoSeleccionado);
    }

    // Filtros adicionales
    if (searchName) {
      filtered = filtered.filter(r =>
        r.nombre_completo.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (filterTipo) {
      filtered = filtered.filter(r => r.tipo_empleado === filterTipo);
    }

    setFilteredReservas(filtered);
    setCurrentPage(1); // Reset a la primera página cuando cambian los filtros
  }, [reservas, searchName, filterTipo, turnoSeleccionado]);

  const loadReservas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/menu/reservas/dia/${fechaSeleccionada}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar reservas');
      }

      const data = await response.json();
      console.log('Reservas cargadas:', data);
      setReservas(data.reservas || []);
    } catch (error) {
      console.error('Error cargando reservas:', error);
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = async (reservaId: number, checked: boolean) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:3000/api/menu/reservas/${reservaId}/asistencia`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ asistio: checked })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar asistencia');
      }

      const data = await response.json();

      // Actualizar el estado local
      setReservas(prev => prev.map(r =>
        r.id === reservaId ? { ...r, estado_reserva: data.estado_reserva } : r
      ));

      console.log(`Reserva ${reservaId} marcada como ${checked ? 'asistió' : 'confirmada'}`);
    } catch (error) {
      console.error('Error actualizando asistencia:', error);
      alert('Error al actualizar la asistencia');
    }
  };

  const handleSeleccionarTurno = () => {
    if (!turnoSeleccionado) {
      alert('Por favor seleccione un turno');
      return;
    }
    setTurnoLocked(true);
  };

  const handleCambiarTurno = () => {
    setTurnoLocked(false);
    setReservas([]);
    setFilteredReservas([]);
  };

  const isFechaFutura = () => {
    const hoy = new Date().toISOString().split('T')[0];
    return fechaSeleccionada > hoy;
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
    const maxVisible = 7; // Máximo de botones de página visibles

    if (totalPages <= maxVisible) {
      // Si hay pocas páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Siempre mostrar primera página
      pages.push(1);

      if (currentPage <= 3) {
        // Cerca del inicio
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Cerca del final
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // En el medio
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

  const handleFinalizarTurno = async () => {
    if (!window.confirm(`¿Está seguro que desea finalizar el turno ${turnoSeleccionado}? Todas las reservas no marcadas se registrarán como "No asistió"`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:3000/api/menu/reservas/finalizar-turno/${fechaSeleccionada}/${turnoSeleccionado}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al finalizar turno');
      }

      const data = await response.json();
      alert(`Turno finalizado. ${data.reservasNoShow} reserva(s) marcada(s) como "No asistió"`);

      // Recargar las reservas
      loadReservas();
    } catch (error) {
      console.error('Error finalizando turno:', error);
      alert('Error al finalizar el turno');
    }
  };

  return (
    <>
      <TopNavbar />
      <div className="main-content">
        <div className="page-header">
          <h1>Reservas del día</h1>
          <div className="fecha-selector-container">
            <label htmlFor="fecha-selector">Fecha:</label>
            <input
              id="fecha-selector"
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => {
                setFechaSeleccionada(e.target.value);
                setTurnoLocked(false);
                setReservas([]);
                setFilteredReservas([]);
              }}
              className="fecha-selector-input"
            />
            <p className="fecha-actual">
              {new Date(fechaSeleccionada + 'T00:00:00').toLocaleDateString('es-AR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Selector de turno */}
        {!turnoLocked ? (
          <div className="turno-selector-container">
            <div className="turno-selector-card">
              <h2>Seleccione el turno para gestionar</h2>
              <div className="turno-options">
                <button
                  className={`turno-option ${turnoSeleccionado === 'manana' ? 'selected' : ''}`}
                  onClick={() => setTurnoSeleccionado('manana')}
                >
                  <span className="turno-label">Mañana</span>
                </button>
                <button
                  className={`turno-option ${turnoSeleccionado === 'tarde' ? 'selected' : ''}`}
                  onClick={() => setTurnoSeleccionado('tarde')}
                >
                  <span className="turno-label">Tarde</span>
                </button>
                <button
                  className={`turno-option ${turnoSeleccionado === 'noche' ? 'selected' : ''}`}
                  onClick={() => setTurnoSeleccionado('noche')}
                >
                  <span className="turno-label">Noche</span>
                </button>
              </div>
              <button
                className="btn-confirmar-turno"
                onClick={handleSeleccionarTurno}
                disabled={!turnoSeleccionado}
              >
                Confirmar Turno
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Indicador de turno seleccionado */}
            <div className="turno-badge-container">
              <div className="turno-badge">
                <span>Turno actual: <strong className="capitalize">{turnoSeleccionado}</strong></span>
                <button className="btn-cambiar-turno" onClick={handleCambiarTurno}>
                  Cambiar turno
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading-container">
                <p>Cargando reservas...</p>
              </div>
            ) : (
              <>

        <div className="reservas-stats">
          <div className="stat-card">
            <h3>Total reservas</h3>
            <p className="stat-number">{filteredReservas.length}</p>
          </div>
          <div className="stat-card">
            <h3>Confirmadas</h3>
            <p className="stat-number">
              {filteredReservas.filter(r => r.estado_reserva === 'confirmada').length}
            </p>
          </div>
          <div className="stat-card">
            <h3>Asistieron</h3>
            <p className="stat-number">
              {filteredReservas.filter(r => r.estado_reserva === 'asistio').length}
            </p>
          </div>
          <div className="stat-card">
            <h3>No asistieron</h3>
            <p className="stat-number">
              {filteredReservas.filter(r => r.estado_reserva === 'noshow').length}
            </p>
          </div>
        </div>

        <div className="filters-section">
          <div className="filters-bar">
            <div className="filter-group">
              <label htmlFor="searchName">Buscar por nombre:</label>
              <input
                id="searchName"
                type="text"
                placeholder="Buscar empleado..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="filterTipo">Tipo de empleado:</label>
              <select
                id="filterTipo"
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="filter-select"
              >
                <option value="">Todos</option>
                <option value="interno">Interno</option>
                <option value="externo">Externo</option>
              </select>
            </div>
          </div>

          <div className="actions-bar">
            <button
              className="btn-finalizar-turno"
              onClick={handleFinalizarTurno}
              disabled={reservas.length === 0 || isFechaFutura()}
              title={isFechaFutura() ? 'No se puede finalizar un turno de una fecha futura' : 'Finalizar turno'}
            >
              Finalizar Turno
            </button>
          </div>
        </div>

        <div className="reservas-table-container">
          <table className="reservas-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Turno</th>
                <th>Entrada</th>
                <th>Plato Principal</th>
                <th>Postre</th>
                <th>Bebida</th>
                <th>Estado</th>
                <th>Asistencia</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="no-data">
                    {reservas.length === 0 ? 'No hay reservas para el día de hoy' : 'No se encontraron reservas con los filtros seleccionados'}
                  </td>
                </tr>
              ) : (
                paginatedReservas.map((reserva) => (
                  <tr key={reserva.id}>
                    <td className="nombre-cell">{reserva.nombre_completo}</td>
                    <td>{reserva.tipo_empleado === 'interno' ? 'Interno' : 'Externo'}</td>
                    <td className="capitalize">{reserva.turno}</td>
                    <td>{reserva.entrada || '-'}</td>
                    <td className="plato-principal">{reserva.plato_principal}</td>
                    <td>{reserva.postre}</td>
                    <td>{reserva.bebida}</td>
                    <td>
                      <span className={`estado-badge ${reserva.estado_reserva}`}>
                        {reserva.estado_reserva === 'confirmada' ? 'Confirmada' :
                         reserva.estado_reserva === 'asistio' ? 'Asistió' :
                         reserva.estado_reserva === 'noshow' ? 'No asistió' :
                         'Cancelada'}
                      </span>
                    </td>
                    <td className="asistencia-cell">
                      <input
                        type="checkbox"
                        checked={reserva.estado_reserva === 'asistio'}
                        onChange={(e) => handleAttendanceChange(reserva.id, e.target.checked)}
                        disabled={reserva.estado_reserva === 'noshow' || reserva.estado_reserva === 'cancelada'}
                        className="attendance-checkbox"
                        title={
                          reserva.estado_reserva === 'confirmada'
                            ? 'Marcar asistencia'
                            : reserva.estado_reserva === 'asistio'
                            ? 'Asistió'
                            : reserva.estado_reserva === 'noshow'
                            ? 'No asistió'
                            : 'Reserva cancelada'
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredReservas.length > 0 && (
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
        )}
            </>
          )}
        </>
      )}
      </div>
    </>
  );
}

export default ReservasDelDia;