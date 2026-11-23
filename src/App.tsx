import React, { useState } from 'react';
import {
  MapPin,
  CalendarDays,
  FolderOpen,
  ClipboardList,
  Award,
  HeartHandshake,
  LayoutDashboard,
  Grid2x2,
  LogOut,
  X,
} from 'lucide-react';
import { INITIAL_ALFA_STATE } from './data/seedData';
import type {
  AcuerdoMejora,
  AlfaConectaState,
  AuthUser,
  DocumentoExpediente,
  ModuleId,
  ProcesoOnboarding,
  ReporteTecnico,
  RespuestaPulso,
  ServiceStatus,
  ServicioProgramado,
  SolicitudExpediente,
  SugerenciaAnonima,
  UserRole,
  VotoReconocimiento,
} from './types';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AuthScreen } from './components/AuthScreen';
import { MarcacionModule } from './modules/MarcacionModule';
import { CalendarioModule } from './modules/CalendarioModule';
import { ExpedienteModule } from './modules/ExpedienteModule';
import { OnboardingModule } from './modules/OnboardingModule';
import { DesempenoModule } from './modules/DesempenoModule';
import { PulsoModule } from './modules/PulsoModule';
import { TableroGerencialModule } from './modules/TableroGerencialModule';

const LOCAL_CACHE_KEY = 'alfaconecta_state_v3';

