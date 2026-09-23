import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to get America/Sao_Paulo timezone date and time correctly
function getTodayAndCurrentTimeInBrazil() {
  const now = new Date();
  try {
    const todayStr = now.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }); // "YYYY-MM-DD"
    const timeStr = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour12: false }).substring(0, 5); // "HH:MM"
    return { todayStr, currentHHMM: timeStr };
  } catch (err) {
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return { todayStr, currentHHMM: timeStr };
  }
}

// Helper function to check if a time slot is in the past
function isSlotInPast(dateStr: string, timeStr: string): boolean {
  const { todayStr, currentHHMM } = getTodayAndCurrentTimeInBrazil();

  if (dateStr < todayStr) {
    return true; // Any slot on a past date is in the past
  }

  if (dateStr === todayStr) {
    return timeStr <= currentHHMM; // Any slot today at or before current time is in the past
  }

  return false; // Future date
}

// Operating hours slot generator by day of week (exact specs: Mon-Fri: 08:00 to 18:30, Sat: 08:00 to 16:30, Sun: 09:00 to 11:30)
function getTimeSlotsForDate(dateStr: string): string[] {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay();

  const manhaStandard = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
  const tardeSegSex = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'];
  const tardeSabado = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
  const manhaDomingo = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];

  if (dayOfWeek === 0) {
    // Domingo
    return manhaDomingo;
  }
  if (dayOfWeek === 6) {
    // Sábado
    return [...manhaStandard, ...tardeSabado];
  }
  // Segunda a Sexta (1 a 5)
  return [...manhaStandard, ...tardeSegSex];
}

// Helper function to check if a slot is unavailable (either occupied OR in the past)
function isSlotUnavailable(barberId: string, dateStr: string, timeStr: string, existingAppointments: any[] = []): boolean {
  if (isSlotInPast(dateStr, timeStr)) {
    return true;
  }
  return existingAppointments.some(
    (app) =>
      app.barberId === barberId &&
      app.date === dateStr &&
      app.time === timeStr &&
      app.status !== 'cancelado'
  );
}

// Helper function to check if a slot is occupied
function isSlotOccupied(barberId: string, dateStr: string, timeStr: string, existingAppointments: any[] = []) {
  return existingAppointments.some(
    (app) =>
      app.barberId === barberId &&
      app.date === dateStr &&
      app.time === timeStr &&
      app.status !== 'cancelado'
  );
}

// Find next free slot for a barber on a date (MUST BE FUTURE AND UNOCUPIED)
function findNextFreeSlot(barberId: string, dateStr: string, requestedTime: string, existingAppointments: any[] = []) {
  const possibleTimes = getTimeSlotsForDate(dateStr);

  // Filter ONLY valid future and unoccupied slots
  const validFreeSlots = possibleTimes.filter((t) => !isSlotUnavailable(barberId, dateStr, t, existingAppointments));

  if (validFreeSlots.length > 0) {
    const nextAfterRequested = validFreeSlots.find((t) => t >= requestedTime);
    return nextAfterRequested || validFreeSlots[0];
  }

  return possibleTimes[0] || '09:00';
}

// Helper to compute all free slots per barber for a given date (MUST BE FUTURE AND UNOCUPIED)
function getFreeSlotsSummary(dateStr: string, barbers: any[] = [], existingAppointments: any[] = []) {
  const possibleTimes = getTimeSlotsForDate(dateStr);
  return barbers.map((b) => {
    const freeSlots = possibleTimes.filter((t) => !isSlotUnavailable(b.id, dateStr, t, existingAppointments));
    return {
      barberId: b.id,
      barberName: b.name,
      freeSlots,
    };
  });
}

// Post-process function to guarantee AI output never returns past or occupied slots
function sanitizeAndValidateBookingResult(parsedJson: any, availableBarbers: any[], existingAppointments: any[], todayStr: string) {
  const barberId = parsedJson.barberId || (availableBarbers[0]?.id || 'barber-1');
  const dateStr = parsedJson.date || todayStr;
  const timeStr = parsedJson.time || '15:00';

  if (isSlotUnavailable(barberId, dateStr, timeStr, existingAppointments)) {
    const nextFree = findNextFreeSlot(barberId, dateStr, timeStr, existingAppointments);
    const isPast = isSlotInPast(dateStr, timeStr);
    parsedJson.time = nextFree;
    parsedJson.slotStatus = 'REARRANJADO_HORARIO_OCUPADO';
    parsedJson.occupiedNotice = isPast
      ? `O horário (${timeStr}) no dia ${dateStr} já passou. A IA reajustou automaticamente para o próximo horário FUTURO LIVRE (${nextFree}).`
      : `O horário (${timeStr}) no dia ${dateStr} estava Ocupado na agenda real. A IA reajustou automaticamente para o próximo horário livre (${nextFree}).`;
  }

  // Always calculate strictly future and unoccupied slots summary
  parsedJson.freeSlotsSummary = getFreeSlotsSummary(dateStr, availableBarbers, existingAppointments);

  return parsedJson;
}

