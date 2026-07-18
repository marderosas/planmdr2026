/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { EventState, InventoryItem } from '../types';
import { 
  Package, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Warehouse, 
  Coins, 
  Wrench, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  TrendingUp, 
  Filter,
  Info
} from 'lucide-react';

interface InventoryModuleProps {
  state: EventState;
  updateState: (newState: Partial<EventState>) => void;
}

export const initialInventory: InventoryItem[] = [];

export default function InventoryModule({ state, updateState }: InventoryModuleProps) {
  // Ensure inventory is initialized if it does not exist
  const items = state.inventory || initialInventory;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedCondition, setSelectedCondition] = useState<string>('todos');

  // Form states for Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<InventoryItem['category']>('mesas');
  const [formQuantity, setFormQuantity] = useState<number>(0);
  const [formAvailableQuantity, setFormAvailableQuantity] = useState<number>(0);
  const [formCondition, setFormCondition] = useState<InventoryItem['condition']>('excelente');
  const [formLocation, setFormLocation] = useState('');
  const [formUnitCost, setFormUnitCost] = useState<number>(0);
  const [formNotes, setFormNotes] = useState('');

  // CLP Currency Formatter
  const formatCLP = (val: number) => {
    return Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: 'CLP', 
      maximumFractionDigits: 0 
    }).format(val);
  };

  // Categories helper
  const getCategoryLabel = (cat: InventoryItem['category']) => {
    switch(cat) {
      case 'mesas': return 'Mesas';
      case 'sillas': return 'Sillas';
      case 'manteleria': return 'Mantelería';
      case 'arreglos': return 'Arreglos Florales';
      case 'vajilla': return 'Vajilla & Cuchillería';
      case 'otros': return 'Otros Utensilios';
      default: return cat.charAt(0).toUpperCase() + cat.slice(1);
    }
  };

  // Summary Metrics
  const summaryStats = useMemo(() => {
    let totalItemsCount = 0;
    let totalAssetValue = 0;
    let inMaintenanceCount = 0;
    let totalAvailable = 0;

    items.forEach(item => {
      totalItemsCount += item.quantity;
      totalAssetValue += item.quantity * item.unitCost;
      totalAvailable += item.availableQuantity;
      if (item.condition === 'mantenimiento') {
        inMaintenanceCount += item.quantity; // assuming the entire batch or we can count entries
      }
    });

    return {
      totalItemsCount,
      totalAssetValue,
      inMaintenanceCount,
      totalAvailable
    };
  }, [items]);

  // Filtered Inventory Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'todos' || item.category === selectedCategory;
      const matchesCondition = selectedCondition === 'todos' || item.condition === selectedCondition;

      return matchesSearch && matchesCategory && matchesCondition;
    });
  }, [items, searchQuery, selectedCategory, selectedCondition]);

  // Open Modal for Create
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('mesas');
    setFormQuantity(0);
    setFormAvailableQuantity(0);
    setFormCondition('excelente');
    setFormLocation('');
    setFormUnitCost(0);
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormQuantity(item.quantity);
    setFormAvailableQuantity(item.availableQuantity);
    setFormCondition(item.condition);
    setFormLocation(item.location);
    setFormUnitCost(item.unitCost);
    setFormNotes(item.notes || '');
    setIsModalOpen(true);
  };

  // Submit Form (Add or Edit)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingItem) {
      // Edit
      const updatedItems = items.map(it => {
        if (it.id === editingItem.id) {
          return {
            ...it,
            name: formName,
            category: formCategory,
            quantity: Number(formQuantity),
            availableQuantity: Number(formAvailableQuantity),
            condition: formCondition,
            location: formLocation,
            unitCost: Number(formUnitCost),
            notes: formNotes
          };
        }
        return it;
      });
      updateState({ inventory: updatedItems });
    } else {
      // Add
      const newItem: InventoryItem = {
        id: `inv-${Date.now()}`,
        name: formName,
        category: formCategory,
        quantity: Number(formQuantity),
        availableQuantity: Number(formAvailableQuantity),
        condition: formCondition,
        location: formLocation,
        unitCost: Number(formUnitCost),
        notes: formNotes
      };
      updateState({ inventory: [...items, newItem] });
    }

    setIsModalOpen(false);
  };

  // Delete Utensil
  const handleDeleteItem = (item: InventoryItem) => {
    setItemToDelete(item);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const updatedItems = items.filter(it => it.id !== itemToDelete.id);
    updateState({ inventory: updatedItems });
    setItemToDelete(null);
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Inventario de Utensilios</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registro global de mobiliario, vajilla, cristalería y mantelería propia de Mar de Rosas.
          </p>
        </div>
        <button
          id="btn_add_inventory_item"
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          Agregar Utensilio
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Unidades Totales</span>
            <span className="text-lg font-bold text-slate-800 font-mono">{summaryStats.totalItemsCount.toLocaleString()}</span>
          </div>
        </div>

        {/* Total Asset Valuation */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Valor en Activos</span>
            <span className="text-lg font-bold text-emerald-600 font-mono">{formatCLP(summaryStats.totalAssetValue)}</span>
          </div>
        </div>

        {/* Total Available */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Disponibles</span>
            <span className="text-lg font-bold text-indigo-600 font-mono">{summaryStats.totalAvailable.toLocaleString()}</span>
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">En Reparación</span>
            <span className="text-lg font-bold text-amber-600 font-mono">{summaryStats.inMaintenanceCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Filtering and Search Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="inventory_search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, bodega, repisa..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 font-semibold hidden sm:inline">Categoría:</span>
              <select
                id="filter_category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-bold outline-hidden focus:border-indigo-500 capitalize"
              >
                <option value="todos">Todas las categorías</option>
                {(state.configurations?.inventoryCategories || ['mesas', 'sillas', 'manteleria', 'arreglos', 'vajilla', 'otros']).map((cat) => {
                  const label = cat === 'mesas' ? 'Mesas'
                              : cat === 'sillas' ? 'Sillas'
                              : cat === 'manteleria' ? 'Mantelería'
                              : cat === 'arreglos' ? 'Arreglos Florales'
                              : cat === 'vajilla' ? 'Vajilla & Cuchillería'
                              : cat === 'otros' ? 'Otros Utensilios'
                              : cat;
                  return (
                    <option key={cat} value={cat}>{label}</option>
                  );
                })}
              </select>
            </div>

            {/* Condition Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold hidden sm:inline">Estado:</span>
              <select
                id="filter_condition"
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-bold outline-hidden focus:border-indigo-500 capitalize"
              >
                <option value="todos">Todos los estados</option>
                {(state.configurations?.inventoryConditions || ['excelente', 'bueno', 'mantenimiento', 'debaja']).map((cond) => {
                  const label = cond === 'excelente' ? 'Excelente'
                              : cond === 'bueno' ? 'Bueno'
                              : cond === 'mantenimiento' ? 'En Mantención'
                              : cond === 'debaja' ? 'De Baja'
                              : cond;
                  return (
                    <option key={cond} value={cond}>{label}</option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Inventory List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">
                  <th className="py-3 px-5">Utensilio / Nombre</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Ubicación</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-center">Disponible</th>
                  <th className="py-3 px-4 text-right">Costo Unit.</th>
                  <th className="py-3 px-4 text-right">Valor Activo</th>
                  <th className="py-3 px-4 text-center">Condición</th>
                  <th className="py-3 px-5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-800">{item.name}</div>
                      {item.notes && (
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Info className="w-3 h-3 text-slate-300 shrink-0" />
                          <span className="truncate max-w-[220px]">{item.notes}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {getCategoryLabel(item.category)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-500">
                      {item.location || <span className="italic text-slate-300">No especificada</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold font-mono">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className={item.availableQuantity === 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                        {item.availableQuantity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                      {formatCLP(item.unitCost)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCLP(item.quantity * item.unitCost)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        item.condition === 'excelente' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.condition === 'bueno'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : item.condition === 'mantenimiento'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : item.condition === 'debaja'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {item.condition === 'excelente' ? 'Excelente'
                        : item.condition === 'bueno' ? 'Bueno'
                        : item.condition === 'mantenimiento' ? 'Mantención'
                        : item.condition === 'debaja' ? 'De Baja'
                        : item.condition}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-all cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">No se encontraron utensilios en el inventario</p>
            <p className="text-xs text-slate-400 mt-1">Prueba cambiando los filtros o agrega un nuevo artículo para comenzar.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4.5 h-4.5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  {editingItem ? 'Editar Utensilio' : 'Agregar Utensilio al Inventario'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del Utensilio *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Silla Tiffany Dorada, Copa de Cristal, etc."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Categoría</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as InventoryItem['category'])}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500 focus:bg-white font-bold capitalize"
                  >
                    {(state.configurations?.inventoryCategories || ['mesas', 'sillas', 'manteleria', 'arreglos', 'vajilla', 'otros']).map((cat) => {
                      const label = cat === 'mesas' ? 'Mesas'
                                  : cat === 'sillas' ? 'Sillas'
                                  : cat === 'manteleria' ? 'Mantelería'
                                  : cat === 'arreglos' ? 'Arreglos Florales'
                                  : cat === 'vajilla' ? 'Vajilla & Cuchillería'
                                  : cat === 'otros' ? 'Otros Utensilios'
                                  : cat;
                      return (
                        <option key={cat} value={cat}>{label}</option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Condición / Estado</label>
                  <select
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value as InventoryItem['condition'])}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500 focus:bg-white font-bold capitalize"
                  >
                    {(state.configurations?.inventoryConditions || ['excelente', 'bueno', 'mantenimiento', 'debaja']).map((cond) => {
                      const label = cond === 'excelente' ? 'Excelente'
                                  : cond === 'bueno' ? 'Bueno'
                                  : cond === 'mantenimiento' ? 'En Mantención'
                                  : cond === 'debaja' ? 'De Baja'
                                  : cond;
                      return (
                        <option key={cond} value={cond}>{label}</option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Stock Total *</label>
                  <input
                    type="number"
                    value={formQuantity === 0 ? '' : formQuantity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFormQuantity(val);
                      // Auto-update available stock to be the same initially if not set
                      setFormAvailableQuantity(val);
                    }}
                    placeholder="Cantidad de unidades"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500 focus:bg-white font-mono"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Stock Disponible *</label>
                  <input
                    type="number"
                    value={formAvailableQuantity === 0 ? '' : formAvailableQuantity}
                    onChange={(e) => setFormAvailableQuantity(Number(e.target.value))}
                    placeholder="Unidades listas"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500 focus:bg-white font-mono"
                    min="0"
                    max={formQuantity}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Costo Unitario (CLP) *</label>
                  <input
                    type="number"
                    value={formUnitCost === 0 ? '' : formUnitCost}
                    onChange={(e) => setFormUnitCost(Number(e.target.value))}
                    placeholder="Ej. 15000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500 focus:bg-white font-mono"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ubicación Bodega</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Ej. Bodega A, Repisa 3"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notas / Detalles Técnicos</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Detalles sobre mantención, marcas, empaque..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-indigo-500 focus:bg-white h-20 resize-none animate-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-500 font-bold text-xs rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-md shadow-indigo-100 transition-all cursor-pointer"
                >
                  {editingItem ? 'Guardar Cambios' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full overflow-hidden animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">¿Eliminar utensilio?</h3>
              <p className="text-xs text-slate-500 mb-6">
                ¿Está seguro de que desea eliminar <strong>"{itemToDelete.name}"</strong>? Esta acción no se puede deshacer y actualizará los registros de inventario.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-500 font-bold text-xs rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-md shadow-rose-100 transition-all cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
