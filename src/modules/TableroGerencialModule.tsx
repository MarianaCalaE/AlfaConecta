import React from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, TrendingUp, LayoutDashboard } from 'lucide-react';
import type { AlfaConectaState, ModuleId } from '../types';

interface TableroGerencialModuleProps {
  state: AlfaConectaState;
  onNavigate: (module: ModuleId) => void;
}

export const TableroGerencialModule: React.FC<TableroGerencialModuleProps> = ({
  state,
  onNavigate,
}) => {
  const tecnicos = state.colaboradores.filter((c) => c.rol === 'tecnico');
  const totalServicios = state.servicios.length;
  const totalItemsOnb = state.onboardings.reduce((acc, o) => acc + o.items.length, 0);
  const completedItemsOnb = state.onboardings.reduce(
    (acc, o) => acc + o.items.filter((i) => i.completado).length,
    0
  );
  const pctOnboarding = totalItemsOnb > 0 ? Math.round((completedItemsOnb / totalItemsOnb) * 100) : 100;

  const serviciosCompletados = state.servicios.filter((s) => s.estado === 'completado').length;
  const serviciosConReporte = state.servicios.filter((s) => Boolean(s.reporte)).length;
  const pctServiciosCompletados =
    totalServicios > 0 ? Math.round((serviciosCompletados / totalServicios) * 100) : 0;

  const pulsoGlobal =
    state.pulsos.length > 0
      ? Number(
          (
            state.pulsos.reduce(
              (acc, p) => acc + p.respuestas.reduce((a, b) => a + b, 0) / 5,
              0
            ) / state.pulsos.length
          ).toFixed(1)
        )
      : 0;
  const acuerdosCumplidos = state.acuerdos.filter((a) => a.estado === 'cumplido').length;

  const docsPorVencer = state.documentos.filter((d) => d.estado === 'por_vencer');
  const solicitudesPendientes = state.solicitudes.filter((s) => s.estado === 'pendiente');

  const liderMes = tecnicos
    .map((t) => ({
      nombre: t.nombre,
      votos: state.votosReconocimiento.filter((v) => v.colaboradorId === t.id).length,
    }))
    .sort((a, b) => b.votos - a.votos)[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#D6E2DB] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F3EC] text-[#116D36] shrink-0">
            <LayoutDashboard className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
            Tablero gerencial
          </h2>
        </div>

        <span className="text-xs font-mono font-bold tabular-nums text-[#116D36]">
          {tecnicos.length} técnicos · {totalServicios} trabajos
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-[#D6E2DB] bg-white p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-[#116D36]">01. Planear</p>
            <h3 className="mt-1 text-sm font-semibold text-slate-600">Onboarding 30-60-90</h3>
            <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-[#111827]">
              {pctOnboarding}%
            </p>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
            <span className="text-slate-600">Agenda: {totalServicios} trabajos</span>
            <button
              type="button"
              onClick={() => onNavigate('onboarding')}
              className="font-bold text-[#116D36] hover:underline"
            >
              Ver
            </button>
          </div>
        </article>

        <article className="rounded-2xl border border-[#D6E2DB] bg-white p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-[#116D36]">02. Hacer</p>
            <h3 className="mt-1 text-sm font-semibold text-slate-600">Trabajos completados</h3>
            <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-[#111827]">
              {serviciosCompletados}/{totalServicios}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {pctServiciosCompletados}% · {serviciosConReporte} con reporte
            </p>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
            <span className="text-slate-600">Marcaciones: {state.marcaciones.length}</span>
            <button
              type="button"
              onClick={() => onNavigate('calendario')}
              className="font-bold text-[#116D36] hover:underline"
            >
              Ver
            </button>
          </div>
        </article>

        <article className="rounded-2xl border border-[#D6E2DB] bg-white p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-[#116D36]">03. Verificar</p>
            <h3 className="mt-1 text-sm font-semibold text-slate-600">Pulso laboral</h3>
            <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-[#111827]">
              {pulsoGlobal} <span className="text-base font-normal text-slate-500">/ 5.0</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Acuerdos cumplidos: {acuerdosCumplidos}/{state.acuerdos.length}
            </p>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
            <span className="text-slate-600">Sugerencias: {state.sugerencias.length}</span>
            <button
              type="button"
              onClick={() => onNavigate('pulso')}
              className="font-bold text-[#116D36] hover:underline"
            >
              Ver
            </button>
          </div>
        </article>

        <article className="rounded-2xl border-2 border-[#0B4D25] bg-[#116D36] p-5 text-white flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-[#E8F3EC]">04. Actuar</p>
            <h3 className="mt-1 text-sm font-medium text-[#E8F3EC]">Alertas abiertas</h3>
            <p className="mt-3 text-3xl font-bold font-mono tabular-nums text-white">
              {docsPorVencer.length + solicitudesPendientes.length}
            </p>
            <p className="mt-1 text-xs text-[#E8F3EC]">
              {solicitudesPendientes.length} solicitudes · {docsPorVencer.length} vencimientos
            </p>
          </div>
          <div className="mt-4 border-t border-white/20 pt-3 flex items-center justify-between text-xs">
            <span className="text-[#E8F3EC]">Expedientes</span>
            <button
              type="button"
              onClick={() => onNavigate('expediente')}
              className="font-bold text-white hover:underline"
            >
              Gestionar
            </button>
          </div>
        </article>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        <section className="lg:col-span-7 rounded-2xl border border-[#D6E2DB] bg-white p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#116D36]" strokeWidth={2.2} />
              <h3 className="text-base font-bold text-[#111827]">Avance por técnico</h3>
            </div>
            {liderMes && (
              <span className="text-xs font-bold text-[#116D36]">
                Reconocimiento: {liderMes.nombre} ({liderMes.votos} votos)
              </span>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {tecnicos.map((tec) => {
              const asignados = state.servicios.filter((s) => s.asignadoAId === tec.id);
              const hechos = asignados.filter((s) => s.estado === 'completado').length;
              const pct = asignados.length > 0 ? Math.round((hechos / asignados.length) * 100) : 0;
              return (
                <div key={tec.id} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-[#111827]">{tec.nombre}</span>
                    <span className="font-mono text-xs font-bold tabular-nums text-[#116D36]">
                      {hechos}/{asignados.length} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E8F3EC]">
                    <div className="h-full bg-[#116D36]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-5 rounded-2xl border border-[#D6E2DB] bg-white p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ClipboardCheck className="h-5 w-5 text-[#116D36]" strokeWidth={2.2} />
            <h3 className="text-base font-bold text-[#111827]">Pendientes</h3>
          </div>

          <div className="space-y-3 text-sm">
            {docsPorVencer.map((doc) => (
              <div key={doc.id} className="flex items-start justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3.5">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" strokeWidth={2.2} />
                  <div>
                    <p className="text-xs font-bold text-[#111827]">Por vencer</p>
                    <p className="text-xs text-slate-700">{doc.titulo}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('expediente')}
                  className="text-xs font-bold text-[#116D36] shrink-0 hover:underline"
                >
                  Revisar
                </button>
              </div>
            ))}

            {solicitudesPendientes.map((sol) => (
              <div key={sol.id} className="flex items-start justify-between gap-3 rounded-xl border border-[#D6E2DB] bg-[#F4F7F5] p-3.5">
                <div>
                  <p className="text-xs font-bold text-[#111827]">
                    {sol.tipo === 'permiso' ? 'Permiso' : 'Préstamo'} · {sol.colaboradorNombre}
                  </p>
                  <p className="text-xs text-slate-600">{sol.motivo}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('expediente')}
                  className="text-xs font-bold text-[#116D36] shrink-0 hover:underline"
                >
                  Aprobar
                </button>
              </div>
            ))}

            {docsPorVencer.length === 0 && solicitudesPendientes.length === 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-[#E8F3EC] p-4 text-xs font-semibold text-[#0B4D25]">
                <CheckCircle2 className="h-5 w-5 text-[#116D36]" strokeWidth={2.2} />
                <span>Sin pendientes abiertos.</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
