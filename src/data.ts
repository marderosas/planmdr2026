/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, ChecklistItem, DayTimelineItem, Protocol, BudgetItem, PaymentInstallment, Vendor, ServiceOrder, Guest, Table, MoodImage, FoodMenuItem } from './types';

// Clear all sample clients
export const sampleClients: Client[] = [];

// Clear all sample checklists
export const sampleChecklists: {[clientId: string]: ChecklistItem[]} = {};

// Clear all sample day timelines
export const sampleDayTimelines: {[clientId: string]: DayTimelineItem[]} = {};

// Clear all sample protocols
export const sampleProtocols: {[clientId: string]: Protocol[]} = {};

// Clear all sample budget items
export const sampleBudgetItems: {[clientId: string]: BudgetItem[]} = {};

// Clear all sample installments
export const sampleInstallments: {[clientId: string]: PaymentInstallment[]} = {};

// Clear all sample vendors
export const sampleVendors: Vendor[] = [];

// Clear all sample service orders
export const sampleServiceOrders: {[clientId: string]: ServiceOrder[]} = {};

// Clear all sample guests
export const sampleGuests: {[clientId: string]: Guest[]} = {};

// Clear all sample tables
export const sampleTables: {[clientId: string]: Table[]} = {};

// Clear all sample mood images
export const sampleMoodImages: {[clientId: string]: MoodImage[]} = {};

// Clear all sample food menus
export const sampleFoodMenus: {[clientId: string]: FoodMenuItem[]} = {};
