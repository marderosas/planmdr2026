/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Guest, Table, EventState } from '../types';
import { Users, Plus, Check, Search, Calendar, UserCheck, X, QrCode, ScanLine, Smartphone, CheckSquare, Shield, Smile, Sparkles, Trash, Download, Printer } from 'lucide-react';

interface AccessControlModuleProps {
  state: EventState;
  updateState: (newState: Partial<EventState>) => void;
}

export default function AccessControlModule({ state, updateState }: AccessControlModuleProps) {
  const selectedClientId = state.selectedClientId;
  const client = state.clients.find(c => c.id === selectedClientId) || state.clients[0];

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRsvp, setFilterRsvp] = useState<Guest['rsvp'] | 'todos'>('todos');

  // Form states
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [newGuest, setNewGuest] = useState({
    name: '',
    email: '',
    phone: '',
    tableId: '',
    rsvp: 'confirmado' as Guest['rsvp'],
    companionCount: 0
  });

  // Selected guest for QR Pass modal
  const [selectedPassGuest, setSelectedPassGuest] = useState<Guest | null>(null);
  const [qrMode, setQrMode] = useState<'link' | 'text'>('link');

  // Scanner Simulator States
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scannedGuest, setScannedGuest] = useState<Guest | null>(null);

  if (!client) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-xs">
        <div className="p-3 bg-slate-50 text-slate-400 rounded-full w-fit mx-auto mb-3">
          <Users className="w-6 h-6 text-indigo-500" />
        </div>
        <p className="text-slate-500 font-bold text-sm">No hay eventos activos</p>
        <p className="text-xs text-slate-400 mt-1">Por favor registre un cliente y evento en la pestaña CRM para comenzar.</p>
      </div>
    );
  }

  const guests = state.guests[client.id] || [];
  const tables = state.tables[client.id] || [];

  // Filtered Guests
  const filteredGuests = guests.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          g.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRsvp = filterRsvp === 'todos' || g.rsvp === filterRsvp;
    return matchesSearch && matchesRsvp;
  });

  // Calculations
  const totalGuests = guests.reduce((sum, g) => sum + 1 + g.companionCount, 0);
  const confirmedCount = guests.filter(g => g.rsvp === 'confirmado').reduce((sum, g) => sum + 1 + g.companionCount, 0);
  const checkedInCount = guests.filter(g => g.rsvp === 'confirmado' && g.checkedIn).reduce((sum, g) => sum + 1 + g.companionCount, 0);

  // Add guest
  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuest.name) return;

    const guest: Guest = {
      id: 'g_' + Date.now(),
      name: newGuest.name,
      email: newGuest.email,
      phone: newGuest.phone,
      tableId: newGuest.tableId || null,
      rsvp: newGuest.rsvp,
      companionCount: Number(newGuest.companionCount),
      checkedIn: false
    };

    updateState({
      guests: {
        ...state.guests,
        [client.id]: [...guests, guest]
      }
    });

    setNewGuest({
      name: '',
      email: '',
      phone: '',
      tableId: '',
      rsvp: 'confirmado',
      companionCount: 0
    });
    setIsAddingGuest(false);
  };

  // Toggle Check-In status manually
  const handleToggleCheckIn = (guestId: string) => {
    const updated = guests.map(g => {
      if (g.id === guestId) {
        const nextState = !g.checkedIn;
        return {
          ...g,
          checkedIn: nextState,
          checkedInTime: nextState ? new Date().toLocaleTimeString() : undefined
        };
      }
      return g;
    });

    updateState({
      guests: {
        ...state.guests,
        [client.id]: updated
      }
    });
  };

  // Delete guest
  const handleDeleteGuest = (guestId: string) => {
    updateState({
      guests: {
        ...state.guests,
        [client.id]: guests.filter(g => g.id !== guestId)
      }
    });
  };

  // Simulate QR Code scan
  const handleSimulateScan = (guestId: string) => {
    const targetGuest = guests.find(g => g.id === guestId);
    if (!targetGuest) return;

    setIsScanning(true);
    setScanMessage('Apuntando pase digital de acceso...');
    setScannedGuest(null);

    // Simulated camera reading speed delay
    setTimeout(() => {
      if (targetGuest.rsvp !== 'confirmado') {
        setScanMessage('ERROR: El invitado NO tiene asistencia confirmada.');
        setIsScanning(false);
        return;
      }

      const updated = guests.map(g => {
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
          [client.id]: updated
        }
      });

      setScannedGuest(targetGuest);
      setScanMessage('¡ACCESO AUTORIZADO!');
      setIsScanning(false);
    }, 1200);
  };

  return (
    <div id="access_control_module" className="space-y-6">
      
      {/* Context header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
        <div className="text-left">
          <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">Control de Accesos & RSVP</span>
          <h2 className="text-lg font-bold text-slate-800">{client?.eventName || 'Seleccione un Evento'}</h2>
        </div>
      </div>

      {/* DASHBOARD ACCESS METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Invitados</span>
          <p className="text-lg font-extrabold text-slate-800 mt-1">{totalGuests} pers.</p>
          <span className="text-[10px] text-slate-400 block mt-0.5">Incluye acompañantes</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Asistencia RSVP</span>
          <p className="text-lg font-extrabold text-indigo-600 mt-1">{confirmedCount} confirmados</p>
          <div className="w-full bg-slate-100 rounded-full h-1 mt-2">
            <div 
              className="bg-indigo-600 h-1 rounded-full" 
              style={{ width: `${totalGuests > 0 ? (confirmedCount / totalGuests) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Ingresados (Check-In)</span>
          <p className="text-lg font-extrabold text-emerald-600 mt-1">{checkedInCount} ingresados</p>
          <div className="w-full bg-slate-100 rounded-full h-1 mt-2">
            <div 
              className="bg-emerald-500 h-1 rounded-full" 
              style={{ width: `${confirmedCount > 0 ? (checkedInCount / confirmedCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Por Ingresar</span>
          <p className="text-lg font-extrabold text-amber-600 mt-1">{confirmedCount - checkedInCount} restantes</p>
          <span className="text-[10px] text-amber-500 block mt-0.5 font-medium">Esperando en puerta</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: GUEST LIST MANAGER */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Lista Digital de Invitados</h4>
              <p className="text-xs text-slate-500 mt-0.5">Control de invitaciones QR y distribución de mesas</p>
            </div>

            <button
              id="btn_add_guest"
              onClick={() => setIsAddingGuest(!isAddingGuest)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {isAddingGuest ? 'Cancelar' : 'Agregar Invitado'}
            </button>
          </div>

          {/* Add Guest Form */}
          {isAddingGuest && (
            <form onSubmit={handleAddGuest} className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 animate-slide-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    value={newGuest.name}
                    onChange={(e) => setNewGuest({...newGuest, name: e.target.value})}
                    placeholder="ej: Sra. Elena Gómez"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Acompañantes</label>
                  <input
                    type="number"
                    value={newGuest.companionCount}
                    onChange={(e) => setNewGuest({...newGuest, companionCount: Number(e.target.value)})}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={newGuest.email}
                    onChange={(e) => setNewGuest({...newGuest, email: e.target.value})}
                    placeholder="invitado@correo.com"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono Móvil</label>
                  <input
                    type="text"
                    value={newGuest.phone}
                    onChange={(e) => setNewGuest({...newGuest, phone: e.target.value})}
                    placeholder="+56 9 1234 5678"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mesa Asignada</label>
                  <select
                    value={newGuest.tableId}
                    onChange={(e) => setNewGuest({...newGuest, tableId: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500"
                  >
                    <option value="">-- Sin Mesa / Recepción General --</option>
                    {tables.map(t => (
                      <option key={t.id} value={t.id}>{t.name} (Capacidad: {t.capacity})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Asistencia RSVP</label>
                  <select
                    value={newGuest.rsvp}
                    onChange={(e) => setNewGuest({...newGuest, rsvp: e.target.value as Guest['rsvp']})}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 outline-hidden"
                  >
                    <option value="confirmado">Confirmado</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="declinado">Declinado</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 rounded-lg cursor-pointer"
              >
                Inscribir Invitado
              </button>
            </form>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar invitado por nombre o correo..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500"
              />
            </div>
            
            <select
              value={filterRsvp}
              onChange={(e) => setFilterRsvp(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 outline-hidden"
            >
              <option value="todos">Todos los RSVP</option>
              <option value="confirmado">Confirmados</option>
              <option value="pendiente">Pendientes</option>
              <option value="declinado">Declinados</option>
            </select>
          </div>

          {/* Interactive Guest Grid / Table */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {filteredGuests.map(g => {
              const table = tables.find(t => t.id === g.tableId);
              return (
                <div
                  id={`guest_row_${g.id}`}
                  key={g.id}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                    g.checkedIn 
                      ? 'border-emerald-100 bg-emerald-50/10' 
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5 text-left">
                    {/* Checkbox for quick check-in */}
                    <button
                      id={`check_guest_${g.id}`}
                      type="button"
                      disabled={g.rsvp !== 'confirmado'}
                      onClick={() => handleToggleCheckIn(g.id)}
                      className={`mt-1 p-0.5 rounded-md border ${
                        g.checkedIn 
                          ? 'bg-emerald-500 border-emerald-600 text-white' 
                          : 'border-slate-300 hover:border-indigo-500 text-transparent'
                      } ${g.rsvp !== 'confirmado' ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    <div>
                      <span className="font-semibold text-slate-800 text-xs block">{g.name}</span>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                        <span className={`px-1.5 py-0.5 rounded-sm font-semibold uppercase ${
                          g.rsvp === 'confirmado' ? 'bg-emerald-100 text-emerald-800' :
                          g.rsvp === 'pendiente' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          RSVP: {g.rsvp}
                        </span>
                        
                        <span>•</span>
                        <span>Acompañantes: <b>{g.companionCount}</b></span>
                        
                        <span>•</span>
                        <span className="bg-slate-100 text-slate-700 px-1.5 rounded-sm font-medium">
                          {table ? table.name : 'Sin mesa asignada'}
                        </span>

                        {g.checkedIn && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 font-bold">Ingresado {g.checkedInTime}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: QR Code / Delete */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {g.rsvp === 'confirmado' && (
                      <button
                        id={`btn_guest_pass_${g.id}`}
                        onClick={() => setSelectedPassGuest(g)}
                        className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-md cursor-pointer"
                        title="Ver Pase Digital"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        Pase QR
                      </button>
                    )}

                    <button
                      id={`delete_guest_${g.id}`}
                      onClick={() => handleDeleteGuest(g.id)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer hover:bg-slate-100"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}

            {filteredGuests.length === 0 && (
              <p className="text-slate-400 text-xs text-center py-10">No se encontraron invitados con los criterios de búsqueda.</p>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: SIMULATED MOBILE QR ACCESS SCANNER */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Smartphone className="w-4.5 h-4.5 text-indigo-600" />
              Check-In Móvil Simulado
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">Control de acceso digital en la puerta el día del evento</p>
          </div>

          {/* Smartphone Frame Container */}
          <div className="max-w-[280px] mx-auto bg-slate-950 p-4 rounded-[2.5rem] border-8 border-slate-800 shadow-xl flex flex-col">
            
            {/* Screen Header */}
            <div className="flex justify-between items-center px-2 py-1 text-[9px] text-slate-500 font-mono border-b border-slate-900 mb-3 select-none">
              <span>VA-SCAN v4.2</span>
              <span className="bg-emerald-950 text-emerald-400 px-1 rounded-sm">CONECTADO</span>
            </div>

            {/* Simulated camera scanning frame */}
            <div className="relative bg-slate-900 border border-slate-800 rounded-xl aspect-square flex flex-col items-center justify-center p-4 overflow-hidden mb-4">
              
              {/* Scan box laser lines */}
              <div className="absolute inset-4 border border-indigo-500/40 pointer-events-none rounded-lg">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-400" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-400" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-400" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-400" />
                
                {/* Simulated pulsing laser line */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-red-500/80 animate-bounce" />
              </div>

              {isScanning ? (
                <div className="text-center space-y-1.5 animate-pulse z-10">
                  <ScanLine className="w-8 h-8 text-indigo-400 mx-auto" />
                  <p className="text-[10px] text-slate-400 font-mono">Leyendo QR...</p>
                </div>
              ) : scannedGuest ? (
                <div className="text-center space-y-1.5 z-10 animate-scale-in text-slate-200">
                  <UserCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="text-[11px] font-bold text-emerald-400">¡ACCESO AUTORIZADO!</p>
                  <p className="text-[10px] truncate max-w-[150px] font-semibold">{scannedGuest.name}</p>
                  <p className="text-[9px] text-slate-400">
                    Mesa: {tables.find(t => t.id === scannedGuest.tableId)?.name || 'General'}
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-2 z-10 text-slate-400">
                  <QrCode className="w-10 h-10 mx-auto text-slate-500" />
                  <p className="text-[10px] font-mono leading-normal">Listo para lectura de pases</p>
                </div>
              )}

              {scanMessage && !isScanning && !scannedGuest && (
                <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center p-4 text-center z-20">
                  <X className="w-8 h-8 text-red-500 mb-1" />
                  <p className="text-[10px] font-bold text-red-400 leading-normal">{scanMessage}</p>
                  <button
                    onClick={() => setScanMessage(null)}
                    className="mt-2.5 px-2 py-1 bg-red-800 text-white rounded-xs text-[9px] font-bold cursor-pointer"
                  >
                    Cerrar Error
                  </button>
                </div>
              )}
            </div>

            {/* List to choose which guest shows pass for simulation */}
            <div className="space-y-1 text-[10px] text-left">
              <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wide mb-1 select-none">Invitados para Escanear:</span>
              <div className="space-y-1 max-h-[140px] overflow-y-auto pr-0.5 bg-slate-900/60 p-2 rounded-lg">
                {guests.filter(g => g.rsvp === 'confirmado').map(g => (
                  <div 
                    key={g.id} 
                    onClick={() => !isScanning && handleSimulateScan(g.id)}
                    className={`p-1.5 rounded-sm border border-slate-900 bg-slate-900 hover:bg-indigo-950/50 hover:border-indigo-900/60 transition-all cursor-pointer flex justify-between items-center text-slate-300 ${
                      g.checkedIn ? 'opacity-40' : ''
                    }`}
                  >
                    <span className="truncate max-w-[120px]">{g.name}</span>
                    <span className="text-[8px] bg-slate-800 px-1 rounded-xs">
                      {g.checkedIn ? 'ENTRÓ' : 'ESCANEAR'}
                    </span>
                  </div>
                ))}
                {guests.filter(g => g.rsvp === 'confirmado').length === 0 && (
                  <p className="text-slate-500 italic py-4 text-center text-[9px]">Confirme RSVPs para tener pases.</p>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL: DIGITAL INVITATION & QR PASS */}
      {selectedPassGuest && (() => {
        const tName = tables.find(t => t.id === selectedPassGuest.tableId)?.name || 'General / Sin Mesa';
        const qrTextPayload = `📋 VERIFICACIÓN DE ACCESO 📋\nEvento: ${client?.eventName || client?.name || 'Evento'}\nInvitado: ${selectedPassGuest.name}\nMesa: ${tName}\nAcompañantes: ${selectedPassGuest.companionCount}\nID Pase: ${selectedPassGuest.id}\nEstado: Confirmado`;
        const appUrl = typeof window !== 'undefined' ? (window.location.origin + window.location.pathname) : 'https://eventia.planner';
        const qrLinkPayload = `${appUrl}?verifyGuestId=${selectedPassGuest.id}&clientId=${client.id}`;
        const activeQrPayload = qrMode === 'link' ? qrLinkPayload : qrTextPayload;
        const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(activeQrPayload)}`;

        const handlePrintPass = () => {
          const printWindow = window.open('', '_blank');
          if (!printWindow) {
            alert('Por favor habilite las ventanas emergentes en su navegador para imprimir el pase.');
            return;
          }
          printWindow.document.write(`
            <html>
              <head>
                <title>Imprimir Pase de Acceso - ${selectedPassGuest.name}</title>
                <style>
                  body {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    background-color: #f8fafc;
                    color: #0f172a;
                  }
                  .ticket {
                    background-color: #030712;
                    color: #ffffff;
                    padding: 30px;
                    border-radius: 20px;
                    width: 320px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
                    text-align: center;
                    box-sizing: border-box;
                  }
                  .header {
                    font-size: 11px;
                    font-weight: bold;
                    letter-spacing: 0.15em;
                    color: #818cf8;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                  }
                  .title {
                    font-size: 18px;
                    font-weight: bold;
                    font-style: italic;
                    margin-bottom: 25px;
                  }
                  .qr-container {
                    background-color: #ffffff;
                    padding: 15px;
                    border-radius: 12px;
                    display: inline-block;
                    margin-bottom: 25px;
                  }
                  .qr-image {
                    width: 200px;
                    height: 200px;
                    display: block;
                  }
                  .guest-name {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 5px;
                  }
                  .guest-type {
                    font-size: 13px;
                    color: #c7d2fe;
                    margin-bottom: 20px;
                  }
                  .details {
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    padding-top: 15px;
                    display: flex;
                    justify-content: space-around;
                    font-size: 12px;
                  }
                  .detail-label {
                    font-size: 10px;
                    color: #a5b4fc;
                    text-transform: uppercase;
                    margin-bottom: 4px;
                  }
                  .detail-val {
                    font-weight: bold;
                    font-family: monospace;
                  }
                  @media print {
                    body { background-color: #ffffff; }
                    .ticket { box-shadow: none; border: 1px solid #e2e8f0; }
                  }
                </style>
              </head>
              <body>
                <div class="ticket">
                  <div class="header">${client?.eventName || client?.name || 'PASE DIGITAL'}</div>
                  <div class="title">Invitación Oficial</div>
                  <div class="qr-container">
                    <img src="${qrImgUrl}" class="qr-image" />
                  </div>
                  <div class="guest-name">${selectedPassGuest.name}</div>
                  <div class="guest-type">Invitado de Honor • Acompañantes: ${selectedPassGuest.companionCount}</div>
                  <div class="details">
                    <div>
                      <div class="detail-label">MESA</div>
                      <div class="detail-val">${tName}</div>
                    </div>
                    <div>
                      <div class="detail-label">FECHA</div>
                      <div class="detail-val">${client?.eventDate || ''}</div>
                    </div>
                  </div>
                </div>
                <script>
                  window.onload = function() {
                    setTimeout(function() {
                      window.print();
                    }, 1000);
                  };
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        };

        return (
          <div id="qr_pass_modal" className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col text-center space-y-4">
              
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">PASE DIGITAL DE ACCESO REAL</span>
                <button 
                  type="button" 
                  onClick={() => setSelectedPassGuest(null)}
                  className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Selector de tipo de QR */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setQrMode('link')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    qrMode === 'link' 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🌐 Enlace Web Móvil
                </button>
                <button
                  type="button"
                  onClick={() => setQrMode('text')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    qrMode === 'text' 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  📝 Texto de Información
                </button>
              </div>

              {/* Invitation Template */}
              <div className="bg-indigo-950 text-white rounded-xl p-5 space-y-4 shadow-inner relative overflow-hidden">
                {/* Abstract decorative graphic patterns */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-8 -mb-8" />

                <div className="text-center">
                  <span className="text-[9px] font-bold tracking-widest text-indigo-300 uppercase block mb-1">
                    {client?.eventName}
                  </span>
                  <p className="font-serif text-base font-bold italic">Estás cordialmente invitado</p>
                </div>

                {/* Real Scannable QR Image */}
                <div className="bg-white p-2.5 rounded-xl w-36 h-36 mx-auto flex items-center justify-center shadow-md">
                  <img 
                    src={qrImgUrl} 
                    alt="Pase QR Real" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="text-xs space-y-1">
                  <p className="font-bold text-sm">{selectedPassGuest.name}</p>
                  <p className="text-indigo-200 text-[11px]">Invitado de Honor</p>
                  <p className="text-[10px] text-indigo-300">Acompañantes: {selectedPassGuest.companionCount}</p>
                </div>

                <div className="border-t border-white/10 pt-3 flex justify-around text-[10px]">
                  <div>
                    <span className="text-indigo-300 uppercase block text-[8px] font-bold">MESA</span>
                    <span className="font-bold font-mono text-[11px]">
                      {tName}
                    </span>
                  </div>
                  <div>
                    <span className="text-indigo-300 uppercase block text-[8px] font-bold">FECHA</span>
                    <span className="font-bold font-mono text-[11px]">{client?.eventDate}</span>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = qrImgUrl;
                    link.target = '_blank';
                    link.download = `pase_qr_${selectedPassGuest.name.replace(/\s+/g, '_')}.png`;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                  }}
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-indigo-100"
                >
                  <Download className="w-4 h-4" />
                  Descargar QR
                </button>

                <button
                  type="button"
                  onClick={handlePrintPass}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Pase
                </button>
              </div>

              <p className="text-[10px] text-slate-400">
                {qrMode === 'link' 
                  ? 'Este código QR contiene un enlace interactivo para escanear con la cámara y realizar Check-In digital inmediato.'
                  : 'Este código QR contiene la información de acceso detallada en texto plano y no requiere conexión a internet.'
                }
              </p>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
