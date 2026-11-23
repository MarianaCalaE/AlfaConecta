import React, { useState } from 'react';
import { CheckSquare, Square, UserPlus, ClipboardCheck } from 'lucide-react';
import type { AlfaConectaState, AuthUser, EtapaOnboarding, ProcesoOnboarding } from '../types';
import { SignaturePad } from '../components/SignaturePad';
import { createId, formatDateShort } from '../utils/format';

interface OnboardingModuleProps {
  state: AlfaConectaState;
  currentUser: AuthUser;
  onToggleItem: (procesoId: string, itemId: string) => void;
  onSaveSignature: (procesoId: string, role: 'mentor' | 'colaborador', dataUrl: string) => void;
  onUpdateObs: (procesoId: string, observaciones: string) => void;
  onAddOnboarding: (proceso: ProcesoOnboarding) => void;
}

const ETAPA_LABELS: Record<EtapaOnboarding, string> = {
  induccion: 'Inducción inicial (Días 1–7)',
  dia_30: 'Revisión 30 días',
  dia_60: 'Revisión 60 días',
  dia_90: 'Revisión 90 días',
};

export const OnboardingModule: React.FC<OnboardingModuleProps> = ({
  state,
  currentUser,
  onToggleItem,
  onSaveSignature,
  onUpdateObs,
  onAddOnboarding,
}) => {
  const isTecnico = currentUser.role === 'tecnico';

  const visibleOnboardings = isTecnico
    ? state.onboardings.filter(
        (p) =>
          p.colaboradorId === currentUser.id ||
          p.colaboradorNombre.toLowerCase() === currentUser.nombre.toLowerCase()
      )
    : state.onboardings;

  const [selectedId, setSelectedId] = useState<string>(visibleOnboardings[0]?.id ?? '');
  const [showNew, setShowNew] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCargo, setNuevoCargo] = useState('Técnico de Campo');
  const [nuevoMentor, setNuevoMentor] = useState('Carlos Mendoza');

  const proceso = visibleOnboardings.find((p) => p.id === selectedId) ?? visibleOnboardings[0];
  const [obsDraft, setObsDraft] = useState(proceso?.observacionesRevision ?? '');

  const completados = proceso ? proceso.items.filter((i) => i.completado).length : 0;
  const total = proceso ? proceso.items.length : 0;
  const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

  const handleCreateProceso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || isTecnico) return;
    const hoy = new Date().toISOString().slice(0, 10);
    const nuevo: ProcesoOnboarding = {
      id: createId('onb'),
      colaboradorId: createId('col'),
      colaboradorNombre: nuevoNombre.trim(),
      cargo: nuevoCargo.trim(),
      mentor: nuevoMentor.trim(),
      fechaInicio: hoy,
      items: [
        {
          id: createId('item'),
          etapa: 'induccion',
          titulo: 'Socialización de cultura Servicios Alfa y uso de AlfaConecta',
          responsable: 'Administrador',
          completado: false,
        },
        {
          id: createId('item'),
          etapa: 'induccion',
          titulo: 'Entrega de dotación, EPP y firma de otrosí de auxilios',
          responsable: 'Administrador',
          completado: false,
        },
        {
          id: createId('item'),
          etapa: 'dia_30',
          titulo: 'Revisión 30 días: marcación puntual y reporte técnico autónomo',
          responsable: `Mentor (${nuevoMentor.trim()})`,
          completado: false,
        },
        {
          id: createId('item'),
          etapa: 'dia_60',
          titulo: 'Revisión 60 días: autonomía en ruta y cumplimiento de protocolos',
          responsable: `Mentor (${nuevoMentor.trim()})`,
          completado: false,
        },
        {
          id: createId('item'),
          etapa: 'dia_90',
          titulo: 'Revisión 90 días: evaluación integral de cierre de adaptación',
          responsable: 'Gerente y Administrador',
          completado: false,
        },
      ],
    };
    onAddOnboarding(nuevo);
    setSelectedId(nuevo.id);
    setObsDraft('');
    setNuevoNombre('');
    setShowNew(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#D6E2DB] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F3EC] text-[#116D36] shrink-0">
            <ClipboardCheck className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
            Onboarding 30-60-90
          </h2>
        </div>

        {!isTecnico && (
          <button
            type="button"
            onClick={() => setShowNew((p) => !p)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#116D36] px-4 py-2 text-sm font-bold text-white hover:bg-[#0B4D25] whitespace-nowrap shrink-0"
          >
            <UserPlus className="h-5 w-5" strokeWidth={2.2} />
            <span>{showNew ? 'Cerrar formulario' : 'Nuevo ingreso'}</span>
          </button>
        )}
      </div>

      {showNew && !isTecnico && (
        <form onSubmit={handleCreateProceso} className="rounded-2xl border border-[#D6E2DB] bg-white p-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-[#111827]">Nombre del colaborador</label>
              <input
                type="text"
                required
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111827]">Cargo</label>
              <input
                type="text"
                required
                value={nuevoCargo}
                onChange={(e) => setNuevoCargo(e.target.value)}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111827]">Mentor asignado</label>
              <input
                type="text"
                required
                value={nuevoMentor}
                onChange={(e) => setNuevoMentor(e.target.value)}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowNew(false)}
              className="min-h-[40px] rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-[#111827]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-[40px] rounded-xl bg-[#116D36] px-4 text-xs font-bold text-white"
            >
              Crear plan 30-60-90
            </button>
          </div>
        </form>
      )}

      {!isTecnico && visibleOnboardings.length > 1 && (
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-[#E8F3EC] p-1 w-fit">
          {visibleOnboardings.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSelectedId(p.id);
                setObsDraft(p.observacionesRevision ?? '');
              }}
              className={`min-h-[40px] rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                proceso?.id === p.id ? 'bg-[#116D36] text-white' : 'text-[#0B4D25] hover:bg-white'
              }`}
            >
              {p.colaboradorNombre}
            </button>
          ))}
        </div>
      )}

      {!proceso ? (
        <div className="rounded-2xl border border-[#D6E2DB] bg-white p-8 text-center text-sm font-medium text-slate-600">
          No tienes un proceso de onboarding asignado aún.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          <section className="lg:col-span-7 rounded-2xl border border-[#D6E2DB] bg-white p-5 sm:p-6 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#111827]">{proceso.colaboradorNombre}</h3>
                <p className="text-xs text-slate-600">
                  {proceso.cargo} · Mentor: {proceso.mentor} · Inicio: {formatDateShort(proceso.fechaInicio)}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xl font-bold font-mono tabular-nums text-[#116D36]">
                  {completados}/{total} ({porcentaje}%)
                </p>
              </div>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-[#E8F3EC]">
              <div
                className="h-full bg-[#116D36] transition-all duration-300"
                style={{ width: `${porcentaje}%` }}
              />
            </div>

            <div className="space-y-5">
              {(['induccion', 'dia_30', 'dia_60', 'dia_90'] as EtapaOnboarding[]).map((etapa) => {
                const etapaItems = proceso.items.filter((i) => i.etapa === etapa);
                if (etapaItems.length === 0) return null;
                return (
                  <div key={etapa}>
                    <h4 className="text-xs font-bold text-[#116D36] mb-2">{ETAPA_LABELS[etapa]}</h4>
                    <div className="divide-y divide-slate-100 rounded-xl border border-[#D6E2DB]">
                      {etapaItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onToggleItem(proceso.id, item.id)}
                          className="flex w-full min-h-[52px] items-start gap-3 px-4 py-3 text-left hover:bg-[#F4F7F5] transition-colors"
                        >
                          {item.completado ? (
                            <CheckSquare className="mt-0.5 h-5 w-5 shrink-0 text-[#116D36]" strokeWidth={2.4} />
                          ) : (
                            <Square className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" strokeWidth={2.2} />
                          )}
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm font-medium ${
                                item.completado ? 'text-slate-500 line-through' : 'text-[#111827]'
                              }`}
                            >
                              {item.titulo}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {item.responsable}
                              {item.fechaCompletado && ` · ${formatDateShort(item.fechaCompletado)}`}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="lg:col-span-5 rounded-2xl border border-[#D6E2DB] bg-white p-5 sm:p-6 space-y-5">
            <h3 className="text-base font-bold text-[#111827]">Firmas digitales</h3>

            {!isTecnico ? (
              <div>
                <label className="block text-xs font-bold text-[#111827]">Notas de revisión</label>
                <textarea
                  rows={3}
                  value={obsDraft}
                  onChange={(e) => setObsDraft(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm"
                />
                <button
                  type="button"
                  onClick={() => onUpdateObs(proceso.id, obsDraft)}
                  className="mt-2 min-h-[40px] rounded-xl border border-[#116D36] px-3.5 text-xs font-bold text-[#116D36] hover:bg-[#E8F3EC]"
                >
                  Guardar notas
                </button>
              </div>
            ) : (
              proceso.observacionesRevision && (
                <div className="rounded-xl bg-[#F4F7F5] border border-[#D6E2DB] p-3 text-xs text-[#111827]">
                  <p className="font-bold text-[#116D36]">Notas de revisión</p>
                  <p className="mt-1">{proceso.observacionesRevision}</p>
                </div>
              )
            )}

            {!isTecnico && (
              <SignaturePad
                label={`Firma Mentor (${proceso.mentor})`}
                existingSignature={proceso.firmaMentor}
                onSave={(url) => onSaveSignature(proceso.id, 'mentor', url)}
              />
            )}

            <SignaturePad
              label={`Firma Colaborador (${proceso.colaboradorNombre})`}
              existingSignature={proceso.firmaColaborador}
              onSave={(url) => onSaveSignature(proceso.id, 'colaborador', url)}
            />
          </section>
        </div>
      )}
    </div>
  );
};