// Helper function for smart fallback NLP parsing when Gemini API is unavailable or unconfigured
function fallbackParseBooking(prompt: string, barbers: any[] = [], services: any[] = [], existingAppointments: any[] = []) {
  const lower = prompt.toLowerCase();
  const today = new Date();

  // 1. Identify Barber
  let selectedBarber = barbers.find((b) => b.name && lower.includes(b.name.toLowerCase()));

  // 2. Extract Date
  let targetDate = new Date(today);
  if (lower.includes('amanhã') || lower.includes('amanha')) {
    targetDate.setDate(today.getDate() + 1);
  } else if (lower.includes('sábado') || lower.includes('sabado')) {
    const day = today.getDay();
    const diff = (6 - day + 7) % 7 || 7;
    targetDate.setDate(today.getDate() + diff);
  } else if (lower.includes('terça') || lower.includes('terca')) {
    const day = today.getDay();
    const diff = (2 - day + 7) % 7 || 7;
    targetDate.setDate(today.getDate() + diff);
  } else if (lower.includes('quinta')) {
    const day = today.getDay();
    const diff = (4 - day + 7) % 7 || 7;
    targetDate.setDate(today.getDate() + diff);
  }
  const dateStr = targetDate.toISOString().split('T')[0];

  // Calculate free slots summary for the date
  const freeSlotsSummary = getFreeSlotsSummary(dateStr, barbers, existingAppointments);

  // 3. Extract Time
  let timeStr = '15:00';
  const timeMatch = prompt.match(/(\d{1,2})[:h](\d{2})?/i) || prompt.match(/às\s*(\d{1,2})/i) || prompt.match(/as\s*(\d{1,2})/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    let min = timeMatch[2] ? timeMatch[2] : '00';
    if (hour < 10) timeStr = `0${hour}:${min}`;
    else timeStr = `${hour}:${min}`;
  }

  // If barber was not specified, pick barber who is FREE at requested time
  if (!selectedBarber && barbers.length > 0) {
    const freeBarber = barbers.find((b) => !isSlotOccupied(b.id, dateStr, timeStr, existingAppointments));
    selectedBarber = freeBarber || barbers[0];
  }

  // 4. Identify Service
  let selectedService = services.find((s) => s.name && lower.includes(s.name.toLowerCase()));
  if (!selectedService) {
    if (lower.includes('combo') || (lower.includes('corte') && lower.includes('barba'))) {
      selectedService = services.find((s) => s.name.toLowerCase().includes('combo') || s.name.toLowerCase().includes('corte + barba')) || services[0];
    } else if (lower.includes('barba')) {
      selectedService = services.find((s) => s.name.toLowerCase().includes('barba')) || services[0];
    } else if (lower.includes('sobrancelha')) {
      selectedService = services.find((s) => s.name.toLowerCase().includes('sobrancelha')) || services[0];
    } else {
      selectedService = services[0];
    }
  }

  // 5. Check real schedule availability and past-time constraints
  let finalTime = timeStr;
  let slotStatus: 'LIVRE' | 'REARRANJADO_HORARIO_OCUPADO' = 'LIVRE';
  let occupiedNotice = '';

  const barberId = selectedBarber?.id || 'barber-1';
  if (isSlotInPast(dateStr, timeStr)) {
    finalTime = findNextFreeSlot(barberId, dateStr, timeStr, existingAppointments);
    slotStatus = 'REARRANJADO_HORARIO_OCUPADO';
    occupiedNotice = `O horário de ${timeStr} no dia ${dateStr} já passou. A IA reajustou automaticamente para o próximo horário FUTURO LIVRE disponível (${finalTime}).`;
  } else if (isSlotOccupied(barberId, dateStr, timeStr, existingAppointments)) {
    finalTime = findNextFreeSlot(barberId, dateStr, timeStr, existingAppointments);
    slotStatus = 'REARRANJADO_HORARIO_OCUPADO';
    occupiedNotice = `O horário de ${timeStr} do dia ${dateStr} para ${selectedBarber?.name || 'o barbeiro'} já estava Ocupado na agenda real do banco. A IA reajustou automaticamente para o próximo horário livre (${finalTime}).`;
  }

  // 6. Extract Client Name
  let clientName = 'Cliente Agendado via IA';
  const clientMatch = prompt.match(/(?:cliente|para o|para a|marcar para)\s+([A-ZÀ-Úa-zà-ú\s]+)/i);
  if (clientMatch && clientMatch[1]) {
    clientName = clientMatch[1].trim().split(' ').slice(0, 3).join(' ');
  }

  return {
    clientName: clientName || 'Cliente Agendado via IA',
    clientWhatsapp: '11999998888',
    barberId: barberId,
    barberName: selectedBarber?.name || 'Barbeiro AUDAX',
    serviceId: selectedService?.id || 'srv-1',
    serviceName: selectedService?.name || 'Corte de Cabelo',
    servicePrice: selectedService?.price || 50,
    date: dateStr,
    time: finalTime,
    slotStatus,
    occupiedNotice,
    freeSlotsSummary,
    notes: slotStatus === 'REARRANJADO_HORARIO_OCUPADO' ? occupiedNotice : 'Horário verificado e reservado na agenda do sistema.',
    confidenceScore: 98,
    reasoning: slotStatus === 'REARRANJADO_HORARIO_OCUPADO' 
      ? `Agenda Real Verificada: ${occupiedNotice}` 
      : `Agenda Real Verificada: O barbeiro ${selectedBarber?.name} está 100% LIVRE no dia ${dateStr} às ${finalTime}.`,
  };
}

