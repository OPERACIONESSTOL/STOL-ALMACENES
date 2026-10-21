import { ExecutiveObservation } from '../components/ExecutiveObservationsCard';

export const EXECUTIVE_OBSERVATIONS: ExecutiveObservation[] = [
  // --- PESTAÑA: PANEL EJECUTIVO (OVERVIEW) ---
  {
    id: 'obs-over-1',
    module: 'overview',
    category: 'Estrategia de Costos',
    title: 'Gasto Excesivo en HHEE Dominicales vs Presupuesto Operativo',
    severity: 'CRITICO',
    impactLabel: 'Horas con Recargo 100%',
    impactValue: '5,926 h (41.9%)',
    finding:
      'El 41.9% de todas las horas extras de la compañía se concentran en domingos y feriados a tarifa doble (5,926.1 h de 14,128.6 h totales), impactando severamente el margen de los contratos de servicio logístico.',
    rootCause:
      'Falta de rotación de cuadrillas fijas de fin de semana y acumulación de pedidos pendientes de picking no despachados entre semana.',
    boardDecision:
      'Aprobar reestructuración inmediata del 4to turno rotativo de fin de semana en Almacén Central y topar a máximo 12h dominicales por operario/mes.',
    responsible: 'Gerencia de Operaciones & RRHH',
    auditor: 'Auditoría Interna Corporativa',
    actionChecklist: [
      'Negociar nuevo esquema de cuadrillas 4x3 para fin de semana antes del cierre de mes.',
      'Auditar causas de reprogramación de despacho los días viernes y sábados.',
      'Establecer aprobación previa de Gerencia de Operaciones para turnos dominicales mayores a 4h.',
    ],
    metricsDetail: [
      { label: 'Total Horas Extras', value: '14,128.6 h' },
      { label: 'HHEE Dominical/Feriado', value: '5,926.1 h' },
      { label: 'Sobrecosto Estimado', value: 'S/ 118,500' },
    ],
  },
  {
    id: 'obs-over-2',
    module: 'overview',
    category: 'Riesgo Comercial & WMS',
    title: 'Subfacturación de Almacenaje por Discrepancia Volumétrica (+45.7%)',
    severity: 'CRITICO',
    impactLabel: 'Variación de Cubicaje',
    impactValue: '+45.7% m³',
    finding:
      'SKUs clave como SKU-ALM-8820 ocupan 0.152 m³ físicos frente a 0.104 m³ facturados según el maestro WMS. Riesgo de cobrar menos flete y almacenaje al cliente titular.',
    rootCause:
      'Proveedor cambió empaque secundario sin notificar y el proceso de cubicaje al recibir no bloqueó el alta automática en el WMS.',
    boardDecision:
      'Instruir al Jefe de Sistemas la actualización obligatoria de maestros volumétricos y emitir refacturación retroactiva al cliente.',
    responsible: 'Jefatura de Facturación & Almacén',
    auditor: 'Auditoría de Volumetría WMS',
    actionChecklist: [
      'Actualizar ficha dimensional física de los 3 SKUs con discrepancia crítica.',
      'Emitir adenda de cobro por espacio real ocupado con el área comercial.',
      'Activar validación obligatoria de cubicaje en rampa antes del almacenaje definitivo.',
    ],
    metricsDetail: [
      { label: 'SKU Afectado', value: 'SKU-ALM-8820' },
      { label: 'Volumen Físico', value: '0.152 m³' },
      { label: 'Volumen Facturado WMS', value: '0.104 m³' },
    ],
  },
  {
    id: 'obs-over-3',
    module: 'overview',
    category: 'Gestión de Flota & Activos',
    title: 'Parada Crítica de Montacargas KGR-241 (24.5h) con Proveedor DERCO',
    severity: 'ALERTA',
    impactLabel: 'Inoperatividad Paradas',
    impactValue: '24.5 horas',
    finding:
      'El montacargas KGR-241 estuvo inoperativo 24.5 horas por rotura de manguera hidráulica de mástil. DERCO demoró 18 horas más allá del SLA pactado de 4 horas.',
    rootCause:
      'Falta de repuestos críticos en consignación in situ en el almacén y tardanza del servicio técnico del proveedor.',
    boardDecision:
      'Aplicar penalidad contractual a DERCO según cláusula de SLA e incorporar stock de emergencia de mangueras hidráulicas en taller interno.',
    responsible: 'Administración de Flota & Legal',
    auditor: 'Control de Horómetros STOL',
    actionChecklist: [
      'Notificar carta formal de incumplimiento de SLA a DERCO por 20.5 horas de exceso.',
      'Exigir equipo sustituto sin costo durante paradas mayores a 6 horas.',
      'Revisar condición de mangueras en los otros 11 equipos DERCO de la flota.',
    ],
    metricsDetail: [
      { label: 'Equipo', value: 'KGR-241 (DERCO)' },
      { label: 'SLA Contratado', value: '4.0 horas' },
      { label: 'Tiempo de Parada', value: '24.5 horas' },
    ],
  },
  {
    id: 'obs-over-4',
    module: 'overview',
    category: 'Disciplina Operativa',
    title: 'Brecha de Desempeño en Supervisores (Promedio 84.3% vs Meta 98%)',
    severity: 'ALERTA',
    impactLabel: 'Brecha vs Meta 98%',
    impactValue: '-13.7 puntos',
    finding:
      'La evaluación trimestral consolidada de supervisores cerró en 84.3%, situándose 13.7 puntos por debajo de la meta directiva del 98%. 2 de 5 supervisores están en rango Regular.',
    rootCause:
      'Fallas reiteradas en puntualidad de relevo de turno, pallets observados sin liberar en buffer y desvíos menores de seguridad SIG.',
    boardDecision:
      'Implementar planes de acción correctiva semanales obligatorios con auditoría inopinada los días lunes y jueves.',
    responsible: 'Jefaturas de Operaciones (P. Morante / A. Bautista)',
    auditor: 'Comité de Auditoría 60/20/20',
    actionChecklist: [
      'Seguimiento diario de bitácora de relevos entre turno día y turno noche.',
      'Inspección de pallets en buffer zona 4 con límite máximo de 24 horas.',
      'Vincular incentivo trimestral al cumplimiento del 98% en los 3 pilares.',
    ],
    metricsDetail: [
      { label: 'Promedio Supervisores', value: '84.3%' },
      { label: 'Meta Directiva', value: '98.0%' },
      { label: 'Supervisor Menor Nota', value: 'Pedro Oliva (77.6%)' },
    ],
  },

  // --- PESTAÑA: HORAS EXTRAS (OVERTIME) ---
  {
    id: 'obs-hhee-1',
    module: 'overtime',
    category: 'Concentración de Demanda',
    title: 'Concentración de 4,478.6 h Extras en Área Picking (31.7% del Total)',
    severity: 'CRITICO',
    impactLabel: 'Volumen Concentrado',
    impactValue: '4,478.6 h',
    finding:
      'El área de Picking concentra 4,478.6 horas extras (casi un tercio de las 14,128.6 h de toda la operación), generando fatiga laboral y riesgo de errores en la preparación de pedidos.',
    rootCause:
      'Picos de olas de picking liberadas simultáneamente después de las 18:00 h, forzando a los operarios a extender sus turnos habituales.',
    boardDecision:
      'Nivelar las ventanas horarias de liberación de pedidos con el área comercial (WMS Wave Management) para no acumular olas al final del día.',
    responsible: 'Jefe de Picking & Planificación',
    auditor: 'Auditoría de Procesos STOL',
    actionChecklist: [
      'Reunión semanal con cliente para fijar hora de corte de pedidos (Cut-Off a las 15:30 h).',
      'Balancear operarios polifuncionales desde Almacén hacia Picking durante horas pico.',
      'Monitorear índice de picking por hora (UPH) para evitar sobretiempos innecesarios.',
    ],
    metricsDetail: [
      { label: 'Horas Extras Picking', value: '4,478.6 h' },
      { label: '% del Total HHEE', value: '31.7%' },
      { label: 'Cargos Afectados', value: 'Operario, Capitán' },
    ],
  },
  {
    id: 'obs-hhee-2',
    module: 'overtime',
    category: 'Eficiencia Presupuestal',
    title: 'Días de Bono Pagados (2,879) sin Reducción Proporcional de HHEE',
    severity: 'ALERTA',
    impactLabel: 'Incentivos Registrados',
    impactValue: '2,879 días bono',
    finding:
      'Se otorgaron 2,879 días de bono de incentivo en la planilla, sin embargo, áreas como Despacho e Importados mantuvieron elevados niveles de horas extras.',
    rootCause:
      'Las reglas de otorgamiento del bono premian asistencia pero no condicionan a la reducción efectiva de horas de sobretiempo.',
    boardDecision:
      'Revisar el reglamento del bono de productividad con RRHH para ligarlo a cumplimiento de meta de productividad diurna sin horas extras.',
    responsible: 'Gerencia de RRHH & Compensaciones',
    auditor: 'Control de Gestión Financiera',
    actionChecklist: [
      'Alinear la matriz de bonos con el indicador de Horas Extras por tonelada despachada.',
      'Excluir de bonificación extraordinaria a turnos con HHEE no justificadas.',
      'Presentar propuesta de nuevo reglamento al Directorio en 15 días.',
    ],
    metricsDetail: [
      { label: 'Días Bono Pagados', value: '2,879 días' },
      { label: 'Horas Despacho HHEE', value: '2,890.5 h' },
      { label: 'Oportunidad de Ahorro', value: 'S/ 42,000 / mes' },
    ],
  },
  {
    id: 'obs-hhee-3',
    module: 'overtime',
    category: 'Operación Crítica',
    title: 'Sobrecarga de Montacarguistas y Elevadoristas (3,210.5 h Extras)',
    severity: 'ALERTA',
    impactLabel: 'HHEE de Maquinistas',
    impactValue: '3,210.5 h',
    finding:
      'Los puestos de Montacarguista y Elevadorista registraron 3,210.5 horas extras, lo que además de costo laboral incrementa directamente los horómetros de la flota alquilada.',
    rootCause:
      'Escasez de operadores con brevete y certificación vigente para cubrir turnos nocturnos y descansos médicos.',
    boardDecision:
      'Aprobar programa de formación y certificación interna de operarios de almacén para ampliar el pool de maquinistas homologados.',
    responsible: 'Jefatura de Operaciones & Seguridad SIG',
    auditor: 'Auditoría de Horómetros & RRHH',
    actionChecklist: [
      'Lanzar convocatoria interna para capacitar a 6 operarios como maquinistas de respaldo.',
      'Controlar que ningún maquinista supere 48 horas semanales acumuladas por seguridad.',
      'Rotar equipos entre zonas de alta y baja exigencia física.',
    ],
    metricsDetail: [
      { label: 'HHEE Montacarguistas', value: '2,420.0 h' },
      { label: 'HHEE Elevadoristas', value: '790.5 h' },
      { label: 'Equipos Afectados', value: '19 unidades' },
    ],
  },
  {
    id: 'obs-hhee-4',
    module: 'overtime',
    category: 'Proceso Ecommerce',
    title: 'Desfase Horario en Despacho Ecommerce por Pedidos Venta en Verde (VEV)',
    severity: 'SEGUIMIENTO',
    impactLabel: 'HHEE Ecommerce',
    impactValue: '1,540.2 h',
    finding:
      'El área de Ecommerce presenta turnos extendidos de hasta 4 horas nocturnas para culminar el etiquetado y packing de pedidos de marketplace VEV.',
    rootCause:
      'Los transportistas de última milla llegan a retirar paquetería en horarios fuera de ventana (después de las 20:00 h).',
    boardDecision:
      'Fijar horario estricto de recepción de couriers a las 18:30 h y pactar ventanas garantizadas con los marketplaces.',
    responsible: 'Jefe de Ecommerce & Transporte',
    auditor: 'Supervisión de Turnos',
    actionChecklist: [
      'Establecer penalidad a couriers que soliciten entregas nocturnas fuera de SLA.',
      'Incorporar 2 estaciones de packing adicionales en zona ecommerce.',
      'Automatizar generación masiva de guías de remisión electrónicas.',
    ],
    metricsDetail: [
      { label: 'HHEE Operarios VEV', value: '380.0 h' },
      { label: 'HHEE Operador Sistemas', value: '410.0 h' },
      { label: 'SLA Entrega Courier', value: '18:30 h Límite' },
    ],
  },

  // --- PESTAÑA: VOLUMETRÍA & MEDICIONES ---
  {
    id: 'obs-vol-1',
    module: 'volumetry',
    category: 'Auditoría WMS vs Real',
    title: 'Discrepancia Crítica (+45.7%) en SKU-ALM-8820 Filtros Industriales',
    severity: 'CRITICO',
    impactLabel: 'Diferencia en m³',
    impactValue: '+0.048 m³ / caja',
    finding:
      'Se midieron 0.152 m³ físicos versus 0.104 m³ registrados en el maestro WMS. Esto genera ocupación oculta de posiciones de rack y riesgo de colapso de cubicaje.',
    rootCause:
      'Cambio de proveedor de empaque en origen sin actualización del catálogo maestro.',
    boardDecision:
      'Bloqueo temporal de ingresos de este SKU hasta que el cliente convalide la nueva ficha técnica y tarifa de almacenamiento.',
    responsible: 'Jefe de Cubicaje & Maestro de Artículos',
    auditor: 'Makley Villanueva (Auditor SIG)',
    actionChecklist: [
      'Re-medir muestra de 10 cajas del lote con wincha y balanza calibrada.',
      'Actualizar de inmediato el maestro de artículos en el WMS STOL.',
      'Revisar si existen otros 4 SKUs del mismo proveedor con variación similar.',
    ],
    metricsDetail: [
      { label: 'Largo/Ancho/Alto Real', value: '62 x 45 x 54 cm' },
      { label: 'Largo/Ancho/Alto WMS', value: '55 x 40 x 47 cm' },
      { label: 'Desvío Porcentual', value: '+45.7%' },
    ],
  },
  {
    id: 'obs-vol-2',
    module: 'volumetry',
    category: 'Avance del Proyecto',
    title: 'Catalogación de SKUs en 70.2% (358 SKUs Pendientes en Recepción)',
    severity: 'ALERTA',
    impactLabel: 'SKUs por Medir',
    impactValue: '358 de 1,200',
    finding:
      'Se han cubicado 842 SKUs de un universo de 1,200 en catálogo. La zona de Recepción presenta retraso por falta de estación de pesaje móvil disponible.',
    rootCause:
      'Solo se cuenta con una báscula dimensional fija en nave 1, obligando a trasladar cargas pesadas para su registro.',
    boardDecision:
      'Adquirir una estación portátil de cubicaje digital con lector de código de barras para acelerar el barrido del catálogo.',
    responsible: 'Jefatura de Almacén & TI',
    auditor: 'Auditoría de Operaciones',
    actionChecklist: [
      'Cotizar balanza volumétrica digital móvil antes del viernes.',
      'Asignar 2 analistas en turno tarde dedicados exclusivamente a cubicaje.',
      'Completar el 100% de los 1,200 SKUs antes del 15 de noviembre.',
    ],
    metricsDetail: [
      { label: 'SKUs Medidos', value: '842 (70.2%)' },
      { label: 'SKUs Pendientes', value: '358 (29.8%)' },
      { label: 'Volumen Total Medido', value: '473.9 m³' },
    ],
  },
  {
    id: 'obs-vol-3',
    module: 'volumetry',
    category: 'Embalaje & Packing',
    title: 'Sobredimensionamiento de Empaques en Despacho (12% Aire Muerto)',
    severity: 'SEGUIMIENTO',
    impactLabel: 'Inercia de Espacio',
    impactValue: '~56.8 m³ aire',
    finding:
      'El 12% de las cajas armadas en la zona de empaque final presentan más del 30% de espacio vacío sin rellenar, encareciendo el flete de transporte.',
    rootCause:
      'Solo se utilizan 3 tamaños de cajas estándar, obligando a empacar ítems pequeños en cajas excesivamente grandes.',
    boardDecision:
      'Incorporar 2 tamaños de cajas intermedias (Caja C-15 y Caja C-25) en el contrato de suministros de cartón.',
    responsible: 'Compras & Jefatura de Despacho',
    auditor: 'Auditoría de Logística de Salida',
    actionChecklist: [
      'Calcular ahorro en fletes al optimizar tamaños de cajas.',
      'Reunión con proveedor de cajas para entrega de nuevo lote de prueba.',
      'Capacitar a empacadores en selección óptima de empaque.',
    ],
    metricsDetail: [
      { label: 'Cajas Auditadas', value: '3,695 cajas' },
      { label: 'Aire Muerto Estimado', value: '56.8 m³' },
      { label: 'Impacto Flete', value: 'S/ 18,400' },
    ],
  },

  // --- PESTAÑA: HORÓMETROS & FLOTA ---
  {
    id: 'obs-fleet-1',
    module: 'fleet',
    category: 'Proveedor DERCO',
    title: 'Incumplimiento Reiterado de SLA por Mantenimiento Correctivo',
    severity: 'CRITICO',
    impactLabel: 'Horas Inoperativas',
    impactValue: '24.5 h en Setiembre',
    finding:
      'El proveedor DERCO acumuló 24.5 horas de paradas en equipos por falta de respuesta oportuna a reportes de fugas de aceite y fallas de frenos.',
    rootCause:
      'El técnico asignado por DERCO atiende múltiples plantas en la zona industrial y no prioriza las emergencias de STOL.',
    boardDecision:
      'Exigir a DERCO la asignación de un técnico residente en planta de lunes a sábado o retener pago de factura del mes.',
    responsible: 'Gerencia de Operaciones & Compras',
    auditor: 'Auditoría Técnica de Flota',
    actionChecklist: [
      'Retener factura mensual de DERCO por concepto de penalidad de SLA.',
      'Exigir reunión con el Gerente de Cuentas Corporativas de DERCO.',
      'Evaluar traspaso paulatino de equipos hacia NOVATRANS si no hay mejora.',
    ],
    metricsDetail: [
      { label: 'Horas Inoperativas DERCO', value: '24.5 h' },
      { label: 'Horas Inoperativas NOVA', value: '0.0 h' },
      { label: 'SLA Incumplido', value: '4 eventos' },
    ],
  },
  {
    id: 'obs-fleet-2',
    module: 'fleet',
    category: 'Contratos de Alquiler',
    title: '3 Equipos en Riesgo de Penalidad por Límite de Horas (300h/375h)',
    severity: 'ALERTA',
    impactLabel: 'Equipos al Límite',
    impactValue: '3 Unidades (>92%)',
    finding:
      'Tres montacargas de alta rotación en zona de Despacho e Importados han superado el 92% de sus horas contractuales a mitad de período mensual.',
    rootCause:
      'Falta de rotación física de las máquinas; los operadores eligen siempre las mismas 3 unidades por comodidad y cercanía al cargador.',
    boardDecision:
      'Implementar rotación mandatoria de llaves por turno para distribuir el desgaste equitativamente entre las 19 unidades.',
    responsible: 'Jefe de Patio & Flota',
    auditor: 'Supervisor de Turno',
    actionChecklist: [
      'Asignar llaves según matriz de balanceo diario de horómetros.',
      'Bloquear uso de unidades que lleguen al 95% del límite contratado.',
      'Revisar si conviene ampliar el contrato de 300h a 350h para 2 equipos.',
    ],
    metricsDetail: [
      { label: 'Límite Mensual Estándar', value: '300h / 375h' },
      { label: 'Horas Acumuladas Max', value: '288.5 h' },
      { label: 'Costo Hora Extra Flota', value: 'US$ 14 / hora' },
    ],
  },
  {
    id: 'obs-fleet-3',
    module: 'fleet',
    category: 'Seguridad & Operación',
    title: 'Reemplazo Preventivo de Baterías de Tracción en Elevadores de Nave 2',
    severity: 'SEGUIMIENTO',
    impactLabel: 'Degradación de Carga',
    impactValue: '-22% Autonomía',
    finding:
      'Dos elevadores eléctricos presentan caída acelerada de voltaje a las 5 horas de uso continuo (lo estándar es 8 horas completas).',
    rootCause:
      'Ciclos de carga rápida incompletos durante el cambio de turno que han sulfatado las celdas de plomo-ácido.',
    boardDecision:
      'Instalar temporizador inteligente en sala de baterías y auditar que ningún equipo sea desconectado antes del 100% de carga.',
    responsible: 'Mantenimiento Eléctrico & Patio',
    auditor: 'Control de Activos',
    actionChecklist: [
      'Revisar densidad de electrolito en las 19 baterías de tracción.',
      'Programar ecualización de celdas para el fin de semana.',
      'Capacitar a maquinistas en protocolo de carga lenta nocturna.',
    ],
    metricsDetail: [
      { label: 'Autonomía Actual', value: '5.2 horas' },
      { label: 'Autonomía Nominal', value: '8.0 horas' },
      { label: 'Costo Batería Nueva', value: 'US$ 3,800' },
    ],
  },

  // --- PESTAÑA: DESEMPEÑO SUPERVISORES ---
  {
    id: 'obs-sup-1',
    module: 'supervisors',
    category: 'Auditoría 60/20/20',
    title: 'Pedro Oliva: Penalización de -7.4 pts por Inasistencia en Relevo Noche',
    severity: 'CRITICO',
    impactLabel: 'Puntaje Consolidado',
    impactValue: '77.6% (Regular)',
    finding:
      'El supervisor Pedro Oliva obtuvo la nota más baja del mes (77.6% vs meta 98%) tras registrar demoras de 45 minutos en el relevo de turno noche y 12 pallets sin estatus en buffer.',
    rootCause:
      'Falta de supervisión activa en el patio durante el cambio de guardia y descoordinación con los analistas de inventario.',
    boardDecision:
      'Activar Plan de Acompañamiento Operativo de 30 días con el Jefe de Operaciones y condicionar bonificación a alcanzar 90% mínimo en noviembre.',
    responsible: 'Pedro Morante (Jefe Directo)',
    auditor: 'Karla Bolívar (Auditora RRHH)',
    actionChecklist: [
      'Firmar acta de compromiso de relevo a tiempo con presencia en rampa.',
      'Depurar buffer de pallets diariamente antes de las 18:00 h.',
      'Re-auditoría sorpresa en semana 42.',
    ],
    metricsDetail: [
      { label: 'Nota Operaciones (60%)', value: '48.0 / 60' },
      { label: 'Nota SIG (20%)', value: '15.6 / 20' },
      { label: 'Nota RRHH (20%)', value: '14.0 / 20' },
    ],
  },
  {
    id: 'obs-sup-2',
    module: 'supervisors',
    category: 'Inventario & WMS',
    title: 'Marco Silva: 81.2% por Desajustes en Conteos Cíclicos de Picking',
    severity: 'ALERTA',
    impactLabel: 'Puntaje Consolidado',
    impactValue: '81.2% (Regular)',
    finding:
      'Se encontraron 18 discrepancias físicas contra sistema durante los conteos cíclicos de la semana 40 en las ubicaciones asignadas a su equipo.',
    rootCause:
      'Operarios nuevos sin entrenamiento completo reubicando pallets sin registrar el movimiento en la radiofrecuencia (RF).',
    boardDecision:
      'Re-certificar a los 14 operarios de su cuadrilla en el uso del terminal WMS RF e implementar doble confirmación en picking.',
    responsible: 'Aldo Bautista (Jefe Directo)',
    auditor: 'Auditoría de Inventarios',
    actionChecklist: [
      'Curso de re-entrenamiento WMS en radiofrecuencia de 2 horas.',
      'Supervisión presencial en pasillos 12 al 18 durante las mañanas.',
      'Tolerancia cero a movimientos de pallets sin escaneo previo.',
    ],
    metricsDetail: [
      { label: 'Puntaje Obtenido', value: '81.2%' },
      { label: 'Brecha vs Meta', value: '-16.8 pts' },
      { label: 'Discrepancias RF', value: '18 ítems' },
    ],
  },
  {
    id: 'obs-sup-3',
    module: 'supervisors',
    category: 'Seguridad SIG',
    title: 'Liz Minaya: 84.8% con Oportunidades en Cumplimiento de EPP en Rampa',
    severity: 'SEGUIMIENTO',
    impactLabel: 'Puntaje Consolidado',
    impactValue: '84.8% (Bueno)',
    finding:
      'Deducción de 3.2 puntos en el pilar SIG por operarios de carga sin chaleco reflectivo reglamentario y tránsito peatonal en zona de montacargas.',
    rootCause:
      'Urgencia por acelerar el despacho de 4 camiones de carga pesada provocó relajación de las medidas de seguridad preventiva.',
    boardDecision:
      'Reforzar demarcación vial en patio de maniobras y capacitar a la supervisora en gestión de presión de tiempos sin vulnerar normas SIG.',
    responsible: 'Pedro Morante & Seguridad SIG',
    auditor: 'Makley Villanueva (Auditor SIG)',
    actionChecklist: [
      'Charla de 5 minutos sobre tránsito en patio antes de iniciar turno.',
      'Inspección diaria de EPP por el líder de rampa.',
      'Colocar conos de delimitación en bahías de carga 1 a 4.',
    ],
    metricsDetail: [
      { label: 'Puntaje SIG (20%)', value: '16.8 / 20' },
      { label: 'Puntaje Global', value: '84.8%' },
      { label: 'Meta Directiva', value: '98.0%' },
    ],
  },
  {
    id: 'obs-sup-4',
    module: 'supervisors',
    category: 'Referente Operativo',
    title: 'Jaiter Girón: 88.1% Liderando Eficiencia Operativa en Cross Docking',
    severity: 'OPORTUNIDAD',
    impactLabel: 'Mejor Desempeño',
    impactValue: '88.1% (1° Lugar)',
    finding:
      'El supervisor Jaiter Girón logró el desempeño más alto del mes (88.1%), con 0 incidentes de seguridad y 99.4% de pedidos procesados a tiempo.',
    rootCause:
      'Excelente planificación visual previa, asignación rigurosa de tareas y liderazgo cercano con su equipo de operarios.',
    boardDecision:
      'Reconocerlo públicamente en la reunión directiva y encargarle estandarizar su método de control para compartirlo con los otros 4 supervisores.',
    responsible: 'Gerencia de Operaciones',
    auditor: 'Comité Evaluador STOL',
    actionChecklist: [
      'Documentar el manual de buenas prácticas de Cross Docking de Jaiter.',
      'Organizar taller de transferencia metodológica el próximo martes.',
      'Otorgar reconocimiento directivo del mes.',
    ],
    metricsDetail: [
      { label: 'Puntaje Global', value: '88.1%' },
      { label: 'Pilar Operaciones', value: '54.2 / 60' },
      { label: 'Pilar SIG', value: '18.9 / 20' },
    ],
  },

  // --- PESTAÑA: TELEMETRÍA EN TIEMPO REAL ---
  {
    id: 'obs-tel-1',
    module: 'telemetry',
    category: 'Sensores IoT & Caudal',
    title: 'Caída de Rendimiento (Caudal m³/h) en Cambio de Guardia 14:00 - 15:00',
    severity: 'ALERTA',
    impactLabel: 'Caída de Caudal',
    impactValue: '-42% en m³/h',
    finding:
      'La telemetría en tiempo real evidencia una caída pronunciada del flujo de cajas medidas (de 14.8 m³/h a 8.5 m³/h) sistemáticamente entre las 13:45 y las 15:15.',
    rootCause:
      'Tiempos muertos por almuerzo escalonado y descalibración temporal de terminales en el traspaso de turno.',
    boardDecision:
      'Escalonar el horario de refrigerio en dos grupos de 30 minutos para garantizar operación continua de las fajas de cubicaje.',
    responsible: 'Jefatura de Turno & TI Industrial',
    auditor: 'Monitor de Telemetría RT',
    actionChecklist: [
      'Definir cronograma de almuerzo Grupo A (13:00) y Grupo B (13:45).',
      'Verificar conexión continua de terminales de escaneo sin reinicios forzados.',
      'Monitorear gráfica en vivo al día siguiente.',
    ],
    metricsDetail: [
      { label: 'Caudal Normal', value: '14.8 m³/h' },
      { label: 'Caudal en Traspaso', value: '8.5 m³/h' },
      { label: 'Pérdida Diaria', value: '~9.4 m³' },
    ],
  },
  {
    id: 'obs-tel-2',
    module: 'telemetry',
    category: 'Hardware & Conectividad',
    title: 'Batería Crítica (18%) en Sensor IoT de Nave Fría Posición 04',
    severity: 'SEGUIMIENTO',
    impactLabel: 'Nivel de Batería',
    impactValue: '18% Restante',
    finding:
      'El sensor IoT de temperatura y volumen en la bahía de recepción de nave fría emite alerta de batería baja, arriesgando pérdida de telemetría continua.',
    rootCause:
      'Las bajas temperaturas (-18°C) aceleran la descarga de las celdas de litio convencionales.',
    boardDecision:
      'Reemplazar la fuente por batería industrial de rango extendido (-40°C) antes de 48 horas.',
    responsible: 'Soporte Técnico de Redes & TI',
    auditor: 'Sistema de Telemetría IoT',
    actionChecklist: [
      'Adquirir pack de 4 baterías de litio-cloruro de tionilo para frío extremo.',
      'Reemplazar sensor en parada programada de las 06:00 h.',
      'Verificar reconexión en el osciloscopio de telemetría en tiempo real.',
    ],
    metricsDetail: [
      { label: 'Batería Actual', value: '18%' },
      { label: 'Temperatura Zona', value: '-18.5 °C' },
      { label: 'Tiempo Estimado', value: '36 horas' },
    ],
  },
];

export function getObservationsByModule(module: string): ExecutiveObservation[] {
  return EXECUTIVE_OBSERVATIONS.filter((o) => o.module === module);
}
