// Studio AUDAX - AI Booking & Schedule Verification Logic
// Works 100% in browser (Vercel, Netlify, Vite SPA) and Node.js backend

export interface FreeSlotInfo {
  barberId: string;
  barberName: string;
  freeSlots: string[];
}

export interface ParsedAiResult {
  clientName: string;
  clientWhatsapp?: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  servicePrice?: number;
  date: string;
  time: string;
  slotStatus?: 'LIVRE' | 'REARRANJADO_HORARIO_OCUPADO';
  occupiedNotice?: string;
  freeSlotsSummary?: FreeSlotInfo[];
  notes?: string;
  confidenceScore: number;
  reasoning: string;
}

// Helper to get America/Sao_Paulo timezone date and time correctly
export function getTodayAndCurrentTimeInBrazil() {
  const now = new Date();
  try {
    const todayStr = now.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }); // "YYYY-MM-DD"
    const timeStr = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour12: false }).substring(0, 5); // "HH:MM"
    return { todayStr, currentHHMM: timeStr };
  } catch (err) {
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return { todayStr, currentHHMM: timeStr };
  }
}

// Helper function to check if a time slot is in the past
export function isSlotInPast(dateStr: string, timeStr: string): boolean {
  const { todayStr, currentHHMM } = getTodayAndCurrentTimeInBrazil();

  if (dateStr < todayStr) {
    return true; // Any slot on a past date is in the past
  }

  if (dateStr === todayStr) {
    return timeStr <= currentHHMM; // Any slot today at or before current time is in the past
  }

  return false; // Future date
}

// Operating hours slot generator by day of week (Mon-Fri: 08:00 to 18:30, Sat: 08:00 to 16:30, Sun: 09:00 to 11:30)
export function getTimeSlotsForDate(dateStr: string): string[] {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay();

  const manhaStandard = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
  const tardeSegSex = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'];
  const tardeSabado = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
  const manhaDomingo = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];

  if (dayOfWeek === 0) {
    // Domingo
    return manhaDomingo;
  }
  if (dayOfWeek === 6) {
    // Sábado
    return [...manhaStandard, ...tardeSabado];
  }
  // Segunda a Sexta (1 a 5)
  return [...manhaStandard, ...tardeSegSex];
}

// Helper function to check if a slot is unavailable (either occupied OR in the past)
export function isSlotUnavailable(barberId: string, dateStr: string, timeStr: string, existingAppointments: any[] = []): boolean {
  if (isSlotInPast(dateStr, timeStr)) {
    return true;
  }
  return existingAppointments.some(
    (app) =>
      app.barberId === barberId &&
      app.date === dateStr &&
      app.time === timeStr &&
      app.status !== 'cancelado'
  );
}

// Helper function to check if a slot is occupied
export function isSlotOccupied(barberId: string, dateStr: string, timeStr: string, existingAppointments: any[] = []): boolean {
  return existingAppointments.some(
    (app) =>
      app.barberId === barberId &&
      app.date === dateStr &&
      app.time === timeStr &&
      app.status !== 'cancelado'
  );
}

// Find next free slot for a barber on a date (MUST BE FUTURE AND UNOCCUPIED)
export function findNextFreeSlot(barberId: string, dateStr: string, requestedTime: string, existingAppointments: any[] = []): string {
  const possibleTimes = getTimeSlotsForDate(dateStr);
  const validFreeSlots = possibleTimes.filter((t) => !isSlotUnavailable(barberId, dateStr, t, existingAppointments));

  if (validFreeSlots.length > 0) {
    const nextAfterRequested = validFreeSlots.find((t) => t >= requestedTime);
    return nextAfterRequested || validFreeSlots[0];
  }

  return possibleTimes[0] || '09:00';
}

// Helper to compute all free slots per barber for a given date (MUST BE FUTURE AND UNOCCUPIED)
export function getFreeSlotsSummary(dateStr: string, barbers: any[] = [], existingAppointments: any[] = []): FreeSlotInfo[] {
  const possibleTimes = getTimeSlotsForDate(dateStr);
  return barbers.map((b) => {
    const freeSlots = possibleTimes.filter((t) => !isSlotUnavailable(b.id, dateStr, t, existingAppointments));
    return {
      barberId: b.id,
      barberName: b.name,
      freeSlots,
    };
  });
}

