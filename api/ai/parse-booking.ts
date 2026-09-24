import type { VercelRequest, VercelResponse } from '@vercel/node';

// Self-contained helpers to ensure 100% reliable execution in Vercel Serverless environment
export interface FreeSlotInfo {
  barberId: string;
  barberName: string;
  freeSlots: string[];
}

export interface ParsedAiResult {
  clientName: string;
  clientWhatsapp?: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  servicePrice?: number;
  date: string;
  time: string;
  slotStatus?: 'LIVRE' | 'REARRANJADO_HORARIO_OCUPADO';
  occupiedNotice?: string;
  freeSlotsSummary?: FreeSlotInfo[];
  notes?: string;
  confidenceScore: number;
  reasoning: string;
}

function getTodayAndCurrentTimeInBrazil() {
  const now = new Date();
  try {
    const todayStr = now.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
    const timeStr = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour12: false }).substring(0, 5);
    return { todayStr, currentHHMM: timeStr };
  } catch (err) {
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return { todayStr, currentHHMM: timeStr };
  }
}

function isSlotInPast(dateStr: string, timeStr: string): boolean {
  const { todayStr, currentHHMM } = getTodayAndCurrentTimeInBrazil();
  if (dateStr < todayStr) return true;
  if (dateStr === todayStr) return timeStr <= currentHHMM;
  return false;
}

function getTimeSlotsForDate(dateStr: string): string[] {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay();

  const manhaStandard = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
  const tardeSegSex = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'];
  const tardeSabado = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
  const manhaDomingo = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];

  if (dayOfWeek === 0) return manhaDomingo;
  if (dayOfWeek === 6) return [...manhaStandard, ...tardeSabado];
  return [...manhaStandard, ...tardeSegSex];
}

function isSlotUnavailable(barberId: string, dateStr: string, timeStr: string, existingAppointments: any[] = []): boolean {
  if (isSlotInPast(dateStr, timeStr)) return true;
  return existingAppointments.some(
    (app) =>
      app.barberId === barberId &&
      app.date === dateStr &&
      app.time === timeStr &&
      app.status !== 'cancelado'
  );
}

function isSlotOccupied(barberId: string, dateStr: string, timeStr: string, existingAppointments: any[] = []): boolean {
  return existingAppointments.some(
    (app) =>
      app.barberId === barberId &&
      app.date === dateStr &&
      app.time === timeStr &&
      app.status !== 'cancelado'
  );
}

function findNextFreeSlot(barberId: string, dateStr: string, requestedTime: string, existingAppointments: any[] = []): string {
  const possibleTimes = getTimeSlotsForDate(dateStr);
  const validFreeSlots = possibleTimes.filter((t) => !isSlotUnavailable(barberId, dateStr, t, existingAppointments));

  if (validFreeSlots.length > 0) {
    const nextAfterRequested = validFreeSlots.find((t) => t >= requestedTime);
    return nextAfterRequested || validFreeSlots[0];
  }
  return possibleTimes[0] || '09:00';
}

