import { useNavigate } from 'react-router-dom';
import TopNavbar from '../components/Layout/TopNavbar';
import './AdminDashboard.css';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
}

const reportCards: ReportCard[] = [
  {
    id: 'asistencia',
    title: 'Porcentaje de asistencia real',
    description: 'Analiza la asistencia real vs reservas realizadas para identificar desperdicio o sobrante.',
    icon: '📊',
    path: '/reportes/asistencia'
  },
  {
    id: 'preferencias',
    title: 'Preferencias alimenticias más frecuentes',
    description: 'Identifica las restricciones y preferencias alimenticias para ajustar las opciones del menú.',
    icon: '📈',
    path: '/reportes/preferencias'
  },
  // Ocultado temporalmente - Consumo mensual por tipo de empleado
  // {
  //   id: 'consumo-tipo',
  //   title: 'Consumo mensual por tipo de empleado',
  //   description: 'Analiza el consumo diferenciado entre empleados internos y externos para planificación presupuestaria.',
  //   icon: '📉',
  //   path: '/reportes/consumo-tipo'
  // },
  {
    id: 'consumo-usuario',
    title: 'Consumo por usuario',
    description: 'Analiza la frecuencia de uso del comedor por empleado para identificar patrones de consumo.',
    icon: '👥',
    path: '/reportes/consumo-usuario'
  }
];

function AdminDashboard() {
  const navigate = useNavigate();

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  return (
    <>
      <TopNavbar />
      <div className="main-content">
        <div className="page-header">
          <h1>Reportes</h1>
        </div>

        <div className="reports-grid">
          {reportCards.map((card) => (
            <div
              key={card.id}
              className="report-card"
              onClick={() => handleCardClick(card.path)}
            >
              <div className="report-icon">{card.icon}</div>
              <h3 className="report-title">{card.title}</h3>
              <p className="report-description">{card.description}</p>
              <div className="report-arrow">→</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default AdminDashboard;
