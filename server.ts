import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { INITIAL_ALFA_STATE } from './src/data/seedData.ts';
import type { AlfaConectaState, AuthUser, MarcacionRecord, UserRole } from './src/types.ts';

dotenv.config();

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'alfaconecta-db.json');
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 horas

interface StoredAccount {
  id: string;
  username: string;
  nombre: string;
  role: UserRole;
  cargo: string;
  passwordHash: string;
  createdAt: string;
}

interface PersistedDb {
  accounts: StoredAccount[];
  state: AlfaConectaState;
}

interface SessionPayload {
  user: AuthUser;
  exp: number;
}

const revokedTokens = new Set<string>();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

function signToken(user: AuthUser): string {
  const payload: SessionPayload = {
    user,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string): AuthUser | null {
  if (!token || revokedTokens.has(token)) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as SessionPayload;
    if (!parsed.exp || Date.now() > parsed.exp || !parsed.user) return null;
    return parsed.user;
  } catch {
    return null;
  }
}

function buildInitialDb(): PersistedDb {
  const gerentePass = process.env.GERENTE_PASSCODE?.trim();
  const adminPass = process.env.ADMIN_PASSCODE?.trim();
  const tecEjemploPass = process.env.TECNICO_EJEMPLO_PASSCODE?.trim();

  const accounts: StoredAccount[] = [
    {
      id: 'col-gerente',
      username: 'Gerente',
      nombre: 'Gerente',
      role: 'gerente',
      cargo: 'Gerencia General',
      passwordHash: gerentePass ? hashPassword(gerentePass) : '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'col-admin',
      username: 'Administrador',
      nombre: 'Administrador',
      role: 'administrador',
      cargo: 'Auxiliar Administrativo',
      passwordHash: adminPass ? hashPassword(adminPass) : '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'col-1',
      username: 'Carlos Mendoza',
      nombre: 'Carlos Mendoza',
      role: 'tecnico',
      cargo: 'Técnico Especialista HVAC y Eléctrico',
      passwordHash: tecEjemploPass ? hashPassword(tecEjemploPass) : '',
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    accounts,
    state: INITIAL_ALFA_STATE,
  };
}

function ensureDb(): PersistedDb {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = buildInitialDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as PersistedDb;
    if (!parsed || !Array.isArray(parsed.accounts) || !parsed.state || !Array.isArray(parsed.state.servicios)) {
      const reset = buildInitialDb();
      fs.writeFileSync(DB_FILE, JSON.stringify(reset, null, 2), 'utf-8');
      return reset;
    }
    return parsed;
  } catch {
    const reset = buildInitialDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(reset, null, 2), 'utf-8');
    return reset;
  }
}

function saveDb(db: PersistedDb): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function extractBearer(req: express.Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7).trim();
}

