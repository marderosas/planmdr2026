/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged as firebaseOnAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, collection, query, where } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { EventState } from './types';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = (firebaseConfig as any).firestoreDatabaseId 
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId) 
  : getFirestore(app);

// Mock user interface that matches Firebase's User shape minimally
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  providerData: any[];
}

// Global active auth listeners
const listeners: Array<(user: User | null) => void> = [];

const notifyListeners = (user: User | null) => {
  listeners.forEach((callback) => {
    try {
      callback(user);
    } catch (e) {
      console.error(e);
    }
  });
};

// Get current active session from localStorage
const getCurrentActiveUser = (): User | null => {
  try {
    const saved = localStorage.getItem('eventia_current_user_local');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error(e);
  }
  return null;
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Translate security and database errors cleanly
export const handleFirestoreError = (err: any, operation: OperationType, path: string) => {
  console.error(`Firestore error in ${operation} on ${path}:`, err);
  if (err && (err.code === 'permission-denied' || (err.message && err.message.toLowerCase().includes('permission')))) {
    throw {
      error: 'permission-denied',
      operation: operation,
      path: path,
      message: 'Missing or insufficient permissions for this operation.'
    };
  }
  throw err;
};

// Sync Firebase Auth changes with local state
firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) {
    const user: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
      isAnonymous: firebaseUser.isAnonymous,
      providerData: [...firebaseUser.providerData]
    };
    localStorage.setItem('eventia_current_user_local', JSON.stringify(user));
    notifyListeners(user);
  } else {
    const current = getCurrentActiveUser();
    // Only clean session if logged in with real Google (local custom uids start with 'user-')
    if (current && !current.uid.startsWith('user-')) {
      localStorage.removeItem('eventia_current_user_local');
      notifyListeners(null);
    }
  }
});

export const onAuthStateChanged = (authObj: any, callback: (user: User | null) => void) => {
  listeners.push(callback);
  callback(getCurrentActiveUser());
  return () => {
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
};

const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    const user: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
      isAnonymous: firebaseUser.isAnonymous,
      providerData: [...firebaseUser.providerData]
    };
    
    // Seed Google user as registered user in Firestore collection
    try {
      const userDocRef = doc(db, 'registered_users', user.uid);
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Usuario Google',
          phone: '',
          rut: '',
          role: 'Planificador',
          updatedAt: new Date().toISOString()
        });
      }
    } catch (dbErr) {
      console.warn("Could not seed Google user in database:", dbErr);
    }

    localStorage.setItem('eventia_current_user_local', JSON.stringify(user));
    notifyListeners(user);
    return user;
  } catch (err: any) {
    console.error("Google login failed:", err);
    throw err;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (e) {
    console.error("Firebase signOut failed:", e);
  }
  localStorage.removeItem('eventia_current_user_local');
  notifyListeners(null);
};

export const loginWithEmail = async (email: string, password: string): Promise<User> => {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const q = query(collection(db, 'registered_users'), where('email', '==', cleanEmail));
    const qSnap = await getDocs(q);
    
    if (qSnap.empty) {
      // Seed default admin account if table is totally empty
      if (cleanEmail === 'admin@marderosas.cl' && password === 'admin123') {
        const defaultAdmin = {
          uid: 'user-admin',
          email: 'admin@marderosas.cl',
          password: 'admin123',
          displayName: 'Administrador Mar de Rosas',
          phone: '+56 9 1234 5678',
          rut: '12.345.678-9',
          role: 'Planificador',
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'registered_users', defaultAdmin.uid), defaultAdmin);
        
        const user: User = {
          uid: defaultAdmin.uid,
          email: defaultAdmin.email,
          displayName: defaultAdmin.displayName,
          photoURL: null,
          emailVerified: true,
          isAnonymous: false,
          providerData: []
        };
        localStorage.setItem('eventia_current_user_local', JSON.stringify(user));
        notifyListeners(user);
        return user;
      }
      
      const err = new Error('No existe un usuario con este correo electrónico.');
      (err as any).code = 'auth/user-not-found';
      throw err;
    }
    
    const foundDoc = qSnap.docs[0];
    const found = foundDoc.data();
    
    if (found.password !== password) {
      const err = new Error('Contraseña incorrecta.');
      (err as any).code = 'auth/wrong-password';
      throw err;
    }
    
    const user: User = {
      uid: found.uid,
      email: found.email,
      displayName: found.displayName,
      photoURL: null,
      emailVerified: true,
      isAnonymous: false,
      providerData: []
    };
    
    localStorage.setItem('eventia_current_user_local', JSON.stringify(user));
    notifyListeners(user);
    return user;
  } catch (err: any) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
      throw err;
    }
    return handleFirestoreError(err, OperationType.GET, 'registered_users');
  }
};

