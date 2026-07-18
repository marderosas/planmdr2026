import React, { useState } from 'react';
import { EventState, FoodMenuItem } from '../types';
import { 
  Utensils, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertCircle, 
  ChefHat, 
  DollarSign, 
  X, 
  Info,
  Filter,
  CheckCircle,
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';

interface FoodMenuModuleProps {
  state: EventState;
  updateState: (newState: Partial<EventState>) => void;
}

export default function FoodMenuModule({ state, updateState }: FoodMenuModuleProps) {
  const items = state.globalDishes || [];

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodMenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<FoodMenuItem | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<FoodMenuItem['category']>('plato_principal');
  const [formDescription, setFormDescription] = useState('');
  const [formIngredients, setFormIngredients] = useState('');
  const [formAllergens, setFormAllergens] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formEstimatedCost, setFormEstimatedCost] = useState('');

  // Category helper maps
  const categoryLabels: Record<FoodMenuItem['category'], string> = {
    coctel: 'Cóctel / Aperitivo',
    entrada: 'Entrada',
    plato_principal: 'Plato Principal',
    postre: 'Postre',
    bebestible: 'Bebestible / Trago',
    trasnoche: 'Trasnoche / Bajón',
    otro: 'Otro'
  };

  const categoryColors: Record<FoodMenuItem['category'], { bg: string; text: string; border: string }> = {
    coctel: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    entrada: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    plato_principal: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    postre: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
    bebestible: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    trasnoche: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
    otro: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.ingredients || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'todos' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Calculations
  const totalDishes = items.length;
  const costedItems = items.filter(it => it.estimatedCost !== undefined);
  const averageCost = costedItems.length > 0 
    ? costedItems.reduce((acc, it) => acc + (it.estimatedCost || 0), 0) / costedItems.length 
    : 0;
  
  const mostExpensiveItem = costedItems.length > 0
    ? [...costedItems].sort((a, b) => (b.estimatedCost || 0) - (a.estimatedCost || 0))[0]
    : null;

  const activeCategoriesCount = new Set(items.map(it => it.category)).size;

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('plato_principal');
    setFormDescription('');
    setFormIngredients('');
    setFormAllergens('');
    setFormNotes('');
    setFormEstimatedCost('');
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (item: FoodMenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormDescription(item.description || '');
    setFormIngredients(item.ingredients || '');
    setFormAllergens(item.allergens || '');
    setFormNotes(item.notes || '');
    setFormEstimatedCost(item.estimatedCost ? item.estimatedCost.toString() : '');
    setIsModalOpen(true);
  };

  // Handle Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const parsedCost = formEstimatedCost ? parseFloat(formEstimatedCost) : undefined;

    if (editingItem) {
      // Edit
      const updatedItems = items.map(it => 
        it.id === editingItem.id 
          ? {
              ...it,
              name: formName,
              category: formCategory,
              description: formDescription,
              ingredients: formIngredients,
              allergens: formAllergens,
              notes: formNotes,
              estimatedCost: parsedCost
            }
          : it
      );
      updateState({
        globalDishes: updatedItems
      });
    } else {
      // Add
      const newItem: FoodMenuItem = {
        id: 'fm_' + Date.now(),
        name: formName,
        category: formCategory,
        description: formDescription,
        ingredients: formIngredients,
        allergens: formAllergens,
        notes: formNotes,
        estimatedCost: parsedCost
      };
      updateState({
        globalDishes: [...items, newItem]
      });
    }

    setIsModalOpen(false);
  };

  // Handle Delete Confirmation Dialog
  const handleDeleteRequest = (item: FoodMenuItem) => {
    setItemToDelete(item);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const updatedItems = items.filter(it => it.id !== itemToDelete.id);
    updateState({
      globalDishes: updatedItems
    });
    setItemToDelete(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Catalog Header Card */}
      <div id="food_header_card" className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="text-left">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Banquetería & Catering
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs text-slate-300 font-medium">Catálogo General de Platos</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight mb-1 font-serif italic text-indigo-50">
            Menú de Comidas
          </h2>
          <p className="text-xs text-slate-300 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            Cree platos aquí para que estén disponibles al diseñar el menú de cada evento en la pestaña <strong>CRM</strong>.
          </p>
        </div>

        <button
          id="btn_add_dish"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-900/40 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Agregar Plato
        </button>
      </div>

      {/* Menu Statistics Widgets */}
      <div id="food_stats_grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Dishes Count */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Platos Registrados</span>
            <span className="text-lg font-extrabold text-slate-800">{totalDishes} platos</span>
          </div>
        </div>

        {/* Average Cost card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Costo Promedio CLP</span>
            <span className="text-lg font-extrabold text-slate-800">
              {Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(averageCost)}
            </span>
          </div>
        </div>

        {/* Most Expensive Item */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-violet-50 text-violet-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Plato de Mayor Costo</span>
            <span className="text-sm font-extrabold text-slate-800 block truncate" title={mostExpensiveItem ? mostExpensiveItem.name : 'N/A'}>
              {mostExpensiveItem ? mostExpensiveItem.name : 'N/A'}
            </span>
            {mostExpensiveItem && (
              <span className="text-[10px] font-bold text-indigo-600 font-mono">
                {Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(mostExpensiveItem.estimatedCost || 0)}
              </span>
            )}
          </div>
        </div>

        {/* Active Categories */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Categorías Activas</span>
            <span className="text-lg font-extrabold text-slate-800">
              {activeCategoriesCount} categorías
            </span>
          </div>
        </div>

      </div>

      {/* Main Filter & Search Control Panel */}
      <div id="food_search_bar_panel" className="bg-white p-4 rounded-2xl border border-slate-150/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por plato, ingrediente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 outline-hidden focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Category Filters scrollable wrapper */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-slate-400 text-xs font-medium flex items-center gap-1 shrink-0 mr-1.5">
            <Filter className="w-3.5 h-3.5" />
            Filtrar:
          </span>
          <button
            onClick={() => setSelectedCategory('todos')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'todos'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({items.length})
          </button>
          {Object.entries(categoryLabels).map(([key, label]) => {
            const count = items.filter(it => it.category === key).length;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

      </div>

      {/* Grid of Dishes */}
      {filteredItems.length > 0 ? (
        <div id="dishes_grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const colors = categoryColors[item.category] || categoryColors.otro;
            return (
              <div 
                key={item.id}
                id={`dish_card_${item.id}`}
                className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md hover:border-slate-200/60 transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Card Header & Content */}
                <div className="p-5 text-left">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${colors.bg} ${colors.text} ${colors.border}`}>
                      {categoryLabels[item.category]}
                    </span>
                    
                    {item.estimatedCost !== undefined && (
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-800 flex items-center justify-end gap-0.5">
                          <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
                          {Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(item.estimatedCost)}
                        </span>
                      </div>
                    )}
                  </div>

                  <h3 className="font-extrabold text-slate-800 text-base leading-tight mb-2">
                    {item.name}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    {item.description || 'Sin descripción detallada.'}
                  </p>

                  <div className="space-y-2.5 pt-3 border-t border-slate-50">
                    
                    {/* Ingredients list */}
                    {item.ingredients && (
                      <div className="text-[11px]">
                        <span className="font-bold text-slate-700 block mb-0.5">Ingredientes:</span>
                        <p className="text-slate-600 italic leading-relaxed">{item.ingredients}</p>
                      </div>
                    )}

                    {/* Allergens warns */}
                    {item.allergens && (
                      <div className="text-[11px]">
                        <span className="font-bold text-rose-700 flex items-center gap-1 mb-0.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          Alérgenos / Restricciones:
                        </span>
                        <p className="text-slate-600 bg-rose-50/50 px-2 py-1 rounded-md border border-rose-100/50">{item.allergens}</p>
                      </div>
                    )}

                    {/* Chef notes */}
                    {item.notes && (
                      <div className="text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-start gap-1.5 mt-2">
                        <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <div className="text-slate-500 leading-relaxed">
                          <span className="font-bold text-slate-700">Notas de cocina: </span>
                          {item.notes}
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-50/60 flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteRequest(item)}
                    className="p-1.5 hover:bg-rose-100 text-rose-500 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div id="no_dishes_state" className="p-12 text-center bg-white rounded-2xl border border-slate-150 shadow-xs max-w-xl mx-auto my-6">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full w-fit mx-auto mb-3">
            <Utensils className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-slate-700 font-extrabold text-sm">No se encontraron platos</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            {searchTerm || selectedCategory !== 'todos' 
              ? 'No hay registros de comida que coincidan con los filtros de búsqueda activos.' 
              : 'Aún no se han registrado platos en el catálogo general.'}
          </p>
          {(searchTerm || selectedCategory !== 'todos') ? (
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('todos'); }}
              className="px-4 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-lg cursor-pointer"
            >
              Restablecer Filtros
            </button>
          ) : (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-lg shadow-md hover:bg-indigo-700 cursor-pointer"
            >
              Crear Primer Plato
            </button>
          )}
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      {isModalOpen && (
        <div id="dish_modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 text-left">
                <ChefHat className="w-4.5 h-4.5 text-indigo-500" />
                {editingItem ? 'Editar Plato del Catálogo' : 'Registrar Nuevo Plato'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 text-left">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Dish Name */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">
                    Nombre del Plato *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Salmón en costra de sésamo"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-indigo-500 outline-hidden transition-all"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">
                    Categoría
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as FoodMenuItem['category'])}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-indigo-500 outline-hidden transition-all"
                  >
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Estimated Cost */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">
                    Costo Unitario Est. (CLP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej. 14500"
                    value={formEstimatedCost}
                    onChange={(e) => setFormEstimatedCost(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-indigo-500 outline-hidden transition-all"
                  />
                </div>

              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">
                  Descripción del plato
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalla la presentación, corte, salsas, etc."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-indigo-500 outline-hidden resize-none transition-all"
                />
              </div>

              {/* Ingredients */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">
                  Ingredientes principales
                </label>
                <input
                  type="text"
                  placeholder="Ej. Filete de salmón, sésamo negro, puré de arvejas, menta"
                  value={formIngredients}
                  onChange={(e) => setFormIngredients(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-indigo-500 outline-hidden transition-all"
                />
              </div>

              {/* Allergens */}
              <div>
                <label className="block text-[11px] font-bold text-rose-600 mb-1 uppercase flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Alérgenos / Restricciones
                </label>
                <input
                  type="text"
                  placeholder="Ej. Mariscos, lácteos, gluten, nueces (dejar vacío si es inocuo)"
                  value={formAllergens}
                  onChange={(e) => setFormAllergens(e.target.value)}
                  className="w-full px-3 py-2 bg-rose-50/30 border border-rose-100 rounded-xl text-xs text-slate-800 focus:border-indigo-500 focus:bg-white outline-hidden transition-all placeholder:text-rose-300"
                />
              </div>

              {/* Notes / Chef indications */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">
                  Notas adicionales del Chef o servicio
                </label>
                <input
                  type="text"
                  placeholder="Ej. Servir a temperatura media, plato alternativo de emergencia"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-indigo-500 outline-hidden transition-all"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-500 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer"
                >
                  {editingItem ? 'Actualizar Plato' : 'Guardar Plato'}
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
              <h3 className="text-sm font-bold text-slate-800 mb-2">¿Eliminar plato?</h3>
              <p className="text-xs text-slate-500 mb-6">
                ¿Está seguro de que desea eliminar <strong>"{itemToDelete.name}"</strong> del catálogo general?
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
