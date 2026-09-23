import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBarberData } from '../../context/BarberDataContext';
import {
  Users,
  Scissors,
  Calendar,
  DollarSign,
  TrendingUp,
  Crown,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Phone,
  BarChart3,
  Percent,
} from 'lucide-react';
import { Appointment } from '../../types';

interface OwnerDashboardProps {
  onOpenNewAppointment: () => void;
  onNavigateTab: (tab: string) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  onOpenNewAppointment,
  onNavigateTab,
}) => {
  const { currentUser } = useAuth();
  const { clients, barbers, services, appointments, stats, updateAppointmentStatus } = useBarberData();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => a.date === todayStr);

  // Group services demand
  const serviceStats = services.map((srv) => {
    const count = appointments.filter((a) => a.serviceId === srv.id).length;
    return {
      name: srv.name,
      count,
      revenue: count * srv.price,
    };
  }).sort((a, b) => b.count - a.count);

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmado':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">Confirmado</span>;
      case 'em_atendimento':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-950 border border-amber-300 animate-pulse">Em Atendimento</span>;
      case 'finalizado':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-800 border border-stone-300">Finalizado</span>;
      case 'cancelado':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300">Cancelado</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">Agendado</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#e2dcce] bg-gradient-to-r from-white via-[#fbf8f2] to-[#f5efe4] p-6 md:p-8 shadow-2xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-950 border border-amber-300 mb-2">
              <Crown className="w-3.5 h-3.5 text-[#a16a1c]" />
              <span>Painel Executivo • Barbeiro Dono</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-stone-950">
              Gestão Geral: <span className="text-[#a16a1c]">Studio AUDAX Lounge</span>
            </h1>
            <p className="mt-1 text-sm text-stone-700 font-medium max-w-2xl leading-relaxed">
              Visão macro da operação da barbearia, controle unificado de agendamentos, clientes, barbeiros e projeção de receita.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigateTab('servicos')}
              className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-xs font-bold text-amber-950 transition-colors shadow-2xs"
            >
              + Gerenciar Serviços
            </button>
            <button
              onClick={() => onNavigateTab('clientes')}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 border border-[#e2dcce] text-xs font-bold text-stone-900 transition-colors shadow-2xs"
            >
              + Novo Cliente
            </button>
            <button
              onClick={() => onNavigateTab('barbeiros')}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 border border-[#e2dcce] text-xs font-bold text-stone-900 transition-colors shadow-2xs"
            >
              + Novo Barbeiro
            </button>
            <button
              onClick={onOpenNewAppointment}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Novo Agendamento</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Clientes */}
        <div className="rounded-xl border border-[#e2dcce] bg-white p-4 relative overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between text-stone-700 text-xs font-bold">
            <span>Total Clientes</span>
            <Users className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-black text-stone-950 mt-2">{stats.totalClients}</p>
          <div className="flex items-center space-x-1 mt-1 text-[11px] text-emerald-800 font-bold">
            <TrendingUp className="w-3 h-3" />
            <span>Base ativa e cadastrada</span>
          </div>
        </div>

        {/* Total Barbeiros */}
        <div className="rounded-xl border border-[#e2dcce] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-700 text-xs font-bold">
            <span>Barbeiros Ativos</span>
            <Scissors className="w-4 h-4 text-blue-700" />
          </div>
          <p className="text-2xl font-black text-stone-950 mt-2">
            {stats.activeBarbers} <span className="text-xs text-stone-600 font-medium">/ {barbers.length}</span>
          </p>
          <p className="text-[11px] text-stone-600 font-semibold mt-1">Cadeiras operando</p>
        </div>

        {/* Agendamentos do Dia */}
        <div className="rounded-xl border border-[#e2dcce] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-700 text-xs font-bold">
            <span>Agendamentos Hoje</span>
            <Calendar className="w-4 h-4 text-[#a16a1c]" />
          </div>
          <p className="text-2xl font-black text-[#a16a1c] mt-2">{todayAppointments.length}</p>
          <p className="text-[11px] text-stone-600 font-semibold mt-1">
            {todayAppointments.filter((a) => a.status === 'finalizado').length} concluídos hoje
          </p>
        </div>

        {/* Faturamento Realizado */}
        <div className="rounded-xl border border-[#e2dcce] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-stone-700 text-xs font-bold">
            <span>Receita Realizada</span>
            <DollarSign className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-black text-stone-950 mt-2">
            R$ {stats.realizedRevenue.toFixed(2)}
          </p>
          <p className="text-[11px] text-stone-600 font-semibold mt-1">Cortes já finalizados</p>
        </div>

        {/* Faturamento Futuro (Projetado) */}
        <div className="col-span-2 sm:col-span-1 rounded-xl border border-amber-300 bg-amber-50/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-amber-950 text-xs font-bold">
            <span>Faturamento Futuro</span>
            <Sparkles className="w-4 h-4 text-[#a16a1c]" />
          </div>
          <p className="text-2xl font-black text-[#a16a1c] mt-2">
            R$ {stats.projectedRevenue.toFixed(2)}
          </p>
          <p className="text-[11px] text-stone-700 font-semibold mt-1">Previsão em agendamentos</p>
        </div>
      </div>

      {/* Middle Grid: Equipe de Barbeiros Status & Serviços Mais Pedidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status da Equipe */}
        <div className="rounded-2xl border border-[#e2dcce] bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#e2dcce] pb-3">
            <div>
              <h3 className="text-sm font-bold text-stone-950">Equipe de Barbeiros</h3>
              <p className="text-[11px] text-stone-600 font-semibold">Desempenho e status atual</p>
            </div>
            <button
              onClick={() => onNavigateTab('barbeiros')}
              className="text-xs text-[#a16a1c] hover:underline font-bold"
            >
              Gerenciar
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {barbers.map((barber) => {
              const activeNow = todayAppointments.find(
                (a) => a.barberId === barber.id && a.status === 'em_atendimento'
              );
              const barberTodayCount = todayAppointments.filter((a) => a.barberId === barber.id).length;

              return (
                <div
                  key={barber.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#f8f5ee] border border-[#e2dcce]"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={barber.photo}
                      alt={barber.name}
                      className="w-10 h-10 rounded-full object-cover border border-stone-300"
                    />
                    <div>
                      <p className="text-xs font-bold text-stone-950">{barber.name}</p>
                      <p className="text-[11px] text-stone-700 font-medium">
                        {barberTodayCount} horários hoje • {barber.rating} ⭐
                      </p>
                    </div>
                  </div>

                  <div>
                    {activeNow ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300 animate-pulse">
                        Em Cadeira
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        Disponível
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Serviços Mais Pedidos */}
        <div className="rounded-2xl border border-[#e2dcce] bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#e2dcce] pb-3">
            <div>
              <h3 className="text-sm font-bold text-stone-950">Serviços Mais Procurados</h3>
              <p className="text-[11px] text-stone-600 font-semibold">Distribuição de demanda</p>
            </div>
            <BarChart3 className="w-4 h-4 text-[#a16a1c]" />
          </div>

          <div className="mt-4 space-y-3">
            {serviceStats.slice(0, 4).map((s, idx) => {
              const maxCount = Math.max(...serviceStats.map((item) => item.count), 1);
              const percentage = Math.round((s.count / maxCount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-900 truncate max-w-[180px]">{s.name}</span>
                    <span className="text-[#a16a1c] font-black">{s.count} pedidos</span>
                  </div>
                  <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#a16a1c] h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-[#e2dcce] flex justify-end">
            <button
              onClick={() => onNavigateTab('servicos')}
              className="text-xs font-bold text-[#a16a1c] hover:underline flex items-center space-x-1"
            >
              <span>Gerenciar Catálogo de Serviços</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Operational Summary Card */}
        <div className="rounded-2xl border border-[#e2dcce] bg-gradient-to-b from-white to-[#f6f2e9] p-6 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center space-x-2 text-[#a16a1c] mb-2">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-sm font-bold text-stone-950">Prontidão da Barbearia</h3>
            </div>
            <p className="text-xs text-stone-700 font-medium leading-relaxed">
              O sistema Studio AUDAX está configurado com controle multi-perfil simultâneo, proteção RBAC em tempo real e pronto para escala multi-tenant.
            </p>

            <div className="mt-4 p-3 bg-white rounded-xl border border-[#e2dcce] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-600 font-medium">Horário de Funcionamento:</span>
                <span className="font-bold text-stone-950">09h às 20h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-600 font-medium">Intervalo Padrão:</span>
                <span className="font-bold text-stone-950">30 min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-600 font-medium">Avisos via WhatsApp:</span>
                <span className="font-bold text-emerald-800">Ativado</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('arquitetura')}
            className="mt-4 w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-xs font-bold text-amber-950 transition-colors border border-amber-300 shadow-2xs"
          >
            <span>Ver Arquitetura e Modelagem do Sistema</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Latest Appointments Table */}
      <div className="rounded-2xl border border-[#e2dcce] bg-white p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2dcce] pb-4">
          <div>
            <h2 className="text-base font-bold text-stone-950">Últimos Agendamentos da Barbearia</h2>
            <p className="text-xs text-stone-600 font-semibold">Visualização global de todos os profissionais</p>
          </div>
          <button
            onClick={() => onNavigateTab('agendamentos')}
            className="text-xs font-bold text-[#a16a1c] hover:underline flex items-center space-x-1"
          >
            <span>Abrir Agenda Completa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e2dcce] text-stone-700 font-bold uppercase text-[10px] tracking-wider bg-[#f8f5ee]">
                <th className="py-3 px-3">Cliente</th>
                <th className="py-3 px-3">Barbeiro</th>
                <th className="py-3 px-3">Serviço</th>
                <th className="py-3 px-3">Data & Hora</th>
                <th className="py-3 px-3">Preço</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Ação Dono</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {appointments.slice(0, 6).map((apt) => (
                <tr key={apt.id} className="hover:bg-[#fcfbfa] transition-colors">
                  <td className="py-3 px-3 font-bold text-stone-950">
                    {apt.clientName}
                    <span className="block text-[10px] text-stone-600 font-medium">{apt.clientPhone}</span>
                  </td>
                  <td className="py-3 px-3 text-stone-800 font-semibold">{apt.barberName}</td>
                  <td className="py-3 px-3 text-stone-800 font-semibold">{apt.serviceName}</td>
                  <td className="py-3 px-3">
                    <span className="text-stone-900 font-bold">{apt.date.split('-').reverse().join('/')}</span>
                    <span className="block text-[#a16a1c] font-black">{apt.time}</span>
                  </td>
                  <td className="py-3 px-3 font-black text-stone-950">R$ {apt.servicePrice.toFixed(2)}</td>
                  <td className="py-3 px-3">{getStatusBadge(apt.status)}</td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      {apt.status !== 'finalizado' && apt.status !== 'cancelado' && (
                        <button
                          onClick={() => updateAppointmentStatus(apt.id, 'finalizado')}
                          className="px-2 py-1 rounded bg-stone-100 hover:bg-emerald-600 hover:text-white border border-stone-300 text-stone-900 text-[10px] font-bold transition-colors"
                          title="Finalizar"
                        >
                          Concluir
                        </button>
                      )}
                      {apt.status !== 'cancelado' && apt.status !== 'finalizado' && (
                        <button
                          onClick={() => updateAppointmentStatus(apt.id, 'cancelado')}
                          className="px-2 py-1 rounded bg-stone-100 hover:bg-rose-600 hover:text-white border border-stone-300 text-stone-900 text-[10px] font-bold transition-colors"
                          title="Cancelar"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