function getFreeSlotsSummary(dateStr: string, barbers: any[] = [], existingAppointments: any[] = []): FreeSlotInfo[] {
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

function sanitizeAndValidateBookingResult(
  parsedJson: any,
  availableBarbers: any[],
  existingAppointments: any[],
  todayStr: string
): ParsedAiResult {
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

  parsedJson.freeSlotsSummary = getFreeSlotsSummary(dateStr, availableBarbers, existingAppointments);
  return parsedJson as ParsedAiResult;
}

function fallbackParseBooking(
  prompt: string,
  barbers: any[] = [],
  services: any[] = [],
  existingAppointments: any[] = []
): ParsedAiResult {
  const lower = prompt.toLowerCase();
  const today = new Date();

  let selectedBarber = barbers.find((b) => b.name && lower.includes(b.name.toLowerCase()));

  const targetDate = new Date(today);
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
  const freeSlotsSummary = getFreeSlotsSummary(dateStr, barbers, existingAppointments);

  let timeStr = '15:00';
  const timeMatch = prompt.match(/(\d{1,2})[:h](\d{2})?/i) || prompt.match(/às\s*(\d{1,2})/i) || prompt.match(/as\s*(\d{1,2})/i);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1], 10);
    const min = timeMatch[2] ? timeMatch[2] : '00';
    if (hour < 10) timeStr = `0${hour}:${min}`;
    else timeStr = `${hour}:${min}`;
  }

  if (!selectedBarber && barbers.length > 0) {
    const freeBarber = barbers.find((b) => !isSlotOccupied(b.id, dateStr, timeStr, existingAppointments));
    selectedBarber = freeBarber || barbers[0];
  }

  let selectedService = services.find((s) => s.name && lower.includes(s.name.toLowerCase()));
  if (!selectedService) {
    if (lower.includes('combo') || (lower.includes('corte') && lower.includes('barba'))) {
      selectedService = services.find((s) => s.name.toLowerCase().includes('combo') || s.name.toLowerCase().includes('corte + barba')) || services[0];
    } else if (lower.includes('barba')) {
      selectedService = services.find((s) => s.name.toLowerCase().includes('barba')) || services[0];
    } else {
      selectedService = services[0];
    }
  }

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
    occupiedNotice = `O horário de ${timeStr} do dia ${dateStr} já estava ocupado. A IA reajustou automaticamente para o próximo horário livre (${finalTime}).`;
  }

  let clientName = 'Cliente Agendado via IA';
  const clientMatch = prompt.match(/(?:cliente|para o|para a|marcar para)\s+([A-ZÀ-Úa-zà-ú\s]+)/i);
  if (clientMatch && clientMatch[1]) {
    clientName = clientMatch[1].trim().split(' ').slice(0, 3).join(' ');
  }

  return {
    clientName,
    clientWhatsapp: '11999998888',
    barberId,
    barberName: selectedBarber?.name || 'Barbeiro AUDAX',
    serviceId: selectedService?.id || 'srv-1',
    serviceName: selectedService?.name || 'Corte de Cabelo',
    servicePrice: selectedService?.price || 50,
    date: dateStr,
    time: finalTime,
    slotStatus,
    occupiedNotice,
    freeSlotsSummary,
    notes: slotStatus === 'REARRANJADO_HORARIO_OCUPADO' ? occupiedNotice : 'Horário livre e reservado.',
    confidenceScore: 95,
    reasoning: slotStatus === 'REARRANJADO_HORARIO_OCUPADO' ? occupiedNotice : 'Agendamento bem sucedido.',
  };
}

