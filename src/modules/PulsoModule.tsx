import React, { useState } from 'react';
import { Lock, Send, MessageSquareHeart, HeartHandshake } from 'lucide-react';
import type { AlfaConectaState, RespuestaPulso, SugerenciaAnonima } from '../types';
import { createId, formatDateShort } from '../utils/format';

interface PulsoModuleProps {
  state: AlfaConectaState;
  onAddPulso: (pulso: RespuestaPulso) => void;
  onAddSugerencia: (sug: SugerenciaAnonima) => void;
}

const PREGUNTAS_PULSO = [
  '1. Recibo mi programación diaria con claridad y tiempo suficiente.',
  '2. Cuento con las herramientas, EPP y dotación adecuados para trabajar seguro.',
  '3. La carga de servicios y los tiempos de desplazamiento son razonables.',
  '4. Siento respaldo administrativo y de gerencia cuando surge un imprevisto.',
  '5. En general, me siento bien y motivado trabajando en Servicios Alfa.',
];

export const PulsoModule: React.FC<PulsoModuleProps> = ({
  state,
  onAddPulso,
  onAddSugerencia,
}) => {
  const [scores, setScores] = useState<[number, number, number, number, number]>([4, 4, 4, 4, 4]);
  const [pulsoEnviado, setPulsoEnviado] = useState(false);

  const [categoria, setCategoria] = useState<SugerenciaAnonima['categoria']>('Operación');
  const [mensaje, setMensaje] = useState('');
  const [sugEnviada, setSugEnviada] = useState(false);

  const updateScore = (idx: number, val: number) => {
    const next = [...scores] as [number, number, number, number, number];
    next[idx] = val;
    setScores(next);
  };

  const handleSubmitPulso = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPulso({
      id: createId('pul'),
      trimestre: '2026-Q4',
      fecha: new Date().toISOString().slice(0, 10),
      respuestas: scores,
    });
    setPulsoEnviado(true);
  };

  const handleSubmitSugerencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensaje.trim()) return;
    onAddSugerencia({
      id: createId('sug'),
      categoria,
      mensaje: mensaje.trim(),
      fecha: new Date().toISOString().slice(0, 10),
    });
    setMensaje('');
    setSugEnviada(true);
  };

  const promedios = PREGUNTAS_PULSO.map((_, idx) => {
    if (state.pulsos.length === 0) return 0;
    const sum = state.pulsos.reduce((acc, p) => acc + p.respuestas[idx], 0);
    return Number((sum / state.pulsos.length).toFixed(1));
  });

  const promedioGlobal =
    promedios.length > 0
      ? Number((promedios.reduce((a, b) => a + b, 0) / promedios.length).toFixed(1))
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#D6E2DB] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F3EC] text-[#116D36] shrink-0">
            <HeartHandshake className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#111827]">Pulso anónimo</h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-[#116D36]">
          <Lock className="h-4 w-4" strokeWidth={2.2} />
          <span>100% anónimo</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        <form onSubmit={handleSubmitPulso} className="lg:col-span-7 rounded-2xl border border-[#D6E2DB] bg-white p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#111827]">Encuesta trimestral · 2026-Q4</h3>
            <span className="text-xs font-semibold text-slate-500">1 a 5</span>
          </div>

          <div className="space-y-5">
            {PREGUNTAS_PULSO.map((pregunta, idx) => (
              <div key={idx} className="space-y-2 border-b border-slate-100 pb-4 last:border-none last:pb-0">
                <p className="text-sm font-medium text-[#111827]">{pregunta}</p>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => updateScore(idx, val)}
                      className={`min-h-[44px] rounded-xl border text-sm font-bold font-mono transition-colors ${
                        scores[idx] === val
                          ? 'border-[#116D36] bg-[#116D36] text-white'
                          : 'border-slate-200 bg-[#F4F7F5] text-[#111827] hover:bg-[#E8F3EC]'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] rounded-xl bg-[#116D36] py-3 text-sm font-bold text-white hover:bg-[#0B4D25]"
          >
            Enviar respuesta
          </button>

          {pulsoEnviado && (
            <p role="status" className="rounded-xl bg-[#E8F3EC] border border-[#116D36] px-4 py-2.5 text-xs font-semibold text-[#0B4D25]">
              Respuesta anónima registrada.
            </p>
          )}
        </form>

        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleSubmitSugerencia} className="rounded-2xl border border-[#D6E2DB] bg-white p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F3EC] text-[#116D36]">
                <MessageSquareHeart className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <h3 className="text-base font-bold text-[#111827]">Buzón de sugerencias</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827]">Categoría</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as SugerenciaAnonima['categoria'])}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm"
              >
                <option value="Operación">Operación y rutas</option>
                <option value="Herramientas">Herramientas y vehículo</option>
                <option value="Seguridad">Seguridad y EPP</option>
                <option value="Bienestar">Bienestar y trato</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827]">Sugerencia</label>
              <textarea
                required
                rows={3}
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm"
              />
            </div>

            <button
              type="submit"
              className="inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#111827] py-2.5 text-sm font-bold text-white hover:bg-slate-800"
            >
              <Send className="h-4 w-4" strokeWidth={2.2} />
              <span>Enviar al buzón</span>
            </button>

            {sugEnviada && (
              <p role="status" className="rounded-xl bg-[#E8F3EC] border border-[#116D36] px-3 py-2 text-xs font-semibold text-[#0B4D25]">
                Sugerencia guardada.
              </p>
            )}
          </form>

          <section className="rounded-2xl border border-[#D6E2DB] bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111827]">Resultados consolidados</h3>
              <span className="text-sm font-bold font-mono tabular-nums text-[#116D36]">
                {promedioGlobal} / 5.0
              </span>
            </div>

            <div className="space-y-2.5">
              {promedios.map((avg, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="truncate pr-2">{PREGUNTAS_PULSO[idx]}</span>
                    <span className="font-mono font-bold tabular-nums text-[#111827]">{avg}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#E8F3EC]">
                    <div className="h-full bg-[#116D36]" style={{ width: `${(avg / 5) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2">
              {state.sugerencias.slice(0, 3).map((s) => (
                <div key={s.id} className="rounded-xl bg-[#F4F7F5] border border-[#D6E2DB] p-3 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-bold text-[#116D36]">{s.categoria}</span>
                    <span className="font-mono tabular-nums">{formatDateShort(s.fecha)}</span>
                  </div>
                  <p className="mt-1 text-[#111827]">{s.mensaje}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
