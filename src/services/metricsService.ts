import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface AsistenciaData {
  reservas_confirmadas: number;
  no_show: number;
  canceladas: number;
  porcentaje_asistencia: number;
  semaforo: 'verde' | 'amarillo' | 'rojo';
}

export interface ReservaPorDia {
  dia_numero: number;
  dia_nombre: string;
  total_reservas: number;
  porcentaje_ocupacion: number;
  semaforo: 'verde' | 'amarillo' | 'rojo';
}

export interface PreferenciaAlimenticia {
  restriccion: string;
  cantidad_usuarios: number;
  porcentaje: number;
}

export interface ConsumoPorTipo {
  tipo: 'interno' | 'externo';
  total_consumos: number;
  costo_estimado: number;
}

export interface TopUsuario {
  usuario: string;
  total_reservas: number;
  porcentaje_uso: number;
  semaforo: 'verde' | 'amarillo' | 'rojo';
}

export interface ReservasPorDiaTemporada {
  temporada: {
    id: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
  };
  capacidad_maxima: number;
  dias_semana: Array<{
    dia_numero: number;
    dia_nombre: string;
    dia_semana: string;
    total_reservas: number;
    promedio_reservas: number;
    porcentaje_ocupacion: number;
    semaforo: 'verde' | 'amarillo' | 'rojo';
  }>;
}

export interface ReservasPorDiaDetalle {
  temporada: {
    id: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
  };
  dia_semana: string;
  dia_numero: number;
  capacidad_maxima: number;
  fechas: Array<{
    fecha: string;
    total_reservas: number;
    porcentaje_ocupacion: number;
    semaforo: 'verde' | 'amarillo' | 'rojo';
  }>;
}