interface ModuleMeta {
  id: ModuleId;
  titulo: string;
  tituloTecnico?: string;
  corto: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const MODULES: ModuleMeta[] = [
  { id: 'marcacion', titulo: 'Marcación en sitio', corto: 'Marcación', icon: MapPin },
  { id: 'calendario', titulo: 'Calendario de trabajos', corto: 'Calendario', icon: CalendarDays },
  { id: 'expediente', titulo: 'Mi expediente', corto: 'Expediente', icon: FolderOpen },
  { id: 'onboarding', titulo: 'Onboarding 30-60-90', corto: 'Onboarding', icon: ClipboardList },
  {
    id: 'desempeno',
    titulo: 'Desempeño y reconocimiento',
    tituloTecnico: 'Reconocimientos',
    corto: 'Reconocim.',
    icon: Award,
  },
  { id: 'pulso', titulo: 'Pulso anónimo', corto: 'Pulso', icon: HeartHandshake },
  { id: 'tablero', titulo: 'Tablero gerencial', corto: 'Tablero', icon: LayoutDashboard },
];

const ROLE_DEFAULT_MODULE: Record<UserRole, ModuleId> = {
  tecnico: 'calendario',
  administrador: 'calendario',
  gerente: 'tablero',
};

const ROLE_LABEL: Record<UserRole, string> = {
  tecnico: 'Técnico',
  administrador: 'Administrador',
  gerente: 'Gerente',
};

export default function App() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleId>('calendario');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const [state, setState] = useState<AlfaConectaState>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_CACHE_KEY);
      if (cached) return JSON.parse(cached) as AlfaConectaState;
    } catch {
      // ignore storage errors
    }
    return INITIAL_ALFA_STATE;
  });

  const handleAuthenticated = async (token: string, user: AuthUser) => {
    setAuthToken(token);
    setCurrentUser(user);
    setActiveModule(ROLE_DEFAULT_MODULE[user.role]);

    try {
      const res = await fetch('/api/state', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const remote = (await res.json()) as AlfaConectaState;
        if (remote && Array.isArray(remote.colaboradores)) {
          setState(remote);
          localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(remote));
        }
      }
    } catch {
      // keep cached state if offline
    }
  };

  const handleLogout = async () => {
    if (authToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      }).catch(() => {});
    }
    setAuthToken(null);
    setCurrentUser(null);
    setMobileSheetOpen(false);
  };

  const updateAndPersist = (updater: (prev: AlfaConectaState) => AlfaConectaState) => {
    setState((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      if (authToken) {
        fetch('/api/state', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(next),
        }).catch(() => {
          // Offline fallback
        });
      }
      return next;
    });
  };

  const handleSelectModule = (id: ModuleId) => {
    setActiveModule(id);
    setMobileSheetOpen(false);
  };

  if (!authToken || !currentUser) {
    return (
      <>
        <AuthScreen onAuthenticated={handleAuthenticated} />
        <OfflineIndicator />
      </>
    );
  }

  const isTecnico = currentUser.role === 'tecnico';
  const visibleModules = MODULES.filter((m) => (isTecnico ? m.id !== 'tablero' : true));

  const getModuleTitle = (mod: ModuleMeta) =>
    isTecnico && mod.tituloTecnico ? mod.tituloTecnico : mod.titulo;

  const handleMarcacionSuccess = (nextState: AlfaConectaState) => {
    setState(nextState);
    try {
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(nextState));
    } catch {
      // ignore
    }
  };

  const handleAddServicio = (servicio: ServicioProgramado) => {
    updateAndPersist((prev) => ({ ...prev, servicios: [servicio, ...prev.servicios] }));
  };

  const handleUpdateServicioEstado = (id: string, estado: ServiceStatus) => {
    updateAndPersist((prev) => ({
      ...prev,
      servicios: prev.servicios.map((s) => (s.id === id ? { ...s, estado } : s)),
    }));
  };

  const handleSaveReporte = (id: string, reporte: ReporteTecnico) => {
    updateAndPersist((prev) => ({
      ...prev,
      servicios: prev.servicios.map((s) =>
        s.id === id ? { ...s, estado: 'completado', reporte } : s
      ),
    }));
  };

  const handleAddDocumento = (doc: DocumentoExpediente) => {
    updateAndPersist((prev) => ({ ...prev, documentos: [doc, ...prev.documentos] }));
  };

  const handleAddSolicitud = (sol: SolicitudExpediente) => {
    updateAndPersist((prev) => ({ ...prev, solicitudes: [sol, ...prev.solicitudes] }));
  };

  const handleUpdateSolicitudEstado = (id: string, estado: 'aprobada' | 'rechazada') => {
    updateAndPersist((prev) => ({
      ...prev,
      solicitudes: prev.solicitudes.map((s) => (s.id === id ? { ...s, estado } : s)),
    }));
  };

  const handleToggleOnboardingItem = (procesoId: string, itemId: string) => {
    updateAndPersist((prev) => ({
      ...prev,
      onboardings: prev.onboardings.map((p) => {
        if (p.id !== procesoId) return p;
        return {
          ...p,
          items: p.items.map((it) =>
            it.id === itemId
              ? {
                  ...it,
                  completado: !it.completado,
                  fechaCompletado: !it.completado ? new Date().toISOString().slice(0, 10) : undefined,
                }
              : it
          ),
        };
      }),
    }));
  };

  const handleSaveSignature = (procesoId: string, signer: 'mentor' | 'colaborador', dataUrl: string) => {
    updateAndPersist((prev) => ({
      ...prev,
      onboardings: prev.onboardings.map((p) =>
        p.id === procesoId
          ? {
              ...p,
              firmaMentor: signer === 'mentor' ? dataUrl : p.firmaMentor,
              firmaColaborador: signer === 'colaborador' ? dataUrl : p.firmaColaborador,
              fechaFirma: new Date().toISOString().slice(0, 10),
            }
          : p
      ),
    }));
  };

  const handleUpdateOnboardingObs = (procesoId: string, observaciones: string) => {
    updateAndPersist((prev) => ({
      ...prev,
      onboardings: prev.onboardings.map((p) =>
        p.id === procesoId ? { ...p, observacionesRevision: observaciones } : p
      ),
    }));
  };

  const handleAddOnboarding = (proceso: ProcesoOnboarding) => {
    updateAndPersist((prev) => ({ ...prev, onboardings: [proceso, ...prev.onboardings] }));
  };

  const handleAddAcuerdo = (acuerdo: AcuerdoMejora) => {
    updateAndPersist((prev) => ({ ...prev, acuerdos: [acuerdo, ...prev.acuerdos] }));
  };

  const handleToggleAcuerdoEstado = (id: string) => {
    updateAndPersist((prev) => ({
      ...prev,
      acuerdos: prev.acuerdos.map((a) =>
        a.id === id ? { ...a, estado: a.estado === 'cumplido' ? 'en_curso' : 'cumplido' } : a
      ),
    }));
  };

  const handleAddVoto = (voto: VotoReconocimiento) => {
    updateAndPersist((prev) => ({
      ...prev,
      votosReconocimiento: [...prev.votosReconocimiento, voto],
    }));
  };

  const handleAddPulso = (pulso: RespuestaPulso) => {
    updateAndPersist((prev) => ({ ...prev, pulsos: [...prev.pulsos, pulso] }));
  };

  const handleAddSugerencia = (sug: SugerenciaAnonima) => {
    updateAndPersist((prev) => ({ ...prev, sugerencias: [sug, ...prev.sugerencias] }));
  };

  const currentModuleMeta = visibleModules.find((m) => m.id === activeModule) ?? visibleModules[0];

  const primaryBottomTabs: ModuleMeta[] = [
    MODULES[0], // Marcación
    MODULES[1], // Calendario
    MODULES[2], // Expediente
    MODULES[5], // Pulso
  ];

  return (
    <div className="min-h-screen bg-[#F4F7F5] text-[#111827] flex flex-col lg:flex-row">
      {/* Barra lateral escritorio (>= lg) */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 bg-white text-[#111827] border-r border-[#D6E2DB]">
        <div className="flex h-20 items-center justify-between gap-2 px-5 border-b border-[#D6E2DB] bg-white">
          <img
            src="/assets/aistudio/image_6b9d486c.png"
            alt="Servicios Alfa SAS"
            className="h-11 w-auto object-contain"
          />
          <span className="text-xs font-extrabold tracking-tight text-[#116D36]">AlfaConecta</span>
        </div>

        {/* Cuenta activa */}
        <div className="px-5 py-4 border-b border-[#D6E2DB] bg-[#E8F3EC]">
          <p className="text-xs font-bold text-[#116D36]">{ROLE_LABEL[currentUser.role]}</p>
          <p className="mt-0.5 text-sm font-extrabold text-[#111827] truncate">{currentUser.nombre}</p>
        </div>

        {/* Navegación con íconos visibles y colores planos */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5" aria-label="Módulos">
          {visibleModules.map((mod) => {
            const Icon = mod.icon;
            const isActive = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => handleSelectModule(mod.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  isActive
                    ? 'bg-[#116D36] text-white font-bold'
                    : 'text-[#111827] hover:bg-[#F4F7F5] font-semibold'
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                    isActive ? 'bg-[#0B4D25] text-white' : 'bg-[#E8F3EC] text-[#116D36]'
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <span className="truncate">{getModuleTitle(mod)}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[#D6E2DB] p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#111827] px-3 text-xs font-bold text-white hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" strokeWidth={2.2} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Columna principal */}
      <div className="flex-1 flex flex-col lg:pl-72 min-w-0">
        {/* Header móvil (< lg, 56px) */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-[#D6E2DB] bg-white px-4 text-[#111827] lg:hidden">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/assets/aistudio/image_6b9d486c.png"
              alt="Servicios Alfa SAS"
              className="h-8 w-auto object-contain shrink-0"
            />
            <div className="min-w-0 border-l border-[#D6E2DB] pl-2.5">
              <p className="text-xs font-bold leading-tight truncate text-[#111827]">{currentUser.nombre}</p>
              <p className="text-[10px] font-bold text-[#116D36] leading-tight">{ROLE_LABEL[currentUser.role]}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111827] text-white"
            >
              <LogOut className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>
        </header>

        {/* Header escritorio (>= lg, 64px) */}
        <header className="hidden lg:flex sticky top-0 z-30 h-16 items-center justify-between gap-8 border-b border-[#D6E2DB] bg-white px-8">
          <div className="flex items-center gap-3 text-sm min-w-0">
            <span className="font-bold text-[#116D36] whitespace-nowrap">Servicios Alfa SAS</span>
            <span className="text-slate-300" aria-hidden="true">/</span>
            <span className="font-bold text-[#111827] truncate">{getModuleTitle(currentModuleMeta)}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <PWAInstallButton />
          </div>
        </header>

        {/* Contenido principal */}
        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-10 max-w-7xl w-full mx-auto">
          {activeModule === 'marcacion' && (
            <MarcacionModule
              state={state}
              currentUser={currentUser}
              authToken={authToken}
              onMarcacionSuccess={handleMarcacionSuccess}
            />
          )}
          {activeModule === 'calendario' && (
            <CalendarioModule
              state={state}
              currentUser={currentUser}
              onAddServicio={handleAddServicio}
              onUpdateEstado={handleUpdateServicioEstado}
              onSaveReporte={handleSaveReporte}
            />
          )}
          {activeModule === 'expediente' && (
            <ExpedienteModule
              state={state}
              currentUser={currentUser}
              onAddDocumento={handleAddDocumento}
              onAddSolicitud={handleAddSolicitud}
              onUpdateSolicitudEstado={handleUpdateSolicitudEstado}
            />
          )}
          {activeModule === 'onboarding' && (
            <OnboardingModule
              state={state}
              currentUser={currentUser}
              onToggleItem={handleToggleOnboardingItem}
              onSaveSignature={handleSaveSignature}
              onUpdateObs={handleUpdateOnboardingObs}
              onAddOnboarding={handleAddOnboarding}
            />
          )}
          {activeModule === 'desempeno' && (
            <DesempenoModule
              state={state}
              role={currentUser.role}
              onAddAcuerdo={handleAddAcuerdo}
              onToggleAcuerdoEstado={handleToggleAcuerdoEstado}
              onAddVoto={handleAddVoto}
            />
          )}
          {activeModule === 'pulso' && (
            <PulsoModule
              state={state}
              onAddPulso={handleAddPulso}
              onAddSugerencia={handleAddSugerencia}
            />
          )}
          {activeModule === 'tablero' && (
            <TableroGerencialModule
              state={state}
              onNavigate={handleSelectModule}
            />
          )}
        </main>
      </div>

      {/* Barra inferior móvil (64px) con colores planos e íconos visibles */}
      <nav
        aria-label="Navegación rápida móvil"
        className="fixed bottom-0 left-0 right-0 z-40 grid h-16 grid-cols-5 items-center border-t-2 border-[#D6E2DB] bg-white pb-safe lg:hidden"
      >
        {primaryBottomTabs.map((mod) => {
          const Icon = mod.icon;
          const isActive = activeModule === mod.id;
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => handleSelectModule(mod.id)}
              className={`flex h-full flex-col items-center justify-center gap-0.5 px-1 transition-colors ${
                isActive ? 'bg-[#E8F3EC] text-[#116D36]' : 'text-[#111827] hover:bg-[#F4F7F5]'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2.1} />
              <span className={`text-[10px] tracking-tight whitespace-nowrap ${isActive ? 'font-extrabold' : 'font-semibold'}`}>
                {mod.corto}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setMobileSheetOpen(true)}
          className={`flex h-full flex-col items-center justify-center gap-0.5 px-1 transition-colors ${
            !primaryBottomTabs.some((m) => m.id === activeModule)
              ? 'bg-[#E8F3EC] text-[#116D36]'
              : 'text-[#111827] hover:bg-[#F4F7F5]'
          }`}
        >
          <Grid2x2 className="h-5 w-5" strokeWidth={2.2} />
          <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap">Módulos</span>
        </button>
      </nav>

      {/* Bottom Sheet de módulos en móvil */}
      {mobileSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-[#111827]/70 lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full rounded-t-3xl border-t-2 border-[#116D36] bg-white p-5 pb-8 max-h-[82vh] overflow-y-auto">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#111827]">Módulos</h3>
              <button
                type="button"
                onClick={() => setMobileSheetOpen(false)}
                aria-label="Cerrar menú"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4F7F5] text-[#111827]"
              >
                <X className="h-5 w-5" strokeWidth={2.2} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              {visibleModules.map((mod) => {
                const Icon = mod.icon;
                const isActive = activeModule === mod.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => handleSelectModule(mod.id)}
                    className={`flex min-h-[54px] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                      isActive
                        ? 'border-[#116D36] bg-[#116D36] text-white'
                        : 'border-[#D6E2DB] bg-white text-[#111827] hover:bg-[#F4F7F5]'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                        isActive ? 'bg-[#0B4D25] text-white' : 'bg-[#E8F3EC] text-[#116D36]'
                      }`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </span>
                    <span className="text-sm font-bold truncate">{getModuleTitle(mod)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <OfflineIndicator />
    </div>
  );
}