function requireAuth(req: express.Request, res: express.Response): AuthUser | null {
  const token = extractBearer(req);
  if (!token) {
    res.status(401).json({ error: 'Sesión requerida. Inicia sesión para continuar.' });
    return null;
  }
  const user = verifyToken(token);
  if (!user) {
    res.status(401).json({ error: 'Tu sesión expiró o es inválida. Vuelve a iniciar sesión.' });
    return null;
  }
  return user;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'AlfaConecta' });
  });

  app.get('/api/auth/status', (_req, res) => {
    const db = ensureDb();
    const gerente = db.accounts.find((a) => a.username === 'Gerente');
    const admin = db.accounts.find((a) => a.username === 'Administrador');
    const tecEjemplo = db.accounts.find((a) => a.username === 'Carlos Mendoza');
    const hasGerentePass = Boolean(process.env.GERENTE_PASSCODE?.trim()) || Boolean(gerente?.passwordHash);
    const hasAdminPass = Boolean(process.env.ADMIN_PASSCODE?.trim()) || Boolean(admin?.passwordHash);
    const hasTecnicoEjemploPass =
      Boolean(process.env.TECNICO_EJEMPLO_PASSCODE?.trim()) || Boolean(tecEjemplo?.passwordHash);
    const tecnicos = db.accounts
      .filter((a) => a.role === 'tecnico')
      .map((a) => a.nombre);

    res.json({
      needsInitialSetup: !hasGerentePass || !hasAdminPass || (Boolean(tecEjemplo) && !hasTecnicoEjemploPass),
      hasGerentePass,
      hasAdminPass,
      hasTecnicoEjemploPass,
      tecnicoEjemploNombre: tecEjemplo?.nombre ?? 'Carlos Mendoza',
      tecnicosRegistrados: tecnicos,
    });
  });

  app.post('/api/auth/setup', (req, res) => {
    const { gerentePassword, adminPassword, tecnicoEjemploPassword } = req.body as {
      gerentePassword?: string;
      adminPassword?: string;
      tecnicoEjemploPassword?: string;
    };

    const db = ensureDb();
    const gerente = db.accounts.find((a) => a.username === 'Gerente');
    const admin = db.accounts.find((a) => a.username === 'Administrador');
    const tecEjemplo = db.accounts.find((a) => a.username === 'Carlos Mendoza');

    const envGerente = process.env.GERENTE_PASSCODE?.trim();
    const envAdmin = process.env.ADMIN_PASSCODE?.trim();
    const envTec = process.env.TECNICO_EJEMPLO_PASSCODE?.trim();

    const gerenteDone = Boolean(envGerente || gerente?.passwordHash);
    const adminDone = Boolean(envAdmin || admin?.passwordHash);
    const tecDone = !tecEjemplo || Boolean(envTec || tecEjemplo?.passwordHash);

    if (gerenteDone && adminDone && tecDone) {
      res.status(409).json({ error: 'Las claves iniciales ya fueron configuradas.' });
      return;
    }

    if (!gerenteDone) {
      if (!gerentePassword || gerentePassword.trim().length < 4) {
        res.status(400).json({ error: 'La contraseña de Gerente debe tener al menos 4 caracteres.' });
        return;
      }
      if (gerente) gerente.passwordHash = hashPassword(gerentePassword.trim());
    }

    if (!adminDone) {
      if (!adminPassword || adminPassword.trim().length < 4) {
        res.status(400).json({ error: 'La contraseña de Administrador debe tener al menos 4 caracteres.' });
        return;
      }
      if (admin) admin.passwordHash = hashPassword(adminPassword.trim());
    }

    if (!tecDone && tecEjemplo) {
      if (!tecnicoEjemploPassword || tecnicoEjemploPassword.trim().length < 4) {
        res.status(400).json({ error: 'La contraseña del técnico ejemplo debe tener al menos 4 caracteres.' });
        return;
      }
      tecEjemplo.passwordHash = hashPassword(tecnicoEjemploPassword.trim());
    }

    saveDb(db);
    res.json({ ok: true });
  });

  app.post('/api/auth/register-tecnico', (req, res) => {
    const { nombre, cargo, telefono, documento, password } = req.body as {
      nombre?: string;
      cargo?: string;
      telefono?: string;
      documento?: string;
      password?: string;
    };

    const cleanNombre = nombre?.trim() ?? '';
    if (cleanNombre.length < 3) {
      res.status(400).json({ error: 'Ingresa el nombre completo del técnico.' });
      return;
    }
    if (
      cleanNombre.toLowerCase() === 'gerente' ||
      cleanNombre.toLowerCase() === 'administrador'
    ) {
      res.status(400).json({ error: 'Ese nombre está reservado para las cuentas principales.' });
      return;
    }
    if (!password || password.trim().length < 4) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres.' });
      return;
    }

    const db = ensureDb();
    const duplicate = db.accounts.find(
      (a) => a.username.toLowerCase() === cleanNombre.toLowerCase()
    );
    if (duplicate) {
      res.status(409).json({ error: `Ya existe una cuenta registrada con el nombre "${cleanNombre}".` });
      return;
    }

    const existingCol = db.state.colaboradores.find(
      (c) => c.nombre.toLowerCase() === cleanNombre.toLowerCase() && c.rol === 'tecnico'
    );
    const newId = existingCol ? existingCol.id : `col-${Date.now().toString(36)}`;
    const cleanCargo = cargo?.trim() || 'Técnico de Campo';

    if (!existingCol) {
      db.state.colaboradores.push({
        id: newId,
        nombre: cleanNombre,
        cargo: cleanCargo,
        rol: 'tecnico',
        telefono: telefono?.trim() || 'Sin teléfono',
        fechaIngreso: new Date().toISOString().slice(0, 10),
        documento: documento?.trim() || 'Por registrar',
      });
    }

    const newAccount: StoredAccount = {
      id: newId,
      username: cleanNombre,
      nombre: cleanNombre,
      role: 'tecnico',
      cargo: cleanCargo,
      passwordHash: hashPassword(password.trim()),
      createdAt: new Date().toISOString(),
    };
    db.accounts.push(newAccount);
    saveDb(db);

    const authUser: AuthUser = {
      id: newAccount.id,
      username: newAccount.username,
      nombre: newAccount.nombre,
      role: newAccount.role,
      cargo: newAccount.cargo,
    };
    const token = signToken(authUser);
    res.status(201).json({ token, user: authUser });
  });

  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body as { username?: string; password?: string };
    const cleanUser = username?.trim() ?? '';
    const cleanPass = password?.trim() ?? '';

    if (!cleanUser || !cleanPass) {
      res.status(400).json({ error: 'Ingresa el nombre de cuenta y la contraseña.' });
      return;
    }

    const db = ensureDb();
    const account = db.accounts.find(
      (a) => a.username.toLowerCase() === cleanUser.toLowerCase()
    );
    if (!account) {
      res.status(401).json({ error: 'Cuenta no encontrada. Verifica el nombre o crea la cuenta del técnico.' });
      return;
    }

    // Check env override first for Gerente / Administrador / Ejemplo Técnico
    if (account.username === 'Gerente' && process.env.GERENTE_PASSCODE?.trim()) {
      const expected = Buffer.from(process.env.GERENTE_PASSCODE.trim());
      const actual = Buffer.from(cleanPass);
      if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
        res.status(401).json({ error: 'Contraseña incorrecta.' });
        return;
      }
    } else if (account.username === 'Administrador' && process.env.ADMIN_PASSCODE?.trim()) {
      const expected = Buffer.from(process.env.ADMIN_PASSCODE.trim());
      const actual = Buffer.from(cleanPass);
      if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
        res.status(401).json({ error: 'Contraseña incorrecta.' });
        return;
      }
    } else if (account.username === 'Carlos Mendoza' && process.env.TECNICO_EJEMPLO_PASSCODE?.trim()) {
      const expected = Buffer.from(process.env.TECNICO_EJEMPLO_PASSCODE.trim());
      const actual = Buffer.from(cleanPass);
      if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
        res.status(401).json({ error: 'Contraseña incorrecta.' });
        return;
      }
    } else {
      if (!account.passwordHash) {
        res.status(409).json({ error: 'Configura primero las claves iniciales de acceso.' });
        return;
      }
      if (!verifyPassword(cleanPass, account.passwordHash)) {
        res.status(401).json({ error: 'Contraseña incorrecta.' });
        return;
      }
    }

    const authUser: AuthUser = {
      id: account.id,
      username: account.username,
      nombre: account.nombre,
      role: account.role,
      cargo: account.cargo,
    };
    const token = signToken(authUser);
    res.json({ token, user: authUser });
  });

  app.get('/api/auth/me', (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    res.json({ user });
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = extractBearer(req);
    if (token) revokedTokens.add(token);
    res.json({ ok: true });
  });

  app.get('/api/state', (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    const db = ensureDb();
    if (user.role === 'tecnico') {
      const scoped: AlfaConectaState = {
        ...db.state,
        onboardings: db.state.onboardings.filter(
          (o) =>
            o.colaboradorId === user.id ||
            o.colaboradorNombre.toLowerCase() === user.nombre.toLowerCase()
        ),
        acuerdos: [],
      };
      res.json(scoped);
      return;
    }
    res.json(db.state);
  });

  app.put('/api/state', (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;
    const incoming = req.body as AlfaConectaState;
    if (!incoming || !Array.isArray(incoming.colaboradores) || !Array.isArray(incoming.servicios)) {
      res.status(400).json({ error: 'Estructura de estado inválida.' });
      return;
    }
    const db = ensureDb();
    if (user.role === 'tecnico') {
      // Preservar aprobaciones de solicitudes, conversaciones semestrales y onboardings de otros colaboradores
      if (Array.isArray(incoming.solicitudes)) {
        const prevById = new Map(db.state.solicitudes.map((s) => [s.id, s]));
        incoming.solicitudes = incoming.solicitudes.map((sol) => {
          const existing = prevById.get(sol.id);
          return existing ? { ...sol, estado: existing.estado } : { ...sol, estado: 'pendiente' };
        });
      }
      incoming.acuerdos = db.state.acuerdos;
      const ownUpdated = (incoming.onboardings ?? []).filter(
        (o) =>
          o.colaboradorId === user.id ||
          o.colaboradorNombre.toLowerCase() === user.nombre.toLowerCase()
      );
      const othersOnb = db.state.onboardings.filter(
        (o) =>
          o.colaboradorId !== user.id &&
          o.colaboradorNombre.toLowerCase() !== user.nombre.toLowerCase()
      );
      incoming.onboardings = [...ownUpdated, ...othersOnb];
    }
    db.state = incoming;
    saveDb(db);
    res.json({ ok: true });
  });

  app.post('/api/marcaciones', (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;

    const { servicioId, tipo, lat, lng, precisionMetros, observacion } = req.body as {
      servicioId?: string;
      tipo?: 'entrada' | 'salida';
      lat?: number;
      lng?: number;
      precisionMetros?: number;
      observacion?: string;
    };

    if (
      !servicioId ||
      (tipo !== 'entrada' && tipo !== 'salida') ||
      typeof lat !== 'number' ||
      typeof lng !== 'number'
    ) {
      res.status(400).json({ error: 'Datos de marcación o ubicación incompletos.' });
      return;
    }

    const db = ensureDb();
    const servicio = db.state.servicios.find((s) => s.id === servicioId);
    if (!servicio) {
      res.status(404).json({ error: 'Servicio asignado no encontrado.' });
      return;
    }

    const distanciaMetros = haversineMeters(lat, lng, servicio.lat, servicio.lng);
    const radioPermitido = servicio.radioMetros || 250;

    if (tipo === 'entrada' && distanciaMetros > radioPermitido) {
      res.status(403).json({
        error: `No puedes marcar entrada: estás a ${distanciaMetros} m del sitio (máximo permitido: ${radioPermitido} m).`,
        distanciaMetros,
      });
      return;
    }

    const nueva: MarcacionRecord = {
      id: `marc-${Date.now().toString(36)}`,
      colaboradorId: user.id,
      colaboradorNombre: user.nombre,
      servicioId: servicio.id,
      sitio: `${servicio.cliente} — ${servicio.direccion}`,
      tipo,
      fechaHora: new Date().toISOString(),
      lat,
      lng,
      precisionMetros: typeof precisionMetros === 'number' ? precisionMetros : 15,
      distanciaMetros,
      observacion: observacion?.trim() || undefined,
    };

    db.state.marcaciones = [nueva, ...db.state.marcaciones];
    if (tipo === 'entrada' && servicio.estado === 'programado') {
      servicio.estado = 'en_sitio';
    }
    saveDb(db);
    res.status(201).json({ record: nueva, state: db.state });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AlfaConecta server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start AlfaConecta server:', err);
  process.exit(1);
});