export interface ReservasFechaDetalle {
  fecha: string;
  dia_semana: string;
  total_reservas: number;
  reservas: Array<{
    id: number;
    nombre_completo: string;
    tipo_empleado: 'interno' | 'externo';
    turno: string;
    entrada: string | null;
    plato_principal: string;
    postre: string | null;
    bebida: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface AsistenciaTemporada {
  temporada: {
    id: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
  };
  estadisticas: {
    confirmadas: number;
    no_show: number;
    canceladas: number;
    total: number;
    porcentaje_asistencia: number;
    semaforo: 'verde' | 'amarillo' | 'rojo';
  };
  meses: Array<{
    mes: number;
    anio: number;
    nombre_mes: string;
    confirmadas: number;
    no_show: number;
    canceladas: number;
    total: number;
    porcentaje: number;
  }>;
}

export interface AsistenciaMes {
  mes: number;
  anio: number;
  nombre_mes: string;
  estadisticas: {
    confirmadas: number;
    no_show: number;
    canceladas: number;
    total: number;
    porcentaje_asistencia: number;
    semaforo: 'verde' | 'amarillo' | 'rojo';
  };
  dias: Array<{
    fecha: string;
    dia_semana: string;
    confirmadas: number;
    no_show: number;
    canceladas: number;
    total: number;
    porcentaje: number;
  }>;
}

export interface AsistenciaDia {
  fecha: string;
  dia_semana: string;
  estadisticas: {
    confirmadas: number;
    no_show: number;
    canceladas: number;
    total: number;
  };
  reservas: Array<{
    id: number;
    nombre_completo: string;
    tipo_empleado: 'interno' | 'externo';
    estado_reserva: string;
    turno: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ConsumoTipoTemporada {
  temporada: {
    id: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
  };
  consumo: Array<{
    tipo_empleado: 'interno' | 'externo';
    total_reservas: number;
    porcentaje: number;
  }>;
  meses: Array<{
    mes: number;
    anio: number;
    nombre_mes: string;
  }>;
}

export interface ConsumoTipoMes {
  mes: {
    mes: number;
    anio: number;
    nombre_mes: string;
  };
  consumo: Array<{
    tipo_empleado: 'interno' | 'externo';
    total_reservas: number;
    porcentaje: number;
  }>;
  dias: Array<{
    fecha: string;
    dia_semana: string;
    nombre_dia: string;
  }>;
}

export interface ConsumoTipoDia {
  fecha: string;
  dia_semana: string;
  consumo: Array<{
    tipo_empleado: 'interno' | 'externo';
    total_reservas: number;
    porcentaje: number;
  }>;
  detalle_comidas: Array<{
    nombre_usuario: string;
    tipo_empleado: 'interno' | 'externo';
    entrada: string | null;
    plato_principal: string;
    postre: string | null;
    bebida: string;
    restricciones: string | null;
  }>;
}

export interface PreferenciasTemporada {
  temporada: {
    id: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
  };
  preferencias: Array<{
    restriccion: string;
    cantidad_usuarios: number;
    total_selecciones: number;
    porcentaje: number;
  }>;
  meses: Array<{
    mes: number;
    anio: number;
    nombre_mes: string;
    preferencias: Array<{
      restriccion: string;
      cantidad: number;
    }>;
  }>;
}

export interface PreferenciasMes {
  mes: {
    mes: number;
    anio: number;
    nombre_mes: string;
  };
  preferencias: Array<{
    restriccion: string;
    cantidad_usuarios: number;
    total_selecciones: number;
    porcentaje: number;
  }>;
  dias: Array<{
    fecha: string;
    dia_semana: string;
    preferencias: Array<{
      restriccion: string;
      cantidad: number;
    }>;
  }>;
}

export interface PreferenciasDia {
  fecha: string;
  dia_semana: string;
  total_comidas: number;
  preferencias: Array<{
    restriccion: string;
    cantidad_usuarios: number;
    total_selecciones: number;
    porcentaje: number;
  }>;
  ranking_entradas?: Array<{
    plato: string;
    cantidad: number;
    total_pedidos: number;
    porcentaje: number;
  }>;
  ranking_principales?: Array<{
    plato: string;
    cantidad: number;
    total_pedidos: number;
    porcentaje: number;
  }>;
  ranking_postres?: Array<{
    plato: string;
    cantidad: number;
    total_pedidos: number;
    porcentaje: number;
  }>;
  ranking_bebidas?: Array<{
    plato: string;
    cantidad: number;
    total_pedidos: number;
    porcentaje: number;
  }>;
}

export interface ConsumoPorUsuario {
  filtro: {
    mes: number | null;
    anio: number | null;
    fecha: string | null;
    fecha_inicio: string;
    fecha_fin: string;
    dias_disponibles: number;
  };
  usuarios: Array<{
    id: number;
    nombre_completo: string;
    tipo_empleado: 'interno' | 'externo';
    total_reservas: number;
    porcentaje_consumo: number;
  }>;
}

export const metricsService = {
  async getAsistencia(): Promise<AsistenciaData> {
    const response = await api.get('/metrics/asistencia');
    return response.data;
  },

  async getAsistenciaTemporada(idTemporada?: number, tipoEmpleado?: string): Promise<AsistenciaTemporada> {
    const params = new URLSearchParams();
    if (idTemporada) params.append('id_temporada', idTemporada.toString());
    if (tipoEmpleado) params.append('tipo_empleado', tipoEmpleado);

    const response = await api.get(`/metrics/asistencia/temporada?${params.toString()}`);
    return response.data;
  },

  async getAsistenciaMes(anio: number, mes: number, tipoEmpleado?: string): Promise<AsistenciaMes> {
    const params = new URLSearchParams();
    params.append('mes', mes.toString());
    params.append('anio', anio.toString());
    if (tipoEmpleado) params.append('tipo_empleado', tipoEmpleado);

    const response = await api.get(`/metrics/asistencia/mes?${params.toString()}`);
    return response.data;
  },

  async getAsistenciaDia(fecha: string, tipoEmpleado?: string, estados?: string, page?: number, limit?: number): Promise<AsistenciaDia> {
    const params = new URLSearchParams();
    params.append('fecha', fecha);
    if (tipoEmpleado) params.append('tipo_empleado', tipoEmpleado);
    if (estados) params.append('estados', estados);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    const response = await api.get(`/metrics/asistencia/dia?${params.toString()}`);
    return response.data;
  },

  async exportarAsistencia(fecha?: string, tipoEmpleado?: string, formato?: string, idTemporada?: number): Promise<void> {
    const params = new URLSearchParams();
    if (idTemporada) params.append('id_temporada', idTemporada.toString());
    if (fecha) params.append('fecha', fecha);
    if (tipoEmpleado) params.append('tipo_empleado', tipoEmpleado);
    if (formato) params.append('formato', formato);

    const response = await api.get(`/metrics/asistencia/exportar?${params.toString()}`, {
      responseType: 'blob'
    });

    const blob = new Blob([response.data], {
      type: formato === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv;charset=utf-8;'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const contentDisposition = response.headers['content-disposition'];
    let filename = formato === 'excel' ? 'asistencia.xlsx' : 'asistencia.csv';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async getReservasPorDia(): Promise<ReservaPorDia[]> {
    const response = await api.get('/metrics/reservas-por-dia');
    return response.data;
  },

  async getReservasPorDiaTemporada(idTemporada?: number): Promise<ReservasPorDiaTemporada> {
    const params = new URLSearchParams();
    if (idTemporada) params.append('id_temporada', idTemporada.toString());

    const response = await api.get(`/metrics/reservas-por-dia/temporada?${params.toString()}`);
    return response.data;
  },

  async getReservasPorDiaDetalle(diaSemana: string, idTemporada?: number): Promise<ReservasPorDiaDetalle> {
    const params = new URLSearchParams();
    params.append('dia_semana', diaSemana);
    if (idTemporada) params.append('id_temporada', idTemporada.toString());

    const response = await api.get(`/metrics/reservas-por-dia/detalle?${params.toString()}`);
    return response.data;
  },

  async getReservasFechaEspecifica(fecha: string, page?: number, limit?: number): Promise<ReservasFechaDetalle> {
    const params = new URLSearchParams();
    params.append('fecha', fecha);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    const response = await api.get(`/metrics/reservas-por-dia/fecha?${params.toString()}`);
    return response.data;
  },

  async getPreferencias(): Promise<PreferenciaAlimenticia[]> {
    const response = await api.get('/metrics/preferencias');
    return response.data;
  },

  async getPreferenciasTemporada(idTemporada?: number): Promise<PreferenciasTemporada> {
    const params = new URLSearchParams();
    if (idTemporada) params.append('id_temporada', idTemporada.toString());

    const response = await api.get(`/metrics/preferencias/temporada?${params.toString()}`);
    return response.data;
  },

  async getPreferenciasMes(anio: number, mes: number): Promise<PreferenciasMes> {
    const params = new URLSearchParams();
    params.append('mes', mes.toString());
    params.append('anio', anio.toString());

    const response = await api.get(`/metrics/preferencias/mes?${params.toString()}`);
    return response.data;
  },

  async getPreferenciasDia(fecha: string): Promise<PreferenciasDia> {
    const params = new URLSearchParams();
    params.append('fecha', fecha);

    const response = await api.get(`/metrics/preferencias/dia?${params.toString()}`);
    return response.data;
  },

  async getConsumoPorTipo(): Promise<ConsumoPorTipo[]> {
    const response = await api.get('/metrics/consumo-tipo');
    return response.data;
  },

  async getConsumoTipoTemporada(idTemporada?: number): Promise<ConsumoTipoTemporada> {
    const params = new URLSearchParams();
    if (idTemporada) params.append('id_temporada', idTemporada.toString());

    const response = await api.get(`/metrics/consumo-tipo/temporada?${params.toString()}`);
    return response.data;
  },

  async getConsumoTipoMes(anio: number, mes: number): Promise<ConsumoTipoMes> {
    const params = new URLSearchParams();
    params.append('mes', mes.toString());
    params.append('anio', anio.toString());

    const response = await api.get(`/metrics/consumo-tipo/mes?${params.toString()}`);
    return response.data;
  },

  async getConsumoTipoDia(fecha: string): Promise<ConsumoTipoDia> {
    const params = new URLSearchParams();
    params.append('fecha', fecha);

    const response = await api.get(`/metrics/consumo-tipo/dia?${params.toString()}`);
    return response.data;
  },

  async getTopUsuarios(limit?: number): Promise<TopUsuario[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());

    const response = await api.get(`/metrics/top-usuarios?${params.toString()}`);
    return response.data;
  },

  async getDetalleAsistencia(idTemporada?: number, tipoEmpleado?: string): Promise<any> {
    const params = new URLSearchParams();
    if (idTemporada) params.append('id_temporada', idTemporada.toString());
    if (tipoEmpleado) params.append('tipo_empleado', tipoEmpleado);

    const response = await api.get(`/metrics/detalle-asistencia?${params.toString()}`);
    return response.data;
  },

  async getConsumoPorUsuario(mes?: number, anio?: number, fecha?: string): Promise<ConsumoPorUsuario> {
    const params = new URLSearchParams();
    if (fecha) {
      params.append('fecha', fecha);
    } else if (mes && anio) {
      params.append('mes', mes.toString());
      params.append('anio', anio.toString());
    }

    const response = await api.get(`/metrics/consumo-usuario?${params.toString()}`);
    return response.data;
  },

  async getPorcentajeAsistencia(): Promise<AsistenciaData> {
    const response = await api.get('/metrics/asistencia');
    return response.data;
  }
};

export default metricsService;
