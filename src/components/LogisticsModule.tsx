/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Vendor, ServiceOrder, Table, Guest, EventState } from '../types';
import { Truck, Plus, Mail, Phone, Star, Tag, Send, CheckCircle2, MapPin, Grid, Layers, UserPlus, Trash, Sliders, List } from 'lucide-react';

interface LogisticsModuleProps {
  state: EventState;
  updateState: (newState: Partial<EventState>) => void;
}

export default function LogisticsModule({ state, updateState }: LogisticsModuleProps) {
  const selectedClientId = state.selectedClientId;
  const client = state.clients.find(c => c.id === selectedClientId) || state.clients[0];

  // Sub Tab: 'proveedores' | 'ordenes' | 'planos'
  const [logSubTab, setLogSubTab] = useState<'proveedores' | 'ordenes' | 'planos'>('proveedores');

  // Vendor database form state
  const [isAddingVendor, setIsAddingVendor] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '',
    category: 'catering' as Vendor['category'],
    contactName: '',
    phone: '',
    email: '',
    basePrice: 500,
    rating: 5.0,
    notes: ''
  });

  // Service Order Form State
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    vendorId: '',
    itemInput: '',
    setupTime: '12:00',
    eventTime: '18:00',
    teardownTime: '23:30',
    notes: ''
  });
  const [tempOrderItems, setTempOrderItems] = useState<string[]>([]);

  // Seating Planner Form State
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(10);
  const [newTableShape, setNewTableShape] = useState<'circle' | 'square'>('circle');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);

  if (!client) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-xs">
        <div className="p-3 bg-slate-50 text-slate-400 rounded-full w-fit mx-auto mb-3">
          <Truck className="w-6 h-6 text-indigo-500" />
        </div>
        <p className="text-slate-500 font-bold text-sm">No hay eventos activos</p>
        <p className="text-xs text-slate-400 mt-1">Por favor registre un cliente y evento en la pestaña CRM para comenzar.</p>
      </div>
    );
  }

  const serviceOrders = state.serviceOrders[client.id] || [];
  const tables = state.tables[client.id] || [];
  const guests = state.guests[client.id] || [];

  // 1. Supplier Database Functions
  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendor.name) return;

    const vendor: Vendor = {
      id: 'v_' + Date.now(),
      name: newVendor.name,
      category: newVendor.category,
      contactName: newVendor.contactName,
      phone: newVendor.phone,
      email: newVendor.email,
      basePrice: Number(newVendor.basePrice),
      rating: Number(newVendor.rating),
      status: 'disponible',
      notes: newVendor.notes
    };

    updateState({
      vendors: [...state.vendors, vendor]
    });

    setNewVendor({
      name: '',
      category: 'catering',
      contactName: '',
      phone: '',
      email: '',
      basePrice: 500,
      rating: 5.0,
      notes: ''
    });
    setIsAddingVendor(false);
  };

  const handleDeleteVendor = (id: string) => {
    updateState({
      vendors: state.vendors.filter(v => v.id !== id)
    });
  };

  // 2. Service Orders Functions
  const handleAddOrderItem = () => {
    if (!newOrder.itemInput.trim()) return;
    setTempOrderItems([...tempOrderItems, newOrder.itemInput.trim()]);
    setNewOrder({ ...newOrder, itemInput: '' });
  };

  const handleCreateServiceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.vendorId) return;

    const selectedVendor = state.vendors.find(v => v.id === newOrder.vendorId);
    if (!selectedVendor) return;

    const order: ServiceOrder = {
      id: 'so_' + Date.now(),
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.name,
      vendorEmail: selectedVendor.email,
      items: tempOrderItems.length > 0 ? tempOrderItems : ['Servicio integral contratado'],
      setupTime: newOrder.setupTime,
      eventTime: newOrder.eventTime,
      teardownTime: newOrder.teardownTime,
      notes: newOrder.notes,
      status: 'enviado',
      sentAt: new Date().toISOString()
    };

    updateState({
      serviceOrders: {
        ...state.serviceOrders,
        [client.id]: [...serviceOrders, order]
      }
    });

    setNewOrder({
      vendorId: '',
      itemInput: '',
      setupTime: '12:00',
      eventTime: '18:00',
      teardownTime: '23:30',
      notes: ''
    });
    setTempOrderItems([]);
    setIsAddingOrder(false);
  };

  const handleUpdateOrderStatus = (orderId: string, status: ServiceOrder['status']) => {
    const updated = serviceOrders.map(so => 
      so.id === orderId ? { ...so, status } : so
    );
    updateState({
      serviceOrders: {
        ...state.serviceOrders,
        [client.id]: updated
      }
    });
  };

  const handleDeleteServiceOrder = (orderId: string) => {
    updateState({
      serviceOrders: {
        ...state.serviceOrders,
        [client.id]: serviceOrders.filter(so => so.id !== orderId)
      }
    });
  };

  // 3. Interactive Seating / Floor Plan Functions
  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName) return;

    const table: Table = {
      id: 't_' + Date.now(),
      name: newTableName,
      capacity: Number(newTableCapacity),
      shape: newTableShape,
      x: 30 + Math.random() * 40, // random start in middle bounds
      y: 30 + Math.random() * 40
    };

    updateState({
      tables: {
        ...state.tables,
        [client.id]: [...tables, table]
      }
    });

    setNewTableName('');
    setNewTableCapacity(10);
  };

  const handleMoveTable = (tableId: string, axis: 'x' | 'y', value: number) => {
    const updatedTables = tables.map(t => 
      t.id === tableId ? { ...t, [axis]: value } : t
    );
    updateState({
      tables: {
        ...state.tables,
        [client.id]: updatedTables
      }
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, tableId: string) => {
    e.preventDefault();
    setSelectedTableId(tableId);
    setDraggingTableId(tableId);

    const container = e.currentTarget.parentElement;
    if (!container) return;

    const currentTarget = e.currentTarget;
    try {
      currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      // safe fallback if pointer capture fails/not supported
    }

    const updatePosition = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      let x = ((clientX - rect.left) / rect.width) * 100;
      let y = ((clientY - rect.top) / rect.height) * 100;

      // Constraints: prevent placing completely out of bounds (keep 3-97% range)
      x = Math.max(3, Math.min(97, Math.round(x)));
      y = Math.max(3, Math.min(97, Math.round(y)));

      const updatedTables = (state.tables[client.id] || []).map(t => 
        t.id === tableId ? { ...t, x, y } : t
      );
      updateState({
        tables: {
          ...state.tables,
          [client.id]: updatedTables
        }
      });
    };

    const onPointerMove = (moveEvent: PointerEvent) => {
      updatePosition(moveEvent.clientX, moveEvent.clientY);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      setDraggingTableId(null);
      try {
        currentTarget.releasePointerCapture(upEvent.pointerId);
      } catch (err) {
        // safe fallback
      }
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  const handleDeleteTable = (tableId: string) => {
    // Unassign guests at this table
    const updatedGuests = guests.map(g => 
      g.tableId === tableId ? { ...g, tableId: null } : g
    );

    updateState({
      tables: {
        ...state.tables,
        [client.id]: tables.filter(t => t.id !== tableId)
      },
      guests: {
        ...state.guests,
        [client.id]: updatedGuests
      }
    });

    if (selectedTableId === tableId) {
      setSelectedTableId(null);
    }
  };

  const handleAssignGuestToTable = (guestId: string, tableId: string | null) => {
    const updatedGuests = guests.map(g => 
      g.id === guestId ? { ...g, tableId } : g
    );
    updateState({
      guests: {
        ...state.guests,
        [client.id]: updatedGuests
      }
    });
  };

  const getCategoryLabel = (cat: Vendor['category']) => {
    switch (cat) {
      case 'catering': return 'Catering & Banquete';
      case 'decoracion': return 'Decoración & Mobiliario';
      case 'musica_sonido': return 'Sonorización & DJ';
      case 'fotografia': return 'Fotografía & Video';
      case 'lugar': return 'Recinto / Finca';
      case 'personal_tecnico': return 'Soporte Técnico';
      case 'animacion': return 'Animación & Coctelería';
      default: return 'General';
    }
  };

  return (
    <div id="logistics_module" className="space-y-6">
      
      {/* Subnav Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
        <div className="text-left">
          <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">Logística, Proveedores & Salón</span>
          <h2 className="text-lg font-bold text-slate-800">{client?.eventName || 'Seleccione un Evento'}</h2>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-200">
          <button
            id="tab_vendor_db"
            onClick={() => setLogSubTab('proveedores')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              logSubTab === 'proveedores' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            Directorio Proveedores
          </button>
          <button
            id="tab_service_orders"
            onClick={() => setLogSubTab('ordenes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              logSubTab === 'ordenes' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            Órdenes de Servicio
          </button>
          <button
            id="tab_floor_planner"
            onClick={() => setLogSubTab('planos')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              logSubTab === 'planos' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            Plano & Distribución
          </button>
        </div>
      </div>

      {/* 1. DIRECTORY OF SUPPLIERS */}
      {logSubTab === 'proveedores' && (
        <div id="vendor_directory_section" className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-800 text-sm">Catálogo Homologado de Proveedores de la Agencia</h4>
            <button
              id="btn_new_vendor"
              onClick={() => setIsAddingVendor(!isAddingVendor)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {isAddingVendor ? 'Cancelar Registro' : 'Inscribir Proveedor'}
            </button>
          </div>

          {/* New Vendor Form */}
          {isAddingVendor && (
            <div id="vendor_form" className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-xs text-left animate-slide-in">
              <h5 className="font-bold text-slate-800 text-xs mb-3 border-b border-slate-100 pb-1.5">Inscribir Nuevo Proveedor en Catálogo</h5>
              <form onSubmit={handleAddVendor} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre Comercial *</label>
                    <input
                      type="text"
                      value={newVendor.name}
                      onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                      placeholder="ej: Luz & Sombra Audiovisual"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Categoría</label>
                    <select
                      value={newVendor.category}
                      onChange={(e) => setNewVendor({...newVendor, category: e.target.value as Vendor['category']})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 outline-hidden"
                    >
                      <option value="catering">Catering & Banquete</option>
                      <option value="decoracion">Decoración & Mobiliario</option>
                      <option value="musica_sonido">Sonorización & DJ</option>
                      <option value="fotografia">Fotografía & Video</option>
                      <option value="lugar">Finca / Recinto</option>
                      <option value="personal_tecnico">Personal Técnico</option>
                      <option value="animacion">Animación & Barra</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Persona de Contacto *</label>
                    <input
                      type="text"
                      value={newVendor.contactName}
                      onChange={(e) => setNewVendor({...newVendor, contactName: e.target.value})}
                      placeholder="ej: Andrés Gómez"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Móvil de Contacto *</label>
                    <input
                      type="text"
                      value={newVendor.phone}
                      onChange={(e) => setNewVendor({...newVendor, phone: e.target.value})}
                      placeholder="+56 9 1234 5678"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Correo Corporativo *</label>
                    <input
                      type="email"
                      value={newVendor.email}
                      onChange={(e) => setNewVendor({...newVendor, email: e.target.value})}
                      placeholder="info@proveedor.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Precio Base Estimado (CLP)</label>
                    <input
                      type="number"
                      value={newVendor.basePrice}
                      onChange={(e) => setNewVendor({...newVendor, basePrice: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Clasificación / Estrellas (1-5)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={newVendor.rating}
                      onChange={(e) => setNewVendor({...newVendor, rating: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Notas Internas o Alcances del Servicio</label>
                  <input
                    type="text"
                    value={newVendor.notes || ''}
                    onChange={(e) => setNewVendor({...newVendor, notes: e.target.value})}
                    placeholder="ej: Ofrecen descuento del 10% para eventos de viernes."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Registrar Proveedor
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Vendors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {state.vendors.map(vendor => (
              <div id={`vendor_card_${vendor.id}`} key={vendor.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
                
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-sm text-[10px] uppercase">
                      {getCategoryLabel(vendor.category)}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="text-xs font-bold text-slate-700">{vendor.rating}</span>
                    </div>
                  </div>

                  <h5 className="font-bold text-slate-800 text-sm mb-1">{vendor.name}</h5>
                  <p className="text-[11px] text-slate-500">Contacto: {vendor.contactName}</p>

                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{vendor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{vendor.email}</span>
                    </div>
                  </div>

                  <p className="text-xs italic text-slate-400 mt-3 leading-normal border-t border-slate-50 pt-2.5">
                    "{vendor.notes || 'Sin observaciones registradas.'}"
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Precio Base</span>
                    <span className="font-mono text-sm font-bold text-slate-800">{Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(vendor.basePrice)}</span>
                  </div>

                  <button
                    id={`delete_vendor_${vendor.id}`}
                    type="button"
                    onClick={() => handleDeleteVendor(vendor.id)}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* 2. SERVICE ORDERS SECTION */}
      {logSubTab === 'ordenes' && (
        <div id="service_orders_section" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Órdenes de Compra y Especificaciones de Montaje</h4>
              <p className="text-xs text-slate-500 mt-0.5">Notificaciones técnicas con cronograma detallado para proveedores</p>
            </div>
            <button
              id="btn_add_order"
              onClick={() => setIsAddingOrder(!isAddingOrder)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {isAddingOrder ? 'Cancelar Ficha' : 'Nueva Ficha Técnica'}
            </button>
          </div>

          {/* New service order form */}
          {isAddingOrder && (
            <div id="order_form_container" className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-xs text-left animate-slide-in">
              <h5 className="font-bold text-slate-800 text-xs mb-3 border-b border-slate-100 pb-1.5">Emitir Órden / Requerimiento Específico</h5>
              <form onSubmit={handleCreateServiceOrder} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Destinatario (Proveedor de la Lista) *</label>
                    <select
                      value={newOrder.vendorId}
                      onChange={(e) => setNewOrder({...newOrder, vendorId: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500"
                      required
                    >
                      <option value="">-- Seleccionar Proveedor --</option>
                      {state.vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({getCategoryLabel(v.category)})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Horarios Clave del Día (Fijar para el Proveedor)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block text-center font-bold">Montaje</span>
                        <input
                          type="text"
                          value={newOrder.setupTime}
                          onChange={(e) => setNewOrder({...newOrder, setupTime: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 font-mono text-center outline-hidden"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block text-center font-bold">Servicio</span>
                        <input
                          type="text"
                          value={newOrder.eventTime}
                          onChange={(e) => setNewOrder({...newOrder, eventTime: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 font-mono text-center outline-hidden"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block text-center font-bold">Desmontaje</span>
                        <input
                          type="text"
                          value={newOrder.teardownTime}
                          onChange={(e) => setNewOrder({...newOrder, teardownTime: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 font-mono text-center outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-600">Requerimientos o Items del Montaje</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newOrder.itemInput}
                        onChange={(e) => setNewOrder({...newOrder, itemInput: e.target.value})}
                        placeholder="ej: Arcos con luces microled rústicas"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={handleAddOrderItem}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Añadir
                      </button>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1 max-h-[120px] overflow-y-auto">
                      {tempOrderItems.map((item, idx) => (
                        <div key={idx} className="bg-white px-2 py-1 rounded-md border border-slate-100 text-[11px] text-slate-700 flex gap-1 items-start">
                          <span className="font-bold text-indigo-600 font-mono text-[10px]">{idx + 1}.</span>
                          <p>{item}</p>
                        </div>
                      ))}
                      {tempOrderItems.length === 0 && <p className="text-slate-400 text-[11px] text-center italic py-4">Agregue especificaciones técnicas.</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Notas Especiales / Condiciones Operativas</label>
                    <textarea
                      value={newOrder.notes}
                      onChange={(e) => setNewOrder({...newOrder, notes: e.target.value})}
                      rows={4}
                      placeholder="ej: Estacionar por acceso norte para carga pesada. Traer cables alargadores de 20 metros."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Generar & Enviar Orden
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Service Orders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {serviceOrders.map(order => (
              <div id={`order_card_${order.id}`} key={order.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                
                <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm">{order.vendorName}</h5>
                    <span className="text-[10px] text-slate-400 block font-mono">ID ORDEN: {order.id.toUpperCase()}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {order.status === 'aceptado' ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Aceptada
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1">
                        <Send className="w-3 h-3 text-amber-600 animate-pulse" />
                        Enviada / Pendiente
                      </span>
                    )}

                    <button
                      id={`delete_order_${order.id}`}
                      type="button"
                      onClick={() => handleDeleteServiceOrder(order.id)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-100 cursor-pointer"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center font-mono">
                  <div>
                    <span className="text-[9px] text-slate-400 block">MONTAJE</span>
                    <span className="text-xs font-bold text-slate-700">{order.setupTime} h</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">SERVICIO</span>
                    <span className="text-xs font-bold text-slate-700">{order.eventTime} h</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">DESMONTAJE</span>
                    <span className="text-xs font-bold text-slate-700">{order.teardownTime} h</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-slate-500 uppercase text-[9px] block">Items Solicitados:</span>
                  <div className="space-y-1 max-h-[100px] overflow-y-auto pr-0.5 bg-slate-50/30 p-2 rounded-lg">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex gap-1.5 items-start text-slate-700 leading-relaxed text-[11px]">
                        <span className="text-indigo-600 font-bold font-mono text-[10px]">•</span>
                        <p>{it}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {order.notes && (
                  <div className="bg-yellow-50/50 p-2.5 rounded-xl border border-yellow-100 text-[11px] text-slate-600 leading-relaxed">
                    <p className="font-bold text-yellow-800 text-[10px] mb-0.5 uppercase tracking-wide">Notas Técnicas:</p>
                    {order.notes}
                  </div>
                )}

                {order.status === 'enviado' && (
                  <button
                    id={`btn_accept_order_${order.id}`}
                    type="button"
                    onClick={() => handleUpdateOrderStatus(order.id, 'aceptado')}
                    className="w-full py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    Simular Aceptación de Proveedor
                  </button>
                )}

              </div>
            ))}

            {serviceOrders.length === 0 && (
              <div className="col-span-2 py-16 text-center bg-white border border-slate-100 shadow-xs rounded-2xl flex flex-col items-center justify-center">
                <Truck className="w-10 h-10 text-indigo-300 mb-2 animate-bounce" />
                <p className="text-slate-500 text-xs font-semibold">No se han emitido órdenes de servicio para este evento.</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm">Especifique montaje y despachos técnicos en el botón superior.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 3. FLOOR PLANNER & INTERACTIVE SEATING */}
      {logSubTab === 'planos' && (
        <div id="floor_planner_section" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Controls & Tables Directory (Left Column) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Create Table Form */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
              <h4 className="font-bold text-slate-800 text-sm mb-4 border-b border-slate-100 pb-2">Distribución de Mesas</h4>
              <form onSubmit={handleAddTable} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre de la Mesa *</label>
                  <input
                    type="text"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    placeholder="ej: Mesa Presidencial, Mesa 1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Capacidad Sillas</label>
                    <input
                      type="number"
                      value={newTableCapacity}
                      onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden"
                      required
                      min="1"
                      max="20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Forma</label>
                    <select
                      value={newTableShape}
                      onChange={(e) => setNewTableShape(e.target.value as 'circle' | 'square')}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 outline-hidden"
                    >
                      <option value="circle">Circular</option>
                      <option value="square">Cuadrada</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ubicar Nueva Mesa
                </button>
              </form>
            </div>

            {/* List of Placed Tables */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
              <h4 className="font-bold text-slate-800 text-xs mb-3 border-b border-slate-100 pb-1.5">Alineación de Invitados & Mesas</h4>
              <div className="space-y-2.5 max-h-[250px] overflow-y-auto">
                {tables.map(table => {
                  const tableGuests = guests.filter(g => g.tableId === table.id);
                  const isSelected = selectedTableId === table.id;
                  return (
                    <div
                      id={`list_table_item_${table.id}`}
                      key={table.id}
                      onClick={() => setSelectedTableId(isSelected ? null : table.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isSelected ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-slate-800 block">{table.name}</span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Ocupación: <b className="text-indigo-600">{tableGuests.length}</b> de <b>{table.capacity}</b> asientos
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          id={`delete_table_${table.id}`}
                          onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.id); }}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-md cursor-pointer"
                          title="Quitar Mesa del Plano"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {tables.length === 0 && (
                  <p className="text-slate-400 text-xs text-center py-6">No hay mesas ubicadas en el plano.</p>
                )}
              </div>
            </div>

          </div>

          {/* Table Seating Floor Plan Visualizer (Right Column) */}
          <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left flex flex-col">
            
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Grid className="w-4 h-4 text-indigo-600" />
                  Plano Interactivo del Salón (Vista Aérea)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Mueva y posicione las mesas haciendo clic o ajustando las coordenadas.</p>
              </div>
            </div>

            {/* Simulated interactive grid */}
            <div className="relative bg-slate-900 rounded-2xl h-[320px] overflow-hidden border border-slate-950 flex items-center justify-center">
              
              {/* Background room markings */}
              <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 opacity-5 pointer-events-none">
                {Array.from({ length: 72 }).map((_, idx) => (
                  <div key={idx} className="border border-white text-[8px] p-1 font-mono text-white select-none"></div>
                ))}
              </div>
              <div className="absolute top-2 text-[10px] text-indigo-400/70 uppercase tracking-widest font-mono pointer-events-none">ZONA ESCENARIO / NOVIOS</div>
              <div className="absolute bottom-2 text-[10px] text-indigo-400/70 uppercase tracking-widest font-mono pointer-events-none">ACCESO INVITADOS & BARRA</div>

              {/* Placed tables */}
              {tables.map(table => {
                const isSelected = selectedTableId === table.id;
                const isDraggingThis = draggingTableId === table.id;
                const assignedCount = guests.filter(g => g.tableId === table.id).length;
                return (
                  <div
                    id={`visual_table_${table.id}`}
                    key={table.id}
                    onPointerDown={(e) => handlePointerDown(e, table.id)}
                    onClick={() => setSelectedTableId(table.id)}
                    style={{ left: `${table.x}%`, top: `${table.y}%`, touchAction: 'none' }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing ${
                      isDraggingThis ? '' : 'transition-all duration-150'
                    } ${
                      table.shape === 'circle' ? 'rounded-full' : 'rounded-lg'
                    } flex flex-col items-center justify-center p-2.5 select-none ${
                      isSelected 
                        ? 'bg-indigo-600 border-4 border-white text-white shadow-lg z-10 scale-110' 
                        : 'bg-indigo-950 border-2 border-indigo-400 text-indigo-200 hover:border-white shadow-sm'
                    }`}
                  >
                    <span className="text-[9px] font-bold tracking-tight text-center truncate max-w-[65px]">
                      {table.name}
                    </span>
                    <span className="text-[8px] opacity-80 mt-0.5">
                      {assignedCount}/{table.capacity}
                    </span>
                  </div>
                );
              })}

              {tables.length === 0 && (
                <div className="text-center text-slate-500 font-mono text-xs">
                  Plano vacío. Inserte mesas usando el formulario para diseñar el salón.
                </div>
              )}
            </div>

            {/* Slider tuning coordinates for touch/mouse replacement */}
            {selectedTableId && (
              <div id="position_controller" className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between text-xs">
                {(() => {
                  const t = tables.find(x => x.id === selectedTableId);
                  if (!t) return null;
                  const tableGuests = guests.filter(g => g.tableId === t.id);
                  return (
                    <>
                      <div className="text-left w-full sm:w-auto">
                        <p className="font-bold text-slate-800">Controles de {t.name}:</p>
                        <p className="text-[10px] text-slate-500 font-medium">Asigne o posicione esta mesa de forma milimétrica.</p>
                      </div>

                      <div className="flex gap-4 items-center w-full sm:w-auto flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-400">Eje X:</span>
                          <input
                            type="range"
                            min="5"
                            max="95"
                            value={t.x}
                            onChange={(e) => handleMoveTable(t.id, 'x', Number(e.target.value))}
                            className="w-24 accent-indigo-600"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-400">Eje Y:</span>
                          <input
                            type="range"
                            min="5"
                            max="95"
                            value={t.y}
                            onChange={(e) => handleMoveTable(t.id, 'y', Number(e.target.value))}
                            className="w-24 accent-indigo-600"
                          />
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Assigned Guest List panel for selected table */}
            {selectedTableId && (
              <div className="mt-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                {(() => {
                  const t = tables.find(x => x.id === selectedTableId);
                  if (!t) return null;
                  const tableGuests = guests.filter(g => g.tableId === t.id);
                  const unassignedGuests = guests.filter(g => g.tableId === null && g.rsvp === 'confirmado');
                  return (
                    <div className="space-y-4 text-xs">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <h5 className="font-bold text-slate-800">Composición de {t.name} ({tableGuests.length} de {t.capacity})</h5>
                        <button
                          onClick={() => setSelectedTableId(null)}
                          className="text-slate-400 hover:text-slate-600 font-bold"
                        >
                          Cerrar Panel
                        </button>
                      </div>

                      {/* Guest list at table */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto">
                        {tableGuests.map(g => (
                          <div key={g.id} className="bg-white p-2 rounded-lg border border-slate-100 flex justify-between items-center">
                            <span className="font-semibold text-slate-700">{g.name}</span>
                            <button
                              id={`unassign_${g.id}`}
                              onClick={() => handleAssignGuestToTable(g.id, null)}
                              className="text-red-500 hover:text-red-700 text-[10px] font-bold"
                            >
                              Remover
                            </button>
                          </div>
                        ))}
                        {tableGuests.length === 0 && (
                          <p className="text-slate-400 italic py-4 text-center col-span-2">No hay invitados sentados en esta mesa.</p>
                        )}
                      </div>

                      {/* Add guest dropdown if capacity remaining */}
                      {tableGuests.length < t.capacity && unassignedGuests.length > 0 && (
                        <div className="pt-2 border-t border-slate-200 flex gap-2 items-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Sentar Invitado Confirmado:</span>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignGuestToTable(e.target.value, t.id);
                                e.target.value = '';
                              }
                            }}
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                          >
                            <option value="">-- Sentar invitado --</option>
                            {unassignedGuests.map(g => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
