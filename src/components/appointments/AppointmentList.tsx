import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBarberData } from '../../context/BarberDataContext';
import {
  Calendar,
  Clock,
  User,
  Scissors,
  Search,
  Filter,
  Phone,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Edit2,
  Trash2,
  CalendarCheck,
  Plus,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sun,
  Sunset,
  Grid,
  List,
  Crown,
} from 'lucide-react';
import { Appointment, AppointmentStatus } from '../../types';
import {
  getLocalDateString,
  isDateTimeInPast,
  validateAppointmentDateTime,
  getOperatingHoursForDate,
  getTimeSlotsForDate,
} from '../../lib/dateUtils';

interface AppointmentListProps {
  onOpenNewAppointment: (serviceId?: string, date?: string, time?: string, barberId?: string) => void;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({
  onOpenNewAppointment,
}) => {
  const { activeRole, currentUser } = useAuth();
  const {
    getVisibleAppointments,
    updateAppointmentStatus,
    rescheduleAppointment,
    cancelAppointment,
    deleteAppointment,
    barbers,
    ownerAppointmentScope,
    setOwnerAppointmentScope,
    roleAppointmentCounts,
  } = useBarberData();

  // Mode: 'turnos' (Grade de controle por turno e data) | 'lista' (Tabela detalhada com filtros)
  const [viewMode, setViewMode] = useState<'turnos' | 'lista'>('turnos');

  // Selected date for shift view (default today)
  const todayStr = getLocalDateString();
  const [selectedAgendaDate, setSelectedAgendaDate] = useState<string>(todayStr);

  // Filters for List view
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [barberFilter, setBarberFilter] = useState<string>('todos');
  const [dateFilter, setDateFilter] = useState<string>('todos'); // 'todos' | 'hoje' | 'futuro'

  // Reschedule modal state
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('10:00');
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const appointments = getVisibleAppointments();

  // Date shifting helpers
  const navigateAgendaDate = (days: number) => {
    const [y, m, d] = selectedAgendaDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d + days);
    setSelectedAgendaDate(getLocalDateString(dt));
  };

