/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Catálogo Oficial de Indicadores, Fuentes y Reglas de Integración STOL Logistics
 */

export interface IndicatorDefinition {
  id: string;
  nombre: string;
  modulo: string;
  descripcion: string;
  reglaCalculo: string;
  fuenteOficial: 'Google Sheets' | 'Excel Local / Sede' | 'Power BI' | 'Supabase' | 'WMS Interno';
  archivoOTablaOrigen: string;
  columnasUtilizadas: string[];
  unidadMedida: string;
  frecuenciaActualizacion: string;
  periodoAnalisis: string;
  reglasValidacion: string[];
  politicaDiscrepancia: string;
  ultimaActualizacionExitosa: string;
  estadoIntegracion: 'CONECTADO' | 'EN_LINEA' | 'PENDIENTE_CONEXION' | 'AUDITADO';
}

export const OFFICIAL_INDICATORS_CATALOG: IndicatorDefinition[] = [
  {
    id: 'FLEET_HOURS',
    nombre: 'Horas Operativas de Flota (Horómetros)',
    modulo: 'Horómetros & Flota',
    descripcion: 'Horas reales consumidas mensualmente por montacargas y elevadores según lectura de horómetro inicial vs final.',
    reglaCalculo: 'Horas Usadas = Horómetro Final - Horómetro Inicial (o consumo directo informado por proveedor)',
    fuenteOficial: 'Google Sheets',
    archivoOTablaOrigen: 'Hoja "Flota_Horometros" (Publicada en web)',
    columnasUtilizadas: ['Código de Equipo', 'Proveedor', 'Tipo', 'Mes', 'Horas Usadas', 'Límite Contratado'],
    unidadMedida: 'Horas (h)',
    frecuenciaActualizacion: 'Periódica (60 segundos configurable)',
    periodoAnalisis: 'Mensual / Acumulado 2026',
    reglasValidacion: [
      'Valores no negativos',
      'Valores menores a 744h (límite físico mensual de 31 días * 24h)',
      'Identificación explícita de proveedor DERCO o NOVA',
      'Alertar si consumo mensual supera 300h (Montacargas) o 375h (Elevadores)',
    ],
    politicaDiscrepancia:
      'Si difiere de Excel local o WMS, prima la bitácora de Google Sheets auditada por el Jefe de Mantenimiento. No se promedian valores.',
    ultimaActualizacionExitosa: 'En sincronización continua',
    estadoIntegracion: 'EN_LINEA',
  },
  {
    id: 'FLEET_INOP',
    nombre: 'Horas de Inoperatividad y Disponibilidad de Flota',
    modulo: 'Horómetros & Flota',
    descripcion: 'Tiempo acumulado en que una unidad estuvo fuera de servicio por mantenimiento preventivo o correctivo.',
    reglaCalculo: 'Disponibilidad % = ((Horas Teóricas Disponibles - Horas Inoperativas) / Horas Teóricas Disponibles) * 100',
    fuenteOficial: 'Google Sheets',
    archivoOTablaOrigen: 'Hoja "Bitacora_Incidencias" / Columnas Horas Inoperativas',
    columnasUtilizadas: ['Código Equipo', 'Fecha Incidencia', 'Tipo Mantenimiento', 'Horas Inoperativo', 'Resultado'],
    unidadMedida: 'Horas (h) / Porcentaje (%)',
    frecuenciaActualizacion: 'Diaria en turno / Refresco 60s',
    periodoAnalisis: 'Mensual (Julio - Octubre 2026)',
    reglasValidacion: [
      'Inoperatividad mayor a 0h requiere detalle de causa y estado (Reparado o Pendiente)',
      'Validar consistencia de fecha con el mes operativo',
    ],
    politicaDiscrepancia:
      'En caso de discrepancia con el proveedor DERCO o NOVATRANS, se audita el acta firmada por el prevencionista.',
    ultimaActualizacionExitosa: 'En sincronización continua',
    estadoIntegracion: 'EN_LINEA',
  },
  {
    id: 'VOLUMETRY_CUBIC',
    nombre: 'Cubicaje y Control de Dimensiones de SKUs',
    modulo: 'Mediciones & Volumetría',
    descripcion: 'Verificación metrológica física (largo x ancho x alto) de bultos y cajas versus las cotas registradas en WMS.',
    reglaCalculo: 'Volumen Real (m³) = (Largo x Ancho x Alto) / 1,000,000. Discrepancia % = ((Volumen Real - Volumen WMS) / Volumen WMS) * 100',
    fuenteOficial: 'Excel Local / Sede',
    archivoOTablaOrigen: 'Archivo "Mediciones_Volumetria_STOL.xlsx" / Hoja "Auditoria_Volumetria"',
    columnasUtilizadas: ['Código SKU', 'Largo Real', 'Ancho Real', 'Alto Real', 'Volumen Real', 'Volumen WMS'],
    unidadMedida: 'Metros Cúbicos (m³)',
    frecuenciaActualizacion: 'Por lote de auditoría en sede',
    periodoAnalisis: 'Campaña 2026 (842 SKUs muestreados)',
    reglasValidacion: [
      'Dimensiones mayores a 0 cm',
      'Tolerancia máxima admisible de discrepancia: ±5%',
      'Discrepancia > 10% marcada como Alerta Crítica para reliquidación de flete',
    ],
    politicaDiscrepancia:
      'La medición física con huincha calibrada en mesa de recepción prevalece sobre el maestro WMS histórico.',
    ultimaActualizacionExitosa: '2026-10-18 16:45',
    estadoIntegracion: 'AUDITADO',
  },
  {
    id: 'POWERBI_EXECUTIVE',
    nombre: 'Tablero Gerencial de Tendencias y Distribución (Power BI)',
    modulo: 'Power BI Integrado',
    descripcion: 'Reporte analítico corporativo de capacidad instalada, rotación por pasillo y utilización volumétrica.',
    reglaCalculo: 'Modelo semántico DAX corporativo centralizado en Power BI Service',
    fuenteOficial: 'Power BI',
    archivoOTablaOrigen: 'Área de Trabajo Corporativa STOL / Informe "STOL_Operaciones_Directorio"',
    columnasUtilizadas: ['DimFecha', 'DimUbicacion', 'FactMovimientos', 'CapacidadM3', 'OcupacionPct'],
    unidadMedida: 'Adimensional / Porcentual / m³',
    frecuenciaActualizacion: 'Programada en Power BI Gateway (4 veces al día)',
    periodoAnalisis: 'Histórico Anual 2025 - 2026',
    reglasValidacion: [
      'Token de acceso o enlace seguro validado',
      'Visualización interactiva embebida sin duplicidad de cálculos en frontend',
    ],
    politicaDiscrepancia:
      'El modelo semántico de Power BI es la referencia para presentaciones de Directorio. Los desvíos se informan al equipo de BI.',
    ultimaActualizacionExitosa: 'Conexión activa por visualizador',
    estadoIntegracion: 'CONECTADO',
  },
  {
    id: 'SUPABASE_POSTGRES',
    nombre: 'Repositorio de Eventos de Telemetría (PostgreSQL Supabase)',
    modulo: 'Telemetría & Eventos',
    descripcion: 'Base de datos relacional para consulta histórica de eventos IoT, sensores de peso y horómetros en sede.',
    reglaCalculo: 'Consultas SELECT de solo lectura indexadas por timestamp y equipo_id',
    fuenteOficial: 'Supabase',
    archivoOTablaOrigen: 'Esquema público / Tablas: fleet_telemetry_events, audit_logs',
    columnasUtilizadas: ['id', 'equipo_id', 'sensor_tipo', 'valor', 'created_at'],
    unidadMedida: 'Eventos / Registros',
    frecuenciaActualizacion: 'Tiempo real / On-demand REST',
    periodoAnalisis: 'Últimos 90 días',
    reglasValidacion: ['Solo lectura (READ-ONLY)', 'Llave anónima pública con políticas RLS'],
    politicaDiscrepancia:
      'Supabase almacena trazas crudas. Para conciliación contable o de facturación rige la bitácora mensual aprobada.',
    ultimaActualizacionExitosa: 'Módulo preparado para credenciales',
    estadoIntegracion: 'PENDIENTE_CONEXION',
  },
];
