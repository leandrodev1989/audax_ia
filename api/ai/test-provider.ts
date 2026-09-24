import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface ProviderModelOption {
  id: string;
  name: string;
  badge?: string;
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

  const { provider, apiKey } = req.body || {};
  const cleanKey = apiKey ? apiKey.trim() : '';

  try {
    if (provider === 'audax') {
      return res.status(200).json({
        success: true,
        message: 'Motor Nativo AUDAX Ativo (Gratuito & Offline)',
        models: [
          { id: 'motor-nativo-audax-free', name: 'Motor Nativo AUDAX (Grátis / Sem Key)', badge: 'GRÁTIS' },
        ],
      });
    }

    if (provider === 'gemini') {
      const recommendedGeminiModels: ProviderModelOption[] = [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recomendado)', badge: 'GRÁTIS / RÁPIDO' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', badge: 'GRÁTIS' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', badge: 'ESTÁVEL' },
      ];

      if (!cleanKey) {
        return res.status(200).json({
          success: true,
          message: 'Google Gemini selecionado. Insira sua API Key para validar os modelos.',
          models: recommendedGeminiModels,
        });
      }

      const googleRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`);
      const text = await googleRes.text();

      if (!googleRes.ok) {
        let errMsg = 'API Key do Google Gemini inválida ou sem permissão.';
        try {
          const errObj = JSON.parse(text);
          if (errObj.error?.message) errMsg = errObj.error.message;
        } catch (_) {}
        return res.status(400).json({ success: false, error: errMsg });
      }

      return res.status(200).json({
        success: true,
        message: 'Conexão com Google Gemini Estabelecida e Validada com Sucesso!',
        models: recommendedGeminiModels,
      });
    }

    if (provider === 'groq') {
      if (!cleanKey) {
        return res.status(400).json({ success: false, error: 'Insira a API Key da Groq.' });
      }

      const groqRes = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${cleanKey}` },
      });

      const text = await groqRes.text();
      if (!groqRes.ok) {
        let errMsg = 'API Key da Groq inválida ou sem acesso.';
        try {
          const errObj = JSON.parse(text);
          if (errObj.error?.message) errMsg = errObj.error.message;
        } catch (_) {}
        return res.status(400).json({ success: false, error: errMsg });
      }

      const recommended = [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', badge: 'GRÁTIS / ULTRA RÁPIDO' },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', badge: 'GRÁTIS / HIPER RÁPIDO' },
        { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B', badge: 'GRÁTIS / RACIOCÍNIO' },
      ];

      return res.status(200).json({
        success: true,
        message: 'Groq Conectado com sucesso!',
        models: recommended,
      });
    }

    if (provider === 'openrouter') {
      if (!cleanKey) {
        return res.status(400).json({ success: false, error: 'Insira a API Key do OpenRouter.' });
      }

      const orRes = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${cleanKey}` },
      });

      const text = await orRes.text();
      if (!orRes.ok) {
        let errMsg = 'API Key do OpenRouter inválida.';
        try {
          const errObj = JSON.parse(text);
          if (errObj.error?.message) errMsg = errObj.error.message;
        } catch (_) {}
        return res.status(400).json({ success: false, error: errMsg });
      }

      const defaultFreeList = [
        { id: 'google/gemini-2.0-flash-exp:free', name: 'Google Gemini 2.0 Flash (Free)', badge: 'GRÁTIS' },
        { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Meta Llama 3.3 70B (Free)', badge: 'GRÁTIS' },
      ];

      return res.status(200).json({
        success: true,
        message: 'OpenRouter Conectado com sucesso!',
        models: defaultFreeList,
      });
    }

    return res.status(400).json({ success: false, error: 'Provedor não reconhecido' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Erro interno no teste' });
  }
}
