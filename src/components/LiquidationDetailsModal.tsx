import { useState, useEffect } from 'react';
import liquidationService, { type LiquidationDetails, type ReservationDetail } from '../services/liquidationService';
import './LiquidationDetailsModal.css';

interface LiquidationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  liquidationId: number | null;
}

function LiquidationDetailsModal({ isOpen, onClose, liquidationId }: LiquidationDetailsModalProps) {
  const [details, setDetails] = useState<LiquidationDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (isOpen && liquidationId) {
      loadDetails();
    }
  }, [isOpen, liquidationId]);

  const loadDetails = async () => {
    if (!liquidationId) return;

    try {
      setLoading(true);
      setError('');
      console.log('Cargando detalles para liquidación ID:', liquidationId);
      const data = await liquidationService.getDetails(liquidationId);
      console.log('Datos recibidos:', data);
      setDetails(data);
    } catch (err: any) {
      console.error('Error al cargar detalles:', err);
      console.error('Response:', err.response);
      const errorMsg = err.response?.data?.message || err.message || 'Error al cargar detalle de liquidación';
      setError(errorMsg);
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

  const formatMonth = (month: number): string => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1] || month.toString();
  };

  const handleExport = async () => {
    if (!liquidationId) return;

    try {
      setLoading(true);
      await liquidationService.exportToExcel(liquidationId);
    } catch (err: any) {
      console.error('Error al exportar Excel:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Error al exportar Excel';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Calcular paginación
  const reservations = details?.reservations || [];
  const totalPages = Math.ceil(reservations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReservations = reservations.slice(startIndex, endIndex);

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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-details" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Detalle de Liquidación</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <div className="loading">Cargando detalles...</div>
          ) : details ? (
            <>
              <div className="liquidation-summary">
                <h3>{formatMonth(details.liquidation.month)} {details.liquidation.year}</h3>
                <div className="summary-row">
                  <span>Total de reservas:</span>
                  <strong>{details.reservations.length}</strong>
                </div>
                <div className="summary-row">
                  <span>Monto total:</span>
                  <strong className="total-amount">${Number(details.liquidation.totalAmount || 0).toFixed(2)}</strong>
                </div>
                <button className="btn btn-export" onClick={handleExport}>
                  Exportar a Excel
                </button>
              </div>

              {details.reservations.length === 0 ? (
                <p className="no-data">No hay reservas en esta liquidación</p>
              ) : (
                <div className="reservations-table-container">
                  <table className="reservations-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Fecha</th>
                        <th>Empleado</th>
                        <th>Tipo</th>
                        <th>Precio Base</th>
                        <th>Precio Aplicado</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedReservations.map((res: ReservationDetail) => (
                        <tr key={res.reservationId}>
                          <td>{res.reservationId}</td>
                          <td>{formatDate(res.reservedDate)}</td>
                          <td>{res.employeeName} {res.employeeLastName}</td>
                          <td>
                            {res.employeeType === 'interno' ? 'Interno' : 'Externo'}
                          </td>
                          <td>${Number(res.basePrice).toFixed(2)}</td>
                          <td className="price-applied">${Number(res.appliedPrice).toFixed(2)}</td>
                          <td>
                            <span className={`status-badge status-${res.status}`}>
                              {res.status === 'confirmada' ? 'confirmada' :
                               res.status === 'asistio' ? 'asistio' :
                               res.status === 'noshow' ? 'noshow' :
                               res.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {details && details.reservations.length > 0 && (
                <div className="pagination-container">
                  <div className="pagination-info">
                    <span>Mostrando {startIndex + 1} - {Math.min(endIndex, reservations.length)} de {reservations.length} registros</span>
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
          ) : (
            <div className="no-data">No se encontraron detalles</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LiquidationDetailsModal;