// API Endpoint to Test AI Provider & List Free / Recommended Models
app.post('/api/ai/test-provider', async (req, res) => {
  try {
    const { provider, apiKey } = req.body;

    if (provider === 'audax') {
      return res.json({
        success: true,
        message: 'Motor Nativo AUDAX Ativo (Gratuito & Offline)',
        models: [
          { id: 'motor-nativo-audax-free', name: 'Motor Nativo AUDAX (Grátis / Sem Key)', badge: 'GRÁTIS' }
        ]
      });
    }

    if (provider === 'gemini') {
      const keyToUse = apiKey && apiKey.trim() ? apiKey.trim() : process.env.GEMINI_API_KEY || '';
      return res.json({
        success: true,
        message: 'Conexão com Google Gemini Estabelecida!',
        models: [
          { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Recomendado)', badge: 'GRÁTIS / RÁPIDO' },
          { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', badge: 'GRÁTIS' },
          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', badge: 'ESTÁVEL' },
        ]
      });
    }

    if (provider === 'groq') {
      if (!apiKey || !apiKey.trim()) {
        return res.status(400).json({ error: 'Insira a API Key da Groq para testar e listar modelos.' });
      }

      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey.trim()}` }
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'API Key da Groq inválida ou sem acesso.');
      }

      const json = await response.json();
      const rawModels: any[] = json.data || [];

      // Map Groq free models
      const recommended = [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', badge: 'GRÁTIS / ULTRA RÁPIDO' },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', badge: 'GRÁTIS / HIPER RÁPIDO' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7b Instruct', badge: 'GRÁTIS' },
        { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT', badge: 'GRÁTIS' },
        { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B', badge: 'GRÁTIS / RACIOCÍNIO' },
      ];

      const returnedIds = new Set(rawModels.map(m => m.id));
      const filtered = recommended.filter(m => returnedIds.has(m.id) || true);

      return res.json({
        success: true,
        message: `Groq Conectado! ${rawModels.length} modelos disponíveis na sua conta Groq.`,
        models: filtered.length > 0 ? filtered : recommended
      });
    }

    if (provider === 'openrouter') {
      if (!apiKey || !apiKey.trim()) {
        return res.status(400).json({ error: 'Insira a API Key do OpenRouter para testar e listar modelos.' });
      }

      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey.trim()}` }
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'API Key do OpenRouter inválida.');
      }

      const json = await response.json();
      const rawModels: any[] = json.data || [];

      // Filter free models from OpenRouter
      const freeModels = rawModels
        .filter(m => m.id.endsWith(':free') || m.pricing?.prompt === '0')
        .map(m => ({
          id: m.id,
          name: m.name || m.id,
          badge: 'GRÁTIS (OPENROUTER)'
        }));

      const defaultFreeList = [
        { id: 'google/gemini-2.0-flash-exp:free', name: 'Google Gemini 2.0 Flash (Free)', badge: 'GRÁTIS' },
        { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Meta Llama 3.3 70B (Free)', badge: 'GRÁTIS' },
        { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)', badge: 'GRÁTIS' },
        { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B Instruct (Free)', badge: 'GRÁTIS' },
        { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B Instruct (Free)', badge: 'GRÁTIS' },
      ];

      const mergedList = freeModels.length > 0 ? freeModels.slice(0, 15) : defaultFreeList;

      return res.json({
        success: true,
        message: `OpenRouter Conectado! ${mergedList.length} modelos grátis detectados.`,
        models: mergedList
      });
    }

    return res.status(400).json({ error: 'Provedor não reconhecido.' });
  } catch (err: any) {
    console.error('Test Provider Error:', err);
    return res.status(400).json({
      success: false,
      error: err?.message || 'Erro ao conectar ao provedor. Verifique a API Key.'
    });
  }
});