function buildAiSystemInstruction(
  availableBarbers: any[],
  availableServices: any[],
  existingAppointments: any[],
  todayStr: string
): string {
  return `Você é a inteligência artificial da barbearia AUDAX.
Sua missão é analisar o pedido de agendamento e verificar a agenda real do banco de dados.

BARBEIROS:
${JSON.stringify(availableBarbers, null, 2)}

SERVIÇOS:
${JSON.stringify(availableServices, null, 2)}

AGENDAMENTOS EXISTENTES:
${JSON.stringify(existingAppointments, null, 2)}

DATA HOJE: ${todayStr}

Retorne EXCLUSIVAMENTE um objeto JSON válido sem formatação markdown no esquema:
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
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const {
    prompt,
    provider,
    apiKey,
    model,
    availableBarbers = [],
    availableServices = [],
    existingAppointments = [],
  } = req.body || {};

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ success: false, error: 'O prompt é obrigatório' });
  }

  const cleanKey = apiKey ? apiKey.trim() : '';
  const { todayStr } = getTodayAndCurrentTimeInBrazil();
  const systemInstruction = buildAiSystemInstruction(availableBarbers, availableServices, existingAppointments, todayStr);

  try {
    // 1. GROQ
    if (provider === 'groq' && cleanKey) {
      const selectedModel = model || 'llama-3.3-70b-versatile';
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cleanKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: `MENSAGEM DO CLIENTE:\n"${prompt.trim()}"` },
          ],
          temperature: 0.1,
        }),
      });

      const errText = await response.text();
      if (!response.ok) {
        let errMsg = 'Erro na chamada da API da Groq.';
        try {
          const errObj = JSON.parse(errText);
          if (errObj.error?.message) errMsg = errObj.error.message;
        } catch (_) {}
        return res.status(400).json({ success: false, error: errMsg });
      }

      let resJson;
      try {
        resJson = JSON.parse(errText);
      } catch (e) {
        throw new Error('Groq retornou formato não JSON.');
      }

      const rawContent = resJson.choices?.[0]?.message?.content || '{}';
      const cleanJsonStr = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
      let parsed = JSON.parse(cleanJsonStr);
      parsed = sanitizeAndValidateBookingResult(parsed, availableBarbers, existingAppointments, todayStr);

      return res.status(200).json({
        success: true,
        data: parsed,
        provider: `Groq (${selectedModel})`,
      });
    }

    // 2. OPENROUTER
    if (provider === 'openrouter' && cleanKey) {
      const selectedModel = model || 'google/gemini-2.0-flash-exp:free';
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cleanKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://studioaudax.com',
          'X-Title': 'AUDAX AI',
        },
        body: JSON.stringify({
          model: selectedModel,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: `MENSAGEM DO CLIENTE:\n"${prompt.trim()}"` },
          ],
          temperature: 0.1,
        }),
      });

      const errText = await response.text();
      if (!response.ok) {
        let errMsg = 'Erro na chamada da API OpenRouter.';
        try {
          const errObj = JSON.parse(errText);
          if (errObj.error?.message) errMsg = errObj.error.message;
        } catch (_) {}
        return res.status(400).json({ success: false, error: errMsg });
      }

      let resJson;
      try {
        resJson = JSON.parse(errText);
      } catch (e) {
        throw new Error('OpenRouter retornou formato não JSON.');
      }

      const rawContent = resJson.choices?.[0]?.message?.content || '{}';
      const cleanJsonStr = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
      let parsed = JSON.parse(cleanJsonStr);
      parsed = sanitizeAndValidateBookingResult(parsed, availableBarbers, existingAppointments, todayStr);

      return res.status(200).json({
        success: true,
        data: parsed,
        provider: `OpenRouter (${selectedModel})`,
      });
    }

    // 3. GEMINI
    if (provider === 'gemini' && cleanKey) {
      const selectedModel = model || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${cleanKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              parts: [{ text: `MENSAGEM DO CLIENTE:\n"${prompt.trim()}"` }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
      });

      const errText = await response.text();
      if (!response.ok) {
        let errMsg = 'Erro na API do Google Gemini.';
        try {
          const errObj = JSON.parse(errText);
          if (errObj.error?.message) errMsg = errObj.error.message;
        } catch (_) {}
        return res.status(400).json({ success: false, error: errMsg });
      }

      let resJson;
      try {
        resJson = JSON.parse(errText);
      } catch (e) {
        throw new Error('Gemini retornou formato não JSON.');
      }

      const rawContent = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const cleanJsonStr = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
      let parsed = JSON.parse(cleanJsonStr);
      parsed = sanitizeAndValidateBookingResult(parsed, availableBarbers, existingAppointments, todayStr);

      return res.status(200).json({
        success: true,
        data: parsed,
        provider: `Gemini (${selectedModel})`,
      });
    }

    // Default Fallback
    let fallbackData = fallbackParseBooking(prompt, availableBarbers, availableServices, existingAppointments);
    fallbackData = sanitizeAndValidateBookingResult(fallbackData, availableBarbers, existingAppointments, todayStr);

    return res.status(200).json({
      success: true,
      data: fallbackData,
      provider: 'Motor Nativo AUDAX (Grátis)',
    });
  } catch (err: any) {
    let fallbackData = fallbackParseBooking(prompt, availableBarbers, availableServices, existingAppointments);
    fallbackData = sanitizeAndValidateBookingResult(fallbackData, availableBarbers, existingAppointments, todayStr);

    return res.status(200).json({
      success: true,
      data: fallbackData,
      provider: 'Motor Nativo AUDAX (Grátis / Erro Provedor)',
    });
  }
}
