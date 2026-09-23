import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBarberData } from '../../context/BarberDataContext';
import {
  Calendar,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  PlayCircle,
  Phone,
  DollarSign,
  TrendingUp,
  Sparkles,
  Check,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { AppointmentStatus, Appointment } from '../../types';

interface BarberDashboardProps {
  onOpenNewAppointment: () => void;
  onViewAppointments: () => void;
}

export const BarberDashboard: React.FC<BarberDashboardProps> = ({
  onOpenNewAppointment,
  onViewAppointments,
}) => {
  const { currentUser } = useAuth();
  const {
    getVisibleAppointments,
    updateAppointmentStatus,
    barbers,
  } = useBarberData();

  // Find linked barber record
  const currentBarber = barbers.find(
    (b) => b.userId === currentUser?.id || b.name.toLowerCase() === currentUser?.name.toLowerCase()
  );

  const appointments = getVisibleAppointments();
  const todayStr = new Date().toISOString().split('T')[0];

  const todayAppointments = appointments
    .filter((a) => a.date === todayStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  const completedToday = todayAppointments.filter((a) => a.status === 'finalizado');
  const inProgress = todayAppointments.find((a) => a.status === 'em_atendimento');
  const pendingOrUpcoming = todayAppointments.filter((a) =>
    ['agendado', 'confirmado'].includes(a.status)
  );

  // Commission calculation
  const commissionRate = (currentBarber?.commissionPercentage || 50) / 100;
  const todayRevenue = completedToday.reduce((sum, a) => sum + (a.servicePrice || 0), 0);
  const estimatedCommission = todayRevenue * commissionRate;

  const handleStatusChange = (id: string, status: AppointmentStatus) => {
    updateAppointmentStatus(id, status);
  };

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmado':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">Confirmado</span>;
      case 'em_atendimento':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300 animate-pulse">Em Cadeira</span>;
      case 'finalizado':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-800 border border-stone-300">Finalizado</span>;
      case 'cancelado':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">Cancelado</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">Agendado</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#e2dcce] bg-gradient-to-r from-white via-[#fbf8f2] to-[#f5efe4] p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <img
              src={currentBarber?.photo || currentUser?.avatar}
              alt={currentUser?.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
            />
            <div>
              <div className="inline-flex items-center space-x-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-900 border border-blue-300 mb-1">
                <Scissors className="w-3 h-3 text-blue-700" />
                <span>Painel do Barbeiro</span>
              </div>
              <h1 className="text-2xl font-black text-stone-950">
                Bancada de <span className="text-[#a16a1c]">{currentUser?.name}</span>
              </h1>
              <p className="text-xs text-stone-700 font-medium mt-0.5">
                Especialidade:{' '}
                <span className="text-stone-900 font-bold">
                  {currentBarber?.specialties.join(', ') || 'Corte & Barba'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Atendimentos Hoje */}
        <div className="rounded-xl border border-[#e2dcce] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-700 text-xs font-bold">
            <span>Agenda de Hoje</span>
            <Calendar className="w-4 h-4 text-blue-700" />
          </div>
          <p className="text-2xl font-black text-stone-950 mt-2">
            {todayAppointments.length}
          </p>
          <p className="text-[11px] text-stone-600 font-semibold mt-1">
            {pendingOrUpcoming.length} pendentes • {completedToday.length} feitos
          </p>
        </div>

        {/* Clientes Atendidos */}
        <div className="rounded-xl border border-[#e2dcce] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-700 text-xs font-bold">
            <span>Atendidos Hoje</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-black text-emerald-800 mt-2">
            {completedToday.length}
          </p>
          <p className="text-[11px] text-stone-600 font-semibold mt-1">Total acumulado: {currentBarber?.totalCuts || 120} cortes</p>
        </div>

        {/* Em Cadeira Agora */}
        <div className="rounded-xl border border-[#e2dcce] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-700 text-xs font-bold">
            <span>Em Atendimento</span>
            <PlayCircle className="w-4 h-4 text-[#a16a1c]" />
          </div>
          <p className="text-xl font-black text-[#a16a1c] mt-2 truncate">
            {inProgress ? inProgress.clientName.split(' ')[0] : 'Bancada Livre'}
          </p>
          <p className="text-[11px] text-stone-600 font-semibold mt-1">
            {inProgress ? inProgress.serviceName : 'Pronto para o próximo'}
          </p>
        </div>

        {/* Comissão Estimada Hoje */}
        <div className="rounded-xl border border-[#e2dcce] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-700 text-xs font-bold">
            <span>Sua Comissão ({currentBarber?.commissionPercentage || 50}%)</span>
            <DollarSign className="w-4 h-4 text-[#a16a1c]" />
          </div>
          <p className="text-2xl font-black text-stone-950 mt-2">
            R$ {estimatedCommission.toFixed(2)}
          </p>
          <p className="text-[11px] text-stone-600 font-semibold mt-1">Faturamento gerado: R$ {todayRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Main Grid: Agenda do dia & Próximos Atendimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule Timeline */}
        <div className="lg:col-span-2 rounded-2xl border border-[#e2dcce] bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#e2dcce] pb-4">
            <div>
              <h2 className="text-base font-bold text-stone-950 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#a16a1c]" />
                <span>Agenda do Dia (Hoje)</span>
              </h2>
              <p className="text-xs text-stone-600 font-semibold">Atendimentos em ordem cronológica</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 border border-stone-200">
              {todayStr.split('-').reverse().join('/')}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {todayAppointments.length > 0 ? (
              todayAppointments.map((apt) => {
                const isUnderway = apt.status === 'em_atendimento';
                return (
                  <div
                    key={apt.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isUnderway
                        ? 'bg-amber-50/80 border-amber-300 shadow-xs ring-1 ring-amber-300'
                        : 'bg-[#f8f5ee] border-[#e2dcce] hover:border-stone-400'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <div className="text-center px-2.5 py-1.5 rounded-lg bg-white border border-[#e2dcce] min-w-[65px] shadow-2xs">
                          <span className="text-xs font-bold text-[#a16a1c] block">{apt.time}</span>
                          <span className="text-[10px] text-stone-600 font-semibold block">{apt.durationMinutes}m</span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-bold text-stone-950">{apt.clientName}</h3>
                            {getStatusBadge(apt.status)}
                          </div>
                          <p className="text-xs font-bold text-[#a16a1c] mt-0.5">
                            {apt.serviceName} • R$ {apt.servicePrice.toFixed(2)}
                          </p>
                          {apt.notes && (
                            <p className="text-[11px] text-stone-700 italic mt-1 bg-white px-2 py-0.5 rounded border border-[#e2dcce] inline-block font-medium">
                              Obs: {apt.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Fast Action Buttons */}
                      <div className="flex items-center space-x-2 self-end sm:self-center">
                        {/* WhatsApp Button */}
                        <a
                          href={`https://wa.me/55${apt.clientPhone.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(apt.clientName)}%2C%20seu%20hor%C3%A1rio%20de%20${encodeURIComponent(apt.serviceName)}%20est%C3%A1%20confirmado%20para%20as%20${apt.time}!`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition-colors"
                          title="Enviar mensagem no WhatsApp"
                        >
                          <Phone className="w-4 h-4 text-emerald-700" />
                        </a>

                        {/* Status Toggle Buttons */}
                        {apt.status !== 'em_atendimento' && apt.status !== 'finalizado' && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'em_atendimento')}
                            className="px-3 py-1.5 rounded-lg bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs flex items-center space-x-1 transition-colors shadow-2xs"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Iniciar</span>
                          </button>
                        )}

                        {apt.status === 'em_atendimento' && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'finalizado')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center space-x-1 transition-colors shadow-2xs"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Finalizar Corte</span>
                          </button>
                        )}

                        {apt.status === 'finalizado' && (
                          <span className="text-xs text-emerald-800 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            Concluído
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center text-stone-600">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-stone-400" />
                <p className="text-sm font-bold text-stone-900">Nenhum atendimento marcado para hoje</p>
                <p className="text-xs text-stone-600 font-medium mt-1">
                  Seus novos clientes ou horários marcados aparecerão aqui em tempo real.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel: Próximos Atendimentos dos Próximos Dias */}
        <div className="rounded-2xl border border-[#e2dcce] bg-white p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#e2dcce] pb-3">
            <div>
              <h3 className="text-sm font-bold text-stone-950">Próximos Dias</h3>
              <p className="text-[11px] text-stone-600 font-semibold">Previsão da semana</p>
            </div>
            <button
              onClick={onViewAppointments}
              className="text-xs text-[#a16a1c] hover:underline font-bold"
            >
              Ver todos
            </button>
          </div>

          <div className="space-y-3">
            {appointments
              .filter((a) => a.date > todayStr && a.status !== 'cancelado')
              .slice(0, 4)
              .map((apt) => (
                <div
                  key={apt.id}
                  className="p-3 rounded-xl bg-[#f8f5ee] border border-[#e2dcce] space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-950">{apt.clientName}</span>
                    <span className="text-[#a16a1c] font-bold">{apt.time}</span>
                  </div>
                  <p className="text-[11px] text-stone-700 font-medium">
                    {apt.serviceName} • {apt.date.split('-').reverse().join('/')}
                  </p>
                </div>
              ))}

            {appointments.filter((a) => a.date > todayStr).length === 0 && (
              <p className="text-xs text-stone-600 font-medium text-center py-6">
                Nenhum agendamento futuro ainda nos próximos dias.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
