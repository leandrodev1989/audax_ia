import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBarberData } from '../../context/BarberDataContext';
import {
  Calendar,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Phone,
  Sparkles,
  MapPin,
  CalendarCheck,
} from 'lucide-react';
import { Appointment } from '../../types';

interface ClientDashboardProps {
  onOpenNewAppointment: () => void;
  onViewAppointments: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  onOpenNewAppointment,
  onViewAppointments,
}) => {
  const { currentUser } = useAuth();
  const { getVisibleAppointments, cancelAppointment, barbers, services } = useBarberData();

  const userAppointments = getVisibleAppointments();

  // Find next upcoming appointment
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingAppointments = userAppointments
    .filter((a) => a.date >= todayStr && a.status !== 'cancelado' && a.status !== 'finalizado')
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const nextAppointment: Appointment | undefined = upcomingAppointments[0];

  const pastAppointments = userAppointments
    .filter((a) => a.status === 'finalizado' || a.date < todayStr)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
    .slice(0, 5);

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmado':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">Confirmado</span>;
      case 'em_atendimento':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300 animate-pulse">Em Atendimento</span>;
      case 'finalizado':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-800 border border-stone-300">Concluído</span>;
      case 'cancelado':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">Cancelado</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">Agendado</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#e2dcce] bg-gradient-to-r from-white via-[#fbf8f2] to-[#f5efe4] p-6 md:p-8 shadow-2xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-950 border border-amber-300 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#a16a1c]" />
              <span>Painel Exclusivo do Cliente</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-stone-950">
              Olá, <span className="text-[#a16a1c]">{currentUser?.name || 'Cliente'}</span>
            </h1>
            <p className="mt-1 text-sm text-stone-700 font-medium max-w-xl leading-relaxed">
              Agende seus cortes com rapidez, escolha seu barbeiro de confiança e acompanhe seus horários em tempo real.
            </p>
          </div>

          <button
            onClick={onOpenNewAppointment}
            id="client-dash-book-btn"
            className="flex items-center justify-center space-x-2 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* Grid: Next Appointment & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Appointment Card (Col Span 2) */}
        <div className="lg:col-span-2 rounded-2xl border border-[#e2dcce] bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#e2dcce] pb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-amber-100 text-[#a16a1c]">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-950">Próximo Agendamento</h2>
                <p className="text-xs text-stone-600 font-semibold">Seu horário confirmado na barbearia</p>
              </div>
            </div>
            {nextAppointment && getStatusBadge(nextAppointment.status)}
          </div>

          {nextAppointment ? (
            <div className="mt-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#f8f5ee] border border-[#e2dcce]">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#a16a1c]">
                    Serviço Solicitado
                  </span>
                  <h3 className="text-lg font-black text-stone-950">{nextAppointment.serviceName}</h3>
                  <p className="text-xs text-stone-700 font-medium">
                    Duração estimada: ~{nextAppointment.durationMinutes} minutos • R${' '}
                    {nextAppointment.servicePrice.toFixed(2)}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="inline-flex items-center space-x-1.5 text-stone-900 font-bold text-base">
                    <Calendar className="w-4 h-4 text-[#a16a1c]" />
                    <span>{nextAppointment.date.split('-').reverse().join('/')}</span>
                  </div>
                  <div className="flex items-center sm:justify-end space-x-1 text-[#a16a1c] font-black text-lg">
                    <Clock className="w-4 h-4" />
                    <span>{nextAppointment.time}</span>
                  </div>
                </div>
              </div>

              {/* Barber Info */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#e2dcce] shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-[#a16a1c] flex items-center justify-center font-bold">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-600 font-semibold">Profissional Responsável</p>
                    <p className="text-sm font-bold text-stone-950">{nextAppointment.barberName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-xs text-stone-600 font-bold">
                  <MapPin className="w-3.5 h-3.5 text-[#a16a1c]" />
                  <span className="hidden sm:inline">Studio AUDAX Lounge</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => cancelAppointment(nextAppointment.id, 'Cancelado pelo cliente no painel')}
                  className="px-4 py-2 rounded-lg border border-stone-300 bg-stone-50 hover:border-rose-300 hover:bg-rose-50 text-xs font-bold text-stone-700 hover:text-rose-800 transition-colors"
                >
                  Cancelar Horário
                </button>
                <a
                  href={`https://wa.me/5511987654321?text=Ol%C3%A1%2C%20tenho%20agendamento%20dia%20${nextAppointment.date}%20%C3%A0s%20${nextAppointment.time}%20no%20Studio%20AUDAX!`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-xs font-bold text-white transition-colors flex items-center space-x-1.5 shadow-2xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Avisar no WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center text-center py-10 px-4">
              <div className="w-12 h-12 rounded-full bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-600 mb-3">
                <Calendar className="w-6 h-6 text-[#a16a1c]" />
              </div>
              <p className="text-base font-bold text-stone-950">Nenhum agendamento futuro</p>
              <p className="text-xs text-stone-600 font-medium mt-1 max-w-sm">
                Você não possui nenhum horário marcado no momento. Que tal renovar seu corte de cabelo ou alinhar a barba?
              </p>
              <button
                onClick={onOpenNewAppointment}
                className="mt-4 flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs transition-all shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Escolher Barbeiro e Horário</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Loyalty & Barbers Summary */}
        <div className="space-y-6">
          {/* Loyalty Club Card */}
          <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50/90 to-[#f6f2e9] p-6 relative overflow-hidden shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#a16a1c]">
                Clube Fidelidade
              </span>
              <span className="text-[11px] font-bold text-stone-700">Nível Ouro</span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-black text-stone-950">{pastAppointments.length}</span>
                <span className="text-xs text-stone-600 font-bold">/ 10 cortes</span>
              </div>
              <p className="text-xs text-stone-700 font-medium mt-1">
                Faltam {Math.max(0, 10 - (pastAppointments.length % 10))} agendamentos para você ganhar um corte gratuito!
              </p>
            </div>
            {/* Progress bar */}
            <div className="mt-4 w-full bg-stone-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#a16a1c] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((pastAppointments.length % 10) / 10) * 100)}%` }}
              />
            </div>
          </div>

          {/* Barbers available */}
          <div className="rounded-2xl border border-[#e2dcce] bg-white p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-stone-950 mb-3 flex items-center justify-between">
              <span>Barbeiros Disponíveis</span>
              <button
                onClick={onViewAppointments}
                className="text-xs text-[#a16a1c] hover:underline flex items-center gap-1 font-bold"
              >
                <span>Ver agenda</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </h3>
            <div className="space-y-3">
              {barbers.slice(0, 3).map((barber) => (
                <div
                  key={barber.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#f8f5ee] border border-[#e2dcce]"
                >
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={barber.photo}
                      alt={barber.name}
                      className="w-9 h-9 rounded-full object-cover border border-stone-300"
                    />
                    <div>
                      <p className="text-xs font-bold text-stone-950">{barber.name}</p>
                      <p className="text-[11px] text-stone-600 font-medium truncate max-w-[130px]">
                        {barber.specialties[0]}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onOpenNewAppointment}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-[#a16a1c] hover:text-white text-amber-950 border border-amber-300 text-[11px] font-bold transition-colors"
                  >
                    Agendar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Appointment History */}
      <div className="rounded-2xl border border-[#e2dcce] bg-white p-6 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#e2dcce] pb-4">
          <div>
            <h3 className="text-base font-bold text-stone-950">Histórico de Cortes e Atendimentos</h3>
            <p className="text-xs text-stone-600 font-semibold">Seus registros anteriores no Studio AUDAX</p>
          </div>
          <button
            onClick={onViewAppointments}
            className="text-xs font-bold text-[#a16a1c] hover:underline flex items-center space-x-1"
          >
            <span>Ver todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {pastAppointments.length > 0 ? (
          <div className="mt-4 divide-y divide-stone-200">
            {pastAppointments.map((apt) => (
              <div key={apt.id} className="py-3.5 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-amber-100 text-[#a16a1c]">
                    <Scissors className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-950">{apt.serviceName}</p>
                    <p className="text-xs text-stone-600 font-medium">
                      Barbeiro: <span className="text-stone-900 font-bold">{apt.barberName}</span> • {apt.date.split('-').reverse().join('/')} às {apt.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs font-black text-stone-950">
                    R$ {apt.servicePrice.toFixed(2)}
                  </span>
                  {getStatusBadge(apt.status)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-600 font-medium mt-4 text-center py-6">
            Nenhum histórico anterior registrado ainda. Seus atendimentos concluídos aparecerão aqui.
          </p>
        )}
      </div>
    </div>
  );
};
