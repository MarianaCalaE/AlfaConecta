import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#116D36] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0B4D25] transition-colors whitespace-nowrap shrink-0"
      >
        <Download className="h-4 w-4" strokeWidth={2.4} />
        <span>Instalar App</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#116D36] bg-white px-3 py-2 text-xs font-bold text-[#116D36] hover:bg-[#E8F3EC] transition-colors whitespace-nowrap shrink-0"
      >
        <Smartphone className="h-4 w-4" strokeWidth={2.4} />
        <span>{isIOS ? 'Instalar en iPhone' : 'Instalar App'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
        >
          <div className="w-full max-w-md rounded-2xl border-2 border-[#116D36] bg-white p-6 text-[#111827]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-[#116D36]">Servicios Alfa SAS</p>
                <h3 id="pwa-guide-title" className="mt-1 text-lg font-bold text-[#111827]">
                  Instalar AlfaConecta en tu celular
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Cerrar guía de instalación"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4F7F5] text-[#111827] hover:bg-[#E8F3EC]"
              >
                <X className="h-5 w-5" strokeWidth={2.2} />
              </button>
            </div>

            {isIOS ? (
              <ol className="mt-4 space-y-3 text-sm text-slate-700">
                <li>1. Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.</li>
                <li>2. Selecciona <strong>Agregar a inicio</strong>.</li>
                <li>3. Confirma tocando <strong>Agregar</strong>.</li>
              </ol>
            ) : (
              <ol className="mt-4 space-y-3 text-sm text-slate-700">
                <li>1. Abre el menú del navegador (tres puntos en Chrome o Edge).</li>
                <li>2. Toca <strong>Instalar aplicación</strong> o <strong>Agregar a la pantalla principal</strong>.</li>
                <li>3. Accede desde tu pantalla de inicio como una aplicación móvil.</li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-6 w-full min-h-[44px] rounded-xl bg-[#116D36] py-2.5 text-sm font-bold text-white hover:bg-[#0B4D25]"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
