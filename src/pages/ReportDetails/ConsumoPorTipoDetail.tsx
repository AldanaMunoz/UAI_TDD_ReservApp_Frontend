import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import TopNavbar from '../../components/Layout/TopNavbar';
import ConsumoPorTipoChart from '../../components/Admin/ConsumoPorTipoChart';
import './ReportDetail.css';

function ConsumoPorTipoDetail() {
  const navigate = useNavigate();
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <>
      <TopNavbar />
      <div className="main-content">
        <button className="back-button" onClick={() => navigate('/reportes')}>
          ← Volver a Reportes
        </button>
        
        <div className="page-header">
          <h1>Consumo mensual por tipo de empleado</h1>
          <p className="subtitle">Análisis de costos por categoría</p>
        </div>

        <div className="filters-bar">
          <div className="filter-group">
            <label>Mes</label>
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
              {meses.map((nombre, index) => (
                <option key={index} value={index + 1}>{nombre}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Año</label>
            <select value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </div>

        <div className="report-detail-content">
          <ConsumoPorTipoChart />
          
          <div className="metric-card">
            <h3>💡 Información adicional</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Costo unitario interno:</span>
                <span className="info-value">$1,500</span>
              </div>
              <div className="info-item">
                <span className="info-label">Costo unitario externo:</span>
                <span className="info-value">$2,500</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ConsumoPorTipoDetail;