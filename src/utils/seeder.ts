import { 
  Client, 
  ChecklistItem, 
  DayTimelineItem, 
  Protocol, 
  BudgetItem, 
  PaymentInstallment, 
  Vendor, 
  ServiceOrder, 
  Guest, 
  Table, 
  MoodImage, 
  FoodMenuItem, 
  InventoryItem, 
  EventState 
} from '../types';

// Real-world Chilean inspired mock data generator
export function generateDemoData(): Partial<EventState> {
  const clients: Client[] = [
    {
      id: 'demo_1',
      name: 'Sofía Larraín & Cristóbal Edwards',
      email: 'sofia.larrain@gmail.com',
      phone: '+56 9 8765 4321',
      company: 'Particular',
      eventType: 'boda',
      eventName: 'Boda Larraín & Edwards',
      eventDate: '2026-07-15',
      budgetLimit: 18000000,
      decorationDetail: 'Estilo rústico chic con follaje verde, luces de hadas y detalles de madera noble.',
      notes: 'Requiere atención especial en el menú vegano para 15 invitados. Los novios quieren abrir pista con vals tradicional.',
      status: 'activo',
      createdAt: '2026-05-10T10:30:00Z'
    },
    {
      id: 'demo_2',
      name: 'Camila Silva & Francisco Ossa',
      email: 'camila.silva@ossa.cl',
      phone: '+56 9 7654 3210',
      company: 'Particular',
      eventType: 'boda',
      eventName: 'Matrimonio Camila & Francisco',
      eventDate: '2026-10-10',
      budgetLimit: 22000000,
      decorationDetail: 'Sofisticado moderno, flores blancas (rosas y orquídeas), velas flotantes y espejos.',
      notes: 'Contratación de banda en vivo confirmada. Requiere mesa presidencial para 6 personas.',
      status: 'propuesta',
      createdAt: '2026-06-15T11:00:00Z'
    },
    {
      id: 'demo_3',
      name: 'Gala Anual Tech-Chile',
      email: 'rrhh@tech-chile.cl',
      phone: '+56 2 2345 6789',
      company: 'Tech-Chile S.A.',
      eventType: 'corporativo',
      eventName: 'Gala de Fin de Año Tech-Chile',
      eventDate: '2026-11-12',
      budgetLimit: 35000000,
      decorationDetail: 'Temática futurista, iluminación LED azul y magenta, pantallas gigantes y tótems de acreditación interactivos.',
      notes: 'Evento corporativo con 250 asistentes estimados. Requiere escenario de 6x4m y cabina de traducción simultánea.',
      status: 'propuesta',
      createdAt: '2026-07-01T09:15:00Z'
    },
    {
      id: 'demo_4',
      name: 'Graduación Colegio Saint George',
      email: 'saintgeorge.grad@colegio.cl',
      phone: '+56 9 5432 1098',
      company: 'Comisión de Padres IV Medio',
      eventType: 'otro',
      eventName: 'Cena de Gala IV Medio Saint George',
      eventDate: '2026-08-22',
      budgetLimit: 28000000,
      decorationDetail: 'Clásico elegante, mantelería azul marino, arreglos florales altos e iluminación cálida con guirnaldas.',
      notes: 'Menú especial de trasnoche con hamburguesas y papas fritas. Espacio para cabina fotográfica y pista de baile ampliada.',
      status: 'activo',
      createdAt: '2026-04-18T14:20:00Z'
    },
    {
      id: 'demo_5',
      name: 'Bodas de Oro Elena & Roberto',
      email: 'elena.roberto@gmail.com',
      phone: '+56 9 6543 2109',
      company: 'Particular',
      eventType: 'boda',
      eventName: 'Aniversario 50 Años Elena & Roberto',
      eventDate: '2026-08-01',
      budgetLimit: 12000000,
      decorationDetail: 'Vintage acogedor, flores silvestres amarillas y blancas, candelabros antiguos y recuerdos fotográficos históricos.',
      notes: 'Banquete para familiares cercanos (70 personas). Acceso prioritario para adultos mayores y rampa de acceso directo.',
      status: 'activo',
      createdAt: '2026-05-02T16:45:00Z'
    },
    {
      id: 'demo_6',
      name: 'Cumpleaños 50 de Mauricio',
      email: 'mauro.vargas50@outlook.cl',
      phone: '+56 9 9876 5432',
      company: 'Vargas & Asociados',
      eventType: 'cumpleanos',
      eventName: 'Celebración 50 Años Mauricio Vargas',
      eventDate: '2026-10-25',
      budgetLimit: 8500000,
      decorationDetail: 'Estilo Pub Lounge, sillones de cuero, barra de tragos iluminada y luces de discoteca sutiles.',
      notes: 'Banda tributo a los 80s contratada de 22:30 a 23:45. Estaciones de comida urbana y barra libre de destilados premium.',
      status: 'propuesta',
      createdAt: '2026-06-28T12:00:00Z'
    },
    {
      id: 'demo_7',
      name: 'Boda Antonia & Joaquín',
      email: 'antonia.joaquin@boda.cl',
      phone: '+56 9 8888 7777',
      company: 'Particular',
      eventType: 'boda',
      eventName: 'Matrimonio Antonia & Joaquín',
      eventDate: '2026-03-14',
      budgetLimit: 16500000,
      decorationDetail: 'Boho Chic en exterior, alfombras persas, arco floral asimétrico y guirnaldas micro-LED.',
      notes: '¡Realizado con total éxito! Gran recepción de los invitados al menú campestre chileno y barra de espumantes.',
      status: 'completado',
      createdAt: '2025-10-15T15:30:00Z'
    },
    {
      id: 'demo_8',
      name: 'Lanzamiento SUV Nova 2026',
      email: 'marketing@automotoresnova.cl',
      phone: '+56 2 3456 7890',
      company: 'Automotores Nova Chile',
      eventType: 'corporativo',
      eventName: 'Lanzamiento Oficial SUV Nova 2026',
      eventDate: '2026-05-18',
      budgetLimit: 40000000,
      decorationDetail: 'Industrial moderno, estructuras metálicas, luces robotizadas sincronizadas y humo bajo para develar el vehículo.',
      notes: '¡Gran evento completado! Asistieron 180 personas, incluyendo prensa automotriz e influencers nacionales.',
      status: 'completado',
      createdAt: '2026-01-20T08:30:00Z'
    },
    {
      id: 'demo_9',
      name: 'Matrimonio Valentina & Sebastián',
      email: 'vale.y.seba@matrimonios.cl',
      phone: '+56 9 7777 6666',
      company: 'Particular',
      eventType: 'boda',
      eventName: 'Boda Valentina & Sebastián',
      eventDate: '2026-04-25',
      budgetLimit: 20000000,
      decorationDetail: 'Estilo Viñedo Romántico, barricas de roble decorativas, corchos gigantes y arreglos en tonos burdeo y rosado pálido.',
      notes: '¡Realizado con éxito en Viña Casas del Bosque! Excelente maridaje de vinos y banquete gourmet destacado.',
      status: 'completado',
      createdAt: '2025-11-05T10:00:00Z'
    },
    {
      id: 'demo_10',
      name: 'Fiesta Fin de Año Constructora Alpha',
      email: 'alpha.rrhh@constructora.cl',
      phone: '+56 2 9876 5432',
      company: 'Constructora Alpha Ltda.',
      eventType: 'corporativo',
      eventName: 'Fiesta Anual de Colaboradores Alpha 2026',
      eventDate: '2026-12-18',
      budgetLimit: 45000000,
      decorationDetail: 'Veraniego caribeño, chozas con barra de tragos tropicales, camastros lounge e iluminación de antorchas artificiales.',
      notes: 'Pre-cotización aprobada preliminarmente. Estimado de 320 colaboradores con traslado en buses contratado.',
      status: 'propuesta',
      createdAt: '2026-07-05T17:50:00Z'
    },
    {
      id: 'demo_11',
      name: 'Boda Isidora & Martín',
      email: 'isidora.martin@matri.cl',
      phone: '+56 9 6666 5555',
      company: 'Particular',
      eventType: 'boda',
      eventName: 'Matrimonio Isidora & Martín',
      eventDate: '2026-09-20',
      budgetLimit: 19500000,
      decorationDetail: 'Estilo Clásico de Invierno/Primavera, flores de estación, candelabros dorados y detalles en azul cobalto.',
      notes: 'Requiere plan B techado por posibilidad de lluvia tardía. Orquesta contratada para amenizar la cena.',
      status: 'activo',
      createdAt: '2026-05-18T11:15:00Z'
    },
    {
      id: 'demo_12',
      name: 'Congreso de Medicina del Sur',
      email: 'congreso.sur@sociedadmedica.cl',
      phone: '+56 41 234 5678',
      company: 'Sociedad Médica de Chile',
      eventType: 'corporativo',
      eventName: 'III Congreso de Especialidades Médicas del Sur',
      eventDate: '2026-11-28',
      budgetLimit: 55000000,
      decorationDetail: 'Institucional formal, tótems informativos, stands de laboratorios farmacéuticos y credenciales impresas en lino ecológico.',
      notes: 'Seminario de 2 días de duración. Se coordina coffee break permanente y almuerzo buffet en carpa exterior climatizada.',
      status: 'propuesta',
      createdAt: '2026-06-30T10:45:00Z'
    },
    {
      id: 'demo_13',
      name: 'Boda Catalina & Diego',
      email: 'cata.y.diego@boda.cl',
      phone: '+56 9 5555 4444',
      company: 'Particular',
      eventType: 'boda',
      eventName: 'Matrimonio Catalina & Diego',
      eventDate: '2026-01-10',
      budgetLimit: 25000000,
      decorationDetail: 'Industrial Chic en galpón restaurado, ladrillo a la vista, lámparas colgantes Edison y abundante verde enredadera.',
      notes: '¡Completado con gran éxito! Excelentes comentarios sobre la barra de coctelería de autor y la banda bailable.',
      status: 'completado',
      createdAt: '2025-08-12T13:20:00Z'
    },
    {
      id: 'demo_14',
      name: 'Cumpleaños de 15 de Martina',
      email: 'mama.martina15@yahoo.cl',
      phone: '+56 9 4444 3333',
      company: 'Particular',
      eventType: 'cumpleanos',
      eventName: 'Fiesta de 15 Años de Martina',
      eventDate: '2026-02-15',
      budgetLimit: 14000000,
      decorationDetail: 'Temática Neon Pink & Silver, globos de helio cromados, túnel LED para el ingreso y pista de baile acrílica iluminada.',
      notes: '¡Realizado con éxito total! Coreografías de las amigas salieron perfectas y el buffet de postres neon fascinó a los jóvenes.',
      status: 'completado',
      createdAt: '2025-09-08T18:10:00Z'
    },
    {
      id: 'demo_15',
      name: 'Seminario Innovación Educativa',
      email: 'innovacion@fundacioneduca.cl',
      phone: '+56 2 8765 1234',
      company: 'Fundación Educa Chile',
      eventType: 'corporativo',
      eventName: 'Seminario Nacional de Tecnologías y Aprendizaje',
      eventDate: '2026-09-05',
      budgetLimit: 11000000,
      decorationDetail: 'Aesthetic minimalista, plantas de hojas grandes en macetas de cemento, asientos tipo puff ecológicos de cartón reciclado.',
      notes: 'Acreditado con éxito. Se planifican 5 workshops simultáneos en salones de apoyo con proyectores interactivos.',
      status: 'propuesta',
      createdAt: '2026-06-20T14:00:00Z'
    }
  ];

  // Helper arrays for checklist tasks
  const taskChecklistBase = [
    { title: 'Reunión de Definición de Estilo & Concepto', category: 'General' },
    { title: 'Firma de Contrato y Pago de Reserva', category: 'Contratos' },
    { title: 'Degustación Gastronómica y Elección de Menú', category: 'Catering' },
    { title: 'Contratación de Servicios de DJs e Iluminación', category: 'Proveedores' },
    { title: 'Confirmación Final de la Nómina de Invitados (RSVP)', category: 'Invitados' },
    { title: 'Revisión y Ajuste de Cronograma Minuto a Minuto', category: 'Logística' },
    { title: 'Recepción e Inspección de Proveedores y Montaje', category: 'Logística' },
    { title: 'Cierre del Evento, Desmontaje e Informe Financiero', category: 'General' }
  ];

  const checklist: {[clientId: string]: ChecklistItem[]} = {};
  const dayTimeline: {[clientId: string]: DayTimelineItem[]} = {};
  const protocols: {[clientId: string]: Protocol[]} = {};
  const budgetItems: {[clientId: string]: BudgetItem[]} = {};
  const installments: {[clientId: string]: PaymentInstallment[]} = {};
  const serviceOrders: {[clientId: string]: ServiceOrder[]} = {};
  const guests: {[clientId: string]: Guest[]} = {};
  const tables: {[clientId: string]: Table[]} = {};
  const moodImages: {[clientId: string]: MoodImage[]} = {};
  const foodMenu: {[clientId: string]: FoodMenuItem[]} = {};

  const commonGuestNames = [
    'Sebastián Piñera', 'Michelle Bachelet', 'Gabriel Boric', 'Eduardo Frei', 'Ricardo Lagos',
    'Jorge Alessandri', 'Arturo Prat', 'Bernardo O\'Higgins', 'Gabriela Mistral', 'Pablo Neruda',
    'Isabel Allende', 'Tomas Gonzalez', 'Claudio Bravo', 'Alexis Sanchez', 'Arturo Vidal',
    'Francisco Chaleco Lopez', 'Carolina de Moras', 'Tonka Tomicic', 'Mario Kreutzberger', 'Pedro Pascal',
    'Stefan Kramer', 'Felipe Camiroaga', 'Javiera Mena', 'Mon Laferte', 'Jorge Gonzalez',
    'Beto Cuevas', 'Francisca Valenzuela', 'Gepe', 'Paloma Mami', 'Cecilia Bolocco'
  ];

  // Create detail objects for each of the 15 clients
  clients.forEach((client, idx) => {
    const isCompleted = client.status === 'completado';
    const isActive = client.status === 'activo';
    
    // Checklist Seeding
    checklist[client.id] = taskChecklistBase.map((base, taskIdx) => ({
      id: `task_${client.id}_${taskIdx}`,
      category: base.category,
      title: base.title,
      dueDate: isCompleted 
        ? new Date(new Date(client.eventDate).getTime() - (30 - taskIdx * 3) * 24 * 3600 * 1000).toISOString().split('T')[0]
        : new Date(new Date(client.eventDate).getTime() - (15 - taskIdx * 2) * 24 * 3600 * 1000).toISOString().split('T')[0],
      completed: isCompleted ? true : (isActive ? taskIdx < 5 : taskIdx < 2),
      notes: `Asignado al supervisor de la cuenta ${client.name.split(' ')[0]}.`
    }));

    // Day Timeline Seeding
    dayTimeline[client.id] = [
      { id: `dt_${client.id}_1`, time: '09:00', title: 'Ingreso e Inspección de Proveedores', description: 'Coordinador recibe a banquetera, floristas y personal de montaje técnico.', responsible: 'Coordinador General', completed: isCompleted },
      { id: `dt_${client.id}_2`, time: '13:00', title: 'Finalización de Montaje de Mobiliario', description: 'Sillas, mesas, mantelería y vajilla deben quedar listos para check de calidad.', responsible: 'Supervisor de Montaje', completed: isCompleted },
      { id: `dt_${client.id}_3`, time: '15:30', title: 'Prueba de Sonido, Pantallas e Iluminación', description: 'Pruebas técnicas de micrófonos, efectos de luces y videos de apoyo.', responsible: 'DJ Principal & Técnico Sonido', completed: isCompleted },
      { id: `dt_${client.id}_4`, time: '18:00', title: 'Checklist de Detalle y Flores', description: 'Revisión final de centros de mesa, ambientación de accesos y velas.', responsible: 'Diseñador de Interiores', completed: isCompleted },
      { id: `dt_${client.id}_5`, time: '19:30', title: 'Llegada de Invitados y Coctel', description: 'Recepción con espumantes, pisco sour de autor y bocados fríos/calientes.', responsible: 'Staff de Recepción', completed: isCompleted },
      { id: `dt_${client.id}_6`, time: '21:00', title: 'Ingreso Protocolar y Cena Principal', description: 'Los anfitriones ingresan con música especial. Inicio del servicio del banquete.', responsible: 'Coordinador General', completed: isCompleted },
      { id: `dt_${client.id}_7`, time: '23:00', title: 'Apertura de Pista de Baile y Fiesta', description: 'Inicio del baile principal, barra libre habilitada y cotillón temático.', responsible: 'DJ Principal & Animador', completed: isCompleted },
      { id: `dt_${client.id}_8`, time: '03:30', title: 'Término del Evento y Retiro de Invitados', description: 'Cierre de barra, encendido de luces de salón y coordinación de transportes.', responsible: 'Staff de Seguridad', completed: isCompleted }
    ];

    // Protocols Seeding
    protocols[client.id] = [
      {
        id: `prot_${client.id}_1`,
        title: 'Entrada Protocolar al Salón Principal',
        description: 'Detalle de coordinación para el ingreso triunfal de los anfitriones.',
        members: [
          { id: `pm_${client.id}_1`, name: 'Claudio Garrido', role: 'Maestro de Ceremonia', notes: 'Dar la bienvenida con voz enérgica' },
          { id: `pm_${client.id}_2`, name: 'Andrea Torres', role: 'DJ de Apoyo', notes: 'Lanzar track n° 2 a volumen ascendente' }
        ],
        steps: [
          'Formar pasillo de honor con invitados de pie.',
          'Bajar luces principales de salón a un 20% y encender focos seguidores de color cálido.',
          'Presentación oficial por micrófono por parte del Maestro de Ceremonias.',
          'Apertura de puertas e ingreso triunfal bajo ráfaga sutil de chispas frías o confeti.',
          'Camino directo al centro de la pista para el brindis inicial.'
        ]
      },
      {
        id: `prot_${client.id}_2`,
        title: 'Corte de Pastel y Brindis de Honor',
        description: 'Protocolo de fotografía de la torta de novios e inicio del postre.',
        members: [
          { id: `pm_${client.id}_3`, name: 'Banquetero Jefe', role: 'Servicio de Torta', notes: 'Tener cuchillo largo decorado y copas listas' }
        ],
        steps: [
          'Interrumpir momentáneamente el baile y encender música instrumental suave.',
          'Posicionar a los anfitriones frente a la torta decorada.',
          'Sesión fotográfica guiada de 3 minutos enfocando el corte del primer trozo.',
          'Llenado de copas de champaña y discurso de agradecimiento breve (max 5 min).',
          'Retiro de la torta a cocina para porcionar y servir a los invitados.'
        ]
      }
    ];

    // Budgets Seeding
    const totalEst = Math.round(client.budgetLimit * 0.95);
    const totalAct = isCompleted ? totalEst + (idx % 2 === 0 ? 150000 : -100000) : (isActive ? Math.round(totalEst * 0.8) : 0);
    const totalPaid = isCompleted ? totalAct : (isActive ? Math.round(totalAct * 0.75) : 0);

    budgetItems[client.id] = [
      { id: `b_${client.id}_1`, category: 'lugar', name: 'Arriendo de Salón / Espacio de Evento', plannedCost: Math.round(totalEst * 0.25), actualCost: isCompleted ? Math.round(totalEst * 0.25) : Math.round(totalEst * 0.25), paidAmount: isCompleted ? Math.round(totalEst * 0.25) : Math.round(totalEst * 0.25 * 0.8), notes: 'Incluye suite de novios, seguridad y estacionamiento privado.' },
      { id: `b_${client.id}_2`, category: 'catering', name: 'Banquetería Premium de 3 Pasos', plannedCost: Math.round(totalEst * 0.40), actualCost: isCompleted ? Math.round(totalEst * 0.40) : Math.round(totalEst * 0.40), paidAmount: isCompleted ? Math.round(totalEst * 0.40) : Math.round(totalEst * 0.40 * 0.5), notes: 'Servicio completo para invitados, coctelería y estaciones de trasnoche.' },
      { id: `b_${client.id}_3`, category: 'decoracion', name: 'Decoración Integral, Flores y Candelabros', plannedCost: Math.round(totalEst * 0.15), actualCost: isCompleted ? Math.round(totalEst * 0.15 + 50000) : Math.round(totalEst * 0.15), paidAmount: isCompleted ? Math.round(totalEst * 0.15 + 50000) : Math.round(totalEst * 0.15 * 0.5), notes: 'Arreglos de altura, centros de mesa y luces de hadas colgantes.' },
      { id: `b_${client.id}_4`, category: 'musica_sonido', name: 'Música, DJ en Vivo, Sonido e Iluminación Robotizada', plannedCost: Math.round(totalEst * 0.12), actualCost: isCompleted ? Math.round(totalEst * 0.12) : Math.round(totalEst * 0.12), paidAmount: isCompleted ? Math.round(totalEst * 0.12) : Math.round(totalEst * 0.12), notes: 'Incluye sistema de amplificación line array y pantalla LED gigante.' },
      { id: `b_${client.id}_5`, category: 'fotografia', name: 'Fotografía Profesional y Video Documental', plannedCost: Math.round(totalEst * 0.08), actualCost: isCompleted ? Math.round(totalEst * 0.08) : Math.round(totalEst * 0.08), paidAmount: isCompleted ? Math.round(totalEst * 0.08) : 0, notes: 'Entrega en pendrive de madera grabado e impresión de álbum de cuero.' }
    ];

    // Installments Seeding
    installments[client.id] = [
      {
        id: `inst_${client.id}_1`,
        dueDate: new Date(new Date(client.eventDate).getTime() - 60 * 24 * 3600 * 1000).toISOString().split('T')[0],
        amount: Math.round(totalEst * 0.4),
        status: isCompleted || isActive ? 'pagado' : 'pendiente',
        datePaid: isCompleted || isActive ? new Date(new Date(client.eventDate).getTime() - 58 * 24 * 3600 * 1000).toISOString().split('T')[0] : undefined,
        reference: 'TRANSF-48293-ITAU'
      },
      {
        id: `inst_${client.id}_2`,
        dueDate: new Date(new Date(client.eventDate).getTime() - 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
        amount: Math.round(totalEst * 0.4),
        status: isCompleted ? 'pagado' : (isActive ? (idx % 2 === 0 ? 'pagado' : 'pendiente') : 'pendiente'),
        datePaid: isCompleted ? new Date(new Date(client.eventDate).getTime() - 14 * 24 * 3600 * 1000).toISOString().split('T')[0] : (isActive && idx % 2 === 0 ? new Date().toISOString().split('T')[0] : undefined),
        reference: isCompleted || (isActive && idx % 2 === 0) ? 'TRANSF-90342-BCI' : undefined
      },
      {
        id: `inst_${client.id}_3`,
        dueDate: new Date(new Date(client.eventDate).getTime() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
        amount: Math.round(totalEst * 0.2),
        status: isCompleted ? 'pagado' : 'pendiente',
        datePaid: isCompleted ? new Date(new Date(client.eventDate).getTime() + 4 * 24 * 3600 * 1000).toISOString().split('T')[0] : undefined,
        reference: isCompleted ? 'TRANSF-11492-SANTANDER' : undefined
      }
    ];

    // Tables Seeding
    tables[client.id] = [
      { id: `t_${client.id}_1`, name: 'Mesa Presidencial', capacity: 6, shape: 'circle', x: 50, y: 30 },
      { id: `t_${client.id}_2`, name: 'Mesa Familia Novio', capacity: 10, shape: 'circle', x: 30, y: 60 },
      { id: `t_${client.id}_3`, name: 'Mesa Familia Novia', capacity: 10, shape: 'circle', x: 70, y: 60 },
      { id: `t_${client.id}_4`, name: 'Mesa Amigos Colegio', capacity: 10, shape: 'square', x: 50, y: 80 }
    ];

    // Guests Seeding
    const numGuests = 10 + (idx % 4);
    guests[client.id] = [];
    for (let gIdx = 0; gIdx < numGuests; gIdx++) {
      const gName = commonGuestNames[(idx * 2 + gIdx) % commonGuestNames.length] + ' ' + (gIdx % 2 === 0 ? 'Edwards' : 'Larraín');
      const tableAssign = gIdx < 4 ? `t_${client.id}_1` : (gIdx < 8 ? `t_${client.id}_2` : (gIdx < 11 ? `t_${client.id}_3` : `t_${client.id}_4`));
      
      let rsvpVal: 'confirmado' | 'pendiente' | 'declinado' = 'pendiente';
      if (isCompleted) {
        rsvpVal = gIdx === numGuests - 1 ? 'declinado' : 'confirmado';
      } else if (isActive) {
        rsvpVal = gIdx < 7 ? 'confirmado' : (gIdx === numGuests - 1 ? 'declinado' : 'pendiente');
      } else {
        rsvpVal = gIdx < 3 ? 'confirmado' : 'pendiente';
      }

      guests[client.id].push({
        id: `guest_${client.id}_${gIdx}`,
        name: gName,
        email: `${gName.toLowerCase().replace(/ /g, '.')}@gmail.com`,
        phone: `+56 9 ${80000000 + idx * 100000 + gIdx * 1234}`,
        tableId: rsvpVal === 'confirmado' ? tableAssign : null,
        rsvp: rsvpVal,
        companionCount: gIdx % 3 === 0 ? 1 : 0,
        checkedIn: isCompleted ? (rsvpVal === 'confirmado' ? (gIdx !== 5) : false) : false,
        checkedInTime: isCompleted && rsvpVal === 'confirmado' && gIdx !== 5 
          ? `${client.eventDate}T20:${15 + gIdx}:00` 
          : undefined
      });
    }

    // Moodboard Images Seeding
    moodImages[client.id] = [
      { id: `mood_${client.id}_1`, title: 'Flores y Follaje', category: 'Decoración', imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=400' },
      { id: `mood_${client.id}_2`, title: 'Iluminación Cálida', category: 'Ambiente', imageUrl: 'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=400' },
      { id: `mood_${client.id}_3`, title: 'Vajilla y Mesa', category: 'Montaje', imageUrl: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=400' }
    ];

    // Food Menu Seeding
    foodMenu[client.id] = [
      {
        id: `menu_${client.id}_1`,
        name: 'Coctel Mar de Rosas',
        category: 'coctel',
        description: 'Bocados fríos de salmón ahumado con queso eneldo, mini empanaditas de carne mechada, y camarones crocantes en panko con salsa agridulce.',
        ingredients: 'Salmón chileno, eneldo, camarón nacional, panko, carne mechada de res.',
        allergens: 'Gluten, mariscos, lácteos.',
        estimatedCost: 12000,
        quantity: numGuests + 10,
        notes: 'Servido con pisco sour premium de limón de pica y espumante brut.'
      },
      {
        id: `menu_${client.id}_2`,
        name: 'Filete de Res en Salsa de Syrah',
        category: 'plato_principal',
        description: 'Tierno filete de res al horno cubierto con salsa reducida de vino Syrah, acompañado de puré de papas trufado y espárragos grillados.',
        ingredients: 'Filete de res, vino Syrah, papas seleccionadas, aceite de trufa blanca, espárragos frescos.',
        allergens: 'Lácteos, sulfitos.',
        estimatedCost: 24000,
        quantity: numGuests,
        notes: 'Punto de cocción preferido: a punto (tres cuartos).'
      },
      {
        id: `menu_${client.id}_3`,
        name: 'Trilogía de Postres Chilenos',
        category: 'postre',
        description: 'Mini porción de suspiro limeño con oporto, bocado de volcán de chocolate belga fundido, y helado artesanal de vainilla sureña.',
        ingredients: 'Leche evaporada, yemas de huevo, chocolate belga, vainilla natural.',
        allergens: 'Lácteos, huevo, gluten.',
        estimatedCost: 8000,
        quantity: numGuests,
        notes: 'Montado en plato de gres negro con flores comestibles.'
      }
    ];

    // Service Orders Seeding for Vendors
    serviceOrders[client.id] = [
      {
        id: `so_${client.id}_1`,
        vendorId: 'v_1',
        vendorName: 'Sabores de Chile Banquetería',
        vendorEmail: 'banquetes@saboresdechile.cl',
        items: ['Servicio de Coctelería para 120 personas', 'Cena de 3 Tiempos', 'Barra Libre Estándar de 6 horas'],
        setupTime: '10:00',
        eventTime: '19:30',
        teardownTime: '04:00',
        notes: 'Banquetería exclusiva. Traer mantelería de repuesto y vajilla extra por roturas.',
        status: isCompleted ? 'aceptado' : 'enviado',
        sentAt: '2026-06-10T12:00:00Z'
      }
    ];
  });

  // Master Vendors (Vendors are shared globally in EventState)
  const vendors: Vendor[] = [
    { id: 'v_1', category: 'catering', name: 'Sabores de Chile Banquetería', contactName: 'Marta Rodriguez', phone: '+56 9 1234 1111', email: 'banquetes@saboresdechile.cl', rating: 4.8, status: 'contratado', basePrice: 25000, notes: 'Excelente calidad gastronómica y servicio de garzones muy puntual.' },
    { id: 'v_2', category: 'decoracion', name: 'DecoFlor Diseños Florales', contactName: 'Sofía Valdés', phone: '+56 9 2345 2222', email: 'contacto@decoflor.cl', rating: 4.9, status: 'contratado', basePrice: 1500000, notes: 'Se especializa en arcos florales de rosas y arreglos suspendidos.' },
    { id: 'v_3', category: 'musica_sonido', name: 'Aura Iluminación & Sonido', contactName: 'Andrés Vera', phone: '+56 9 3456 3333', email: 'eventos@aurasonido.cl', rating: 4.7, status: 'contratado', basePrice: 1200000, notes: 'Equipamiento de alta fidelidad, excelente manejo de pistas y sincronización.' },
    { id: 'v_4', category: 'fotografia', name: 'Lente Eterno Productora', contactName: 'Joaquín Donoso', phone: '+56 9 4567 4444', email: 'contacto@lenteeterno.cl', rating: 4.9, status: 'disponible', basePrice: 850000, notes: 'Fotografía documental e iluminación espontánea espectacular.' },
    { id: 'v_5', category: 'lugar', name: 'Casona Doña Inés de Pirque', contactName: 'Inés Larraín', phone: '+56 9 5678 5555', email: 'arriendos@casonadonaines.cl', rating: 4.6, status: 'disponible', basePrice: 3500000, notes: 'Hermosos jardines centenarios y salón con vigas de madera noble.' }
  ];

  // Master Inventory
  const inventory: InventoryItem[] = [
    { id: 'inv_1', name: 'Silla Tiffany Dorada', category: 'sillas', quantity: 300, availableQuantity: 180, condition: 'excelente', location: 'Bodega Principal A', unitCost: 3500, notes: 'Silla de resina dorada de alta resistencia.' },
    { id: 'inv_2', name: 'Silla Crossback de Madera Rústica', category: 'sillas', quantity: 200, availableQuantity: 150, condition: 'excelente', location: 'Bodega Principal B', unitCost: 4500, notes: 'Estilo clásico rústico para eventos campestres.' },
    { id: 'inv_3', name: 'Mesa Redonda 10 personas', category: 'mesas', quantity: 30, availableQuantity: 24, condition: 'bueno', location: 'Bodega Lateral', unitCost: 15000, notes: 'Estructura plegable reforzada.' },
    { id: 'inv_4', name: 'Copa Cristal de Agua Tallada', category: 'vajilla', quantity: 500, availableQuantity: 420, condition: 'excelente', location: 'Cajones Almacén C', unitCost: 1200, notes: 'Copa labrada de estilo señorial.' },
    { id: 'inv_5', name: 'Plato Base de Plata Pulida', category: 'vajilla', quantity: 400, availableQuantity: 350, condition: 'bueno', location: 'Cajones Almacén D', unitCost: 1800, notes: 'Plato base metálico brillante.' },
    { id: 'inv_6', name: 'Mantel Lino Crudo Natural', category: 'manteleria', quantity: 50, availableQuantity: 35, condition: 'bueno', location: 'Armario de Textiles', unitCost: 8000, notes: 'Lino premium, requiere lavado delicado.' },
    { id: 'inv_7', name: 'Arco Metálico para Flores Circulares', category: 'arreglos', quantity: 3, availableQuantity: 2, condition: 'excelente', location: 'Estructuras Patio', unitCost: 45000, notes: 'Desarmable en 4 secciones.' },
    { id: 'inv_8', name: 'Foco Guirnalda Exterior Led 15m', category: 'otros', quantity: 40, availableQuantity: 30, condition: 'bueno', location: 'Caja Electricidad', unitCost: 12000, notes: 'Luz cálida impermeable, ampolletas de repuesto incluidas.' }
  ];

  // Master Global Dishes (for reuse)
  const globalDishes: FoodMenuItem[] = [
    { id: 'gd_1', name: 'Pastel de Papas Gourmet', category: 'plato_principal', description: 'Pastel de papas tradicional con pino de wagyu, pasas rubias y huevo de codorniz duro.', ingredients: 'Papas, Wagyu, cebolla morada, pasas, huevo de codorniz.', allergens: 'Lácteos, huevo.' },
    { id: 'gd_2', name: 'Ceviche de Salmón y Mango', category: 'entrada', description: 'Dados de salmón fresco marinados en limón de pica con cubos de mango maduro, cilantro fresco y cebolla morada hilada.', ingredients: 'Salmón, limón, mango, cilantro, cebolla morada.', allergens: 'Pescado.' },
    { id: 'gd_3', name: 'Crème Brûlée de Manjar Colun', category: 'postre', description: 'Fusión franco-chilena con base de manjar artesanal del sur y capa clásica de azúcar rubia sopleteada.', ingredients: 'Crema de leche, manjar Colun, yemas de huevo, azúcar rubia.', allergens: 'Lácteos, huevo.' }
  ];

  return {
    clients,
    checklist,
    dayTimeline,
    protocols,
    budgetItems,
    installments,
    vendors,
    serviceOrders,
    guests,
    tables,
    moodImages,
    inventory,
    foodMenu,
    globalDishes,
    selectedClientId: 'demo_1' // Select the first active client by default
  };
}
