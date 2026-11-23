import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  FileText,
  CheckCircle2,
  Navigation,
  Clock3,
  AlertTriangle,
  MapPin,
  X,
} from 'lucide-react';
import type {
  AlfaConectaState,
  AuthUser,
  ReporteTecnico,
  ServiceStatus,
  ServicioProgramado,
} from '../types';
import { createId, formatDateShort, formatTimeOnly } from '../utils/format';

interface CalendarioModuleProps {
  state: AlfaConectaState;
  currentUser: AuthUser;
  onAddServicio: (servicio: ServicioProgramado) => void;
  onUpdateEstado: (id: string, estado: ServiceStatus) => void;
  onSaveReporte: (id: string, reporte: ReporteTecnico) => void;
}

const STATUS_LABEL: Record<ServiceStatus, string> = {
  programado: 'Programado',
  en_sitio: 'En sitio',
  completado: 'Completado',
  novedad: 'Con novedad',
};

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function toIsoDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export const CalendarioModule: React.FC<CalendarioModuleProps> = ({
  state,
  currentUser,
  onAddServicio,
  onUpdateEstado,
  onSaveReporte,
}) => {
  const tecnicos = state.colaboradores.filter((c) => c.rol === 'tecnico');
  const isTecnico = currentUser.role === 'tecnico';

  const [filtroTecnicoId, setFiltroTecnicoId] = useState<string>(
    isTecnico ? currentUser.id : 'todos'
  );

  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(10);
  const [selectedDate, setSelectedDate] = useState('2026-11-23');

  const [showNewForm, setShowNewForm] = useState(false);
  const [activeReporteId, setActiveReporteId] = useState<string | null>(null);

  const [cliente, setCliente] = useState('');
  const [direccion, setDireccion] = useState('');
  const [tipoServicio, setTipoServicio] = useState('');
  const [fecha, setFecha] = useState('2026-11-23');
  const [hora, setHora] = useState('09:00');
  const [asignadoAId, setAsignadoAId] = useState(tecnicos[0]?.id ?? 'col-1');
  const [prioridad, setPrioridad] = useState<'normal' | 'alta'>('normal');
  const [lat, setLat] = useState('4.6968');
  const [lng, setLng] = useState('-74.0512');
  const [locLoading, setLocLoading] = useState(false);

  const [actividades, setActividades] = useState('');
  const [materiales, setMateriales] = useState('');
  const [recibeCliente, setRecibeCliente] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const serviciosVisibles = useMemo(() => {
    return state.servicios.filter((s) => {
      if (isTecnico) {
        return (
          s.asignadoAId === currentUser.id ||
          s.asignadoANombre.toLowerCase() === currentUser.nombre.toLowerCase()
        );
      }
      if (filtroTecnicoId === 'todos') return true;
      return s.asignadoAId === filtroTecnicoId;
    });
  }, [state.servicios, isTecnico, currentUser, filtroTecnicoId]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startOffset = (firstDay.getDay() + 6) % 7;

    const cells: Array<{ date: string | null; day: number | null }> = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ date: null, day: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: toIsoDate(viewYear, viewMonth, d), day: d });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ date: null, day: null });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const serviciosDelDia = serviciosVisibles
    .filter((s) => s.fecha === selectedDate)
    .sort((a, b) => a.hora.localeCompare(b.hora));

  const changeMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const usarUbicacionActualParaSede = () => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocLoading(false);
      },
      () => {
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleCreateServicio = (e: React.FormEvent) => {
    e.preventDefault();
    const tec = tecnicos.find((t) => t.id === asignadoAId) ?? tecnicos[0];
    if (!cliente.trim() || !direccion.trim() || !tipoServicio.trim() || !tec) return;

    onAddServicio({
      id: createId('srv'),
      fecha,
      hora,
      cliente: cliente.trim(),
      direccion: direccion.trim(),
      lat: Number(lat) || 4.6968,
      lng: Number(lng) || -74.0512,
      radioMetros: 250,
      tipoServicio: tipoServicio.trim(),
      asignadoAId: tec.id,
      asignadoANombre: tec.nombre,
      estado: 'programado',
      prioridad,
    });
    setSelectedDate(fecha);
    setCliente('');
    setDireccion('');
    setTipoServicio('');
    setShowNewForm(false);
  };

  const openReporteModal = (srv: ServicioProgramado) => {
    setActiveReporteId(srv.id);
    setActividades(srv.reporte?.actividadesRealizadas ?? '');
    setMateriales(srv.reporte?.materialesUsados ?? '');
    setRecibeCliente(srv.reporte?.recibeCliente ?? '');
    setObservaciones(srv.reporte?.observaciones ?? '');
  };

  const submitReporte = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReporteId || !actividades.trim() || !recibeCliente.trim()) return;
    onSaveReporte(activeReporteId, {
      actividadesRealizadas: actividades.trim(),
      materialesUsados: materiales.trim() || 'Sin consumibles adicionales',
      recibeCliente: recibeCliente.trim(),
      observaciones: observaciones.trim() || 'Trabajo entregado a satisfacción.',
      fechaCierre: new Date().toISOString(),
    });
    setActiveReporteId(null);
  };

  const activeSrv = state.servicios.find((s) => s.id === activeReporteId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#D6E2DB] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F3EC] text-[#116D36] shrink-0">
            <CalendarIcon className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
              Calendario de trabajos
            </h2>
            {isTecnico && (
              <p className="text-xs font-semibold text-[#116D36]">{currentUser.nombre}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!isTecnico && (
            <select
              aria-label="Filtrar por técnico"
              value={filtroTecnicoId}
              onChange={(e) => setFiltroTecnicoId(e.target.value)}
              className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-[#111827]"
            >
              <option value="todos">Todos los técnicos</option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          )}

          {!isTecnico && (
            <button
              type="button"
              onClick={() => {
                setFecha(selectedDate);
                setShowNewForm((p) => !p);
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#116D36] px-4 py-2 text-xs font-bold text-white hover:bg-[#0B4D25] whitespace-nowrap"
            >
              <Plus className="h-5 w-5" strokeWidth={2.4} />
              <span>{showNewForm ? 'Ocultar formulario' : 'Asignar trabajo'}</span>
            </button>
          )}
        </div>
      </div>

      {showNewForm && !isTecnico && (
        <form
          onSubmit={handleCreateServicio}
          className="rounded-2xl border border-[#D6E2DB] bg-white p-5 space-y-4"
        >
          <h3 className="text-sm font-bold text-[#111827]">Nuevo trabajo en calendario</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-[#111827]">Técnico asignado</label>
              <select
                value={asignadoAId}
                onChange={(e) => setAsignadoAId(e.target.value)}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm"
              >
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111827]">Cliente / Sede</label>
              <input
                type="text"
                required
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111827]">Dirección</label>
              <input
                type="text"
                required
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111827]">Trabajo a realizar</label>
              <input
                type="text"
                required
                value={tipoServicio}
                onChange={(e) => setTipoServicio(e.target.value)}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#111827]">Fecha</label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111827]">Hora</label>
                <input
                  type="time"
                  required
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111827]">Prioridad</label>
              <select
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value as 'normal' | 'alta')}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111827]">Latitud</label>
              <input
                type="number"
                step="any"
                required
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111827]">Longitud</label>
              <input
                type="number"
                step="any"
                required
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm font-mono"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={usarUbicacionActualParaSede}
                className="inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#116D36] bg-[#E8F3EC] px-3 text-xs font-bold text-[#0B4D25] hover:bg-[#d5ebdd]"
              >
                <MapPin className="h-4 w-4 text-[#116D36]" strokeWidth={2.2} />
                <span>{locLoading ? 'Obteniendo GPS...' : 'Usar ubicación actual'}</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="min-h-[40px] rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-[#111827]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-[40px] rounded-xl bg-[#116D36] px-4 text-xs font-bold text-white"
            >
              Guardar trabajo
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        <section className="lg:col-span-7 rounded-2xl border border-[#D6E2DB] bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-[#116D36]" strokeWidth={2.2} />
              <h3 className="text-base font-bold text-[#111827]">
                {MESES[viewMonth]} {viewYear}
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                aria-label="Mes anterior"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-[#111827] hover:bg-[#F4F7F5]"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewYear(2026);
                  setViewMonth(10);
                  setSelectedDate('2026-11-23');
                }}
                className="min-h-[40px] rounded-xl border border-slate-300 px-3 text-xs font-bold text-[#111827] hover:bg-[#F4F7F5]"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                aria-label="Mes siguiente"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-[#111827] hover:bg-[#F4F7F5]"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2.2} />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-600">
            {DIAS_SEMANA.map((dia) => (
              <div key={dia} className="py-2">
                {dia}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell, idx) => {
              if (!cell.date || cell.day === null) {
                return <div key={`empty-${idx}`} className="min-h-[68px] rounded-xl bg-[#F4F7F5]" />;
              }
              const dayJobs = serviciosVisibles.filter((s) => s.fecha === cell.date);
              const isSelected = selectedDate === cell.date;
              return (
                <button
                  key={cell.date}
                  type="button"
                  onClick={() => setSelectedDate(cell.date!)}
                  className={`min-h-[68px] flex flex-col items-start justify-between rounded-xl border p-2 text-left transition-colors ${
                    isSelected
                      ? 'border-[#116D36] bg-[#116D36] text-white'
                      : dayJobs.length > 0
                        ? 'border-[#116D36] bg-[#E8F3EC] text-[#111827] hover:bg-[#d5ebdd]'
                        : 'border-slate-200 bg-white text-[#111827] hover:bg-[#F4F7F5]'
                  }`}
                >
                  <span className="text-xs font-bold font-mono tabular-nums">{cell.day}</span>
                  {dayJobs.length > 0 && (
                    <span
                      className={`block truncate text-[10px] font-bold ${
                        isSelected ? 'text-white' : 'text-[#0B4D25]'
                      }`}
                    >
                      {dayJobs.length} {dayJobs.length === 1 ? 'trabajo' : 'trabajos'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-5 rounded-2xl border border-[#D6E2DB] bg-white p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <p className="text-xs font-bold text-[#116D36]">Agenda</p>
              <h3 className="text-base font-bold text-[#111827]">{formatDateShort(selectedDate)}</h3>
            </div>
            <span className="text-xs font-mono font-bold tabular-nums text-[#116D36]">
              {serviciosDelDia.length} asignados
            </span>
          </div>

          {serviciosDelDia.length === 0 ? (
            <div className="rounded-xl bg-[#F4F7F5] p-6 text-center text-sm text-slate-500">
              No hay trabajos programados para esta fecha.
            </div>
          ) : (
            <div className="space-y-4">
              {serviciosDelDia.map((srv) => (
                <article
                  key={srv.id}
                  className="rounded-2xl border border-[#D6E2DB] bg-white p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold tabular-nums text-[#116D36]">{srv.hora}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold text-[#111827]">{srv.asignadoANombre}</span>
                    </div>

                    <div className="flex items-center gap-1 font-bold text-[#111827]">
                      {srv.estado === 'completado' && <CheckCircle2 className="h-4 w-4 text-[#116D36]" strokeWidth={2.4} />}
                      {srv.estado === 'en_sitio' && <Navigation className="h-4 w-4 text-[#116D36]" strokeWidth={2.2} />}
                      {srv.estado === 'programado' && <Clock3 className="h-4 w-4 text-slate-500" strokeWidth={2.2} />}
                      {srv.estado === 'novedad' && <AlertTriangle className="h-4 w-4 text-amber-600" strokeWidth={2.2} />}
                      <span>{STATUS_LABEL[srv.estado]}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-[#111827]">{srv.cliente}</h4>
                    <p className="text-sm font-semibold text-[#0B4D25]">{srv.tipoServicio}</p>
                    <p className="mt-1 text-xs text-slate-600">{srv.direccion}</p>
                  </div>

                  {srv.reporte && (
                    <div className="rounded-xl bg-[#F4F7F5] border border-[#D6E2DB] p-3 text-xs text-slate-700 space-y-1">
                      <div className="flex justify-between font-bold text-[#111827]">
                        <span>Reporte técnico</span>
                        <span className="font-mono tabular-nums text-slate-500">
                          {formatTimeOnly(srv.reporte.fechaCierre)}
                        </span>
                      </div>
                      <p>{srv.reporte.actividadesRealizadas}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <select
                      aria-label={`Estado de ${srv.cliente}`}
                      value={srv.estado}
                      onChange={(e) => onUpdateEstado(srv.id, e.target.value as ServiceStatus)}
                      className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-bold text-[#111827]"
                    >
                      <option value="programado">Programado</option>
                      <option value="en_sitio">En sitio</option>
                      <option value="completado">Completado</option>
                      <option value="novedad">Con novedad</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => openReporteModal(srv)}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#116D36] bg-[#E8F3EC] px-3 text-xs font-bold text-[#0B4D25] hover:bg-[#d5ebdd]"
                    >
                      <FileText className="h-4 w-4 text-[#116D36]" strokeWidth={2.2} />
                      <span>{srv.reporte ? 'Ver reporte' : 'Reporte técnico'}</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {activeSrv && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl border-2 border-[#116D36] bg-white p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#111827]">{activeSrv.cliente}</h3>
                <p className="text-xs text-slate-600">{activeSrv.tipoServicio}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveReporteId(null)}
                aria-label="Cerrar reporte"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4F7F5] text-[#111827] hover:bg-[#E8F3EC]"
              >
                <X className="h-5 w-5" strokeWidth={2.2} />
              </button>
            </div>

            <form onSubmit={submitReporte} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111827]">Actividades realizadas</label>
                <textarea
                  required
                  rows={3}
                  value={actividades}
                  onChange={(e) => setActividades(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111827]">Materiales utilizados</label>
                <input
                  type="text"
                  value={materiales}
                  onChange={(e) => setMateriales(e.target.value)}
                  className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111827]">Recibe en cliente</label>
                <input
                  type="text"
                  required
                  value={recibeCliente}
                  onChange={(e) => setRecibeCliente(e.target.value)}
                  className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111827]">Observaciones</label>
                <input
                  type="text"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveReporteId(null)}
                  className="min-h-[44px] rounded-xl border border-slate-300 px-4 text-sm font-semibold text-[#111827]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl bg-[#116D36] px-5 text-sm font-bold text-white hover:bg-[#0B4D25]"
                >
                  Guardar y completar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