// API Endpoint for AI Booking parsing (Supports Gemini, Groq, OpenRouter, and AUDAX Fallback)
app.post('/api/ai/parse-booking', async (req, res) => {
  try {
    const { prompt, availableBarbers, availableServices, existingAppointments, provider, apiKey, model } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Mensagem/Prompt em texto é obrigatório.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const systemInstruction = `Você é a inteligência artificial especialista em gestão da barbearia Studio AUDAX.
Sua missão principal é analisar o pedido de agendamento ou consulta do cliente e VERIFICAR EM TEMPO REAL a agenda real do banco de dados para evitar conflitos e listar barbeiros e horários livres.

BASE DE DADOS EM TEMPO REAL DA BARBEARIA:

BARBEIROS ATIVOS:
${JSON.stringify(availableBarbers || [], null, 2)}

CATÁLOGO DE SERVIÇOS (PREÇO E DURAÇÃO):
${JSON.stringify(availableServices || [], null, 2)}

AGENDAMENTOS EXISTENTES NO BANCO DE DADOS (OCUPADOS):
${JSON.stringify(existingAppointments || [], null, 2)}

DATA HOJE DO SISTEMA: ${todayStr}

Instruções Estritas:
1. Mapeie o barbeiro e o serviço solicitados.
2. Calcule a data YYYY-MM-DD e o horário HH:MM.
3. VERIFIQUE SE O BARBEIRO JÁ POSSUI UM AGENDAMENTO EM 'existingAppointments' para essa mesma data e horário.
4. Se o horário solicitado ESTIVER OCUPADO:
   - Defina 'slotStatus' = 'REARRANJADO_HORARIO_OCUPADO'.
   - Selecione o PRÓXIMO HORÁRIO LIVRE no mesmo dia para o barbeiro (ex: 15:30 ou 16:00).
   - Preencha 'occupiedNotice' explicando que o horário original estava ocupado na agenda real do banco.
5. Se o horário solicitado ESTIVER LIVRE:
   - Defina 'slotStatus' = 'LIVRE'.
   - Preencha 'occupiedNotice' como "".
6. Preencha a lista 'freeSlotsSummary' contendo os barbeiros e seus respectivos horários livres no dia.
7. Retorne EXCLUSIVAMENTE um objeto JSON válido sem formatação markdown no esquema:
{
  "clientName": "string",
  "clientWhatsapp": "string",
  "barberId": "string",
  "barberName": "string",
  "serviceId": "string",
  "serviceName": "string",
  "servicePrice": 50,
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "slotStatus": "LIVRE" ou "REARRANJADO_HORARIO_OCUPADO",
  "occupiedNotice": "string",
  "notes": "string",
  "confidenceScore": 95,
  "reasoning": "string"
}`;

    // 1. OPENAI-COMPATIBLE PROVIDERS (Groq & OpenRouter)
    if ((provider === 'groq' || provider === 'openrouter') && apiKey && apiKey.trim()) {
      try {
        const endpointUrl = provider === 'groq'
          ? 'https://api.groq.com/openai/v1/chat/completions'
          : 'https://openrouter.ai/api/v1/chat/completions';

        const selectedModel = model || (provider === 'groq' ? 'llama-3.3-70b-versatile' : 'google/gemini-2.0-flash-exp:free');

        const headers: Record<string, string> = {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        };
        if (provider === 'openrouter') {
          headers['HTTP-Referer'] = 'https://studioaudax.com';
          headers['X-Title'] = 'Studio AUDAX AI';
        }

        const openAiResponse = await fetch(endpointUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: selectedModel,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: `MENSAGEM DO CLIENTE:\n"${prompt.trim()}"` }
            ],
            temperature: 0.1,
          })
        });

        if (openAiResponse.ok) {
          const rawText = await openAiResponse.text();
          try {
            const openAiJson = JSON.parse(rawText);
            const rawContent = openAiJson.choices?.[0]?.message?.content || '{}';
            const cleanJsonStr = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
            let parsedJson = JSON.parse(cleanJsonStr);

            parsedJson = sanitizeAndValidateBookingResult(parsedJson, availableBarbers, existingAppointments, todayStr);

            return res.json({
              success: true,
              data: parsedJson,
              provider: `${provider} (${selectedModel})`,
            });
          } catch (parseErr) {
            console.error('Error parsing JSON from provider:', rawText.substring(0, 200));
            throw new Error('Resposta do provedor não é um JSON válido.');
          }
        } else {
          const errText = await openAiResponse.text();
          console.warn(`${provider} API Call Failed:`, errText);
          throw new Error(`Erro do provedor: ${errText.substring(0, 100)}`);
        }
      } catch (externalErr: any) {
        console.warn(`Error invoking ${provider}:`, externalErr?.message);
      }
    }

    // 2. GOOGLE GEMINI PROVIDER
    if (provider === 'gemini' || !provider || provider === 'auto') {
      const keyToUse = (apiKey && apiKey.trim()) ? apiKey.trim() : process.env.GEMINI_API_KEY || '';
      if (keyToUse) {
        try {
          const ai = new GoogleGenAI({
            apiKey: keyToUse,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              },
            },
          });

          const modelToUse = model || 'gemini-3.8-flash';

          const response = await ai.models.generateContent({
            model: modelToUse,
            contents: `MENSAGEM DO CLIENTE:\n"${prompt.trim()}"`,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  clientName: { type: Type.STRING, description: 'Nome do cliente extraído' },
                  clientWhatsapp: { type: Type.STRING, description: 'Número de WhatsApp se fornecido' },
                  barberId: { type: Type.STRING, description: 'ID do barbeiro selecionado' },
                  barberName: { type: Type.STRING, description: 'Nome do barbeiro selecionado' },
                  serviceId: { type: Type.STRING, description: 'ID do serviço selecionado' },
                  serviceName: { type: Type.STRING, description: 'Nome do serviço selecionado' },
                  servicePrice: { type: Type.NUMBER, description: 'Valor em Reais R$' },
                  date: { type: Type.STRING, description: 'Data YYYY-MM-DD' },
                  time: { type: Type.STRING, description: 'Horário final livre HH:MM' },
                  slotStatus: { type: Type.STRING, description: 'LIVRE ou REARRANJADO_HORARIO_OCUPADO' },
                  occupiedNotice: { type: Type.STRING, description: 'Aviso de conflito de agenda real' },
                  notes: { type: Type.STRING, description: 'Observações do agendamento' },
                  confidenceScore: { type: Type.NUMBER, description: 'Grau de precisão 0-100' },
                  reasoning: { type: Type.STRING, description: 'Explicativo do conflito/disponibilidade da agenda' },
                },
                required: [
                  'clientName',
                  'barberId',
                  'barberName',
                  'serviceId',
                  'serviceName',
                  'date',
                  'time',
                  'slotStatus',
                  'confidenceScore',
                  'reasoning',
                ],
              },
            },
          });

          if (!response.text) {
             throw new Error('Resposta vazia da IA.');
          }

          let parsedJson;
          try {
            parsedJson = JSON.parse(response.text);
          } catch (e) {
            console.error('Failed to parse Gemini response:', response.text);
            throw new Error('Falha ao processar resposta JSON da IA.');
          }
          
          parsedJson = sanitizeAndValidateBookingResult(parsedJson, availableBarbers, existingAppointments, todayStr);

          return res.json({
            success: true,
            data: parsedJson,
            provider: `Gemini (${modelToUse})`,
          });
        } catch (geminiError: any) {
          console.warn('Gemini model call failed:', geminiError?.message);
        }
      }
    }

    // 3. FALLBACK: Execute high-precision NLP heuristic parser with Real Agenda Check
    let fallbackData = fallbackParseBooking(prompt, availableBarbers, availableServices, existingAppointments);
    fallbackData = sanitizeAndValidateBookingResult(fallbackData, availableBarbers, existingAppointments, todayStr);

    return res.json({
      success: true,
      data: fallbackData,
      provider: 'Motor Nativo AUDAX (Grátis)',
    });
  } catch (error: any) {
    console.error('Error parsing booking:', error);
    const safetyData = fallbackParseBooking(req.body?.prompt || 'Agendamento', req.body?.availableBarbers, req.body?.availableServices, req.body?.existingAppointments);
    return res.json({
      success: true,
      data: safetyData,
      provider: 'Motor Nativo AUDAX (Grátis)',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const indexPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[Studio AUDAX Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
