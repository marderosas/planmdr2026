/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ChecklistItem, DayTimelineItem, Protocol, EventState } from '../types';
import { Calendar, Plus, CheckSquare, Square, Clock, Award, Trash2, Edit2, ShieldAlert, ArrowDown, UserPlus, Users, Sparkles, ChevronLeft, ChevronRight, Star, AlertCircle, DollarSign } from 'lucide-react';

interface TimelineModuleProps {
  state: EventState;
  updateState: (newState: Partial<EventState>) => void;
}

export default function TimelineModule({ state, updateState }: TimelineModuleProps) {
  const selectedClientId = state.selectedClientId;
  const client = state.clients.find(c => c.id === selectedClientId) || state.clients[0];

  // Active Tab: 'checklist' | 'minuto_a_minuto' | 'protocolos' | 'calendario'
  const [subTab, setSubTab] = useState<'checklist' | 'minuto_a_minuto' | 'protocolos' | 'calendario'>('checklist');

  // Calendar Module State
  const [currentYear, setCurrentYear] = useState<number>(() => {
    if (client?.eventDate) {
      const parts = client.eventDate.split('-');
      if (parts.length === 3) {
        return parseInt(parts[0], 10);
      }
    }
    return new Date().getFullYear();
  });

  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    if (client?.eventDate) {
      const parts = client.eventDate.split('-');
      if (parts.length === 3) {
        return parseInt(parts[1], 10) - 1; // 0-indexed
      }
    }
    return new Date().getMonth();
  });

  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);

  // Calendar quick task form state
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskCategory, setQuickTaskCategory] = useState('Logística');
  const [quickTaskNotes, setQuickTaskNotes] = useState('');

  // New Checklist Item State
  const [newCheckItem, setNewCheckItem] = useState({
    title: '',
    category: 'Logística',
    dueDate: client?.eventDate || '',
    notes: ''
  });

  // New Timeline Item State
  const [newTimeItem, setNewTimeItem] = useState({
    time: '18:00',
    title: '',
    description: '',
    responsible: 'Planner Principal'
  });

  // New Protocol State
  const [newProtocol, setNewProtocol] = useState({
    title: '',
    description: '',
    stepInput: '',
    memberName: '',
    memberRole: ''
  });
  
  const [tempSteps, setTempSteps] = useState<string[]>([]);
  const [tempMembers, setTempMembers] = useState<{name: string, role: string}[]>([]);
  const [isAddingProtocol, setIsAddingProtocol] = useState(false);

  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    
    const cells = [];
    
    // Add previous month's trailing days
    for (let i = startOffset - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        day: dayNum,
        isCurrentMonth: false,
        dateStr
      });
    }
    
    // Add current month's days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        day: d,
        isCurrentMonth: true,
        dateStr
      });
    }
    
    // Pad next month's days to make total cells a multiple of 7 (usually 42 cells)
    const totalCells = 42;
    const nextMonthDaysNeeded = totalCells - cells.length;
    for (let n = 1; n <= nextMonthDaysNeeded; n++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
      cells.push({
        day: n,
        isCurrentMonth: false,
        dateStr
      });
    }
    
    return cells;
  }, [currentYear, currentMonth]);

  const checklistItems = client ? (state.checklist[client.id] || []) : [];

  const calendarEventsMap = useMemo(() => {
    const map: Record<string, Array<{
      id: string;
      type: 'event_day' | 'task' | 'payment';
      title: string;
      status?: string;
      amount?: number;
      completed?: boolean;
      originalItem: any;
    }>> = {};

    // 1. Add ALL Active or Confirmed Event Days from clients list
    state.clients.forEach(c => {
      const isActive = c.status === 'activo' || c.status === 'confirmado';
      if (isActive && c.eventDate) {
        if (!map[c.eventDate]) map[c.eventDate] = [];
        map[c.eventDate].push({
          id: 'event_' + c.id,
          type: 'event_day',
          title: `★ EVENTO: ${c.eventName || c.name}`,
          originalItem: c
        });
      }
    });

    // 2. Add Checklist Tasks for the SELECTED client
    checklistItems.forEach(item => {
      const date = item.dueDate;
      if (date) {
        if (!map[date]) map[date] = [];
        map[date].push({
          id: item.id,
          type: 'task',
          title: item.title,
          completed: item.completed,
          originalItem: item
        });
      }
    });

    // 3. Add Installments for the SELECTED client
    const clientInstallments = client ? (state.installments[client.id] || []) : [];
    clientInstallments.forEach(inst => {
      const date = inst.dueDate;
      if (date) {
        if (!map[date]) map[date] = [];
        map[date].push({
          id: inst.id,
          type: 'payment',
          title: `Pago Cuota: ${Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(inst.amount)}`,
          status: inst.status,
          amount: inst.amount,
          completed: inst.status === 'pagado',
          originalItem: inst
        });
      }
    });

    return map;
  }, [state.clients, client, checklistItems, state.installments]);

  if (!client) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-xs">
        <div className="p-3 bg-slate-50 text-slate-400 rounded-full w-fit mx-auto mb-3">
          <Calendar className="w-6 h-6 text-indigo-500" />
        </div>
        <p className="text-slate-500 font-bold text-sm">No hay eventos activos</p>
        <p className="text-xs text-slate-400 mt-1">Por favor registre un cliente y evento en la pestaña CRM para comenzar.</p>
      </div>
    );
  }

  const dayTimelineItems = state.dayTimeline[client.id] || [];
  const protocols = state.protocols[client.id] || [];

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const activeSelectedDay = selectedDayStr || (() => {
    if (client.eventDate) {
      const evParts = client.eventDate.split('-');
      if (evParts.length === 3 && parseInt(evParts[0], 10) === currentYear && (parseInt(evParts[1], 10) - 1) === currentMonth) {
        return client.eventDate;
      }
    }
    return null;
  })();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleGoToEventMonth = () => {
    if (client.eventDate) {
      const parts = client.eventDate.split('-');
      if (parts.length === 3) {
        setCurrentYear(parseInt(parts[0], 10));
        setCurrentMonth(parseInt(parts[1], 10) - 1);
        setSelectedDayStr(client.eventDate);
      }
    }
  };

  const handleQuickAddChecklist = (e: React.FormEvent, targetDate: string) => {
    e.preventDefault();
    if (!quickTaskTitle || !targetDate) return;
    
    const newItem: ChecklistItem = {
      id: 'ch_' + Date.now(),
      title: quickTaskTitle,
      category: quickTaskCategory,
      dueDate: targetDate,
      completed: false,
      notes: quickTaskNotes
    };

    updateState({
      checklist: {
        ...state.checklist,
        [client.id]: [...checklistItems, newItem]
      }
    });

    setQuickTaskTitle('');
    setQuickTaskNotes('');
  };

  // 1. Checklist Functions
  const handleToggleChecklist = (itemId: string) => {
    const updated = checklistItems.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateState({
      checklist: { ...state.checklist, [client.id]: updated }
    });
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckItem.title) return;
    
    const newItem: ChecklistItem = {
      id: 'ch_' + Date.now(),
      title: newCheckItem.title,
      category: newCheckItem.category,
      dueDate: newCheckItem.dueDate || client.eventDate,
      completed: false,
      notes: newCheckItem.notes
    };

    updateState({
      checklist: {
        ...state.checklist,
        [client.id]: [...checklistItems, newItem]
      }
    });

    setNewCheckItem({
      title: '',
      category: 'Logística',
      dueDate: client.eventDate,
      notes: ''
    });
  };

  const handleDeleteChecklist = (itemId: string) => {
    updateState({
      checklist: {
        ...state.checklist,
        [client.id]: checklistItems.filter(item => item.id !== itemId)
      }
    });
  };

  // 2. Day Timeline Functions
  const handleToggleTimeItem = (itemId: string) => {
    const updated = dayTimelineItems.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateState({
      dayTimeline: { ...state.dayTimeline, [client.id]: updated }
    });
  };

  const handleAddTimeItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimeItem.title) return;

    const newItem: DayTimelineItem = {
      id: 'dt_' + Date.now(),
      time: newTimeItem.time,
      title: newTimeItem.title,
      description: newTimeItem.description,
      responsible: newTimeItem.responsible,
      completed: false
    };

    const sortedTimeline = [...dayTimelineItems, newItem].sort((a, b) => a.time.localeCompare(b.time));

    updateState({
      dayTimeline: {
        ...state.dayTimeline,
        [client.id]: sortedTimeline
      }
    });

    setNewTimeItem({
      time: '18:00',
      title: '',
      description: '',
      responsible: 'Planner Principal'
    });
  };

  const handleDeleteTimeItem = (itemId: string) => {
    updateState({
      dayTimeline: {
        ...state.dayTimeline,
        [client.id]: dayTimelineItems.filter(item => item.id !== itemId)
      }
    });
  };

  // 3. Protocol Functions
  const handleAddTempStep = () => {
    if (!newProtocol.stepInput.trim()) return;
    setTempSteps([...tempSteps, newProtocol.stepInput.trim()]);
    setNewProtocol({ ...newProtocol, stepInput: '' });
  };

  const handleAddTempMember = () => {
    if (!newProtocol.memberName.trim() || !newProtocol.memberRole.trim()) return;
    setTempMembers([...tempMembers, { name: newProtocol.memberName.trim(), role: newProtocol.memberRole.trim() }]);
    setNewProtocol({ ...newProtocol, memberName: '', memberRole: '' });
  };

  const handleSaveProtocol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProtocol.title) return;

    const newProto: Protocol = {
      id: 'pr_' + Date.now(),
      title: newProtocol.title,
      description: newProtocol.description,
      members: tempMembers.map((m, idx) => ({ id: 'prm_' + idx + '_' + Date.now(), name: m.name, role: m.role })),
      steps: tempSteps
    };

    updateState({
      protocols: {
        ...state.protocols,
        [client.id]: [...protocols, newProto]
      }
    });

    // Reset Form
    setNewProtocol({
      title: '',
      description: '',
      stepInput: '',
      memberName: '',
      memberRole: ''
    });
    setTempSteps([]);
    setTempMembers([]);
    setIsAddingProtocol(false);
  };

  const handleDeleteProtocol = (protoId: string) => {
    updateState({
      protocols: {
        ...state.protocols,
        [client.id]: protocols.filter(p => p.id !== protoId)
      }
    });
  };

  // Calculations
  const completedChecklistCount = checklistItems.filter(i => i.completed).length;
  const checklistProgressPercent = checklistItems.length > 0 
    ? Math.round((completedChecklistCount / checklistItems.length) * 100) 
    : 0;

  const completedTimelineCount = dayTimelineItems.filter(i => i.completed).length;
  const timelineProgressPercent = dayTimelineItems.length > 0
    ? Math.round((completedTimelineCount / dayTimelineItems.length) * 100)
    : 0;

  return (
    <div id="timeline_module" className="space-y-6">
      
      {/* Client Context Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
        <div className="text-left">
          <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">Cronograma & Tiempos</span>
          <h2 className="text-lg font-bold text-slate-800">{client?.eventName || 'Seleccione un Evento'}</h2>
        </div>
        
        {/* Sub Navigation */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-200">
          <button
            id="tab_checklist"
            onClick={() => setSubTab('checklist')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              subTab === 'checklist' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            Checklist General
          </button>
          <button
            id="tab_minuto_a_minuto"
            onClick={() => setSubTab('minuto_a_minuto')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              subTab === 'minuto_a_minuto' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            Minuto a Minuto
          </button>
          <button
            id="tab_protocolos"
            onClick={() => setSubTab('protocolos')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              subTab === 'protocolos' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            Protocolos
          </button>
          <button
            id="tab_calendario"
            onClick={() => setSubTab('calendario')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              subTab === 'calendario' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            Calendario Mensual
          </button>
        </div>
      </div>

      {/* SUB-MODULE 1: CHECKLIST */}
      {subTab === 'checklist' && (
        <div id="checklist_view" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Progress / Add Checklist Item */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Progress Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
              <h4 className="font-semibold text-slate-800 text-sm mb-3">Avance General Checklist</h4>
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center w-16 h-16">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                    <circle cx="32" cy="32" r="28" fill="transparent" stroke="#4f46e5" strokeWidth="6" 
                            strokeDasharray={175.9} strokeDashoffset={175.9 - (175.9 * checklistProgressPercent) / 100} />
                  </svg>
                  <span className="absolute text-xs font-bold text-slate-800">{checklistProgressPercent}%</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Actividades planificadas</p>
                  <p className="text-lg font-bold text-indigo-600">{completedChecklistCount} de {checklistItems.length}</p>
                  <p className="text-[10px] text-slate-400">Desde la reserva hasta el cierre</p>
                </div>
              </div>
            </div>

            {/* Add Checklist Form */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
              <h4 className="font-semibold text-slate-800 text-sm mb-4 border-b border-slate-100 pb-2">Crear Actividad Checklist</h4>
              <form onSubmit={handleAddChecklist} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre de la Actividad *</label>
                  <input
                    type="text"
                    value={newCheckItem.title}
                    onChange={(e) => setNewCheckItem({ ...newCheckItem, title: e.target.value })}
                    placeholder="ej: Contratar Dj y definir playlist"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Categoría</label>
                    <select
                      value={newCheckItem.category}
                      onChange={(e) => setNewCheckItem({ ...newCheckItem, category: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500 font-bold"
                    >
                      {(state.configurations?.timelineCategories || ['Contratos', 'Proveedores', 'Decoración', 'Logística', 'Invitados', 'General']).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Vencimiento</label>
                    <input
                      type="date"
                      value={newCheckItem.dueDate}
                      onChange={(e) => setNewCheckItem({ ...newCheckItem, dueDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Detalle / Notas (Opcional)</label>
                  <input
                    type="text"
                    value={newCheckItem.notes || ''}
                    onChange={(e) => setNewCheckItem({ ...newCheckItem, notes: e.target.value })}
                    placeholder="ej: Conectar con Luz & Sombra Estudio"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Agregar al Checklist
                </button>
              </form>
            </div>
          </div>

          {/* Checklist Interactive Table */}
          <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h4 className="font-semibold text-slate-800 text-sm">Organizador de Actividades del Evento</h4>
              <span className="text-[11px] text-slate-400">Total: {checklistItems.length} tareas asignadas</span>
            </div>

            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {checklistItems.map(item => (
                <div
                  id={`checklist_item_${item.id}`}
                  key={item.id}
                  className={`flex items-center justify-between p-3 border rounded-xl transition-all ${
                    item.completed 
                      ? 'border-emerald-100 bg-emerald-50/10' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      id={`btn_toggle_check_${item.id}`}
                      type="button"
                      onClick={() => handleToggleChecklist(item.id)}
                      className="mt-0.5 text-slate-400 hover:text-indigo-600 cursor-pointer"
                    >
                      {item.completed ? (
                        <CheckSquare className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    <div>
                      <span className={`text-xs font-semibold ${item.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {item.title}
                      </span>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                        <span className="bg-indigo-50 text-indigo-700 font-medium px-1.5 py-0.5 rounded-xs">
                          {item.category}
                        </span>
                        <span>•</span>
                        <Calendar className="w-3 h-3" />
                        <span>Límite: {item.dueDate}</span>
                        {item.notes && (
                          <>
                            <span>•</span>
                            <span className="italic text-slate-400 truncate max-w-[200px]">{item.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    id={`delete_check_${item.id}`}
                    type="button"
                    onClick={() => handleDeleteChecklist(item.id)}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {checklistItems.length === 0 && (
                <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs">No hay tareas creadas. Inicie agregando un paso arriba.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODULE 2: MINUTO A MINUTO */}
      {subTab === 'minuto_a_minuto' && (
        <div id="timeline_day_view" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Timeline Stats & Add Time Item */}
          <div className="lg:col-span-4 space-y-6">
            {/* Progress Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
              <h4 className="font-semibold text-slate-800 text-sm mb-3">Progreso del Evento (Día D)</h4>
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center w-16 h-16">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                    <circle cx="32" cy="32" r="28" fill="transparent" stroke="#ea580c" strokeWidth="6" 
                            strokeDasharray={175.9} strokeDashoffset={175.9 - (175.9 * timelineProgressPercent) / 100} />
                  </svg>
                  <span className="absolute text-xs font-bold text-slate-800">{timelineProgressPercent}%</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Sucesos minutados completados</p>
                  <p className="text-lg font-bold text-orange-600">{completedTimelineCount} de {dayTimelineItems.length}</p>
                  <p className="text-[10px] text-slate-400">Monitoreo continuo en tiempo real</p>
                </div>
              </div>
            </div>

            {/* Add Schedule Block */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
              <h4 className="font-semibold text-slate-800 text-sm mb-4 border-b border-slate-100 pb-2">Agregar Suceso Minutado</h4>
              <form onSubmit={handleAddTimeItem} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Hora *</label>
                    <input
                      type="text"
                      value={newTimeItem.time}
                      onChange={(e) => setNewTimeItem({ ...newTimeItem, time: e.target.value })}
                      placeholder="e.g. 17:30"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 font-mono outline-hidden focus:border-indigo-500 text-center"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Hito Principal *</label>
                    <input
                      type="text"
                      value={newTimeItem.title}
                      onChange={(e) => setNewTimeItem({ ...newTimeItem, title: e.target.value })}
                      placeholder="ej: Llegada del novio"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción Breve</label>
                  <textarea
                    value={newTimeItem.description}
                    onChange={(e) => setNewTimeItem({ ...newTimeItem, description: e.target.value })}
                    rows={2}
                    placeholder="Detalles sobre lo que ocurre o requerimientos..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Responsable Operativo</label>
                  <input
                    type="text"
                    value={newTimeItem.responsible}
                    onChange={(e) => setNewTimeItem({ ...newTimeItem, responsible: e.target.value })}
                    placeholder="ej: DJ / Banquetera / Coordinadora"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Clock className="w-4 h-4" />
                  Agregar Suceso
                </button>
              </form>
            </div>
          </div>

          {/* Interactive Day Timeline list */}
          <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h4 className="font-semibold text-slate-800 text-sm">Cronograma Minuto a Minuto del Día del Evento</h4>
              <span className="text-[11px] text-slate-400">Total: {dayTimelineItems.length} hitos coordinados</span>
            </div>

            <div className="relative border-l border-orange-200 pl-4 space-y-4 max-h-[450px] overflow-y-auto pr-1">
              {dayTimelineItems.map(item => (
                <div
                  id={`timeline_day_item_${item.id}`}
                  key={item.id}
                  className={`relative p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between gap-4 transition-all ${
                    item.completed ? 'border-emerald-100 bg-emerald-50/10 opacity-70' : ''
                  }`}
                >
                  {/* Circle locator on left axis */}
                  <div className={`absolute -left-[22px] top-4 w-3.5 h-3.5 rounded-full border-2 ring-4 ring-white ${
                    item.completed ? 'bg-emerald-500 border-emerald-600' : 'bg-orange-500 border-orange-600'
                  }`} />

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-sm font-mono">
                        {item.time}
                      </span>
                      <h5 className={`text-xs font-semibold ${item.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {item.title}
                      </h5>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-1.5 leading-relaxed">{item.description || 'Sin descripción adicional.'}</p>
                    
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="font-semibold text-slate-500">Coordinador:</span>
                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-xs font-medium">{item.responsible}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      id={`btn_toggle_time_${item.id}`}
                      type="button"
                      onClick={() => handleToggleTimeItem(item.id)}
                      className={`p-1.5 rounded-md hover:bg-slate-200 cursor-pointer ${item.completed ? 'text-emerald-500' : 'text-slate-400'}`}
                      title={item.completed ? 'Marcar como pendiente' : 'Marcar como realizado'}
                    >
                      <CheckSquare className="w-4 h-4" />
                    </button>
                    <button
                      id={`delete_time_${item.id}`}
                      type="button"
                      onClick={() => handleDeleteTimeItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {dayTimelineItems.length === 0 && (
                <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs">No hay eventos planificados para el cronograma diario. Cree uno en el formulario.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODULE 3: PROTOCOLOS */}
      {subTab === 'protocolos' && (
        <div id="protocols_view" className="space-y-6">
          
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-sm">Plantillas y Protocolos del Evento</h4>
            <button
              id="btn_new_protocol"
              onClick={() => setIsAddingProtocol(!isAddingProtocol)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAddingProtocol ? 'Cancelar Registro' : 'Nuevo Protocolo'}
            </button>
          </div>

          {/* New Protocol Form Expandable */}
          {isAddingProtocol && (
            <div id="protocol_form_container" className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-xs text-left animate-slide-in">
              <h4 className="font-bold text-slate-800 text-sm mb-4">Estructurar Protocolo Personalizado</h4>
              <form onSubmit={handleSaveProtocol} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Título del Protocolo *</label>
                    <input
                      type="text"
                      value={newProtocol.title}
                      onChange={(e) => setNewProtocol({...newProtocol, title: e.target.value})}
                      placeholder="ej: Protocolo de Ceremonia Civil"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción de la Plantilla</label>
                    <input
                      type="text"
                      value={newProtocol.description}
                      onChange={(e) => setNewProtocol({...newProtocol, description: e.target.value})}
                      placeholder="ej: Estructura de discursos familiares e ingresos"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Subsections: Members & Steps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
                  
                  {/* Intervening Members */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <Users className="w-4 h-4 text-slate-500" />
                      <h5 className="font-bold text-slate-700 text-xs">Participantes Clave / Familiares</h5>
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newProtocol.memberName}
                        onChange={(e) => setNewProtocol({...newProtocol, memberName: e.target.value})}
                        placeholder="Nombre participante"
                        className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-hidden"
                      />
                      <input
                        type="text"
                        value={newProtocol.memberRole}
                        onChange={(e) => setNewProtocol({...newProtocol, memberRole: e.target.value})}
                        placeholder="Rol (ej: Madrina)"
                        className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={handleAddTempMember}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Temporary list of members */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 max-h-[120px] overflow-y-auto">
                      {tempMembers.map((m, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white px-2 py-1 rounded-md border border-slate-100 text-[11px]">
                          <span className="font-semibold text-slate-800">{m.name}</span>
                          <span className="text-slate-500 font-medium italic">({m.role})</span>
                        </div>
                      ))}
                      {tempMembers.length === 0 && <p className="text-slate-400 text-[11px] text-center italic py-4">Sin participantes agregados.</p>}
                    </div>
                  </div>

                  {/* Sequential Steps */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <ArrowDown className="w-4 h-4 text-slate-500" />
                      <h5 className="font-bold text-slate-700 text-xs">Pasos de la Secuencia</h5>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newProtocol.stepInput}
                        onChange={(e) => setNewProtocol({...newProtocol, stepInput: e.target.value})}
                        placeholder="Acción / Paso secuencial..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={handleAddTempStep}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg cursor-pointer text-xs font-bold"
                      >
                        Añadir
                      </button>
                    </div>

                    {/* Temporary list of steps */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 max-h-[120px] overflow-y-auto text-left">
                      {tempSteps.map((s, idx) => (
                        <div key={idx} className="flex gap-1.5 items-start bg-white p-1.5 rounded-md border border-slate-100 text-[11px]">
                          <span className="font-mono text-indigo-600 font-bold">{idx + 1}.</span>
                          <span className="text-slate-700 leading-normal">{s}</span>
                        </div>
                      ))}
                      {tempSteps.length === 0 && <p className="text-slate-400 text-[11px] text-center italic py-4">Sin pasos definidos.</p>}
                    </div>
                  </div>

                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
                  >
                    Guardar Protocolo
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Protocols List Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {protocols.map(proto => (
              <div id={`protocol_card_${proto.id}`} key={proto.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-indigo-600 animate-pulse" />
                      {proto.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{proto.description || 'Sin notas descriptivas.'}</p>
                  </div>
                  <button
                    id={`delete_proto_${proto.id}`}
                    type="button"
                    onClick={() => handleDeleteProtocol(proto.id)}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Participants section */}
                  <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider">Intervienen:</span>
                    <div className="space-y-1 max-h-[140px] overflow-y-auto pr-0.5">
                      {proto.members.map(member => (
                        <div key={member.id} className="text-[11px] bg-white p-1 rounded-sm border border-slate-100 flex justify-between gap-1.5">
                          <span className="font-semibold text-slate-700 truncate max-w-[100px]">{member.name}</span>
                          <span className="text-slate-500 font-medium text-[10px] truncate max-w-[100px]">{member.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sequence step list */}
                  <div className="bg-indigo-50/20 p-2.5 rounded-xl border border-indigo-100/30 space-y-1.5">
                    <span className="text-[10px] font-bold text-indigo-800 block uppercase tracking-wider">Secuencia de Pasos:</span>
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-0.5">
                      {proto.steps.map((step, idx) => (
                        <div key={idx} className="text-[11px] text-slate-700 leading-normal flex gap-1 items-start">
                          <span className="font-bold text-indigo-600 font-mono text-[10px]">{idx + 1}.</span>
                          <p>{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {protocols.length === 0 && (
              <div className="col-span-2 py-16 text-center bg-white border border-slate-100 shadow-xs rounded-2xl flex flex-col items-center justify-center">
                <Sparkles className="w-10 h-10 text-indigo-300 mb-2" />
                <p className="text-slate-500 text-xs font-semibold">No se han registrado protocolos específicos para este evento.</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm">Estructure el orden de discursos, la entrada o eventos nupciales en el panel superior.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* SUB-MODULE 4: CALENDARIO MENSUAL INTERACTIVO */}
      {subTab === 'calendario' && (
        <div id="calendar_view" className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          
          {/* Left Column: Calendar Monthly Grid */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
              
              {/* Calendar Header / Navigator */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">
                      {monthNames[currentMonth]} {currentYear}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Visualiza y prioriza las fechas de vencimiento de tareas y pagos del evento activo
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    id="btn_prev_month"
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 border border-slate-200 hover:border-indigo-200 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-600 transition-colors"
                    title="Mes Anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {client.eventDate && (
                    <button
                      id="btn_go_event_month"
                      type="button"
                      onClick={handleGoToEventMonth}
                      className="px-2.5 py-1.5 border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                      title="Ir al mes del evento activo"
                    >
                      Mes del Evento
                    </button>
                  )}
                  
                  <button
                    id="btn_next_month"
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 border border-slate-200 hover:border-indigo-200 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-600 transition-colors"
                    title="Siguiente Mes"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Weekday Titles */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {weekdays.map((day, idx) => (
                  <div key={idx} className="text-xs font-bold text-slate-400 uppercase py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Grid of Days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell, idx) => {
                  const dayEvents = calendarEventsMap[cell.dateStr] || [];
                  const isToday = cell.dateStr === new Date().toISOString().split('T')[0];
                  const isSelected = cell.dateStr === activeSelectedDay;
                  
                  // Categorize events inside the cell to display neat indicators
                  const hasEventDay = dayEvents.some(e => e.type === 'event_day');
                  const pendingTasks = dayEvents.filter(e => e.type === 'task' && !e.completed);
                  const completedTasks = dayEvents.filter(e => e.type === 'task' && e.completed);
                  const pendingPayments = dayEvents.filter(e => e.type === 'payment' && !e.completed);
                  
                  return (
                    <button
                      id={`calendar_cell_${cell.dateStr}`}
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDayStr(cell.dateStr)}
                      className={`h-24 sm:h-28 text-left p-2 border rounded-xl flex flex-col justify-between transition-all outline-hidden relative group cursor-pointer ${
                        cell.isCurrentMonth 
                          ? 'bg-white border-slate-100 text-slate-800 hover:border-indigo-300 hover:bg-slate-50/50' 
                          : 'bg-slate-50/40 border-slate-100 text-slate-400 hover:bg-slate-50/70'
                      } ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50/15 ring-2 ring-indigo-600/10 z-10' 
                          : ''
                      } ${
                        isToday 
                          ? 'ring-2 ring-amber-500/30 border-amber-500/80' 
                          : ''
                      }`}
                    >
                      {/* Day number & Today pill */}
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                          isToday 
                            ? 'bg-amber-100 text-amber-900 font-extrabold' 
                            : isSelected 
                            ? 'bg-indigo-100 text-indigo-900 font-extrabold' 
                            : 'text-slate-600'
                        }`}>
                          {cell.day}
                        </span>
                        
                        {/* Event indicator (star) */}
                        {hasEventDay && (
                          <span className="p-0.5 bg-rose-50 text-rose-600 rounded-sm animate-pulse" title="¡Día del Evento!">
                            <Star className="w-3 h-3 fill-rose-500 text-rose-500" />
                          </span>
                        )}
                      </div>
                      
                      {/* Event indicators/snippets inside cell */}
                      <div className="space-y-1 w-full overflow-hidden flex-1 mt-1.5 text-[9px] flex flex-col justify-end">
                        {/* Event Day line snippet */}
                        {dayEvents.filter(e => e.type === 'event_day').map(ev => {
                          const isCurrentEvent = ev.originalItem.id === client.id;
                          return (
                            <div 
                              key={ev.id} 
                              className={`px-1 py-0.5 rounded-sm border truncate w-full flex items-center gap-0.5 font-bold ${
                                isCurrentEvent 
                                  ? 'bg-rose-50 border-rose-200 text-rose-800 animate-pulse' 
                                  : 'bg-indigo-50 border-indigo-200 text-indigo-850'
                              }`}
                              title={ev.title}
                            >
                              <span className={`w-1 h-1 rounded-full shrink-0 ${isCurrentEvent ? 'bg-rose-600' : 'bg-indigo-600'}`} />
                              <span className="truncate text-[8px] uppercase">{ev.originalItem.eventName || ev.originalItem.name}</span>
                            </div>
                          );
                        })}
                        
                        {/* Tasks bullet list or counts */}
                        {pendingTasks.length > 0 && (
                          <div className="bg-indigo-50/80 text-indigo-700 font-semibold px-1 py-0.5 rounded-sm border border-indigo-100/50 truncate w-full flex items-center gap-1 shrink-0">
                            <span className="w-1 h-1 rounded-full bg-indigo-500 shrink-0" />
                            <span className="truncate">{pendingTasks.length} {pendingTasks.length === 1 ? 'tarea' : 'tareas'}</span>
                          </div>
                        )}
                        
                        {/* Payments bullet list or counts */}
                        {pendingPayments.length > 0 && (
                          <div className="bg-amber-50/80 text-amber-800 font-semibold px-1 py-0.5 rounded-sm border border-amber-100/50 truncate w-full flex items-center gap-1 shrink-0">
                            <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                            <span className="truncate">Pago cuota</span>
                          </div>
                        )}
                        
                        {/* Show checklist icon if there are completed tasks but no pending */}
                        {pendingTasks.length === 0 && completedTasks.length > 0 && (
                          <div className="text-emerald-600 font-semibold px-1 py-0.5 rounded-sm truncate w-full flex items-center gap-1 opacity-70 shrink-0">
                            <CheckSquare className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate text-[8px] line-through text-slate-400">{completedTasks.length} completas</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Color legend guide */}
              <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-400 uppercase tracking-wide mr-1 text-[10px]">Leyenda:</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Día del Evento
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Tareas Pendientes
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Fechas de Pago Pendientes
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                  Completado / Pagado
                </span>
              </div>
              
            </div>
          </div>
          
          {/* Right Column: Day Details & Quick Add Task */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Day Agenda Details */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Plan de Actividades</span>
                <h4 className="font-bold text-slate-800 text-sm mt-0.5">
                  {activeSelectedDay 
                    ? `Agenda: ${activeSelectedDay.split('-')[2]} de ${monthNames[parseInt(activeSelectedDay.split('-')[1], 10) - 1]}, ${activeSelectedDay.split('-')[0]}`
                    : 'Seleccione un día'}
                </h4>
              </div>
              
              {activeSelectedDay ? (
                (() => {
                  const dayEvents = calendarEventsMap[activeSelectedDay] || [];
                  
                  return (
                    <div className="space-y-4">
                      {dayEvents.length > 0 ? (
                        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                          {dayEvents.map((ev) => {
                            if (ev.type === 'event_day') {
                              const evClient = ev.originalItem;
                              const isCurrentSelected = evClient.id === client.id;
                              return (
                                <div 
                                  key={ev.id} 
                                  className={`p-3 rounded-xl text-xs space-y-2 text-left border ${
                                    isCurrentSelected
                                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                                      : 'bg-indigo-50/50 border-indigo-150 text-indigo-900'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 font-black">
                                      <Star className={`w-4 h-4 shrink-0 ${isCurrentSelected ? 'fill-rose-500 text-rose-500' : 'fill-indigo-500 text-indigo-500'}`} />
                                      <span className="uppercase tracking-wide text-[10px]">Día de Evento</span>
                                    </div>
                                    {isCurrentSelected && (
                                      <span className="text-[9px] bg-rose-200 text-rose-800 font-extrabold px-1.5 py-0.5 rounded-sm">
                                        ACTIVO
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-800 text-[11px] leading-tight">
                                      {evClient.eventName || evClient.name}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-1 font-medium">
                                      Cliente: {evClient.name} • Contacto: {evClient.phone || evClient.email}
                                    </p>
                                    <p className="text-[9px] text-indigo-600 font-bold mt-0.5">
                                      Tipo: {evClient.eventType.toUpperCase()}
                                    </p>
                                  </div>
                                  
                                  <div className={`pt-2 border-t flex justify-between items-center text-[10px] ${isCurrentSelected ? 'border-rose-200/60' : 'border-indigo-150/60'}`}>
                                    {isCurrentSelected ? (
                                      <button
                                        type="button"
                                        onClick={() => setSubTab('minuto_a_minuto')}
                                        className="underline hover:text-rose-900 cursor-pointer font-bold flex items-center gap-1"
                                      >
                                        Ver Minuto a Minuto →
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          updateState({ selectedClientId: evClient.id });
                                          setSelectedDayStr(activeSelectedDay);
                                        }}
                                        className="underline hover:text-indigo-900 font-bold cursor-pointer flex items-center gap-1 text-[10px]"
                                      >
                                        Operar este Evento →
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            } else if (ev.type === 'task') {
                              const task = ev.originalItem;
                              return (
                                <div 
                                  key={ev.id} 
                                  className={`p-3 border rounded-xl text-xs flex items-start gap-3 transition-colors ${
                                    task.completed 
                                      ? 'bg-emerald-50/10 border-emerald-100 opacity-80' 
                                      : 'bg-indigo-50/20 border-indigo-100/50 hover:bg-indigo-50/40'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleToggleChecklist(task.id)}
                                    className="mt-0.5 text-slate-400 hover:text-indigo-600 cursor-pointer shrink-0"
                                    title="Alternar estado"
                                  >
                                    {task.completed ? (
                                      <CheckSquare className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                      <Square className="w-4 h-4" />
                                    )}
                                  </button>
                                  
                                  <div className="flex-1 space-y-0.5 text-left min-w-0">
                                    <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded uppercase tracking-wide">
                                      {task.category}
                                    </span>
                                    <p className={`font-semibold text-slate-800 text-[11px] truncate ${
                                      task.completed ? 'line-through text-slate-400' : ''
                                    }`}>
                                      {task.title}
                                    </p>
                                    {task.notes && (
                                      <p className="text-[10px] text-slate-400 italic truncate">{task.notes}</p>
                                    )}
                                  </div>
                                  
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteChecklist(task.id)}
                                    className="p-1 text-slate-400 hover:text-red-500 shrink-0 rounded hover:bg-red-50 cursor-pointer"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            } else {
                              const payment = ev.originalItem;
                              const isOverdue = new Date(payment.dueDate) < new Date() && payment.status !== 'pagado';
                              return (
                                <div 
                                  key={ev.id} 
                                  className={`p-3 border rounded-xl text-xs space-y-1 text-left ${
                                    payment.status === 'pagado'
                                      ? 'bg-emerald-50/20 border-emerald-100/70' 
                                      : 'bg-amber-50/30 border-amber-100/70'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                                      Vencimiento de Pago
                                    </span>
                                    <span className={`px-1.5 py-0.2 font-bold text-[9px] rounded-sm uppercase ${
                                      payment.status === 'pagado'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {payment.status}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-baseline justify-between">
                                    <p className="font-bold text-slate-800 text-sm">
                                      {Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(payment.amount)}
                                    </p>
                                    {isOverdue && (
                                      <span className="text-[9px] text-red-600 font-semibold">¡Atrasado!</span>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                          <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-400 text-xs">No hay actividades registradas para esta fecha.</p>
                          <p className="text-[10px] text-slate-400 mt-1">Usa el formulario inferior para agregar una tarea rápido.</p>
                        </div>
                      )}
                      
                      {/* Quick Add Task Form */}
                      <div className="pt-4 border-t border-slate-100 space-y-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Creación Rápida para el {activeSelectedDay.split('-')[2]}/{activeSelectedDay.split('-')[1]}
                        </span>
                        
                        <form onSubmit={(e) => handleQuickAddChecklist(e, activeSelectedDay)} className="space-y-3 text-left">
                          <div>
                            <input
                              type="text"
                              value={quickTaskTitle}
                              onChange={(e) => setQuickTaskTitle(e.target.value)}
                              placeholder="ej: Llamar a la banquetera"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500"
                              required
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <select
                                value={quickTaskCategory}
                                onChange={(e) => setQuickTaskCategory(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500"
                              >
                                <option value="Contratos">Contratos</option>
                                <option value="Proveedores">Proveedores</option>
                                <option value="Decoración">Decoración</option>
                                <option value="Logística">Logística</option>
                                <option value="Invitados">Invitados</option>
                                <option value="General">General</option>
                              </select>
                            </div>
                            
                            <div>
                              <input
                                type="text"
                                value={quickTaskNotes}
                                onChange={(e) => setQuickTaskNotes(e.target.value)}
                                placeholder="Notas (opcional)"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500"
                              />
                            </div>
                          </div>
                          
                          <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Agregar Tarea
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Selecciona cualquier día de la cuadrícula para ver tareas y gestionar la agenda del evento.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