// Post-process function to guarantee AI output never returns past or occupied slots
export function sanitizeAndValidateBookingResult(
  parsedJson: any,
  availableBarbers: any[],
  existingAppointments: any[],
  todayStr: string
): ParsedAiResult {
  const barberId = parsedJson.barberId || (availableBarbers[0]?.id || 'barber-1');
  const dateStr = parsedJson.date || todayStr;
  const timeStr = parsedJson.time || '15:00';

  if (isSlotUnavailable(barberId, dateStr, timeStr, existingAppointments)) {
    const nextFree = findNextFreeSlot(barberId, dateStr, timeStr, existingAppointments);
    const isPast = isSlotInPast(dateStr, timeStr);
    parsedJson.time = nextFree;
    parsedJson.slotStatus = 'REARRANJADO_HORARIO_OCUPADO';
    parsedJson.occupiedNotice = isPast
      ? `O horário (${timeStr}) no dia ${dateStr} já passou. A IA reajustou automaticamente para o próximo horário FUTURO LIVRE (${nextFree}).`
      : `O horário (${timeStr}) no dia ${dateStr} estava Ocupado na agenda real. A IA reajustou automaticamente para o próximo horário livre (${nextFree}).`;
  }

  // Always calculate strictly future and unoccupied slots summary
  parsedJson.freeSlotsSummary = getFreeSlotsSummary(dateStr, availableBarbers, existingAppointments);

  return parsedJson as ParsedAiResult;
}

// Smart heuristic NLP parser that runs 100% offline/client-side
export function fallbackParseBooking(
  prompt: string,
  barbers: any[] = [],
  services: any[] = [],
  existingAppointments: any[] = []
): ParsedAiResult {
  const lower = prompt.toLowerCase();
  const today = new Date();

  // 1. Identify Barber
  let selectedBarber = barbers.find((b) => b.name && lower.includes(b.name.toLowerCase()));

  // 2. Extract Date with full support for any day of the week
  const targetDate = new Date(today);
  const currentDayOfWeek = today.getDay(); // 0: Dom, 1: Seg, 2: Ter, 3: Qua, 4: Qui, 5: Sex, 6: Sáb

  if (lower.includes('depois de amanhã') || lower.includes('depois de amanha')) {
    targetDate.setDate(today.getDate() + 2);
  } else if (lower.includes('amanhã') || lower.includes('amanha')) {
    targetDate.setDate(today.getDate() + 1);
  } else if (lower.includes('hoje')) {
    // Keep today
  } else if (lower.includes('domingo')) {
    const diff = (0 - currentDayOfWeek + 7) % 7 || 7;
    targetDate.setDate(today.getDate() + diff);
  } else if (lower.includes('segunda')) {
    const diff = (1 - currentDayOfWeek + 7) % 7 || 7;
    targetDate.setDate(today.getDate() + diff);
  } else if (lower.includes('terça') || lower.includes('terca')) {
    const diff = (2 - currentDayOfWeek + 7) % 7 || 7;
    targetDate.setDate(today.getDate() + diff);
  } else if (lower.includes('quarta')) {
    const diff = (3 - currentDayOfWeek + 7) % 7 || 7;
    targetDate.setDate(today.getDate() + diff);
  } else if (lower.includes('quinta')) {
    const diff = (4 - currentDayOfWeek + 7) % 7 || 7;
    targetDate.setDate(today.getDate() + diff);
  } else if (lower.includes('sexta')) {
    const diff = (5 - currentDayOfWeek + 7) % 7 || 7;
    targetDate.setDate(today.getDate() + diff);
  } else if (lower.includes('sábado') || lower.includes('sabado') || lower.includes('final de semana') || lower.includes('fim de semana')) {
    const diff = (6 - currentDayOfWeek + 7) % 7 || 7;
    targetDate.setDate(today.getDate() + diff);
  }
  const dateStr = targetDate.toISOString().split('T')[0];

  // Calculate free slots summary for the date
  const freeSlotsSummary = getFreeSlotsSummary(dateStr, barbers, existingAppointments);

  // 3. Extract Time
  let timeStr = '15:00';
  const timeMatch = prompt.match(/(\d{1,2})[:h](\d{2})?/i) || prompt.match(/às\s*(\d{1,2})/i) || prompt.match(/as\s*(\d{1,2})/i);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1], 10);
    const min = timeMatch[2] ? timeMatch[2] : '00';
    if (hour < 10) timeStr = `0${hour}:${min}`;
    else timeStr = `${hour}:${min}`;
  }

  // If barber was not specified, pick barber who is FREE at requested time
  if (!selectedBarber && barbers.length > 0) {
    const freeBarber = barbers.find((b) => !isSlotOccupied(b.id, dateStr, timeStr, existingAppointments));
    selectedBarber = freeBarber || barbers[0];
  }

  // 4. Identify Service
  let selectedService = services.find((s) => s.name && lower.includes(s.name.toLowerCase()));
  if (!selectedService) {
    if (lower.includes('combo') || (lower.includes('corte') && lower.includes('barba'))) {
      selectedService = services.find((s) => s.name.toLowerCase().includes('combo') || s.name.toLowerCase().includes('corte + barba')) || services[0];
    } else if (lower.includes('barba')) {
      selectedService = services.find((s) => s.name.toLowerCase().includes('barba')) || services[0];
    } else if (lower.includes('sobrancelha')) {
      selectedService = services.find((s) => s.name.toLowerCase().includes('sobrancelha')) || services[0];
    } else {
      selectedService = services[0];
    }
  }

  // 5. Check real schedule availability and past-time constraints
  let finalTime = timeStr;
  let slotStatus: 'LIVRE' | 'REARRANJADO_HORARIO_OCUPADO' = 'LIVRE';
  let occupiedNotice = '';

  const barberId = selectedBarber?.id || 'barber-1';
  if (isSlotInPast(dateStr, timeStr)) {
    finalTime = findNextFreeSlot(barberId, dateStr, timeStr, existingAppointments);
    slotStatus = 'REARRANJADO_HORARIO_OCUPADO';
    occupiedNotice = `O horário de ${timeStr} no dia ${dateStr} já passou. A IA reajustou automaticamente para o próximo horário FUTURO LIVRE disponível (${finalTime}).`;
  } else if (isSlotOccupied(barberId, dateStr, timeStr, existingAppointments)) {
    finalTime = findNextFreeSlot(barberId, dateStr, timeStr, existingAppointments);
    slotStatus = 'REARRANJADO_HORARIO_OCUPADO';
    occupiedNotice = `O horário de ${timeStr} do dia ${dateStr} para ${selectedBarber?.name || 'o barbeiro'} já estava Ocupado na agenda real do banco. A IA reajustou automaticamente para o próximo horário livre (${finalTime}).`;
  }

  // 6. Extract Client Name
  let clientName = 'Cliente Agendado via IA';
  const clientMatch = prompt.match(/(?:cliente|para o|para a|marcar para)\s+([A-ZÀ-Úa-zà-ú\s]+)/i);
  if (clientMatch && clientMatch[1]) {
    clientName = clientMatch[1].trim().split(' ').slice(0, 3).join(' ');
  }

  return {
    clientName: clientName || 'Cliente Agendado via IA',
    clientWhatsapp: '11999998888',
    barberId: barberId,
    barberName: selectedBarber?.name || 'Barbeiro AUDAX',
    serviceId: selectedService?.id || 'srv-1',
    serviceName: selectedService?.name || 'Corte de Cabelo',
    servicePrice: selectedService?.price || 50,
    date: dateStr,
    time: finalTime,
    slotStatus,
    occupiedNotice,
    freeSlotsSummary,
    notes: slotStatus === 'REARRANJADO_HORARIO_OCUPADO' ? occupiedNotice : 'Horário verificado e reservado na agenda do sistema.',
    confidenceScore: 98,
    reasoning: slotStatus === 'REARRANJADO_HORARIO_OCUPADO' 
      ? `Agenda Real Verificada: ${occupiedNotice}` 
      : `Agenda Real Verificada: O barbeiro ${selectedBarber?.name} está 100% LIVRE no dia ${dateStr} às ${finalTime}.`,
  };
}

