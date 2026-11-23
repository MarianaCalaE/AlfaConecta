import React, { useState } from 'react';
import { Award, CheckCircle2, MessageSquarePlus, ThumbsUp } from 'lucide-react';
import type { AcuerdoMejora, AlfaConectaState, UserRole, VotoReconocimiento } from '../types';
import { createId, formatDateShort } from '../utils/format';

interface DesempenoModuleProps {
  state: AlfaConectaState;
  role: UserRole;
  onAddAcuerdo: (acuerdo: AcuerdoMejora) => void;
  onToggleAcuerdoEstado: (id: string) => void;
  onAddVoto: (voto: VotoReconocimiento) => void;
}

export const DesempenoModule: React.FC<DesempenoModuleProps> = ({
  state,
  role,
  onAddAcuerdo,
  onToggleAcuerdoEstado,
  onAddVoto,
}) => {
  const isTecnico = role === 'tecnico';
  const [tab, setTab] = useState<'conversaciones' | 'reconocimiento'>(
    isTecnico ? 'reconocimiento' : 'conversaciones'
  );
  const [showAcuerdoForm, setShowAcuerdoForm] = useState(false);

  const tecnicos = state.colaboradores.filter((c) => c.rol === 'tecnico');
  const [colId, setColId] = useState(tecnicos[0]?.id ?? 'col-1');
  const [fortalezas, setFortalezas] = useState('');
  const [oportunidades, setOportunidades] = useState('');
  const [compromiso, setCompromiso] = useState('');
  const [fechaLimite, setFechaLimite] = useState('2026-12-20');

  const [votoColId, setVotoColId] = useState(tecnicos[0]?.id ?? 'col-1');
  const [votoMotivo, setVotoMotivo] = useState('');
  const [votoEnviado, setVotoEnviado] = useState(false);

  const handleCreateAcuerdo = (e: React.FormEvent) => {
    e.preventDefault();
    const col = state.colaboradores.find((c) => c.id === colId);
    if (!col || !fortalezas.trim() || !compromiso.trim()) return;
    onAddAcuerdo({
      id: createId('acu'),
      colaboradorId: col.id,
      colaboradorNombre: col.nombre,
      periodo: '2026-S2',
      fechaConversacion: new Date().toISOString().slice(0, 10),
      fortalezas: fortalezas.trim(),
      oportunidades: oportunidades.trim() || 'Mantener estándares operativos.',
      compromiso: compromiso.trim(),
      fechaLimite,
      estado: 'en_curso',
    });
    setFortalezas('');
    setOportunidades('');
    setCompromiso('');
    setShowAcuerdoForm(false);
  };

  const handleVotar = (e: React.FormEvent) => {
    e.preventDefault();
    const col = tecnicos.find((t) => t.id === votoColId);
    if (!votoMotivo.trim() || !col) return;
    onAddVoto({
      id: createId('voto'),
      colaboradorId: col.id,
      colaboradorNombre: col.nombre,
      motivo: votoMotivo.trim(),
      fecha: new Date().toISOString().slice(0, 10),
    });
    setVotoMotivo('');
    setVotoEnviado(true);
  };

  const rankingTecnicos = tecnicos
    .map((t) => {
      const votos = state.votosReconocimiento.filter((v) => v.colaboradorId === t.id);
      return { tecnico: t, count: votos.length, motivos: votos.map((v) => v.motivo) };
    })
    .sort((a, b) => b.count - a.count);

  const totalVotos = state.votosReconocimiento.length;
  const effectiveTab = isTecnico ? 'reconocimiento' : tab;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#D6E2DB] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F3EC] text-[#116D36] shrink-0">
            <Award className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
            {isTecnico ? 'Reconocimientos' : 'Desempeño y reconocimiento'}
          </h2>
        </div>

        {!isTecnico && (
          <div className="flex items-center gap-1 rounded-xl bg-[#E8F3EC] p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setTab('conversaciones')}
              className={`min-h-[40px] rounded-lg px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap ${
                effectiveTab === 'conversaciones' ? 'bg-[#116D36] text-white' : 'text-[#0B4D25] hover:bg-white'
              }`}
            >
              Conversación semestral
            </button>
            <button
              type="button"
              onClick={() => setTab('reconocimiento')}
              className={`min-h-[40px] rounded-lg px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap ${
                effectiveTab === 'reconocimiento' ? 'bg-[#116D36] text-white' : 'text-[#0B4D25] hover:bg-white'
              }`}
            >
              Reconocimientos
            </button>
          </div>
        )}
      </div>

      {effectiveTab === 'conversaciones' && !isTecnico ? (
        <div className="space-y-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowAcuerdoForm((p) => !p)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#116D36] px-4 py-2 text-xs font-bold text-white hover:bg-[#0B4D25] whitespace-nowrap"
            >
              <MessageSquarePlus className="h-5 w-5" strokeWidth={2.2} />
              <span>{showAcuerdoForm ? 'Cerrar registro' : 'Registrar conversación'}</span>
            </button>
          </div>

          {showAcuerdoForm && (
            <form onSubmit={handleCreateAcuerdo} className="rounded-2xl border border-[#D6E2DB] bg-white p-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#111827]">Colaborador</label>
                  <select
                    value={colId}
                    onChange={(e) => setColId(e.target.value)}
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  >
                    {tecnicos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111827]">Fecha límite</label>
                  <input
                    type="date"
                    required
                    value={fechaLimite}
                    onChange={(e) => setFechaLimite(e.target.value)}
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111827]">Fortalezas</label>
                  <textarea
                    required
                    rows={2}
                    value={fortalezas}
                    onChange={(e) => setFortalezas(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111827]">Oportunidades de mejora</label>
                  <textarea
                    rows={2}
                    value={oportunidades}
                    onChange={(e) => setOportunidades(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#111827]">Acuerdo de mejora</label>
                  <input
                    type="text"
                    required
                    value={compromiso}
                    onChange={(e) => setCompromiso(e.target.value)}
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAcuerdoForm(false)}
                  className="min-h-[40px] rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-[#111827]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] rounded-xl bg-[#116D36] px-4 text-xs font-bold text-white"
                >
                  Guardar acuerdo
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {state.acuerdos.map((a) => (
              <article key={a.id} className="rounded-2xl border border-[#D6E2DB] bg-white p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-bold text-[#116D36]">{a.periodo}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{formatDateShort(a.fechaConversacion)}</span>
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-[#111827]">{a.colaboradorNombre}</h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleAcuerdoEstado(a.id)}
                    className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                      a.estado === 'cumplido'
                        ? 'border-[#116D36] bg-[#E8F3EC] text-[#0B4D25]'
                        : 'border-slate-300 bg-white text-[#111827]'
                    }`}
                  >
                    <CheckCircle2
                      className={`h-4 w-4 ${a.estado === 'cumplido' ? 'text-[#116D36]' : 'text-slate-400'}`}
                      strokeWidth={2.2}
                    />
                    <span>{a.estado === 'cumplido' ? 'Cumplido' : 'En curso'}</span>
                  </button>
                </div>

                <div className="space-y-2 text-sm text-slate-700 border-t border-slate-100 pt-3">
                  <p>
                    <strong className="text-[#111827]">Fortalezas:</strong> {a.fortalezas}
                  </p>
                  <p>
                    <strong className="text-[#111827]">Por mejorar:</strong> {a.oportunidades}
                  </p>
                  <p className="rounded-xl bg-[#F4F7F5] border border-[#D6E2DB] p-3 text-sm text-[#0B4D25]">
                    <strong>Acuerdo ({formatDateShort(a.fechaLimite)}):</strong> {a.compromiso}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          <form onSubmit={handleVotar} className="lg:col-span-5 rounded-2xl border border-[#D6E2DB] bg-white p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F3EC] text-[#116D36]">
                <Award className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <h3 className="text-base font-bold text-[#111827]">Votar por «Técnico del mes»</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827]">Técnico</label>
              <select
                value={votoColId}
                onChange={(e) => setVotoColId(e.target.value)}
                className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm"
              >
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827]">Motivo</label>
              <textarea
                required
                rows={3}
                value={votoMotivo}
                onChange={(e) => setVotoMotivo(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm"
              />
            </div>

            <button
              type="submit"
              className="inline-flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#116D36] py-2.5 text-sm font-bold text-white hover:bg-[#0B4D25]"
            >
              <ThumbsUp className="h-5 w-5" strokeWidth={2.2} />
              <span>Enviar voto</span>
            </button>

            {votoEnviado && (
              <p role="status" className="rounded-xl bg-[#E8F3EC] border border-[#116D36] px-3 py-2 text-xs font-semibold text-[#0B4D25]">
                Voto registrado.
              </p>
            )}
          </form>

          <section className="lg:col-span-7 rounded-2xl border border-[#D6E2DB] bg-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#111827]">Reconocimientos del mes</h3>
              <span className="text-xs font-mono font-bold tabular-nums text-[#116D36]">{totalVotos} votos</span>
            </div>

            <div className="space-y-4">
              {rankingTecnicos.map(({ tecnico, count, motivos }, idx) => {
                const pct = totalVotos > 0 ? Math.round((count / totalVotos) * 100) : 0;
                return (
                  <div key={tecnico.id} className="space-y-2 border-b border-slate-100 pb-4 last:border-none last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-[#111827]">
                        {idx + 1}.° {tecnico.nombre}
                      </p>
                      <span className="text-sm font-bold font-mono tabular-nums text-[#116D36]">
                        {count} votos ({pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E8F3EC]">
                      <div className="h-full bg-[#116D36]" style={{ width: `${pct}%` }} />
                    </div>
                    {motivos.length > 0 && (
                      <ul className="space-y-1 text-xs text-slate-600">
                        {motivos.slice(0, 2).map((m, i) => (
                          <li key={i}>“{m}”</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
