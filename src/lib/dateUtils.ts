/**
 * Utilitários de data e hora para validação de agendamentos no Studio AUDAX
 */

/**
 * Retorna a data local atual no formato YYYY-MM-DD
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Retorna o horário local atual no formato HH:mm
 */
export function getLocalTimeString(d: Date = new Date()): string {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Retorna o dia da semana a partir de uma string YYYY-MM-DD
 * 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
 */
export function getDayOfWeekFromDateStr(dateStr: string): number {
  if (!dateStr) return new Date().getDay();
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.getDay();
}

export interface ShiftInfo {
  id: 'manha' | 'tarde';
  label: string;
  period: string;
  slots: string[];
}

export interface OperatingHours {
  dayName: string;
  operatingTimeText: string;
  start: string;
  end: string;
  shifts: ShiftInfo[];
}

/**
 * Retorna o horário de funcionamento e turnos de acordo com o dia da semana:
 * - Segunda a Sexta: 08:00 às 18:30 (Manhã: 08:00 - 11:30 | Tarde: 12:00 - 18:30)
 * - Sábado: 08:00 às 16:30 (Manhã: 08:00 - 11:30 | Tarde: 12:00 - 16:30)
 * - Domingo: 09:00 às 11:30 (Manhã: 09:00 - 11:30)
 */
export function getOperatingHoursForDate(dateStr: string): OperatingHours {
  const dayOfWeek = getDayOfWeekFromDateStr(dateStr);

  const manhaStandard = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
  const tardeSegSex = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'];
  const tardeSabado = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
  const manhaDomingo = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];

  if (dayOfWeek === 0) {
    // Domingo
    return {
      dayName: 'Domingo',
      operatingTimeText: '09:00 às 11:30',
      start: '09:00',
      end: '11:30',
      shifts: [
        {
          id: 'manha',
          label: 'Turno da Manhã',
          period: '09:00 às 11:30',
          slots: manhaDomingo,
        },
      ],
    };
  }

  if (dayOfWeek === 6) {
    // Sábado
    return {
      dayName: 'Sábado',
      operatingTimeText: '08:00 às 16:30',
      start: '08:00',
      end: '16:30',
      shifts: [
        {
          id: 'manha',
          label: 'Turno da Manhã',
          period: '08:00 às 11:30',
          slots: manhaStandard,
        },
        {
          id: 'tarde',
          label: 'Turno da Tarde',
          period: '12:00 às 16:30',
          slots: tardeSabado,
        },
      ],
    };
  }

  // Segunda a Sexta (1 a 5)
  const weekDays = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];

  return {
    dayName: weekDays[dayOfWeek] || 'Dia Útil',
    operatingTimeText: '08:00 às 18:30',
    start: '08:00',
    end: '18:30',
    shifts: [
      {
        id: 'manha',
        label: 'Turno da Manhã',
        period: '08:00 às 11:30',
        slots: manhaStandard,
      },
      {
        id: 'tarde',
        label: 'Turno da Tarde',
        period: '12:00 às 18:30',
        slots: tardeSegSex,
      },
    ],
  };
}

/**
 * Retorna os slots de horário disponíveis para uma data específica
 */
export function getTimeSlotsForDate(dateStr: string): string[] {
  const op = getOperatingHoursForDate(dateStr);
  return op.shifts.flatMap((s) => s.slots);
}

/**
 * Verifica se um determinado horário (HH:mm) para uma data (YYYY-MM-DD) já passou.
 */
export function isDateTimeInPast(dateStr: string, timeStr: string, refDate: Date = new Date()): boolean {
  if (!dateStr || !timeStr) return true;

  const todayStr = getLocalDateString(refDate);

  if (dateStr < todayStr) {
    return true; // Data passada
  }

  if (dateStr > todayStr) {
    return false; // Data futura
  }

  // Data é hoje: comparar horas e minutos
  const currentHours = refDate.getHours();
  const currentMinutes = refDate.getMinutes();

  const [slotHoursStr, slotMinutesStr] = timeStr.split(':');
  const slotH = parseInt(slotHoursStr, 10);
  const slotM = parseInt(slotMinutesStr, 10);

  if (isNaN(slotH) || isNaN(slotM)) return true;

  if (slotH < currentHours) {
    return true;
  }

  if (slotH === currentHours && slotM < currentMinutes) {
    return true;
  }

  return false;
}

/**
 * Validação rigorosa para criação ou reagendamento de horários.
 */
export function validateAppointmentDateTime(dateStr: string, timeStr: string): {
  valid: boolean;
  message?: string;
} {
  if (!dateStr || !timeStr) {
    return {
      valid: false,
      message: 'Data e horário são obrigatórios.',
    };
  }

  const validSlots = getTimeSlotsForDate(dateStr);
  if (!validSlots.includes(timeStr)) {
    const op = getOperatingHoursForDate(dateStr);
    return {
      valid: false,
      message: `Horário indisponível ou fora do expediente. No ${op.dayName}, o atendimento funciona das ${op.operatingTimeText}.`,
    };
  }

  if (isDateTimeInPast(dateStr, timeStr)) {
    return {
      valid: false,
      message: 'Este horário já passou e não pode ser selecionado.',
    };
  }

  return { valid: true };
}