  // Generate 7-day strip around selectedAgendaDate (starting Monday)
  const getWeekStrip = () => {
    const [y, m, d] = selectedAgendaDate.split('-').map(Number);
    const refDate = new Date(y, m - 1, d);
    const dayOfWeek = refDate.getDay(); // 0 = Sun
    const offsetToMon = (dayOfWeek + 6) % 7; // Distance to Monday
    const monday = new Date(y, m - 1, d - offsetToMon);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const dt = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const dtStr = getLocalDateString(dt);
      const op = getOperatingHoursForDate(dtStr);
      
      // Count appointments on this day
      const aptsCount = appointments.filter(
        (a) => a.date === dtStr && a.status !== 'cancelado' && (barberFilter === 'todos' || a.barberId === barberFilter)
      ).length;

      week.push({
        dateStr: dtStr,
        dayNum: dt.getDate(),
        dayShort: op.dayName.substring(0, 3).toUpperCase(),
        dayFull: op.dayName,
        operatingText: op.operatingTimeText,
        isToday: dtStr === todayStr,
        isSelected: dtStr === selectedAgendaDate,
        aptsCount,
      });
    }
    return week;
  };

  const currentOperatingHours = getOperatingHoursForDate(selectedAgendaDate);

  // Appointments for the selected agenda date
  const dayAppointments = appointments.filter((apt) => {
    const matchesDate = apt.date === selectedAgendaDate;
    const matchesBarber = barberFilter === 'todos' || apt.barberId === barberFilter;
    return matchesDate && matchesBarber;
  });

  // Filtered appointments for List View
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.barberName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || apt.status === statusFilter;
    const matchesBarber = barberFilter === 'todos' || apt.barberId === barberFilter;

    let matchesDate = true;
    if (dateFilter === 'hoje') matchesDate = apt.date === todayStr;
    if (dateFilter === 'futuro') matchesDate = apt.date >= todayStr;

    return matchesSearch && matchesStatus && matchesBarber && matchesDate;
  }).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmado':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">Confirmado</span>;
      case 'em_atendimento':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">Em Atendimento</span>;
      case 'finalizado':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-200 text-stone-800 border border-stone-300">Finalizado</span>;
      case 'cancelado':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">Cancelado</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">Agendado</span>;
    }
  };

  const handleOpenReschedule = (apt: Appointment) => {
    setRescheduleApt(apt);
    setNewDate(apt.date >= todayStr ? apt.date : todayStr);
    setNewTime(apt.time);
    setRescheduleError(null);
  };

  const handleConfirmReschedule = () => {
    if (rescheduleApt && newDate && newTime) {
      const validation = validateAppointmentDateTime(newDate, newTime);
      if (!validation.valid) {
        setRescheduleError(
          validation.message || 'Este horário não está disponível. Por favor, selecione outro horário.'
        );
        return;
      }

      try {
        rescheduleAppointment(rescheduleApt.id, newDate, newTime);
        setRescheduleApt(null);
        setRescheduleError(null);
      } catch (err: any) {
        setRescheduleError(
          err.message || 'Este horário não está mais disponível. Por favor, selecione outro horário.'
        );
      }
    }
  };

  const canEditAny = activeRole === 'dono';
  const canUpdateStatus = activeRole === 'dono' || activeRole === 'barbeiro';

  // Stats for the selected agenda date
  const totalDaySlots = currentOperatingHours.shifts.reduce((acc, s) => acc + s.slots.length, 0);
  const occupiedSlotsCount = dayAppointments.filter((a) => a.status !== 'cancelado').length;
  const freeSlotsCount = Math.max(0, totalDaySlots - occupiedSlotsCount);
  const dayRevenue = dayAppointments
    .filter((a) => a.status !== 'cancelado')
    .reduce((sum, a) => sum + (a.servicePrice || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e2dcce] pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-100 text-[#a16a1c]">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-stone-900">Controle de Agenda por Turnos</h1>
          </div>
          <p className="text-xs text-stone-700 font-semibold mt-1">
            Segunda a Sexta: <strong>08:00 - 18:30</strong> | Sábado: <strong>08:00 - 16:30</strong> | Domingo: <strong>09:00 - 11:30</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          {/* Mode toggle */}
          <div className="flex items-center bg-[#f4efe4] border border-[#e2dcce] rounded-xl p-1 text-xs font-bold">
            <button
              onClick={() => setViewMode('turnos')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'turnos'
                  ? 'bg-[#a16a1c] text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Grade por Turno</span>
            </button>

            <button
              onClick={() => setViewMode('lista')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'lista'
                  ? 'bg-[#a16a1c] text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista Detalhada</span>
            </button>
          </div>

          {activeRole !== 'barbeiro' && (
            <button
              onClick={() => onOpenNewAppointment(undefined, selectedAgendaDate)}
              className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Novo Agendamento</span>
            </button>
          )}
        </div>
      </div>

      {/* Opção do Dono: Ver Todos os Agendamentos vs. Apenas os Dele */}
      {activeRole === 'dono' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 via-white to-amber-50/70 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-200 text-amber-900 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-950">
                  Modo de Visualização do Dono
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold border ${
                    ownerAppointmentScope === 'meus'
                      ? 'bg-amber-200 text-amber-950 border-amber-400'
                      : 'bg-stone-200 text-stone-800 border-stone-300'
                  }`}
                >
                  {ownerAppointmentScope === 'meus' ? 'Visualizando: Meus Atendimentos' : 'Visualizando: Toda a Barbearia'}
                </span>
              </div>
              <p className="text-xs text-stone-600 font-medium mt-0.5">
                {ownerAppointmentScope === 'meus'
                  ? 'Exibindo apenas os agendamentos atribuídos diretamente a você como barbeiro/dono.'
                  : 'Exibindo todos os agendamentos de todos os profissionais e clientes sem restrição.'}
              </p>
            </div>
          </div>

          <div className="flex items-center bg-[#f4efe4] border border-[#e2dcce] p-1 rounded-xl shadow-xs shrink-0 self-start sm:self-auto">
            <button
              type="button"
              id="owner-appointment-filter-todos"
              onClick={() => setOwnerAppointmentScope('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                ownerAppointmentScope === 'todos'
                  ? 'bg-[#a16a1c] text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-[#ede5d6]'
              }`}
            >
              <span>💈 Todos da Barbearia</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                  ownerAppointmentScope === 'todos' ? 'bg-white/25 text-white' : 'bg-stone-300/80 text-stone-800'
                }`}
              >
                {roleAppointmentCounts.totalAppointmentsCount}
              </span>
            </button>
            <button
              type="button"
              id="owner-appointment-filter-meus"
              onClick={() => setOwnerAppointmentScope('meus')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                ownerAppointmentScope === 'meus'
                  ? 'bg-[#a16a1c] text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-[#ede5d6]'
              }`}
            >
              <span>✂️ Meus Atendimentos</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                  ownerAppointmentScope === 'meus' ? 'bg-white/25 text-white' : 'bg-stone-300/80 text-stone-800'
                }`}
              >
                {roleAppointmentCounts.ownerMyAppointmentsCount}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Indicador para Cliente logado */}
      {activeRole === 'cliente' && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl border border-emerald-300 bg-emerald-50/70 shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                Seus Agendamentos ({roleAppointmentCounts.clientCount})
              </p>
              <p className="text-xs text-stone-600 font-medium">
                Mostrando os agendamentos registrados para o seu perfil ({currentUser?.name || currentUser?.email}).
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenNewAppointment()}
            className="rounded-lg bg-[#a16a1c] text-white px-3 py-1.5 text-xs font-bold shadow-xs hover:bg-[#8c5a15] transition-colors"
          >
            + Novo Agendamento
          </button>
        </div>
      )}

      {/* Indicador para Barbeiro logado */}
      {activeRole === 'barbeiro' && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl border border-blue-300 bg-blue-50/70 shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-900 shrink-0">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-blue-950 uppercase tracking-wider">
                Seus Atendimentos ({roleAppointmentCounts.barberCount})
              </p>
              <p className="text-xs text-stone-600 font-medium">
                Mostrando os agendamentos associados à sua escala ({currentUser?.name}).
              </p>
            </div>
          </div>
        </div>
      )}
      {viewMode === 'turnos' && (
        <div className="space-y-5">
          {/* Top Bar: Date Navigator & Barber Filter */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#e2dcce] shadow-2xs">
            {/* Date Navigation Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => navigateAgendaDate(-1)}
                className="p-2 rounded-xl bg-[#f8f5ee] hover:bg-[#eae3d5] text-stone-800 border border-[#e2dcce] transition-colors"
                title="Dia Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setSelectedAgendaDate(todayStr)}
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
                  selectedAgendaDate === todayStr
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-[#f8f5ee] text-stone-800 border-[#e2dcce] hover:bg-[#eae3d5]'
                }`}
              >
                Hoje
              </button>

              <button
                onClick={() => navigateAgendaDate(1)}
                className="p-2 rounded-xl bg-[#f8f5ee] hover:bg-[#eae3d5] text-stone-800 border border-[#e2dcce] transition-colors"
                title="Próximo Dia"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="relative">
                <input
                  type="date"
                  value={selectedAgendaDate}
                  onChange={(e) => setSelectedAgendaDate(e.target.value)}
                  className="bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                />
              </div>
            </div>

            {/* Barber Filter (if owner) */}
            {activeRole === 'dono' && (
              <div className="w-full lg:w-64">
                <select
                  value={barberFilter}
                  onChange={(e) => setBarberFilter(e.target.value)}
                  className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                >
                  <option value="todos">Filtrar: Todos os Barbeiros</option>
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 7-Day Strip Carousel */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 overflow-x-auto pb-1">
            {getWeekStrip().map((item) => (
              <button
                key={item.dateStr}
                onClick={() => setSelectedAgendaDate(item.dateStr)}
                className={`p-2 sm:p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between relative ${
                  item.isSelected
                    ? 'bg-[#a16a1c] text-white border-[#8c5a15] font-black shadow-md'
                    : item.isToday
                    ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold hover:bg-amber-100'
                    : 'bg-white border-[#e2dcce] hover:bg-[#f8f5ee] text-stone-800'
                }`}
              >
                <span className={`text-[10px] uppercase tracking-wider font-bold ${item.isSelected ? 'text-amber-100' : 'text-stone-600'}`}>
                  {item.dayShort}
                </span>
                <span className="text-base sm:text-xl font-black my-0.5">
                  {item.dayNum}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  item.isSelected
                    ? 'bg-black/20 text-white'
                    : item.aptsCount > 0
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'text-stone-600'
                }`}>
                  {item.aptsCount > 0 ? `${item.aptsCount} agend.` : 'Livre'}
                </span>
              </button>
            ))}
          </div>

          {/* Selected Date Summary Banner */}
          <div className="bg-white p-4 rounded-2xl border border-[#e2dcce] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-black text-stone-900">
                  📅 {currentOperatingHours.dayName}, {selectedAgendaDate.split('-').reverse().join('/')}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                  Expediente: {currentOperatingHours.operatingTimeText}
                </span>
              </div>
              <p className="text-xs text-stone-600 font-semibold mt-1">
                Controle de horários por turno (intervalos de 30 minutos).
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs flex-wrap">
              <div className="px-3 py-1.5 rounded-xl bg-[#f8f5ee] border border-[#e2dcce] text-center">
                <span className="text-stone-600 text-[10px] font-bold block">Ocupados</span>
                <span className="font-black text-[#a16a1c]">{occupiedSlotsCount}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-[#f8f5ee] border border-[#e2dcce] text-center">
                <span className="text-stone-600 text-[10px] font-bold block">Disponíveis</span>
                <span className="font-black text-emerald-800">{freeSlotsCount}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-[#f8f5ee] border border-[#e2dcce] text-center">
                <span className="text-stone-600 text-[10px] font-bold block">Previsão</span>
                <span className="font-black text-stone-900">R$ {dayRevenue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* SHIFTS GRID */}
          <div className="space-y-6">
            {currentOperatingHours.shifts.map((shift) => (
              <div key={shift.id} className="bg-[#f8f5ee]/60 rounded-2xl border border-[#e2dcce] p-4 space-y-3 shadow-2xs">
                {/* Shift Header */}
                <div className="flex items-center justify-between border-b border-[#e2dcce] pb-2.5">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-amber-100 text-[#a16a1c]">
                      {shift.id === 'manha' ? <Sun className="w-4 h-4" /> : <Sunset className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                        <span>{shift.label}</span>
                        <span className="text-xs font-bold text-stone-700 bg-white px-2 py-0.5 rounded border border-[#e2dcce]">
                          {shift.period}
                        </span>
                      </h3>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-stone-600">
                    {shift.slots.length} horários no turno
                  </span>
                </div>

                {/* Slots Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {shift.slots.map((slotTime) => {
                    const apt = dayAppointments.find(
                      (a) => a.time === slotTime && a.status !== 'cancelado'
                    );
                    const isPast = isDateTimeInPast(selectedAgendaDate, slotTime);

                    if (apt) {
                      // OCCUPIED SLOT CARD
                      return (
                        <div
                          key={slotTime}
                          className="p-3.5 rounded-xl border border-[#e2dcce] bg-white hover:border-[#a16a1c] transition-all flex flex-col justify-between space-y-2 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 rounded-lg bg-[#a16a1c] text-white text-xs font-black">
                              {slotTime}
                            </span>
                            {getStatusBadge(apt.status)}
                          </div>

                          <div>
                            <div className="text-xs font-bold text-stone-900 truncate">
                              {apt.clientName}
                            </div>
                            <div className="text-[11px] font-bold text-[#a16a1c] mt-0.5 truncate">
                              {apt.serviceName} • R$ {apt.servicePrice.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-stone-600 font-semibold mt-0.5 truncate">
                              Barbeiro: <strong>{apt.barberName}</strong>
                            </div>
                          </div>

                          {/* Slot Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-[#e2dcce] gap-1.5">
                            <a
                              href={`https://wa.me/55${apt.clientPhone.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(apt.clientName)}%2C%20tudo%20bem%3F%20Confirmando%20seu%20hor%C3%A1rio%20hoje%20%C3%A0s%20${apt.time}%20no%20Studio%20AUDAX!`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-300 transition-colors"
                              title="Contato WhatsApp"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>

                            {canUpdateStatus && apt.status !== 'finalizado' && (
                              <div className="flex items-center gap-1">
                                {apt.status === 'agendado' && (
                                  <button
                                    onClick={() => updateAppointmentStatus(apt.id, 'confirmado')}
                                    className="px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold"
                                  >
                                    Confirmar
                                  </button>
                                )}
                                {apt.status !== 'em_atendimento' && (
                                  <button
                                    onClick={() => updateAppointmentStatus(apt.id, 'em_atendimento')}
                                    className="px-2 py-1 rounded bg-[#a16a1c] hover:bg-[#8c5a15] text-white text-[10px] font-bold"
                                  >
                                    Atender
                                  </button>
                                )}
                                {apt.status === 'em_atendimento' && (
                                  <button
                                    onClick={() => updateAppointmentStatus(apt.id, 'finalizado')}
                                    className="px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold"
                                  >
                                    Concluir
                                  </button>
                                )}
                              </div>
                            )}

                            {(canEditAny || activeRole === 'cliente') && (
                              <button
                                onClick={() => handleOpenReschedule(apt)}
                                className="p-1.5 rounded-lg border border-[#e2dcce] bg-[#f8f5ee] hover:bg-[#eae3d5] text-stone-700 text-[10px]"
                                title="Reagendar"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // FREE SLOT CARD
                    return (
                      <div
                        key={slotTime}
                        onClick={() => {
                          if (!isPast && activeRole !== 'barbeiro') {
                            onOpenNewAppointment(
                              undefined,
                              selectedAgendaDate,
                              slotTime,
                              barberFilter !== 'todos' ? barberFilter : undefined
                            );
                          }
                        }}
                        className={`p-3 rounded-xl border border-dashed transition-all flex items-center justify-between group ${
                          isPast
                            ? 'bg-[#f5f2eb]/50 border-stone-300 opacity-50 cursor-not-allowed'
                            : activeRole === 'barbeiro'
                            ? 'bg-white border-[#e2dcce] cursor-default'
                            : 'bg-white border-[#e2dcce] hover:border-[#a16a1c] hover:bg-amber-50/50 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                            isPast ? 'bg-stone-200 text-stone-600' : 'bg-amber-100 text-[#a16a1c] border border-amber-300'
                          }`}>
                            {slotTime}
                          </span>
                          <span className="text-xs font-semibold text-stone-600">
                            {isPast ? 'Passado' : 'Disponível'}
                          </span>
                        </div>

                        {!isPast && activeRole !== 'barbeiro' && (
                          <span className="text-[10px] font-bold text-[#a16a1c] bg-amber-50 border border-amber-300 px-2 py-1 rounded-lg group-hover:bg-[#a16a1c] group-hover:text-white transition-all flex items-center gap-1">
                            <Plus className="w-3 h-3" />
                            Agendar
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: LISTA DE AGENDAMENTOS COM FILTROS                                  */}
      {/* ========================================================================= */}
      {viewMode === 'lista' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3.5 rounded-2xl border border-[#e2dcce] shadow-2xs">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente, barbeiro ou serviço..."
                className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-stone-900 placeholder:text-stone-500 focus:outline-none focus:border-[#a16a1c]"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#a16a1c]"
              >
                <option value="todos">Status: Todos</option>
                <option value="agendado">Status: Agendado</option>
                <option value="confirmado">Status: Confirmado</option>
                <option value="em_atendimento">Status: Em Atendimento</option>
                <option value="finalizado">Status: Finalizado</option>
                <option value="cancelado">Status: Cancelado</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#a16a1c]"
              >
                <option value="todos">Data: Todas as Datas</option>
                <option value="hoje">Data: Somente Hoje</option>
                <option value="futuro">Data: De Hoje em Diante</option>
              </select>
            </div>

            {/* Barber Filter (Only visible if Dono) */}
            {activeRole === 'dono' ? (
              <div>
                <select
                  value={barberFilter}
                  onChange={(e) => setBarberFilter(e.target.value)}
                  className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                >
                  <option value="todos">Barbeiro: Todos os Barbeiros</option>
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center text-xs font-semibold text-stone-700 px-3">
                <span>Mostrando {filteredAppointments.length} agendamentos</span>
              </div>
            )}
          </div>

          {/* Appointment Cards */}
          <div className="space-y-3">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-2xl border border-[#e2dcce] bg-white hover:border-[#a16a1c] transition-all shadow-xs"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Date, Time & Main info */}
                    <div className="flex items-start space-x-3.5">
                      <div className="px-3 py-2 rounded-xl bg-[#f8f5ee] border border-[#e2dcce] text-center min-w-[75px] shadow-2xs">
                        <span className="text-xs font-black text-[#a16a1c] block">{apt.time}</span>
                        <span className="text-[10px] font-bold text-stone-600 block mt-0.5">
                          {apt.date.split('-').reverse().slice(0, 2).join('/')}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <h3 className="text-sm font-black text-stone-900">{apt.clientName}</h3>
                          {getStatusBadge(apt.status)}
                        </div>
                        <p className="text-xs font-bold text-[#a16a1c] mt-0.5">
                          {apt.serviceName} • R$ {apt.servicePrice.toFixed(2)}
                        </p>
                        <div className="flex items-center space-x-3 text-[11px] font-semibold text-stone-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Scissors className="w-3 h-3 text-stone-500" />
                            Barbeiro: <strong className="text-stone-900">{apt.barberName}</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-stone-500" />
                            {apt.clientPhone}
                          </span>
                        </div>
                        {apt.notes && (
                          <p className="text-[11px] text-stone-700 italic mt-1.5 bg-[#f8f5ee] px-2.5 py-1 rounded-lg border border-[#e2dcce] inline-block font-medium">
                            Obs: {apt.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center space-x-2 self-end md:self-center flex-wrap gap-y-2">
                      {/* WhatsApp Quick Link */}
                      <a
                        href={`https://wa.me/55${apt.clientPhone.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(apt.clientName)}%2C%20falando%20do%20Studio%20AUDAX%20sobre%20seu%20hor%C3%A1rio%20de%20${encodeURIComponent(apt.serviceName)}%20dia%20${apt.date}%20%C3%A0s%20${apt.time}!`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-300 text-xs font-bold transition-colors"
                        title="Mandar WhatsApp"
                      >
                        <Phone className="w-4 h-4" />
                      </a>

                      {/* Status buttons according to RBAC */}
                      {canUpdateStatus && apt.status !== 'finalizado' && apt.status !== 'cancelado' && (
                        <div className="flex items-center space-x-1.5">
                          {apt.status === 'agendado' && (
                            <button
                              onClick={() => updateAppointmentStatus(apt.id, 'confirmado')}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors"
                            >
                              Confirmar
                            </button>
                          )}
                          {apt.status !== 'em_atendimento' && (
                            <button
                              onClick={() => updateAppointmentStatus(apt.id, 'em_atendimento')}
                              className="px-2.5 py-1.5 rounded-lg bg-[#a16a1c] hover:bg-[#8c5a15] text-white text-xs font-bold transition-colors flex items-center space-x-1"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                              <span>Em Cadeira</span>
                            </button>
                          )}
                          {apt.status === 'em_atendimento' && (
                            <button
                              onClick={() => updateAppointmentStatus(apt.id, 'finalizado')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors flex items-center space-x-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Concluir</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Reagendar */}
                      {(canEditAny || (activeRole === 'cliente' && apt.status !== 'finalizado')) && (
                        <button
                          onClick={() => handleOpenReschedule(apt)}
                          className="px-2.5 py-1.5 rounded-lg border border-[#e2dcce] bg-[#f8f5ee] hover:bg-[#eae3d5] text-stone-800 text-xs font-bold transition-colors flex items-center space-x-1"
                          title="Reagendar Data e Hora"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Reagendar</span>
                        </button>
                      )}

                      {/* Cancelar */}
                      {apt.status !== 'cancelado' && apt.status !== 'finalizado' && (
                        <button
                          onClick={() => cancelAppointment(apt.id, 'Cancelado via painel')}
                          className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-colors"
                          title="Cancelar Agendamento"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}

                      {/* Delete (Apenas Dono) */}
                      {canEditAny && (
                        <button
                          onClick={() => deleteAppointment(apt.id)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-rose-700 hover:bg-rose-50 text-xs transition-colors"
                          title="Excluir Registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center rounded-2xl border border-[#e2dcce] bg-white shadow-2xs">
                <Calendar className="w-10 h-10 mx-auto text-stone-400 mb-2" />
                <p className="text-base font-black text-stone-900">Nenhum agendamento encontrado</p>
                <p className="text-xs text-stone-600 font-semibold mt-1 max-w-sm mx-auto">
                  Não encontramos nenhum horário com os filtros atuais.
                </p>
                <button
                  onClick={() => onOpenNewAppointment(undefined, selectedAgendaDate)}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs transition-colors shadow-md"
                >
                  Criar Novo Agendamento
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#e2dcce] bg-white p-6 shadow-2xl text-stone-900">
            <h3 className="text-base font-black text-stone-900">Reagendar Atendimento</h3>
            <p className="text-xs text-stone-700 font-semibold mt-1">
              Cliente: <strong className="text-stone-900">{rescheduleApt.clientName}</strong>
            </p>
            <p className="text-xs text-stone-700 font-semibold">
              Barbeiro: <strong className="text-stone-900">{rescheduleApt.barberName}</strong>
            </p>

            {rescheduleError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-700" />
                <span>{rescheduleError}</span>
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-900 block mb-1">Nova Data</label>
                <input
                  type="date"
                  value={newDate}
                  min={todayStr}
                  onChange={(e) => {
                    setNewDate(e.target.value);
                    setRescheduleError(null);
                  }}
                  className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-sm font-bold text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-900 block mb-1">Novo Horário</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => {
                    setNewTime(e.target.value);
                    setRescheduleError(null);
                  }}
                  className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-sm font-bold text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 mt-6">
              <button
                onClick={() => setRescheduleApt(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-stone-600 hover:text-stone-900"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmReschedule}
                className="px-4 py-2 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs shadow-md transition-colors"
              >
                Salvar Novo Horário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
