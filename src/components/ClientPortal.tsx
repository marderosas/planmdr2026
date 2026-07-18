/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EventState } from '../types';
import { Heart, Calendar, CheckSquare, Clock, CreditCard, Gift, Image as ImageIcon, Sparkles, Smile, Compass, Layers, Check, FileText, Upload } from 'lucide-react';
import { addBitacoraEntry } from '../firebase';

interface ClientPortalProps {
  state: EventState;
  updateState: (newState: Partial<EventState>) => void;
  onExitPortal: () => void;
}

export default function ClientPortal({ state, updateState, onExitPortal }: ClientPortalProps) {
  const selectedClientId = state.selectedClientId;
  const client = state.clients.find(c => c.id === selectedClientId) || state.clients[0];

  // Portal inner tab: 'resumen' | 'inspiracion' | 'cronograma' | 'pagos'
  const [portalTab, setPortalTab] = useState<'resumen' | 'inspiracion' | 'cronograma' | 'pagos'>('resumen');

  // New inspiration image url
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-lg max-w-md w-full">
          <div className="p-3 bg-rose-50 text-rose-500 rounded-full w-fit mx-auto mb-3">
            <Heart className="w-6 h-6" />
          </div>
          <p className="text-slate-800 font-bold text-sm">No hay portal disponible</p>
          <p className="text-xs text-slate-500 mt-1 mb-5">No existen eventos creados en el sistema.</p>
          <button
            onClick={onExitPortal}
            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Volver al Panel Administrador
          </button>
        </div>
      </div>
    );
  }

  const checklistItems = state.checklist[client.id] || [];
  const dayTimelineItems = state.dayTimeline[client.id] || [];
  const budgetItems = state.budgetItems[client.id] || [];
  const installments = state.installments[client.id] || [];
  const guests = state.guests[client.id] || [];
  const moodImages = state.moodImages[client.id] || [];

  // Calculations
  const completedChecklist = checklistItems.filter(i => i.completed).length;
  const totalChecklist = checklistItems.length;
  const progressPercent = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

  const totalActual = budgetItems.reduce((acc, item) => acc + item.actualCost, 0);
  const totalPaid = budgetItems.reduce((acc, item) => acc + item.paidAmount, 0);
  const remaining = totalActual - totalPaid;

  const totalConfirmed = guests.filter(g => g.rsvp === 'confirmado').reduce((sum, g) => sum + 1 + g.companionCount, 0);

  const formatCLP = (val: number) => {
    return Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);
  };

  const handleAddInspiration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;

    const newImg = {
      id: 'm_' + Date.now(),
      title: newTitle || 'Mi Inspiración',
      imageUrl: newUrl,
      category: 'Inspiración'
    };

    updateState({
      moodImages: {
        ...state.moodImages,
        [client.id]: [...moodImages, newImg]
      }
    });

    setNewUrl('');
    setNewTitle('');
  };

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const newImg = {
        id: 'm_' + Date.now(),
        title: newTitle || file.name.split('.')[0] || 'Mi Inspiración',
        imageUrl: dataUrl,
        category: 'Inspiración'
      };

      updateState({
        moodImages: {
          ...state.moodImages,
          [client.id]: [...moodImages, newImg]
        }
      });
      addBitacoraEntry('Clientes', `Cliente subió imagen local ("${newImg.title}") al tablero de inspiración para: ${client.name}`);

      setNewTitle('');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div id="client_portal" className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Premium Portal Header Banner */}
      <header className="bg-indigo-950 text-white py-8 px-6 shadow-md relative overflow-hidden text-left">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.15),transparent)] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-800 text-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                Portal Privado del Anfitrión
              </span>
              <span className="text-[10px] text-indigo-300">Modo de Vista Exclusivo</span>
            </div>
            <h1 className="text-2xl font-serif font-extrabold italic text-indigo-50">{client?.eventName}</h1>
            <p className="text-xs text-indigo-200">Bienvenidos a su espacio privado para planificar y seguir los avances de su gran día.</p>
          </div>

          <div className="flex gap-3">
            <button
              id="btn_exit_portal"
              onClick={onExitPortal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Regresar al CRM Organizador
            </button>
          </div>
        </div>
      </header>

      {/* Internal Navigation bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto flex px-4">
          <button
            onClick={() => setPortalTab('resumen')}
            className={`py-3.5 px-4 font-semibold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              portalTab === 'resumen' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            Resumen General
          </button>
          <button
            onClick={() => setPortalTab('inspiracion')}
            className={`py-3.5 px-4 font-semibold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              portalTab === 'inspiracion' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Nuestro Mood Board
          </button>
          <button
            onClick={() => setPortalTab('cronograma')}
            className={`py-3.5 px-4 font-semibold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              portalTab === 'cronograma' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            Minuto a Minuto
          </button>
          <button
            onClick={() => setPortalTab('pagos')}
            className={`py-3.5 px-4 font-semibold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              portalTab === 'pagos' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Finanzas & Pagos
          </button>
        </div>
      </div>

      {/* PORTAL MAIN SHEET */}
      <main className="max-w-6xl mx-auto p-6 flex-1 w-full space-y-6">
        
        {/* TAB 1: SUMMARY */}
        {portalTab === 'resumen' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
            
            {/* Quick Metrics (Row of 3) */}
            <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-4">
                <div className="p-3 bg-rose-50 rounded-xl text-rose-500">
                  <Heart className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Fecha del Evento</span>
                  <span className="text-sm font-bold text-slate-800">{client?.eventDate}</span>
                  <span className="text-[10px] text-slate-500 block">Día coordinado</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Checklist Completado</span>
                  <span className="text-sm font-bold text-slate-800">{progressPercent}% ({completedChecklist}/{totalChecklist})</span>
                  <span className="text-[10px] text-slate-500 block">Tareas por resolver</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                  <Smile className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Asistencia Confirmada</span>
                  <span className="text-sm font-bold text-slate-800">{totalConfirmed} Invitados</span>
                  <span className="text-[10px] text-slate-500 block">Registrados en lista</span>
                </div>
              </div>
            </div>

            {/* Checklist View (Client-friendly) */}
            <div className="md:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">Próximos Pasos en la Planificación</h3>
                <span className="text-xs text-slate-400">Progreso general</span>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {checklistItems.map(item => (
                  <div key={item.id} className="flex items-start gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                    <div className="mt-0.5">
                      {item.completed ? (
                        <Check className="w-4 h-4 text-emerald-600 bg-emerald-100 rounded-full p-0.5" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300" />
                      )}
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${item.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {item.title}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Límite: {item.dueDate} • {item.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Overview (Client-friendly) */}
            <div className="md:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2.5">Estado Financiero</h3>
              
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Costo Acordado Total</span>
                    <span className="text-xl font-bold text-slate-800">{formatCLP(totalActual)}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-[9px] text-slate-400 block">PAGADO</span>
                      <span className="font-bold text-emerald-600">{formatCLP(totalPaid)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block">PENDIENTE</span>
                      <span className="font-bold text-rose-600">{formatCLP(remaining)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs space-y-2 text-slate-600">
                  <p className="font-semibold text-slate-700">Próxima cuota por liquidar:</p>
                  {installments.filter(i => i.status === 'pendiente')[0] ? (
                    <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100 flex justify-between items-center text-[11px]">
                      <span>{installments.filter(i => i.status === 'pendiente')[0].reference}</span>
                      <span className="font-bold font-mono text-amber-800">{formatCLP(installments.filter(i => i.status === 'pendiente')[0].amount)}</span>
                    </div>
                  ) : (
                    <p className="italic text-slate-400 text-[11px]">No hay cuotas pendientes.</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: INSPIRATION / MOOD BOARD */}
        {portalTab === 'inspiracion' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs text-left space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Galería de Inspiraciones Compartidas</h3>
                <p className="text-xs text-slate-500 mt-0.5">Sube imágenes para mostrar el estilo, flores y ambientación que deseas en tu evento.</p>
              </div>
            </div>

            {/* Subir imagen de inspiración */}
            <form onSubmit={handleAddInspiration} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="md:col-span-4">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Título (ej: Mi Ramo de Novia ideal)"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-hidden"
                />
              </div>
              <div className="md:col-span-6">
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="URL de imagen de inspiración"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-hidden"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-1.5 rounded-lg cursor-pointer flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Sugerir Estilo
                </button>
              </div>
            </form>

            {/* Local File Upload Section */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-between bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/60 text-xs">
              <div className="text-left">
                <span className="font-bold text-slate-700 block">¿O prefieres subir una foto desde tu computador?</span>
                <span className="text-[11px] text-slate-400">Selecciona una imagen de tus archivos para agregarla de inmediato al tablero.</span>
              </div>
              <label className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-indigo-50 border border-indigo-200 hover:border-indigo-300 text-indigo-700 font-bold rounded-xl cursor-pointer transition-all shadow-xs">
                <Upload className="w-4 h-4 text-indigo-500" />
                <span>Subir desde mi PC</span>
                <input
                  type="file"
                  id="client_mood_upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLocalImageUpload}
                />
              </label>
            </div>

            {/* Mood Board display */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {moodImages.map(img => (
                <div key={img.id} className="group relative rounded-xl overflow-hidden border border-slate-100 shadow-2xs h-40">
                  <img 
                    src={img.imageUrl} 
                    alt={img.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent p-3 flex flex-col justify-end text-left opacity-90 group-hover:opacity-100 transition-opacity">
                    <span className="text-[8px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded-xs w-max mb-1.5">
                      {img.category}
                    </span>
                    <p className="text-xs font-bold text-white truncate">{img.title}</p>
                  </div>
                </div>
              ))}
              {moodImages.length === 0 && (
                <p className="text-slate-400 italic text-center py-10 col-span-4">Cargando tablero de inspiración...</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CRONOGRAMA MINUTO A MINUTO */}
        {portalTab === 'cronograma' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs text-left space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Cronograma y Tiempos Oficiales (Día del Evento)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Control pormenorizado de las actividades minutadas acordadas con el planificador.</p>
            </div>

            <div className="relative border-l border-indigo-200 pl-4 space-y-4">
              {dayTimelineItems.map(item => (
                <div key={item.id} className="relative p-3 bg-slate-50/50 rounded-xl border border-slate-100/50 text-left flex items-start gap-4">
                  {/* Side locator circle */}
                  <div className="absolute -left-[21px] top-4 w-3 h-3 rounded-full border-2 border-indigo-600 bg-white ring-4 ring-white" />
                  
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-sm">
                      {item.time} h
                    </span>
                    <h5 className="font-bold text-slate-800 text-xs mt-1.5">{item.title}</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.description || 'Sin detalles adicionales.'}</p>
                    <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm inline-block mt-2 font-medium">
                      Responsable: {item.responsible}
                    </span>
                  </div>
                </div>
              ))}
              {dayTimelineItems.length === 0 && (
                <p className="text-slate-400 italic text-center py-10">No hay cronogramas minutados publicados todavía.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PAYMENTS & FINANCES */}
        {portalTab === 'pagos' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs text-left space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Planificación de Cobros y Ficha Financiera</h3>
              <p className="text-xs text-slate-500 mt-0.5">Siga sus cuotas y depósitos acreditados por la administración.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Payment installment list */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Calendario de Cuotas</span>
                <div className="space-y-2.5">
                  {installments.map(inst => (
                    <div key={inst.id} className={`p-3.5 border rounded-xl flex items-center justify-between ${
                      inst.status === 'pagado' ? 'border-emerald-100 bg-emerald-50/5' : 'border-slate-100 bg-white'
                    }`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-xs">{inst.reference}</span>
                          {inst.status === 'pagado' ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">ACREDITADO</span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">PENDIENTE</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Fecha de Vencimiento: {inst.dueDate}</p>
                      </div>
                      <span className="font-mono font-bold text-slate-800 text-xs">
                        {formatCLP(inst.amount)}
                      </span>
                    </div>
                  ))}
                  {installments.length === 0 && (
                    <p className="text-slate-400 italic text-center py-6 text-xs">No hay calendario de cuotas configurado.</p>
                  )}
                </div>
              </div>

              {/* Service details and costs breakdown */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Resumen de Contratación</span>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 text-xs text-slate-700">
                  {budgetItems.map(item => (
                    <div key={item.id} className="flex justify-between pb-2 border-b border-slate-100 last:border-b-0 last:pb-0">
                      <div>
                        <span className="font-bold text-slate-800 block">{item.name}</span>
                        <span className="text-[10px] text-slate-400">Estado de pago: {item.paidAmount === item.actualCost ? '100% Pagado' : `${Math.round((item.paidAmount / item.actualCost) * 100)}%`}</span>
                      </div>
                      <span className="font-mono font-semibold text-slate-900">{formatCLP(item.actualCost)}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

    </div>
  );
}