export const registerWithEmail = async (email: string, password: string, name?: string): Promise<User> => {
  const cleanEmail = email.trim().toLowerCase();
  
  if (password.length < 6) {
    const err = new Error('La contraseña debe tener al menos 6 caracteres.');
    (err as any).code = 'auth/weak-password';
    throw err;
  }
  
  try {
    const q = query(collection(db, 'registered_users'), where('email', '==', cleanEmail));
    const qSnap = await getDocs(q);
    
    if (!qSnap.empty) {
      const err = new Error('Este correo electrónico ya está en uso.');
      (err as any).code = 'auth/email-already-in-use';
      throw err;
    }
    
    const uid = 'user-' + Math.random().toString(36).substr(2, 9);
    const newUser = {
      uid,
      email: cleanEmail,
      password,
      displayName: name || 'Usuario Local',
      phone: '',
      rut: '',
      role: 'Planificador',
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'registered_users', uid), newUser);
    
    const user: User = {
      uid: newUser.uid,
      email: newUser.email,
      displayName: newUser.displayName,
      photoURL: null,
      emailVerified: true,
      isAnonymous: false,
      providerData: []
    };
    
    localStorage.setItem('eventia_current_user_local', JSON.stringify(user));
    notifyListeners(user);
    return user;
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use' || err.code === 'auth/weak-password') {
      throw err;
    }
    return handleFirestoreError(err, OperationType.CREATE, 'registered_users');
  }
};

export const fetchUserData = async (userId: string): Promise<EventState | null> => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as EventState;
    }
    return null;
  } catch (err) {
    return handleFirestoreError(err, OperationType.GET, `users/${userId}`);
  }
};

/**
 * Recursively removes 'undefined' properties from an object so that Firestore can serialize it properly.
 */
export function sanitizeFirestoreData(obj: any): any {
  if (obj === undefined) {
    return null;
  }
  if (obj === null) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeFirestoreData(item));
  }
  if (typeof obj === 'object') {
    const clean: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        clean[key] = sanitizeFirestoreData(val);
      }
    }
    return clean;
  }
  return obj;
}

export const saveUserDataToCloud = async (userId: string, data: EventState): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId);
    const rawData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    const cleanData = sanitizeFirestoreData(rawData);
    await setDoc(docRef, cleanData);
  } catch (err) {
    return handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
  }
};

// --- USER MANAGEMENT & BITACORA (AUDIT LOGS) ---

export interface BitacoraEntry {
  id: string;
  module: string;
  action: string;
  userEmail: string;
  userName: string;
  timestamp: string;
}

export const getBitacora = async (): Promise<BitacoraEntry[]> => {
  try {
    const qSnap = await getDocs(collection(db, 'audit_logs'));
    const list: BitacoraEntry[] = [];
    qSnap.forEach((doc) => {
      list.push(doc.data() as BitacoraEntry);
    });
    
    // Sort descending by timestamp text comparison
    list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return list;
  } catch (err) {
    console.error("Firestore error loading audit logs, using local fallback:", err);
    return getBitacoraLocal();
  }
};

const getBitacoraLocal = (): BitacoraEntry[] => {
  try {
    const saved = localStorage.getItem('eventia_bitacora_local');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error(e);
  }
  return [];
};

export const addBitacoraEntry = async (module: string, action: string) => {
  try {
    const currentUser = getCurrentActiveUser();
    const id = 'log-' + Math.random().toString(36).substr(2, 9);
    const newEntry: BitacoraEntry = {
      id,
      module,
      action,
      userEmail: currentUser?.email || 'sistema@marderosas.cl',
      userName: currentUser?.displayName || 'Organizador',
      timestamp: new Date().toLocaleString('es-CL'),
    };
    
    // Update local cache
    const logs = getBitacoraLocal();
    logs.unshift(newEntry);
    if (logs.length > 500) {
      logs.splice(500);
    }
    localStorage.setItem('eventia_bitacora_local', JSON.stringify(logs));
    
    // Save to Firestore
    await setDoc(doc(db, 'audit_logs', id), newEntry);
  } catch (e) {
    console.error('Error adding bitacora entry:', e);
  }
};

