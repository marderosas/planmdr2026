/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { EventState, AppConfigurations, ServiceProvider } from '../types';
import { generateDemoData } from '../utils/seeder';
import { 
  getRegisteredUsersPublic, 
  deleteRegisteredUser, 
  addRegisteredUser, 
  updateRegisteredUser,
  getBitacora, 
  addBitacoraEntry,
  BitacoraEntry
} from '../firebase';
import { 
  Settings, 
  Building2, 
  Plus, 
  Trash2, 
  Save, 
  Users, 
  Calendar, 
  Coins, 
  Package, 
  FileText, 
  Info,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Download,
  Database,
  RotateCcw,
  History,
  UserPlus,
  Key,
  Shield,
  Clock,
  Edit,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ConfigurationModuleProps {
  state: EventState;
  updateState: (newState: Partial<EventState>) => void;
  onResetDatabase?: () => void;
}

export const defaultProvider: ServiceProvider = {
  name: 'Producciones Mar de Rosas S.A.',
  rut: '76.123.456-7',
  address: 'Av. Vitacura 1234, Santiago',
  representative: 'María de las Rosas',
  representativeRut: '15.456.789-0',
  phone: '+56 9 1234 5678',
  email: 'contacto@marderosas.cl'
};

export const defaultRelationStatuses = ['propuesta', 'activo', 'completado'];
export const defaultTimelineCategories = ['Contratos', 'Proveedores', 'Decoración', 'Logística', 'Invitados', 'General'];
export const defaultBudgetCategories = ['lugar', 'catering', 'decoracion', 'musica_sonido', 'fotografia', 'personal', 'otros'];
export const defaultInventoryCategories = ['mesas', 'sillas', 'manteleria', 'arreglos', 'vajilla', 'otros'];
export const defaultInventoryConditions = ['excelente', 'bueno', 'mantenimiento', 'debaja'];
export const defaultEventTypes = ['boda', 'corporativo', 'cumpleanos', 'otro'];

export default function ConfigurationModule({ state, updateState, onResetDatabase }: ConfigurationModuleProps) {
  const configs: AppConfigurations = state.configurations || {};
  
  // Tab states: 'provider' | 'crm' | 'timeline' | 'budget' | 'inventory' | 'history' | 'manual' | 'database' | 'users' | 'bitacora'
  const [activeTab, setActiveTab] = useState<'provider' | 'crm' | 'timeline' | 'budget' | 'inventory' | 'history' | 'manual' | 'database' | 'users' | 'bitacora'>('provider');

  // Form states for provider
  const [providerForm, setProviderForm] = useState<ServiceProvider>(() => configs.provider || { ...defaultProvider });

  // Input states for adding new options
  const [newStatus, setNewStatus] = useState('');
  const [newTimelineCat, setNewTimelineCat] = useState('');
  const [newBudgetCat, setNewBudgetCat] = useState('');
  const [newInventoryCat, setNewInventoryCat] = useState('');
  const [newInventoryCond, setNewInventoryCond] = useState('');
  const [newEventType, setNewEventType] = useState('');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  // User Management state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userDisplayName, setUserDisplayName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userRut, setUserRut] = useState('');
  const [userRole, setUserRoleState] = useState('Planificador');
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);
  const [editingUserUid, setEditingUserUid] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);

  // Bitacora state
  const [bitacoraList, setBitacoraList] = useState<BitacoraEntry[]>([]);
  const [bitacoraSearch, setBitacoraSearch] = useState('');
  const [bitacoraFilterModule, setBitacoraFilterModule] = useState('all');

  useEffect(() => {
    let active = true;
    if (activeTab === 'users') {
      getRegisteredUsersPublic().then((res) => {
        if (active) setUsersList(res);
      }).catch(err => console.error(err));
    } else if (activeTab === 'bitacora') {
      getBitacora().then((res) => {
        if (active) setBitacoraList(res);
      }).catch(err => console.error(err));
    }
    return () => { active = false; };
  }, [activeTab]);

  const handleStartEditUser = (usr: any) => {
    setEditingUserUid(usr.uid);
    setUserEmail(usr.email || '');
    setUserPassword(''); // Empty means keep current password
    setUserDisplayName(usr.displayName || '');
    setUserPhone(usr.phone || '');
    setUserRut(usr.rut || '');
    setUserRoleState(usr.role || 'Planificador');
    setUserError(null);
    setUserSuccess(null);
  };

  const handleCancelEditUser = () => {
    setEditingUserUid(null);
    setUserEmail('');
    setUserPassword('');
    setUserDisplayName('');
    setUserPhone('');
    setUserRut('');
    setUserRoleState('Planificador');
    setUserError(null);
    setUserSuccess(null);
  };

  const handleFormSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);
    setUserSuccess(null);

    if (!userEmail || !userDisplayName) {
      setUserError('Nombre Completo y Correo Electrónico son obligatorios.');
      return;
    }

    if (!editingUserUid && !userPassword) {
      setUserError('La contraseña es obligatoria para nuevos registros.');
      return;
    }

    try {
      if (editingUserUid) {
        const fresh = await updateRegisteredUser(editingUserUid, {
          email: userEmail,
          password: userPassword || undefined,
          displayName: userDisplayName,
          phone: userPhone,
          rut: userRut,
          role: userRole
        });
        await addBitacoraEntry('Configuración', `Modificación de datos de usuario: ${userDisplayName} (${userEmail}) con rol ${userRole}`);
        setUserSuccess('¡Usuario modificado con éxito!');
        setEditingUserUid(null);
        setUsersList(fresh);
      } else {
        await addRegisteredUser({
          email: userEmail,
          password: userPassword,
          displayName: userDisplayName,
          phone: userPhone,
          rut: userRut,
          role: userRole
        });
        await addBitacoraEntry('Configuración', `Registro de nuevo usuario: ${userDisplayName} (${userEmail}) con rol ${userRole}`);
        setUserSuccess('¡Usuario registrado con éxito!');
      }

      // Reset form
      setUserEmail('');
      setUserPassword('');
      setUserDisplayName('');
      setUserPhone('');
      setUserRut('');
      setUserRoleState('Planificador');
      // Refresh list
      const freshList = await getRegisteredUsersPublic();
      setUsersList(freshList);
    } catch (err: any) {
      setUserError(err.message || 'Error al guardar el usuario.');
    }
  };

  const handleDeleteUser = (uid: string) => {
    const usr = usersList.find(u => u.uid === uid);
    if (usr) {
      setUserToDelete(usr);
    }
  };

  // Lists with defaults
  const relationStatuses = configs.relationStatuses || [...defaultRelationStatuses];
  const timelineCategories = configs.timelineCategories || [...defaultTimelineCategories];
  const budgetCategories = configs.budgetCategories || [...defaultBudgetCategories];
  const inventoryCategories = configs.inventoryCategories || [...defaultInventoryCategories];
  const inventoryConditions = configs.inventoryConditions || [...defaultInventoryConditions];
  const eventTypes = configs.eventTypes || [...defaultEventTypes];

  const handleSaveProvider = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedConfigs: AppConfigurations = {
      ...configs,
      provider: providerForm
    };
    updateState({ configurations: updatedConfigs });
    addBitacoraEntry('Configuración', `Actualización de datos del prestador de servicios: ${providerForm.name}`);
    triggerSuccessMessage();
  };

  const triggerSuccessMessage = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const updateConfigList = (key: keyof AppConfigurations, newList: string[]) => {
    const updatedConfigs: AppConfigurations = {
      ...configs,
      [key]: newList
    };
    updateState({ configurations: updatedConfigs });
    addBitacoraEntry('Configuración', `Actualización de lista de configuración: ${key}`);
    triggerSuccessMessage();
  };

  const generateManualPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Set up common settings
      const margin = 20;
      const contentWidth = 170; // 210 - 2 * 20
      const pageHeight = 297;
      let y = 25;
      let pageNumber = 1;

      const drawPageDecorations = () => {
        // Top border/line (ink-friendly)
        doc.setDrawColor(79, 70, 229); // indigo-600
        doc.setLineWidth(0.5);
        doc.line(margin, 15, 210 - margin, 15);

        // Footer
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text('Manual de Usuario - Mar de Rosas CRM', margin, pageHeight - 12);
        doc.text(`Página ${pageNumber}`, 210 - margin - 15, pageHeight - 12);
      };

      const checkPageOverflow = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - 20) {
          doc.addPage();
          pageNumber++;
          y = 25;
          drawPageDecorations();
        }
      };

      // 1. Cover Page / Header
      drawPageDecorations();
      
      // Header box
      doc.setDrawColor(79, 70, 229);
      doc.setLineWidth(1);
      doc.rect(margin, y, contentWidth, 30, 'D');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229); // Indigo
      doc.text('MAR DE ROSAS CRM', margin + 10, y + 12);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105); // Slate-600
      doc.text('Manual de Operación y Administración de Eventos', margin + 10, y + 22);
      
      y += 45; // Move cursor down below the header box to prevent overlapping
      
      const chapters = [
        {
          title: '1. Introducción, Acceso Seguro y Dashboard',
          content: [
            'Mar de Rosas CRM es la plataforma oficial centralizada para la planificación, coordinación y administración de eventos. Toda la información ingresada se sincroniza en la nube utilizando Google Firebase (Firestore), garantizando respaldo automático y acceso multiusuario en tiempo real.',
            'Paso a Paso para el Acceso al Sistema:',
            '1. Autenticación de Entrada: Ingrese a la plataforma mediante su Cuenta de Google autorizada o con sus credenciales de correo electrónico y contraseña registradas previamente por el Administrador.',
            '2. Selección del Evento Activo (CRÍTICO): En la barra superior, localice el selector desplegable llamado "Evento Activo". Al seleccionar un evento (ej. Matrimonio de Javiera & Pedro), toda la información cargada en los demás módulos (Cronogramas, Presupuestos, Invitados, Mesas, Alérgenos, Banquetes) se filtrará automáticamente para corresponder única y exclusivamente al evento seleccionado. Asegúrese de tener seleccionado el evento correcto antes de operar.',
            '3. Monitoreo de Indicadores (Dashboard): El panel de control principal le muestra un resumen visual del estado comercial: solicitudes "Pendientes" (propuestas en negociación), proyectos "Confirmados" (eventos activos en fase de planificación) y proyectos "Finalizados" (eventos concluidos y archivados con éxito).'
          ]
        },
        {
          title: '2. Clientes, Fichas Técnicas y Contratos (CRM)',
          content: [
            'La pestaña "Clientes & CRM" es el núcleo operativo de la plataforma. Permite registrar las solicitudes, realizar seguimiento comercial y estructurar las bodas.',
            'Paso a Paso de Operaciones:',
            '1. Registrar una Nueva Solicitud/Cliente: Haga clic en el botón verde "Registrar Solicitud/Cliente". Rellene el formulario con los datos iniciales de contacto: Nombre del cliente (novios o contacto principal), Correo, Fono, Tipo de Evento (Matrimonio, Corporativo, etc.), Locación o Centro de Eventos tentativa, Fecha estimada y Presupuesto referencial. Guarde los cambios para crear la ficha.',
            '2. Consultar y Editar la Ficha Técnica: En la lista de clientes, localice al cliente deseado y haga clic en el ícono de la carpeta (Abrir Ficha). Se desplegará el panel detallado donde podrá registrar plazos de montaje, observaciones específicas y notas de decoración.',
            '3. Cargar Inspiración y Moodboard: Dentro de la Ficha Técnica, encontrará el área de "Inspiración & Decoración". Tanto usted como el cliente (desde su enlace de acceso privado) pueden adjuntar imágenes de referencia (ingresando un enlace URL o arrastrando una foto de su PC). Esto permite definir de forma cooperativa el diseño conceptual (colores, mantelería, flores, altar).',
            '4. Descargar Ficha Técnica PDF: Con un solo clic, exporte un documento PDF limpio y ordenado, diseñado con alto contraste y listo para imprimir o enviar por WhatsApp al personal de montaje.',
            '5. Generar Borrador de Contrato Comercial: En la parte baja de la ficha, el sistema permite descargar de forma instantánea el borrador de contrato de prestación de servicios. Este documento cruza en segundos los datos del cliente con la información legal cargada en el panel de "Configuración" de la agencia, evitando tener que redactar contratos de forma manual para cada cliente.'
          ]
        },
        {
          title: '3. Planificación de Tareas y Cronogramas de Trabajo',
          content: [
            'El módulo "Cronograma" organiza la planificación temporal del evento de forma estructurada para evitar olvidos o demoras críticas en el día clave.',
            'Paso a Paso de Operaciones:',
            '1. Registrar una Tarea: En el panel de cronograma del evento activo, escriba el título del pendiente (ej. "Contratar Banquetera", "Confirmar Dj", "Definir Vajilla"), seleccione el colaborador responsable de su ejecución, fije la fecha límite esperada de cumplimiento y clasifíquela en su categoría temática (Contratos, Proveedores, Ambientación, Logística, Invitados, etc.).',
            '2. Marcar Avance y Tachar Pendientes: El equipo puede cambiar el estado de las tareas haciendo clic directamente sobre el botón de estado para alternar entre "Pendiente" (color gris/amarillo) y "Realizado" (color verde con tachado).',
            '3. Control de Avance: En la parte superior de la vista, un indicador interactivo calculará el porcentaje de cumplimiento real de las tareas del evento, facilitando las reuniones de estatus semanales del equipo.'
          ]
        },
        {
          title: '4. Control Financiero: Presupuestos, Gastos y Cuotas',
          content: [
            'La sección "Presupuesto" ofrece un control de caja estricto para calcular la rentabilidad real de cada evento de forma transparente.',
            'Paso a Paso de Operaciones:',
            '1. Configurar Presupuesto Inicial: Registre el monto acordado inicialmente con el cliente para que sirva de marco referencial.',
            '2. Registrar un Costo / Egreso de Proveedor: Agregue cada gasto de proveedor especificando el ítem (ej. "Arriendo de Carpa"), el proveedor asignado, la categoría (ej. Producción, Flores, Música), el costo estimado inicial, el costo real final, y si ya fue pagado. El sistema calculará automáticamente la desviación del gasto para alertar sobre sobrecostos.',
            '3. Controlar Plan de Cuotas (Hitos de Cobranza): Planifique las cuotas de pago que debe realizar el cliente. Escriba el monto, defina la fecha de vencimiento y marque el estado como "Pagado" o "Pendiente". Esto le permitirá saber exactamente el saldo por cobrar en cualquier momento.',
            '4. Exportar Cotización/Presupuesto Oficial: Descargue en PDF el estado de cuenta y presupuesto desglosado para entregarlo al cliente con el desglose exacto de su evento.'
          ]
        },
        {
          title: '5. Base de Invitados, RSVP, Mesas y Accesos QR',
          content: [
            'El módulo de Invitados y Accesos resuelve la logística de asistentes en la etapa de planificación y la recepción física en la puerta.',
            'Paso a Paso de Operaciones:',
            '1. Registrar la Lista de Invitados: Ingrese la lista en la sección "Invitados RSVP". Registre el nombre, RUT/RUT de contacto, fono, mesa y el estado RSVP ("Confirmado", "Pendiente" o "Declinado"). El sistema totaliza la cantidad de comensales garantizados.',
            '2. Asignar Mesas de Forma Interactiva: Vaya a la sección de "Distribución de Mesas". Cree mesas asignando el nombre o número y defina su capacidad máxima (ej. Mesa 1 - Capacidad 10). Luego, asigne invitados confirmados a la mesa seleccionándolos de la lista desplegable. Esto previene la sobrepoblación de mesas.',
            '3. Controlar Accesos el Día del Evento: En la pestaña "Accesos RSVP", el recepcionista usará el buscador predictivo escribiendo el nombre o RUT del invitado. Al encontrarlo, el sistema le mostrará qué mesa tiene asignada, permitirá marcar el botón "Registrar Ingreso" (Check-in) e ingresar cuántos acompañantes reales entraron con él, entregando estadísticas precisas de asistencia en tiempo real.'
          ]
        },
        {
          title: '6. Menú de Comidas y Requerimientos Especiales',
          content: [
            'La oferta gastronómica se diseña a medida del cliente desde la sección de Banquetería.',
            'Paso a Paso de Operaciones:',
            '1. Biblioteca Maestra de Platos: En "Menú de comidas", cree su catálogo general de platos. Categorícelos por Cóctel, Entradas, Platos de Fondo, Postres, Bebidas o Bar Abierto. Registre el nombre, descripción técnica de ingredientes y notas de preparación.',
            '2. Seleccionar el Menú del Evento: En la Ficha Técnica de su cliente activo, usted podrá activar de forma explícita qué platos específicos de su catálogo maestro conformarán el banquete de ese evento particular.',
            '3. Alergias Alimentarias: En la lista de invitados, registre si algún asistente tiene requerimientos nutricionales especiales (celíaco, vegetariano, vegano, alérgico a mariscos). El sistema asociará esta alerta de forma automática para la visualización del jefe de garzones.'
          ]
        },
        {
          title: '7. Control de Inventario Físico de Utensilios',
          content: [
            'Evite pérdidas de stock y quiebres de material con un catálogo digital del equipamiento de la agencia.',
            'Paso a Paso de Operaciones:',
            '1. Agregar Ítems de Bodega: En "Inventario Utensilios", registre platos, copas, mantelería, vajilla o mobiliario de su pertenencia.',
            '2. Control de Stock y Estado: Escriba el stock físico total disponible para arriendos e indique el estado de conservación de cada lote de activos ("Excelente", "Bueno", "En Reparación" o "De Baja"). Esto facilita planificar compras de reposición antes del inicio de la temporada alta de eventos.'
          ]
        },
        {
          title: '8. Historial de Eventos, Auditoría y Bitácora',
          content: [
            'Para resguardar la transparencia operativa de la empresa, el sistema cuenta con registros históricos e inmutables de seguridad.',
            'Paso a Paso de Operaciones:',
            '1. Bitácora de Auditoría Completa: En la sección baja de la pestaña de Configuración, podrá auditar los cambios operativos. Cada vez que un usuario elimine a un cliente, registre una cuota de pago, elimine a un usuario del sistema o realice cambios significativos, el sistema guardará el registro automático detallando fecha, hora, módulo e identidad del responsable de la modificación.',
            '2. Historial de Eventos Finalizados: En la pestaña "Historial de eventos", el sistema archiva de manera segura todas las fichas técnicas, presupuestos y minutas de eventos ya concluidos. Esto le permite consultar información histórica para replicar montajes exitosos en futuros proyectos.'
          ]
        },
        {
          title: '9. Configuración, Parámetros y Gestión del Personal',
          content: [
            'El módulo "Configuración" rige el comportamiento flexible de toda la plataforma.',
            'Paso a Paso de Operaciones:',
            '1. Actualizar Datos del Prestador: Registre la Razón Social de su empresa, RUT, Nombre del Representante Legal, Dirección comercial, Correo corporativo y Teléfono. Estos campos son obligatorios ya que completan dinámicamente las variables legales del borrador de contrato comercial.',
            '2. Personalización de Listas y Categorías: Adapte el sistema a las necesidades de su negocio. Puede agregar o eliminar tipos de eventos, categorías de finanzas, categorías de tareas, o estados de CRM en las listas de configuración rápida.',
            '3. Administrar el Personal del Sistema: Gestione de forma exhaustiva las credenciales de su equipo en la sección "Control de Usuarios". Registre nuevos coordinadores, supervisores o planificadores con su nombre, correo y contraseña de acceso inicial. También podrá usar el botón "Modificar" (ícono de lápiz) para cambiar claves, o el botón "Eliminar" (ícono de basurero) para revocar accesos de manera inmediata.'
          ]
        }
      ];

      chapters.forEach((chap) => {
        // Title space
        checkPageOverflow(15);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(79, 70, 229); // indigo-600
        doc.text(chap.title, margin, y);
        y += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(51, 65, 85); // slate-700

        chap.content.forEach((para) => {
          const lines = doc.splitTextToSize(para, contentWidth);
          const blockHeight = lines.length * 5;
          
          checkPageOverflow(blockHeight + 6);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85); // slate-700
          
          doc.text(lines, margin, y);
          y += blockHeight + 4;
        });

        y += 4; // space between chapters
      });

      // Save the PDF
      doc.save('Manual_de_Usuario_Mar_de_Rosas_CRM.pdf');
    } catch (error) {
      console.error('Error generating Manual PDF:', error);
      alert('Hubo un error al generar el Manual en PDF.');
    }
  };

  // Add Item Helpers
  const handleAddRelationStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus.trim()) return;
    const clean = newStatus.trim().toLowerCase();
    if (!relationStatuses.includes(clean)) {
      updateConfigList('relationStatuses', [...relationStatuses, clean]);
    }
    setNewStatus('');
  };

  const handleAddTimelineCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimelineCat.trim()) return;
    const clean = newTimelineCat.trim();
    if (!timelineCategories.includes(clean)) {
      updateConfigList('timelineCategories', [...timelineCategories, clean]);
    }
    setNewTimelineCat('');
  };

  const handleAddBudgetCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudgetCat.trim()) return;
    const clean = newBudgetCat.trim().toLowerCase();
    if (!budgetCategories.includes(clean)) {
      updateConfigList('budgetCategories', [...budgetCategories, clean]);
    }
    setNewBudgetCat('');
  };

  const handleAddInventoryCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInventoryCat.trim()) return;
    const clean = newInventoryCat.trim().toLowerCase();
    if (!inventoryCategories.includes(clean)) {
      updateConfigList('inventoryCategories', [...inventoryCategories, clean]);
    }
    setNewInventoryCat('');
  };

  const handleAddInventoryCond = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInventoryCond.trim()) return;
    const clean = newInventoryCond.trim().toLowerCase();
    if (!inventoryConditions.includes(clean)) {
      updateConfigList('inventoryConditions', [...inventoryConditions, clean]);
    }
    setNewInventoryCond('');
  };

  const handleAddEventType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventType.trim()) return;
    const clean = newEventType.trim().toLowerCase();
    if (!eventTypes.includes(clean)) {
      updateConfigList('eventTypes', [...eventTypes, clean]);
    }
    setNewEventType('');
  };

  // Delete Helpers (prevent empty and protect a default if needed, but allow full customization)
  const handleDeleteRelationStatus = (val: string) => {
    if (relationStatuses.length <= 1) return;
    updateConfigList('relationStatuses', relationStatuses.filter(x => x !== val));
  };

  const handleDeleteTimelineCat = (val: string) => {
    if (timelineCategories.length <= 1) return;
    updateConfigList('timelineCategories', timelineCategories.filter(x => x !== val));
  };

  const handleDeleteBudgetCat = (val: string) => {
    if (budgetCategories.length <= 1) return;
    updateConfigList('budgetCategories', budgetCategories.filter(x => x !== val));
  };

  const handleDeleteInventoryCat = (val: string) => {
    if (inventoryCategories.length <= 1) return;
    updateConfigList('inventoryCategories', inventoryCategories.filter(x => x !== val));
  };

  const handleDeleteInventoryCond = (val: string) => {
    if (inventoryConditions.length <= 1) return;
    updateConfigList('inventoryConditions', inventoryConditions.filter(x => x !== val));
  };

  const handleDeleteEventType = (val: string) => {
    if (eventTypes.length <= 1) return;
    updateConfigList('eventTypes', eventTypes.filter(x => x !== val));
  };

  return (
    <div id="configuration_module" className="space-y-6 animate-fade-in text-left">
      
      {/* Header and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Configuración del Sistema</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestione los parámetros generales de contratos, estados de relación, categorías y opciones de filtrado.
          </p>
        </div>
        
        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ¡Cambios guardados con éxito!
          </div>
        )}
      </div>

      {/* Grid Layout: Left Sidebar Navigation, Right Content Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="md:col-span-3 space-y-1 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-3xs">
          <button
            id="tab_provider_settings"
            onClick={() => setActiveTab('provider')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'provider' 
                ? 'bg-indigo-600 text-white font-bold shadow-xs' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Prestador de Servicios
          </button>
          
          <button
            id="tab_crm_settings"
            onClick={() => setActiveTab('crm')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'crm' 
                ? 'bg-indigo-600 text-white font-bold shadow-xs' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
            }`}
          >
            <Users className="w-4 h-4" />
            Estado de Relación
          </button>

          <button
            id="tab_timeline_settings"
            onClick={() => setActiveTab('timeline')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'timeline' 
                ? 'bg-indigo-600 text-white font-bold shadow-xs' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Categoría Cronograma
          </button>

          <button
            id="tab_budget_settings"
            onClick={() => setActiveTab('budget')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'budget' 
                ? 'bg-indigo-600 text-white font-bold shadow-xs' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
            }`}
          >
            <Coins className="w-4 h-4" />
            Categoría Presupuesto
          </button>

          <button
            id="tab_inventory_settings"
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'inventory' 
                ? 'bg-indigo-600 text-white font-bold shadow-xs' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
            }`}
          >
            <Package className="w-4 h-4" />
            Categoría e Inventario
          </button>

          <button
            id="tab_history_settings"
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'history' 
                ? 'bg-indigo-600 text-white font-bold shadow-xs' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
            }`}
          >
            <FileText className="w-4 h-4" />
            Tipos de Eventos
          </button>

          <button
            id="tab_manual_settings"
            onClick={() => setActiveTab('manual')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'manual' 
                ? 'bg-indigo-600 text-white font-bold shadow-xs' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Manual de Usuario
          </button>

          <button
            id="tab_database_settings"
            onClick={() => setActiveTab('database')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'database' 
                ? 'bg-indigo-600 text-white font-bold shadow-xs' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
            }`}
          >
            <Database className="w-4 h-4" />
            Base de Datos
          </button>

          <button
            id="tab_users_settings"
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'users' 
                ? 'bg-indigo-600 text-white font-bold shadow-xs' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
            }`}
          >
            <Users className="w-4 h-4" />
            Control de Usuarios
          </button>

          <button
            id="tab_bitacora_settings"
            onClick={() => setActiveTab('bitacora')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'bitacora' 
                ? 'bg-indigo-600 text-white font-bold shadow-xs' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
            }`}
          >
            <History className="w-4 h-4" />
            Bitácora de Cambios
          </button>
        </div>

        {/* Content Panel */}
        <div className="md:col-span-9 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-3xs">
          
          {/* TAB 1: SERVICE PROVIDER DATA */}
          {activeTab === 'provider' && (
            <div id="section_provider" className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-800">Prestador de Servicios para Contratos</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Establezca los datos legales del organizador. Estos valores poblarán el documento de contrato PDF autogenerado.
                </p>
              </div>

              <form onSubmit={handleSaveProvider} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre / Razón Social *</label>
                    <input
                      id="provider_name"
                      type="text"
                      value={providerForm.name}
                      onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">RUT Empresa *</label>
                    <input
                      id="provider_rut"
                      type="text"
                      value={providerForm.rut}
                      onChange={(e) => setProviderForm({ ...providerForm, rut: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Representante Legal *</label>
                    <input
                      id="provider_representative"
                      type="text"
                      value={providerForm.representative}
                      onChange={(e) => setProviderForm({ ...providerForm, representative: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">RUT Representante *</label>
                    <input
                      id="provider_rep_rut"
                      type="text"
                      value={providerForm.representativeRut}
                      onChange={(e) => setProviderForm({ ...providerForm, representativeRut: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Dirección Matriz *</label>
                  <input
                    id="provider_address"
                    type="text"
                    value={providerForm.address}
                    onChange={(e) => setProviderForm({ ...providerForm, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono Móvil / Oficina *</label>
                    <input
                      id="provider_phone"
                      type="text"
                      value={providerForm.phone}
                      onChange={(e) => setProviderForm({ ...providerForm, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Correo Electrónico *</label>
                    <input
                      id="provider_email"
                      type="email"
                      value={providerForm.email}
                      onChange={(e) => setProviderForm({ ...providerForm, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  id="btn_save_provider_info"
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Guardar Datos del Prestador
                </button>
              </form>

              {/* Tema Visual Section */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 mt-6 space-y-3">
                <div className="text-left">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-indigo-600" /> Tema Visual del Sistema
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Seleccione la apariencia preferida para la interfaz del sistema. Este cambio se guardará en la base de datos de Firestore y se aplicará a todos los dispositivos sincronizados.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    id="theme_light_btn"
                    type="button"
                    onClick={() => {
                      const updatedConfigs: AppConfigurations = {
                        ...configs,
                        theme: 'light'
                      };
                      updateState({ configurations: updatedConfigs });
                      addBitacoraEntry('Configuración', 'Se cambió el tema visual a Blanco / Claro.');
                      triggerSuccessMessage();
                    }}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      (configs.theme || 'light') === 'light'
                        ? 'bg-white border-indigo-600 text-indigo-600 shadow-sm'
                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Tema Claro (Blanco)</span>
                  </button>
                  
                  <button
                    id="theme_dark_btn"
                    type="button"
                    onClick={() => {
                      const updatedConfigs: AppConfigurations = {
                        ...configs,
                        theme: 'dark'
                      };
                      updateState({ configurations: updatedConfigs });
                      addBitacoraEntry('Configuración', 'Se cambió el tema visual a Oscuro / Negro.');
                      triggerSuccessMessage();
                    }}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      configs.theme === 'dark'
                        ? 'bg-white border-indigo-600 text-indigo-600 shadow-sm'
                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Tema Oscuro (Negro)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CRM STATUSES */}
          {activeTab === 'crm' && (
            <div id="section_crm" className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-800">Estados de la Relación (CRM)</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Personalice las opciones que aparecen al definir la etapa del cliente.
                </p>
              </div>

              {/* Add form */}
              <form onSubmit={handleAddRelationStatus} className="flex gap-2">
                <input
                  id="input_new_relation_status"
                  type="text"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  placeholder="Ej. En Negociación, Cerrado Perdido..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
                  required
                />
                <button
                  id="btn_add_relation_status"
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Añadir
                </button>
              </form>

              {/* List display */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Opciones de Estado Actuales</span>
                <div className="flex flex-wrap gap-2">
                  {relationStatuses.map((status) => {
                    const isDefault = defaultRelationStatuses.includes(status);
                    return (
                      <div 
                        key={status} 
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs text-slate-700 shadow-3xs"
                      >
                        <span className="capitalize font-medium">{status}</span>
                        {isDefault && (
                          <span className="text-[8px] bg-slate-100 text-slate-400 font-bold px-1 rounded-sm uppercase">Fijo</span>
                        )}
                        {!isDefault && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRelationStatus(status)}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-0.5"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TIMELINE CATEGORIES */}
          {activeTab === 'timeline' && (
            <div id="section_timeline" className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-800">Categorías de Tareas del Cronograma</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Administre las etiquetas usadas para clasificar tareas en el checklist e hitos.
                </p>
              </div>

              {/* Add form */}
              <form onSubmit={handleAddTimelineCat} className="flex gap-2">
                <input
                  id="input_new_timeline_category"
                  type="text"
                  value={newTimelineCat}
                  onChange={(e) => setNewTimelineCat(e.target.value)}
                  placeholder="Ej. Catering, Regalos, Traslados..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
                  required
                />
                <button
                  id="btn_add_timeline_category"
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Añadir
                </button>
              </form>

              {/* List display */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Categorías de Checklist Disponibles</span>
                <div className="flex flex-wrap gap-2">
                  {timelineCategories.map((cat) => {
                    const isDefault = defaultTimelineCategories.includes(cat);
                    return (
                      <div 
                        key={cat} 
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs text-slate-700 shadow-3xs"
                      >
                        <span className="font-semibold">{cat}</span>
                        {isDefault && (
                          <span className="text-[8px] bg-slate-100 text-slate-400 font-bold px-1 rounded-sm uppercase">Fijo</span>
                        )}
                        {!isDefault && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTimelineCat(cat)}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-0.5"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BUDGET CATEGORIES */}
          {activeTab === 'budget' && (
            <div id="section_budget" className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-800">Categorías de Gastos y Presupuestos</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Añada o elimine las categorías que estructuran la tabla de costos e impuestos del evento.
                </p>
              </div>

              {/* Add form */}
              <form onSubmit={handleAddBudgetCat} className="flex gap-2">
                <input
                  id="input_new_budget_category"
                  type="text"
                  value={newBudgetCat}
                  onChange={(e) => setNewBudgetCat(e.target.value)}
                  placeholder="Ej. recuerdos, vestuario, imprenta..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
                  required
                />
                <button
                  id="btn_add_budget_category"
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Añadir
                </button>
              </form>

              {/* List display */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Categorías de Costos Activas</span>
                <div className="flex flex-wrap gap-2">
                  {budgetCategories.map((cat) => {
                    const isDefault = defaultBudgetCategories.includes(cat);
                    const label = cat === 'lugar' ? 'Lugar / Finca' 
                                : cat === 'catering' ? 'Catering / Bebidas'
                                : cat === 'decoracion' ? 'Decoración / Flores'
                                : cat === 'musica_sonido' ? 'Música & Sonido'
                                : cat === 'fotografia' ? 'Foto & Video'
                                : cat === 'personal' ? 'Staff / Seguridad'
                                : cat === 'otros' ? 'Papelería / Otros'
                                : cat;
                    return (
                      <div 
                        key={cat} 
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs text-slate-700 shadow-3xs"
                      >
                        <span className="capitalize font-semibold">{label}</span>
                        {isDefault && (
                          <span className="text-[8px] bg-slate-100 text-slate-400 font-bold px-1 rounded-sm uppercase">Fijo</span>
                        )}
                        {!isDefault && (
                          <button
                            type="button"
                            onClick={() => handleDeleteBudgetCat(cat)}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-0.5"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: INVENTORY CONFIGS */}
          {activeTab === 'inventory' && (
            <div id="section_inventory" className="space-y-6">
              
              {/* Category list */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-800">Categorías de Utensilios de Inventario</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Modifique las categorías para inventariar y clasificar mantelería, vajilla, etc.
                  </p>
                </div>

                <form onSubmit={handleAddInventoryCat} className="flex gap-2">
                  <input
                    id="input_new_inventory_category"
                    type="text"
                    value={newInventoryCat}
                    onChange={(e) => setNewInventoryCat(e.target.value)}
                    placeholder="Ej. cristalería, barras móviles, carpas..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
                    required
                  />
                  <button
                    id="btn_add_inventory_category"
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Añadir
                  </button>
                </form>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {inventoryCategories.map((cat) => {
                      const isDefault = defaultInventoryCategories.includes(cat);
                      const label = cat === 'mesas' ? 'Mesas'
                                  : cat === 'sillas' ? 'Sillas'
                                  : cat === 'manteleria' ? 'Mantelería'
                                  : cat === 'arreglos' ? 'Arreglos Florales'
                                  : cat === 'vajilla' ? 'Vajilla & Cuchillería'
                                  : cat === 'otros' ? 'Otros Utensilios'
                                  : cat;
                      return (
                        <div 
                          key={cat} 
                          className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs text-slate-700 shadow-3xs"
                        >
                          <span className="capitalize font-semibold">{label}</span>
                          {isDefault && (
                            <span className="text-[8px] bg-slate-100 text-slate-400 font-bold px-1 rounded-sm uppercase">Fijo</span>
                          )}
                          {!isDefault && (
                            <button
                              type="button"
                              onClick={() => handleDeleteInventoryCat(cat)}
                              className="text-slate-400 hover:text-rose-500 transition-colors p-0.5"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Conditions / Status list */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Estados / Condiciones del Inventario</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Defina los estados de conservación y mantenimiento para los utensilios de cocina o montaje.
                  </p>
                </div>

                <form onSubmit={handleAddInventoryCond} className="flex gap-2">
                  <input
                    id="input_new_inventory_condition"
                    type="text"
                    value={newInventoryCond}
                    onChange={(e) => setNewInventoryCond(e.target.value)}
                    placeholder="Ej. manchado, roto, reponer..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
                    required
                  />
                  <button
                    id="btn_add_inventory_condition"
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Añadir
                  </button>
                </form>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {inventoryConditions.map((cond) => {
                      const isDefault = defaultInventoryConditions.includes(cond);
                      const label = cond === 'excelente' ? 'Excelente'
                                  : cond === 'bueno' ? 'Bueno'
                                  : cond === 'mantenimiento' ? 'En Mantención'
                                  : cond === 'debaja' ? 'De Baja'
                                  : cond;
                      return (
                        <div 
                          key={cond} 
                          className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs text-slate-700 shadow-3xs"
                        >
                          <span className="capitalize font-semibold">{label}</span>
                          {isDefault && (
                            <span className="text-[8px] bg-slate-100 text-slate-400 font-bold px-1 rounded-sm uppercase">Fijo</span>
                          )}
                          {!isDefault && (
                            <button
                              type="button"
                              onClick={() => handleDeleteInventoryCond(cond)}
                              className="text-slate-400 hover:text-rose-500 transition-colors p-0.5"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: EVENT TYPES */}
          {activeTab === 'history' && (
            <div id="section_history" className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-800">Tipos de Eventos</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Configure los tipos de eventos disponibles (Boda, Corporativo, etc.) que estructuran los filtros principales e ingresan al CRM.
                </p>
              </div>

              {/* Add form */}
              <form onSubmit={handleAddEventType} className="flex gap-2">
                <input
                  id="input_new_event_type"
                  type="text"
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value)}
                  placeholder="Ej. Graduación, Aniversario, Fiesta de Gala..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-all"
                  required
                />
                <button
                  id="btn_add_event_type"
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Añadir
                </button>
              </form>

              {/* List display */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Tipos de Eventos Activos</span>
                <div className="flex flex-wrap gap-2">
                  {eventTypes.map((type) => {
                    const isDefault = defaultEventTypes.includes(type);
                    const label = type === 'boda' ? 'Boda'
                                : type === 'corporativo' ? 'Corporativo'
                                : type === 'cumpleanos' ? 'Cumpleaños'
                                : type === 'otro' ? 'Otro'
                                : type;
                    return (
                      <div 
                        key={type} 
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs text-slate-700 shadow-3xs"
                      >
                        <span className="capitalize font-semibold">{label}</span>
                        {isDefault && (
                          <span className="text-[8px] bg-slate-100 text-slate-400 font-bold px-1 rounded-sm uppercase">Fijo</span>
                        )}
                        {!isDefault && (
                          <button
                            type="button"
                            onClick={() => handleDeleteEventType(type)}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-0.5"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: USER MANUAL */}
          {activeTab === 'manual' && (
            <div id="section_manual" className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Manual de Usuario de Mar de Rosas CRM</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Consulte o descargue la guía completa de uso, administración y operación de la plataforma.
                  </p>
                </div>
                <button
                  id="btn_download_manual"
                  onClick={generateManualPDF}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-sm shrink-0 font-bold"
                >
                  <Download className="w-4 h-4" />
                  Descargar Manual en PDF
                </button>
              </div>

              {/* Quick Visual Guide Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-150 bg-slate-50/50 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
                    <span className="w-5 h-5 rounded-md bg-indigo-50 flex items-center justify-center text-[10px]">1</span>
                    Acceso e Inicio de Sesión
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Ingrese de forma segura usando sus credenciales de Gmail o Correo/Contraseña provistas. Una vez autenticado, visualizará estadísticas clave sobre eventos activos en tiempo real.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-150 bg-slate-50/50 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
                    <span className="w-5 h-5 rounded-md bg-indigo-50 flex items-center justify-center text-[10px]">2</span>
                    Fichas de Clientes y Contratos
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Cree y edite fichas detalladas de clientes. Puede exportar borradores de contratos y fichas técnicas unificadas a PDF en formato ultra-ahorrativo de tinta para su impresión física.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-150 bg-slate-50/50 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
                    <span className="w-5 h-5 rounded-md bg-indigo-50 flex items-center justify-center text-[10px]">3</span>
                    Finanzas y Presupuesto
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Defina estimaciones versus costos reales para cada área comercial. Registre cobros parcelados mediante cuotas y cambie su estado de pago con un solo click.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-150 bg-slate-50/50 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
                    <span className="w-5 h-5 rounded-md bg-indigo-50 flex items-center justify-center text-[10px]">4</span>
                    Asistentes, Accesos y Mesas
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Realice RSVP de invitados. Configure accesos en portería mediante búsqueda interactiva y asigne visualmente las posiciones de mesa de cada asistente confirmado.
                  </p>
                </div>
              </div>

              {/* Helpful reminder */}
              <div className="p-4 bg-amber-50 border border-amber-150 rounded-xl flex gap-3 text-left">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-amber-800 block">Sugerencia de Impresión Ecológica</span>
                  <p className="text-[11px] text-amber-700/90 mt-0.5 leading-relaxed">
                    Este documento en PDF se ha diseñado bajo estrictas políticas de ahorro de tinta: no contiene bloques sólidos de fondos oscuros ni imágenes pesadas. Para mayor ahorro, se recomienda su impresión en modo escala de grises y doble cara.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 8: DATABASE / MAINTENANCE */}
          {activeTab === 'database' && (
            <div id="section_database" className="space-y-6 animate-fade-in text-left">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-800">Administración y Mantenimiento de Datos</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Realice operaciones avanzadas de mantenimiento sobre el almacenamiento local del sistema.
                </p>
              </div>

              {seedSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-semibold flex flex-col gap-1.5 animate-pulse">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="font-bold text-slate-800">¡Datos de Prueba Cargados Exitosamente!</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium pl-7">
                    Se han creado **15 eventos simulados** con toda la información requerida: platos seleccionados, inventario detallado, proveedores asociados, cuotas de pago estimadas/reales, listas de invitados con RSVP, mesas asignadas y boards de inspiración. ¡Ya puedes explorar todo el sistema!
                  </p>
                </div>
              )}

              {/* Seeding Card */}
              <div className="p-5 border border-indigo-100 bg-indigo-50/20 rounded-2xl space-y-4">
                <div className="flex gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-indigo-900">Simulación / Cargar Datos de Prueba de Ejemplo</h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Esta acción poblará la base de datos con **15 eventos ficticios realistas** distribuidos equitativamente entre estados **Pendiente (Propuesta)**, **Confirmado (Activo)** y **Finalizado (Completado)**. 
                      Cada evento incluye un desglose completo de platos del menú gourmet, ítems de vajilla/mobiliario asignados del inventario, servicios contratados de proveedores, plazos y estados de cuotas de pago, listas con RSVP de invitados y sus asignaciones de mesa físicas interactivos.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-start pl-13">
                  <button
                    id="btn_load_seed_data"
                    type="button"
                    onClick={() => {
                      const demoData = generateDemoData();
                      updateState(demoData);
                      addBitacoraEntry('Configuración', 'Se cargaron 15 eventos de prueba simulados con todos sus módulos.');
                      setSeedSuccess(true);
                      setTimeout(() => setSeedSuccess(false), 8000);
                    }}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-indigo-100 font-bold"
                  >
                    <Plus className="w-4 h-4" />
                    Cargar 15 Eventos de Prueba (Ejemplo)
                  </button>
                </div>
              </div>

              <div className="p-5 border border-rose-100 bg-rose-50/40 rounded-2xl space-y-4">
                <div className="flex gap-3">
                  <div className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-rose-900">Restablecer / Vaciar Base de Datos</h3>
                    <p className="text-[11px] text-rose-700/80 mt-1 leading-relaxed">
                      Esta acción eliminará de forma irreversible todos los registros de clientes, cotizaciones, cronogramas, listas de invitados, finanzas, configuraciones de menú e inventario. Se restablecerán los valores por defecto del sistema para permitirle comenzar la planificación de eventos desde cero.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-start pl-13">
                  <button
                    id="btn_reset_database_config"
                    type="button"
                    onClick={() => {
                      if (onResetDatabase) {
                        onResetDatabase();
                      } else {
                        alert("Función no disponible temporalmente.");
                      }
                    }}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-rose-100"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Vaciar Base de Datos
                  </button>
                </div>
              </div>

              {/* Informative tips about localStorage */}
              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-slate-400" />
                  Información de Almacenamiento Local
                </h4>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 leading-normal pl-1">
                  <li>Los datos se guardan de forma segura e instantánea en el navegador web de su computador personal.</li>
                  <li>Limpiar la caché de navegación del explorador o formatear su equipo podría eliminar los datos locales si no realiza respaldos periódicos.</li>
                  <li>Utilice las opciones de respaldo en el menú de cada sección para asegurar la continuidad de su información.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 9: REGISTER AND MANAGE SYSTEM USERS */}
          {activeTab === 'users' && (
            <div id="section_users" className="space-y-6 animate-fade-in text-left">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-800">Control de Usuarios del Sistema</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Registre o modifique los usuarios, organizadores, coordinadores o supervisores para acceder al sistema con credenciales personalizadas.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form to Register/Modify User */}
                <form onSubmit={handleFormSubmitUser} className="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                    <UserPlus className="w-4 h-4 text-indigo-500" />
                    {editingUserUid ? 'Modificar Usuario' : 'Registrar Nuevo Usuario'}
                  </h3>

                  {userError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold flex gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{userError}</span>
                    </div>
                  )}

                  {userSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-semibold flex gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{userSuccess}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nombre Completo *</label>
                      <input
                        type="text"
                        value={userDisplayName}
                        onChange={(e) => setUserDisplayName(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        className="w-full text-xs px-3 py-2 border border-slate-250 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Correo Electrónico *</label>
                      <input
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full text-xs px-3 py-2 border border-slate-250 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Contraseña de Ingreso {editingUserUid ? '(Opcional)' : '*'}
                      </label>
                      <input
                        type="password"
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        placeholder={editingUserUid ? "Dejar vacío para mantener actual" : "Mínimo 6 caracteres"}
                        className="w-full text-xs px-3 py-2 border border-slate-250 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                        required={!editingUserUid}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">RUT (Opcional)</label>
                        <input
                          type="text"
                          value={userRut}
                          onChange={(e) => setUserRut(e.target.value)}
                          placeholder="12.345.678-9"
                          className="w-full text-xs px-3 py-2 border border-slate-250 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Teléfono (Opcional)</label>
                        <input
                          type="text"
                          value={userPhone}
                          onChange={(e) => setUserPhone(e.target.value)}
                          placeholder="+56 9 ..."
                          className="w-full text-xs px-3 py-2 border border-slate-250 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Rol / Permiso</label>
                      <select
                        value={userRole}
                        onChange={(e) => setUserRoleState(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-250 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-medium cursor-pointer"
                      >
                        <option value="Planificador">Planificador (Acceso Completo)</option>
                        <option value="Coordinador">Coordinador (Solo Lectura y Eventos)</option>
                        <option value="Supervisor">Supervisor de Campo</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {editingUserUid && (
                      <button
                        type="button"
                        onClick={handleCancelEditUser}
                        className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-indigo-100"
                    >
                      {editingUserUid ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      {editingUserUid ? 'Guardar Cambios' : 'Registrar Usuario'}
                    </button>
                  </div>
                </form>

                {/* List of Registered Users */}
                <div className="lg:col-span-7 space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-400" />
                    Usuarios Registrados en el Sistema ({usersList.length})
                  </h3>

                  <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-150">
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Usuario</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contacto</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rol</th>
                            <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {usersList.map((usr) => (
                            <tr key={usr.uid} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center uppercase shrink-0">
                                    {(usr.displayName || usr.email || 'U')[0]}
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-slate-700 block leading-tight">{usr.displayName}</span>
                                    {usr.rut && <span className="text-[10px] text-slate-400 font-medium block mt-0.5">RUT: {usr.rut}</span>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs text-slate-600 font-medium block leading-tight">{usr.email}</span>
                                {usr.phone && <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{usr.phone}</span>}
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  <Shield className="w-2.5 h-2.5" />
                                  {usr.role || 'Planificador'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditUser(usr)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    editingUserUid === usr.uid
                                      ? 'bg-indigo-50 text-indigo-600'
                                      : 'hover:bg-indigo-50 text-slate-400 hover:text-indigo-600'
                                  }`}
                                  title="Modificar Usuario"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(usr.uid)}
                                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                  title="Eliminar Usuario"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: AUDIT BITACORA (CHANGELOG) */}
          {activeTab === 'bitacora' && (
            <div id="section_bitacora" className="space-y-6 animate-fade-in text-left">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-800">Bitácora de Sucesos y Cambios</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Registro histórico y en tiempo real de todas las acciones, altas, modificaciones y accesos de usuarios en el sistema.
                </p>
              </div>

              {/* Filters / Search Row */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="w-full sm:w-1/2">
                  <input
                    type="text"
                    value={bitacoraSearch}
                    onChange={(e) => setBitacoraSearch(e.target.value)}
                    placeholder="Buscar por suceso, usuario o correo..."
                    className="w-full text-xs px-3 py-2.5 border border-slate-250 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                  />
                </div>
                <div className="w-full sm:w-auto flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Filtrar por Módulo:</span>
                  <select
                    value={bitacoraFilterModule}
                    onChange={(e) => setBitacoraFilterModule(e.target.value)}
                    className="text-xs px-3 py-2 border border-slate-250 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-medium cursor-pointer"
                  >
                    <option value="all">Todos los Módulos</option>
                    <option value="Sesión">Sesión / Accesos</option>
                    <option value="Clientes">Clientes / CRM</option>
                    <option value="Cronograma">Cronograma</option>
                    <option value="Presupuesto">Presupuesto</option>
                    <option value="Inventario">Inventario</option>
                    <option value="Configuración">Configuración</option>
                  </select>
                </div>
              </div>

              {/* Bitacora List */}
              <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150">
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/4">Fecha y Hora</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/5">Módulo</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/4">Usuario Responsable</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detalle del Suceso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {bitacoraList
                        .filter(item => {
                          const matchesSearch = 
                            item.action.toLowerCase().includes(bitacoraSearch.toLowerCase()) ||
                            item.userName.toLowerCase().includes(bitacoraSearch.toLowerCase()) ||
                            item.userEmail.toLowerCase().includes(bitacoraSearch.toLowerCase());
                          const matchesModule = 
                            bitacoraFilterModule === 'all' || 
                            item.module === bitacoraFilterModule;
                          return matchesSearch && matchesModule;
                        })
                        .slice(0, 100) // limit to top 100 on screen
                        .map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 text-slate-500">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-xs font-mono">{item.timestamp}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                item.module === 'Sesión' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                item.module === 'Configuración' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                item.module === 'Clientes' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {item.module}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="leading-tight">
                                <span className="text-xs font-bold text-slate-700 block">{item.userName}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">{item.userEmail}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-700 font-semibold">
                              {item.action}
                            </td>
                          </tr>
                        ))
                      }
                      {bitacoraList.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-400 font-bold">
                            No se han registrado sucesos aún en la bitácora.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modal de confirmación para eliminar usuario */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-fade-in text-left">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Eliminar Usuario</h3>
            </div>
            
            <p className="text-xs text-slate-650 leading-relaxed">
              ¿Está seguro de que desea eliminar a <strong>{userToDelete.displayName}</strong> ({userToDelete.email})? Esta acción es irreversible y el usuario ya no podrá acceder a la plataforma.
            </p>
            
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const updated = await deleteRegisteredUser(userToDelete.uid);
                    await addBitacoraEntry('Configuración', `Eliminación de usuario: ${userToDelete.displayName} (${userToDelete.email})`);
                    setUsersList(updated);
                    if (editingUserUid === userToDelete.uid) {
                      handleCancelEditUser();
                    }
                  } catch (err: any) {
                    alert(err.message || "Error al eliminar usuario.");
                  }
                  setUserToDelete(null);
                }}
                className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-lg shadow-rose-100"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
