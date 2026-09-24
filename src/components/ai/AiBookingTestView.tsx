import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Scissors,
  DollarSign,
  AlertTriangle,
  Play,
  ShieldCheck,
  Zap,
  Loader2,
  Check,
  Database,
  CalendarCheck2,
  CalendarX2,
  Users2,
  Settings,
  Key,
  Globe,
  Cpu,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBarberData } from '../../context/BarberDataContext';
import {
  testProviderDirect,
  parseBookingDirect,
  ProviderType,
  ProviderModelOption,
} from '../../services/aiClientService';
import { ParsedAiResult, FreeSlotInfo } from '../../lib/aiBookingLogic';

export const AiBookingTestView: React.FC = () => {
  const { currentUser, activeRole } = useAuth();
  const { barbers, services, clients, appointments, addAppointment } = useBarberData();

  // Provider Settings State
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>(() => {
    return (localStorage.getItem('audax_ai_provider') as ProviderType) || 'gemini';
  });

  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
    return {
      gemini: localStorage.getItem('audax_ai_key_gemini') || '',
      groq: localStorage.getItem('audax_ai_key_groq') || '',
      openrouter: localStorage.getItem('audax_ai_key_openrouter') || '',
    };
  });

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('audax_ai_model') || 'gemini-2.5-flash';
  });

  const [availableModels, setAvailableModels] = useState<ProviderModelOption[]>([]);
  const [testingConnection, setTestingConnection] = useState(false);
  const [providerMessage, setProviderMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(true);

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedAiResult | null>(null);
  const [activeUsedProvider, setActiveUsedProvider] = useState<string | null>(null);
  const [createdSuccess, setCreatedSuccess] = useState<string | null>(null);
  const [selectedBarberFilterOnly, setSelectedBarberFilterOnly] = useState<boolean>(true);

  const targetBarberName = result?.barberName || '';
  const targetBarberId = result?.barberId || '';

  const displayedSummary = useMemo(() => {
    if (!result?.freeSlotsSummary) return [];

    const now = new Date();
    let todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    let currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    try {
      todayStr = now.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
      currentHHMM = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour12: false }).substring(0, 5);
    } catch (e) {}

    // Filter out past slots for today or past dates
    const futureOnlySummary = result.freeSlotsSummary.map((bInfo) => {
      const validSlots = bInfo.freeSlots.filter((slot) => {
        if (!result.date || result.date < todayStr) return false;
        if (result.date === todayStr) return slot > currentHHMM;
        return true;
      });
      return { ...bInfo, freeSlots: validSlots };
    });

    if (selectedBarberFilterOnly && (targetBarberName || targetBarberId)) {
      const filtered = futureOnlySummary.filter((bInfo) => {
        const matchesId = Boolean(targetBarberId && bInfo.barberId === targetBarberId);
        const matchesName = Boolean(
          targetBarberName &&
            (bInfo.barberName.toLowerCase().includes(targetBarberName.toLowerCase()) ||
              targetBarberName.toLowerCase().includes(bInfo.barberName.toLowerCase()))
        );
        return matchesId || matchesName;
      });
      if (filtered.length > 0) return filtered;
    }
    return futureOnlySummary;
  }, [result?.freeSlotsSummary, result?.date, targetBarberName, targetBarberId, selectedBarberFilterOnly]);

  // History of test executions
  const [testHistory, setTestHistory] = useState<
    Array<{
      id: string;
      prompt: string;
      result: ParsedAiResult;
      timestamp: string;
      created: boolean;
      providerUsed?: string;
    }>
  >([]);

  // Persist provider settings
  useEffect(() => {
    localStorage.setItem('audax_ai_provider', selectedProvider);
  }, [selectedProvider]);

  useEffect(() => {
    localStorage.setItem('audax_ai_key_gemini', apiKeys.gemini);
    localStorage.setItem('audax_ai_key_groq', apiKeys.groq);
    localStorage.setItem('audax_ai_key_openrouter', apiKeys.openrouter);
  }, [apiKeys]);

  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem('audax_ai_model', selectedModel);
    }
  }, [selectedModel]);

  // Handle Provider Change & Load Default Models
  useEffect(() => {
    handleTestProvider(selectedProvider, apiKeys[selectedProvider] || '');
  }, [selectedProvider]);

  const handleTestProvider = async (provider: ProviderType, keyToTest?: string) => {
    setTestingConnection(true);
    setProviderMessage(null);

    const apiKeyInput = keyToTest !== undefined ? keyToTest : (apiKeys[provider] || '');

    try {
      const json = await testProviderDirect(provider, apiKeyInput);

      setAvailableModels(json.models || []);
      if (json.models && json.models.length > 0) {
        // Pick first model if current selectedModel isn't in new list
        const exists = json.models.some((m: ProviderModelOption) => m.id === selectedModel);
        if (!exists) {
          setSelectedModel(json.models[0].id);
        }
      }

      setProviderMessage({
        type: 'success',
        text: json.message || 'Provedor conectado e validado com sucesso!',
      });
    } catch (err: any) {
      console.error('Test Provider Error:', err);
      setProviderMessage({
        type: 'error',
        text: err?.message || 'Falha ao testar API Key do provedor.',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Find a sample existing occupied appointment to make testing collisions super easy for the user!
  const occupiedAppt = appointments.find((a) => a.status !== 'cancelado') || appointments[0];
  const activeBarbersList = barbers.filter((b) => b.isActive !== false);

  // Pre-configured test prompts including "Agendar para o Barbeiro" options
  const samplePrompts = [
    'Agendar para o Barbeiro: Listar barbeiros livres e horários disponíveis',
    ...(activeBarbersList.length > 0
      ? activeBarbersList.map((b) => `Quero agendar um corte com o barbeiro ${b.name} no próximo horário livre de hoje`)
      : []),
    occupiedAppt
      ? `Simular choque de horário: Quero agendar com o ${occupiedAppt.barberName} no dia ${occupiedAppt.date} às ${occupiedAppt.time}`
      : 'Quero agendar um Combo Master com o Lucas amanhã às 15:00',
  ];

  const handleRunAiParsing = async (textToParse?: string) => {
    const inputPrompt = textToParse || prompt;
    if (!inputPrompt.trim()) {
      setError('Por favor, digite uma mensagem ou selecione um exemplo para testar.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setCreatedSuccess(null);
    setActiveUsedProvider(null);
    setSelectedBarberFilterOnly(true);

    const activeBarbers = barbers.filter((b) => b.isActive !== false);
    const activeServices = services.filter((s) => s.isActive !== false);

    try {
      const json = await parseBookingDirect({
        prompt: inputPrompt,
        provider: selectedProvider,
        apiKey: apiKeys[selectedProvider] || '',
        model: selectedModel,
        availableBarbers: activeBarbers.map((b) => ({
          id: b.id,
          name: b.name,
          specialties: b.specialties,
        })),
        availableServices: activeServices.map((s) => ({
          id: s.id,
          name: s.name,
          price: s.price,
          duration: s.durationMinutes,
          category: s.category,
        })),
        existingAppointments: appointments.map((a) => ({
          id: a.id,
          barberId: a.barberId,
          barberName: a.barberName,
          serviceName: a.serviceName,
          date: a.date,
          time: a.time,
          status: a.status,
        })),
      });

      const parsed: ParsedAiResult = json.data;
      setResult(parsed);
      setActiveUsedProvider(json.provider || selectedProvider);

      // Add to session history
      setTestHistory((prev) => [
        {
          id: `test-${Date.now()}`,
          prompt: inputPrompt,
          result: parsed,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          created: false,
          providerUsed: json.provider || selectedProvider,
        },
        ...prev,
      ]);
    } catch (err: any) {
      console.error('AI test error:', err);
      setError(
        err?.message ||
          'Não foi possível interpretar a mensagem com a IA. Verifique se a API Key está correta.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAndCreateAppointment = async () => {
    if (!result) return;

    try {
      setError(null);

      // 1. Resolve Active Service from Database
      const activeServices = services.filter((s) => s.isActive !== false);
      const targetService =
        activeServices.find((s) => s.id === result.serviceId) ||
        activeServices.find((s) => s.name.toLowerCase().includes(result.serviceName.toLowerCase())) ||
        activeServices[0];

      if (!targetService) {
        throw new Error('Nenhum serviço ativo encontrado no catálogo do banco de dados.');
      }

      // 2. Resolve Active Barber from Database
      const activeBarbers = barbers.filter((b) => b.isActive !== false);
      const targetBarber =
        activeBarbers.find((b) => b.id === result.barberId) ||
        activeBarbers.find((b) => b.name.toLowerCase().includes(result.barberName.toLowerCase())) ||
        activeBarbers[0];

      if (!targetBarber) {
        throw new Error('Nenhum barbeiro ativo disponível no momento.');
      }

      // 3. Resolve Client from Currently Logged-In User Profile
      const matchedClient = clients.find(
        (c) =>
          (currentUser?.id && c.id === currentUser.id) ||
          (currentUser?.id && c.userId === currentUser.id) ||
          (currentUser?.email && c.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
          (currentUser?.phone && c.phone === currentUser.phone)
      ) || clients[0];

      const finalClientId = matchedClient?.id || currentUser?.id || 'client-1';
      const finalClientName = currentUser?.name || matchedClient?.name || result.clientName || 'Cliente Logado';
      const finalClientPhone = currentUser?.phone || matchedClient?.phone || result.clientWhatsapp || '11999998888';

      // 4. Resolve Date (Ensure non-past date)
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      let targetDate = result.date || todayStr;
      if (targetDate < todayStr) {
        targetDate = todayStr;
      }

      // 5. Ensure valid time slot format (HH:MM)
      let targetTime = result.time || '15:00';
      if (!targetTime.includes(':')) {
        targetTime = '15:00';
      }

      const created = addAppointment({
        clientId: finalClientId,
        clientName: finalClientName,
        clientPhone: finalClientPhone,
        barberId: targetBarber.id,
        serviceId: targetService.id,
        date: targetDate,
        time: targetTime,
        notes: `🤖 Agendamento realizado via IA para o usuário logado (${finalClientName}): ${result.notes || result.reasoning}`,
      });

      setCreatedSuccess(
        `Agendamento para o usuário logado "${finalClientName}" com ${targetBarber.name} (${targetService.name}) no dia ${targetDate} às ${targetTime} foi GRAVADO NO BANCO DE DADOS com ID: ${created.id}`
      );

      // Update history created flag
      setTestHistory((prev) =>
        prev.map((item, idx) => (idx === 0 ? { ...item, created: true } : item))
      );
    } catch (err: any) {
      console.error('Error creating appointment from AI:', err);
      setError(
        err?.message ||
          'Ocorreu um erro ao gravar o agendamento no banco de dados. Verifique os dados selecionados.'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="rounded-2xl border border-[#e2dcce] bg-white p-6 md:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="inline-flex items-center space-x-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-[#a16a1c]" />
            <span>Painel do Dono • Multi-Provedor IA (Gemini, Groq, OpenRouter)</span>
          </div>

          <button
            onClick={() => setShowSettingsPanel((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#a16a1c] hover:bg-[#8c5a15] text-white rounded-full text-xs font-bold transition-all shadow-sm shrink-0 border border-[#a16a1c]/20"
          >
            <Settings className="w-3.5 h-3.5 text-white animate-spin-slow" />
            <span>{showSettingsPanel ? 'Ocultar Configuração de IA' : 'Configurar Provedor & API Key'}</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
              <span>Agendamento Inteligente com Verificação Real</span>
            </h1>
            <p className="mt-1.5 text-sm text-stone-600 max-w-3xl leading-relaxed font-medium">
              Configure sua própria API Key para integrar com <strong>Google Gemini</strong>, <strong>Groq</strong>, <strong>OpenRouter</strong> ou utilize o motor nativo para testar modelos gratuitos de altíssimo desempenho.
            </p>
          </div>
        </div>
      </div>

      {/* Provider Configuration Panel */}
      {showSettingsPanel && (
        <div className="p-6 rounded-2xl border border-[#a16a1c]/30 bg-white shadow-sm space-y-5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-[#e2dcce] pb-3">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-[#a16a1c]" />
              <span>Configuração de Provedor de IA & API Keys</span>
            </h2>
            <span className="text-xs text-stone-500 font-medium">
              Sua chave é salva com segurança no seu navegador (`localStorage`).
            </span>
          </div>

          {/* Provider Selection Tabs */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-2">1. Selecione o Provedor de IA desejado:</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {/* Gemini */}
              <button
                onClick={() => setSelectedProvider('gemini')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  selectedProvider === 'gemini'
                    ? 'bg-amber-100/80 border-[#a16a1c] ring-2 ring-[#a16a1c]/20'
                    : 'bg-[#f8f5ee] border-[#e2dcce] hover:border-stone-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                    🟢 Gemini
                  </span>
                  {selectedProvider === 'gemini' && <CheckCircle className="w-4 h-4 text-[#a16a1c]" />}
                </div>
                <span className="text-[10px] text-stone-600 font-medium mt-2">
                  Modelos Flash de altíssima precisão.
                </span>
              </button>

              {/* Groq */}
              <button
                onClick={() => setSelectedProvider('groq')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  selectedProvider === 'groq'
                    ? 'bg-amber-100/80 border-[#a16a1c] ring-2 ring-[#a16a1c]/20'
                    : 'bg-[#f8f5ee] border-[#e2dcce] hover:border-stone-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                    ⚡ Groq
                  </span>
                  {selectedProvider === 'groq' && <CheckCircle className="w-4 h-4 text-[#a16a1c]" />}
                </div>
                <span className="text-[10px] text-stone-600 font-medium mt-2">
                  Llama 3.3, Mixtral e Gemma (Hiper veloz).
                </span>
              </button>

              {/* OpenRouter */}
              <button
                onClick={() => setSelectedProvider('openrouter')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  selectedProvider === 'openrouter'
                    ? 'bg-amber-100/80 border-[#a16a1c] ring-2 ring-[#a16a1c]/20'
                    : 'bg-[#f8f5ee] border-[#e2dcce] hover:border-stone-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                    🌐 OpenRouter
                  </span>
                  {selectedProvider === 'openrouter' && <CheckCircle className="w-4 h-4 text-[#a16a1c]" />}
                </div>
                <span className="text-[10px] text-stone-600 font-medium mt-2">
                  Acesso a centenas de modelos free (DeepSeek R1, Llama).
                </span>
              </button>

              {/* Motor AUDAX */}
              <button
                onClick={() => setSelectedProvider('audax')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  selectedProvider === 'audax'
                    ? 'bg-amber-100/80 border-[#a16a1c] ring-2 ring-[#a16a1c]/20'
                    : 'bg-[#f8f5ee] border-[#e2dcce] hover:border-stone-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                    🛡️ Motor AUDAX
                  </span>
                  {selectedProvider === 'audax' && <CheckCircle className="w-4 h-4 text-[#a16a1c]" />}
                </div>
                <span className="text-[10px] text-stone-600 font-medium mt-2">
                  Totalmente Grátis & Nativo sem necessidade de API Key.
                </span>
              </button>
            </div>
          </div>

          {/* API Key Input & Controls (if not AUDAX) */}
          {selectedProvider !== 'audax' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-[#f8f5ee] p-4 rounded-xl border border-[#e2dcce]">
              <div className="md:col-span-7 space-y-1.5">
                <label className="text-xs font-bold text-stone-900 flex items-center justify-between">
                  <span>API Key do Provedor ({selectedProvider.toUpperCase()}):</span>
                  <a
                    href={
                      selectedProvider === 'gemini'
                        ? 'https://aistudio.google.com/app/apikey'
                        : selectedProvider === 'groq'
                        ? 'https://console.groq.com/keys'
                        : 'https://openrouter.ai/keys'
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#a16a1c] hover:underline font-bold flex items-center gap-1"
                  >
                    <Globe className="w-3 h-3" /> Obter API Key Grátis
                  </a>
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKeys[selectedProvider] || ''}
                    onChange={(e) =>
                      setApiKeys((prev) => ({
                        ...prev,
                        [selectedProvider]: e.target.value,
                      }))
                    }
                    placeholder={
                      selectedProvider === 'gemini'
                        ? 'Cole sua chave AIzaSy...'
                        : selectedProvider === 'groq'
                        ? 'Cole sua chave gsk_...'
                        : 'Cole sua chave sk-or-v1-...'
                    }
                    className="w-full pr-10 pl-3 py-2 rounded-lg border border-[#e2dcce] bg-white text-xs font-mono font-semibold text-stone-900 focus:border-[#a16a1c] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((prev) => !prev)}
                    className="absolute right-2.5 top-2 text-stone-500 hover:text-stone-800"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Button: Test Key & Fetch Models */}
              <div className="md:col-span-5 flex gap-2">
                <button
                  onClick={() => handleTestProvider(selectedProvider, apiKeys[selectedProvider])}
                  disabled={testingConnection}
                  className="w-full py-2 px-3 rounded-lg bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  {testingConnection ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Testando Conexão...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Testar & Listar Modelos</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Model Selector Dropdown */}
          {availableModels.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-900 flex items-center justify-between">
                <span>Modelos Disponíveis Identificados ({availableModels.length}):</span>
                <span className="text-[11px] text-emerald-800 font-bold">🟢 Conexão Validada</span>
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#e2dcce] bg-[#f8f5ee] text-xs font-bold text-stone-900 focus:bg-white focus:border-[#a16a1c] focus:outline-none"
              >
                {availableModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.badge ? `[${m.badge}]` : ''} ({m.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Provider Notification Message */}
          {providerMessage && (
            <div
              className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                providerMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-red-50 border-red-300 text-red-950'
              }`}
            >
              {providerMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-800 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
              )}
              <span>{providerMessage.text}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Input & Test Control Area */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl border border-[#e2dcce] bg-white shadow-xs space-y-4">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-[#a16a1c]" />
              <span>Exemplos de Teste (Choque de Horários e Consulta de Vagas)</span>
            </h2>

            {/* Quick Barber Selector: Agendar para o Barbeiro Direto ao Ponto */}
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-[#a16a1c]" />
                  <span>Agendar para o Barbeiro (Direto ao Ponto):</span>
                </span>
                <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-bold">
                  {activeBarbersList.length} Barbeiros Ativos
                </span>
              </div>
              <p className="text-xs text-stone-700 font-medium leading-relaxed">
                Clique no barbeiro desejado para consultar instantaneamente a lista de horários livres no banco de dados:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {activeBarbersList.map((barber) => (
                  <button
                    key={barber.id}
                    onClick={() => {
                      const text = `Quero agendar um corte com o barbeiro ${barber.name} no próximo horário livre de hoje`;
                      setPrompt(text);
                      handleRunAiParsing(text);
                    }}
                    disabled={loading}
                    className="p-3 text-left rounded-xl bg-white hover:bg-amber-100/60 hover:border-[#a16a1c] border border-amber-200 transition-all flex items-center justify-between group shadow-xs cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-stone-900 text-amber-300 font-black text-xs flex items-center justify-center border border-stone-800">
                        {barber.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-black text-stone-900">Agendar para {barber.name}</p>
                        <p className="text-[10px] text-stone-600 font-medium">Ver horários livres e agendar</p>
                      </div>
                    </div>
                    <Zap className="w-4 h-4 text-[#a16a1c] group-hover:scale-125 transition-transform shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Sample Prompts */}
            <div>
              <span className="text-xs font-bold text-stone-700 block mb-2">
                Outros Modelos de Texto Pré-definidos (1 Clique):
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {samplePrompts.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPrompt(sample);
                      handleRunAiParsing(sample);
                    }}
                    disabled={loading}
                    className="p-3 text-left rounded-xl bg-[#f8f5ee] hover:bg-[#eee6d8] hover:border-[#a16a1c] border border-[#e2dcce] text-xs font-semibold text-stone-800 transition-all flex items-center justify-between group shadow-2xs"
                  >
                    <span className="pr-2 font-bold leading-relaxed">💬 {sample}</span>
                    <Play className="w-4 h-4 text-[#a16a1c] group-hover:scale-110 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt Input */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-stone-900 flex items-center justify-between">
                <span>Ou Digite a Mensagem do Cliente:</span>
                <span className="text-[11px] text-stone-600 font-medium">Ex: "agendar com o Lucas amanhã às 15h"</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Exemplo: Quero agendar um corte com o Lucas amanhã às 15:00..."
                rows={3}
                className="w-full rounded-xl border border-[#e2dcce] bg-[#f8f5ee] p-3 text-sm text-stone-900 focus:bg-white focus:border-[#a16a1c] focus:outline-none transition-colors font-medium shadow-inner"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={() => handleRunAiParsing()}
              disabled={loading || !prompt.trim()}
              className="w-full py-3 px-4 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-sm transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Consultando Modelo ({selectedModel}) e Agenda...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Analisar e Verificar Disponibilidade na Agenda Real</span>
                </>
              )}
            </button>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-950 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Test History */}
          {testHistory.length > 0 && (
            <div className="p-6 rounded-2xl border border-[#e2dcce] bg-white shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#a16a1c]" />
                <span>Histórico de Consultas à Agenda nesta Sessão ({testHistory.length})</span>
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {testHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setResult(item.result)}
                    className="p-3 rounded-xl border border-[#e2dcce] bg-[#f8f5ee] hover:border-[#a16a1c] cursor-pointer transition-all text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-stone-900 truncate max-w-[280px]">"{item.prompt}"</span>
                      {item.result.slotStatus === 'REARRANJADO_HORARIO_OCUPADO' ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-300 font-bold text-[10px] flex items-center gap-1">
                          <CalendarX2 className="w-3 h-3 text-amber-800" /> Reajustado (Ocupado)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[10px] flex items-center gap-1">
                          <CalendarCheck2 className="w-3 h-3 text-emerald-800" /> Livre
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-600 font-medium pt-1 border-t border-[#e2dcce]/60">
                      <span>
                        {item.result.clientName} • {item.result.barberName} ({item.result.date} às {item.result.time})
                      </span>
                      <span className="text-[10px] font-mono text-[#a16a1c] font-bold">
                        {item.providerUsed}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Output & Structured Validation Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl border border-[#e2dcce] bg-white shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#e2dcce] pb-3">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-800" />
                <span>Status da Agenda & Mapeamento</span>
              </h2>
              {result && (
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                    result.slotStatus === 'REARRANJADO_HORARIO_OCUPADO'
                      ? 'bg-amber-100 text-amber-950 border-amber-400'
                      : 'bg-emerald-100 text-emerald-950 border-emerald-400'
                  }`}
                >
                  {result.slotStatus === 'REARRANJADO_HORARIO_OCUPADO' ? '⚠️ Reajustado por Conflito' : '🟢 Horário Livre'}
                </span>
              )}
            </div>

            {!result && !loading && (
              <div className="py-12 text-center text-stone-500 space-y-3">
                <Bot className="w-12 h-12 mx-auto text-stone-400 stroke-[1.5]" />
                <p className="text-xs font-semibold max-w-xs mx-auto">
                  Selecione um dos exemplos acima para testar a verificação de choques e lista de horários livres no banco de dados.
                </p>
              </div>
            )}

            {loading && (
              <div className="py-12 text-center text-stone-700 space-y-3">
                <Loader2 className="w-10 h-10 mx-auto text-[#a16a1c] animate-spin" />
                <p className="text-xs font-bold">Consultando o modelo de IA ({selectedModel}) e agendamentos no banco...</p>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Active Provider Used Badge */}
                {activeUsedProvider && (
                  <div className="px-3 py-1.5 rounded-lg bg-[#211e19] text-amber-300 text-xs font-mono font-bold border border-stone-800 flex items-center justify-between">
                    <span>⚡ Processado por: {activeUsedProvider}</span>
                    <span className="text-emerald-400 font-bold">200 OK</span>
                  </div>
                )}

                {/* Conflict Notice Banner if slot was occupied */}
                {result.slotStatus === 'REARRANJADO_HORARIO_OCUPADO' && result.occupiedNotice && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-semibold space-y-1 shadow-2xs">
                    <p className="font-bold flex items-center gap-1.5 text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      Conflito de Agenda Evitado com Sucesso!
                    </p>
                    <p className="text-[11px] leading-relaxed text-stone-800">{result.occupiedNotice}</p>
                  </div>
                )}

                {/* Available Barbers and Free Slots List Card */}
                {result.freeSlotsSummary && result.freeSlotsSummary.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-[#f5f2eb] border border-[#e2dcce] space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <Users2 className="w-4 h-4 text-[#a16a1c]" />
                        <span>
                          {selectedBarberFilterOnly && (targetBarberName || targetBarberId)
                            ? `Agenda e Horários do Barbeiro Selecionado (${result.barberName}) em ${result.date}:`
                            : `Barbeiros e Horários Livres na Data (${result.date}):`}
                        </span>
                      </p>
                      {(targetBarberName || targetBarberId) && (
                        <button
                          type="button"
                          onClick={() => setSelectedBarberFilterOnly((prev) => !prev)}
                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 transition-colors cursor-pointer"
                        >
                          {selectedBarberFilterOnly ? '👁️ Ver todos os barbeiros' : `✂️ Filtrar apenas ${result.barberName}`}
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 pt-1">
                      {displayedSummary.map((bInfo) => (
                        <div key={bInfo.barberId} className="p-2.5 bg-white rounded-lg border border-[#e2dcce] space-y-1.5">
                          <p className="text-xs font-black text-stone-900 flex items-center justify-between">
                            <span>✂️ Barbeiro: {bInfo.barberName}</span>
                            <span className="text-[10px] text-emerald-950 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded font-bold">
                              {bInfo.freeSlots.length} horários livres
                            </span>
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {bInfo.freeSlots.length > 0 ? (
                              bInfo.freeSlots.map((slot) => (
                                <button
                                  type="button"
                                  key={slot}
                                  onClick={() => {
                                    setResult((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            time: slot,
                                            barberId: bInfo.barberId,
                                            barberName: bInfo.barberName,
                                            slotStatus: 'LIVRE',
                                          }
                                        : null
                                    );
                                  }}
                                  className={`text-[10px] font-mono font-bold px-2 py-1 rounded border transition-all cursor-pointer ${
                                    slot === result.time && (bInfo.barberId === result.barberId || bInfo.barberName === result.barberName)
                                      ? 'bg-[#a16a1c] text-white border-[#8c5a15] shadow-xs ring-2 ring-[#a16a1c]/20'
                                      : 'bg-[#f8f5ee] hover:bg-amber-100 hover:border-[#a16a1c] text-stone-800 border-[#e2dcce]'
                                  }`}
                                >
                                  {slot}
                                </button>
                              ))
                            ) : (
                              <span className="text-[10px] text-red-700 font-bold">Sem vagas neste dia</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Result Card Fields with Real Database Matching */}
                {(() => {
                  const realClientMatch = clients.find(
                    (c) => c.name.toLowerCase().includes(result.clientName.toLowerCase()) || (result.clientWhatsapp && c.phone.includes(result.clientWhatsapp))
                  );
                  const realBarber = barbers.find(
                    (b) => b.id === result.barberId || b.name.toLowerCase().includes(result.barberName.toLowerCase())
                  );
                  const realService = services.find(
                    (s) => s.id === result.serviceId || s.name.toLowerCase().includes(result.serviceName.toLowerCase())
                  );

                  const clientAppointmentsCount = realClientMatch
                    ? appointments.filter((a) => a.clientId === realClientMatch.id).length
                    : 0;

                  return (
                    <div className="p-4 rounded-xl bg-[#f8f5ee] border border-[#e2dcce] space-y-3.5">
                      {/* Cliente (Usuário Logado no Sistema) */}
                      <div className="p-3 rounded-lg bg-white border border-[#e2dcce] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-stone-600 font-bold uppercase tracking-wider flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-[#a16a1c]" /> Cliente da Sessão Ativa:
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold text-[10px]">
                            🟢 Logado ({currentUser?.name || 'Usuário'})
                          </span>
                        </div>
                        <p className="text-sm font-black text-stone-900">{currentUser?.name || result.clientName}</p>
                        <div className="flex items-center justify-between text-xs text-stone-600 font-medium pt-1">
                          <span>Telefone: {currentUser?.phone || realClientMatch?.phone || '(11) 99999-8888'}</span>
                          <span className="text-[11px] font-bold text-[#a16a1c]">
                            E-mail: {currentUser?.email || 'cliente@audax.com'}
                          </span>
                        </div>
                      </div>

                      {/* Barbeiro Selecionado e Ativo */}
                      <div className="p-3 rounded-lg bg-white border border-[#e2dcce] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-stone-600 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Scissors className="w-3.5 h-3.5 text-blue-800" /> Barbeiro Mapeado (Altere se necessário):
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold text-[10px]">
                            🟢 {barbers.filter((b) => b.isActive !== false).length} Barbeiros Ativos
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <select
                            value={realBarber?.id || result.barberId || ''}
                            onChange={(e) => {
                              const found = barbers.find((b) => b.id === e.target.value);
                              if (found) {
                                setResult((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        barberId: found.id,
                                        barberName: found.name,
                                      }
                                    : null
                                );
                              }
                            }}
                            className="w-full text-sm font-bold bg-[#f8f5ee] hover:bg-[#eee6d8] text-stone-900 rounded-xl border border-[#e2dcce] p-2.5 focus:outline-none focus:border-[#a16a1c] transition-colors"
                          >
                            <option value="" disabled>-- Selecione um barbeiro --</option>
                            {barbers
                              .filter((b) => b.isActive !== false)
                              .map((b) => (
                                <option key={b.id} value={b.id}>
                                  ✂️ {b.name}
                                </option>
                              ))}
                          </select>
                        </div>
                        {realBarber?.specialties && realBarber.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {realBarber.specialties.map((spec, i) => (
                              <span key={i} className="text-[10px] bg-[#f8f5ee] px-1.5 py-0.5 rounded border border-[#e2dcce] text-stone-700 font-semibold">
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Serviço Ativo do Catálogo */}
                      <div className="p-3 rounded-lg bg-white border border-[#e2dcce] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-stone-600 font-bold uppercase tracking-wider flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-800" /> Serviço Mapeado (Altere se necessário):
                          </span>
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-300 font-bold text-[10px]">
                            {services.filter((s) => s.isActive !== false).length} Serviços Ativos
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <select
                            value={realService?.id || result.serviceId || ''}
                            onChange={(e) => {
                              const found = services.find((s) => s.id === e.target.value);
                              if (found) {
                                setResult((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        serviceId: found.id,
                                        serviceName: found.name,
                                        servicePrice: found.price,
                                      }
                                    : null
                                );
                              }
                            }}
                            className="w-full text-sm font-bold bg-[#f8f5ee] hover:bg-[#eee6d8] text-stone-900 rounded-xl border border-[#e2dcce] p-2.5 focus:outline-none focus:border-[#a16a1c] transition-colors"
                          >
                            <option value="" disabled>-- Selecione um serviço --</option>
                            {services
                              .filter((s) => s.isActive !== false)
                              .map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} - R$ {s.price.toFixed(2).replace('.', ',')} ({s.durationMinutes} min)
                                </option>
                              ))}
                          </select>
                        </div>

                        {realService && (
                          <p className="text-[11px] text-stone-600 font-medium flex items-center gap-1.5 bg-[#f8f5ee]/50 p-1.5 rounded border border-[#e2dcce]/40">
                            <Clock className="w-3.5 h-3.5 text-stone-500" />
                            <span>Duração do serviço: <strong>{realService.durationMinutes} minutos</strong> | Categoria: <strong>{realService.category || 'Geral'}</strong></span>
                          </p>
                        )}
                      </div>

                      {/* Data e Horário Final Vago */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="p-2.5 rounded-lg bg-white border border-[#e2dcce]">
                          <span className="text-[10px] text-stone-600 font-bold uppercase block flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#a16a1c]" /> Data do Agendamento
                          </span>
                          <p className="text-xs font-black text-stone-900 mt-0.5">{result.date}</p>
                        </div>
                        <div className={`p-2.5 rounded-lg border ${result.slotStatus === 'REARRANJADO_HORARIO_OCUPADO' ? 'bg-amber-100/60 border-amber-300' : 'bg-white border-[#e2dcce]'}`}>
                          <span className="text-[10px] text-stone-600 font-bold uppercase block flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#a16a1c]" /> Horário Confirmado Livre
                          </span>
                          <p className="text-xs font-black text-stone-900 mt-0.5">{result.time}</p>
                        </div>
                      </div>

                      {/* Reasoning & Real Schedule Audit */}
                      <div className="p-3 bg-[#211e19] rounded-lg border border-stone-800 text-amber-100 text-xs space-y-1 font-mono">
                        <span className="text-amber-400 font-bold block text-[10px]">🔍 Auditoria da Agenda do Banco Real:</span>
                        <p className="text-[11px] leading-relaxed">{result.reasoning}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Confirm & Persist Button */}
                <button
                  onClick={handleConfirmAndCreateAppointment}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Gravar Agendamento Verificado no Banco de Dados</span>
                </button>

                {createdSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-100 border border-emerald-400 text-emerald-950 text-xs font-bold space-y-1 shadow-xs animate-in zoom-in-95">
                    <p className="flex items-center gap-1.5 text-sm font-black">
                      <Check className="w-4 h-4 text-emerald-800" /> Confirmado e Gravado no Sistema!
                    </p>
                    <p className="font-medium text-stone-800">{createdSuccess}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
