import React, { useState } from 'react';
import { FolderOpen, FilePlus2, Check, XCircle, AlertCircle, FileCheck2 } from 'lucide-react';
import type {
  AlfaConectaState,
  AuthUser,
  DocCategoria,
  DocumentoExpediente,
  SolicitudExpediente,
} from '../types';
import { createId, formatCOP, formatDateShort } from '../utils/format';

interface ExpedienteModuleProps {
  state: AlfaConectaState;
  currentUser: AuthUser;
  onAddDocumento: (doc: DocumentoExpediente) => void;
  onAddSolicitud: (sol: SolicitudExpediente) => void;
  onUpdateSolicitudEstado: (id: string, estado: 'aprobada' | 'rechazada') => void;
}

const CATEGORIA_LABEL: Record<DocCategoria, string> = {
  contrato: 'Contrato laboral',
  otrosi_auxilio: 'Otrosí de auxilios',
  acta_vehiculo: 'Acta de vehículo',
  dotacion: 'Dotación entregada',
  curso: 'Cursos realizados',
};

export const ExpedienteModule: React.FC<ExpedienteModuleProps> = ({
  state,
  currentUser,
  onAddDocumento,
  onAddSolicitud,
  onUpdateSolicitudEstado,
}) => {
  const isTecnico = currentUser.role === 'tecnico';
  const [activeTab, setActiveTab] = useState<'documentos' | 'solicitudes'>('documentos');

  const defaultColId = isTecnico
    ? state.colaboradores.find(
        (c) => c.id === currentUser.id || c.nombre.toLowerCase() === currentUser.nombre.toLowerCase()
      )?.id ?? currentUser.id
    : state.colaboradores.find((c) => c.rol === 'tecnico')?.id ?? state.colaboradores[0]?.id ?? 'col-1';

  const [selectedColId, setSelectedColId] = useState<string>(defaultColId);
  const [catFilter, setCatFilter] = useState<DocCategoria | 'todas'>('todas');
  const [showDocForm, setShowDocForm] = useState(false);

  const [docCat, setDocCat] = useState<DocCategoria>('otrosi_auxilio');
  const [docTitulo, setDocTitulo] = useState('');
  const [docDetalle, setDocDetalle] = useState('');
  const [docValor, setDocValor] = useState('');
  const [docVence, setDocVence] = useState('');

  const [solTipo, setSolTipo] = useState<'permiso' | 'prestamo'>('permiso');
  const [solFechaObj, setSolFechaObj] = useState('2026-11-28');
  const [solMotivo, setSolMotivo] = useState('');
  const [solMonto, setSolMonto] = useState('');
  const [solCuotas, setSolCuotas] = useState('3');

  const effectiveColId = isTecnico ? defaultColId : selectedColId;
  const selectedCol = state.colaboradores.find((c) => c.id === effectiveColId);

  const docsColaborador = state.documentos.filter((d) => {
    const matchCol = d.colaboradorId === effectiveColId;
    const matchCat = catFilter === 'todas' || d.categoria === catFilter;
    return matchCol && matchCat;
  });

  const auxiliosVigentes = state.documentos
    .filter((d) => d.colaboradorId === effectiveColId && d.categoria === 'otrosi_auxilio' && d.valorMensual)
    .reduce((sum, d) => sum + (d.valorMensual ?? 0), 0);

  const handleAddDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitulo.trim() || !docDetalle.trim()) return;
    onAddDocumento({
      id: createId('doc'),
      colaboradorId: effectiveColId,
      categoria: docCat,
      titulo: docTitulo.trim(),
      detalle: docDetalle.trim(),
      fechaEmision: new Date().toISOString().slice(0, 10),
      fechaVencimiento: docVence || undefined,
      valorMensual: docValor ? Number(docValor) : undefined,
      estado: docCat === 'dotacion' ? 'entregado' : 'vigente',
    });
    setDocTitulo('');
    setDocDetalle('');
    setDocValor('');
    setDocVence('');
    setShowDocForm(false);
  };

  const handleAddSol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!solMotivo.trim()) return;
    onAddSolicitud({
      id: createId('sol'),
      colaboradorId: selectedCol?.id ?? currentUser.id,
      colaboradorNombre: selectedCol?.nombre ?? currentUser.nombre,
      tipo: solTipo,
      fechaSolicitud: new Date().toISOString().slice(0, 10),
      fechaObjetivo: solFechaObj,
      motivo: solMotivo.trim(),
      monto: solTipo === 'prestamo' && solMonto ? Number(solMonto) : undefined,
      cuotas: solTipo === 'prestamo' && solCuotas ? Number(solCuotas) : undefined,
      estado: 'pendiente',
    });
    setSolMotivo('');
    setSolMonto('');
  };

  const solicitudesVisibles = isTecnico
    ? state.solicitudes.filter(
        (s) =>
          s.colaboradorId === effectiveColId ||
          s.colaboradorNombre.toLowerCase() === currentUser.nombre.toLowerCase()
      )
    : state.solicitudes;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#D6E2DB] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F3EC] text-[#116D36] shrink-0">
            <FolderOpen className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#111827]">Mi expediente</h2>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-[#E8F3EC] p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('documentos')}
            className={`min-h-[40px] rounded-lg px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === 'documentos' ? 'bg-[#116D36] text-white' : 'text-[#0B4D25] hover:bg-white'
            }`}
          >
            Documentos y auxilios
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('solicitudes')}
            className={`min-h-[40px] rounded-lg px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === 'solicitudes' ? 'bg-[#116D36] text-white' : 'text-[#0B4D25] hover:bg-white'
            }`}
          >
            Permisos y préstamos
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-[#D6E2DB] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        {isTecnico ? (
          <div className="text-sm font-bold text-[#111827]">{currentUser.nombre}</div>
        ) : (
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
            <label htmlFor="exp-colaborador" className="text-xs font-bold text-[#111827] whitespace-nowrap">
              Colaborador:
            </label>
            <select
              id="exp-colaborador"
              value={effectiveColId}
              onChange={(e) => setSelectedColId(e.target.value)}
              className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-[#111827]"
            >
              {state.colaboradores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} — {c.cargo}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedCol && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="font-mono">{selectedCol.documento}</span>
            <span aria-hidden="true">·</span>
            <span>Ingreso: {formatDateShort(selectedCol.fechaIngreso)}</span>
            <span aria-hidden="true">·</span>
            <span className="font-bold text-[#116D36] tabular-nums">
              Auxilios: {formatCOP(auxiliosVigentes)}/mes
            </span>
          </div>
        )}
      </div>

      {activeTab === 'documentos' ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1 rounded-xl bg-[#E8F3EC] p-1">
              <button
                type="button"
                onClick={() => setCatFilter('todas')}
                className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                  catFilter === 'todas' ? 'bg-[#116D36] text-white' : 'text-[#0B4D25] hover:bg-white'
                }`}
              >
                Todos
              </button>
              {(Object.keys(CATEGORIA_LABEL) as DocCategoria[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCatFilter(cat)}
                  className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                    catFilter === cat ? 'bg-[#116D36] text-white' : 'text-[#0B4D25] hover:bg-white'
                  }`}
                >
                  {CATEGORIA_LABEL[cat]}
                </button>
              ))}
            </div>

            {!isTecnico && (
              <button
                type="button"
                onClick={() => setShowDocForm((p) => !p)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#116D36] px-4 py-2 text-xs font-bold text-white hover:bg-[#0B4D25] whitespace-nowrap shrink-0"
              >
                <FilePlus2 className="h-5 w-5" strokeWidth={2.2} />
                <span>{showDocForm ? 'Cerrar registro' : 'Registrar documento'}</span>
              </button>
            )}
          </div>

          {showDocForm && !isTecnico && (
            <form onSubmit={handleAddDoc} className="rounded-2xl border border-[#D6E2DB] bg-white p-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-bold text-[#111827]">Categoría</label>
                  <select
                    value={docCat}
                    onChange={(e) => setDocCat(e.target.value as DocCategoria)}
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm"
                  >
                    {(Object.keys(CATEGORIA_LABEL) as DocCategoria[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORIA_LABEL[cat]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#111827]">Título</label>
                  <input
                    type="text"
                    required
                    value={docTitulo}
                    onChange={(e) => setDocTitulo(e.target.value)}
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111827]">Valor mensual COP</label>
                  <input
                    type="number"
                    min="0"
                    value={docValor}
                    onChange={(e) => setDocValor(e.target.value)}
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm font-mono"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-[#111827]">Detalle</label>
                  <input
                    type="text"
                    required
                    value={docDetalle}
                    onChange={(e) => setDocDetalle(e.target.value)}
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111827]">Vencimiento</label>
                  <input
                    type="date"
                    value={docVence}
                    onChange={(e) => setDocVence(e.target.value)}
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDocForm(false)}
                  className="min-h-[40px] rounded-xl border border-slate-300 px-4 text-xs font-semibold text-[#111827]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] rounded-xl bg-[#116D36] px-4 text-xs font-bold text-white"
                >
                  Guardar
                </button>
              </div>
            </form>
          )}

          {docsColaborador.length === 0 ? (
            <div className="rounded-2xl border border-[#D6E2DB] bg-white p-8 text-center text-sm text-slate-500">
              Sin documentos en esta categoría.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 rounded-2xl border border-[#D6E2DB] bg-white">
              {docsColaborador.map((doc) => (
                <div key={doc.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-bold text-[#116D36]">{CATEGORIA_LABEL[doc.categoria]}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{formatDateShort(doc.fechaEmision)}</span>
                      {doc.fechaVencimiento && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">Vence: {formatDateShort(doc.fechaVencimiento)}</span>
                        </>
                      )}
                    </div>
                    <h4 className="mt-1 text-base font-bold text-[#111827]">{doc.titulo}</h4>
                    <p className="mt-1 text-sm text-slate-600">{doc.detalle}</p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {doc.valorMensual !== undefined && (
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Mensual</p>
                        <p className="text-sm font-bold font-mono tabular-nums text-[#116D36]">
                          {formatCOP(doc.valorMensual)}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      {doc.estado === 'por_vencer' ? (
                        <>
                          <AlertCircle className="h-4 w-4 text-amber-600" strokeWidth={2.4} />
                          <span className="text-amber-700">Próximo a vencer</span>
                        </>
                      ) : (
                        <>
                          <FileCheck2 className="h-4 w-4 text-[#116D36]" strokeWidth={2.4} />
                          <span className="text-[#111827]">
                            {doc.estado === 'entregado' ? 'Entregado' : 'Vigente'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          <form onSubmit={handleAddSol} className="lg:col-span-5 rounded-2xl border border-[#D6E2DB] bg-white p-5 space-y-4">
            <h3 className="text-base font-bold text-[#111827]">Nueva solicitud</h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSolTipo('permiso')}
                className={`min-h-[44px] rounded-xl border text-xs font-bold ${
                  solTipo === 'permiso'
                    ? 'border-[#116D36] bg-[#116D36] text-white'
                    : 'border-slate-300 bg-white text-[#111827]'
                }`}
              >
                Permiso laboral
              </button>
              <button
                type="button"
                onClick={() => setSolTipo('prestamo')}
                className={`min-h-[44px] rounded-xl border text-xs font-bold ${
                  solTipo === 'prestamo'
                    ? 'border-[#116D36] bg-[#116D36] text-white'
                    : 'border-slate-300 bg-white text-[#111827]'
                }`}
              >
                Préstamo
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827]">Fecha</label>
              <input
                type="date"
                required
                value={solFechaObj}
                onChange={(e) => setSolFechaObj(e.target.value)}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm"
              />
            </div>

            {solTipo === 'prestamo' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111827]">Monto (COP)</label>
                  <input
                    type="number"
                    required
                    min="50000"
                    step="10000"
                    value={solMonto}
                    onChange={(e) => setSolMonto(e.target.value)}
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111827]">Cuotas</label>
                  <select
                    value={solCuotas}
                    onChange={(e) => setSolCuotas(e.target.value)}
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm"
                  >
                    <option value="2">2 cuotas</option>
                    <option value="3">3 cuotas</option>
                    <option value="4">4 cuotas</option>
                    <option value="6">6 cuotas</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#111827]">Motivo</label>
              <textarea
                required
                rows={3}
                value={solMotivo}
                onChange={(e) => setSolMotivo(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-[#116D36] py-2.5 text-sm font-bold text-white hover:bg-[#0B4D25]"
            >
              Radicar solicitud
            </button>
          </form>

          <section className="lg:col-span-7 rounded-2xl border border-[#D6E2DB] bg-white">
            <div className="flex items-center justify-between border-b border-[#D6E2DB] px-5 py-4">
              <h3 className="text-base font-bold text-[#111827]">Solicitudes</h3>
              <span className="text-xs font-mono font-bold tabular-nums text-[#116D36]">
                {solicitudesVisibles.length}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {solicitudesVisibles.map((sol) => (
                <div key={sol.id} className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-bold text-[#111827]">{sol.colaboradorNombre}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold text-[#116D36]">
                        {sol.tipo === 'permiso' ? 'Permiso' : 'Préstamo'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{formatDateShort(sol.fechaObjetivo)}</span>
                    </div>
                    <p className="mt-1 text-sm text-[#111827]">{sol.motivo}</p>
                    {sol.monto !== undefined && (
                      <p className="mt-1 text-xs font-mono tabular-nums font-bold text-[#116D36]">
                        {formatCOP(sol.monto)} · {sol.cuotas ?? 2} cuotas
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {sol.estado === 'pendiente' ? (
                      !isTecnico ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onUpdateSolicitudEstado(sol.id, 'aprobada')}
                            className="inline-flex min-h-[40px] items-center gap-1 rounded-lg bg-[#116D36] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0B4D25]"
                          >
                            <Check className="h-4 w-4" strokeWidth={2.4} />
                            <span>Aprobar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateSolicitudEstado(sol.id, 'rechazada')}
                            className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-[#111827]"
                          >
                            <XCircle className="h-4 w-4" strokeWidth={2.2} />
                            <span>Rechazar</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-amber-700">Pendiente</span>
                      )
                    ) : (
                      <span className={`text-xs font-bold ${sol.estado === 'aprobada' ? 'text-[#116D36]' : 'text-slate-500'}`}>
                        {sol.estado === 'aprobada' ? 'Aprobada' : 'Rechazada'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
