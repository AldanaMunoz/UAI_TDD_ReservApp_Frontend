import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import TopNavbar from '../components/Layout/TopNavbar';
import menuService, { type MenuDelDia, type Reserva } from '../services/menuService';
import { resolveApiAssetUrl } from '../services/api';
import '../styles/dashboard.css';
import './EmployeeMenu.css';

function DishImage({ imageUrl, name }: { imageUrl?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const src = resolveApiAssetUrl(imageUrl);

  if (!src || failed) {
    return <div className="dish-image-placeholder">Sin imagen</div>;
  }

  return <img className="dish-image" src={src} alt={name} loading="lazy" onError={() => setFailed(true)} />;
}

function DishCard({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  return (
    <div className="dish-card">
      <DishImage imageUrl={imageUrl} name={name} />
      <span className="dish-name">{name}</span>
    </div>
  );
}

function EmployeeMenu() {
  console.log('=== EmployeeMenu renderizando ===');
  const { user } = useAuth();
  console.log('Usuario en EmployeeMenu:', user);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Fecha de hoy en formato YYYY-MM-DD
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [menu, setMenu] = useState<MenuDelDia | null>(null);
  const [reservation, setReservation] = useState<Reserva | null>(null);
  const [hasReservation, setHasReservation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selecciones del usuario
  const [selectedPrincipal, setSelectedPrincipal] = useState<number | null>(null);
  const [wantsEntrada, setWantsEntrada] = useState(false);
  const [selectedBebida, setSelectedBebida] = useState<number | null>(null);
  const [selectedPostre, setSelectedPostre] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Verificar si la fecha es pasada
  const isPastDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate + 'T00:00:00');
    return selected < today;
  };

  // Verificar si se pasó la hora límite para reservar (10 AM del mismo día)
  const isPastDeadline = () => {
    const now = new Date();
    const selected = new Date(selectedDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Si es una fecha futura, no hay problema
    if (selected > today) {
      return false;
    }

    // Si es el día de hoy, verificar la hora
    if (selected.getTime() === today.getTime()) {
      const currentHour = now.getHours();
      return currentHour >= 10; // Si son las 10 AM o después, ya pasó la hora límite
    }

    // Si es fecha pasada, está fuera de plazo
    return true;
  };

  const loadMenuAndReservation = useCallback(async () => {
    if (!user?.id) {
      console.log('No hay usuario autenticado');
      return;
    }

    console.log('Cargando menú para fecha:', selectedDate);
    setLoading(true);
    setError('');

    try {
      // Cargar menú del día
      console.log('Llamando a getMenuByDate...');
      const menuData = await menuService.getMenuByDate(selectedDate);
      console.log('Menú recibido completo:', menuData);
      console.log('Menu object:', menuData.menu);
      console.log('Entrada nombre:', menuData.menu?.entrada_nombre);
      console.log('Principal nombre:', menuData.menu?.principal_nombre);
      console.log('Alternativo nombre:', menuData.menu?.alternativo_nombre);
      console.log('Vegetariana nombre:', menuData.menu?.vegetariana_nombre);
      console.log('Postre nombre:', menuData.menu?.postre_nombre);
      console.log('Bebida nombre:', menuData.menu?.bebida_nombre);
      setMenu(menuData.menu);

      // Verificar si ya tiene reserva (solo si hay menú)
      console.log('Verificando reserva para userId:', user.id);
      try {
        const reservationData = await menuService.getMyReservation(selectedDate, user.id);
        console.log('Datos de reserva:', reservationData);
        setHasReservation(reservationData.hasReservation);
        setReservation(reservationData.reserva || null);
      } catch (reservaErr: any) {
        console.error('Error específico al verificar reserva:', reservaErr);
        console.error('Response data:', reservaErr.response?.data);
        // Si falla la verificación de reserva, asumimos que no hay reserva
        setHasReservation(false);
        setReservation(null);
      }

      // Si hay entrada disponible, marcar el checkbox por defecto
      if (menuData.menu.entrada_id) {
        setWantsEntrada(true);
      }
    } catch (err: any) {
      console.error('Error al cargar:', err);
      console.error('Error response:', err.response);
      if (err.response?.status === 404) {
        setError('No hay menú planificado para esta fecha');
        setMenu(null);
        // Si no hay menú, tampoco mostrar reserva
        setHasReservation(false);
        setReservation(null);
      } else {
        setError(err.response?.data?.message || 'Error al cargar el menú');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDate, user?.id]);

  useEffect(() => {
    setSelectedPrincipal(null);
    setWantsEntrada(false);
    setSelectedBebida(null);
    setSelectedPostre(null);
    setIsEditing(false);
    void loadMenuAndReservation();
  }, [selectedDate, loadMenuAndReservation]);

  const validateSelectedMenuItems = () => {
    if (selectedPostre && selectedPostre !== menu?.postre_id) {
      setError('El postre seleccionado no esta disponible en este menu');
      return false;
    }
    if (selectedBebida && selectedBebida !== menu?.bebida_id) {
      setError('La bebida seleccionada no esta disponible en este menu');
      return false;
    }
    return true;
  };

  const handleReserve = async () => {
    if (!user?.id || !selectedPrincipal) {
      setError('Debes seleccionar al menos un plato principal');
      return;
    }

    if (isPastDeadline()) {
      setError('No puedes hacer reservas para esta fecha. La hora límite es 10:00 AM del mismo día');
      return;
    }

    // Validar que el plato principal seleccionado sea válido para este menú
    const validPrincipales = [menu?.principal_id, menu?.alternativo_id, menu?.vegetariana_id].filter(Boolean);
    if (!validPrincipales.includes(selectedPrincipal)) {
      setError('El plato principal seleccionado no está disponible en este menú');
      return;
    }
    if (!validateSelectedMenuItems()) return;

    setLoading(true);
    setError('');

    try {
      const reservationData = {
        fecha_reservada: selectedDate,
        id_comida_entrada: wantsEntrada && menu?.entrada_id ? menu.entrada_id : undefined,
        id_comida_principal: selectedPrincipal,
        id_comida_postre: selectedPostre || undefined,
        id_comida_bebida: selectedBebida || undefined,
        userId: user.id
      };

      console.log('Datos de reserva a enviar:', reservationData);

      await menuService.createReservation(reservationData);

      // Limpiar selecciones y recargar datos
      setSelectedPrincipal(null);
      setWantsEntrada(false);
      setSelectedBebida(null);
      setSelectedPostre(null);

      await loadMenuAndReservation();
      alert('¡Reserva creada exitosamente!');
    } catch (err: any) {
      console.error('Error al crear reserva:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Error al crear la reserva');
    } finally {
      setLoading(false);
    }
  };

  const handleModifyReservation = () => {
    if (!reservation) return;

    // Cargar los datos actuales de la reserva en el formulario
    setIsEditing(true);
    setWantsEntrada(!!reservation.id_comida_entrada);
    setSelectedPrincipal(reservation.id_comida_principal || null);
    setSelectedPostre(reservation.id_comida_postre === menu?.postre_id ? reservation.id_comida_postre ?? null : null);
    setSelectedBebida(reservation.id_comida_bebida === menu?.bebida_id ? reservation.id_comida_bebida ?? null : null);
  };

  const handleSaveModification = async () => {
    if (!user?.id || !selectedPrincipal || !reservation) {
      setError('Debes seleccionar al menos un plato principal');
      return;
    }

    // Validar que el plato principal seleccionado sea válido para este menú
    const validPrincipales = [menu?.principal_id, menu?.alternativo_id, menu?.vegetariana_id].filter(Boolean);
    if (!validPrincipales.includes(selectedPrincipal)) {
      setError('El plato principal seleccionado no está disponible en este menú');
      return;
    }

    if (!validateSelectedMenuItems()) return;

    setLoading(true);
    setError('');

    try {
      // Cancelar la reserva actual
      await menuService.cancelReservation(reservation.id, user.id);

      // Crear una nueva reserva con los datos modificados
      const reservationData = {
        fecha_reservada: selectedDate,
        id_comida_entrada: wantsEntrada && menu?.entrada_id ? menu.entrada_id : undefined,
        id_comida_principal: selectedPrincipal,
        id_comida_postre: selectedPostre || undefined,
        id_comida_bebida: selectedBebida || undefined,
        userId: user.id
      };

      await menuService.createReservation(reservationData);

      // Limpiar selecciones, salir del modo edición y recargar datos
      setSelectedPrincipal(null);
      setWantsEntrada(false);
      setSelectedBebida(null);
      setSelectedPostre(null);
      setIsEditing(false);

      await loadMenuAndReservation();
      alert('¡Reserva modificada exitosamente!');
    } catch (err: any) {
      console.error('Error al modificar reserva:', err);
      setError(err.response?.data?.message || 'Error al modificar la reserva');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError('');
    // Limpiar las selecciones al cancelar la edición
    setSelectedPrincipal(null);
    setWantsEntrada(false);
    setSelectedBebida(null);
    setSelectedPostre(null);
  };

  const handleCancelReservation = async () => {
    if (!reservation || !user?.id) return;

    if (isPastDeadline()) {
      setError('No puedes cancelar esta reserva. La hora límite es 10:00 AM del mismo día');
      return;
    }

    if (!window.confirm('¿Estás seguro de cancelar tu reserva?')) return;

    setLoading(true);
    setError('');

    try {
      await menuService.cancelReservation(reservation.id, user.id);

      // Limpiar selecciones después de cancelar
      setSelectedPrincipal(null);
      setWantsEntrada(false);
      setSelectedBebida(null);
      setSelectedPostre(null);

      await loadMenuAndReservation();
      alert('Reserva cancelada exitosamente');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cancelar la reserva');
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
            <div>
              <h1>Menú del día</h1>
              <p className="subtitle">
                {loading ? 'Cargando...' : hasReservation ? 'Tienes una reserva para esta fecha' : 'No tienes reservas para esta fecha'}
              </p>
            </div>
            <div className="date-selector">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-input"
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {isPastDeadline() && !hasReservation && (
            <div className="info-message">
              {isPastDate()
                ? 'Esta es una fecha pasada. Puedes ver el menú pero no hacer nuevas reservas.'
                : 'Se pasó la hora límite (10:00 AM) para hacer reservas para hoy.'}
            </div>
          )}

          {loading ? (
            <div className="loading">Cargando menú...</div>
          ) : hasReservation && reservation && !isEditing ? (
            // Mostrar reserva existente
            <div className="reservation-card">
              <h2>Tu Reserva</h2>
              <div className="reservation-details">
                {reservation.entrada_nombre && (
                  <div className="dish-item">
                    <span className="dish-label">Entrada:</span>
                    <span className="dish-name">{reservation.entrada_nombre}</span>
                  </div>
                )}
                {reservation.principal_nombre && (
                  <div className="dish-item">
                    <span className="dish-label">Principal:</span>
                    <span className="dish-name">{reservation.principal_nombre}</span>
                  </div>
                )}
                {reservation.postre_nombre && (
                  <div className="dish-item">
                    <span className="dish-label">Postre:</span>
                    <span className="dish-name">{reservation.postre_nombre}</span>
                  </div>
                )}
                {reservation.bebida_nombre && (
                  <div className="dish-item">
                    <span className="dish-label">Bebida:</span>
                    <span className="dish-name">{reservation.bebida_nombre}</span>
                  </div>
                )}
              </div>
              {!isPastDeadline() && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    className="reserve-btn"
                    onClick={handleModifyReservation}
                    disabled={loading}
                  >
                    Modificar
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={handleCancelReservation}
                    disabled={loading}
                  >
                    Cancelar Reserva
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* Menú informativo - Se muestra cuando hay una reserva */}
          {hasReservation && reservation && !isEditing && menu && (
            <div className="menu-card" style={{ marginTop: '1.5rem', opacity: '0.9' }}>
              <h2>Menú del Día</h2>

              {/* Entrada */}
              {menu.entrada_nombre && (
                <div className="menu-section">
                  <h3>Entrada</h3>
                  <DishCard name={menu.entrada_nombre} imageUrl={menu.entrada_imagen} />
                </div>
              )}

              {/* Platos Principales */}
              {(menu.principal_nombre || menu.alternativo_nombre || menu.vegetariana_nombre) && (
                <div className="menu-section">
                  <h3>Platos Principales</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {menu.principal_nombre && (
                      <DishCard name={menu.principal_nombre} imageUrl={menu.principal_imagen} />
                    )}
                    {menu.alternativo_nombre && (
                      <DishCard name={menu.alternativo_nombre} imageUrl={menu.alternativo_imagen} />
                    )}
                    {menu.vegetariana_nombre && (
                      <DishCard name={`${menu.vegetariana_nombre} (Vegetariana)`} imageUrl={menu.vegetariana_imagen} />
                    )}
                  </div>
                </div>
              )}

              {menu.postre_nombre && (
                <div className="menu-section">
                  <h3>Postre</h3>
                  <DishCard name={menu.postre_nombre} imageUrl={menu.postre_imagen} />
                </div>
              )}

              {menu.bebida_nombre && (
                <div className="menu-section">
                  <h3>Bebida</h3>
                  <DishCard name={menu.bebida_nombre} imageUrl={menu.bebida_imagen} />
                </div>
              )}
            </div>
          )}

          {/* Formulario de reserva o modificación */}
          {(!hasReservation || isEditing) && menu && (
            // Mostrar menú para reservar o modificar
            <div className="menu-card">
              <h2>{isEditing ? 'Modificar Reserva' : 'Menú Disponible'}</h2>

              {/* Entrada - Opcional con checkbox */}
              {menu.entrada_nombre && (
                <div className="menu-section">
                  <div className="section-header">
                    <h3>Entrada</h3>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={wantsEntrada}
                        onChange={(e) => setWantsEntrada(e.target.checked)}
                        disabled={isPastDeadline()}
                      />
                      <span>Quiero entrada</span>
                    </label>
                  </div>
                  <DishCard name={menu.entrada_nombre} imageUrl={menu.entrada_imagen} />
                </div>
              )}

              {/* Plato Principal - Selección */}
              {(menu.principal_nombre || menu.alternativo_nombre || menu.vegetariana_nombre) && (
              <div className="menu-section">
                <h3>Plato Principal *</h3>
                <div className="dish-selection">
                  {menu.principal_nombre && (
                    <label className="dish-option">
                      <input
                        type="radio"
                        name="principal"
                        value={menu.principal_id}
                        checked={selectedPrincipal === menu.principal_id}
                        onChange={() => setSelectedPrincipal(menu.principal_id!)}
                        disabled={isPastDeadline()}
                      />
                      <div className="dish-option-content">
                        <DishImage imageUrl={menu.principal_imagen} name={menu.principal_nombre} />
                        <span className="dish-name">{menu.principal_nombre}</span>
                      </div>
                    </label>
                  )}
                  {menu.alternativo_nombre && (
                    <label className="dish-option">
                      <input
                        type="radio"
                        name="principal"
                        value={menu.alternativo_id}
                        checked={selectedPrincipal === menu.alternativo_id}
                        onChange={() => setSelectedPrincipal(menu.alternativo_id!)}
                        disabled={isPastDeadline()}
                      />
                      <div className="dish-option-content">
                        <DishImage imageUrl={menu.alternativo_imagen} name={menu.alternativo_nombre} />
                        <span className="dish-name">{menu.alternativo_nombre}</span>
                      </div>
                    </label>
                  )}
                  {menu.vegetariana_nombre && (
                    <label className="dish-option">
                      <input
                        type="radio"
                        name="principal"
                        value={menu.vegetariana_id}
                        checked={selectedPrincipal === menu.vegetariana_id}
                        onChange={() => setSelectedPrincipal(menu.vegetariana_id!)}
                        disabled={isPastDeadline()}
                      />
                      <div className="dish-option-content">
                        <DishImage imageUrl={menu.vegetariana_imagen} name={menu.vegetariana_nombre} />
                        <span className="dish-name">{menu.vegetariana_nombre} (Vegetariana)</span>
                      </div>
                    </label>
                  )}
                </div>
              </div>
              )}

              {/* Postre - planificado por dia */}
              {menu.postre_nombre && menu.postre_id && (
                <div className="menu-section">
                  <div className="section-header">
                    <h3>Postre</h3>
                    <label className="checkbox-label">
                        <input
                        type="checkbox"
                        checked={selectedPostre === menu.postre_id}
                        onChange={(e) => setSelectedPostre(e.target.checked ? menu.postre_id! : null)}
                          disabled={isPastDeadline()}
                        />
                      <span>Quiero postre</span>
                      </label>
                  </div>
                  <DishCard name={menu.postre_nombre} imageUrl={menu.postre_imagen} />
                </div>
              )}

              {/* Bebida - planificada por dia */}
              {menu.bebida_nombre && menu.bebida_id && (
                <div className="menu-section">
                  <div className="section-header">
                    <h3>Bebida</h3>
                    <label className="checkbox-label">
                        <input
                        type="checkbox"
                        checked={selectedBebida === menu.bebida_id}
                        onChange={(e) => setSelectedBebida(e.target.checked ? menu.bebida_id! : null)}
                          disabled={isPastDeadline()}
                        />
                      <span>Quiero bebida</span>
                      </label>
                  </div>
                  <DishCard name={menu.bebida_nombre} imageUrl={menu.bebida_imagen} />
                </div>
              )}

              {!isPastDeadline() && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  {isEditing && (
                    <button
                      className="cancel-btn"
                      onClick={handleCancelEdit}
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    className="reserve-btn"
                    onClick={isEditing ? handleSaveModification : handleReserve}
                    disabled={loading || !selectedPrincipal}
                  >
                    {loading ? 'Procesando...' : isEditing ? 'Guardar Cambios' : 'Reservar'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default EmployeeMenu;
