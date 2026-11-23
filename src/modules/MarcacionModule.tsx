import React, { useEffect, useState } from 'react';
import { MapPin, LogIn, LogOut, Crosshair, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type { AlfaConectaState, AuthUser } from '../types';
import { formatDateShort, formatTimeOnly } from '../utils/format';
import { calcularDistanciaMetros, formatDistancia } from '../utils/geo';

interface MarcacionModuleProps {
  state: AlfaConectaState;
  currentUser: AuthUser;
  authToken: string;
  onMarcacionSuccess: (nextState: AlfaConectaState) => void;
}

export const MarcacionModule: React.FC<MarcacionModuleProps> = ({
  state,
  currentUser,
  authToken,
  onMarcacionSuccess,
}) => {
  const isTecnico = currentUser.role === 'tecnico';
  const serviciosDisponibles = isTecnico
    ? state.servicios.filter(
        (s) =>
          s.asignadoAId === currentUser.id ||
          s.asignadoANombre.toLowerCase() === currentUser.nombre.toLowerCase()
      )
    : state.servicios;

  const [selectedServicioId, setSelectedServicioId] = useState<string>(
    serviciosDisponibles[0]?.id ?? ''
  );
  const [observacion, setObservacion] = useState('');

  const [currentCoords, setCurrentCoords] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [verificandoGeo, setVerificandoGeo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedServicioId && serviciosDisponibles.length > 0) {
      setSelectedServicioId(serviciosDisponibles[0].id);
    }
  }, [serviciosDisponibles, selectedServicioId]);

  const selectedServicio = serviciosDisponibles.find((s) => s.id === selectedServicioId);
  const radioPermitido = selectedServicio?.radioMetros ?? 250;

  const distanciaMetros =
    currentCoords && selectedServicio
      ? calcularDistanciaMetros(
          currentCoords.lat,
          currentCoords.lng,
          selectedServicio.lat,
          selectedServicio.lng
        )
      : null;

  const estaCerca = distanciaMetros !== null && distanciaMetros <= radioPermitido;

  const verificarUbicacion = () => {
    setGeoError(null);
    setSubmitError(null);
    setFeedback(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoError('Este dispositivo o navegador no soporta geolocalización.');
      return;
    }

    setVerificandoGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy || 15,
        });
        setVerificandoGeo(false);
      },
      (err) => {
        setCurrentCoords(null);
        setVerificandoGeo(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Permiso de ubicación denegado. Activa el GPS para validar tu cercanía al sitio.');
        } else {
          setGeoError('No fue posible obtener tu ubicación GPS en este momento. Intenta de nuevo.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    verificarUbicacion();
  }, []);

  const registrarMarcacion = async (tipo: 'entrada' | 'salida') => {
    if (!selectedServicio || !currentCoords) return;
    if (tipo === 'entrada' && !estaCerca) return;

    setSubmitting(true);
    setSubmitError(null);
    setFeedback(null);

    try {
      const resp = await fetch('/api/marcaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          servicioId: selectedServicio.id,
          tipo,
          lat: currentCoords.lat,
          lng: currentCoords.lng,
          precisionMetros: currentCoords.accuracy,
          observacion: observacion.trim() || undefined,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'No se pudo registrar la marcación.');
      }
      onMarcacionSuccess(data.state);
      setObservacion('');
      setFeedback(
        `${tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada a las ${formatTimeOnly(
          data.record.fechaHora
        )} · Distancia al sitio: ${formatDistancia(data.record.distanciaMetros)}.`
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al guardar la marcación.');
    } finally {
      setSubmitting(false);
    }
  };

  const marcacionesVisibles = isTecnico
    ? state.marcaciones.filter(
        (m) =>
          m.colaboradorId === currentUser.id ||
          m.colaboradorNombre.toLowerCase() === currentUser.nombre.toLowerCase()
      )
    : state.marcaciones;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-[#D6E2DB] pb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F3EC] text-[#116D36] shrink-0">
          <MapPin className="h-6 w-6" strokeWidth={2.2} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#111827]">Marcación en sitio</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        <section className="lg:col-span-5 rounded-2xl border border-[#D6E2DB] bg-white p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#111827]">{currentUser.nombre}</h3>
            <span className="text-xs font-mono font-semibold tabular-nums text-[#116D36]">
              {formatDateShort(new Date().toISOString())}
            </span>
          </div>

          <div>
            <label htmlFor="marc-servicio" className="block text-xs font-bold text-[#111827]">
              Trabajo asignado
            </label>
            {serviciosDisponibles.length === 0 ? (
              <p className="mt-2 rounded-xl bg-[#F4F7F5] border border-[#D6E2DB] p-3 text-xs text-slate-600">
                No tienes trabajos asignados actualmente.
              </p>
            ) : (
              <select
                id="marc-servicio"
                value={selectedServicioId}
                onChange={(e) => setSelectedServicioId(e.target.value)}
                className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm text-[#111827]"
              >
                {serviciosDisponibles.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fecha} {s.hora} · {s.cliente} ({s.direccion})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="rounded-xl border border-[#D6E2DB] bg-[#F4F7F5] p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#111827]">
                Cercanía (radio ≤ {radioPermitido} m)
              </span>
              <button
                type="button"
                onClick={verificarUbicacion}
                disabled={verificandoGeo}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#116D36] bg-white px-3 text-xs font-bold text-[#116D36] hover:bg-[#E8F3EC]"
              >
                <Crosshair className="h-4 w-4" strokeWidth={2.2} />
                <span>{verificandoGeo ? 'Midiendo...' : 'Actualizar GPS'}</span>
              </button>
            </div>

            {geoError && (
              <div className="flex items-start gap-2 text-xs font-medium text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.2} />
                <span>{geoError}</span>
              </div>
            )}

            {currentCoords && selectedServicio && distanciaMetros !== null && (
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2 font-mono tabular-nums text-slate-600">
                  <MapPin className="h-4 w-4 text-[#116D36]" strokeWidth={2.2} />
                  <span>
                    {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
                  </span>
                </div>
                <div
                  className={`flex items-center gap-2 font-bold ${
                    estaCerca ? 'text-[#116D36]' : 'text-amber-700'
                  }`}
                >
                  {estaCerca ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                      <span>
                        En sitio · Distancia: {formatDistancia(distanciaMetros)} (habilitado)
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                      <span>
                        Fuera de rango · Estás a {formatDistancia(distanciaMetros)} del lugar
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="marc-obs" className="block text-xs font-bold text-[#111827]">
              Observación (opcional)
            </label>
            <input
              id="marc-obs"
              type="text"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Ej. Ingreso por portería principal"
              className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              disabled={submitting || !selectedServicio || !estaCerca}
              onClick={() => registrarMarcacion('entrada')}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#116D36] px-4 py-3 text-sm font-bold text-white hover:bg-[#0B4D25] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <LogIn className="h-5 w-5" strokeWidth={2.2} />
              <span>Marcar Entrada</span>
            </button>

            <button
              type="button"
              disabled={submitting || !selectedServicio || !currentCoords}
              onClick={() => registrarMarcacion('salida')}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <LogOut className="h-5 w-5" strokeWidth={2.2} />
              <span>Marcar Salida</span>
            </button>
          </div>

          {feedback && (
            <div role="status" className="rounded-xl bg-[#E8F3EC] border border-[#116D36] px-3.5 py-2.5 text-xs font-semibold text-[#0B4D25]">
              {feedback}
            </div>
          )}

          {submitError && (
            <div role="alert" className="rounded-xl border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">
              {submitError}
            </div>
          )}
        </section>

        <section className="lg:col-span-7 rounded-2xl border border-[#D6E2DB] bg-white">
          <div className="flex items-center justify-between border-b border-[#D6E2DB] px-5 py-4">
            <h3 className="text-base font-bold text-[#111827]">Registros recientes</h3>
            <span className="text-xs font-mono tabular-nums font-bold text-[#116D36]">
              {marcacionesVisibles.length}
            </span>
          </div>

          {marcacionesVisibles.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Sin marcaciones registradas.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {marcacionesVisibles.map((m) => (
                <div key={m.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-bold text-[#111827]">{m.colaboradorNombre}</span>
                      <span aria-hidden="true">·</span>
                      <span className={m.tipo === 'entrada' ? 'font-bold text-[#116D36]' : 'font-bold text-[#111827]'}>
                        {m.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {formatDateShort(m.fechaHora)} {formatTimeOnly(m.fechaHora)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-[#111827] truncate">{m.sitio}</p>
                    {m.observacion && <p className="mt-0.5 text-xs text-slate-600">{m.observacion}</p>}
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-slate-600 shrink-0">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-[#116D36]" strokeWidth={2.2} />
                      <span>{formatDistancia(m.distanciaMetros)}</span>
                    </div>
                    <span className="text-slate-300">/</span>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="h-4 w-4" strokeWidth={2.2} />
                      <span>±{Math.round(m.precisionMetros)}m</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
