/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { EventState } from './types';
import { 
  sampleClients, 
  sampleChecklists, 
  sampleDayTimelines, 
  sampleProtocols, 
  sampleBudgetItems, 
  sampleInstallments, 
  sampleVendors, 
  sampleServiceOrders, 
  sampleGuests, 
  sampleTables, 
  sampleMoodImages,
  sampleFoodMenus
} from './data';

import CRMModule from './components/CRMModule';
import TimelineModule from './components/TimelineModule';
import BudgetModule from './components/BudgetModule';
import LogisticsModule from './components/LogisticsModule';
import AccessControlModule from './components/AccessControlModule';
import ClientPortal from './components/ClientPortal';
import InventoryModule, { initialInventory } from './components/InventoryModule';
import FoodMenuModule from './components/FoodMenuModule';
import EventHistoryModule from './components/EventHistoryModule';
import ConfigurationModule from './components/ConfigurationModule';

import { 
  loginWithGoogle, 
  loginWithEmail,
  registerWithEmail,
  logoutUser, 
  fetchUserData, 
  saveUserDataToCloud, 
  auth, 
  onAuthStateChanged,
  User,
  addBitacoraEntry
} from './firebase';

import { 
  Users, 
  Calendar, 
  DollarSign, 
  Truck, 
  QrCode, 
  UserCheck, 
  Layers, 
  RotateCcw, 
  Download, 
  Upload, 
  Heart, 
  Sparkles,
  Award,
  ChevronRight,
  Menu,
  X,
  Loader2,
  LogOut,
  AlertCircle,
  Package,
  Utensils,
  History,
  Archive,
  Settings,
  Check
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'eventia_crm_state_v1';

const initialEventState: EventState = {
  clients: [],
  checklist: {},
  dayTimeline: {},
  protocols: {},
  budgetItems: {},
  installments: {},
  vendors: [],
  serviceOrders: {},
  guests: {},
  tables: {},
  moodImages: {},
  inventory: [],
  selectedClientId: '',
  foodMenu: {},
  globalDishes: []
};

export default function App() {
  const [state, setState] = useState<EventState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Filter out sample clients c1, c2, c3
        const hasCustomClients = parsed.clients && parsed.clients.some((c: any) => c.id !== 'c1' && c.id !== 'c2' && c.id !== 'c3');
        if (!hasCustomClients) {
          // If no custom clients exist, reset to complete empty slate
          return initialEventState;
        } else {
          // If they have custom clients, filter out any sample data of c1, c2, c3
          parsed.clients = parsed.clients.filter((c: any) => c.id !== 'c1' && c.id !== 'c2' && c.id !== 'c3');
          
          if (parsed.checklist) {
            delete parsed.checklist['c1'];
            delete parsed.checklist['c2'];
            delete parsed.checklist['c3'];
          }
          if (parsed.dayTimeline) {
            delete parsed.dayTimeline['c1'];
            delete parsed.dayTimeline['c2'];
            delete parsed.dayTimeline['c3'];
          }
          if (parsed.protocols) {
            delete parsed.protocols['c1'];
            delete parsed.protocols['c2'];
            delete parsed.protocols['c3'];
          }
          if (parsed.budgetItems) {
            delete parsed.budgetItems['c1'];
            delete parsed.budgetItems['c2'];
            delete parsed.budgetItems['c3'];
          }
          if (parsed.installments) {
            delete parsed.installments['c1'];
            delete parsed.installments['c2'];
            delete parsed.installments['c3'];
          }
          if (parsed.serviceOrders) {
            delete parsed.serviceOrders['c1'];
            delete parsed.serviceOrders['c2'];
            delete parsed.serviceOrders['c3'];
          }
          if (parsed.guests) {
            delete parsed.guests['c1'];
            delete parsed.guests['c2'];
            delete parsed.guests['c3'];
          }
          if (parsed.tables) {
            delete parsed.tables['c1'];
            delete parsed.tables['c2'];
            delete parsed.tables['c3'];
          }
          if (parsed.moodImages) {
            delete parsed.moodImages['c1'];
            delete parsed.moodImages['c2'];
            delete parsed.moodImages['c3'];
          }
          if (parsed.foodMenu) {
            delete parsed.foodMenu['c1'];
            delete parsed.foodMenu['c2'];
            delete parsed.foodMenu['c3'];
          }
          
          // Filter out sample vendors too (v1 - v7)
          if (parsed.vendors) {
            parsed.vendors = parsed.vendors.filter((v: any) => !v.id.match(/^v[1-7]$/));
          }
          
          // Filter out sample inventory too (inv1 - inv8)
          if (parsed.inventory) {
            parsed.inventory = parsed.inventory.filter((inv: any) => !inv.id.match(/^inv[1-8]$/));
          }

          if (!parsed.inventory) {
            parsed.inventory = [];
          }
          if (!parsed.globalDishes) {
            parsed.globalDishes = [];
          }

          if (!parsed.selectedClientId || parsed.selectedClientId === 'c1' || parsed.selectedClientId === 'c2' || parsed.selectedClientId === 'c3') {
            parsed.selectedClientId = parsed.clients[0]?.id || '';
          }
          
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
    }
    return initialEventState;
  });

  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error' | 'local'>('local');

  // Listen for Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Initialize essential empty sub-objects if they aren't loaded from localStorage
  useEffect(() => {
    const updates: Partial<EventState> = {};
    let needsUpdate = false;
    
    if (!state.inventory || state.inventory.length === 0) {
      updates.inventory = initialInventory;
      needsUpdate = true;
    }
    if (!state.foodMenu || Object.keys(state.foodMenu).length === 0) {
      updates.foodMenu = sampleFoodMenus;
      needsUpdate = true;
    }
    if (!state.globalDishes || state.globalDishes.length === 0) {
      updates.globalDishes = [];
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      updateState(updates);
    }
  }, []);

  // Load data from cloud when user logs in
  useEffect(() => {
    if (currentUser && !isOfflineMode) {
      const loadCloudData = async () => {
        setIsLoadingCloud(true);
        try {
          const cloudData = await fetchUserData(currentUser.uid);
          if (cloudData) {
            setState(cloudData);
            setSyncStatus('synced');
          } else {
            // No data in cloud yet. Save the current local state to cloud.
            // This is perfect! If they created data on their computer before logging in,
            // or while offline, when they log in we push it to the cloud under their UID.
            await saveUserDataToCloud(currentUser.uid, state);
            setSyncStatus('synced');
          }
        } catch (err) {
          console.error("Error loading cloud data:", err);
          setSyncStatus('error');
        } finally {
          setIsLoadingCloud(false);
        }
      };
      loadCloudData();
    }
  }, [currentUser, isOfflineMode]);

  // Save state to localStorage immediately, and debounced to cloud on state changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    
    if (currentUser && !isOfflineMode && !isLoadingCloud) {
      setSyncStatus('saving');
      const timer = setTimeout(async () => {
        try {
          await saveUserDataToCloud(currentUser.uid, state);
          setSyncStatus('synced');
        } catch (err) {
          console.error("Error saving to cloud:", err);
          setSyncStatus('error');
        }
      }, 1500); // 1.5 second debounce
      
      return () => clearTimeout(timer);
    } else if (currentUser && !isOfflineMode && isLoadingCloud) {
      setSyncStatus('synced');
    } else {
      setSyncStatus('local');
    }
  }, [state, currentUser, isOfflineMode, isLoadingCloud]);

  // Synchronize dark/light theme to document element
  useEffect(() => {
    const theme = state.configurations?.theme || 'light';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.configurations?.theme]);

  // States for live QR scanner verification overlay (from URL query string)
  const [verificationGuest, setVerificationGuest] = useState<{ id: string; name: string; rsvp: string; companionCount: number; tableId: string | null; checkedIn?: boolean } | null>(null);
  const [verificationClient, setVerificationClient] = useState<{ id: string; name: string; eventName?: string } | null>(null);
  const [verificationTableName, setVerificationTableName] = useState<string>('General / Sin Mesa');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const guestId = params.get('verifyGuestId');
    const clientId = params.get('clientId');
    if (guestId && clientId) {
      // Find client
      const cl = state.clients.find(c => c.id === clientId);
      if (cl) {
        // Find guest list
        const guestList = state.guests[clientId] || [];
        const guest = guestList.find(g => g.id === guestId);
        if (guest) {
          // Find table name
          const tableList = state.tables[clientId] || [];
          const table = tableList.find(t => t.id === guest.tableId);
          
          setVerificationGuest(guest);
          setVerificationClient(cl);
          setVerificationTableName(table ? table.name : 'General / Sin Mesa');
          setVerificationError(null);
        } else {
          setVerificationError('No se encontró al invitado especificado en la nómina de este evento.');
        }
      } else {
        setVerificationError('No se encontró el evento correspondiente a este pase.');
      }
      // Clean query params so it doesn't pop up again on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [state.clients, state.guests, state.tables]);

  const handleConfirmVerificationCheckIn = () => {
    if (!verificationGuest || !verificationClient) return;
    
    const clientId = verificationClient.id;
    const guestId = verificationGuest.id;
    
    const guestList = state.guests[clientId] || [];
    const updatedGuests = guestList.map(g => {
      if (g.id === guestId) {
        return {
          ...g,
          checkedIn: true,
          checkedInTime: new Date().toLocaleTimeString()
        };
      }
      return g;
    });
    
    updateState({
      guests: {
        ...state.guests,
        [clientId]: updatedGuests
      }
    });
    
    addBitacoraEntry('Check-In QR', `Invitado ${verificationGuest.name} ingresó mediante escaneo de código QR.`);
    setVerificationSuccess(true);
    setTimeout(() => {
      setVerificationSuccess(false);
      setVerificationGuest(null);
      setVerificationClient(null);
    }, 3000);
  };

  // Current view mode: 'crm' | 'timeline' | 'budget' | 'logistics' | 'access' | 'inventory' | 'foodMenu' | 'history'
  const [currentView, setCurrentView] = useState<'crm' | 'timeline' | 'budget' | 'logistics' | 'access' | 'inventory' | 'foodMenu' | 'history' | 'configuracion'>('crm');
  
  // Current user role view: 'planner' | 'client'
  const [userRole, setUserRole] = useState<'planner' | 'client'>('planner');

  // Mobile menu open
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      if (authMode === 'login') {
        const u = await loginWithEmail(authEmail, authPassword);
        addBitacoraEntry('Sesión', `Inicio de sesión exitoso: ${u.displayName} (${u.email})`);
      } else {
        if (!authName.trim()) {
          throw new Error('Por favor ingrese su nombre.');
        }
        const u = await registerWithEmail(authEmail, authPassword, authName);
        addBitacoraEntry('Sesión', `Registro de nuevo usuario: ${u.displayName} (${u.email})`);
      }
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Error en la autenticación. Intente nuevamente.';
      if (err.code === 'auth/wrong-password') {
        errorMsg = 'Contraseña incorrecta.';
      } else if (err.code === 'auth/user-not-found') {
        errorMsg = 'No existe un usuario con este correo electrónico.';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'Este correo electrónico ya está en uso.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Correo electrónico inválido.';
      } else if (err.code === 'auth/operation-not-allowed' || (err.message && err.message.includes('operation-not-allowed'))) {
        errorMsg = 'El inicio de sesión por Correo/Contraseña no está habilitado en la Consola de Firebase. Por favor, ve a tu consola de Firebase > Authentication > Sign-in method y habilita el proveedor "Correo electrónico/contraseña".';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setAuthError(errorMsg);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const selectedClient = state.clients.find(c => c.id === state.selectedClientId) || state.clients[0];

  const activeClients = useMemo(() => {
    return state.clients.filter(c => c.status !== 'completado');
  }, [state.clients]);

  const updateState = (newState: Partial<EventState>) => {
    setState(prev => ({ ...prev, ...newState } as EventState));
  };

  // Reset database function
  const handleResetDatabase = () => {
    setShowResetConfirm(true);
  };

  const confirmResetDatabase = () => {
    addBitacoraEntry('Configuración', 'Se vació la base de datos por completo.');
    setState(initialEventState);
    setCurrentView('crm');
    setUserRole('planner');
    setShowResetConfirm(false);
  };

  // Export Database
  const handleExportDatabase = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    
    downloadAnchor.setAttribute("download", `eventia_backup_${timestamp}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Database
  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && parsed.clients && parsed.checklist) {
            setState(parsed);
            alert('¡Base de datos importada con éxito!');
          } else {
            alert('El archivo no parece ser un respaldo válido de Eventia.');
          }
        } catch (err) {
          alert('Error al leer el archivo de respaldo.');
        }
      };
    }
  };

  const handleViewClientPortal = (clientId: string) => {
    updateState({ selectedClientId: clientId });
    setUserRole('client');
  };

  // Render loading screen while checking auth or loading cloud database
  if (isLoadingCloud) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl flex flex-col items-center max-w-sm w-full text-center space-y-5">
          <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 animate-bounce">
            <Heart className="w-8 h-8 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-sans">Mar de Rosas</h1>
            <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mt-1">Conectando a base de datos</p>
          </div>
          <div className="flex flex-col items-center gap-2 text-slate-400 text-sm font-medium justify-center">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span>Sincronizando tus datos seguros...</span>
            </div>
          </div>
          
          <div className="pt-2 border-t border-slate-100 w-full">
            <button
              onClick={() => {
                localStorage.setItem('eventia_offline_mode_v1', 'true');
                setIsOfflineMode(true);
                setIsLoadingCloud(false);
              }}
              className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 text-emerald-800 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Trabajar sin conexión (Modo Local)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render client portal if chosen
  if (userRole === 'client') {
    return (
      <ClientPortal
        state={state}
        updateState={updateState}
        onExitPortal={() => setUserRole('planner')}
      />
    );
  }

  // If user is not authenticated, render the login screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-8 space-y-6 text-center animate-fade-in">
          {/* Logo / Title */}
          <div className="flex flex-col items-center space-y-3">
            <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
              <Heart className="w-8 h-8 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-sans">Mar de Rosas</h1>
              <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mt-1">CRM de Gestión de Eventos</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-xs text-rose-600 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 pl-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Ej: Sofia y Diego"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 pl-1">Correo Electrónico</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 pl-1">Contraseña</label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-100 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {authSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                authMode === 'login' ? 'Iniciar Sesión' : 'Registrar Cuenta'
              )}
            </button>
          </form>

          {/* Switch mode */}
          <div className="text-xs text-slate-500">
            {authMode === 'login' ? (
              <p>
                ¿No tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError(null);
                  }}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Registrarse
                </button>
              </p>
            ) : (
              <p>
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError(null);
                  }}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Iniciar Sesión
                </button>
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-150"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">o continuar con</span>
            <div className="flex-grow border-t border-slate-150"></div>
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={async () => {
              setAuthError(null);
              try {
                await loginWithGoogle();
              } catch (err: any) {
                let errorMsg = 'Error al iniciar sesión con Google. Intente nuevamente.';
                if (err.code === 'auth/operation-not-allowed' || (err.message && err.message.includes('operation-not-allowed'))) {
                  errorMsg = 'El inicio de sesión con Google no está habilitado en la Consola de Firebase. Por favor, ve a tu consola de Firebase > Authentication > Sign-in method y habilita el proveedor "Google".';
                } else if (err.message) {
                  errorMsg = err.message;
                }
                setAuthError(errorMsg);
              }
            }}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Cuenta Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-800">
      
      {/* SaaS Global Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-xs">
        
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <div className="text-left">
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight font-sans">
              Mar de Rosas <span className="text-indigo-600 text-xs font-normal bg-indigo-50 px-1.5 py-0.5 rounded-sm">Planner CRM</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Plataforma Profesional de Eventos</p>
          </div>
        </div>

        {/* Global Client selector dropdown in header */}
        <div className="hidden md:flex items-center gap-3">
          <span className="text-xs text-slate-500 font-semibold">Evento Activo:</span>
          {activeClients.length > 0 ? (
            <select
              id="global_client_select"
              value={state.selectedClientId}
              onChange={(e) => updateState({ selectedClientId: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-hidden focus:border-indigo-500"
            >
              {activeClients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.eventName} ({c.eventDate})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-slate-400 italic">Ningún evento activo registrado</span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          
          {/* Backup / Restore controls */}
          <div className="hidden lg:flex items-center gap-1.5">
            <button
              onClick={handleExportDatabase}
              className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-xl transition-all cursor-pointer"
              title="Exportar Respaldo JSON"
            >
              <Download className="w-4.5 h-4.5" />
            </button>
            <label 
              className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-xl transition-all cursor-pointer"
              title="Importar Respaldo JSON"
            >
              <Upload className="w-4.5 h-4.5" />
              <input
                type="file"
                accept=".json"
                onChange={handleImportDatabase}
                className="hidden"
              />
            </label>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden lg:block mx-1" />

          {/* Google Cloud Sync Status / Auth Profile */}
          <div className="flex items-center gap-2">
            {currentUser && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 rounded-xl py-1 pl-1.5 pr-2.5 hover:bg-slate-100/80 transition-all">
                {/* User avatar or letter */}
                <div className="w-6.5 h-6.5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center uppercase">
                  {(currentUser.displayName || currentUser.email || 'OL')[0].toUpperCase()}
                </div>
                
                {/* User Info & Sync indicator */}
                <div className="text-left hidden md:block">
                  <span className="text-[11px] font-bold text-slate-700 block leading-tight max-w-[100px] truncate">
                    {currentUser.displayName || 'Organizador'}
                  </span>
                  
                  {/* Sync status */}
                  <div className="flex items-center gap-1 leading-none mt-0.5">
                    {syncStatus === 'synced' && (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] text-emerald-600 font-bold tracking-wide uppercase">Sincronizado</span>
                      </>
                    )}
                    {syncStatus === 'saving' && (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                        <span className="text-[8px] text-amber-600 font-bold tracking-wide uppercase">Guardando...</span>
                      </>
                    )}
                    {syncStatus === 'error' && (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-[8px] text-rose-600 font-bold tracking-wide uppercase">Error de sinc.</span>
                      </>
                    )}
                    {syncStatus === 'local' && (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span className="text-[8px] text-slate-500 font-bold tracking-wide uppercase">Modo Local</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>



          {/* Mobile Hamburguer Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg md:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </header>

      {/* Mobile Active Client Dropdown Banner */}
      <div className="bg-indigo-50 border-b border-indigo-100 py-2 px-6 flex md:hidden items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-indigo-700">Evento Activo:</span>
        {activeClients.length > 0 ? (
          <select
            value={state.selectedClientId}
            onChange={(e) => updateState({ selectedClientId: e.target.value })}
            className="bg-white border border-indigo-200 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-700 outline-hidden"
          >
            {activeClients.map(c => (
              <option key={c.id} value={c.id}>{c.eventName}</option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-slate-400 italic">Ningún evento activo registrado</span>
        )}
      </div>

      {/* Main SaaS Workspace Container */}
      <div className="flex flex-1 flex-col md:flex-row max-w-[1400px] mx-auto w-full p-4 lg:p-6 gap-6">
        
        {/* LEFT WORKSPACE NAVIGATION: SIDEBAR */}
        <aside className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block md:w-56 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col justify-between h-[calc(100vh-10rem)] md:h-auto`}>
          
          <div className="space-y-6">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider text-left pl-2 select-none">Módulos de Gestión</span>
            
            <nav className="space-y-1">
              <button
                id="sidebar_tab_crm"
                onClick={() => { setCurrentView('crm'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                  currentView === 'crm' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4.5 h-4.5" />
                  <span>Clientes & CRM</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                id="sidebar_tab_timeline"
                onClick={() => { setCurrentView('timeline'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                  currentView === 'timeline' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4.5 h-4.5" />
                  <span>Cronograma</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                id="sidebar_tab_budget"
                onClick={() => { setCurrentView('budget'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                  currentView === 'budget' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-4.5 h-4.5" />
                  <span>Presupuesto</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                id="sidebar_tab_logistics"
                onClick={() => { setCurrentView('logistics'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                  currentView === 'logistics' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4.5 h-4.5" />
                  <span>Logística & Mesas</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                id="sidebar_tab_access"
                onClick={() => { setCurrentView('access'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                  currentView === 'access' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <QrCode className="w-4.5 h-4.5" />
                  <span>Accesos RSVP</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                id="sidebar_tab_inventory"
                onClick={() => { setCurrentView('inventory'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                  currentView === 'inventory' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4.5 h-4.5" />
                  <span>Inventario Utensilios</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                id="sidebar_tab_food_menu"
                onClick={() => { setCurrentView('foodMenu'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                  currentView === 'foodMenu' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Utensils className="w-4.5 h-4.5" />
                  <span>Menú de comidas</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                id="sidebar_tab_history"
                onClick={() => { setCurrentView('history'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                  currentView === 'history' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Archive className="w-4.5 h-4.5" />
                  <span>Historial de eventos</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                id="sidebar_tab_configuration"
                onClick={() => { setCurrentView('configuracion'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                  currentView === 'configuracion' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4.5 h-4.5" />
                  <span>Configuración</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            </nav>
          </div>

          {/* Quick info panel at bottom of sidebar */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-left space-y-1.5 mt-6 hidden md:block">
            <div className="flex items-center gap-1 text-slate-700">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-bold text-[10px] uppercase">Plan Activo</span>
            </div>
            <p className="text-[11px] font-bold text-slate-800">Plan Agencia Premium</p>
            <p className="text-[10px] text-slate-400 leading-normal">Permite crear eventos ilimitados y accesos para pases QR en puerta.</p>
          </div>

          {/* Sign out button at the bottom of the sidebar */}
          <div className="mt-auto pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50/60 transition-all text-left cursor-pointer group"
            >
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
              <span>Salir del Sistema</span>
            </button>
          </div>

        </aside>

        {/* RIGHT WORKSPACE SHEET: ACTIVE MODULE CONTAINER */}
        <main className="flex-1 min-w-0">
          
          {currentView === 'crm' && (
            <CRMModule 
              state={state} 
              updateState={updateState} 
              onViewClientPortal={handleViewClientPortal}
            />
          )}

          {currentView === 'timeline' && (
            <TimelineModule 
              state={state} 
              updateState={updateState} 
            />
          )}

          {currentView === 'budget' && (
            <BudgetModule 
              state={state} 
              updateState={updateState} 
            />
          )}

          {currentView === 'logistics' && (
            <LogisticsModule 
              state={state} 
              updateState={updateState} 
            />
          )}

          {currentView === 'access' && (
            <AccessControlModule 
              state={state} 
              updateState={updateState} 
            />
          )}

          {currentView === 'inventory' && (
            <InventoryModule 
              state={state} 
              updateState={updateState} 
            />
          )}

          {currentView === 'foodMenu' && (
            <FoodMenuModule 
              state={state} 
              updateState={updateState} 
            />
          )}

          {currentView === 'history' && (
            <EventHistoryModule 
              state={state} 
              updateState={updateState} 
            />
          )}

          {currentView === 'configuracion' && (
            <ConfigurationModule 
              state={state} 
              updateState={updateState} 
              onResetDatabase={handleResetDatabase}
            />
          )}

        </main>

      </div>

      {/* Database Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full overflow-hidden animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-6 h-6 animate-spin-reverse" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">¿Vaciar Base de Datos?</h3>
              <p className="text-xs text-slate-500 mb-6">
                ¿Está seguro de que desea limpiar todos los registros de la base de datos? Se perderán todos sus datos actuales de forma permanente para comenzar desde cero.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-500 font-bold text-xs rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmResetDatabase}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-md shadow-rose-100 transition-all cursor-pointer"
                >
                  Vaciar todo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full overflow-hidden animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-6 h-6 text-slate-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">
                {isOfflineMode ? '¿Salir del Modo Local / Conectarse?' : '¿Salir del Sistema?'}
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                {isOfflineMode 
                  ? '¿Está seguro de que desea salir del modo local? Sus datos se mantendrán guardados en este navegador para cuando regrese.'
                  : '¿Está seguro de que desea salir del sistema? Deberá iniciar sesión nuevamente para acceder.'}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-500 font-bold text-xs rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (isOfflineMode) {
                      localStorage.removeItem('eventia_offline_mode_v1');
                      setIsOfflineMode(false);
                    } else {
                      addBitacoraEntry('Sesión', 'Cierre de sesión de usuario.');
                      await logoutUser();
                    }
                    setShowLogoutConfirm(false);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
                >
                  {isOfflineMode ? 'Volver a Iniciar Sesión / Conectar' : 'Salir del Sistema'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REAL QR CODE ACCESSIBILITY VERIFIER OVERLAY */}
      {(verificationGuest || verificationError) && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
            
            {/* Header branding */}
            <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 px-6 py-5 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-8 -mb-8" />
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <QrCode className="w-5 h-5 text-indigo-300" />
                <span className="text-[11px] font-bold tracking-widest text-indigo-300 uppercase block">VERIFICADOR DE ACCESO EVENTIA</span>
              </div>
              <h2 className="text-base font-extrabold tracking-tight">Verificación de Invitación</h2>
            </div>

            <div className="p-6 text-center space-y-4">
              {verificationError ? (
                <div className="space-y-4 py-3">
                  <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-500">
                    <X className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 text-sm">Pase QR Inválido</h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                      {verificationError}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationError(null);
                      setVerificationGuest(null);
                      setVerificationClient(null);
                    }}
                    className="mt-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Cerrar Verificador
                  </button>
                </div>
              ) : verificationGuest && verificationClient ? (
                <div className="space-y-4">
                  {verificationSuccess ? (
                    <div className="space-y-4 py-6 animate-scale-in">
                      <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                        <UserCheck className="w-9 h-9" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-extrabold text-slate-800 text-base">¡Check-In Realizado con Éxito!</h3>
                        <p className="text-xs text-emerald-600 font-bold bg-emerald-50 py-1.5 px-3 rounded-full inline-block">
                          Ingreso Registrado en la Bitácora
                        </p>
                        <p className="text-[11px] text-slate-500 pt-2 leading-relaxed">
                          Se ha registrado la hora de entrada para <b>{verificationGuest.name}</b> en el sistema del planificador. ¡Que disfrute del evento!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      
                      {/* Ticket details card */}
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-3.5">
                        
                        <div className="border-b border-slate-200/60 pb-2 flex justify-between items-start">
                          <div>
                            <span className="text-[8px] font-bold text-indigo-600 uppercase tracking-widest block mb-0.5">EVENTO</span>
                            <span className="font-extrabold text-slate-800 text-xs truncate max-w-[220px] block">
                              {verificationClient.eventName || verificationClient.name}
                            </span>
                          </div>
                          <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                            Pase Activo
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">INVITADO</span>
                            <span className="font-bold text-slate-800 text-xs block">{verificationGuest.name}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">ASIGNACIÓN DE MESA</span>
                            <span className="font-bold text-indigo-600 text-xs block font-mono">{verificationTableName}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-1">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">ACOMPAÑANTES</span>
                            <span className="font-bold text-slate-800 text-xs block">
                              {verificationGuest.companionCount > 0 ? `${verificationGuest.companionCount} persona(s)` : 'Ninguno'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">ESTADO INGRESO</span>
                            {verificationGuest.checkedIn ? (
                              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Ya ingresó
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-600 font-bold">Pendiente de Ingreso</span>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Prompt check in button */}
                      <div className="flex flex-col gap-2 pt-2">
                        {!verificationGuest.checkedIn ? (
                          <button
                            type="button"
                            onClick={handleConfirmVerificationCheckIn}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-100 transition-colors cursor-pointer animate-pulse"
                          >
                            <UserCheck className="w-4.5 h-4.5" />
                            Confirmar Entrada (Check-In)
                          </button>
                        ) : (
                          <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600 font-medium">
                            Este invitado ya fue verificado e ingresó al recinto.
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setVerificationGuest(null);
                            setVerificationClient(null);
                          }}
                          className="w-full py-2.5 hover:bg-slate-100 text-slate-500 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          Cerrar Verificador
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              ) : null}

            </div>

          </div>
        </div>
      )}

      {/* Global CSS animation injections */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
        .animate-scale-in { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-in { animation: slideIn 0.25s ease-out forwards; }
      `}</style>

    </div>
  );
}
