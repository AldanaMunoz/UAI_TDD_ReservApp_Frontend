import Sidebar from '../components/Layout/Sidebar';
import './EnConstruccion.css';

function GestionComida() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <div className="en-construccion-container">
          <div className="en-construccion-card">
            <h1>Gestión de Comida</h1>
            <p className="construccion-subtitle">Esta sección está en construcción</p>
            <div className="construccion-description">
              <p>Próximamente podrás:</p>
              <ul>
                <li>Agregar, editar y eliminar platos del menú</li>
                <li>Gestionar tipos de comida (entradas, principales, postres, etc.)</li>
                <li>Configurar restricciones alimenticias (sin TACC, vegetariano, etc.)</li>
                <li>Cargar imágenes de los platos</li>
                <li>Activar/desactivar platos según disponibilidad</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GestionComida;