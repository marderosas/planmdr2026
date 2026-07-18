/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { Client, EventState, EventType, FoodMenuItem } from '../types';
import { addBitacoraEntry } from '../firebase';
import { Users, Plus, Calendar, Mail, Phone, Tag, DollarSign, Edit3, Eye, FileText, CheckCircle, Info, Heart, Image as ImageIcon, Trash, Utensils, AlertCircle, Clock, Archive, Upload } from 'lucide-react';

interface FoodMenuTemplate {
  id: string;
  name: string;
  category: 'coctel' | 'entrada' | 'plato_principal' | 'postre' | 'bebestible' | 'trasnoche' | 'otro';
  description: string;
  ingredients: string;
  allergens: string;
  notes?: string;
  estimatedCost: number;
}

const FOOD_MENU_TEMPLATES: FoodMenuTemplate[] = [];

interface CRMModuleProps {
  state: EventState;
  updateState: (newState: Partial<EventState>) => void;
  onViewClientPortal: (clientId: string) => void;
}

export default function CRMModule({ state, updateState, onViewClientPortal }: CRMModuleProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [selectedFoodItems, setSelectedFoodItems] = useState<{
    id: string;
    name: string;
    category: 'coctel' | 'entrada' | 'plato_principal' | 'postre' | 'bebestible' | 'trasnoche' | 'otro';
    description: string;
    ingredients: string;
    allergens: string;
    notes?: string;
    estimatedCost: number;
    quantity: number;
  }[]>([]);
  const [showAddDishDropdown, setShowAddDishDropdown] = useState(false);
  const [dishSearchText, setDishSearchText] = useState('');
  
  const availableDishes = React.useMemo(() => {
    return (state.globalDishes || []).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description || '',
      ingredients: item.ingredients || '',
      allergens: item.allergens || '',
      notes: item.notes || '',
      estimatedCost: item.estimatedCost || 0
    }));
  }, [state.globalDishes]);
  
  // Form States
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    eventType: 'boda' as EventType,
    eventName: '',
    eventDate: '',
    budgetLimit: 10000,
    decorationDetail: '',
    notes: '',
    status: 'activo' as 'propuesta' | 'activo' | 'completado'
  });

  // Mood Board States
  const [newMoodTitle, setNewMoodTitle] = useState('');
  const [newMoodCategory, setNewMoodCategory] = useState('Decoración');
  const [newMoodUrl, setNewMoodUrl] = useState('');

  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendiente' | 'confirmado' | 'finalizado'>('todos');

  // Friendly status mapping function
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'propuesta':
      case 'pendiente':
        return 'Pendiente';
      case 'activo':
      case 'confirmado':
        return 'Confirmado';
      case 'completado':
      case 'finalizado':
        return 'Finalizado';
      default:
        return status;
    }
  };

  const clientStats = useMemo(() => {
    let pendiente = 0;
    let confirmado = 0;
    let finalizado = 0;

    state.clients.forEach(c => {
      const status = (c.status || '').toLowerCase();
      if (status === 'propuesta' || status === 'pendiente') {
        pendiente++;
      } else if (status === 'activo' || status === 'confirmado') {
        confirmado++;
      } else if (status === 'completado' || status === 'finalizado') {
        finalizado++;
      }
    });

    return { pendiente, confirmado, finalizado };
  }, [state.clients]);

  const activeClients = useMemo(() => {
    return state.clients.filter(c => {
      if (statusFilter === 'todos') {
        // Default behavior: show all non-completed clients in the CRM module list
        return c.status !== 'completado';
      }
      if (statusFilter === 'pendiente') {
        return c.status === 'propuesta' || c.status === 'pendiente';
      }
      if (statusFilter === 'confirmado') {
        return c.status === 'activo' || c.status === 'confirmado';
      }
      if (statusFilter === 'finalizado') {
        return c.status === 'completado' || c.status === 'finalizado';
      }
      return true;
    });
  }, [state.clients, statusFilter]);

  const selectedClient = activeClients.find(c => c.id === state.selectedClientId) || activeClients[0] || state.clients.find(c => c.id === state.selectedClientId) || state.clients[0];

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      eventType: 'boda',
      eventName: '',
      eventDate: '',
      budgetLimit: 20000,
      decorationDetail: '',
      notes: '',
      status: 'activo'
    });
    setEditingClient(null);
    setSelectedFoodItems([]);
    setIsAdding(true);
  };

  const handleOpenEdit = (client: Client) => {
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company || '',
      eventType: client.eventType,
      eventName: client.eventName,
      eventDate: client.eventDate,
      budgetLimit: client.budgetLimit,
      decorationDetail: client.decorationDetail || '',
      notes: client.notes,
      status: client.status
    });
    setEditingClient(client);
    
    const currentClientMenu = state.foodMenu[client.id] || [];
    const matchedItems = currentClientMenu.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description || '',
      ingredients: item.ingredients || '',
      allergens: item.allergens || '',
      notes: item.notes || '',
      estimatedCost: item.estimatedCost || 0,
      quantity: item.quantity || 1
    }));
    setSelectedFoodItems(matchedItems);
    
    setIsAdding(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      // Edit Client
      const updatedClients = state.clients.map(c => 
        c.id === editingClient.id 
          ? { ...c, ...formData }
          : c
      );
      
      const newClientMenu = selectedFoodItems.map((item, idx) => ({
        id: item.id.startsWith('fm_') ? item.id : `fm_${Date.now()}_tpl_${idx}`,
        name: item.name,
        category: item.category,
        description: item.description || '',
        ingredients: item.ingredients || '',
        allergens: item.allergens || '',
        notes: item.notes || '',
        estimatedCost: item.estimatedCost,
        quantity: item.quantity
      }));

      const remainingActive = updatedClients.filter(c => c.status !== 'completado');
      const nextSelectedId = editingClient.id === state.selectedClientId && formData.status === 'completado'
        ? (remainingActive[0]?.id || '')
        : state.selectedClientId;

      updateState({ 
        clients: updatedClients,
        selectedClientId: nextSelectedId,
        foodMenu: {
          ...state.foodMenu,
          [editingClient.id]: newClientMenu
        }
      });
      addBitacoraEntry('Clientes', `Modificación del cliente: ${formData.name} (${formData.eventName})`);
    } else {
      // Create Client
      const newId = 'c_' + Date.now();
      const newClient: Client = {
        id: newId,
        ...formData,
        createdAt: new Date().toISOString().split('T')[0]
      };
      addBitacoraEntry('Clientes', `Creación del cliente: ${formData.name} (${formData.eventName})`);
      
      const newClientMenu = selectedFoodItems.map((item, idx) => ({
        id: `fm_${Date.now()}_tpl_${idx}`,
        name: item.name,
        category: item.category,
        description: item.description || '',
        ingredients: item.ingredients || '',
        allergens: item.allergens || '',
        notes: item.notes || '',
        estimatedCost: item.estimatedCost,
        quantity: item.quantity
      }));

      // Initialize lists for this new client
      const updatedChecklist = { ...state.checklist, [newId]: [
        { id: 'ch_init_1', category: 'General', title: 'Firma de Contrato Inicial', dueDate: formData.eventDate, completed: false },
        { id: 'ch_init_2', category: 'Finanzas', title: 'Definir Presupuesto Estimado', dueDate: formData.eventDate, completed: false }
      ]};
      const updatedTimeline = { ...state.dayTimeline, [newId]: [
        { id: 'dt_init_1', time: '12:00', title: 'Montaje Inicial', description: 'Arribo de coordinadores', responsible: 'Planner Principal', completed: false }
      ]};
      const updatedProtocols = { ...state.protocols, [newId]: [] };
      const updatedBudget = { ...state.budgetItems, [newId]: [] };
      const updatedInstallments = { ...state.installments, [newId]: [] };
      const updatedServiceOrders = { ...state.serviceOrders, [newId]: [] };
      const updatedGuests = { ...state.guests, [newId]: [] };
      const updatedTables = { ...state.tables, [newId]: [] };
      const updatedMood = { ...state.moodImages, [newId]: [
        { id: 'm_init_1', title: 'Estilo Base', imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600', category: 'Inspiración' }
      ] };

      updateState({
        clients: [...state.clients, newClient],
        checklist: updatedChecklist,
        dayTimeline: updatedTimeline,
        protocols: updatedProtocols,
        budgetItems: updatedBudget,
        installments: updatedInstallments,
        serviceOrders: updatedServiceOrders,
        guests: updatedGuests,
        tables: updatedTables,
        moodImages: updatedMood,
        selectedClientId: newId,
        foodMenu: {
          ...state.foodMenu,
          [newId]: newClientMenu
        }
      });
    }
    setIsAdding(false);
  };

  const handleDeleteClient = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setClientToDelete(client);
  };

  const handleConfirmDeleteClient = () => {
    if (!clientToDelete) return;
    const remainingClients = state.clients.filter(c => c.id !== clientToDelete.id);
    const nextSelected = remainingClients[0]?.id || '';
    updateState({
      clients: remainingClients,
      selectedClientId: nextSelected
    });
    addBitacoraEntry('Clientes', `Eliminación del cliente: ${clientToDelete.name}`);
    setClientToDelete(null);
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF();

      // Top Header Box (Blue borders instead of solid fill to save ink)
      doc.setDrawColor(79, 70, 229); // indigo-600 (azul)
      doc.setLineWidth(1);
      doc.rect(15, 10, 180, 25, 'D'); // 'D' stands for Draw (border only, no fill)

      doc.setTextColor(79, 70, 229); // Indigo/Blue for main title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('MAR DE ROSAS CRM', 20, 20);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text('FICHA TECNICA Y RESUMEN DEL EVENTO', 20, 28);
      
      doc.setTextColor(15, 23, 42); // slate-900 (dark) for the text fields
      doc.setFont('helvetica', 'bold');
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 145, 20);
      doc.text(`Estado: ${(formData.status || 'Activo').toUpperCase()}`, 145, 28);

      let y = 50;

      // Section: Información del Cliente
      doc.setFillColor(79, 70, 229); // indigo-600
      doc.rect(20, y, 5, 6, 'F');
      
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('1. INFORMACION DEL CLIENTE Y CONTACTO', 28, y + 5);
      
      y += 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text('Nombre Cliente:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(formData.name || 'N/A', 60, y);

      y += 7;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Empresa:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(formData.company || 'N/A', 60, y);

      y += 7;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Correo Electronico:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(formData.email || 'N/A', 60, y);

      y += 7;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Telefono Movil:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(formData.phone || 'N/A', 60, y);

      y += 15;

      // Section: Detalles del Evento
      doc.setFillColor(79, 70, 229); // indigo-600
      doc.rect(20, y, 5, 6, 'F');
      
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('2. ESPECIFICACIONES DEL EVENTO', 28, y + 5);

      y += 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text('Nombre del Evento:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(formData.eventName || 'N/A', 60, y);

      y += 7;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Tipo de Evento:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      const evTypes: Record<string, string> = { boda: 'Boda', corporativo: 'Corporativo', cumpleanos: 'Cumpleaños', otro: 'Otro' };
      doc.text(evTypes[formData.eventType] || formData.eventType || 'N/A', 60, y);

      y += 7;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Fecha del Evento:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(formData.eventDate || 'N/A', 60, y);

      y += 7;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Presupuesto Maximo:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(formData.budgetLimit), 60, y);

      y += 15;

      // Section: Decoración & Notas
      doc.setFillColor(79, 70, 229); // indigo-600
      doc.rect(20, y, 5, 6, 'F');
      
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('3. DISEÑO, DECORACION Y PLANIFICACION', 28, y + 5);

      y += 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text('Detalles de Decoracion:', 20, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      const decLines = doc.splitTextToSize(formData.decorationDetail || 'Sin detalles de decoración registrados.', 170);
      doc.text(decLines, 20, y);
      y += (decLines.length * 5) + 5;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Notas y Detalles Clave:', 20, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      const notesLines = doc.splitTextToSize(formData.notes || 'Sin notas registradas.', 170);
      doc.text(notesLines, 20, y);
      y += (notesLines.length * 5) + 15;

      // Page break if needed
      if (y > 170 && selectedFoodItems.length > 0) {
        doc.addPage();
        y = 25;
      }

      if (selectedFoodItems.length > 0) {
        // Section: Menú de Comidas
        doc.setFillColor(79, 70, 229); // indigo-600
        doc.rect(20, y, 5, 6, 'F');
        
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('4. MENU DE COMIDAS & CATERING SELECCIONADO', 28, y + 5);

        y += 15;

        // Table Header
        doc.setFillColor(241, 245, 249); // slate-100
        doc.rect(20, y - 5, 170, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text('Plato / Item', 23, y);
        doc.text('Categoria', 95, y);
        doc.text('Cantidad', 130, y);
        doc.text('Precio Unit.', 150, y);
        doc.text('Subtotal', 173, y);

        y += 7;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);

        selectedFoodItems.forEach((item) => {
          if (y > 270) {
            doc.addPage();
            y = 25;
            // Draw table header again on new page
            doc.setFillColor(241, 245, 249);
            doc.rect(20, y - 5, 170, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105);
            doc.text('Plato / Item', 23, y);
            doc.text('Categoria', 95, y);
            doc.text('Cantidad', 130, y);
            doc.text('Precio Unit.', 150, y);
            doc.text('Subtotal', 173, y);
            y += 7;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(15, 23, 42);
          }

          const categoryMap: Record<string, string> = {
            coctel: 'Coctel',
            entrada: 'Entrada',
            plato_principal: 'Principal',
            postre: 'Postre',
            bebestible: 'Bebestible',
            trasnoche: 'Trasnoche',
            otro: 'Otro'
          };

          const itemSubtotal = item.estimatedCost * item.quantity;
          
          doc.text(item.name.substring(0, 38), 23, y);
          doc.text(categoryMap[item.category] || item.category, 95, y);
          doc.text(item.quantity.toString(), 135, y, { align: 'center' });
          doc.text(Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(item.estimatedCost), 150, y);
          doc.text(Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(itemSubtotal), 188, y, { align: 'right' });

          // line divider
          doc.setDrawColor(241, 245, 249);
          doc.line(20, y + 2, 190, y + 2);

          y += 8;
        });

        // Grand Total Row
        const grandTotal = selectedFoodItems.reduce((sum, item) => sum + (item.estimatedCost * item.quantity), 0);
        doc.setFillColor(238, 242, 255); // indigo-50
        doc.rect(20, y - 4, 170, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(79, 70, 229);
        doc.text('VALOR TOTAL ESTIMADO DEL MENU:', 25, y + 2);
        doc.text(Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(grandTotal), 188, y + 2, { align: 'right' });
      }

      // Save document
      const fileName = `Ficha_Evento_${(formData.eventName || 'Nuevo_Evento').replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Hubo un error al generar el PDF.');
    }
  };

  const generateContractPDF = () => {
    if (!selectedClient) return;
    try {
      const doc = new jsPDF();
      const clientBudget = state.budgetItems[selectedClient.id] || [];
      const clientInstallments = state.installments[selectedClient.id] || [];
      
      let pageNum = 1;

      // Helper function to draw header/footer on pages
      const drawPageDecorations = (page: number) => {
        // Draw top thin accent line (ink-friendly)
        doc.setDrawColor(79, 70, 229); // indigo-600
        doc.setLineWidth(0.5);
        doc.line(15, 12, 195, 12); // thin blue line

        // Draw footer
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text('Mar de Rosas CRM & Event Planner — Borrador de Contrato de Servicios', 20, 285);
        doc.text(`Página ${page}`, 190, 285, { align: 'right' });
      };

      // PAGE 1: COVER & INTRODUCTION
      drawPageDecorations(pageNum);

      // Logo/Brand Name
      doc.setTextColor(79, 70, 229); // Indigo
      doc.setFont('times', 'bolditalic');
      doc.setFontSize(26);
      doc.text('Mar de Rosas', 105, 45, { align: 'center' });
      
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('CRM, DISEÑO & PRODUCCIÓN DE EVENTOS EXCLUSIVOS', 105, 52, { align: 'center' });

      // Divider
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(40, 58, 170, 58);

      // Title
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('CONTRATO DE PRESTACIÓN DE SERVICIOS', 105, 72, { align: 'center' });
      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105);
      doc.text('ORGANIZACIÓN, DECORACIÓN Y COORDINACIÓN GENERAL', 105, 79, { align: 'center' });

      let y = 95;

      // Section: Comparecientes
      doc.setFillColor(79, 70, 229); // indigo-600
      doc.rect(20, y, 5, 6, 'F');
      
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('I. PARTES COMPARECIENTES', 28, y + 5);

      y += 14;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85); // slate-700
      
      const p1 = `Con fecha ${new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}, en adelante denominado como "Fecha de Emisión", se celebra el presente instrumento de Borrador de Contrato de Prestación de Servicios entre las partes que a continuación se detallan:`;
      const p1Lines = doc.splitTextToSize(p1, 170);
      doc.text(p1Lines, 20, y);
      y += (p1Lines.length * 5) + 8;

      // Contractor Card
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(20, y, 170, 32, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.rect(20, y, 170, 32, 'D');

      const provider = state.configurations?.provider || {
        name: 'Producciones Mar de Rosas S.A.',
        rut: '76.123.456-7',
        address: 'Av. Vitacura 1234, Santiago',
        representative: 'María de las Rosas',
        representativeRut: '15.456.789-0',
        phone: '+56 9 1234 5678',
        email: 'contacto@marderosas.cl'
      };

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(79, 70, 229);
      doc.text('EL PRESTADOR:', 24, y + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(`Razón Social: ${provider.name}`, 24, y + 13);
      doc.text(`RUT / Dirección: ${provider.rut} — ${provider.address}`, 24, y + 19);
      doc.text(`Contacto Legal: ${provider.email} | ${provider.phone}`, 24, y + 25);

      y += 40;

      // Client Card
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(20, y, 170, 32, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.rect(20, y, 170, 32, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(79, 70, 229);
      doc.text('EL CLIENTE:', 24, y + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(`Nombre Completo: ${selectedClient.name}`, 24, y + 13);
      doc.text(`Empresa / RUT: ${selectedClient.company || 'Particular'}`, 24, y + 19);
      doc.text(`Contacto: ${selectedClient.email} | ${selectedClient.phone}`, 24, y + 25);

      y += 42;

      // Section: Objeto del contrato
      doc.setFillColor(79, 70, 229);
      doc.rect(20, y, 5, 6, 'F');
      
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('II. OBJETO DEL CONTRATO', 28, y + 5);

      y += 14;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);

      const evTypes: Record<string, string> = { wedding: 'Boda', boda: 'Boda', corporativo: 'Corporativo', cumpleanos: 'Cumpleaños', otro: 'Otro' };
      const eventLabel = evTypes[selectedClient.eventType] || selectedClient.eventType;
      
      const p2 = `El presente contrato tiene por objeto la prestación por parte de El Prestador de los servicios profesionales de diseño, planificación, coordinación, supervisión y ejecución técnica integral del evento denominado "${selectedClient.eventName}", clasificado como un evento de tipo ${eventLabel}, el cual está programado para llevarse a cabo con fecha ${selectedClient.eventDate}.`;
      const p2Lines = doc.splitTextToSize(p2, 170);
      doc.text(p2Lines, 20, y);
      
      // Go to Page 2
      doc.addPage();
      pageNum = 2;
      drawPageDecorations(pageNum);

      y = 30;

      // Section: Especificaciones y Presupuesto
      doc.setFillColor(79, 70, 229);
      doc.rect(20, y, 5, 6, 'F');
      
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('III. DETALLES FINANCIEROS Y DESGLOSE PRESUPUESTARIO', 28, y + 5);

      y += 14;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      
      const budgetLimitFormatted = Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(selectedClient.budgetLimit);
      const p3 = `Las partes acuerdan que el límite presupuestario total establecido y aprobado para la realización de las actividades y servicios contratados asciende a la suma de ${budgetLimitFormatted}. El desglose actual de los ítems de servicios que conforman el presupuesto detallado en el sistema CRM se presenta a continuación:`;
      const p3Lines = doc.splitTextToSize(p3, 170);
      doc.text(p3Lines, 20, y);
      y += (p3Lines.length * 5) + 6;

      // Budget items table header
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(20, y, 170, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('Categoría', 23, y + 5.5);
      doc.text('Ítem / Descripción', 65, y + 5.5);
      doc.text('Costo Planificado', 130, y + 5.5);
      doc.text('Costo Real', 165, y + 5.5);

      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);

      let totalPlanned = 0;
      let totalActual = 0;

      const catMap: Record<string, string> = {
        lugar: 'Lugar/Espacio',
        catering: 'Catering/Banquete',
        decoracion: 'Decoración/Ambient.',
        musica_sonido: 'Música & Sonido',
        fotografia: 'Registro Audiov.',
        personal: 'Personal Técnico',
        otros: 'Otros Servicios'
      };

      if (clientBudget.length > 0) {
        clientBudget.forEach(item => {
          if (y > 260) {
            doc.addPage();
            pageNum++;
            drawPageDecorations(pageNum);
            y = 30;
            
            // Redraw table header on new page
            doc.setFillColor(241, 245, 249);
            doc.rect(20, y, 170, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105);
            doc.text('Categoría', 23, y + 5.5);
            doc.text('Ítem / Descripción', 65, y + 5.5);
            doc.text('Costo Planificado', 130, y + 5.5);
            doc.text('Costo Real', 165, y + 5.5);
            y += 8;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(15, 23, 42);
          }

          totalPlanned += item.plannedCost;
          totalActual += item.actualCost;

          doc.text(catMap[item.category] || item.category, 23, y + 5);
          doc.text(item.name.substring(0, 32), 65, y + 5);
          doc.text(Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(item.plannedCost), 130, y + 5);
          doc.text(Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(item.actualCost), 165, y + 5);

          // bottom line
          doc.setDrawColor(241, 245, 249);
          doc.line(20, y + 7, 190, y + 7);

          y += 7;
        });

        // Totals Row
        doc.setFillColor(248, 250, 252);
        doc.rect(20, y, 170, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL CONSOLIDADO', 23, y + 5.5);
        doc.text(Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(totalPlanned), 130, y + 5.5);
        doc.text(Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(totalActual), 165, y + 5.5);
        y += 18;
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text('No hay ítems registrados en el presupuesto detallado del CRM para este cliente.', 23, y + 6);
        y += 15;
      }

      // If page boundary is reached, add page
      if (y > 200) {
        doc.addPage();
        pageNum++;
        drawPageDecorations(pageNum);
        y = 30;
      }

      // Section: Calendario de pagos (Installments)
      doc.setFillColor(79, 70, 229);
      doc.rect(20, y, 5, 6, 'F');
      
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('IV. CALENDARIO DE PAGOS Y CUOTAS', 28, y + 5);

      y += 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      
      const p4 = `Para la validez y correcta ejecución del presente plan de servicios, El Cliente se compromete a realizar el pago del presupuesto de acuerdo con el cronograma de cuotas pactadas que se detalla a continuación:`;
      const p4Lines = doc.splitTextToSize(p4, 170);
      doc.text(p4Lines, 20, y);
      y += (p4Lines.length * 5) + 6;

      if (clientInstallments.length > 0) {
        // Installments Table Header
        doc.setFillColor(241, 245, 249);
        doc.rect(20, y, 170, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text('N° Cuota', 23, y + 5.5);
        doc.text('Fecha Vencimiento', 60, y + 5.5);
        doc.text('Monto de Pago', 110, y + 5.5);
        doc.text('Estado de Pago', 155, y + 5.5);

        y += 8;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);

        clientInstallments.forEach((inst, index) => {
          if (y > 260) {
            doc.addPage();
            pageNum++;
            drawPageDecorations(pageNum);
            y = 30;
            
            doc.setFillColor(241, 245, 249);
            doc.rect(20, y, 170, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105);
            doc.text('N° Cuota', 23, y + 5.5);
            doc.text('Fecha Vencimiento', 60, y + 5.5);
            doc.text('Monto de Pago', 110, y + 5.5);
            doc.text('Estado de Pago', 155, y + 5.5);
            y += 8;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(15, 23, 42);
          }

          const statusLabel = inst.status === 'pagado' ? 'PAGADO / CONCILIADO' : 'PENDIENTE';
          
          doc.text(`Cuota ${index + 1}`, 23, y + 5);
          doc.text(inst.dueDate, 60, y + 5);
          doc.text(Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(inst.amount), 110, y + 5);
          
          if (inst.status === 'pagado') {
            doc.setTextColor(16, 185, 129); // emerald-500
          } else {
            doc.setTextColor(245, 158, 11); // amber-500
          }
          doc.setFont('helvetica', 'bold');
          doc.text(statusLabel, 155, y + 5);
          
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(15, 23, 42);

          doc.setDrawColor(241, 245, 249);
          doc.line(20, y + 7, 190, y + 7);
          y += 7;
        });
        
        y += 10;
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text('No se han configurado cuotas de pago en el módulo de presupuesto del CRM para este evento.', 23, y + 6);
        y += 15;
      }

      // Let's create page 3 for Clauses and Signatures
      doc.addPage();
      pageNum++;
      drawPageDecorations(pageNum);
      y = 30;

      // Section: Cláusulas de Servicio
      doc.setFillColor(79, 70, 229);
      doc.rect(20, y, 5, 6, 'F');
      
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('V. TÉRMINOS, CONDICIONES Y CLÁUSULAS GENERALES', 28, y + 5);

      y += 14;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);

      const clauses = [
        {
          title: "PRIMERA: Exclusividad del Servicio y Coordinación",
          body: "El Prestador se compromete a poner a disposición del Cliente todo su equipo técnico de coordinadores y planners para velar por el correcto desarrollo del cronograma minutado y el contacto técnico con los proveedores aprobados por las partes."
        },
        {
          title: "SEGUNDA: Coordinación de Terceros y Responsabilidad",
          body: "El Prestador actúa como intermediario coordinador entre El Cliente y los distintos proveedores externos (fotografía, flores, catering, etc.). El Prestador no asume responsabilidad directa por vicios ocultos, incumplimientos o retrasos imputables exclusivamente a dichos proveedores de terceros."
        },
        {
          title: "TERCERA: Modificación del Presupuesto y Adicionales",
          body: "Cualquier modificación al volumen de servicios contratados, platos del catering, arreglos de decoración o inclusiones de última hora que altere el Presupuesto Límite acordado deberá ser notificada y aprobada por escrito por ambas partes de manera previa a su ejecución."
        },
        {
          title: "CUARTA: Cancelación de Servicios y Penalidades",
          body: "En caso de rescisión o cancelación de la planificación por parte del Cliente, se aplicará una penalización equivalente al 30% del presupuesto acordado si se realiza con más de 90 días de anticipación, elevándose al 70% si se cancela en un plazo menor."
        },
        {
          title: "QUINTA: Caso Fortuito, Fuerza Mayor o Emergencias",
          body: "Ninguna de las partes será responsable del retraso, suspensión o cancelación del evento provocado por terremotos, pandemias, estados de catástrofe dictaminados legalmente, tormentas graves u otros eventos de fuerza mayor imposibles de prever por el Prestador."
        }
      ];

      clauses.forEach(cl => {
        doc.setFont('helvetica', 'bold');
        doc.text(cl.title, 20, y);
        y += 4.5;
        doc.setFont('helvetica', 'normal');
        const clBodyLines = doc.splitTextToSize(cl.body, 170);
        doc.text(clBodyLines, 20, y);
        y += (clBodyLines.length * 4.5) + 6;
      });

      y += 10;

      // Draw Signature Block
      if (y > 230) {
        doc.addPage();
        pageNum++;
        drawPageDecorations(pageNum);
        y = 30;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('ACEPTACIÓN Y CONFORMIDAD', 105, y, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Este documento constituye un borrador de contrato formalizado a través del sistema CRM Mar de Rosas.', 105, y + 4.5, { align: 'center' });
      doc.text('La firma digital o física de los comparecientes abajo sella los compromisos del presente borrador.', 105, y + 8, { align: 'center' });

      y += 35;

      // Draw signature lines
      doc.setDrawColor(148, 163, 184); // slate-400
      doc.line(30, y, 85, y);
      doc.line(125, y, 180, y);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.text('Por "El Prestador"', 57.5, y + 4, { align: 'center' });
      doc.text('Por "El Cliente"', 152.5, y + 4, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);

      doc.text(provider.name, 57.5, y + 8, { align: 'center' });
      doc.text(selectedClient.name, 152.5, y + 8, { align: 'center' });
      doc.text(`RUT/ID: ${selectedClient.company || 'Particular'}`, 152.5, y + 12, { align: 'center' });

      // Save document
      const fileName = `Borrador_Contrato_${selectedClient.name.replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating Contract PDF:', error);
      alert('Hubo un error al generar el borrador de contrato.');
    }
  };

  const handleAddMoodImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMoodUrl) return;
    
    const clientMood = state.moodImages[selectedClient.id] || [];
    const newImg = {
      id: 'm_' + Date.now(),
      title: newMoodTitle || 'Inspiración',
      imageUrl: newMoodUrl,
      category: newMoodCategory
    };

    updateState({
      moodImages: {
        ...state.moodImages,
        [selectedClient.id]: [...clientMood, newImg]
      }
    });

    setNewMoodTitle('');
    setNewMoodUrl('');
  };

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const clientMood = state.moodImages[selectedClient.id] || [];
      const newImg = {
        id: 'm_' + Date.now(),
        title: newMoodTitle || file.name.split('.')[0] || 'Inspiración',
        imageUrl: dataUrl,
        category: newMoodCategory
      };

      updateState({
        moodImages: {
          ...state.moodImages,
          [selectedClient.id]: [...clientMood, newImg]
        }
      });
      addBitacoraEntry('Clientes', `Se subió imagen local ("${newImg.title}") al tablero de inspiración para: ${selectedClient.name}`);

      setNewMoodTitle('');
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteMoodImage = (imgId: string) => {
    const clientMood = state.moodImages[selectedClient.id] || [];
    updateState({
      moodImages: {
        ...state.moodImages,
        [selectedClient.id]: clientMood.filter(img => img.id !== imgId)
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'propuesta':
      case 'pendiente':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">Pendiente</span>;
      case 'activo':
      case 'confirmado':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">Confirmado</span>;
      case 'completado':
      case 'finalizado':
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">Finalizado</span>;
      default:
        return <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full capitalize">{status}</span>;
    }
  };

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'boda':
        return <Heart className="w-4 h-4 text-rose-500" />;
      case 'corporativo':
        return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'cumpleanos':
        return <Tag className="w-4 h-4 text-amber-500" />;
      default:
        return <Tag className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left w-full">
      
      {/* SECTOR DE CONTADORES VISUALES (DASHBOARD PRINCIPAL) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        {/* Tarjeta 1: Total */}
        <div 
          onClick={() => setStatusFilter('todos')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-xs ${
            statusFilter === 'todos' 
              ? 'border-indigo-600 ring-2 ring-indigo-50 bg-indigo-50/10' 
              : 'border-slate-150 hover:border-slate-250'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Todos los Eventos</span>
            <span className="text-2xl font-black text-slate-800 font-mono">
              {clientStats.pendiente + clientStats.confirmado + clientStats.finalizado}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Tarjeta 2: Pendiente */}
        <div 
          onClick={() => setStatusFilter('pendiente')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-xs ${
            statusFilter === 'pendiente' 
              ? 'border-amber-500 ring-2 ring-amber-50 bg-amber-50/10' 
              : 'border-slate-150 hover:border-slate-250'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pendientes (Propuestas)</span>
            <span className="text-2xl font-black text-amber-600 font-mono">
              {clientStats.pendiente}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Tarjeta 3: Confirmado */}
        <div 
          onClick={() => setStatusFilter('confirmado')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-xs ${
            statusFilter === 'confirmado' 
              ? 'border-emerald-500 ring-2 ring-emerald-50 bg-emerald-50/10' 
              : 'border-slate-150 hover:border-slate-250'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Confirmados (Activos)</span>
            <span className="text-2xl font-black text-emerald-600 font-mono">
              {clientStats.confirmado}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Tarjeta 4: Finalizado */}
        <div 
          onClick={() => setStatusFilter('finalizado')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-xs ${
            statusFilter === 'finalizado' 
              ? 'border-indigo-500 ring-2 ring-indigo-50 bg-indigo-50/10' 
              : 'border-slate-150 hover:border-slate-250'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Finalizados (Completados)</span>
            <span className="text-2xl font-black text-indigo-600 font-mono">
              {clientStats.finalizado}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50/80 text-indigo-700 flex items-center justify-center">
            <Archive className="w-5 h-5" />
          </div>
        </div>

      </div>

      <div id="crm_module" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: CLIENT LIST */}
      <div id="client_sidebar" className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-xs p-4 h-[calc(100vh-14rem)] overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-800">Clientes & Eventos</h3>
          </div>
          <button 
            id="btn_add_client"
            onClick={handleOpenAdd}
            className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
            title="Añadir Cliente"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 flex-1">
          {activeClients.map(client => {
            const isSelected = client.id === selectedClient?.id;
            return (
              <div
                id={`client_card_${client.id}`}
                key={client.id}
                onClick={() => updateState({ selectedClientId: client.id })}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                  isSelected 
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs' 
                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="font-medium text-slate-900 text-sm line-clamp-1">{client.eventName}</h4>
                  {getStatusBadge(client.status)}
                </div>
                
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                  {getEventIcon(client.eventType)}
                  <span className="capitalize">{client.eventType}</span>
                  <span className="text-slate-300">•</span>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{client.eventDate}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="truncate max-w-[150px]">{client.name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      id={`edit_client_${client.id}`}
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(client); }}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`delete_client_${client.id}`}
                      onClick={(e) => handleDeleteClient(client, e)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-100"
                      title="Eliminar Cliente"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {activeClients.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs italic">
              Ningún evento activo o propuesta registrada.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: MAIN CLIENT DETAILS */}
      <div id="client_details" className="lg:col-span-8 bg-slate-50/30 rounded-2xl border border-slate-100 p-6 flex flex-col h-[calc(100vh-14rem)] overflow-y-auto">
        {selectedClient ? (
          <div className="space-y-6">
            
            {/* Header Block */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="capitalize text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-sm">
                    {selectedClient.eventType}
                  </span>
                  <span className="text-xs text-slate-400">ID: {selectedClient.id}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">{selectedClient.eventName}</h2>
                <p className="text-sm text-slate-500">Cliente: {selectedClient.name}</p>
              </div>

              <div className="flex gap-2.5">
                <button
                  id="btn_view_portal"
                  onClick={() => onViewClientPortal(selectedClient.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-medium text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  <Eye className="w-4 h-4" />
                  Ver Portal Cliente
                </button>
                <button
                  id="btn_generate_contract"
                  onClick={generateContractPDF}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  Borrador de Contrato PDF
                </button>
              </div>
            </div>

            {/* General Information Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
                <h4 className="font-semibold text-slate-800 text-sm mb-3.5 border-b border-slate-100 pb-2">Información de Contacto</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Mail className="w-4.5 h-4.5 text-slate-400" />
                    <span>{selectedClient.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Phone className="w-4.5 h-4.5 text-slate-400" />
                    <span>{selectedClient.phone}</span>
                  </div>
                  {selectedClient.company && (
                    <div className="flex items-center gap-2.5 text-slate-600">
                      <FileText className="w-4.5 h-4.5 text-slate-400" />
                      <span>Empresa: {selectedClient.company}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Calendar className="w-4.5 h-4.5 text-slate-400" />
                    <span>Fecha del Evento: <b className="text-slate-900">{selectedClient.eventDate}</b></span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
                <h4 className="font-semibold text-slate-800 text-sm mb-3.5 border-b border-slate-100 pb-2">Planificación Financiera</h4>
                <div className="space-y-3.5">
                  <div>
                    <span className="text-xs text-slate-500 block mb-0.5">Presupuesto Límite</span>
                    <div className="flex items-center gap-1 text-slate-800">
                      <DollarSign className="w-5 h-5 text-indigo-500" />
                      <span className="text-xl font-bold">{Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(selectedClient.budgetLimit)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Detalle de Decoración</span>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed max-h-[80px] overflow-y-auto">
                      {selectedClient.decorationDetail || 'Sin detalles de decoración registrados.'}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Notas de Planificación</span>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed max-h-[80px] overflow-y-auto">
                      {selectedClient.notes || 'Sin observaciones iniciales.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Priorities Panel */}
            {(() => {
              const clientChecklist = state.checklist[selectedClient.id] || [];
              const clientInstallments = state.installments[selectedClient.id] || [];
              
              const getDaysRemaining = (dateStr: string) => {
                if (!dateStr) return Infinity;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const target = new Date(dateStr + 'T00:00:00');
                const diffTime = target.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays;
              };

              const priorityTasks = clientChecklist
                .filter(item => !item.completed)
                .map(item => ({ ...item, daysLeft: getDaysRemaining(item.dueDate) }))
                .filter(item => item.daysLeft <= 7)
                .sort((a, b) => a.daysLeft - b.daysLeft);

              const priorityPayments = clientInstallments
                .filter(item => item.status !== 'pagado')
                .map(item => ({ ...item, daysLeft: getDaysRemaining(item.dueDate) }))
                .filter(item => item.daysLeft <= 7)
                .sort((a, b) => a.daysLeft - b.daysLeft);

              const totalPrioritiesCount = priorityTasks.length + priorityPayments.length;

              return (
                <div id="daily_priorities_panel" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-slate-100 pb-3 gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 text-sm">Prioridades de Gestión Diaria</h4>
                        <p className="text-[11px] text-slate-400">Tareas y vencimientos atrasados o en los próximos 7 días</p>
                      </div>
                    </div>
                    {totalPrioritiesCount > 0 ? (
                      <span className="self-start sm:self-auto text-xs font-bold px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        {totalPrioritiesCount} {totalPrioritiesCount === 1 ? 'alerta pendiente' : 'alertas pendientes'}
                      </span>
                    ) : (
                      <span className="self-start sm:self-auto text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Todo al día
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Tasks Column */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                          Tareas del Checklist ({priorityTasks.length})
                        </span>
                      </div>
                      
                      {priorityTasks.length > 0 ? (
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {priorityTasks.map(task => {
                            const isOverdue = task.daysLeft < 0;
                            return (
                              <div 
                                key={task.id} 
                                className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 transition-colors ${
                                  isOverdue 
                                    ? 'bg-rose-50/40 border-rose-100 hover:bg-rose-50/60' 
                                    : 'bg-amber-50/30 border-amber-100 hover:bg-amber-50/50'
                                }`}
                              >
                                <div className="space-y-1 text-left flex-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                    {task.category}
                                  </span>
                                  <h5 className="font-medium text-slate-800 line-clamp-2">{task.title}</h5>
                                  <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>Vence: {task.dueDate}</span>
                                  </div>
                                </div>

                                <div className="text-right flex flex-col items-end gap-1 shrink-0">
                                  {isOverdue ? (
                                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-[9px] rounded-md uppercase">
                                      Atrasado ({Math.abs(task.daysLeft)}d)
                                    </span>
                                  ) : task.daysLeft === 0 ? (
                                    <span className="px-2 py-0.5 bg-amber-150 text-amber-900 font-bold text-[9px] rounded-md uppercase">
                                      Hoy
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[9px] rounded-md uppercase">
                                      En {task.daysLeft} d
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-slate-400 text-xs">Sin tareas críticas o atrasadas en los próximos 7 días.</p>
                        </div>
                      )}
                    </div>

                    {/* Payments Column */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                          Fechas de Pago Próximas ({priorityPayments.length})
                        </span>
                      </div>

                      {priorityPayments.length > 0 ? (
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {priorityPayments.map((payment, idx) => {
                            const isOverdue = payment.daysLeft < 0;
                            return (
                              <div 
                                key={payment.id || idx} 
                                className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 transition-colors ${
                                  isOverdue 
                                    ? 'bg-rose-50/40 border-rose-100 hover:bg-rose-50/60' 
                                    : 'bg-amber-50/30 border-amber-100 hover:bg-amber-50/50'
                                }`}
                              >
                                <div className="space-y-1 text-left flex-1">
                                  <h5 className="font-bold text-slate-800">
                                    {Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(payment.amount)}
                                  </h5>
                                  <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>Vence: {payment.dueDate}</span>
                                  </div>
                                </div>

                                <div className="text-right flex flex-col items-end gap-1 shrink-0">
                                  {isOverdue ? (
                                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-[9px] rounded-md uppercase">
                                      Atrasado ({Math.abs(payment.daysLeft)}d)
                                    </span>
                                  ) : payment.daysLeft === 0 ? (
                                    <span className="px-2 py-0.5 bg-amber-150 text-amber-900 font-bold text-[9px] rounded-md uppercase">
                                      Hoy
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[9px] rounded-md uppercase">
                                      En {payment.daysLeft} d
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400 capitalize">Pendiente</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-slate-400 text-xs">Sin pagos urgentes o atrasados en los próximos 7 días.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Inspiration Board / Mood Board */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-indigo-500" />
                  <h4 className="font-semibold text-slate-800 text-sm">Tablero de Inspiración & Mood Board</h4>
                </div>
                <span className="text-xs text-slate-400">Estilos y paleta de colores para el evento</span>
              </div>

              {/* Add image form */}
              <form onSubmit={handleAddMoodImage} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="md:col-span-4">
                  <input
                    type="text"
                    value={newMoodTitle}
                    onChange={(e) => setNewMoodTitle(e.target.value)}
                    placeholder="Título (ej: Altar rústico)"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div className="md:col-span-5">
                  <input
                    type="url"
                    value={newMoodUrl}
                    onChange={(e) => setNewMoodUrl(e.target.value)}
                    placeholder="URL de la imagen Unsplash"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <select
                    value={newMoodCategory}
                    onChange={(e) => setNewMoodCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 outline-hidden focus:border-indigo-500"
                  >
                    <option value="Decoración">Decoración</option>
                    <option value="Flores">Flores</option>
                    <option value="Montaje">Montaje</option>
                    <option value="Catering">Catering</option>
                    <option value="Iluminación">Iluminación</option>
                  </select>
                </div>
                <div className="md:col-span-1">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-lg flex items-center justify-center cursor-pointer font-medium"
                    title="Añadir Imagen"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Local File Upload Section */}
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-between bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/60 mb-5 text-xs">
                <div className="text-left">
                  <span className="font-bold text-slate-700 block">¿O prefieres subir una foto desde tu computador?</span>
                  <span className="text-[11px] text-slate-400">Selecciona un archivo de imagen para cargarlo directamente. Se guardará con la categoría seleccionada arriba.</span>
                </div>
                <label className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-indigo-50 border border-indigo-200 hover:border-indigo-300 text-indigo-700 font-bold rounded-xl cursor-pointer transition-all shadow-xs">
                  <Upload className="w-4 h-4 text-indigo-500" />
                  <span>Subir desde mi PC</span>
                  <input
                    type="file"
                    id="crm_mood_upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLocalImageUpload}
                  />
                </label>
              </div>

              {/* Image Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(state.moodImages[selectedClient.id] || []).map(img => (
                  <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-100 shadow-2xs h-36">
                    <img 
                      src={img.imageUrl} 
                      alt={img.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent p-2 flex flex-col justify-between opacity-90 group-hover:opacity-100 transition-opacity">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] bg-indigo-600 text-white font-medium px-1.5 py-0.5 rounded-xs">
                          {img.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteMoodImage(img.id)}
                          className="p-1 bg-red-500/80 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[11px] font-medium text-white truncate text-left">{img.title}</p>
                    </div>
                  </div>
                ))}
                {(state.moodImages[selectedClient.id] || []).length === 0 && (
                  <div className="col-span-4 py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-xs">No hay imágenes en el tablero de inspiración.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Logs & History */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-left">
              <h4 className="font-semibold text-slate-800 text-sm mb-3.5 border-b border-slate-100 pb-2">Historial de Relación con el Cliente</h4>
              <div className="relative border-l border-slate-100 pl-4 space-y-4">
                <div className="relative">
                  <div className="absolute -left-[21px] top-1.5 bg-indigo-500 w-2.5 h-2.5 rounded-full ring-4 ring-white" />
                  <span className="text-[10px] text-indigo-600 font-semibold block">FECHA DE CREACIÓN - {selectedClient.createdAt}</span>
                  <p className="text-xs text-slate-700 mt-0.5 font-medium">Cliente ingresado en el sistema CRM</p>
                  <p className="text-[11px] text-slate-500">Origen de registro: Oficina Central. Estado: Propuesta inicial.</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-1.5 bg-emerald-500 w-2.5 h-2.5 rounded-full ring-4 ring-white" />
                  <span className="text-[10px] text-emerald-600 font-semibold block">CONTRATO FIRMADO</span>
                  <p className="text-xs text-slate-700 mt-0.5 font-medium">Contrato nupcial y depósito de reserva confirmados</p>
                  <p className="text-[11px] text-slate-500">Presupuesto inicial estimado fijado en {Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(selectedClient.budgetLimit)}.</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-1.5 bg-slate-400 w-2.5 h-2.5 rounded-full ring-4 ring-white" />
                  <span className="text-[10px] text-slate-500 font-semibold block">PLANIFICADOR ASIGNADO</span>
                  <p className="text-xs text-slate-700 mt-0.5 font-medium">Habilitado portal del cliente y asignación de checklists</p>
                  <p className="text-[11px] text-slate-500">Fichas técnicas y catálogo de proveedores compartidos con el cliente.</p>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white border border-slate-100 rounded-2xl">
            <Users className="w-12 h-12 text-slate-300 mb-2" />
            <p className="text-slate-500 text-sm">Cargue o cree un cliente para comenzar.</p>
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT CLIENT */}
      {isAdding && (
        <div id="client_modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-8 shadow-2xl border border-slate-100 text-left my-8 max-h-[90vh] overflow-y-auto">
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* LEFT COLUMN: EVENT DETAILS */}
              <div className="md:col-span-6 space-y-4">
                <h3 className="font-extrabold text-slate-800 text-xl tracking-tight mb-2">
                  {editingClient ? 'Editar Información del Evento' : 'Registrar Nuevo Cliente & Evento'}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre Completo del Cliente *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
                      required
                      placeholder="Tamara y Ante"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Empresa (Opcional)</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
                      placeholder="e.g. Corporación S.A."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Correo Electrónico *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
                      required
                      placeholder="tmaraante@gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono Móvil *</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
                      required
                      placeholder="+56979997224"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Evento</label>
                    <select
                      value={formData.eventType}
                      onChange={(e) => setFormData({...formData, eventType: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all font-medium capitalize"
                    >
                      {(state.configurations?.eventTypes || ['boda', 'corporativo', 'cumpleanos', 'otro']).map((type) => {
                        const label = type === 'boda' ? 'Boda'
                                    : type === 'corporativo' ? 'Corporativo'
                                    : type === 'cumpleanos' ? 'Cumpleaños'
                                    : type === 'otro' ? 'Otro'
                                    : type;
                        return (
                          <option key={type} value={type}>{label}</option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del Evento *</label>
                    <input
                      type="text"
                      value={formData.eventName}
                      onChange={(e) => setFormData({...formData, eventName: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
                      required
                      placeholder="Boda Tamara & Ante"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha del Evento *</label>
                    <input
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Presupuesto Máximo (CLP)</label>
                    <input
                      type="number"
                      value={formData.budgetLimit}
                      onChange={(e) => setFormData({...formData, budgetLimit: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all font-mono"
                      required
                      min="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Detalle de Decoración</label>
                  <textarea
                    id="input_decoration_detail"
                    value={formData.decorationDetail}
                    onChange={(e) => setFormData({...formData, decorationDetail: e.target.value})}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all resize-none leading-relaxed"
                    placeholder="Temática, paleta de colores, flores, mantelería y otros elementos específicos de decoración."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Notas, Preferencias o Detalles Clave</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all resize-none leading-relaxed"
                    placeholder="Detalles sobre catering, ambientación, restricciones, etc."
                  />
                </div>
              </div>

              {/* RIGHT COLUMN: FOOD MENU SELECTION */}
              <div className="md:col-span-6 flex flex-col justify-between space-y-4">
                
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label className="block text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-indigo-500" />
                      Seleccionar Menú de Comidas para el Evento
                    </label>

                    {/* Add dish dropdown button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowAddDishDropdown(!showAddDishDropdown)}
                        className="flex items-center gap-1 px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar plato
                      </button>
                      
                      {showAddDishDropdown && (
                        <div className="absolute right-0 mt-1.5 w-72 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-2.5 max-h-60 overflow-y-auto space-y-1">
                          <div className="px-1.5 pb-2 border-b border-slate-100 mb-1.5">
                            <input 
                              type="text"
                              placeholder="Buscar plato por nombre..."
                              value={dishSearchText}
                              onChange={(e) => setDishSearchText(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          {availableDishes
                            .filter(dish => dish.name.toLowerCase().includes(dishSearchText.toLowerCase()))
                            .map(dish => {
                              const isAlreadySelected = selectedFoodItems.some(it => it.name.toLowerCase() === dish.name.toLowerCase());
                              return (
                                <button
                                  key={dish.id}
                                  type="button"
                                  onClick={() => {
                                    if (isAlreadySelected) {
                                      setSelectedFoodItems(selectedFoodItems.map(it => 
                                        it.name.toLowerCase() === dish.name.toLowerCase() 
                                          ? { ...it, quantity: it.quantity + 1 } 
                                          : it
                                      ));
                                    } else {
                                      setSelectedFoodItems([...selectedFoodItems, {
                                        ...dish,
                                        quantity: 1
                                      }]);
                                    }
                                    setShowAddDishDropdown(false);
                                    setDishSearchText('');
                                  }}
                                  className="w-full text-left p-2 hover:bg-slate-50 rounded-lg flex items-center justify-between gap-2 transition-all text-[11px] cursor-pointer"
                                >
                                  <div className="min-w-0 pr-1">
                                    <span className="font-semibold text-slate-700 block truncate">{dish.name}</span>
                                    <span className="text-[8px] text-slate-400 uppercase tracking-wider font-mono font-bold mt-0.5 inline-block">
                                      {dish.category === 'plato_principal' ? 'Plato Principal' : dish.category === 'coctel' ? 'Cóctel' : dish.category === 'bebestible' ? 'Bebestible' : dish.category === 'trasnoche' ? 'Trasnoche' : dish.category === 'entrada' ? 'Entrada' : dish.category === 'postre' ? 'Postre' : dish.category}
                                    </span>
                                  </div>
                                  <span className="font-bold text-indigo-600 shrink-0">
                                    {Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(dish.estimatedCost)}
                                  </span>
                                </button>
                              );
                            })}
                          {availableDishes.filter(dish => dish.name.toLowerCase().includes(dishSearchText.toLowerCase())).length === 0 && (
                            <div className="p-3 text-center text-[11px] text-slate-400">No se encontraron platos.</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
                    Agregue platos al menú, asigne la cantidad necesaria para calcular los subtotales y determine el costo total del catering:
                  </p>
                  
                  {/* Selected Food Items List */}
                  <div className="space-y-2 mb-4 h-[240px] overflow-y-auto bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    {selectedFoodItems.length > 0 ? (
                      selectedFoodItems.map((item) => {
                        const itemTotal = item.estimatedCost * item.quantity;
                        return (
                          <div 
                            key={item.id} 
                            className="bg-white border border-slate-150 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left transition-all hover:border-slate-300 shadow-3xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-700 truncate block max-w-xs" title={item.name}>{item.name}</span>
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200/60 rounded-md text-[9px] font-semibold uppercase tracking-wider scale-90 origin-left">
                                  {item.category === 'plato_principal' ? 'Plato Principal' : item.category === 'coctel' ? 'Cóctel' : item.category === 'bebestible' ? 'Bebestible' : item.category === 'trasnoche' ? 'Trasnoche' : item.category === 'entrada' ? 'Entrada' : item.category === 'postre' ? 'Postre' : item.category}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                                <span>Valor unitario: <strong className="text-slate-600 font-mono">{Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(item.estimatedCost)}</strong></span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3.5 border-t border-slate-100 sm:border-0 pt-2 sm:pt-0">
                              {/* Quantity Controls */}
                              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shrink-0">
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const newQty = Math.max(1, item.quantity - 1);
                                    setSelectedFoodItems(selectedFoodItems.map(it => it.id === item.id ? { ...it, quantity: newQty } : it));
                                  }}
                                  className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs transition-all cursor-pointer select-none border-r border-slate-200"
                                >-</button>
                                <input 
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const newQty = Math.max(1, parseInt(e.target.value) || 1);
                                    setSelectedFoodItems(selectedFoodItems.map(it => it.id === item.id ? { ...it, quantity: newQty } : it));
                                  }}
                                  className="w-10 text-center text-xs font-black text-slate-700 border-0 bg-transparent p-0.5 outline-hidden focus:ring-0"
                                />
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setSelectedFoodItems(selectedFoodItems.map(it => it.id === item.id ? { ...it, quantity: item.quantity + 1 } : it));
                                  }}
                                  className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs transition-all cursor-pointer select-none border-l border-slate-200"
                                >+</button>
                              </div>

                              {/* Total price for this dish */}
                              <div className="text-right min-w-[70px] shrink-0">
                                <span className="text-[8px] text-slate-400 block font-bold uppercase leading-none mb-0.5 tracking-wider">Subtotal</span>
                                <span className="text-[11px] font-black text-indigo-600 font-mono">
                                  {Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(itemTotal)}
                                </span>
                              </div>

                              {/* Remove item button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedFoodItems(selectedFoodItems.filter(it => it.id !== item.id));
                                }}
                                className="text-slate-400 hover:text-rose-500 p-1 hover:bg-rose-50 rounded-lg transition-all cursor-pointer shrink-0"
                                title="Quitar plato"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex items-center justify-center text-center text-slate-400 text-xs italic">
                        Ningún plato seleccionado. Haz clic en "Agregar plato" para diseñar el menú del evento.
                      </div>
                    )}
                  </div>
                </div>

                {/* Grand total displays here */}
                <div className="flex items-center justify-between p-4 bg-indigo-50/40 border border-indigo-100 rounded-2xl text-left">
                  <div>
                    <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">Costo Total del Menú</span>
                    <span className="text-[10px] text-slate-400">Suma de todos los platos seleccionados</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-indigo-700 font-mono">
                      {Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(
                        selectedFoodItems.reduce((sum, item) => sum + (item.estimatedCost * item.quantity), 0)
                      )}
                    </span>
                  </div>
                </div>

                {/* Relation Status dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Estado de la Relación</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all font-medium capitalize"
                  >
                    {(state.configurations?.relationStatuses || ['propuesta', 'activo', 'completado']).map((status) => (
                      <option key={status} value={status}>{getStatusLabel(status)}</option>
                    ))}
                  </select>
                </div>

                {/* Form Action Footer */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={generatePDF}
                    className="flex items-center gap-1.5 px-4 py-2 border border-rose-200 hover:border-rose-300 bg-rose-50/50 hover:bg-rose-50 text-rose-700 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    <FileText className="w-4 h-4 text-rose-600" />
                    Generar PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md cursor-pointer transition-all"
                  >
                    {editingClient ? 'Guardar Cambios' : 'Registrar Cliente'}
                  </button>
                </div>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Client Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full overflow-hidden animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <Trash className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">¿Eliminar evento y cliente?</h3>
              <p className="text-xs text-slate-500 mb-6">
                ¿Está seguro de que desea eliminar el evento <strong>"{clientToDelete.eventName}"</strong> de <strong>{clientToDelete.name}</strong>? Se borrarán de forma permanente todos sus registros de presupuestos, cronogramas, lista de invitados y configuraciones asociadas.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setClientToDelete(null)}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-500 font-bold text-xs rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteClient}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-md shadow-rose-100 transition-all cursor-pointer"
                >
                  Eliminar Evento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
    </div>
  );
}
