/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EventType = string;

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  eventType: string;
  eventName: string;
  eventDate: string;
  budgetLimit: number;
  decorationDetail?: string;
  notes: string;
  status: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  dueDate: string;
  completed: boolean;
  notes?: string;
}

export interface DayTimelineItem {
  id: string;
  time: string;
  title: string;
  description: string;
  responsible: string;
  completed: boolean;
}

export interface ProtocolMember {
  id: string;
  name: string;
  role: string;
  notes?: string;
}

export interface Protocol {
  id: string;
  title: string; // e.g. "Entrada de la Boda", "Corte de Pastel"
  description: string;
  members: ProtocolMember[];
  steps: string[];
}

export interface BudgetItem {
  id: string;
  category: string;
  name: string;
  plannedCost: number;
  actualCost: number;
  paidAmount: number;
  notes?: string;
}

export interface PaymentInstallment {
  id: string;
  dueDate: string;
  amount: number;
  status: 'pendiente' | 'pagado';
  datePaid?: string;
  reference?: string;
}

export interface Vendor {
  id: string;
  category: 'catering' | 'decoracion' | 'musica_sonido' | 'fotografia' | 'lugar' | 'personal_tecnico' | 'animacion';
  name: string;
  contactName: string;
  phone: string;
  email: string;
  rating: number;
  status: 'contratado' | 'cotizando' | 'disponible';
  basePrice: number;
  notes?: string;
}

export interface ServiceOrder {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  items: string[];
  setupTime: string;
  eventTime: string;
  teardownTime: string;
  notes: string;
  status: 'borrador' | 'enviado' | 'aceptado';
  sentAt?: string;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  tableId: string | null; // ID of assigned table
  rsvp: 'pendiente' | 'confirmado' | 'declinado';
  companionCount: number;
  checkedIn: boolean;
  checkedInTime?: string;
}

export interface Table {
  id: string;
  name: string; // e.g., "Mesa 1", "Mesa Presidencial"
  capacity: number;
  shape: 'circle' | 'square';
  x: number; // position on floor plan canvas (%)
  y: number; // position on floor plan canvas (%)
}

export interface MoodImage {
  id: string;
  imageUrl: string;
  title: string;
  category: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  availableQuantity: number;
  condition: string;
  location: string;
  unitCost: number;
  notes?: string;
}

export interface FoodMenuItem {
  id: string;
  name: string;
  category: 'coctel' | 'entrada' | 'plato_principal' | 'postre' | 'bebestible' | 'trasnoche' | 'otro';
  description: string;
  ingredients: string;
  allergens: string;
  notes?: string;
  estimatedCost?: number;
  quantity?: number;
}

export interface ServiceProvider {
  name: string;
  rut: string;
  address: string;
  representative: string;
  representativeRut: string;
  phone: string;
  email: string;
}

export interface AppConfigurations {
  provider?: ServiceProvider;
  relationStatuses?: string[];
  timelineCategories?: string[];
  budgetCategories?: string[];
  inventoryCategories?: string[];
  inventoryConditions?: string[];
  eventTypes?: string[];
  theme?: 'light' | 'dark';
}

export interface EventState {
  clients: Client[];
  checklist: {[clientId: string]: ChecklistItem[]};
  dayTimeline: {[clientId: string]: DayTimelineItem[]};
  protocols: {[clientId: string]: Protocol[]};
  budgetItems: {[clientId: string]: BudgetItem[]};
  installments: {[clientId: string]: PaymentInstallment[]};
  vendors: Vendor[];
  serviceOrders: {[clientId: string]: ServiceOrder[]};
  guests: {[clientId: string]: Guest[]};
  tables: {[clientId: string]: Table[]};
  moodImages: {[clientId: string]: MoodImage[]};
  selectedClientId: string;
  inventory: InventoryItem[];
  foodMenu: {[clientId: string]: FoodMenuItem[]};
  globalDishes?: FoodMenuItem[];
  configurations?: AppConfigurations;
}
