import React, { useState } from 'react';
import {
  Layers,
  Database,
  GitBranch,
  ShieldCheck,
  Cpu,
  Smartphone,
  CreditCard,
  MessageSquare,
  Award,
  Sparkles,
  CheckCircle2,
  FileCode2,
  Lock,
  ArrowRight,
  Server,
  Workflow,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useBarberData } from '../../context/BarberDataContext';
import { SUPABASE_URL, SUPABASE_FIX_RLS_SQL } from '../../lib/supabase';

export const ArchitectureView: React.FC = () => {
  const {
    supabaseStatus,
    syncWithSupabase,
    seedSupabase,
    services,
    barbers,
    clients,
    appointments,
  } = useBarberData();

  const [activeSection, setActiveSection] = useState<
    'arquitetura' | 'banco' | 'rbac' | 'fluxos' | 'evolucao'
  >('arquitetura');

  const [copiedRls, setCopiedRls] = useState(false);
  const [seedingDb, setSeedingDb] = useState(false);
  const [seedResultText, setSeedResultText] = useState<string | null>(null);

  // Interactive WhatsApp simulator state
  const [testClientName, setTestClientName] = useState('Lucas Oliveira');
  const [testService, setTestService] = useState('Combo Master (Corte + Barba)');
  const [testTime, setTestTime] = useState('10:00');
  const [simulatedMsgSent, setSimulatedMsgSent] = useState(false);

  // Interactive PIX simulator state
  const [pixGenerated, setPixGenerated] = useState(false);
  const [pixPaid, setPixPaid] = useState(false);

  const handleSendWhatsAppSimulation = () => {
    setSimulatedMsgSent(true);
    setTimeout(() => setSimulatedMsgSent(false), 3000);
  };

  const handleSimulatePix = () => {
    setPixGenerated(true);
    setPixPaid(false);
  };

  const handlePayPix = () => {
    setPixPaid(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Studio AUDAX Style */}
      <div className="rounded-2xl border border-[#e2dcce] bg-white p-6 md:p-8 shadow-xs">
        <div className="inline-flex items-center space-x-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-300 mb-3">
          <Layers className="w-3.5 h-3.5 text-[#a16a1c]" />
          <span>Especificação Técnica • Arquitetura & Engenharia de Software</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight">
          Arquitetura, Modelagem de Banco & Roadmap SaaS
        </h1>
        <p className="mt-1.5 text-sm text-stone-600 max-w-3xl leading-relaxed font-medium">
          Documentação completa de engenharia para a plataforma <strong>Studio AUDAX</strong>. Especificação de arquitetura multi-tenant, modelagem relacional PostgreSQL, matriz RBAC de múltiplos perfis e simuladores das próximas evoluções.
        </p>

        {/* Section Tabs */}
        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { id: 'arquitetura', label: '1. Arquitetura do Sistema', icon: Server },
            { id: 'banco', label: '2. Banco de Dados (ERD & DDL)', icon: Database },
            { id: 'rbac', label: '3. Permissões RBAC (Múltiplos Perfis)', icon: ShieldCheck },
            { id: 'fluxos', label: '4. Fluxos de Negócio & Telas', icon: Workflow },
            { id: 'evolucao', label: '5. Futuras Evoluções (Interativo)', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#a16a1c] text-white shadow-xs font-extrabold scale-[1.01]'
                    : 'bg-[#f8f5ee] text-stone-700 hover:bg-[#eee6d8] hover:text-stone-950 border border-[#e2dcce]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: ARQUITETURA */}
      {activeSection === 'arquitetura' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl border border-[#e2dcce] bg-white shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#a16a1c] border border-amber-300 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Frontend (PWA / Mobile First)</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                React 18+ com Vite, TypeScript e Tailwind CSS v4. Arquitetura orientada a componentes com micro-interações, Mobile First responsivo e suporte a instalação PWA.
              </p>
              <ul className="text-xs text-stone-700 space-y-1 list-disc list-inside font-medium">
                <li>Design System nobre em tons de dourado e couro</li>
                <li>Transições fluidas de tela e feedback tátil</li>
                <li>Componentes modularizados de alto desempenho</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl border border-[#e2dcce] bg-white shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 border border-blue-300 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Backend & Clean Architecture</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                Node.js / Express com separação estrita em camadas (Controllers, Use Cases, Repositories). Preparado para modelo Multi-Tenant isolado por barbearia (<code className="text-[#a16a1c] font-bold">tenant_id</code>).
              </p>
              <ul className="text-xs text-stone-700 space-y-1 list-disc list-inside font-medium">
                <li>BFF (Backend for Frontend) RESTful</li>
                <li>Autenticação com sessão e perfil dinâmico</li>
                <li>Rate Limiting e Proteção contra requisições indesejadas</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl border border-[#e2dcce] bg-white shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Persistência & Escalabilidade</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                PostgreSQL relacional na nuvem via Supabase com pool de conexões. Índices otimizados por data e barbeiro para consultas instantâneas de horários vagos.
              </p>
              <ul className="text-xs text-stone-700 space-y-1 list-disc list-inside font-medium">
                <li>Garantia ACID para evitar choque de horários</li>
                <li>Histórico e logs auditáveis</li>
                <li>Snapshots e backups automatizados</li>
              </ul>
            </div>
          </div>

          {/* Diagrama Textual da Arquitetura */}
          <div className="p-6 rounded-2xl border border-[#e2dcce] bg-white shadow-xs space-y-3">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-[#a16a1c]" />
              <span>Diagrama Estrutural da Solução SaaS</span>
            </h3>
            <pre className="p-4 rounded-xl bg-[#211e19] border border-stone-800 text-[11px] text-amber-100 font-mono overflow-x-auto leading-relaxed shadow-inner">
{`+-----------------------------------------------------------------------------------+
|                           CLIENT APPLICATION LAYER                                |
|  [Cliente Mobile/Web]      [Barbeiro Bancada]      [Barbeiro Dono / Gestor]       |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ HTTPS / WSS
+-----------------------------------------------------------------------------------+
|                        API GATEWAY / MIDDLEWARE LAYER                             |
|  - Rate Limiter & Helmet      - JWT & RBAC Evaluator      - Tenant Resolver       |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                          CORE DOMAIN USE CASES                                    |
|  [AppointmentsService]  [ServicesCatalogService]  [BarbersService]  [ReportsService] |
|  - Concurrency Lock     - Dynamic Pricing & Slots - Commission Calc - Cashflow Proj  |
+-----------------------------------------------------------------------------------+
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
+------------------------------------+        +-------------------------------------+
|        PRIMARY DATABASE            |        |          EXTERNAL INTEGRATIONS      |
|  PostgreSQL 16 Relational Engine   |        |  - WhatsApp Business API (Z-API)    |
|  - Multi-profile RBAC Tables       |        |  - Gateway PIX / Cartão (MercadoPago)|
|  - Double-booking Prevention Index |        |  - Gemini AI Demand Forecaster       |
+------------------------------------+        +-------------------------------------+`}
            </pre>
          </div>
        </div>
      )}

      {/* SECTION 2: BANCO DE DADOS */}
      {activeSection === 'banco' && (
        <div className="space-y-6">
          {/* Live Supabase Connection Card */}
          <div className="p-6 rounded-2xl border border-emerald-300 bg-emerald-50/70 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-200">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-black text-emerald-950">Instância Supabase PostgreSQL Ativa</h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-200 text-emerald-950 border border-emerald-400">
                      ● Conectado
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 mt-0.5 font-medium">
                    Banco de dados PostgreSQL em nuvem provisionado no projeto <code className="text-emerald-900 font-bold bg-emerald-100 px-1 py-0.5 rounded">qzdkdgescmnqlsingqtj</code>.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => syncWithSupabase()}
                  disabled={supabaseStatus.isSyncing}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border border-[#e2dcce] bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${supabaseStatus.isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sincronizar</span>
                </button>
                <button
                  onClick={async () => {
                    setSeedingDb(true);
                    setSeedResultText(null);
                    const res = await seedSupabase();
                    setSeedResultText(res.message);
                    setSeedingDb(false);
                  }}
                  disabled={seedingDb || supabaseStatus.isSyncing}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{seedingDb ? 'Semeando...' : 'Popular Dados Iniciais'}</span>
                </button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                <span className="text-[10px] text-stone-600 font-bold uppercase tracking-wider">Tabela services</span>
                <p className="text-base font-black text-[#a16a1c] mt-0.5">{services.length} registros</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                <span className="text-[10px] text-stone-600 font-bold uppercase tracking-wider">Tabela barbers</span>
                <p className="text-base font-black text-[#a16a1c] mt-0.5">{barbers.length} registros</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                <span className="text-[10px] text-stone-600 font-bold uppercase tracking-wider">Tabela clients</span>
                <p className="text-base font-black text-[#a16a1c] mt-0.5">{clients.length} registros</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                <span className="text-[10px] text-stone-600 font-bold uppercase tracking-wider">Tabela appointments</span>
                <p className="text-base font-black text-[#a16a1c] mt-0.5">{appointments.length} registros</p>
              </div>
            </div>

            {seedResultText && (
              <div className="p-3 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 shadow-2xs">
                {seedResultText}
              </div>
            )}

            {/* RLS 1-Click Code Box */}
            <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#a16a1c]" />
                  Script SQL de Liberação RLS (Row Level Security) para a Chave Anon
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(SUPABASE_FIX_RLS_SQL);
                    setCopiedRls(true);
                    setTimeout(() => setCopiedRls(false), 2500);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1 bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold rounded-lg text-xs shadow-xs transition-all"
                >
                  {copiedRls ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar SQL</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-stone-700 font-medium">
                Se o Supabase acusar violação de política ao salvar, execute este comando no <strong>SQL Editor</strong> do painel Supabase para liberar as operações anônimas:
              </p>
              <pre className="p-2.5 bg-[#211e19] rounded-lg border border-stone-800 text-[11px] font-mono text-amber-100 overflow-x-auto shadow-inner">
{`ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE barbers DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE barber_services DISABLE ROW LEVEL SECURITY;`}
              </pre>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-[#e2dcce] bg-white shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-[#a16a1c]" />
                <span>Modelagem Relacional (Entidades & Relacionamentos)</span>
              </h3>
              <p className="text-xs text-stone-600 font-medium mt-1">
                Estrutura relacional normalizada com tabela pivô <code className="text-[#a16a1c] font-bold">user_roles</code> para suportar múltiplos perfis simultâneos por usuário.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* Users & Roles */}
              <div className="p-4 rounded-xl bg-[#211e19] border border-stone-800 space-y-2 text-stone-200">
                <p className="text-amber-400 font-bold">1. TABELAS: users & user_roles (N:N)</p>
                <p className="text-stone-300 text-[11px]">
                  CREATE TABLE users (<br />
                  &nbsp;&nbsp;id UUID PRIMARY KEY DEFAULT gen_random_uuid(),<br />
                  &nbsp;&nbsp;name VARCHAR(150) NOT NULL,<br />
                  &nbsp;&nbsp;email VARCHAR(150) UNIQUE NOT NULL,<br />
                  &nbsp;&nbsp;phone VARCHAR(20) NOT NULL,<br />
                  &nbsp;&nbsp;avatar TEXT,<br />
                  &nbsp;&nbsp;created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP<br />
                  );<br /><br />
                  CREATE TABLE user_roles (<br />
                  &nbsp;&nbsp;user_id UUID REFERENCES users(id) ON DELETE CASCADE,<br />
                  &nbsp;&nbsp;role VARCHAR(50) NOT NULL CHECK (role IN ('dono', 'barbeiro', 'cliente')),<br />
                  &nbsp;&nbsp;PRIMARY KEY(user_id, role)<br />
                  );
                </p>
              </div>

              {/* Barbers & Clients */}
              <div className="p-4 rounded-xl bg-[#211e19] border border-stone-800 space-y-2 text-stone-200">
                <p className="text-blue-400 font-bold">2. TABELAS: barbers & clients</p>
                <p className="text-stone-300 text-[11px]">
                  CREATE TABLE barbers (<br />
                  &nbsp;&nbsp;id UUID PRIMARY KEY DEFAULT gen_random_uuid(),<br />
                  &nbsp;&nbsp;user_id UUID REFERENCES users(id) ON DELETE SET NULL,<br />
                  &nbsp;&nbsp;name VARCHAR(150) NOT NULL,<br />
                  &nbsp;&nbsp;phone VARCHAR(20) NOT NULL,<br />
                  &nbsp;&nbsp;photo TEXT,<br />
                  &nbsp;&nbsp;commission_percentage NUMERIC(5,2) DEFAULT 50.00,<br />
                  &nbsp;&nbsp;is_active BOOLEAN DEFAULT TRUE<br />
                  );<br /><br />
                  CREATE TABLE clients (<br />
                  &nbsp;&nbsp;id UUID PRIMARY KEY DEFAULT gen_random_uuid(),<br />
                  &nbsp;&nbsp;user_id UUID REFERENCES users(id) ON DELETE SET NULL,<br />
                  &nbsp;&nbsp;name VARCHAR(150) NOT NULL,<br />
                  &nbsp;&nbsp;whatsapp VARCHAR(20) NOT NULL,<br />
                  &nbsp;&nbsp;notes TEXT<br />
                  );
                </p>
              </div>

              {/* Services & Barber Services */}
              <div className="p-4 rounded-xl bg-[#211e19] border border-stone-800 space-y-2 text-stone-200">
                <p className="text-amber-300 font-bold">3. TABELA: services (Catálogo de Procedimentos)</p>
                <p className="text-stone-300 text-[11px]">
                  CREATE TABLE services (<br />
                  &nbsp;&nbsp;id UUID PRIMARY KEY DEFAULT gen_random_uuid(),<br />
                  &nbsp;&nbsp;name VARCHAR(150) NOT NULL,<br />
                  &nbsp;&nbsp;description TEXT,<br />
                  &nbsp;&nbsp;price NUMERIC(10,2) NOT NULL CHECK (price &gt; 0),<br />
                  &nbsp;&nbsp;duration_minutes INT NOT NULL DEFAULT 30 CHECK (duration_minutes &gt;= 5),<br />
                  &nbsp;&nbsp;category VARCHAR(50) NOT NULL CHECK (category IN ('cabelo', 'barba', 'combo', 'tratamento')),<br />
                  &nbsp;&nbsp;is_active BOOLEAN NOT NULL DEFAULT TRUE,<br />
                  &nbsp;&nbsp;created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP<br />
                  );<br /><br />
                  CREATE INDEX idx_services_cat_active ON services(category, is_active);
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#211e19] border border-stone-800 space-y-2 text-stone-200">
                <p className="text-purple-400 font-bold">4. TABELA: barber_services (Especialidades N:N)</p>
                <p className="text-stone-300 text-[11px]">
                  CREATE TABLE barber_services (<br />
                  &nbsp;&nbsp;barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,<br />
                  &nbsp;&nbsp;service_id UUID REFERENCES services(id) ON DELETE CASCADE,<br />
                  &nbsp;&nbsp;custom_commission_pct NUMERIC(5,2), -- Opcional por serviço<br />
                  &nbsp;&nbsp;PRIMARY KEY(barber_id, service_id)<br />
                  );
                </p>
              </div>

              {/* Appointments */}
              <div className="p-4 rounded-xl bg-[#211e19] border border-stone-800 space-y-2 md:col-span-2 text-stone-200">
                <div className="flex items-center justify-between">
                  <p className="text-emerald-400 font-bold">5. TABELA: appointments (Agendamentos & Transações)</p>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                    Sincronização Ativa em Tempo Real
                  </span>
                </div>
                <p className="text-stone-300 text-[11px]">
                  CREATE TABLE appointments (<br />
                  &nbsp;&nbsp;id UUID PRIMARY KEY DEFAULT gen_random_uuid(),<br />
                  &nbsp;&nbsp;client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,<br />
                  &nbsp;&nbsp;barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE RESTRICT,<br />
                  &nbsp;&nbsp;service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,<br />
                  &nbsp;&nbsp;appointment_date DATE NOT NULL,<br />
                  &nbsp;&nbsp;appointment_time TIME NOT NULL,<br />
                  &nbsp;&nbsp;duration_minutes INT NOT NULL, -- snapshot da duração do serviço<br />
                  &nbsp;&nbsp;service_price NUMERIC(10,2) NOT NULL, -- snapshot histórico do preço<br />
                  &nbsp;&nbsp;status VARCHAR(30) NOT NULL CHECK (status IN ('agendado', 'confirmado', 'em_atendimento', 'finalizado', 'cancelado')),<br />
                  &nbsp;&nbsp;payment_status VARCHAR(30) DEFAULT 'pendente',<br />
                  &nbsp;&nbsp;notes TEXT,<br />
                  &nbsp;&nbsp;CONSTRAINT unique_barber_slot UNIQUE (barber_id, appointment_date, appointment_time)<br />
                  );<br /><br />
                  CREATE INDEX idx_appointments_date_barber ON appointments(appointment_date, barber_id);
                </p>

                {/* Pipeline de Resiliência */}
                <div className="mt-3 p-3 rounded-lg bg-[#2d2922] border border-stone-700 text-[11px] text-amber-100 space-y-1.5">
                  <p className="font-bold text-amber-300">🛡️ Pipeline de Resiliência de Persistência no Supabase:</p>
                  <ul className="list-disc list-inside space-y-1 text-stone-300 font-mono">
                    <li><strong className="text-amber-200">Resolução Automática de Foreign Keys (UUID):</strong> Mapeia os IDs de <code className="text-amber-300">barber_id</code>, <code className="text-amber-300">service_id</code> e <code className="text-amber-300">client_id</code> para chaves primárias UUID válidas.</li>
                    <li><strong className="text-amber-200">Sanitização de Tempo PostgreSQL:</strong> Formata e sanitiza horários (<code className="text-amber-300">HH:mm:ss</code> / <code className="text-amber-300">TIME</code>) para compatibilidade nativa com o motor PostgreSQL.</li>
                    <li><strong className="text-amber-200">Tratamento de Concorrência & Slots:</strong> Garante integridade e previne duplo agendamento no mesmo horário.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: RBAC & MÚLTIPLOS PERFIS */}
      {activeSection === 'rbac' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-[#e2dcce] bg-white shadow-xs space-y-4">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#a16a1c]" />
              <span>Matriz de Controle de Acesso Baseado em Perfis (RBAC)</span>
            </h3>
            <p className="text-xs text-stone-600 font-medium">
              O sistema cumpre com precisão a regra de que <strong>um usuário pode possuir múltiplos perfis simultaneamente</strong> (ex: Barbeiro Dono + Barbeiro que atende na cadeira).
            </p>

            <div className="overflow-x-auto mt-4 rounded-xl border border-[#e2dcce]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e2dcce] bg-[#f8f5ee] text-stone-800 uppercase font-bold text-[10px]">
                    <th className="py-3 px-3.5">Recurso / Ação</th>
                    <th className="py-3 px-3.5 text-center text-emerald-900 font-extrabold">Cliente</th>
                    <th className="py-3 px-3.5 text-center text-blue-900 font-extrabold">Barbeiro</th>
                    <th className="py-3 px-3.5 text-center text-amber-950 font-extrabold">Barbeiro Dono</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2dcce]">
                  <tr className="hover:bg-stone-50/50">
                    <td className="py-3 px-3.5 font-bold text-stone-900">Visualizar Agendamentos</td>
                    <td className="py-3 px-3.5 text-center text-stone-700">Apenas os seus</td>
                    <td className="py-3 px-3.5 text-center text-stone-700">Apenas os seus</td>
                    <td className="py-3 px-3.5 text-center text-amber-900 font-bold">Todos da Barbearia</td>
                  </tr>
                  <tr className="hover:bg-stone-50/50">
                    <td className="py-3 px-3.5 font-bold text-stone-900">Criar Novo Agendamento</td>
                    <td className="py-3 px-3.5 text-center"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]">Sim (para si)</span></td>
                    <td className="py-3 px-3.5 text-center"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]">Sim (para clientes)</span></td>
                    <td className="py-3 px-3.5 text-center"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]">Sim (para qualquer um)</span></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50">
                    <td className="py-3 px-3.5 font-bold text-stone-900">Alterar Status (Iniciar / Concluir)</td>
                    <td className="py-3 px-3.5 text-center text-stone-400">Não</td>
                    <td className="py-3 px-3.5 text-center"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]">Sim (em sua cadeira)</span></td>
                    <td className="py-3 px-3.5 text-center"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]">Sim (em qualquer cadeira)</span></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50">
                    <td className="py-3 px-3.5 font-bold text-stone-900">Gestão de Clientes</td>
                    <td className="py-3 px-3.5 text-center text-stone-400">Apenas seu perfil</td>
                    <td className="py-3 px-3.5 text-center"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]">Visualizar e Criar</span></td>
                    <td className="py-3 px-3.5 text-center"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]">Total (Criar, Editar, Excluir)</span></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50">
                    <td className="py-3 px-3.5 font-bold text-stone-900">Gestão da Equipe & Barbeiros</td>
                    <td className="py-3 px-3.5 text-center text-stone-400">Não</td>
                    <td className="py-3 px-3.5 text-center text-stone-500">Apenas ver colegas</td>
                    <td className="py-3 px-3.5 text-center"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">Total (Criar, Ativar, Comissões)</span></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50">
                    <td className="py-3 px-3.5 font-bold text-stone-900">Atribuir / Remover Perfis de Usuários</td>
                    <td className="py-3 px-3.5 text-center text-stone-400">Não</td>
                    <td className="py-3 px-3.5 text-center text-stone-400">Não</td>
                    <td className="py-3 px-3.5 text-center"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">Sim (Exclusivo Dono)</span></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50">
                    <td className="py-3 px-3.5 font-bold text-stone-900">Cadastrar Novos Serviços (Catálogo)</td>
                    <td className="py-3 px-3.5 text-center text-stone-400">Não</td>
                    <td className="py-3 px-3.5 text-center text-stone-400">Não (apenas consulta)</td>
                    <td className="py-3 px-3.5 text-center"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">Sim (Exclusivo Dono)</span></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50">
                    <td className="py-3 px-3.5 font-bold text-stone-900">Editar Preço, Duração & Dados de Serviços</td>
                    <td className="py-3 px-3.5 text-center text-stone-400">Não</td>
                    <td className="py-3 px-3.5 text-center text-stone-400">Não</td>
                    <td className="py-3 px-3.5 text-center"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">Sim (Exclusivo Dono)</span></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50">
                    <td className="py-3 px-3.5 font-bold text-stone-900">Pausar / Reativar Serviços no Catálogo</td>
                    <td className="py-3 px-3.5 text-center text-stone-400">Não</td>
                    <td className="py-3 px-3.5 text-center text-stone-400">Não</td>
                    <td className="py-3 px-3.5 text-center"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">Sim (Exclusivo Dono)</span></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50">
                    <td className="py-3 px-3.5 font-bold text-stone-900">Excluir Serviço Definitivamente</td>
                    <td className="py-3 px-3.5 text-center text-stone-400">Não</td>
                    <td className="py-3 px-3.5 text-center text-stone-400">Não</td>
                    <td className="py-3 px-3.5 text-center"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">Sim (Exclusivo Dono)</span></td>
                  </tr>
                  <tr className="hover:bg-stone-50/50">
                    <td className="py-3 px-3.5 font-bold text-stone-900">Consultar Catálogo de Serviços & Preços</td>
                    <td className="py-3 px-3.5 text-center text-emerald-800 font-bold">Sim (p/ Agendar)</td>
                    <td className="py-3 px-3.5 text-center text-emerald-800 font-bold">Sim (p/ Atender)</td>
                    <td className="py-3 px-3.5 text-center text-emerald-800 font-bold">Sim (Total)</td>
                  </tr>
                  <tr className="hover:bg-stone-50/50">
                    <td className="py-3 px-3.5 font-bold text-stone-900">Métricas Financeiras & Faturamento Futuro</td>
                    <td className="py-3 px-3.5 text-center text-stone-400">Não</td>
                    <td className="py-3 px-3.5 text-center text-stone-700">Apenas sua comissão</td>
                    <td className="py-3 px-3.5 text-center text-amber-900 font-bold">Total da Empresa</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: FLUXOS */}
      {activeSection === 'fluxos' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl border border-[#e2dcce] bg-white shadow-xs space-y-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Workflow className="w-4 h-4 text-[#a16a1c]" />
                <span>Fluxo 1: Agendamento pelo Cliente</span>
              </h3>
              <ol className="text-xs text-stone-700 space-y-2 list-decimal list-inside leading-relaxed font-medium">
                <li>Cliente acessa o app ou link direto da barbearia.</li>
                <li>Visualiza catálogo de barbeiros e escolhe seu profissional de preferência.</li>
                <li>Seleciona o serviço desejado (ex: Combo Cabelo + Barba).</li>
                <li>Escolhe a data e um horário vago na grade do barbeiro.</li>
                <li>Informa o WhatsApp para confirmação e confirma.</li>
                <li>Agendamento entra como <code className="text-blue-900 font-bold bg-blue-50 px-1 py-0.5 rounded">Agendado</code> / <code className="text-emerald-900 font-bold bg-emerald-50 px-1 py-0.5 rounded">Confirmado</code>.</li>
              </ol>
            </div>

            <div className="p-5 rounded-2xl border border-[#e2dcce] bg-white shadow-xs space-y-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Workflow className="w-4 h-4 text-blue-800" />
                <span>Fluxo 2: Atendimento pelo Barbeiro</span>
              </h3>
              <ol className="text-xs text-stone-700 space-y-2 list-decimal list-inside leading-relaxed font-medium">
                <li>Barbeiro abre a Dashboard e vê sua timeline diária.</li>
                <li>Quando o cliente senta na cadeira, clica em <strong>Iniciar (Em Cadeira)</strong>.</li>
                <li>Após finalizar o corte, clica em <strong>Concluir / Finalizar</strong>.</li>
                <li>O sistema atualiza a contagem de cortes e calcula a comissão na hora.</li>
              </ol>
            </div>

            <div className="p-5 rounded-2xl border border-[#e2dcce] bg-white shadow-xs space-y-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Workflow className="w-4 h-4 text-emerald-800" />
                <span>Fluxo 3: Gestão de Serviços & Catálogo (Barbeiro Dono)</span>
              </h3>
              <ol className="text-xs text-stone-700 space-y-2 list-decimal list-inside leading-relaxed font-medium">
                <li>O Dono acessa a aba <strong>Serviços & Catálogo</strong> (acesso exclusivo de gestão).</li>
                <li>Cadastra novos serviços definindo Nome, Categoria (Cabelo, Barba, Combo, Tratamento), Preço (R$) e Duração (min).</li>
                <li>Pode <strong>Pausar/Desativar</strong> serviços temporariamente: o item sai da listagem pública de agendamento, mas agendamentos anteriores permanecem intactos.</li>
                <li>Ao editar o preço ou duração de um serviço, novos agendamentos adotam os novos parâmetros sem alterar o histórico contábil (snapshot financeiro).</li>
              </ol>
            </div>

            <div className="p-5 rounded-2xl border border-[#e2dcce] bg-white shadow-xs space-y-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Workflow className="w-4 h-4 text-purple-800" />
                <span>Fluxo 4: Gestão Multi-Perfil Simultâneo (RBAC)</span>
              </h3>
              <ol className="text-xs text-stone-700 space-y-2 list-decimal list-inside leading-relaxed font-medium">
                <li>O Dono acessa a listagem de Barbeiros ou Perfil de Usuários.</li>
                <li>Atribui ou remove papéis com um clique (ex: transformar um cliente fiel em Barbeiro, ou tornar um Barbeiro sócio com perfil Dono).</li>
                <li>O usuário ganha acesso instantâneo aos dashboards correspondentes via chave seletora na barra superior.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: FUTURAS EVOLUÇÕES (SIMULADORES INTERATIVOS) */}
      {activeSection === 'evolucao' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Simulador WhatsApp Bot */}
            <div className="p-6 rounded-2xl border border-[#e2dcce] bg-white shadow-xs space-y-4">
              <div className="flex items-center space-x-2 text-emerald-800">
                <MessageSquare className="w-5 h-5" />
                <h3 className="text-base font-bold text-stone-900">Evolução 1: Integração WhatsApp Bot</h3>
              </div>
              <p className="text-xs text-stone-600 font-medium">
                Disparo automático de confirmações, lembretes de 2 horas antes do corte e pesquisa de satisfação pós-atendimento.
              </p>

              {/* Interactive preview */}
              <div className="p-4 rounded-xl bg-[#f8f5ee] border border-[#e2dcce] space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-[#e2dcce] pb-2">
                  <span className="text-[11px] text-stone-600 font-bold">Simulação de Disparo de Lembrete:</span>
                  <span className="text-[10px] text-emerald-900 bg-emerald-100 border border-emerald-300 font-bold px-2 py-0.5 rounded-full">
                    API WhatsApp Ativa
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs leading-relaxed font-medium">
                  💬 <em>"Olá {testClientName}! Lembramos que seu horário de {testService} no Studio AUDAX é hoje às {testTime}. Para confirmar responda 1, para reagendar responda 2."</em>
                </div>
                <button
                  onClick={handleSendWhatsAppSimulation}
                  className="w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{simulatedMsgSent ? 'Mensagem Enviada com Sucesso!' : 'Disparar Notificação Teste'}</span>
                </button>
              </div>
            </div>

            {/* Simulador Pagamentos PIX & Cartão */}
            <div className="p-6 rounded-2xl border border-[#e2dcce] bg-white shadow-xs space-y-4">
              <div className="flex items-center space-x-2 text-[#a16a1c]">
                <CreditCard className="w-5 h-5" />
                <h3 className="text-base font-bold text-stone-900">Evolução 2: Pagamentos PIX & Cartão Online</h3>
              </div>
              <p className="text-xs text-stone-600 font-medium">
                Cobrança antecipada de sinal ou pagamento integral para reduzir taxas de não comparecimento (No-Show).
              </p>

              <div className="p-4 rounded-xl bg-[#f8f5ee] border border-[#e2dcce] space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-[#e2dcce] pb-2">
                  <span className="text-[11px] text-stone-600 font-bold">Gateway de Pagamento Integrado:</span>
                  <span className="text-[10px] text-amber-900 bg-amber-100 border border-amber-300 font-bold px-2 py-0.5 rounded-full">
                    PIX Dinâmico
                  </span>
                </div>

                {!pixGenerated ? (
                  <button
                    onClick={handleSimulatePix}
                    className="w-full py-2 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    Gerar Cobrança PIX (R$ 60,00)
                  </button>
                ) : (
                  <div className="space-y-2 text-center">
                    <div className="w-24 h-24 mx-auto bg-white p-2 rounded-xl border border-stone-300 flex items-center justify-center text-stone-950 font-mono text-[9px] font-bold shadow-xs">
                      [QR CODE PIX]
                    </div>
                    <p className="text-[11px] text-stone-600 font-mono">Código Copia e Cola: 00020126580014br.gov.bcb.pix...</p>
                    {pixPaid ? (
                      <div className="p-2 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-xs flex items-center justify-center gap-1 shadow-2xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Pagamento Aprovado Instantaneamente!
                      </div>
                    ) : (
                      <button
                        onClick={handlePayPix}
                        className="w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
                      >
                        Simular Confirmação do Banco (Webhook)
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Evolução 3: Inteligência Artificial */}
            <div className="p-6 rounded-2xl border border-[#e2dcce] bg-white shadow-xs space-y-3 lg:col-span-2">
              <div className="flex items-center space-x-2 text-purple-900">
                <Cpu className="w-5 h-5 text-purple-700" />
                <h3 className="text-base font-bold text-stone-900">Evolução 3: Assistente de Inteligência Artificial para Gestão</h3>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                Utilização de modelos Gemini integrados server-side para predição de demanda (ex: antecipar picos de sábado, sugerir horários promocionais em terças-feiras de baixa ocupação) e assistente virtual de atendimento no WhatsApp 24h.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
