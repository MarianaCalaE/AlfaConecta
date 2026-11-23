import React, { useEffect, useState } from 'react';
import { Lock, UserPlus, LogIn, KeyRound, ShieldCheck } from 'lucide-react';
import type { AuthUser } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface AuthScreenProps {
  onAuthenticated: (token: string, user: AuthUser) => void;
}

interface AuthStatus {
  needsInitialSetup: boolean;
  hasGerentePass: boolean;
  hasAdminPass: boolean;
  hasTecnicoEjemploPass: boolean;
  tecnicoEjemploNombre: string;
  tecnicosRegistrados: string[];
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'setup'>('login');
  const [status, setStatus] = useState<AuthStatus | null>(null);

  // Login form
  const [username, setUsername] = useState('Gerente');
  const [password, setPassword] = useState('');

  // Registro técnico
  const [nombreTec, setNombreTec] = useState('');
  const [cargoTec, setCargoTec] = useState('Técnico de Campo');
  const [telefonoTec, setTelefonoTec] = useState('');
  const [documentoTec, setDocumentoTec] = useState('');
  const [passwordTec, setPasswordTec] = useState('');

  // Setup inicial
  const [gerentePass, setGerentePass] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [tecEjemploPass, setTecEjemploPass] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      const res = await fetch('/api/auth/status');
      if (res.ok) {
        const data = (await res.json()) as AuthStatus;
        setStatus(data);
        if (data.needsInitialSetup) {
          setMode('setup');
        }
      }
    } catch {
      // ignore network error
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gerentePassword: gerentePass,
          adminPassword: adminPass,
          tecnicoEjemploPassword: tecEjemploPass,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudieron guardar las claves iniciales.');
      }
      setInfo('Cuentas activadas. Ya puedes iniciar sesión como Gerente, Administrador o Carlos Mendoza.');
      setGerentePass('');
      setAdminPass('');
      setTecEjemploPass('');
      await loadStatus();
      setMode('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de configuración.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo iniciar sesión.');
      }
      onAuthenticated(data.token, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterTecnico = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register-tecnico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombreTec,
          cargo: cargoTec,
          telefono: telefonoTec,
          documento: documentoTec,
          password: passwordTec,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo crear la cuenta del técnico.');
      }
      onAuthenticated(data.token, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar técnico.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#116D36] text-white flex flex-col justify-between p-4 sm:p-8">
      <div className="flex items-center justify-between max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-1.5 border border-[#0B4D25]">
          <img
            src="/assets/aistudio/image_6b9d486c.png"
            alt="Servicios Alfa SAS"
            className="h-8 w-auto object-contain"
          />
          <span className="text-sm font-extrabold tracking-tight text-[#111827] border-l border-[#D6E2DB] pl-2.5">
            AlfaConecta
          </span>
        </div>
        <PWAInstallButton />
      </div>

      <main className="my-8 flex items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border-2 border-[#0B4D25] bg-white p-6 sm:p-8 text-[#111827]">
          <div className="flex items-center justify-between gap-4 border-b border-[#D6E2DB] pb-4">
            <img
              src="/assets/aistudio/image_6b9d486c.png"
              alt="Servicios Alfa SAS"
              className="h-12 w-auto object-contain"
            />
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F3EC] text-[#116D36] shrink-0">
              <Lock className="h-5 w-5" strokeWidth={2.2} />
            </div>
          </div>

          <h1 className="mt-4 text-xl font-bold tracking-tight text-[#111827]">
            {mode === 'setup'
              ? 'Activar cuentas iniciales'
              : mode === 'register'
                ? 'Crear cuenta de técnico'
                : 'Iniciar sesión'}
          </h1>

          {/* Selector de pestañas */}
          <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-[#E8F3EC] p-1">
            <button
              type="button"
              onClick={() => {
                setMode(status?.needsInitialSetup ? 'setup' : 'login');
                setError(null);
              }}
              className={`min-h-[42px] rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                mode === 'login' || mode === 'setup'
                  ? 'bg-[#116D36] text-white'
                  : 'text-[#0B4D25] hover:bg-white'
              }`}
            >
              {status?.needsInitialSetup ? 'Acceso inicial' : 'Iniciar sesión'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`min-h-[42px] rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                mode === 'register'
                  ? 'bg-[#116D36] text-white'
                  : 'text-[#0B4D25] hover:bg-white'
              }`}
            >
              Crear cuenta técnico
            </button>
          </div>

          {info && (
            <div role="status" className="mt-4 rounded-xl bg-[#E8F3EC] border border-[#116D36] px-3.5 py-2.5 text-xs font-semibold text-[#0B4D25]">
              {info}
            </div>
          )}

          {error && (
            <div role="alert" className="mt-4 rounded-xl border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">
              {error}
            </div>
          )}

          {mode === 'setup' && status?.needsInitialSetup && (
            <form onSubmit={handleSetup} className="mt-5 space-y-4">
              <div className="flex items-start gap-2.5 rounded-xl bg-[#F4F7F5] border border-[#D6E2DB] p-3 text-xs text-[#111827]">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#116D36]" strokeWidth={2.2} />
                <span>
                  Asigna las contraseñas iniciales para <strong>Gerente</strong>,{' '}
                  <strong>Administrador</strong> y la cuenta ejemplo de técnico{' '}
                  <strong>{status.tecnicoEjemploNombre}</strong>.
                </span>
              </div>

              {!status.hasGerentePass && (
                <div>
                  <label className="block text-xs font-bold text-[#111827]">
                    Contraseña «Gerente»
                  </label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={gerentePass}
                    onChange={(e) => setGerentePass(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm focus:border-[#116D36] focus:outline-none"
                  />
                </div>
              )}

              {!status.hasAdminPass && (
                <div>
                  <label className="block text-xs font-bold text-[#111827]">
                    Contraseña «Administrador»
                  </label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm focus:border-[#116D36] focus:outline-none"
                  />
                </div>
              )}

              {!status.hasTecnicoEjemploPass && (
                <div>
                  <label className="block text-xs font-bold text-[#111827]">
                    Contraseña Técnico ejemplo ({status.tecnicoEjemploNombre})
                  </label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={tecEjemploPass}
                    onChange={(e) => setTecEjemploPass(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm focus:border-[#116D36] focus:outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#116D36] py-2.5 text-sm font-bold text-white hover:bg-[#0B4D25] disabled:opacity-60"
              >
                <KeyRound className="h-5 w-5" strokeWidth={2.2} />
                <span>{loading ? 'Guardando...' : 'Activar cuentas'}</span>
              </button>
            </form>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="mt-5 space-y-4">
              <div>
                <span className="block text-xs font-bold text-[#111827] mb-1.5">
                  Cuentas disponibles
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setUsername('Gerente')}
                    className={`min-h-[38px] rounded-lg border px-3 text-xs font-bold transition-colors ${
                      username === 'Gerente'
                        ? 'border-[#116D36] bg-[#116D36] text-white'
                        : 'border-slate-300 bg-white text-[#111827] hover:bg-[#F4F7F5]'
                    }`}
                  >
                    Gerente
                  </button>
                  <button
                    type="button"
                    onClick={() => setUsername('Administrador')}
                    className={`min-h-[38px] rounded-lg border px-3 text-xs font-bold transition-colors ${
                      username === 'Administrador'
                        ? 'border-[#116D36] bg-[#116D36] text-white'
                        : 'border-slate-300 bg-white text-[#111827] hover:bg-[#F4F7F5]'
                    }`}
                  >
                    Administrador
                  </button>
                  {status?.tecnicosRegistrados.map((tec) => (
                    <button
                      key={tec}
                      type="button"
                      onClick={() => setUsername(tec)}
                      className={`min-h-[38px] rounded-lg border px-3 text-xs font-bold transition-colors ${
                        username === tec
                          ? 'border-[#0B4D25] bg-[#0B4D25] text-white'
                          : 'border-[#116D36] bg-[#E8F3EC] text-[#0B4D25] hover:bg-[#d5ebdd]'
                      }`}
                    >
                      {tec} (Técnico)
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="auth-username" className="block text-xs font-bold text-[#111827]">
                  Nombre de cuenta
                </label>
                <input
                  id="auth-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Gerente, Administrador o nombre del técnico"
                  className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm focus:border-[#116D36] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="auth-password" className="block text-xs font-bold text-[#111827]">
                  Contraseña
                </label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm focus:border-[#116D36] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#116D36] py-2.5 text-sm font-bold text-white hover:bg-[#0B4D25] disabled:opacity-60"
              >
                <LogIn className="h-5 w-5" strokeWidth={2.2} />
                <span>{loading ? 'Verificando...' : 'Entrar'}</span>
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegisterTecnico} className="mt-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#111827]">
                  Nombre completo del técnico
                </label>
                <input
                  type="text"
                  required
                  value={nombreTec}
                  onChange={(e) => setNombreTec(e.target.value)}
                  placeholder="Ej. Mateo Ríos"
                  className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm focus:border-[#116D36] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#111827]">Cargo</label>
                  <input
                    type="text"
                    required
                    value={cargoTec}
                    onChange={(e) => setCargoTec(e.target.value)}
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111827]">Teléfono</label>
                  <input
                    type="text"
                    value={telefonoTec}
                    onChange={(e) => setTelefonoTec(e.target.value)}
                    placeholder="310 000 0000"
                    className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111827]">Documento</label>
                <input
                  type="text"
                  value={documentoTec}
                  onChange={(e) => setDocumentoTec(e.target.value)}
                  placeholder="CC 1.000.000.000"
                  className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111827]">Contraseña</label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={passwordTec}
                  onChange={(e) => setPasswordTec(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#116D36] py-2.5 text-sm font-bold text-white hover:bg-[#0B4D25] disabled:opacity-60"
              >
                <UserPlus className="h-5 w-5" strokeWidth={2.2} />
                <span>{loading ? 'Creando cuenta...' : 'Crear cuenta de técnico'}</span>
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="text-center text-xs font-medium text-[#E8F3EC]">
        Servicios Alfa SAS · Gerente · Administrador · Técnicos
      </footer>
    </div>
  );
};
