import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBarberData } from '../../context/BarberDataContext';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Scissors,
  Sparkles,
  Settings,
  Layers,
  Clock,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Tag,
  UserCheck,
  Edit,
  SlidersHorizontal,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewAppointment: () => void;
  onOpenProfileModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewAppointment,
  onOpenProfileModal,
}) => {
  const { activeRole, currentUser } = useAuth();
  const { stats, appointments, services, isFeatureVisibleForRole } = useBarberData();

  // Navigation items based on RBAC and Owner visibility settings
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['dono', 'barbeiro', 'cliente'],
      badge: null,
      isVisible: true,
    },
    {
      id: 'agendamentos',
      label: 'Agendamentos',
      icon: CalendarDays,
      roles: ['dono', 'barbeiro', 'cliente'],
      badge: stats.todayAppointments > 0 ? `${stats.todayAppointments} hoje` : null,
      badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
      isVisible: true,
    },
    {
      id: 'servicos',
      label: 'Serviços & Catálogo',
      icon: Tag,
      roles: ['dono', 'barbeiro', 'cliente'],
      badge: `${services.filter((s) => s.isActive !== false).length} ativos`,
      badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold',
      isVisible: isFeatureVisibleForRole('servicesCatalog', activeRole),
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: Users,
      roles: ['dono', 'barbeiro', 'cliente'],
      badge: stats.totalClients > 0 ? stats.totalClients : null,
      badgeColor: 'bg-stone-200/80 text-stone-800 font-bold',
      isVisible: isFeatureVisibleForRole('clientList', activeRole),
    },
    {
      id: 'barbeiros',
      label: 'Equipe de Barbeiros',
      icon: Scissors,
      roles: ['dono', 'cliente'],
      badge: stats.activeBarbers > 0 ? `${stats.activeBarbers} ativos` : null,
      badgeColor: 'bg-blue-100 text-blue-900 border border-blue-300 font-bold',
      isVisible: activeRole === 'dono' || activeRole === 'cliente',
    },
    {
      id: 'ai-booking',
      label: 'Validação de Agendamento IA',
      icon: Sparkles,
      roles: ['dono', 'barbeiro', 'cliente'],
      badge: 'IA & Motor AUDAX',
      badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
      isVisible: isFeatureVisibleForRole('aiBooking', activeRole),
    },
    {
      id: 'arquitetura',
      label: 'Arquitetura & SaaS Docs',
      icon: Layers,
      roles: ['dono', 'barbeiro', 'cliente'],
      badge: 'BFF & ERD',
      badgeColor: 'bg-purple-100 text-purple-900 border border-purple-300 font-bold',
      isVisible: isFeatureVisibleForRole('architectureDocs', activeRole),
    },
    {
      id: 'gerenciar-visibilidade',
      label: 'Governança',
      icon: SlidersHorizontal,
      roles: ['dono'],
      badge: null,
      badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
      isVisible: activeRole === 'dono',
    },
  ];

  // Filter items by current active role and visibility setting
  const visibleNav = navItems.filter(
    (item) => item.roles.includes(activeRole) && item.isVisible
  );

  return (
    <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-[#e2dcce] bg-white p-4 transition-colors shadow-xs">
      <div className="space-y-5">
        {/* Active Role Indicator Card */}
        <div className="rounded-xl border border-[#e2dcce] bg-[#f5f2eb] p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
              Nível de Acesso
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                activeRole === 'dono'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : activeRole === 'barbeiro'
                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}
            >
              {activeRole === 'dono' ? 'Barbeiro Dono' : activeRole === 'barbeiro' ? 'Barbeiro' : 'Cliente'}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-stone-700 font-medium">
            {activeRole === 'dono' && 'Visão Executiva: Acesso total a agendamentos, equipe, clientes e métricas.'}
            {activeRole === 'barbeiro' && 'Visão Operacional: Seus agendamentos diários, clientes e comissões.'}
            {activeRole === 'cliente' && 'Visão Cliente: Seus agendamentos, histórico de cortes e novo pedido.'}
          </p>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1.5">
          <span className="px-3 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
            Menu Principal
          </span>
          <div className="mt-2 space-y-1">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  id={`sidebar-link-${item.id}`}
                  title={item.id === 'gerenciar-visibilidade' ? 'Governança: Gerenciar visibilidade de botões e acessos' : undefined}
                  className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-[#eee6d8] text-stone-950 font-bold border-l-4 border-[#a16a1c] shadow-2xs'
                      : 'text-stone-700 hover:bg-[#f5f0e6] hover:text-stone-950'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? 'text-[#a16a1c]' : 'text-stone-600 group-hover:text-stone-900'
                      }`}
                    />
                    {item.id === 'gerenciar-visibilidade' ? (
                      <span className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                        Governança
                      </span>
                    ) : (
                      <span>{item.label}</span>
                    )}
                  </div>
                  {item.badge && item.id !== 'gerenciar-visibilidade' && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Bottom Quick Section: Meu Cadastro & Agendar Rápido */}
      <div className="space-y-3 pt-4 border-t border-[#e2dcce]">
        {/* Option: Meu Cadastro */}
        {currentUser && (
          <button
            onClick={onOpenProfileModal}
            id="sidebar-meu-cadastro-btn"
            className="w-full text-left rounded-xl border border-[#e2dcce] bg-[#f8f5ee] hover:bg-[#eee6d8] hover:border-[#a16a1c] p-3 shadow-2xs transition-all group"
            title="Clique para editar seu cadastro, foto e senha"
          >
            <div className="flex items-center space-x-2.5">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-9 h-9 rounded-xl object-cover border-2 border-[#a16a1c] shrink-0 shadow-2xs"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-stone-900 truncate group-hover:text-[#a16a1c] transition-colors">
                    {currentUser.name}
                  </p>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    Editar
                  </span>
                </div>
                <p className="text-[10px] text-stone-600 font-medium truncate mt-0.5">
                  {currentUser.email}
                </p>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-[#e2dcce] flex items-center justify-between text-[11px] font-bold text-[#a16a1c]">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                <span>Meu Cadastro (Editar Dados)</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        )}

        {/* Card do Studio & Agendar Rápido */}
        <div className="rounded-xl border border-[#e2dcce] bg-gradient-to-b from-[#f6f2e9] to-[#ebd2af]/20 p-3.5 shadow-2xs">
          <div className="flex items-center space-x-2 text-[#a16a1c]">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold text-stone-900">Studio AUDAX Lounge</span>
          </div>
          <p className="mt-1 text-[11px] text-stone-700 font-medium leading-relaxed">
            Terça a Sábado das 09h às 20h. Agendamento simplificado em tempo real.
          </p>
          <button
            onClick={onOpenNewAppointment}
            className="mt-3 w-full rounded-lg bg-[#a16a1c] hover:bg-[#8c5a15] py-2 text-xs font-bold text-white transition-colors flex items-center justify-center space-x-1.5 shadow-xs"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>+ Agendar Rápido</span>
          </button>
        </div>

        <div className="flex items-center justify-between px-2 text-[11px] text-stone-600 font-bold">
          <span>Studio AUDAX v1.0 MVP</span>
          <span className="text-emerald-700 font-bold">● Online</span>
        </div>
      </div>
    </aside>
  );
};
