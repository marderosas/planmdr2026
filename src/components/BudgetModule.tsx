/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BudgetItem, PaymentInstallment, EventState } from '../types';
import { DollarSign, Plus, Check, CreditCard, Receipt, FileText, Printer, Trash2, Calendar, TrendingDown, TrendingUp, HelpCircle } from 'lucide-react';

interface BudgetModuleProps {
  state: EventState;
  updateState: (newState: Partial<EventState>) => void;
}

export default function BudgetModule({ state, updateState }: BudgetModuleProps) {
  const selectedClientId = state.selectedClientId;
  const client = state.clients.find(c => c.id === selectedClientId) || state.clients[0];

  // Form States
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingInstallment, setIsAddingInstallment] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  // New Budget Item Form State
  const [newItemData, setNewItemData] = useState({
    category: 'catering' as BudgetItem['category'],
    name: '',
    plannedCost: 0,
    actualCost: 0,
    paidAmount: 0,
    notes: ''
  });

  // New Installment Form State
  const [newInstallmentData, setNewInstallmentData] = useState({
    dueDate: client?.eventDate || '',
    amount: 0,
    reference: ''
  });

  if (!client) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-xs">
        <div className="p-3 bg-slate-50 text-slate-400 rounded-full w-fit mx-auto mb-3">
          <DollarSign className="w-6 h-6 text-indigo-500" />
        </div>
        <p className="text-slate-500 font-bold text-sm">No hay eventos activos</p>
        <p className="text-xs text-slate-400 mt-1">Por favor registre un cliente y evento en la pestaña CRM para comenzar.</p>
      </div>
    );
  }

  const budgetItems = state.budgetItems[client.id] || [];
  const installments = state.installments[client.id] || [];

  // Calculate stats
  const totalPlanned = budgetItems.reduce((acc, item) => acc + item.plannedCost, 0);
  const totalActual = budgetItems.reduce((acc, item) => acc + item.actualCost, 0);
  const totalPaid = budgetItems.reduce((acc, item) => acc + item.paidAmount, 0);
  const remainingDebt = totalActual - totalPaid;

  const totalInstallmentsPlanned = installments.reduce((acc, inst) => acc + inst.amount, 0);
  const totalInstallmentsPaid = installments.filter(inst => inst.status === 'pagado').reduce((acc, inst) => acc + inst.amount, 0);

  // Budget progress percentage compared to limit
  const limitProgressPercent = client?.budgetLimit 
    ? Math.round((totalActual / client.budgetLimit) * 100) 
    : 0;

  // Add Item to Budget
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.name) return;

    const newItem: BudgetItem = {
      id: 'bi_' + Date.now(),
      category: newItemData.category,
      name: newItemData.name,
      plannedCost: Number(newItemData.plannedCost),
      actualCost: Number(newItemData.actualCost || newItemData.plannedCost),
      paidAmount: Number(newItemData.paidAmount),
      notes: newItemData.notes
    };

    updateState({
      budgetItems: {
        ...state.budgetItems,
        [client.id]: [...budgetItems, newItem]
      }
    });

    setNewItemData({
      category: 'catering',
      name: '',
      plannedCost: 0,
      actualCost: 0,
      paidAmount: 0,
      notes: ''
    });
    setIsAddingItem(false);
  };

  const handleDeleteItem = (itemId: string) => {
    updateState({
      budgetItems: {
        ...state.budgetItems,
        [client.id]: budgetItems.filter(item => item.id !== itemId)
      }
    });
  };

  // Add Payment Installment
  const handleAddInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newInstallmentData.amount <= 0) return;

    const newInst: PaymentInstallment = {
      id: 'inst_' + Date.now(),
      dueDate: newInstallmentData.dueDate || client.eventDate,
      amount: Number(newInstallmentData.amount),
      status: 'pendiente',
      reference: newInstallmentData.reference || 'Cuota de Pago'
    };

    updateState({
      installments: {
        ...state.installments,
        [client.id]: [...installments, newInst]
      }
    });

    setNewInstallmentData({
      dueDate: client.eventDate,
      amount: 0,
      reference: ''
    });
    setIsAddingInstallment(false);
  };

  const handleToggleInstallmentStatus = (instId: string) => {
    const updated = installments.map(inst => {
      if (inst.id === instId) {
        const isPaid = inst.status === 'pagado';
        return {
          ...inst,
          status: (isPaid ? 'pendiente' : 'pagado') as 'pendiente' | 'pagado',
          datePaid: isPaid ? undefined : new Date().toISOString().split('T')[0]
        };
      }
      return inst;
    });

    updateState({
      installments: {
        ...state.installments,
        [client.id]: updated
      }
    });
  };

  const handleDeleteInstallment = (instId: string) => {
    updateState({
      installments: {
        ...state.installments,
        [client.id]: installments.filter(inst => inst.id !== instId)
      }
    });
  };

  const getCategoryLabel = (cat: BudgetItem['category']) => {
    switch (cat) {
      case 'lugar': return 'Lugar / Finca';
      case 'catering': return 'Catering / Bebidas';
      case 'decoracion': return 'Decoración / Flores';
      case 'musica_sonido': return 'Música & Sonido';
      case 'fotografia': return 'Foto & Video';
      case 'personal': return 'Staff / Seguridad';
      case 'otros': return 'Papelería / Otros';
      default: return cat.charAt(0).toUpperCase() + cat.slice(1);
    }
  };

  // VAT/Tax calculation (e.g., 19% Chile)
  const taxRate = 0.19;
  const netTotal = totalActual;
  const taxAmount = netTotal * taxRate;
  const grossTotal = netTotal + taxAmount;

  const formatCLP = (val: number) => {
    return Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div id="budget_module" className="space-y-6">
      
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
        <div className="text-left">
          <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">Presupuesto y Finanzas</span>
          <h2 className="text-lg font-bold text-slate-800">{client?.eventName || 'Seleccione un Evento'}</h2>
        </div>
        
        <div className="flex gap-2">
          <button
            id="btn_open_invoice"
            onClick={() => setInvoiceModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg shadow-2xs transition-all cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-500" />
            Crear Factura PDF
          </button>
        </div>
      </div>

      {/* DASHBOARD STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs text-left">
          <div className="flex justify-between items-start mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Límite Permitido</span>
            <HelpCircle className="w-4 h-4 text-slate-300" />
          </div>
          <p className="text-base font-bold text-slate-900">{formatCLP(client?.budgetLimit || 0)}</p>
          <div className="mt-2.5">
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full ${limitProgressPercent > 100 ? 'bg-red-500' : 'bg-indigo-600'}`}
                style={{ width: `${Math.min(limitProgressPercent, 100)}%` }}
              />
            </div>
            <span className={`text-[10px] block mt-1 font-semibold ${limitProgressPercent > 100 ? 'text-red-500' : 'text-slate-500'}`}>
              Usado: {limitProgressPercent}% del total
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs text-left">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider mb-1.5">Costo Real Total</span>
          <p className="text-base font-bold text-slate-900">{formatCLP(totalActual)}</p>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
            <TrendingDown className="w-3 h-3" />
            <span>Presupuestado: {formatCLP(totalPlanned)}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs text-left">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider mb-1.5">Monto Pagado</span>
          <p className="text-base font-bold text-emerald-600">{formatCLP(totalPaid)}</p>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>Cobros Registrados</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs text-left">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider mb-1.5">Saldo Pendiente</span>
          <p className="text-base font-bold text-rose-600">{formatCLP(remainingDebt)}</p>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-500 font-medium">
            <CreditCard className="w-3 h-3" />
            <span>Por cobrar o liquidar</span>
          </div>
        </div>

      </div>

      {/* CORE CONTENT ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: BUDGET ITEMS LIST */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Desglose de Costos e Impuestos</h4>
              <p className="text-xs text-slate-500 mt-0.5">Control pormenorizado por categorías de gastos</p>
            </div>
            
            <button
              id="btn_add_cost_item"
              onClick={() => setIsAddingItem(!isAddingItem)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAddingItem ? 'Cancelar' : 'Agregar Item'}
            </button>
          </div>

          {/* Add budget item form */}
          {isAddingItem && (
            <form onSubmit={handleAddItem} className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 animate-slide-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del Item / Proveedor *</label>
                  <input
                    type="text"
                    value={newItemData.name}
                    onChange={(e) => setNewItemData({...newItemData, name: e.target.value})}
                    placeholder="ej: Banquete rústico Catering Torres"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Categoría</label>
                  <select
                    value={newItemData.category}
                    onChange={(e) => setNewItemData({...newItemData, category: e.target.value as BudgetItem['category']})}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500 font-bold capitalize"
                  >
                    {(state.configurations?.budgetCategories || ['lugar', 'catering', 'decoracion', 'musica_sonido', 'fotografia', 'personal', 'otros']).map((cat) => {
                      const label = cat === 'lugar' ? 'Lugar / Finca'
                                  : cat === 'catering' ? 'Catering / Alimentos'
                                  : cat === 'decoracion' ? 'Decoración / Flores'
                                  : cat === 'musica_sonido' ? 'Música & Sonido'
                                  : cat === 'fotografia' ? 'Fotografía / Vídeo'
                                  : cat === 'personal' ? 'Personal / Staff'
                                  : cat === 'otros' ? 'Otros / Papelería'
                                  : cat;
                      return (
                        <option key={cat} value={cat}>{label}</option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Costo Planificado (CLP) *</label>
                  <input
                    type="number"
                    value={newItemData.plannedCost}
                    onChange={(e) => setNewItemData({...newItemData, plannedCost: Number(e.target.value)})}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Costo Real (CLP)</label>
                  <input
                    type="number"
                    value={newItemData.actualCost}
                    onChange={(e) => setNewItemData({...newItemData, actualCost: Number(e.target.value)})}
                    placeholder="Dejar vacío si es igual"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Monto Pagado a la Fecha (CLP)</label>
                  <input
                    type="number"
                    value={newItemData.paidAmount}
                    onChange={(e) => setNewItemData({...newItemData, paidAmount: Number(e.target.value)})}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notas de Pago / Detalles</label>
                <input
                  type="text"
                  value={newItemData.notes}
                  onChange={(e) => setNewItemData({...newItemData, notes: e.target.value})}
                  placeholder="ej: Pago realizado 50% anticipo"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 rounded-lg cursor-pointer"
              >
                Registrar Item de Costo
              </button>
            </form>
          )}

          {/* Table display */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Categoría</th>
                  <th className="py-3 px-3">Descripción / Item</th>
                  <th className="py-3 px-3 text-right">Estimado</th>
                  <th className="py-3 px-3 text-right">Costo Real</th>
                  <th className="py-3 px-3 text-right">Pagado</th>
                  <th className="py-3 px-3 text-right">Pendiente</th>
                  <th className="py-3 px-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {budgetItems.map(item => {
                  const pendingItem = item.actualCost - item.paidAmount;
                  return (
                    <tr id={`budget_row_${item.id}`} key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-3">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-sm font-medium">
                          {getCategoryLabel(item.category)}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-800 block">{item.name}</span>
                        {item.notes && <span className="text-[10px] text-slate-400 block italic">{item.notes}</span>}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono">{formatCLP(item.plannedCost)}</td>
                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-slate-900">{formatCLP(item.actualCost)}</td>
                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-emerald-600">{formatCLP(item.paidAmount)}</td>
                      <td className={`py-3.5 px-3 text-right font-mono font-semibold ${pendingItem > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {formatCLP(pendingItem)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          id={`delete_budget_${item.id}`}
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {budgetItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      No se han cargado costos para este presupuesto.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: REVENUE & INSTALLMENTS TRACKING */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Planes de Pago y Cobro</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Control de anticipos y cuotas</p>
              </div>
              <button
                id="btn_add_installment"
                onClick={() => setIsAddingInstallment(!isAddingInstallment)}
                className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Progress of Installments */}
            <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
              <div className="flex justify-between font-semibold mb-1">
                <span>Cobrado por Cuotas</span>
                <span className="text-emerald-600">{formatCLP(totalInstallmentsPaid)} / {formatCLP(totalInstallmentsPlanned)}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full"
                  style={{ width: `${totalInstallmentsPlanned > 0 ? Math.min((totalInstallmentsPaid / totalInstallmentsPlanned) * 100, 100) : 0}%` }}
                />
              </div>
            </div>

            {/* Add Installment Form */}
            {isAddingInstallment && (
              <form onSubmit={handleAddInstallment} className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-slide-in">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Referencia del Pago</label>
                  <input
                    type="text"
                    value={newInstallmentData.reference}
                    onChange={(e) => setNewInstallmentData({...newInstallmentData, reference: e.target.value})}
                    placeholder="ej: Reserva inicial"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-hidden"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Monto (CLP)</label>
                    <input
                      type="number"
                      value={newInstallmentData.amount || ''}
                      onChange={(e) => setNewInstallmentData({...newInstallmentData, amount: Number(e.target.value)})}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-hidden"
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Vencimiento</label>
                    <input
                      type="date"
                      value={newInstallmentData.dueDate}
                      onChange={(e) => setNewInstallmentData({...newInstallmentData, dueDate: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 outline-hidden"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold py-1.5 rounded-md cursor-pointer"
                >
                  Agregar Cuota
                </button>
              </form>
            )}

            {/* Installments List */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
              {installments.map(inst => (
                <div
                  id={`installment_item_${inst.id}`}
                  key={inst.id}
                  className={`p-3 border rounded-xl flex items-center justify-between text-left transition-all ${
                    inst.status === 'pagado' 
                      ? 'border-emerald-100 bg-emerald-50/5' 
                      : 'border-slate-100 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800 text-xs">{inst.reference}</span>
                      {inst.status === 'pagado' ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">Pagado</span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">Pendiente</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Límite: {inst.dueDate}</span>
                      {inst.datePaid && <span className="text-emerald-600">({inst.datePaid})</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-800">{formatCLP(inst.amount)}</span>
                    <button
                      id={`btn_toggle_installment_${inst.id}`}
                      onClick={() => handleToggleInstallmentStatus(inst.id)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        inst.status === 'pagado' 
                          ? 'bg-emerald-100 border-emerald-200 text-emerald-700' 
                          : 'bg-white border-slate-200 text-slate-400 hover:text-emerald-600'
                      }`}
                      title={inst.status === 'pagado' ? 'Marcar como Pendiente' : 'Marcar como Pagado'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`delete_installment_${inst.id}`}
                      onClick={() => handleDeleteInstallment(inst.id)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {installments.length === 0 && (
                <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-slate-400 text-xs">No hay cuotas de pago configuradas.</p>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* MODAL: PROFESSIONAL BUDGET INVOICE GENERATOR */}
      {invoiceModalOpen && (
        <div id="invoice_modal" className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            
            {/* Action Bar (Top) */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-slate-800 text-base">Generador Profesional de Cotización / Factura</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* PRINTABLE BILL SHEET */}
            <div id="printable_invoice" className="flex-1 overflow-y-auto bg-slate-50 p-6 rounded-xl border border-slate-100 text-left text-slate-800 font-sans leading-normal">
              <div className="bg-white p-8 rounded-lg shadow-xs max-w-2xl mx-auto space-y-6">
                
                {/* Branding Block */}
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-xl font-extrabold text-indigo-700 tracking-tight">Mar de Rosas</h1>
                    <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Catering, Decoración & Event Planning Premium</p>
                    <p className="text-xs text-slate-500 mt-2">Santiago, Chile • contacto@marderosas.cl</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-3 py-1 rounded-sm uppercase tracking-wider">COTIZACIÓN DE EVENTO</span>
                    <p className="text-xs font-bold text-slate-800 mt-2">FACTURA #: MR-2026-{client?.id.toUpperCase()}</p>
                    <p className="text-[11px] text-slate-500">Fecha: {new Date().toISOString().split('T')[0]}</p>
                    <p className="text-[11px] text-slate-500">Vencimiento: {client?.eventDate}</p>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Billing details */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[9px] block mb-1">FACTURAR A:</span>
                    <p className="font-bold text-slate-800 text-sm">{client?.name}</p>
                    <p className="text-slate-500 mt-1">{client?.email}</p>
                    <p className="text-slate-500">{client?.phone}</p>
                    {client?.company && <p className="text-slate-500 font-semibold">{client.company}</p>}
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-400 uppercase text-[9px] block mb-1">DETALLES DEL EVENTO:</span>
                    <p className="font-bold text-slate-800">{client?.eventName}</p>
                    <p className="text-slate-500 mt-1">Fecha de Celebración: <b>{client?.eventDate}</b></p>
                    <p className="text-slate-500">Tipo: <span className="capitalize">{client?.eventType}</span></p>
                  </div>
                </div>

                {/* Items grid */}
                <table className="w-full text-xs text-left border-collapse mt-4">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px]">
                      <th className="py-2">Item / Servicio</th>
                      <th className="py-2">Categoría</th>
                      <th className="py-2 text-right">Precio Neto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {budgetItems.map(item => (
                      <tr key={item.id}>
                        <td className="py-2.5">
                           <p className="font-bold text-slate-800">{item.name}</p>
                           {item.notes && <p className="text-[10px] text-slate-400">{item.notes}</p>}
                        </td>
                        <td className="py-2.5 capitalize">{getCategoryLabel(item.category)}</td>
                        <td className="py-2.5 text-right font-mono">{formatCLP(item.actualCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals Block */}
                <div className="flex justify-end pt-4">
                  <div className="w-64 space-y-2 text-xs border-t border-slate-200 pt-3">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal Neto:</span>
                      <span className="font-mono">{formatCLP(netTotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>IVA (19%):</span>
                      <span className="font-mono">{formatCLP(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 pb-2 border-b border-slate-100">
                      <span>Retenciones / Tasas:</span>
                      <span className="font-mono">$0</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 text-sm">
                      <span>Monto Total Bruto:</span>
                      <span className="font-mono text-indigo-700">{formatCLP(grossTotal)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-emerald-600 font-semibold pt-1">
                      <span>Depósitos Realizados:</span>
                      <span className="font-mono">-{formatCLP(totalPaid)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-rose-600 font-bold border-t border-dashed border-slate-200 pt-2">
                      <span>SALDO RESTANTE DUE:</span>
                      <span className="font-mono">{formatCLP(grossTotal - totalPaid)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Methods and conditions */}
                <div className="bg-slate-50 p-4 rounded-lg text-[10px] text-slate-500 space-y-1 mt-6">
                  <p className="font-bold text-slate-700 uppercase tracking-wide">Métodos y Condiciones de Pago:</p>
                  <p>1. Transferencia Electrónica: Banco de Chile, Cuenta Corriente: 12-345-67890 (Indicar Factura # en el asunto)</p>
                  <p>2. Liquidación del 100% de los saldos con un mínimo de 15 días previos a la fecha del evento.</p>
                  <p>3. Este documento tiene calidad de propuesta técnico-económica preliminar y no constituye contrato definitivo.</p>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
