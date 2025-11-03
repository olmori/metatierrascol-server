/**
 * Interfaz para crear una capa WMS en el backend
 */
export interface WmsLayerCreate {
  layer_name: string;
  layer_title: string;
  visible: boolean;
  opacity?: number;
  z_index?: number;
  style?: string;
  extra?: Record<string, any>;
}

/**
 * Interfaz para la respuesta de una capa WMS del backend
 */
export interface WmsLayer {
  id: number;
  service: number;
  layer_name: string;
  layer_title: string;
  visible: boolean;
  opacity?: number;
  z_index?: number;
  style: string;
  extra: Record<string, any>;
  updated_at: string;
}
