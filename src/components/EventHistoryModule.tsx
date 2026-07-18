/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { EventState, Client } from '../types';
import { 
  Archive, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Users, 
  Utensils, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  TrendingUp, 
  Briefcase, 
  Activity,
  Heart,
  Mail,
  Phone,
  Building,
  Info,
  Image
} from 'lucide-react';

interface EventHistoryModuleProps {
  state: EventState;
  updateState: (newState: Partial<EventState>) => void;
}

export default function EventHistoryModule({ state, updateState }: EventHistoryModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // Filter completed clients
  const completedClients = useMemo(() => {
    return state.clients.filter(c => c.status === 'completado');
  }, [state.clients]);

  // Filter & Search the list
  const filteredClients = useMemo(() => {
    return completedClients.filter(c => {
      const matchesSearch = 
        c.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'todos' || c.eventType === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [completedClients, searchTerm, selectedCategory]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCount = completedClients.length;
    
    // Sum of budget limits of completed events
    const totalBudgetLimit = completedClients.reduce((sum, c) => sum + c.budgetLimit, 0);
    
    // Sum of actual expenses (if any)
    let totalActualExpenses = 0;
    let totalGuestsCount = 0;

    completedClients.forEach(c => {
      const budgetItems = state.budgetItems[c.id] || [];
      totalActualExpenses += budgetItems.reduce((sum, item) => sum + item.actualCost, 0);
      
      const guests = state.guests[c.id] || [];
      totalGuestsCount += guests.reduce((sum, g) => sum + 1 + g.companionCount, 0);
    });

    return {
      totalCount,
      totalBudgetLimit,
      totalActualExpenses,
      totalGuestsCount,
      averageBudget: totalCount > 0 ? Math.round(totalBudgetLimit / totalCount) : 0
    };
  }, [completedClients, state.budgetItems, state.guests]);

  // Handle re-opening / reactivating a completed event
  const handleReactivateEvent = (clientId: string, eventName: string) => {
    const updatedClients = state.clients.map(c => 
      c.id === clientId ? { ...c, status: 'activo' as const } : c
    );
    updateState({ clients: updatedClients });
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'boda':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
            <Heart className="w-3 h-3" />
            Boda
          </span>
        );
      case 'corporativo':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            <Briefcase className="w-3 h-3" />
            Corporativo
          </span>
        );
      case 'cumpleanos':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
            <Activity className="w-3 h-3" />
            Cumpleaños
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-100">
            <FileText className="w-3 h-3" />
            Otro
          </span>
        );
    }
  };

  const formatCurrency = (val: number) => {
    return Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: 'CLP', 
      maximumFractionDigits: 0 
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Archive className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Historial Histórico</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Historial de Eventos</h2>
          <p className="text-xs text-slate-500 mt-1">
            Registro consolidado de todos los eventos finalizados con éxito (Estado: Completado).
          </p>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider mb-0.5">Eventos Archivados</span>
            <span className="text-2xl font-black text-slate-800">{stats.totalCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
            <Archive className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider mb-0.5">Presupuesto Cerrado</span>
            <span className="text-lg font-black text-slate-800 truncate block max-w-[170px]" title={formatCurrency(stats.totalBudgetLimit)}>
              {formatCurrency(stats.totalBudgetLimit)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider mb-0.5">Costos Reales Totales</span>
            <span className="text-lg font-black text-slate-800 truncate block max-w-[170px]" title={formatCurrency(stats.totalActualExpenses)}>
              {formatCurrency(stats.totalActualExpenses)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider mb-0.5">Invitados Atendidos</span>
            <span className="text-2xl font-black text-slate-800">{stats.totalGuestsCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre de evento, cliente o empresa..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex gap-2 shrink-0">
          <div className="relative flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent border-0 p-0 text-xs font-bold text-slate-700 outline-hidden cursor-pointer capitalize"
            >
              <option value="todos">Todos los tipos</option>
              {(state.configurations?.eventTypes || ['boda', 'corporativo', 'cumpleanos', 'otro']).map((type) => {
                const label = type === 'boda' ? 'Bodas'
                            : type === 'corporativo' ? 'Corporativos'
                            : type === 'cumpleanos' ? 'Cumpleaños'
                            : type === 'otro' ? 'Otros'
                            : type;
                return (
                  <option key={type} value={type}>{label}</option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* COMPLETED EVENTS LIST */}
      <div className="space-y-4">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => {
            const isExpanded = expandedClientId === client.id;
            
            // Checklist calculation
            const checklistItems = state.checklist[client.id] || [];
            const completedTasks = checklistItems.filter(t => t.completed).length;
            const totalTasks = checklistItems.length;
            const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            // Guests calculation
            const guestList = state.guests[client.id] || [];
            const confirmedCount = guestList.filter(g => g.rsvp === 'confirmado').reduce((sum, g) => sum + 1 + g.companionCount, 0);
            const totalGuestsCount = guestList.reduce((sum, g) => sum + 1 + g.companionCount, 0);
            const guestPct = totalGuestsCount > 0 ? Math.round((confirmedCount / totalGuestsCount) * 100) : 0;

            // Budget calculation
            const budgetList = state.budgetItems[client.id] || [];
            const totalActual = budgetList.reduce((sum, item) => sum + item.actualCost, 0);
            const budgetPct = client.budgetLimit > 0 ? Math.round((totalActual / client.budgetLimit) * 100) : 0;

            // Food menu items
            const foodItems = state.foodMenu[client.id] || [];

            return (
              <div 
                key={client.id}
                className="bg-white rounded-2xl border border-slate-150 shadow-2xs hover:border-slate-300 transition-all overflow-hidden"
              >
                {/* CARD HEADER / PREVIEW */}
                <div 
                  className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                  onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getEventTypeBadge(client.eventType)}
                      <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/50 rounded-md uppercase">
                        Completado
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm md:text-base">{client.eventName}</h3>
                    <div className="flex items-center gap-4 text-slate-500 text-xs flex-wrap">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {client.name}
                      </span>
                      {client.company && (
                        <span className="flex items-center gap-1.5 font-medium text-slate-400">
                          <Building className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          {client.company}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {client.eventDate}
                      </span>
                    </div>
                  </div>

                  {/* QUICK PROGRESS INDICATORS */}
                  <div className="flex flex-row md:flex-col lg:flex-row items-center gap-5 border-t border-slate-100 md:border-0 pt-3.5 md:pt-0">
                    <div className="text-left md:text-right">
                      <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Tareas</span>
                      <span className="text-xs font-bold text-slate-700">{completedTasks}/{totalTasks} ({taskPct}%)</span>
                    </div>
                    <div className="text-left md:text-right">
                      <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Costo Real</span>
                      <span className="text-xs font-bold text-slate-700">{formatCurrency(totalActual)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReactivateEvent(client.id, client.eventName);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Reabrir / Mover a Activo"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-500" />
                        <span className="hidden sm:inline">Activar</span>
                      </button>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-150 text-slate-500 hover:bg-slate-100 transition-all shrink-0">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* EXPANDED CONTENT DETAIL */}
                {isExpanded && (
                  <div className="border-t border-slate-150 bg-slate-50/40 p-5 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* COL 1: CONTACT & NOTES */}
                      <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-2xs space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
                          <Info className="w-3.5 h-3.5 text-indigo-500" />
                          Detalles del Cliente
                        </h4>
                        
                        <div className="space-y-2.5 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-bold text-slate-700 truncate">{client.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate">{client.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{client.phone}</span>
                          </div>
                          {client.company && (
                            <div className="flex items-center gap-2">
                              <Building className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate">{client.company}</span>
                            </div>
                          )}
                        </div>

                        <div className="border-t border-slate-100 pt-3 mt-1 text-xs">
                          <span className="block font-semibold text-slate-500 mb-1">Notas Clave</span>
                          <p className="text-slate-600 leading-relaxed italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-h-24 overflow-y-auto">
                            {client.notes || 'Sin anotaciones adicionales.'}
                          </p>
                        </div>
                      </div>

                      {/* COL 2: BUDGET & TASKS */}
                      <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-2xs space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
                          Desglose del Presupuesto
                        </h4>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-slate-500">Límite Estimado:</span>
                              <span className="font-bold text-slate-800">{formatCurrency(client.budgetLimit)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-slate-500">Costo Real:</span>
                              <span className={`font-bold ${totalActual > client.budgetLimit ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(totalActual)}</span>
                            </div>
                          </div>

                          {/* Progress bar budget */}
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${totalActual > client.budgetLimit ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(budgetPct, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 font-semibold uppercase">
                            <span>Consumido</span>
                            <span>{budgetPct}%</span>
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-3">
                          <span className="block text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />
                            Cumplimiento Cronograma/Checklist
                          </span>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-100 rounded-full h-2">
                              <div 
                                className="bg-indigo-600 h-2 rounded-full transition-all" 
                                style={{ width: `${taskPct}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-700 shrink-0">{taskPct}%</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">{completedTasks} tareas completadas de un total de {totalTasks}.</p>
                        </div>
                      </div>

                      {/* COL 3: MENU DE COMIDAS SELECT */}
                      <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-2xs space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
                          <Utensils className="w-3.5 h-3.5 text-indigo-500" />
                          Menú de Comidas Asociado
                        </h4>

                        {foodItems.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {foodItems.map((item, idx) => (
                              <div key={item.id || idx} className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-700 truncate">{item.name}</p>
                                  <span className="text-[9px] uppercase px-1 py-0.5 bg-slate-200/70 border border-slate-300/40 rounded-xs text-slate-500 font-medium font-mono">
                                    {item.category === 'plato_principal' ? 'Plato Principal' : item.category === 'coctel' ? 'Cóctel' : item.category === 'bebestible' ? 'Bebestible' : item.category === 'trasnoche' ? 'Trasnoche' : item.category === 'entrada' ? 'Entrada' : item.category === 'postre' ? 'Postre' : item.category}
                                  </span>
                                </div>
                                {item.estimatedCost ? (
                                  <span className="text-[11px] font-black text-indigo-600 shrink-0">
                                    {formatCurrency(item.estimatedCost)}
                                  </span>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                            <p className="text-[11px] text-slate-400">Ningún plato de comida registrado para este evento.</p>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Tablero de Inspiración */}
                    {(() => {
                      const clientMoodImages = state.moodImages[client.id] || [];
                      return (
                        <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-2xs space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
                            <Image className="w-3.5 h-3.5 text-indigo-500" />
                            Fotografías y Tablero de Inspiración
                          </h4>
                          {clientMoodImages.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                              {clientMoodImages.map((img) => (
                                <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-100 shadow-2xs h-28 bg-slate-50">
                                  <img 
                                    src={img.imageUrl} 
                                    alt={img.title} 
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent p-2 flex flex-col justify-end opacity-90 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] text-white font-bold truncate">
                                      {img.title}
                                    </span>
                                    <span className="text-[8px] text-slate-300 font-medium truncate uppercase tracking-wider">
                                      {img.category}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                              <p className="text-xs text-slate-400">No se cargaron fotografías en el tablero de inspiración para este evento.</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-12 bg-white rounded-2xl border border-slate-150 shadow-2xs text-center flex flex-col items-center justify-center">
            <Archive className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No hay eventos archivados en el historial</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mx-auto">
              Puedes cambiar el estado de un evento o cliente a <strong>"Completado"</strong> en la sección de Clientes & CRM para archivarlo y verlo en esta sección.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
