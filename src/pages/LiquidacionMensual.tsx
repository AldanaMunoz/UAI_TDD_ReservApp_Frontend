import { useState, useEffect } from 'react';
import TopNavbar from '../components/Layout/TopNavbar';
import PriceHistoryModal from '../components/PriceHistoryModal';
import LiquidationDetailsModal from '../components/LiquidationDetailsModal';
import liquidationService, { type Liquidation } from '../services/liquidationService';
import './LiquidacionMensual.css';

function LiquidacionMensual() {
  const [liquidations, setLiquidations] = useState<Liquidation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLiquidationId, setSelectedLiquidationId] = useState<number | null>(null);
  const [showGenerateForm, setShowGenerateForm] = useState(false);

  const [generateMonth, setGenerateMonth] = useState('');
  const [generateYear, setGenerateYear] = useState('');

  useEffect(() => {
    loadLiquidations();

    // Set current month and year as default
    const now = new Date();
    setGenerateMonth((now.getMonth() + 1).toString());
    setGenerateYear(now.getFullYear().toString());
  }, []);

  const loadLiquidations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await liquidationService.getAll();
      // Sort by year desc, then month desc
      setLiquidations(data.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar liquidaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const month = parseInt(generateMonth);
    const year = parseInt(generateYear);

    if (isNaN(month) || month < 1 || month > 12) {
      setError('Mes inválido (1-12)');
      return;
    }

    if (isNaN(year) || year < 2020 || year > 2050) {
      setError('Año inválido');
      return;
    }

    try {
      setLoading(true);
      const result = await liquidationService.generate(month, year);
      setSuccess(
        `Liquidación generada exitosamente: ${result.reservationsUpdated} reservas procesadas, monto total: $${Number(result.totalAmount).toFixed(2)}`
      );
      setShowGenerateForm(false);
      await loadLiquidations();
    } catch (err: any) {
      const errorData = err.response?.data;

      if (errorData?.code === 'LIQUIDATION_EXISTS') {
        setError('Ya existe una liquidación para ese mes/año');
      } else if (errorData?.code === 'MISSING_PRICE_FOR_DATE') {
        setError(
          `Error: No hay precio histórico para la fecha ${errorData.data?.reservedAt}. Por favor, configure los precios históricos primero.`
        );
      } else {
        setError(errorData?.message || 'Error al generar liquidación');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (month: number): string => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1] || month.toString();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta liquidación? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await liquidationService.delete(id);
      setSuccess('Liquidación eliminada exitosamente');
      await loadLiquidations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar liquidación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopNavbar />
      <div className="page-container">
        <div className="page-content">
          <div className="page-header">
            <h1>Liquidación Mensual</h1>
            <p className="subtitle">Generar y gestionar liquidaciones de almuerzos</p>
          </div>

          <div className="action-buttons">
            <button
              className="btn btn-primary"
              onClick={() => setShowGenerateForm(!showGenerateForm)}
            >
              {showGenerateForm ? 'Cancelar' : 'Generar Liquidación'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowPriceModal(true)}
            >
              Gestionar Precios
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {showGenerateForm && (
            <div className="generate-form-card">
              <h3>Generar Nueva Liquidación</h3>
              <form onSubmit={handleGenerate} className="generate-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Mes</label>
                    <select
                      value={generateMonth}
                      onChange={(e) => setGenerateMonth(e.target.value)}
                      required
                    >
                      <option value="1">Enero</option>
                      <option value="2">Febrero</option>
                      <option value="3">Marzo</option>
                      <option value="4">Abril</option>
                      <option value="5">Mayo</option>
                      <option value="6">Junio</option>
                      <option value="7">Julio</option>
                      <option value="8">Agosto</option>
                      <option value="9">Septiembre</option>
                      <option value="10">Octubre</option>
                      <option value="11">Noviembre</option>
                      <option value="12">Diciembre</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Año</label>
                    <input
                      type="number"
                      value={generateYear}
                      onChange={(e) => setGenerateYear(e.target.value)}
                      min="2020"
                      max="2050"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-generate" disabled={loading}>
                  {loading ? 'Generando...' : 'Generar Liquidación'}
                </button>
              </form>
              <p className="form-note">
                La liquidación incluirá todas las reservas confirmadas y no-show del mes seleccionado,
                aplicando los precios históricos vigentes en cada fecha.
              </p>
            </div>
          )}

          <div className="liquidations-section">
            <h2>Historial de Liquidaciones</h2>

            {loading && liquidations.length === 0 ? (
              <div className="loading">Cargando liquidaciones...</div>
            ) : liquidations.length === 0 ? (
              <div className="no-data">
                <p>No hay liquidaciones generadas</p>
                <p className="hint">Haga clic en "Generar Liquidación" para crear una nueva</p>
              </div>
            ) : (
              <div className="liquidations-grid">
                {liquidations.map((liq) => (
                  <div key={liq.id} className="liquidation-card">
                    <div className="liquidation-header">
                      <h3>
                        {formatMonth(liq.month)} {liq.year}
                      </h3>
                      <button
                        className="btn-delete-small"
                        onClick={() => handleDelete(liq.id!)}
                        title="Eliminar liquidación"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="liquidation-amount">
                      ${Number(liq.totalAmount || 0).toFixed(2)}
                    </div>
                    <div className="liquidation-id">ID: {liq.id}</div>
                    <div className="liquidation-actions">
                      <button
                        className="btn-view-details"
                        onClick={() => {
                          setSelectedLiquidationId(liq.id!);
                          setShowDetailsModal(true);
                        }}
                      >
                        Ver Detalle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <PriceHistoryModal
        isOpen={showPriceModal}
        onClose={() => setShowPriceModal(false)}
      />

      <LiquidationDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedLiquidationId(null);
        }}
        liquidationId={selectedLiquidationId}
      />
    </>
  );
}

export default LiquidacionMensual;
