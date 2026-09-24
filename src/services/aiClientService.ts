// Client-Side AI Service for AUDAX
// Runs directly in the browser with full CORS support on Vercel, Netlify, and Cloud hosts.
// Prevents any "Unexpected token 'T' / The page could not be found" HTML 404 proxy errors.

import {
  ParsedAiResult,
  fallbackParseBooking,
  sanitizeAndValidateBookingResult,
  buildAiSystemInstruction,
  getTodayAndCurrentTimeInBrazil,
} from '../lib/aiBookingLogic';

export interface ProviderModelOption {
  id: string;
  name: string;
  badge?: string;
}

export type ProviderType = 'gemini' | 'groq' | 'openrouter' | 'audax';

export interface TestProviderResponse {
  success: boolean;
  message: string;
  models: ProviderModelOption[];
}

export interface ParseBookingParams {
  prompt: string;
  provider: ProviderType;
  apiKey?: string;
  model?: string;
  availableBarbers: any[];
  availableServices: any[];
  existingAppointments: any[];
}

export interface ParseBookingResponse {
  success: boolean;
  data: ParsedAiResult;
  provider: string;
}

/**
 * Tests connection with the selected AI provider directly from the client.
 * Does not depend on any backend /api route.
 */
export async function testProviderDirect(
  provider: ProviderType,
  apiKey?: string
): Promise<TestProviderResponse> {
  const cleanKey = apiKey ? apiKey.trim() : '';

  // 1. Motor AUDAX (100% Free & Local)
  if (provider === 'audax') {
    return {
      success: true,
      message: 'Motor Nativo AUDAX Ativo (Gratuito & Offline)',
      models: [
        { id: 'motor-nativo-audax-free', name: 'Motor Nativo AUDAX (Grátis / Sem Key)', badge: 'GRÁTIS' },
      ],
    };
  }

  // 2. Google Gemini
  if (provider === 'gemini') {
    const recommendedGeminiModels: ProviderModelOption[] = [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recomendado)', badge: 'GRÁTIS / RÁPIDO' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', badge: 'GRÁTIS' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', badge: 'ESTÁVEL' },
    ];

    if (!cleanKey) {
      return {
        success: true,
        message: 'Google Gemini selecionado. Insira sua API Key para validar os modelos.',
        models: recommendedGeminiModels,
      };
    }

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`);
      if (!res.ok) {
        const text = await res.text();
        let errMsg = 'API Key do Google Gemini inválida ou sem permissão.';
        try {
          const errObj = JSON.parse(text);
          if (errObj.error?.message) errMsg = errObj.error.message;
        } catch (_) {}
        throw new Error(errMsg);
      }

      return {
        success: true,
        message: 'Conexão com Google Gemini Estabelecida e Validada com Sucesso!',
        models: recommendedGeminiModels,
      };
    } catch (err: any) {
      throw new Error(err?.message || 'Falha ao validar API Key do Google Gemini.');
    }
  }

  // 3. Groq
  if (provider === 'groq') {
    if (!cleanKey) {
      throw new Error('Insira a API Key da Groq para testar e listar modelos.');
    }

    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${cleanKey}` },
      });

      const text = await res.text();
      if (!res.ok) {
        let errMsg = 'API Key da Groq inválida ou sem acesso.';
        try {
          const errObj = JSON.parse(text);
          if (errObj.error?.message) errMsg = errObj.error.message;
        } catch (_) {}
        throw new Error(errMsg);
      }

      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        throw new Error('A API da Groq retornou uma resposta inválida (não JSON). Verifique sua rede.');
      }
      
      const rawModels: any[] = json.data || [];

      const recommended: ProviderModelOption[] = [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', badge: 'GRÁTIS / ULTRA RÁPIDO' },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', badge: 'GRÁTIS / HIPER RÁPIDO' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7b Instruct', badge: 'GRÁTIS' },
        { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT', badge: 'GRÁTIS' },
        { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B', badge: 'GRÁTIS / RACIOCÍNIO' },
      ];

      return {
        success: true,
        message: `Groq Conectado! ${rawModels.length || recommended.length} modelos disponíveis na sua conta Groq.`,
        models: recommended,
      };
    } catch (err: any) {
      throw new Error(err?.message || 'Erro ao conectar à API da Groq.');
    }
  }

  // 4. OpenRouter
  if (provider === 'openrouter') {
    if (!cleanKey) {
      throw new Error('Insira a API Key do OpenRouter para testar e listar modelos.');
    }

    try {
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${cleanKey}` },
      });

      const text = await res.text();
      if (!res.ok) {
        let errMsg = 'API Key do OpenRouter inválida.';
        try {
          const errObj = JSON.parse(text);
          if (errObj.error?.message) errMsg = errObj.error.message;
        } catch (_) {}
        throw new Error(errMsg);
      }

      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        throw new Error('O OpenRouter retornou uma resposta inválida (não JSON). Verifique sua rede.');
      }
      
      const rawModels: any[] = json.data || [];

      const freeModels: ProviderModelOption[] = rawModels
        .filter((m) => m.id.endsWith(':free') || m.pricing?.prompt === '0')
        .map((m) => ({
          id: m.id,
          name: m.name || m.id,
          badge: 'GRÁTIS',
        }));

      const defaultFreeList: ProviderModelOption[] = [
        { id: 'google/gemini-2.0-flash-exp:free', name: 'Google Gemini 2.0 Flash (Free)', badge: 'GRÁTIS' },
        { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Meta Llama 3.3 70B (Free)', badge: 'GRÁTIS' },
        { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)', badge: 'GRÁTIS' },
        { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B Instruct (Free)', badge: 'GRÁTIS' },
        { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B Instruct (Free)', badge: 'GRÁTIS' },
      ];

      const mergedList = freeModels.length > 0 ? freeModels.slice(0, 15) : defaultFreeList;

      return {
        success: true,
        message: `OpenRouter Conectado! ${mergedList.length} modelos grátis detectados.`,
        models: mergedList,
      };
    } catch (err: any) {
      throw new Error(err?.message || 'Erro ao conectar à API do OpenRouter.');
    }
  }

  throw new Error('Provedor não reconhecido.');
}

/**
 * Parses user prompt and checks real database slots using the chosen AI provider.
 * Runs 100% in browser, completely independent of backend server routes.
 */
export async function parseBookingDirect(params: ParseBookingParams): Promise<ParseBookingResponse> {
  const { prompt, provider, apiKey, model, availableBarbers, availableServices, existingAppointments } = params;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('Mensagem/Prompt em texto é obrigatório.');
  }

  const cleanKey = apiKey ? apiKey.trim() : '';
  const { todayStr } = getTodayAndCurrentTimeInBrazil();
  const systemInstruction = buildAiSystemInstruction(availableBarbers, availableServices, existingAppointments, todayStr);

  // 1. GROQ (Direct Browser Request with CORS)
  if (provider === 'groq' && cleanKey) {
    try {
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
        throw new Error(errMsg);
      }

      let resJson;
      try {
        resJson = JSON.parse(errText);
      } catch (e) {
        throw new Error('A API da Groq retornou uma resposta inválida (não JSON). Verifique sua chave ou limite de requisições.');
      }

      const rawContent = resJson.choices?.[0]?.message?.content || '{}';
      const cleanJsonStr = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
      let parsed = JSON.parse(cleanJsonStr);
      parsed = sanitizeAndValidateBookingResult(parsed, availableBarbers, existingAppointments, todayStr);

      return {
        success: true,
        data: parsed,
        provider: `Groq (${selectedModel})`,
      };
    } catch (err: any) {
      console.warn('Groq direct call failed, falling back to local heuristic:', err?.message);
      // Fallback cleanly to native parser
    }
  }

  // 2. OPENROUTER (Direct Browser Request with CORS)
  if (provider === 'openrouter' && cleanKey) {
    try {
      const selectedModel = model || 'google/gemini-2.0-flash-exp:free';
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://studioaudax.com';

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cleanKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': origin,
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
        throw new Error(errMsg);
      }

      let resJson;
      try {
        resJson = JSON.parse(errText);
      } catch (e) {
        throw new Error('O OpenRouter retornou uma resposta inválida (não JSON). Verifique sua chave ou limite de requisições.');
      }

      const rawContent = resJson.choices?.[0]?.message?.content || '{}';
      const cleanJsonStr = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
      let parsed = JSON.parse(cleanJsonStr);
      parsed = sanitizeAndValidateBookingResult(parsed, availableBarbers, existingAppointments, todayStr);

      return {
        success: true,
        data: parsed,
        provider: `OpenRouter (${selectedModel})`,
      };
    } catch (err: any) {
      console.warn('OpenRouter direct call failed, falling back to local heuristic:', err?.message);
    }
  }

  // 3. GOOGLE GEMINI (Direct Browser REST API Request with CORS)
  if (provider === 'gemini' && cleanKey) {
    try {
      const selectedModel = model && model.includes('gemini') ? model : 'gemini-2.5-flash';
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
        throw new Error(errMsg);
      }

      let resJson;
      try {
        resJson = JSON.parse(errText);
      } catch (e) {
        throw new Error('O Google Gemini retornou uma resposta inválida (não JSON). Verifique sua chave ou limite de requisições.');
      }

      const rawContent = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const cleanJsonStr = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
      let parsed = JSON.parse(cleanJsonStr);
      parsed = sanitizeAndValidateBookingResult(parsed, availableBarbers, existingAppointments, todayStr);

      return {
        success: true,
        data: parsed,
        provider: `Gemini (${selectedModel})`,
      };
    } catch (err: any) {
      console.warn('Gemini direct call failed, falling back to local heuristic:', err?.message);
    }
  }

  // 4. MOTOR NATIVO AUDAX (Local Heuristic Engine with Real Schedule Checking)
  let fallbackData = fallbackParseBooking(prompt, availableBarbers, availableServices, existingAppointments);
  fallbackData = sanitizeAndValidateBookingResult(fallbackData, availableBarbers, existingAppointments, todayStr);

  return {
    success: true,
    data: fallbackData,
    provider: 'Motor Nativo AUDAX (Grátis)',
  };
}
