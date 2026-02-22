import TopNavbar from '../components/Layout/TopNavbar';
import './EnConstruccion.css';

function PlanificacionTemporada() {
  return (
    <>
      <TopNavbar />
      <div className="main-content">
        <div className="en-construccion-container">
          <div className="en-construccion-card">
            <h1>Planificación por Temporada</h1>
            <p className="construccion-subtitle">Esta sección está en construcción</p>
            <div className="construccion-description">
              <p>Próximamente podrás:</p>
              <ul>
                <li>Crear y gestionar temporadas (Primavera, Verano, etc.)</li>
                <li>Definir fechas de inicio y fin de cada temporada</li>
                <li>Planificar el menú semanal para toda la temporada</li>
                <li>Asignar platos por día de la semana</li>
                <li>Configurar ciclos de menús que se repiten</li>
                <li>Visualizar calendario completo de planificación</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PlanificacionTemporada;