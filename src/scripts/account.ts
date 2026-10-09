// Cuentas de cliente: Firebase Authentication (correo y contraseña) y Firestore Lite (ficha del cliente y sus pedidos).
// Solo lo cargan las páginas que lo usan (/cuenta/ y /tienda/pedido/); en el resto, la cabecera saluda con el nombre
// guardado en localStorage («fairino-cuenta») sin cargar Firebase. Configuración: site.accounts (src/data/site.ts).
// Reglas de seguridad de la base de datos: tools/firebase/firestore.rules.
import { initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Timestamp,
} from 'firebase/firestore/lite';
import { getConfig } from './config';
import { sendToInbox } from './forms';

export type { User };

export interface Profile {
  nombre: string;
  empresa: string;
  cif: string;
  telefono: string;
  email: string;
  direccion?: string;
  codigo_postal?: string;
  poblacion?: string;
  provincia?: string;
}

export interface OrderLine {
  id: string;
  nombre: string;
  version: string;
  incluye: string;
  cantidad: number;
  precio: number | null;
}

export interface Order {
  id: string;
  fecha: Date | null;
  estado: string;
  lineas: OrderLine[];
  total: number;
  pendiente: boolean;
}

const cfg = getConfig().accounts;
// Sin configuración de Firebase no se piden cuentas: la tienda funciona como antes.
export const enabled = Boolean(cfg?.firebase);
const app = enabled ? initializeApp(cfg.firebase!) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
if (auth) auth.languageCode = 'es';
if (auth && db && cfg.emulator) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

// Nombre para la cabecera en todas las páginas, sin cargar Firebase en ellas.
const HINT = 'fairino-cuenta';
function setHint(nombre: string | null) {
  try {
    if (nombre) localStorage.setItem(HINT, JSON.stringify({ nombre }));
    else localStorage.removeItem(HINT);
  } catch {
    /* sin almacenamiento */
  }
  window.dispatchEvent(new CustomEvent('account:change'));
}

// Llama a `fn` con el usuario cada vez que entra o sale (y al cargar, cuando Firebase recupera la sesión guardada).
export function onUser(fn: (u: User | null) => void) {
  if (!auth) return fn(null);
  onAuthStateChanged(auth, (u) => {
    setHint(u ? u.displayName || u.email : null);
    fn(u);
  });
}

export async function register(email: string, password: string, p: Omit<Profile, 'email'>) {
  const cred = await createUserWithEmailAndPassword(auth!, email, password);
  await updateProfile(cred.user, { displayName: p.nombre });
  setHint(p.nombre);
  await setDoc(doc(db!, 'clientes', cred.user.uid), { ...p, email, creado: serverTimestamp() });
  // Correo para confirmar la dirección (no bloquea la compra) y aviso a FAIRINO España del cliente nuevo.
  sendEmailVerification(cred.user).catch(() => {});
  sendToInbox({
    subject: `Nuevo cliente registrado: ${p.empresa || p.nombre}`,
    from_name: 'Web FAIRINO España',
    nombre: p.nombre,
    empresa: p.empresa,
    cif: p.cif,
    telefono: p.telefono,
    email,
  });
  return cred.user;
}

export const login = async (email: string, password: string) => (await signInWithEmailAndPassword(auth!, email, password)).user;
export const resetPassword = (email: string) => sendPasswordResetEmail(auth!, email);
export const resendVerification = (u: User) => sendEmailVerification(u);
export const logout = () => signOut(auth!);

export async function getProfile(u: User): Promise<Profile | null> {
  const snap = await getDoc(doc(db!, 'clientes', u.uid));
  return snap.exists() ? (snap.data() as Profile) : null;
}

export async function saveProfile(u: User, p: Partial<Profile>) {
  await setDoc(doc(db!, 'clientes', u.uid), p, { merge: true });
  if (p.nombre && p.nombre !== u.displayName) {
    await updateProfile(u, { displayName: p.nombre });
    setHint(p.nombre);
  }
}

export async function saveOrder(u: User, o: { lineas: OrderLine[]; subtotal: number; envio: number; total: number; pendiente: boolean; entrega: Partial<Profile> }) {
  const ref = await addDoc(collection(db!, 'pedidos'), { ...o, uid: u.uid, email: u.email, estado: 'Recibido', fecha: serverTimestamp() });
  return ref.id;
}

// Pedidos del cliente, del más reciente al más antiguo.
export async function myOrders(u: User): Promise<Order[]> {
  const snap = await getDocs(query(collection(db!, 'pedidos'), where('uid', '==', u.uid)));
  return snap.docs
    .map((d) => {
      const x = d.data();
      return {
        id: d.id,
        fecha: (x.fecha as Timestamp | null)?.toDate() ?? null,
        estado: x.estado ?? 'Recibido',
        lineas: (x.lineas ?? []) as OrderLine[],
        total: x.total ?? 0,
        pendiente: Boolean(x.pendiente),
      };
    })
    .sort((a, b) => (b.fecha?.getTime() ?? 0) - (a.fecha?.getTime() ?? 0));
}

// Borra la cuenta y la ficha. Los pedidos se conservan el tiempo que exige la ley (facturación).
export async function deleteAccount(u: User) {
  await deleteDoc(doc(db!, 'clientes', u.uid));
  await deleteUser(u);
  setHint(null);
}

// Mensajes de error en español para lo que puede pasar al entrar o registrarse.
export function errorText(e: unknown): string {
  const code = (e as { code?: string } | null)?.code ?? '';
  const map: Record<string, string> = {
    'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
    'auth/invalid-login-credentials': 'El correo o la contraseña no son correctos.',
    'auth/wrong-password': 'El correo o la contraseña no son correctos.',
    'auth/user-not-found': 'No hay ninguna cuenta con ese correo. Crea una nueva.',
    'auth/email-already-in-use': 'Ya hay una cuenta con ese correo. Inicia sesión o recupera tu contraseña.',
    'auth/invalid-email': 'El correo no es válido.',
    'auth/missing-password': 'Escribe tu contraseña.',
    'auth/weak-password': 'La contraseña tiene que tener al menos 8 caracteres.',
    'auth/too-many-requests': 'Demasiados intentos seguidos. Espera unos minutos y vuelve a probar.',
    'auth/network-request-failed': 'No hay conexión. Revisa tu internet y vuelve a probar.',
    'auth/requires-recent-login': 'Por seguridad, cierra sesión, vuelve a entrar y repítelo.',
    'auth/user-disabled': 'Esta cuenta está desactivada. Escríbenos y lo revisamos.',
    'permission-denied': 'No se han podido guardar los datos. Escríbenos y lo revisamos.',
  };
  return map[code] ?? 'Algo ha fallado. Vuelve a probar en un momento.';
}
