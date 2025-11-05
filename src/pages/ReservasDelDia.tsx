import { useState, useEffect } from 'react';
import Sidebar from '../components/Layout/Sidebar';
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
}

function ReservasDelDia() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [fechaHoy] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadReservas();
  }, []);

  const loadReservas = async () => {
    try {
      setLoading(true);
      setReservas([]);
    } catch (error) {
      console.error('Error cargando reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <div className="main-content">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h1>Reservas del día</h1>
          <p className="fecha-actual">
            {new Date().toLocaleDateString('es-AR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div className="reservas-stats">
          <div className="stat-card">
            <h3>Total reservas</h3>
            <p className="stat-number">{reservas.length}</p>
          </div>
          <div className="stat-card">
            <h3>Confirmadas</h3>
            <p className="stat-number">
              {reservas.filter(r => r.estado_reserva === 'confirmada').length}
            </p>
          </div>
          <div className="stat-card">
            <h3>Canceladas</h3>
            <p className="stat-number">
              {reservas.filter(r => r.estado_reserva === 'cancelada').length}
            </p>
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
              </tr>
            </thead>
            <tbody>
              {reservas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="no-data">
                    No hay reservas para el día de hoy
                  </td>
                </tr>
              ) : (
                reservas.map((reserva) => (
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
                        {reserva.estado_reserva === 'confirmada' ? 'Confirmada' : 'Cancelada'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ReservasDelDia;