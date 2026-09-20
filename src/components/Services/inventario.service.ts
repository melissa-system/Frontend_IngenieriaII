import axios from 'axios';
import { apiClient } from '../../lib/apiClient';

export interface Proveedor {
  id: number;
  nombre: string;
  tipo: 'Físico' | 'Jurídico';
  contacto?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  estado: 'Activo' | 'Inactivo';
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface MovimientoInventario {
  id: number;
  articulo_id?: number;
  tipo_movimiento: 'entrada' | 'salida';
  cantidad: number;
  responsable_destino?: string | null;
  motivo: string;
  usuario_id?: number | null;
  nombre_persona_registro?: string | null;
  fecha_movimiento: string;
}

export interface Articulo {
  id: number;
  nombre: string;
  descripcion: string;
  clasificacion: 'inmueble' | 'articulo';
  cantidad_disponible: number;
  fecha_ingreso: string;
  ubicacion: string;
  persona_recibe: string;
  estado: 'activo' | 'inactivo';
  proveedor: Proveedor;
  movimientos?: MovimientoInventario[];
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface CrearArticuloPayload {
  nombre: string;
  descripcion: string;
  clasificacion: 'inmueble' | 'articulo';
  cantidad: number;
  fechaIngreso?: string;
  ubicacion: string;
  proveedorId: number;
  personaRecibe: string;
}

export interface RegistrarMovimientoPayload {
  tipoMovimiento: 'entrada' | 'salida';
  cantidad: number;
  motivo: string;
  responsableDestino?: string;
}

export interface FiltrosArticulos {
  busqueda?: string;
  clasificacion?: string;
  estado?: string;
}

function obtenerMensajeError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK') {
      return 'No se pudo conectar con el servidor. Inténtalo más tarde.';
    }
    const msg = error.response?.data?.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg.join('. ');
  }
  return fallback;
}

// ------------------------------------------------------------------
// ARTÍCULOS
// ------------------------------------------------------------------

export const obtenerArticulos = async (
  filtros: FiltrosArticulos = {},
): Promise<Articulo[]> => {
  try {
    const params: Record<string, string> = {};
    if (filtros.busqueda) params.busqueda = filtros.busqueda;
    if (filtros.clasificacion && filtros.clasificacion !== 'Todas') {
      params.clasificacion = filtros.clasificacion;
    }
    if (filtros.estado && filtros.estado !== 'Todos') {
      params.estado = filtros.estado;
    }

    const { data } = await apiClient.get<Articulo[]>('/api/articulos', {
      params,
    });
    return data;
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'Error al cargar los artículos de inventario'),
    );
  }
};

export const obtenerArticuloPorId = async (id: number): Promise<Articulo> => {
  try {
    const { data } = await apiClient.get<Articulo>(`/api/articulos/${id}`);
    return data;
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'Error al obtener el detalle del artículo'),
    );
  }
};

export const crearArticulo = async (
  payload: CrearArticuloPayload,
): Promise<Articulo> => {
  try {
    const { data } = await apiClient.post<Articulo>('/api/articulos', payload);
    return data;
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'Error al registrar el artículo en inventario'),
    );
  }
};

export const actualizarArticulo = async (
  id: number,
  payload: Partial<CrearArticuloPayload>,
): Promise<Articulo> => {
  try {
    const { data } = await apiClient.patch<Articulo>(
      `/api/articulos/${id}`,
      payload,
    );
    return data;
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'Error al actualizar el artículo'),
    );
  }
};

export const registrarMovimientoArticulo = async (
  id: number,
  payload: RegistrarMovimientoPayload,
): Promise<{ articulo: Articulo; movimiento: MovimientoInventario }> => {
  try {
    const { data } = await apiClient.put<{
      articulo: Articulo;
      movimiento: MovimientoInventario;
    }>(`/api/articulos/${id}/movimiento`, payload);
    return data;
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'Error al registrar el movimiento de inventario'),
    );
  }
};

export const obtenerHistorialArticulo = async (
  id: number,
): Promise<MovimientoInventario[]> => {
  try {
    const { data } = await apiClient.get<MovimientoInventario[]>(
      `/api/articulos/${id}/historial`,
    );
    return data;
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'Error al cargar el historial del artículo'),
    );
  }
};

export const cambiarEstadoArticulo = async (
  id: number,
  nuevoEstado?: 'activo' | 'inactivo',
): Promise<Articulo> => {
  try {
    const { data } = await apiClient.patch<Articulo>(
      `/api/articulos/${id}/estado`,
      nuevoEstado ? { estado: nuevoEstado } : {},
    );
    return data;
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'Error al cambiar el estado del artículo'),
    );
  }
};

// ------------------------------------------------------------------
// PROVEEDORES
// ------------------------------------------------------------------

export const obtenerProveedores = async (): Promise<Proveedor[]> => {
  try {
    const { data } = await apiClient.get<Proveedor[]>('/api/proveedores');
    return data;
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'Error al cargar la lista de proveedores'),
    );
  }
};

export const crearProveedor = async (
  payload: Partial<Proveedor>,
): Promise<Proveedor> => {
  try {
    const { data } = await apiClient.post<Proveedor>(
      '/api/proveedores',
      payload,
    );
    return data;
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'Error al registrar el proveedor'),
    );
  }
};

export const actualizarProveedor = async (
  id: number,
  payload: Partial<Proveedor>,
): Promise<Proveedor> => {
  try {
    const { data } = await apiClient.patch<Proveedor>(
      `/api/proveedores/${id}`,
      payload,
    );
    return data;
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'Error al actualizar el proveedor'),
    );
  }
};

export const eliminarProveedor = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`/api/proveedores/${id}`);
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error, 'Error al eliminar el proveedor'),
    );
  }
};