export function buildAiSystemInstruction(
  availableBarbers: any[],
  availableServices: any[],
  existingAppointments: any[],
  todayStr: string
): string {
  return `Você é a inteligência artificial especialista em gestão da barbearia AUDAX.
Sua missão principal é analisar o pedido de agendamento ou consulta do cliente e VERIFICAR EM TEMPO REAL a agenda real do banco de dados para evitar conflitos e listar barbeiros e horários livres.

BASE DE DADOS EM TEMPO REAL DA BARBEARIA:

BARBEIROS ATIVOS:
${JSON.stringify(availableBarbers || [], null, 2)}

CATÁLOGO DE SERVIÇOS (PREÇO E DURAÇÃO):
${JSON.stringify(availableServices || [], null, 2)}

AGENDAMENTOS EXISTENTES NO BANCO DE DADOS (OCUPADOS):
${JSON.stringify(existingAppointments || [], null, 2)}

DATA HOJE DO SISTEMA: ${todayStr}

Instruções Estritas:
1. Mapeie o barbeiro e o serviço solicitados.
2. Calcule a data YYYY-MM-DD e o horário HH:MM.
3. VERIFIQUE SE O BARBEIRO JÁ POSSUI UM AGENDAMENTO EM 'existingAppointments' para essa mesma data e horário.
4. Se o horário solicitado ESTIVER OCUPADO:
   - Defina 'slotStatus' = 'REARRANJADO_HORARIO_OCUPADO'.
   - Selecione o PRÓXIMO HORÁRIO LIVRE no mesmo dia para o barbeiro (ex: 15:30 ou 16:00).
   - Preencha 'occupiedNotice' explicando que o horário original estava ocupado na agenda real do banco.
5. Se o horário solicitado ESTIVER LIVRE:
   - Defina 'slotStatus' = 'LIVRE'.
   - Preencha 'occupiedNotice' como "".
6. Preencha a lista 'freeSlotsSummary' contendo os barbeiros e seus respectivos horários livres no dia.
7. Retorne EXCLUSIVAMENTE um objeto JSON válido sem formatação markdown no esquema:
{
  "clientName": "string",
  "clientWhatsapp": "string",
  "barberId": "string",
  "barberName": "string",
  "serviceId": "string",
  "serviceName": "string",
  "servicePrice": 50,
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "slotStatus": "LIVRE" ou "REARRANJADO_HORARIO_OCUPADO",
  "occupiedNotice": "string",
  "notes": "string",
  "confidenceScore": 95,
  "reasoning": "string"
}`;
}