export const getRegisteredUsersPublic = async (): Promise<any[]> => {
  try {
    const qSnap = await getDocs(collection(db, 'registered_users'));
    const list: any[] = [];
    qSnap.forEach((doc) => {
      list.push(doc.data());
    });
    
    // Auto-seed default admin account if completely empty
    if (list.length === 0) {
      const defaultAdmin = {
        uid: 'user-admin',
        email: 'admin@marderosas.cl',
        password: 'admin123',
        displayName: 'Administrador Mar de Rosas',
        phone: '+56 9 1234 5678',
        rut: '12.345.678-9',
        role: 'Planificador',
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'registered_users', defaultAdmin.uid), defaultAdmin);
      list.push(defaultAdmin);
    }
    return list;
  } catch (err) {
    return handleFirestoreError(err, OperationType.LIST, 'registered_users');
  }
};

export const deleteRegisteredUser = async (uid: string): Promise<any[]> => {
  try {
    await deleteDoc(doc(db, 'registered_users', uid));
    await addBitacoraEntry('Configuración', `Usuario eliminado de la base de datos.`);
    return await getRegisteredUsersPublic();
  } catch (err) {
    return handleFirestoreError(err, OperationType.DELETE, `registered_users/${uid}`);
  }
};

export const updateRegisteredUser = async (uid: string, updatedFields: Partial<{ email: string; password?: string; displayName: string; phone?: string; rut?: string; role?: string }>): Promise<any[]> => {
  try {
    const userDocRef = doc(db, 'registered_users', uid);
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      throw new Error('Usuario no encontrado.');
    }
    
    const existingData = docSnap.data();
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };
    
    if (updatedFields.email) {
      const cleanEmail = updatedFields.email.trim().toLowerCase();
      const q = query(collection(db, 'registered_users'), where('email', '==', cleanEmail));
      const qSnap = await getDocs(q);
      const isTaken = qSnap.docs.some(doc => doc.id !== uid);
      if (isTaken) {
        throw new Error('Este correo electrónico ya está registrado por otro usuario.');
      }
      updateData.email = cleanEmail;
    }
    
    if (updatedFields.displayName !== undefined) {
      updateData.displayName = updatedFields.displayName;
    }
    if (updatedFields.password !== undefined && updatedFields.password !== '') {
      updateData.password = updatedFields.password;
    }
    if (updatedFields.phone !== undefined) {
      updateData.phone = updatedFields.phone;
    }
    if (updatedFields.rut !== undefined) {
      updateData.rut = updatedFields.rut;
    }
    if (updatedFields.role !== undefined) {
      updateData.role = updatedFields.role;
    }
    
    await updateDoc(userDocRef, updateData);
    
    const updatedUserDisplayName = updatedFields.displayName || existingData.displayName;
    const updatedUserEmail = updatedFields.email || existingData.email;
    await addBitacoraEntry('Configuración', `Usuario modificado: ${updatedUserDisplayName} (${updatedUserEmail})`);
    
    return await getRegisteredUsersPublic();
  } catch (err) {
    return handleFirestoreError(err, OperationType.UPDATE, `registered_users/${uid}`);
  }
};

export const addRegisteredUser = async (user: { email: string; password: string; displayName: string; phone?: string; rut?: string; role?: string }): Promise<any> => {
  try {
    const cleanEmail = user.email.trim().toLowerCase();
    const q = query(collection(db, 'registered_users'), where('email', '==', cleanEmail));
    const qSnap = await getDocs(q);
    if (!qSnap.empty) {
      throw new Error('Este correo electrónico ya está registrado.');
    }
    
    const uid = 'user-' + Math.random().toString(36).substr(2, 9);
    const newUser = {
      uid,
      email: cleanEmail,
      password: user.password,
      displayName: user.displayName || 'Usuario Local',
      phone: user.phone || '',
      rut: user.rut || '',
      role: user.role || 'Planificador',
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'registered_users', uid), newUser);
    await addBitacoraEntry('Configuración', `Usuario registrado: ${newUser.displayName} (${newUser.email})`);
    
    return newUser;
  } catch (err) {
    return handleFirestoreError(err, OperationType.CREATE, 'registered_users');
  }
};
