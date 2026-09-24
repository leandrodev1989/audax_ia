import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  Scissors,
  Crown,
  User as UserIcon,
  LogOut,
  Moon,
  Sun,
  Shield,
  Repeat,
  Menu,
  X,
  Sparkles,
  Phone,
  CheckCircle2,
  Database,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import { useBarberData } from '../../context/BarberDataContext';
import { SupabaseStatusModal } from '../common/SupabaseStatusModal';

interface NavbarProps {
  onOpenNewAppointment: () => void;
  onOpenAuthModal: () => void;
  onOpenProfileModal: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewAppointment,
  onOpenAuthModal,
  onOpenProfileModal,
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
}) => {
  const { currentUser, activeRole, setActiveRole, logout, loginAsDemoUser, users } = useAuth();
  const { supabaseStatus, syncWithSupabase, isFeatureVisibleForRole } = useBarberData();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showDemoUserMenu, setShowDemoUserMenu] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSyncingDirectly, setIsSyncingDirectly] = useState(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  // Manipulador do botão Supabase: Dono abre a modal detalhada; Cliente e Barbeiro chamam diretamente a lógica de Sincronizar Agora
  const handleSupabaseClick = async () => {
    if (activeRole === 'dono') {
      setShowSupabaseModal(true);
      return;
    }

    // Cliente e Barbeiro: NÃO abre a popup; aciona a lógica de sincronização diretamente
    if (isSyncingDirectly || supabaseStatus.isSyncing) return;
    setIsSyncingDirectly(true);
    setSyncToastMessage('Sincronizando dados com o Supabase...');

    try {
      await syncWithSupabase();
      setSyncToastMessage('Sincronizado com sucesso com o Supabase!');
      setTimeout(() => {
        setSyncToastMessage(null);
      }, 3500);
    } catch (err: any) {
      setSyncToastMessage('Erro ao sincronizar com o Supabase. Tente novamente.');
      setTimeout(() => {
        setSyncToastMessage(null);
      }, 3500);
    } finally {
      setIsSyncingDirectly(false);
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'dono':
        return { label: 'Barbeiro Dono', icon: Crown, color: 'text-amber-900 bg-amber-100/80 border-amber-300 font-bold' };
      case 'barbeiro':
        return { label: 'Barbeiro', icon: Scissors, color: 'text-blue-900 bg-blue-100/80 border-blue-300 font-bold' };
      case 'cliente':
        return { label: 'Cliente', icon: UserIcon, color: 'text-emerald-900 bg-emerald-100/80 border-emerald-300 font-bold' };
    }
  };

  const currentRoleInfo = getRoleLabel(activeRole);
  const RoleIcon = currentRoleInfo.icon;

  // Se o usuário logado for Dono, permite alternar livremente entre Dono, Barbeiro e Cliente para testes
  const switchableRoles: UserRole[] = currentUser?.roles.includes('dono')
    ? ['dono', 'barbeiro', 'cliente']
    : currentUser?.roles || [];

  return (
    <header className="sticky top-0 z-40 border-b border-[#e2dcce] bg-white/95 backdrop-blur-md transition-colors shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center space-x-3 text-left focus:outline-none group"
            id="brand-logo-btn"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#b47d28] via-[#a16a1c] to-[#875313] shadow-md shadow-amber-800/10 group-hover:scale-105 transition-transform">
              <Crown className="h-5 w-5 text-amber-100 fill-amber-100/20 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-display text-lg font-black tracking-wider text-stone-900">
                  STUDIO <span className="text-[#a16a1c]">AUDAX</span>
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Center: Multi-Role Switcher */}
        {currentUser && (
          <div className="hidden md:flex items-center space-x-2">
            {switchableRoles.length > 1 ? (
              <div className="flex items-center bg-[#f4efe4] border border-[#e2dcce] rounded-xl p-1 shadow-xs">
                <span className="text-[11px] text-stone-700 font-bold px-2 flex items-center gap-1">
                  <Repeat className="w-3 h-3 text-[#a16a1c]" />
                  Alternar Visão:
                </span>
                <div className="flex items-center space-x-1">
                  {switchableRoles.map((role) => {
                    const info = getRoleLabel(role);
                    const Icon = info.icon;
                    const isActive = activeRole === role;
                    return (
                      <button
                        key={role}
                        onClick={() => setActiveRole(role)}
                        id={`switch-role-${role}`}
                        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-[#a16a1c] text-white shadow-xs font-bold scale-[1.02]'
                            : 'text-stone-700 hover:text-stone-950 hover:bg-[#eae3d5]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{role === 'dono' ? 'Dono' : role === 'barbeiro' ? 'Barbeiro' : 'Cliente'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${currentRoleInfo.color}`}>
                <RoleIcon className="w-3.5 h-3.5" />
                <span>Perfil: {currentRoleInfo.label}</span>
              </div>
            )}
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center space-x-2.5">
          {/* Supabase Status & Sync Button (Controlado pelo Dono via Visibilidade) */}
          {isFeatureVisibleForRole('supabaseStatus', activeRole) && (
            <div className="relative">
              <button
                onClick={handleSupabaseClick}
                disabled={isSyncingDirectly || supabaseStatus.isSyncing}
                id="supabase-status-btn"
                className={`flex items-center space-x-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all ${
                  isSyncingDirectly || supabaseStatus.isSyncing
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-950 opacity-90 cursor-wait'
                    : syncToastMessage?.includes('sucesso')
                    ? 'bg-emerald-200 border-emerald-500 text-emerald-950 font-black'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-400 shadow-2xs'
                }`}
                title={
                  activeRole === 'dono'
                    ? 'Status da conexão Supabase (Abrir Painel Completo)'
                    : 'Sincronizar agora seus dados com o Supabase'
                }
              >
                {isSyncingDirectly || supabaseStatus.isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
                ) : syncToastMessage?.includes('sucesso') ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                ) : (
                  <Database className="w-3.5 h-3.5 text-emerald-700" />
                )}
                <span className="hidden sm:inline">
                  {activeRole === 'dono'
                    ? 'Supabase'
                    : isSyncingDirectly || supabaseStatus.isSyncing
                    ? 'Sincronizando...'
                    : syncToastMessage?.includes('sucesso')
                    ? 'Sincronizado!'
                    : 'Sincronizar Agora'}
                </span>
                <span className="sm:hidden">
                  {isSyncingDirectly || supabaseStatus.isSyncing
                    ? 'Sync...'
                    : activeRole === 'dono'
                    ? 'Supabase'
                    : 'Sincronizar'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              </button>

              {/* Toast flutuante de feedback para Cliente e Barbeiro */}
              {activeRole !== 'dono' && syncToastMessage && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-emerald-300 bg-white p-2.5 shadow-xl z-50 text-xs font-bold text-emerald-950 flex items-center gap-2 animate-in fade-in">
                  {isSyncingDirectly ? (
                    <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
                  ) : syncToastMessage.includes('sucesso') ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Database className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span className="leading-tight">{syncToastMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Fast Switch User / Demo Personas Button (Controlado pelo Dono via Visibilidade) */}
          {isFeatureVisibleForRole('testProfiles', activeRole) && (
            <div className="relative">
              <button
                onClick={() => setShowDemoUserMenu(!showDemoUserMenu)}
                id="demo-user-selector-btn"
                className="flex items-center space-x-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors"
                title="Trocar usuário demo para testar RBAC e múltiplos perfis"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#a16a1c]" />
                <span className="hidden sm:inline">Testar Perfis (RBAC)</span>
                <span className="sm:hidden">Perfis</span>
              </button>

              {showDemoUserMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-[#e2dcce] bg-white p-2 shadow-xl z-50 text-xs">
                  <div className="px-2.5 py-2 border-b border-[#e2dcce]">
                    <p className="font-bold text-stone-900 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#a16a1c]" />
                      Simular Contas & RBAC
                    </p>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      Selecione para testar instantaneamente as permissões de cada perfil:
                    </p>
                  </div>
                  <div className="py-1 space-y-1">
                    {users.map((u) => {
                      const isCurrent = currentUser?.id === u.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            loginAsDemoUser(u.id);
                            setShowDemoUserMenu(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                            isCurrent
                              ? 'bg-amber-50 text-amber-950 border border-amber-300 font-bold'
                              : 'hover:bg-stone-100 text-stone-800'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-7 h-7 rounded-full object-cover border border-stone-300"
                            />
                            <div>
                              <p className="font-bold text-stone-900">{u.name}</p>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {u.roles.map((r) => (
                                  <span
                                    key={r}
                                    className="text-[9px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 font-semibold border border-stone-200"
                                  >
                                    {r === 'dono' ? '👑 Dono' : r === 'barbeiro' ? '✂️ Barbeiro' : '👤 Cliente'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          {isCurrent && <CheckCircle2 className="w-4 h-4 text-[#a16a1c]" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Direct link to Visibility Management - EXCLUSIVO DO DONO */}
                  {activeRole === 'dono' && (
                    <div className="pt-2 mt-1 border-t border-[#e2dcce]">
                      <button
                        onClick={() => {
                          setActiveTab('gerenciar-visibilidade');
                          setShowDemoUserMenu(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs transition-colors border border-amber-300"
                      >
                        <span className="flex items-center gap-1.5">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-[#a16a1c]" />
                          Governança
                        </span>
                        <span className="text-[10px] bg-amber-200 px-1.5 py-0.5 rounded font-black">
                          Dono
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* New Appointment CTA */}
          {activeRole !== 'barbeiro' && (
            <button
              onClick={onOpenNewAppointment}
              id="nav-new-appointment-btn"
              className="flex items-center space-x-1.5 rounded-lg bg-[#a16a1c] hover:bg-[#8c5a15] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Agendar Horário</span>
              <span className="sm:hidden">Agendar</span>
            </button>
          )}

          {/* User Profile Avatar / Logout */}
          {currentUser ? (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={onOpenProfileModal}
                id="user-profile-btn"
                className="flex items-center space-x-2 rounded-xl border border-[#e2dcce] bg-white p-1.5 hover:border-stone-400 transition-colors shadow-xs"
                title="Meu Perfil e Configurações"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg object-cover border border-amber-400"
                />
                <span className="hidden md:block text-xs font-bold text-stone-900 max-w-[100px] truncate">
                  {currentUser.name}
                </span>
              </button>

              <button
                onClick={logout}
                id="nav-logout-btn"
                className="p-2 rounded-xl border border-[#e2dcce] bg-white hover:bg-rose-50 hover:border-rose-300 text-stone-600 hover:text-rose-700 transition-colors shadow-xs"
                title="Sair da Conta (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              id="nav-login-btn"
              className="rounded-lg border border-[#e2dcce] bg-white px-3 py-1.5 text-xs font-bold text-stone-900 hover:bg-stone-50 transition-colors"
            >
              Entrar
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            id="mobile-menu-toggle"
            className="md:hidden rounded-lg p-1.5 text-stone-700 hover:bg-stone-100 hover:text-stone-950"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#e2dcce] bg-white px-4 pt-3 pb-5 space-y-3">
          {currentUser && (
            <div className="p-3 bg-[#f5f2eb] rounded-xl border border-[#e2dcce] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <img src={currentUser.avatar} alt={currentUser.name} className="w-9 h-9 rounded-full object-cover border border-stone-300" />
                <div>
                  <p className="text-sm font-bold text-stone-900">{currentUser.name}</p>
                  <p className="text-[11px] text-stone-600 font-medium">{currentUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="p-2 text-stone-600 hover:text-rose-700"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mobile Role Switcher */}
          {currentUser && currentUser.roles.length > 1 && (
            <div className="p-2.5 bg-[#f5f2eb] rounded-xl border border-[#e2dcce]">
              <p className="text-[11px] font-bold text-stone-700 mb-2 flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5 text-[#a16a1c]" />
                Alternar Visão Ativa:
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {currentUser.roles.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setActiveRole(r);
                      setMobileMenuOpen(false);
                    }}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 ${
                      activeRole === r
                        ? 'bg-[#a16a1c] text-white'
                        : 'bg-white text-stone-800 border border-[#e2dcce]'
                    }`}
                  >
                    <span>{r === 'dono' ? '👑 Dono' : r === 'barbeiro' ? '✂️ Barbeiro' : '👤 Cliente'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nav links */}
          <div className="space-y-1">
            <button
              onClick={() => {
                onOpenProfileModal();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold text-amber-950 bg-amber-100/80 border border-amber-300"
            >
              <span>👤 Meu Cadastro (Editar Dados)</span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded font-black text-[#a16a1c]">Editar</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-bold ${
                activeTab === 'dashboard' ? 'bg-amber-100 text-amber-950 border border-amber-300' : 'text-stone-800 hover:bg-stone-100'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                setActiveTab('agendamentos');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-bold ${
                activeTab === 'agendamentos' ? 'bg-amber-100 text-amber-950 border border-amber-300' : 'text-stone-800 hover:bg-stone-100'
              }`}
            >
              Agendamentos
            </button>
            {isFeatureVisibleForRole('servicesCatalog', activeRole) && (
              <button
                onClick={() => {
                  setActiveTab('servicos');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-bold ${
                  activeTab === 'servicos' ? 'bg-amber-100 text-amber-950 border border-amber-300' : 'text-stone-800 hover:bg-stone-100'
                }`}
              >
                Serviços & Catálogo
              </button>
            )}
            {isFeatureVisibleForRole('clientList', activeRole) && (
              <button
                onClick={() => {
                  setActiveTab('clientes');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-bold ${
                  activeTab === 'clientes' ? 'bg-amber-100 text-amber-950 border border-amber-300' : 'text-stone-800 hover:bg-stone-100'
                }`}
              >
                Clientes
              </button>
            )}
            <button
              onClick={() => {
                setActiveTab('barbeiros');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-bold ${
                activeTab === 'barbeiros' ? 'bg-amber-100 text-amber-950 border border-amber-300' : 'text-stone-800 hover:bg-stone-100'
              }`}
            >
              Barbeiros
            </button>
            {isFeatureVisibleForRole('aiBooking', activeRole) && (
              <button
                onClick={() => {
                  setActiveTab('ai-booking');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-bold ${
                  activeTab === 'ai-booking' ? 'bg-amber-100 text-amber-950 border border-amber-300' : 'text-stone-800 hover:bg-stone-100'
                }`}
              >
                Validação de Agendamento IA
              </button>
            )}
            {isFeatureVisibleForRole('architectureDocs', activeRole) && (
              <button
                onClick={() => {
                  setActiveTab('arquitetura');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-bold ${
                  activeTab === 'arquitetura' ? 'bg-amber-100 text-amber-950 border border-amber-300' : 'text-stone-800 hover:bg-stone-100'
                }`}
              >
                Arquitetura & Especificação Técnica
              </button>
            )}
            {isFeatureVisibleForRole('supabaseStatus', activeRole) && (
              <button
                onClick={() => {
                  handleSupabaseClick();
                  if (activeRole === 'dono') {
                    setMobileMenuOpen(false);
                  }
                }}
                disabled={isSyncingDirectly}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold text-emerald-900 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isSyncingDirectly ? (
                    <RefreshCw className="w-4 h-4 text-emerald-700 animate-spin" />
                  ) : syncToastMessage?.includes('sucesso') ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Database className="w-4 h-4 text-emerald-700" />
                  )}
                  <span>
                    {activeRole === 'dono'
                      ? 'Status do Banco Supabase'
                      : isSyncingDirectly
                      ? 'Sincronizando com Supabase...'
                      : syncToastMessage || 'Sincronizar com Supabase'}
                  </span>
                </div>
                {activeRole !== 'dono' && (
                  <span className="text-[10px] bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded font-black">
                    Sincronizar
                  </span>
                )}
              </button>
            )}
            {activeRole === 'dono' && (
              <button
                onClick={() => {
                  setActiveTab('gerenciar-visibilidade');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold ${
                  activeTab === 'gerenciar-visibilidade'
                    ? 'bg-amber-100 text-amber-950 border border-amber-300'
                    : 'bg-[#f4efe4] text-stone-900 hover:bg-[#ede5d6] border border-[#e2dcce]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#a16a1c]" />
                  Governança
                </span>
                <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-black">
                  Dono
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Supabase Status & Config Modal */}
      <SupabaseStatusModal
        isOpen={showSupabaseModal}
        onClose={() => setShowSupabaseModal(false)}
      />
    </header>
  );
};
