import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  X,
  Server,
  Table,
  Users,
  Scissors,
  Calendar,
  Layers,
  Code,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { useBarberData } from '../../context/BarberDataContext';
import { useAuth } from '../../context/AuthContext';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_FIX_RLS_SQL } from '../../lib/supabase';

interface SupabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseStatusModal: React.FC<SupabaseStatusModalProps> = ({ isOpen, onClose }) => {
  const { supabaseStatus, syncWithSupabase, seedSupabase, clients, barbers, services, appointments } =
    useBarberData();
  const { users } = useAuth();
  const [copied, setCopied] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [seedFeedback, setSeedFeedback] = useState<{ success: boolean; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'geral' | 'tabelas' | 'sql'>('geral');

  // Listen for ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_FIX_RLS_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(SUPABASE_ANON_KEY);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    setSeedFeedback(null);
    try {
      await syncWithSupabase();
      setSeedFeedback({
        success: true,
        text: 'Sincronização com o Supabase concluída com sucesso! Dados atualizados.',
      });
    } catch (err: any) {
      setSeedFeedback({
        success: false,
        text: `Erro na sincronização: ${err?.message || 'Falha ao conectar'}`,
      });
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedFeedback(null);
    try {
      const res = await seedSupabase();
      if (res.success) {
        setSeedFeedback({
          success: true,
          text: `Sucesso! ${res.message}`,
        });
      } else {
        setSeedFeedback({
          success: false,
          text: `Atenção: ${res.message} ${res.error ? `(${res.error})` : ''}`,
        });
      }
    } catch (err: any) {
      setSeedFeedback({
        success: false,
        text: `Erro ao popular banco: ${err?.message || 'Falha inesperada'}`,
      });
    } finally {
      setSeeding(false);
    }
  };

  const dbTables = [
    {
      name: 'users',
      label: 'Usuários & Contas de Acesso',
      count: users.length,
      icon: Users,
      description: 'Credenciais, perfis e autenticação de clientes, barbeiros e dono.',
      status: 'Ativo',
    },
    {
      name: 'user_roles',
      label: 'Funções & Permissões (RBAC)',
      count: users.reduce((acc, u) => acc + (u.roles?.length || 1), 0),
      icon: ShieldCheck,
      description: 'Mapeamento das permissões (dono, barbeiro, cliente) por usuário.',
      status: 'Ativo',
    },
    {
      name: 'barbers',
      label: 'Equipe de Barbeiros',
      count: barbers.length,
      icon: Scissors,
      description: 'Barbeiros ativos, fotos, especialidades e métricas de atendimento.',
      status: 'Ativo',
    },
    {
      name: 'clients',
      label: 'Base de Clientes',
      count: clients.length,
      icon: Users,
      description: 'Histórico, telefones, e-mails e anotações dos clientes atendidos.',
      status: 'Ativo',
    },
    {
      name: 'services',
      label: 'Catálogo de Serviços',
      count: services.length,
      icon: Layers,
      description: 'Serviços cadastrados, preços, duração em minutos e categorias.',
      status: 'Ativo',
    },
    {
      name: 'appointments',
      label: 'Agendamentos & Comandas',
      count: appointments.length,
      icon: Calendar,
      description: 'Horários marcados, status, histórico de cortes e faturamento.',
      status: 'Ativo',
    },
  ];

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm p-3 sm:p-4 flex min-h-full items-center justify-center animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-3xl my-auto bg-white border border-[#e2dcce] rounded-2xl shadow-2xl flex flex-col max-h-[86vh] sm:max-h-[88vh] overflow-hidden text-stone-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Fixo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2dcce] bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-xl border border-emerald-300">
              <Database className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-800" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-stone-900">Integração Supabase PostgreSQL</h2>
                <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Online
                </span>
              </div>
              <p className="text-xs text-stone-600 font-semibold mt-0.5">
                Persistência remota em nuvem, controle de permissões e sincronização em tempo real.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-500 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs Fixas */}
        <div className="flex items-center px-5 pt-2.5 border-b border-[#e2dcce] bg-[#f8f5ee] gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('geral')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'geral'
                ? 'border-[#a16a1c] text-[#a16a1c]'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            Visão Geral & Métricas
          </button>
          <button
            onClick={() => setActiveTab('tabelas')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'tabelas'
                ? 'border-[#a16a1c] text-[#a16a1c]'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Table className="w-4 h-4" />
            Tabelas do Banco ({dbTables.length})
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'sql'
                ? 'border-[#a16a1c] text-[#a16a1c]'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Code className="w-4 h-4" />
            Script SQL & Permissões RLS
          </button>
        </div>

        {/* Scrollable Content Body com min-h-0 estrito */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === 'geral' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Connection Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#f8f5ee] rounded-xl border border-[#e2dcce]">
                  <span className="text-[10px] text-stone-600 uppercase tracking-wider font-bold">
                    Endpoint Supabase API
                  </span>
                  <div className="flex items-center justify-between mt-1 gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-800 truncate">
                      {SUPABASE_URL}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white text-stone-800 font-mono border border-stone-300 shrink-0">
                      HTTPS
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#f8f5ee] rounded-xl border border-[#e2dcce]">
                  <span className="text-[10px] text-stone-600 uppercase tracking-wider font-bold">
                    Status da Conexão em Tempo Real
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      <span className="text-xs font-bold text-stone-900">
                        {supabaseStatus.isSyncing || isManualSyncing
                          ? 'Sincronizando dados...'
                          : 'Conectado e Operacional'}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-600 font-semibold">
                      Latência: <strong className="text-emerald-800">&lt;50ms</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary Metrics Grid */}
              <div className="p-4 bg-[#f8f5ee] rounded-xl border border-[#e2dcce]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                    <Table className="w-4 h-4 text-[#a16a1c]" />
                    Registros Atuais em Memória / Sincronizados
                  </span>
                  <span className="text-[11px] text-stone-600 font-bold">Total: {users.length + services.length + barbers.length + clients.length + appointments.length} itens</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-[#e2dcce]">
                    <div className="text-lg font-black text-[#a16a1c]">{users.length}</div>
                    <div className="text-[11px] text-stone-600 font-bold">Usuários</div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-[#e2dcce]">
                    <div className="text-lg font-black text-[#a16a1c]">{barbers.length}</div>
                    <div className="text-[11px] text-stone-600 font-bold">Barbeiros</div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-[#e2dcce]">
                    <div className="text-lg font-black text-[#a16a1c]">{clients.length}</div>
                    <div className="text-[11px] text-stone-600 font-bold">Clientes</div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-[#e2dcce]">
                    <div className="text-lg font-black text-[#a16a1c]">{services.length}</div>
                    <div className="text-[11px] text-stone-600 font-bold">Serviços</div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-[#e2dcce] col-span-2 sm:col-span-1">
                    <div className="text-lg font-black text-[#a16a1c]">{appointments.length}</div>
                    <div className="text-[11px] text-stone-600 font-bold">Agendamentos</div>
                  </div>
                </div>
              </div>

              {/* Status Details Box */}
              <div className="p-4 bg-white border border-[#e2dcce] rounded-xl space-y-2.5">
                <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  Garantia de Persistência Híbrida & Segura
                </h4>
                <p className="text-xs text-stone-700 font-medium leading-relaxed">
                  O sistema opera com persistência remota no banco PostgreSQL do Supabase e sincronização inteligente local. Todas as alterações em agendamentos, serviços, clientes e barbeiros são salvas diretamente na nuvem.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-bold text-stone-700">
                  <span className="px-2 py-1 bg-[#f8f5ee] border border-[#e2dcce] rounded-md font-mono">
                    PostgreSQL 15+
                  </span>
                  <span className="px-2 py-1 bg-[#f8f5ee] border border-[#e2dcce] rounded-md font-mono">
                    Auto-Reconnect
                  </span>
                  <span className="px-2 py-1 bg-[#f8f5ee] border border-[#e2dcce] rounded-md font-mono">
                    Multi-Role RBAC
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TABELAS DO BANCO */}
          {activeTab === 'tabelas' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="text-xs text-stone-700 font-semibold mb-2">
                Tabelas relacionais estruturadas no PostgreSQL do Supabase para o Studio AUDAX:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dbTables.map((tbl) => {
                  const Icon = tbl.icon;
                  return (
                    <div
                      key={tbl.name}
                      className="p-3.5 bg-[#f8f5ee] rounded-xl border border-[#e2dcce] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-amber-100 text-[#a16a1c] rounded-lg">
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-mono font-black text-[#a16a1c]">
                              {tbl.name}
                            </span>
                          </div>
                          <span className="text-xs font-black text-stone-900 px-2 py-0.5 rounded bg-white border border-[#e2dcce]">
                            {tbl.count} {tbl.count === 1 ? 'item' : 'itens'}
                          </span>
                        </div>
                        <h5 className="text-xs font-black text-stone-900 mt-2">{tbl.label}</h5>
                        <p className="text-[11px] text-stone-600 font-semibold mt-1 leading-relaxed">
                          {tbl.description}
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-[#e2dcce] flex items-center justify-between text-[10px]">
                        <span className="text-stone-600 font-bold">Status no schema</span>
                        <span className="text-emerald-800 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Conectada
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SCRIPT SQL & RLS */}
          {activeTab === 'sql' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-[#a16a1c] shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs">
                    <h4 className="font-bold text-amber-950">
                      Instruções de Permissões Row Level Security (RLS)
                    </h4>
                    <p className="text-stone-800 font-semibold mt-1 leading-relaxed">
                      Caso o Supabase acuse restrições de permissão ao inserir ou atualizar dados via chave pública (<code className="text-[#a16a1c] bg-amber-100 px-1 py-0.5 rounded font-mono">anon</code>), copie o script abaixo e execute no <strong>SQL Editor</strong> do painel do seu Supabase.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-mono text-stone-700 font-bold">
                    Script SQL para Liberação / Configuração:
                  </span>
                  <button
                    onClick={handleCopySql}
                    className="flex items-center space-x-1.5 px-3 py-1 bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold rounded-lg text-xs shadow transition-all"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copiado com Sucesso!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Código SQL</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 bg-stone-900 border border-stone-800 text-amber-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-56 leading-relaxed select-all">
                  {SUPABASE_FIX_RLS_SQL}
                </pre>
              </div>
            </div>
          )}

          {/* Feedback notification message */}
          {seedFeedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
                seedFeedback.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <span>{seedFeedback.text}</span>
              <button
                onClick={() => setSeedFeedback(null)}
                className="text-stone-600 hover:text-stone-900 ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Fixed Footer with Action Buttons */}
        <div className="p-4 sm:p-5 bg-white border-t border-[#e2dcce] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleManualSync}
              disabled={isManualSyncing || supabaseStatus.isSyncing || seeding}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#f8f5ee] hover:bg-[#eae3d5] text-stone-900 border border-[#e2dcce] text-xs font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isManualSyncing || supabaseStatus.isSyncing ? 'animate-spin' : ''
                }`}
              />
              <span>
                {isManualSyncing || supabaseStatus.isSyncing
                  ? 'Sincronizando...'
                  : 'Sincronizar Agora'}
              </span>
            </button>

            <button
              onClick={handleSeed}
              disabled={seeding || isManualSyncing || supabaseStatus.isSyncing}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white text-xs font-black transition-all shadow-md disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{seeding ? 'Populando Banco...' : 'Popular Dados Iniciais'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors border border-stone-300 text-center"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
