import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import TopNavbar from '../../components/Layout/TopNavbar';
import Breadcrumbs from '../../components/Common/Breadcrumbs';
import SemaforoIndicator from '../../components/Admin/SemaforoIndicator';
import { 
  metricsService, 
  type ReservasPorDiaTemporada, 
  type ReservasPorDiaDetalle,
  type ReservasFechaDetalle 
} from '../../services/metricsService';
import './ReportDetail.css';

type ViewLevel = 'temporada' | 'dia_semana' | 'fecha';

function ReservasPorDiaDetail() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [viewLevel, setViewLevel] = useState<ViewLevel>('temporada');
  const [loading, setLoading] = useState(true);
  
  // Datos por nivel
  const [dataTemporada, setDataTemporada] = useState<ReservasPorDiaTemporada | null>(null);
  const [dataDiaSemana, setDataDiaSemana] = useState<ReservasPorDiaDetalle | null>(null);
  const [dataFecha, setDataFecha] = useState<ReservasFechaDetalle | null>(null);
  
  // Parámetros de navegación
  const [selectedDiaSemana, setSelectedDiaSemana] = useState<string | null>(null);
  const [selectedFecha, setSelectedFecha] = useState<string | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const diasSemanaEs: { [key: string]: string } = {
    'Monday': 'Lunes',
    'Tuesday': 'Martes',
    'Wednesday': 'Miércoles',
    'Thursday': 'Jueves',
    'Friday': 'Viernes',
    'Saturday': 'Sábado',
    'Sunday': 'Domingo'
  };

  useEffect(() => {
    const nivel = searchParams.get('nivel') as ViewLevel || 'temporada';
    const dia_semana = searchParams.get('dia_semana');
    const fecha = searchParams.get('fecha');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '25';
    
    setViewLevel(nivel);
    setCurrentPage(parseInt(page));
    setItemsPerPage(parseInt(limit));
    
    if (dia_semana) setSelectedDiaSemana(dia_semana);
    if (fecha) setSelectedFecha(fecha);
    
    loadData(nivel, dia_semana, fecha, parseInt(page), parseInt(limit));
  }, [searchParams]);

  const loadData = async (
    nivel: ViewLevel,
    dia_semana: string | null,
    fecha: string | null,
    page: number,
    limit: number
  ) => {
    try {
      setLoading(true);
      
      if (nivel === 'temporada') {
        const data = await metricsService.getReservasPorDiaTemporada();
        setDataTemporada(data);
      } else if (nivel === 'dia_semana' && dia_semana) {
        const data = await metricsService.getReservasPorDiaDetalle(dia_semana);
        setDataDiaSemana(data);
      } else if (nivel === 'fecha' && fecha) {
        const data = await metricsService.getReservasFechaEspecifica(fecha, page, limit);
        setDataFecha(data);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToDiaSemana = (dia_semana: string) => {
    setSearchParams({
      nivel: 'dia_semana',
      dia_semana: dia_semana
    });
  };

  const navigateToFecha = (fecha: string) => {
    setSearchParams({
      nivel: 'fecha',
      fecha: fecha,
      page: '1',
      limit: itemsPerPage.toString()
    });
  };

  const goBack = () => {
    if (viewLevel === 'fecha') {
      setSearchParams({
        nivel: 'dia_semana',
        dia_semana: selectedDiaSemana!
      });
    } else if (viewLevel === 'dia_semana') {
      setSearchParams({ nivel: 'temporada' });
    } else {
      navigate('/reportes');
    }
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({
      ...Object.fromEntries(searchParams),
      page: newPage.toString()
    });
  };

  const handleLimitChange = (newLimit: number) => {
    setSearchParams({
      ...Object.fromEntries(searchParams),
      page: '1',
      limit: newLimit.toString()
    });
  };

  const getBreadcrumbs = () => {
    const items = [
      { label: 'Reportes', path: '/reportes' },
      { label: 'Reservas por día' }
    ];

    if (viewLevel === 'dia_semana' && selectedDiaSemana) {
      items.push({ label: diasSemanaEs[selectedDiaSemana] });
    } else if (viewLevel === 'fecha' && selectedFecha && selectedDiaSemana) {
      items.push({ 
        label: diasSemanaEs[selectedDiaSemana],
        path: `/reportes/reservas-por-dia?nivel=dia_semana&dia_semana=${selectedDiaSemana}`
      });
      items.push({ label: new Date(selectedFecha).toLocaleDateString('es-AR') });
    }

    return items;
  };

  if (loading) {
    return (
      <>
        <TopNavbar />
        <div className="main-content">
          <p>Cargando...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <TopNavbar />
      <div className="main-content">
        <button className="back-button" onClick={goBack}>
          ← Volver
        </button>

        <Breadcrumbs items={getBreadcrumbs()} />

        <div className="detail-header">
          <h1>Cantidad de menús reservados por día</h1>
          <p className="detail-subtitle">Dashboards</p>
        </div>

        {/* Vista de Temporada */}
        {viewLevel === 'temporada' && dataTemporada && (
          <>
            <div className="info-card">
              <h3>📊 {dataTemporada.temporada.nombre}</h3>
              <p>Capacidad máxima: {dataTemporada.capacidad_maxima} personas por día</p>
            </div>

            <div className="reservas-chart-container">
              <h3 className="section-title">Promedio de reservas por día de la semana</h3>
              
              <div className="reservas-bar-chart">
                {dataTemporada.dias_semana.map((dia) => {
                  const maxReservas = Math.max(...dataTemporada.dias_semana.map(d => d.total_reservas));
                  const altura = maxReservas > 0 ? (dia.total_reservas / maxReservas) * 100 : 0;

                  return (
                    <div 
                      key={dia.dia_numero} 
                      className="dia-column clickable"
                      onClick={() => navigateToDiaSemana(dia.dia_semana)}
                    >
                      <div className="bar-container">
                        <div 
                          className={`bar bar-${dia.semaforo}`}
                          style={{ height: `${altura}%` }}
                        >
                          <span className="bar-value">{dia.promedio_reservas}</span>
                        </div>
                      </div>
                      <div className="dia-info">
                        <span className="dia-nombre">{diasSemanaEs[dia.dia_semana]}</span>
                        <div className="dia-stats">
                          <SemaforoIndicator status={dia.semaforo} size="small" />
                          <span className="porcentaje">{Number(dia.porcentaje_ocupacion || 0).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="chart-legend">
                <div className="legend-item">
                  <SemaforoIndicator status="verde" size="small" />
                  <span>80-100% (Óptimo)</span>
                </div>
                <div className="legend-item">
                  <SemaforoIndicator status="amarillo" size="small" />
                  <span>50-79% (Medio)</span>
                </div>
                <div className="legend-item">
                  <SemaforoIndicator status="rojo" size="small" />
                  <span>&lt;50% (Bajo)</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Vista de día de la semana */}
        {viewLevel === 'dia_semana' && dataDiaSemana && selectedDiaSemana && (
          <>
            <div className="info-card">
              <h3>📅 Todos los {diasSemanaEs[selectedDiaSemana]} de la temporada</h3>
              <p>{dataDiaSemana.temporada.nombre}</p>
            </div>

            <div className="detail-table-section">
              <h3 className="section-title">Historial de reservas</h3>
              
              <div className="clickable-table">
                <div className="table-header-row">
                  <span>Fecha</span>
                  <span>Total Reservas</span>
                  <span>% Ocupación</span>
                  <span>Estado</span>
                </div>

                {dataDiaSemana.fechas.map((fecha, index) => (
                  <div 
                    key={index}
                    className="table-data-row clickable"
                    onClick={() => navigateToFecha(fecha.fecha)}
                  >
                    <span className="highlight">
                      {new Date(fecha.fecha).toLocaleDateString('es-AR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                    <span className="big-number">{fecha.total_reservas}</span>
                    <span className="percentage">{Number(fecha.porcentaje_ocupacion || 0).toFixed(1)}%</span>
                    <span>
                      <SemaforoIndicator status={fecha.semaforo} size="small" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Vista de fecha específica */}
        {viewLevel === 'fecha' && dataFecha && selectedFecha && (
          <>
            <div className="info-card">
              <h3>
                📋 Detalle de reservas - {new Date(selectedFecha).toLocaleDateString('es-AR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <p>Total de reservas confirmadas: {dataFecha.pagination.total}</p>
            </div>

            <div className="detail-table-section">
              <div className="detail-table">
                <div className="table-header-row-wide">
                  <span>Nombre</span>
                  <span>Tipo</span>
                  <span>Turno</span>
                  <span>Entrada</span>
                  <span>Plato Principal</span>
                  <span>Postre</span>
                  <span>Bebida</span>
                </div>

                {dataFecha.reservas.map((reserva, index) => (
                  <div key={index} className="table-data-row-wide">
                    <span className="bold">{reserva.nombre_completo}</span>
                    <span>{reserva.tipo_empleado === 'interno' ? 'Interno' : 'Externo'}</span>
                    <span className="capitalize">{reserva.turno}</span>
                    <span className="food-item">{reserva.entrada || '-'}</span>
                    <span className="food-item bold">{reserva.plato_principal}</span>
                    <span className="food-item">{reserva.postre || '-'}</span>
                    <span className="food-item">{reserva.bebida}</span>
                  </div>
                ))}
              </div>

              {/* Paginación */}
              <div className="pagination-controls">
                <div className="pagination-info">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, dataFecha.pagination.total)} de {dataFecha.pagination.total} registros
                </div>
                
                <div className="pagination-options">
                  <span>Por página:</span>
                  {[10, 25, 50, 100].map(limit => (
                    <button
                      key={limit}
                      className={itemsPerPage === limit ? 'active' : ''}
                      onClick={() => handleLimitChange(limit)}
                    >
                      {limit}
                    </button>
                  ))}
                </div>

                <div className="pagination-buttons">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    ← Anterior
                  </button>
                  <span className="page-number">
                    Página {currentPage} de {dataFecha.pagination.total_pages}
                  </span>
                  <button 
                    disabled={currentPage === dataFecha.pagination.total_pages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default ReservasPorDiaDetail;