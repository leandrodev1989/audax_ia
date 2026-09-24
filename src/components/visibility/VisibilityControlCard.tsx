import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBarberData } from '../../context/BarberDataContext';
import { UserRole, RoleVisibilitySettings } from '../../types';
import {
  SlidersHorizontal,
  Sparkles,
  Database,
  Users,
  Layers,
  Crown,
  Scissors,
  UserCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  EyeOff,
  ShieldAlert,
  Info,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Tag,
} from 'lucide-react';

interface FeatureItemConfig {
  id: keyof RoleVisibilitySettings;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  location: string;
  allowDonoToggle?: boolean;
}

export const VisibilityControlCard: React.FC<{
  onNavigateTab?: (tab: string) => void;
  isStandalone?: boolean;
}> = ({ onNavigateTab, isStandalone = false }) => {
  const { currentUser, activeRole, setActiveRole } = useAuth();
  const {
    visibilitySettings,
    updateVisibility,
    resetVisibilitySettings,
    isFeatureVisibleForRole,
  } = useBarberData();

  const [savedNotification, setSavedNotification] = useState<string | null>(null);

  // Trava de segurança: Se o perfil ativo não for 'dono', bloqueia exibição da Governança
  if (activeRole !== 'dono') {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center max-w-xl mx-auto my-12 shadow-xs space-y-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-black text-stone-900">
          Acesso Restrito ao Barbeiro Dono
        </h3>
        <p className="text-xs text-stone-600 leading-relaxed">
          A tela de governança e controle de visibilidade de botões é de acesso exclusivo do <strong>Barbeiro Dono</strong>.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigateTab ? onNavigateTab('dashboard') : null}
            className="px-4 py-2 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white text-xs font-bold transition-all shadow-xs"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  const notifyChange = (featureName: string, roleName: string, isVisible: boolean) => {
    setSavedNotification(
      `${featureName} para ${roleName}: ${isVisible ? 'LIBERADO (Visível)' : 'OCULTADO (Invisível)'}`
    );
    setTimeout(() => {
      setSavedNotification(null);
    }, 2600);
  };

  const features: FeatureItemConfig[] = [
    {
      id: 'aiBooking',
      title: 'Botão IA (Validação de Agendamento IA & Motor AUDAX)',
      description:
        'Acesso ao motor de agendamento por linguagem natural, verificação em tempo real de horários e testes multi-provedor (Gemini, Groq, OpenRouter, Motor AUDAX).',
      icon: Sparkles,
      iconBg: 'bg-amber-100',
      iconColor: 'text-[#a16a1c]',
      location: 'Menu Lateral (Sidebar), Menu Mobile e Rota Direta',
      allowDonoToggle: false,
    },
    {
      id: 'supabaseStatus',
      title: 'Botão Supabase (Status & Conexão do Banco de Dados)',
      description:
        'Botão no cabeçalho e menu com indicador visual de sincronização, diagnóstico de latência e persistência em nuvem PostgreSQL.',
      icon: Database,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      location: 'Cabeçalho Superior (Navbar) e Gaveta Mobile',
      allowDonoToggle: true,
    },
    {
      id: 'testProfiles',
      title: 'Botão "Testar Perfis (RBAC)" & Simulador de Contas',
      description:
        'Dropdown com atalhos para simular instantaneamente as contas de Barbeiro Dono, Barbeiros e Clientes cadastrados para validação de segurança.',
      icon: ShieldCheck,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
      location: 'Cabeçalho Superior (Navbar) ao lado do botão Supabase',
      allowDonoToggle: true,
    },
    {
      id: 'architectureDocs',
      title: 'Botão Arquitetura & SaaS Docs (Especificações Técnicas)',
      description:
        'Documentação completa do sistema: Diagrama BFF, ERD relacional, fluxo de decisão da Hybrid Intelligence Layer e auditoria de regras.',
      icon: Layers,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-700',
      location: 'Menu Lateral (Sidebar) e Menu Mobile',
      allowDonoToggle: true,
    },
    {
      id: 'clientList',
      title: 'Módulo de Gestão de Clientes',
      description:
        'Lista completa de clientes cadastrados na barbearia, histórico de agendamentos, WhatsApp e anotações técnicas de corte.',
      icon: Users,
      iconBg: 'bg-stone-200',
      iconColor: 'text-stone-800',
      location: 'Menu Lateral (Sidebar) e Menu Mobile',
      allowDonoToggle: false,
    },
    {
      id: 'servicesCatalog',
      title: 'Catálogo de Serviços & Tabela de Preços',
      description:
        'Visualização do catálogo interativo de serviços, tempos de duração e valores cobrados pela barbearia.',
      icon: Tag,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-800',
      location: 'Menu Lateral (Sidebar) e Menu Mobile',
      allowDonoToggle: false,
    },
  ];

  const handleToggle = (
    featureId: keyof RoleVisibilitySettings,
    role: UserRole,
    currentVal: boolean,
    featureTitle: string
  ) => {
    const newVal = !currentVal;
    updateVisibility(featureId, role, newVal);
    const roleLabel = role === 'dono' ? 'Dono' : role === 'barbeiro' ? 'Barbeiro' : 'Cliente';
    notifyChange(featureTitle, roleLabel, newVal);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-[#e2dcce] bg-gradient-to-r from-white via-[#fbf8f2] to-[#f4ede0] p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-950 border border-amber-300 mb-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#a16a1c]" />
              <span>Painel de Governança • Barbeiro Dono</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-stone-950 tracking-tight">
              Gerenciador de Visibilidade & Acesso aos Botões
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-stone-700 font-medium max-w-3xl leading-relaxed">
              Defina e libere os botões que cada perfil pode enxergar no sistema. Controle o{' '}
              <strong>Botão IA</strong>, <strong>Supabase</strong>, <strong>Testar Perfis (RBAC)</strong> e use o
              simulador integrado para testar o resultado em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                resetVisibilitySettings();
                setSavedNotification('Padrões recomendados restaurados com sucesso!');
                setTimeout(() => setSavedNotification(null), 3000);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#e2dcce] bg-white hover:bg-stone-50 text-xs font-bold text-stone-800 transition-colors shadow-2xs"
              title="Restaurar padrões de fábrica"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
              <span>Restaurar Padrões</span>
            </button>
          </div>
        </div>

        {/* Real-time Save Toast Notification */}
        {savedNotification && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{savedNotification}</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">
              Salvo no Navegador
            </span>
          </div>
        )}
      </div>

      {/* Simulator Section: Testar Perfis em Tempo Real */}
      <div className="rounded-2xl border-2 border-dashed border-[#a16a1c]/40 bg-gradient-to-b from-[#fbf8f2] to-white p-5 md:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2dcce] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#a16a1c] text-white">
                <Eye className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-sm md:text-base font-black text-stone-950">
                🧪 Testar Perfis (Live Simulation)
              </h3>
            </div>
            <p className="text-xs text-stone-600 font-medium mt-0.5">
              Alterne instantaneamente a visualização para conferir com seus próprios olhos quais botões e abas aparecem:
            </p>
          </div>

          <div className="text-xs font-bold px-2.5 py-1 rounded-full border bg-white text-stone-800 border-[#e2dcce]">
            Visão Ativa no Momento:{' '}
            <span
              className={`font-black uppercase tracking-wider ${
                activeRole === 'dono'
                  ? 'text-[#a16a1c]'
                  : activeRole === 'barbeiro'
                  ? 'text-blue-700'
                  : 'text-emerald-700'
              }`}
            >
              {activeRole === 'dono' ? '👑 Dono' : activeRole === 'barbeiro' ? '✂️ Barbeiro' : '👤 Cliente'}
            </span>
          </div>
        </div>

        {/* Action buttons to switch roles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {/* Dono Option */}
          <button
            onClick={() => setActiveRole('dono')}
            id="simulate-role-dono-btn"
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              activeRole === 'dono'
                ? 'bg-amber-100/90 border-[#a16a1c] ring-2 ring-[#a16a1c]/30 shadow-xs scale-[1.01]'
                : 'bg-white border-[#e2dcce] hover:border-amber-400 hover:bg-amber-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-black text-xs text-stone-950">
                <Crown className="w-4 h-4 text-[#a16a1c]" />
                Visão do Dono
              </span>
              {activeRole === 'dono' && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#a16a1c] text-white">
                  Ativo Agora
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-600 font-medium mt-2">
              Acesso irrestrito a todas as funções, relatórios de faturamento e este painel de gerenciamento.
            </p>
          </button>

          {/* Barbeiro Option */}
          <button
            onClick={() => {
              setActiveRole('barbeiro');
              if (onNavigateTab) onNavigateTab('dashboard');
            }}
            id="simulate-role-barbeiro-btn"
            className="p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between bg-white border-[#e2dcce] hover:border-blue-400 hover:bg-blue-50/40 shadow-2xs"
            title="Mudar para a visão de Barbeiro e testar botões liberados"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-black text-xs text-stone-950">
                <Scissors className="w-4 h-4 text-blue-700" />
                Testar como Barbeiro
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                Simular
              </span>
            </div>
            <p className="text-[11px] text-stone-600 font-medium mt-2">
              Veja a tela operacional do barbeiro com os botões e recursos que você liberou abaixo.
            </p>
          </button>

          {/* Cliente Option */}
          <button
            onClick={() => {
              setActiveRole('cliente');
              if (onNavigateTab) onNavigateTab('dashboard');
            }}
            id="simulate-role-cliente-btn"
            className="p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between bg-white border-[#e2dcce] hover:border-emerald-400 hover:bg-emerald-50/40 shadow-2xs"
            title="Mudar para a visão de Cliente e testar botões liberados"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-black text-xs text-stone-950">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                Testar como Cliente
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                Simular
              </span>
            </div>
            <p className="text-[11px] text-stone-600 font-medium mt-2">
              Experimente a jornada de agendamento e menu exatamente como um cliente comum vê na tela.
            </p>
          </button>
        </div>

        {/* Live Diagnostics Card */}
        <div className="mt-4 p-3.5 rounded-xl bg-white border border-[#e2dcce] text-xs">
          <p className="font-bold text-stone-900 mb-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#a16a1c]" />
            Status dos Botões Chave para o perfil <strong className="uppercase underline">"{activeRole}"</strong> no momento:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-[#f8f5ee] border border-[#e2dcce]">
              <span className="text-stone-600 block">Botão IA:</span>
              <span className="font-black flex items-center gap-1 mt-0.5">
                {isFeatureVisibleForRole('aiBooking', activeRole) ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Visível
                  </span>
                ) : (
                  <span className="text-rose-700 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Ocultado
                  </span>
                )}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-[#f8f5ee] border border-[#e2dcce]">
              <span className="text-stone-600 block">Botão Supabase:</span>
              <span className="font-black flex items-center gap-1 mt-0.5">
                {isFeatureVisibleForRole('supabaseStatus', activeRole) ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Visível
                  </span>
                ) : (
                  <span className="text-rose-700 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Ocultado
                  </span>
                )}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-[#f8f5ee] border border-[#e2dcce]">
              <span className="text-stone-600 block">Testar Perfis:</span>
              <span className="font-black flex items-center gap-1 mt-0.5">
                {isFeatureVisibleForRole('testProfiles', activeRole) ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Visível
                  </span>
                ) : (
                  <span className="text-rose-700 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Ocultado
                  </span>
                )}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-[#f8f5ee] border border-[#e2dcce]">
              <span className="text-stone-600 block">Arquitetura Docs:</span>
              <span className="font-black flex items-center gap-1 mt-0.5">
                {isFeatureVisibleForRole('architectureDocs', activeRole) ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Visível
                  </span>
                ) : (
                  <span className="text-rose-700 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Ocultado
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Button Permissions Matrix */}
      <div className="rounded-2xl border border-[#e2dcce] bg-white p-5 md:p-6 shadow-xs">
        <div className="border-b border-[#e2dcce] pb-4 mb-5">
          <h3 className="text-base font-black text-stone-950 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#a16a1c]" />
            Configuração de Visibilidade por Recurso
          </h3>
          <p className="text-xs text-stone-600 font-medium mt-0.5">
            Clique nos botões de alternância para liberar ou bloquear o acesso para Barbeiros e Clientes:
          </p>
        </div>

        <div className="space-y-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            const isVisibleBarbeiro = visibilitySettings[feature.id]?.barbeiro ?? false;
            const isVisibleCliente = visibilitySettings[feature.id]?.cliente ?? false;
            const isVisibleDono = visibilitySettings[feature.id]?.dono ?? true;

            return (
              <div
                key={feature.id}
                className="p-4 rounded-xl border border-[#e2dcce] bg-[#fbf9f5] hover:border-stone-400 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left: Info */}
                <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-xl ${feature.iconBg} ${feature.iconColor} shrink-0 mt-0.5`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-stone-950">{feature.title}</h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-200 text-stone-700">
                        {feature.location}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 font-medium mt-1 leading-relaxed max-w-2xl">
                      {feature.description}
                    </p>
                  </div>
                </div>

                {/* Right: Role Toggles */}
                <div className="flex items-center gap-3 shrink-0 border-t lg:border-t-0 border-[#e2dcce] pt-3 lg:pt-0">
                  {/* Dono Status */}
                  <div className="text-center px-2 py-1 rounded-lg bg-white border border-[#e2dcce] min-w-[82px]">
                    <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      👑 Dono
                    </span>
                    {feature.allowDonoToggle ? (
                      <button
                        onClick={() => handleToggle(feature.id, 'dono', isVisibleDono, feature.title)}
                        className={`mt-1 text-[11px] font-black px-2 py-0.5 rounded-md transition-colors ${
                          isVisibleDono
                            ? 'bg-amber-100 text-amber-950 border border-amber-300'
                            : 'bg-stone-100 text-stone-500 border border-stone-300'
                        }`}
                      >
                        {isVisibleDono ? 'Liberado' : 'Oculto'}
                      </button>
                    ) : (
                      <span className="mt-1 inline-block text-[11px] font-black text-[#a16a1c] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Sempre Ativo
                      </span>
                    )}
                  </div>

                  {/* Barbeiro Toggle */}
                  <div className="text-center px-2 py-1 rounded-lg bg-white border border-[#e2dcce] min-w-[94px]">
                    <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      ✂️ Barbeiro
                    </span>
                    <button
                      onClick={() => handleToggle(feature.id, 'barbeiro', isVisibleBarbeiro, feature.title)}
                      id={`toggle-${feature.id}-barbeiro`}
                      className={`mt-1 w-full text-[11px] font-black px-2.5 py-1 rounded-md transition-all flex items-center justify-center gap-1 ${
                        isVisibleBarbeiro
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                          : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                      }`}
                      title={`Clique para ${isVisibleBarbeiro ? 'ocultar' : 'liberar'} para Barbeiros`}
                    >
                      {isVisibleBarbeiro ? (
                        <>
                          <Eye className="w-3 h-3" /> Liberado
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" /> Ocultado
                        </>
                      )}
                    </button>
                  </div>

                  {/* Cliente Toggle */}
                  <div className="text-center px-2 py-1 rounded-lg bg-white border border-[#e2dcce] min-w-[94px]">
                    <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      👤 Cliente
                    </span>
                    <button
                      onClick={() => handleToggle(feature.id, 'cliente', isVisibleCliente, feature.title)}
                      id={`toggle-${feature.id}-cliente`}
                      className={`mt-1 w-full text-[11px] font-black px-2.5 py-1 rounded-md transition-all flex items-center justify-center gap-1 ${
                        isVisibleCliente
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                      }`}
                      title={`Clique para ${isVisibleCliente ? 'ocultar' : 'liberar'} para Clientes`}
                    >
                      {isVisibleCliente ? (
                        <>
                          <Eye className="w-3 h-3" /> Liberado
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" /> Ocultado
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Helpful Instructions Box */}
      <div className="rounded-xl border border-amber-300/80 bg-amber-50/60 p-4 text-xs text-stone-700 space-y-1.5 font-medium leading-relaxed">
        <p className="font-bold text-amber-950 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-[#a16a1c]" />
          Como as alterações funcionam na prática:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-stone-700">
          <li>
            <strong>Tempo Real:</strong> Qualquer alteração feita aqui atualiza instantaneamente o menu lateral (Sidebar), os botões do cabeçalho (Navbar) e o menu móvel sem precisar recarregar a página.
          </li>
          <li>
            <strong>Proteção por Rota:</strong> Se um botão for ocultado para um perfil, mesmo que alguém tente acessar diretamente a URL daquele módulo, o sistema redireciona suavemente para a visão autorizada.
          </li>
          <li>
            <strong>Simulação Segura:</strong> Ao clicar em <em>"Testar como Barbeiro"</em> ou <em>"Testar como Cliente"</em>, você continuará logado com seu usuário Dono e poderá retornar ao Painel do Dono a qualquer segundo através do banner flutuante superior.
          </li>
        </ul>
      </div>
    </div>
  );
};
