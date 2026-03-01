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

  const handleExport = () => {
    if (!liquidationId) return;
    const url = liquidationService.getExportCSVUrl(liquidationId);
    window.open(url, '_blank');
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
                  Exportar a CSV
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
                      {details.reservations.map((res: ReservationDetail) => (
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
