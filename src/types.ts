export type UserRole = 'tecnico' | 'administrador' | 'gerente';

export type ModuleId =
  | 'marcacion'
  | 'calendario'
  | 'expediente'
  | 'onboarding'
  | 'desempeno'
  | 'pulso'
  | 'tablero';

export interface AuthUser {
  id: string;
  username: string;
  nombre: string;
  role: UserRole;
  cargo: string;
}

export interface Colaborador {
  id: string;
  nombre: string;
  cargo: string;
  rol: UserRole;
  telefono: string;
  fechaIngreso: string;
  documento: string;
}

export interface MarcacionRecord {
  id: string;
  colaboradorId: string;
  colaboradorNombre: string;
  servicioId?: string;
  sitio: string;
  tipo: 'entrada' | 'salida';
  fechaHora: string;
  lat: number;
  lng: number;
  precisionMetros: number;
  distanciaMetros: number;
  observacion?: string;
}

export type ServiceStatus = 'programado' | 'en_sitio' | 'completado' | 'novedad';

export interface ReporteTecnico {
  actividadesRealizadas: string;
  materialesUsados: string;
  recibeCliente: string;
  observaciones: string;
  fechaCierre: string;
}

export interface ServicioProgramado {
  id: string;
  fecha: string;
  hora: string;
  cliente: string;
  direccion: string;
  lat: number;
  lng: number;
  radioMetros: number;
  tipoServicio: string;
  asignadoAId: string;
  asignadoANombre: string;
  estado: ServiceStatus;
  prioridad: 'normal' | 'alta';
  reporte?: ReporteTecnico;
}

export type DocCategoria = 'contrato' | 'otrosi_auxilio' | 'acta_vehiculo' | 'dotacion' | 'curso';

export interface DocumentoExpediente {
  id: string;
  colaboradorId: string;
  categoria: DocCategoria;
  titulo: string;
  detalle: string;
  fechaEmision: string;
  fechaVencimiento?: string;
  valorMensual?: number;
  estado: 'vigente' | 'por_vencer' | 'entregado';
}

export interface SolicitudExpediente {
  id: string;
  colaboradorId: string;
  colaboradorNombre: string;
  tipo: 'permiso' | 'prestamo';
  fechaSolicitud: string;
  fechaObjetivo: string;
  motivo: string;
  monto?: number;
  cuotas?: number;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
}

export type EtapaOnboarding = 'induccion' | 'dia_30' | 'dia_60' | 'dia_90';

export interface ItemChecklistOnboarding {
  id: string;
  etapa: EtapaOnboarding;
  titulo: string;
  responsable: string;
  completado: boolean;
  fechaCompletado?: string;
}

export interface ProcesoOnboarding {
  id: string;
  colaboradorId: string;
  colaboradorNombre: string;
  cargo: string;
  mentor: string;
  fechaInicio: string;
  items: ItemChecklistOnboarding[];
  firmaMentor?: string;
  firmaColaborador?: string;
  fechaFirma?: string;
  observacionesRevision?: string;
}

export interface AcuerdoMejora {
  id: string;
  colaboradorId: string;
  colaboradorNombre: string;
  periodo: string;
  fechaConversacion: string;
  fortalezas: string;
  oportunidades: string;
  compromiso: string;
  fechaLimite: string;
  estado: 'en_curso' | 'cumplido';
  notaSeguimiento?: string;
}

export interface VotoReconocimiento {
  id: string;
  colaboradorId: string;
  colaboradorNombre: string;
  motivo: string;
  fecha: string;
}

export interface RespuestaPulso {
  id: string;
  trimestre: string;
  fecha: string;
  respuestas: [number, number, number, number, number];
}

export interface SugerenciaAnonima {
  id: string;
  categoria: 'Operación' | 'Seguridad' | 'Bienestar' | 'Herramientas';
  mensaje: string;
  fecha: string;
}

export interface AlfaConectaState {
  colaboradores: Colaborador[];
  marcaciones: MarcacionRecord[];
  servicios: ServicioProgramado[];
  documentos: DocumentoExpediente[];
  solicitudes: SolicitudExpediente[];
  onboardings: ProcesoOnboarding[];
  acuerdos: AcuerdoMejora[];
  votosReconocimiento: VotoReconocimiento[];
  pulsos: RespuestaPulso[];
  sugerencias: SugerenciaAnonima[];
}
