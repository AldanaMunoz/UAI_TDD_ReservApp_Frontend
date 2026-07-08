import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import TopNavbar from '../../components/Layout/TopNavbar';
import { metricsService, type ConsumoPorUsuario } from '../../services/metricsService';
import './ConsumoUsuarioDetail.css';

function ConsumoUsuarioDetail() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ConsumoPorUsuario | null>(null);
  
  // Filtros
  const currentYear = new Date().getFullYear();
  const [anioSeleccionado, setAnioSeleccionado] = useState<number>(currentYear);
  const [mesSeleccionado, setMesSeleccionado] = useState<number>(new Date().getMonth() + 1);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('');
  const [modoFiltro, setModoFiltro] = useState<'mes' | 'fecha'>('mes');

  const anios = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i); // Últimos 2 años, actual y próximos 2

  const meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];

  useEffect(() => {
    loadData();
  }, [mesSeleccionado, anioSeleccionado, fechaSeleccionada, modoFiltro]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      let result;
      if (modoFiltro === 'fecha' && fechaSeleccionada) {
        result = await metricsService.getConsumoPorUsuario(undefined, undefined, fechaSeleccionada);
      } else {
        result = await metricsService.getConsumoPorUsuario(mesSeleccionado, anioSeleccionado);
      }
      
      setData(result);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMesChange = (mes: number) => {
    setMesSeleccionado(mes);
    setModoFiltro('mes');
  };

  const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fecha = e.target.value;
    setFechaSeleccionada(fecha);
    setModoFiltro('fecha');
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
        <button className="back-button" onClick={() => navigate('/reportes')}>
          ← Volver a Reportes
        </button>

        <div className="detail-header">
          <h1>Reportes</h1>
        </div>

        <div className="filtros-container">
          {/* Selector de Año */}
          <div className="filtro-section">
            <h3>Año</h3>
            <select
              value={anioSeleccionado}
              onChange={(e) => {
                setAnioSeleccionado(Number(e.target.value));
                setModoFiltro('mes');
              }}
              className="select-input"
            >
              {anios.map(anio => (
                <option key={anio} value={anio}>{anio}</option>
              ))}
            </select>
          </div>

          {/* Selector de Mes */}
          <div className="filtro-section">
            <h3>Mes</h3>
            <select
              value={mesSeleccionado}
              onChange={(e) => handleMesChange(Number(e.target.value))}
              className="select-input"
            >
              {meses.map(mes => (
                <option key={mes.valor} value={mes.valor}>{mes.nombre}</option>
              ))}
            </select>
          </div>

          {/* Selector de Fecha */}
          <div className="filtro-section">
            <h3>O buscar por fecha específica</h3>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={handleFechaChange}
              className="date-input"
            />
          </div>
        </div>

        {/* Tabla de usuarios */}
        {data && (
          <div className="usuarios-table-section">
            <div className="table-info">
              <p>
                {modoFiltro === 'fecha' 
                  ? `Mostrando datos del ${new Date(fechaSeleccionada).toLocaleDateString('es-AR')}`
                  : `Mostrando datos de ${meses.find(m => m.valor === mesSeleccionado)?.nombre} ${anioSeleccionado}`
                }
              </p>
              <p>Días laborables: {data.filtro.dias_disponibles}</p>
            </div>

            <div className="usuarios-table">
              <div className="table-header-row">
                <span>Nombre y apellido</span>
                <span>Tipo Empleado</span>
                <span>Porcentaje de consumo</span>
              </div>

              {data.usuarios.map((usuario, index) => {
                const porcentaje = Number(usuario.porcentaje_consumo || 0);
                return (
                  <div key={index} className="table-data-row">
                    <span>{usuario.nombre_completo}</span>
                    <span>{usuario.tipo_empleado === 'interno' ? 'Interno' : 'Externo'}</span>
                    <span className="porcentaje-cell">
                      <div className="porcentaje-bar-container">
                        <div
                          className={`porcentaje-bar ${getPorcentajeColor(porcentaje)}`}
                          style={{ width: `${Math.min(porcentaje, 100)}%` }}
                        >
                          <span className="porcentaje-text">{porcentaje.toFixed(1)}%</span>
                        </div>
                      </div>
                      <span className="reservas-count">({usuario.total_reservas} reservas)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const getPorcentajeColor = (porcentaje: number): string => {
  if (porcentaje >= 80) return 'verde';
  if (porcentaje >= 50) return 'amarillo';
  return 'rojo';
};

export default ConsumoUsuarioDetail;