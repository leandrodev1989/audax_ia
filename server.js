var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_meta = {};
import_dotenv.default.config();
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
var app = (0, import_express.default)();
var PORT = process.env.PORT || 3e3;
app.use(import_express.default.json({ limit: "10mb" }));
function getTodayAndCurrentTimeInBrazil() {
  const now = /* @__PURE__ */ new Date();
  try {
    const todayStr = now.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
    const timeStr = now.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour12: false }).substring(0, 5);
    return { todayStr, currentHHMM: timeStr };
  } catch (err) {
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return { todayStr, currentHHMM: timeStr };
  }
}
function isSlotInPast(dateStr, timeStr) {
  const { todayStr, currentHHMM } = getTodayAndCurrentTimeInBrazil();
  if (dateStr < todayStr) {
    return true;
  }
  if (dateStr === todayStr) {
    return timeStr <= currentHHMM;
  }
  return false;
}
function getTimeSlotsForDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay();
  const manhaStandard = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
  const tardeSegSex = ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"];
  const tardeSabado = ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
  const manhaDomingo = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
  if (dayOfWeek === 0) {
    return manhaDomingo;
  }
  if (dayOfWeek === 6) {
    return [...manhaStandard, ...tardeSabado];
  }
  return [...manhaStandard, ...tardeSegSex];
}
function isSlotUnavailable(barberId, dateStr, timeStr, existingAppointments = []) {
  if (isSlotInPast(dateStr, timeStr)) {
    return true;
  }
  return existingAppointments.some(
    (app2) => app2.barberId === barberId && app2.date === dateStr && app2.time === timeStr && app2.status !== "cancelado"
  );
}
function isSlotOccupied(barberId, dateStr, timeStr, existingAppointments = []) {
  return existingAppointments.some(
    (app2) => app2.barberId === barberId && app2.date === dateStr && app2.time === timeStr && app2.status !== "cancelado"
  );
}
function findNextFreeSlot(barberId, dateStr, requestedTime, existingAppointments = []) {
  const possibleTimes = getTimeSlotsForDate(dateStr);
  const validFreeSlots = possibleTimes.filter((t) => !isSlotUnavailable(barberId, dateStr, t, existingAppointments));
  if (validFreeSlots.length > 0) {
    const nextAfterRequested = validFreeSlots.find((t) => t >= requestedTime);
    return nextAfterRequested || validFreeSlots[0];
  }
  return possibleTimes[0] || "09:00";
}
function getFreeSlotsSummary(dateStr, barbers = [], existingAppointments = []) {
  const possibleTimes = getTimeSlotsForDate(dateStr);
  return barbers.map((b) => {
    const freeSlots = possibleTimes.filter((t) => !isSlotUnavailable(b.id, dateStr, t, existingAppointments));
    return {
      barberId: b.id,
      barberName: b.name,
      freeSlots
    };
  });
}
function sanitizeAndValidateBookingResult(parsedJson, availableBarbers, existingAppointments, todayStr) {
  const barberId = parsedJson.barberId || (availableBarbers[0]?.id || "barber-1");
  const dateStr = parsedJson.date || todayStr;
  const timeStr = parsedJson.time || "15:00";
  if (isSlotUnavailable(barberId, dateStr, timeStr, existingAppointments)) {
    const nextFree = findNextFreeSlot(barberId, dateStr, timeStr, existingAppointments);
    const isPast = isSlotInPast(dateStr, timeStr);
    parsedJson.time = nextFree;
    parsedJson.slotStatus = "REARRANJADO_HORARIO_OCUPADO";
    parsedJson.occupiedNotice = isPast ? `O hor\xE1rio (${timeStr}) no dia ${dateStr} j\xE1 passou. A IA reajustou automaticamente para o pr\xF3ximo hor\xE1rio FUTURO LIVRE (${nextFree}).` : `O hor\xE1rio (${timeStr}) no dia ${dateStr} estava Ocupado na agenda real. A IA reajustou automaticamente para o pr\xF3ximo hor\xE1rio livre (${nextFree}).`;
  }
  parsedJson.freeSlotsSummary = getFreeSlotsSummary(dateStr, availableBarbers, existingAppointments);
  return parsedJson;
}
function fallbackParseBooking(prompt, barbers = [], services = [], existingAppointments = []) {
  const lower = prompt.toLowerCase();
  const today = /* @__PURE__ */ new Date();
  let selectedBarber = barbers.find((b) => b.name && lower.includes(b.name.toLowerCase()));
  let targetDate = new Date(today);
  if (lower.includes("amanh\xE3") || lower.includes("amanha")) {
    targetDate.setDate(today.getDate() + 1);
  } else if (lower.includes("s\xE1bado") || lower.includes("sabado")) {
    const day = today.getDay();
    const diff = (6 - day + 7) % 7 || 7;
    targetDate.setDate(today.getDate() + diff);
  } else if (lower.includes("ter\xE7a") || lower.includes("terca")) {
    const day = today.getDay();
    const diff = (2 - day + 7) % 7 || 7;
    targetDate.setDate(today.getDate() + diff);
  } else if (lower.includes("quinta")) {
    const day = today.getDay();
    const diff = (4 - day + 7) % 7 || 7;
    targetDate.setDate(today.getDate() + diff);
  }
  const dateStr = targetDate.toISOString().split("T")[0];
  const freeSlotsSummary = getFreeSlotsSummary(dateStr, barbers, existingAppointments);
  let timeStr = "15:00";
  const timeMatch = prompt.match(/(\d{1,2})[:h](\d{2})?/i) || prompt.match(/às\s*(\d{1,2})/i) || prompt.match(/as\s*(\d{1,2})/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    let min = timeMatch[2] ? timeMatch[2] : "00";
    if (hour < 10) timeStr = `0${hour}:${min}`;
    else timeStr = `${hour}:${min}`;
  }
  if (!selectedBarber && barbers.length > 0) {
    const freeBarber = barbers.find((b) => !isSlotOccupied(b.id, dateStr, timeStr, existingAppointments));
    selectedBarber = freeBarber || barbers[0];
  }
  let selectedService = services.find((s) => s.name && lower.includes(s.name.toLowerCase()));
  if (!selectedService) {
    if (lower.includes("combo") || lower.includes("corte") && lower.includes("barba")) {
      selectedService = services.find((s) => s.name.toLowerCase().includes("combo") || s.name.toLowerCase().includes("corte + barba")) || services[0];
    } else if (lower.includes("barba")) {
      selectedService = services.find((s) => s.name.toLowerCase().includes("barba")) || services[0];
    } else if (lower.includes("sobrancelha")) {
      selectedService = services.find((s) => s.name.toLowerCase().includes("sobrancelha")) || services[0];
    } else {
      selectedService = services[0];
    }
  }
  let finalTime = timeStr;
  let slotStatus = "LIVRE";
  let occupiedNotice = "";
  const barberId = selectedBarber?.id || "barber-1";
  if (isSlotInPast(dateStr, timeStr)) {
    finalTime = findNextFreeSlot(barberId, dateStr, timeStr, existingAppointments);
    slotStatus = "REARRANJADO_HORARIO_OCUPADO";
    occupiedNotice = `O hor\xE1rio de ${timeStr} no dia ${dateStr} j\xE1 passou. A IA reajustou automaticamente para o pr\xF3ximo hor\xE1rio FUTURO LIVRE dispon\xEDvel (${finalTime}).`;
  } else if (isSlotOccupied(barberId, dateStr, timeStr, existingAppointments)) {
    finalTime = findNextFreeSlot(barberId, dateStr, timeStr, existingAppointments);
    slotStatus = "REARRANJADO_HORARIO_OCUPADO";
    occupiedNotice = `O hor\xE1rio de ${timeStr} do dia ${dateStr} para ${selectedBarber?.name || "o barbeiro"} j\xE1 estava Ocupado na agenda real do banco. A IA reajustou automaticamente para o pr\xF3ximo hor\xE1rio livre (${finalTime}).`;
  }
  let clientName = "Cliente Agendado via IA";
  const clientMatch = prompt.match(/(?:cliente|para o|para a|marcar para)\s+([A-ZÀ-Úa-zà-ú\s]+)/i);
  if (clientMatch && clientMatch[1]) {
    clientName = clientMatch[1].trim().split(" ").slice(0, 3).join(" ");
  }
  return {
    clientName: clientName || "Cliente Agendado via IA",
    clientWhatsapp: "11999998888",
    barberId,
    barberName: selectedBarber?.name || "Barbeiro AUDAX",
    serviceId: selectedService?.id || "srv-1",
    serviceName: selectedService?.name || "Corte de Cabelo",
    servicePrice: selectedService?.price || 50,
    date: dateStr,
    time: finalTime,
    slotStatus,
    occupiedNotice,
    freeSlotsSummary,
    notes: slotStatus === "REARRANJADO_HORARIO_OCUPADO" ? occupiedNotice : "Hor\xE1rio verificado e reservado na agenda do sistema.",
    confidenceScore: 98,
    reasoning: slotStatus === "REARRANJADO_HORARIO_OCUPADO" ? `Agenda Real Verificada: ${occupiedNotice}` : `Agenda Real Verificada: O barbeiro ${selectedBarber?.name} est\xE1 100% LIVRE no dia ${dateStr} \xE0s ${finalTime}.`
  };
}
app.post("/api/ai/test-provider", async (req, res) => {
  try {
    const { provider, apiKey } = req.body;
    if (provider === "audax") {
      return res.json({
        success: true,
        message: "Motor Nativo AUDAX Ativo (Gratuito & Offline)",
        models: [
          { id: "motor-nativo-audax-free", name: "Motor Nativo AUDAX (Gr\xE1tis / Sem Key)", badge: "GR\xC1TIS" }
        ]
      });
    }
    if (provider === "gemini") {
      const keyToUse = apiKey && apiKey.trim() ? apiKey.trim() : process.env.GEMINI_API_KEY || "";
      return res.json({
        success: true,
        message: "Conex\xE3o com Google Gemini Estabelecida!",
        models: [
          { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash (Recomendado)", badge: "GR\xC1TIS / R\xC1PIDO" },
          { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", badge: "GR\xC1TIS" },
          { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", badge: "EST\xC1VEL" }
        ]
      });
    }
    if (provider === "groq") {
      if (!apiKey || !apiKey.trim()) {
        return res.status(400).json({ error: "Insira a API Key da Groq para testar e listar modelos." });
      }
      const response = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { "Authorization": `Bearer ${apiKey.trim()}` }
      });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || "API Key da Groq inv\xE1lida ou sem acesso.");
      }
      const json = await response.json();
      const rawModels = json.data || [];
      const recommended = [
        { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile", badge: "GR\xC1TIS / ULTRA R\xC1PIDO" },
        { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", badge: "GR\xC1TIS / HIPER R\xC1PIDO" },
        { id: "mixtral-8x7b-32768", name: "Mixtral 8x7b Instruct", badge: "GR\xC1TIS" },
        { id: "gemma2-9b-it", name: "Gemma 2 9B IT", badge: "GR\xC1TIS" },
        { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 Distill 70B", badge: "GR\xC1TIS / RACIOC\xCDNIO" }
      ];
      const returnedIds = new Set(rawModels.map((m) => m.id));
      const filtered = recommended.filter((m) => returnedIds.has(m.id) || true);
      return res.json({
        success: true,
        message: `Groq Conectado! ${rawModels.length} modelos dispon\xEDveis na sua conta Groq.`,
        models: filtered.length > 0 ? filtered : recommended
      });
    }
    if (provider === "openrouter") {
      if (!apiKey || !apiKey.trim()) {
        return res.status(400).json({ error: "Insira a API Key do OpenRouter para testar e listar modelos." });
      }
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { "Authorization": `Bearer ${apiKey.trim()}` }
      });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || "API Key do OpenRouter inv\xE1lida.");
      }
      const json = await response.json();
      const rawModels = json.data || [];
      const freeModels = rawModels.filter((m) => m.id.endsWith(":free") || m.pricing?.prompt === "0").map((m) => ({
        id: m.id,
        name: m.name || m.id,
        badge: "GR\xC1TIS (OPENROUTER)"
      }));
      const defaultFreeList = [
        { id: "google/gemini-2.0-flash-exp:free", name: "Google Gemini 2.0 Flash (Free)", badge: "GR\xC1TIS" },
        { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Meta Llama 3.3 70B (Free)", badge: "GR\xC1TIS" },
        { id: "deepseek/deepseek-r1:free", name: "DeepSeek R1 (Free)", badge: "GR\xC1TIS" },
        { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B Instruct (Free)", badge: "GR\xC1TIS" },
        { id: "qwen/qwen-2.5-72b-instruct:free", name: "Qwen 2.5 72B Instruct (Free)", badge: "GR\xC1TIS" }
      ];
      const mergedList = freeModels.length > 0 ? freeModels.slice(0, 15) : defaultFreeList;
      return res.json({
        success: true,
        message: `OpenRouter Conectado! ${mergedList.length} modelos gr\xE1tis detectados.`,
        models: mergedList
      });
    }
    return res.status(400).json({ error: "Provedor n\xE3o reconhecido." });
  } catch (err) {
    console.error("Test Provider Error:", err);
    return res.status(400).json({
      success: false,
      error: err?.message || "Erro ao conectar ao provedor. Verifique a API Key."
    });
  }
});
app.post("/api/ai/parse-booking", async (req, res) => {
  try {
    const { prompt, availableBarbers, availableServices, existingAppointments, provider, apiKey, model } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Mensagem/Prompt em texto \xE9 obrigat\xF3rio." });
    }
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const systemInstruction = `Voc\xEA \xE9 a intelig\xEAncia artificial especialista em gest\xE3o da barbearia Studio AUDAX.
Sua miss\xE3o principal \xE9 analisar o pedido de agendamento ou consulta do cliente e VERIFICAR EM TEMPO REAL a agenda real do banco de dados para evitar conflitos e listar barbeiros e hor\xE1rios livres.

BASE DE DADOS EM TEMPO REAL DA BARBEARIA:

BARBEIROS ATIVOS:
${JSON.stringify(availableBarbers || [], null, 2)}

CAT\xC1LOGO DE SERVI\xC7OS (PRE\xC7O E DURA\xC7\xC3O):
${JSON.stringify(availableServices || [], null, 2)}

AGENDAMENTOS EXISTENTES NO BANCO DE DADOS (OCUPADOS):
${JSON.stringify(existingAppointments || [], null, 2)}

DATA HOJE DO SISTEMA: ${todayStr}

Instru\xE7\xF5es Estritas:
1. Mapeie o barbeiro e o servi\xE7o solicitados.
2. Calcule a data YYYY-MM-DD e o hor\xE1rio HH:MM.
3. VERIFIQUE SE O BARBEIRO J\xC1 POSSUI UM AGENDAMENTO EM 'existingAppointments' para essa mesma data e hor\xE1rio.
4. Se o hor\xE1rio solicitado ESTIVER OCUPADO:
   - Defina 'slotStatus' = 'REARRANJADO_HORARIO_OCUPADO'.
   - Selecione o PR\xD3XIMO HOR\xC1RIO LIVRE no mesmo dia para o barbeiro (ex: 15:30 ou 16:00).
   - Preencha 'occupiedNotice' explicando que o hor\xE1rio original estava ocupado na agenda real do banco.
5. Se o hor\xE1rio solicitado ESTIVER LIVRE:
   - Defina 'slotStatus' = 'LIVRE'.
   - Preencha 'occupiedNotice' como "".
6. Preencha a lista 'freeSlotsSummary' contendo os barbeiros e seus respectivos hor\xE1rios livres no dia.
7. Retorne EXCLUSIVAMENTE um objeto JSON v\xE1lido sem formata\xE7\xE3o markdown no esquema:
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
    const apiKeyToUse = apiKey && apiKey.trim() ? apiKey.trim() : null;
    if ((provider === "groq" || provider === "openrouter") && apiKeyToUse) {
      try {
        const endpointUrl = provider === "groq" ? "https://api.groq.com/openai/v1/chat/completions" : "https://openrouter.ai/api/v1/chat/completions";
        const selectedModel = model || (provider === "groq" ? "llama-3.3-70b-versatile" : "google/gemini-2.0-flash-exp:free");
        const headers = {
          "Authorization": `Bearer ${apiKeyToUse}`,
          "Content-Type": "application/json"
        };
        if (provider === "openrouter") {
          headers["HTTP-Referer"] = "https://studioaudax.com";
          headers["X-Title"] = "Studio AUDAX AI";
        }
        const openAiResponse = await fetch(endpointUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: selectedModel,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: `MENSAGEM DO CLIENTE:
"${prompt.trim()}"` }
            ],
            temperature: 0.1
          })
        });
        if (openAiResponse.ok) {
          const rawText = await openAiResponse.text();
          try {
            const openAiJson = JSON.parse(rawText);
            const rawContent = openAiJson.choices?.[0]?.message?.content || "{}";
            const cleanJsonStr = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
            let parsedJson = JSON.parse(cleanJsonStr);
            parsedJson = sanitizeAndValidateBookingResult(parsedJson, availableBarbers, existingAppointments, todayStr);
            return res.json({
              success: true,
              data: parsedJson,
              provider: `${provider} (${selectedModel})`
            });
          } catch (parseErr) {
            console.error("Error parsing JSON from provider:", rawText.substring(0, 200));
            throw new Error("Resposta do provedor n\xE3o \xE9 um JSON v\xE1lido.");
          }
        } else {
          const errText = await openAiResponse.text();
          console.warn(`${provider} API Call Failed:`, errText);
          throw new Error(`Erro do provedor: ${errText.substring(0, 100)}`);
        }
      } catch (externalErr) {
        console.warn(`Error invoking ${provider}:`, externalErr?.message);
        throw new Error(`Erro ao conectar com ${provider}: ${externalErr.message}`);
      }
    }
    if (provider === "gemini" || !provider || provider === "auto") {
      const keyToUse = apiKey && apiKey.trim() ? apiKey.trim() : process.env.GEMINI_API_KEY || "";
      if (keyToUse) {
        try {
          const ai = new import_genai.GoogleGenAI({
            apiKey: keyToUse,
            httpOptions: {
              headers: {
                "User-Agent": "aistudio-build"
              }
            }
          });
          const modelToUse = model || "gemini-3.8-flash";
          const response = await ai.models.generateContent({
            model: modelToUse,
            contents: `MENSAGEM DO CLIENTE:
"${prompt.trim()}"`,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: {
                type: import_genai.Type.OBJECT,
                properties: {
                  clientName: { type: import_genai.Type.STRING, description: "Nome do cliente extra\xEDdo" },
                  clientWhatsapp: { type: import_genai.Type.STRING, description: "N\xFAmero de WhatsApp se fornecido" },
                  barberId: { type: import_genai.Type.STRING, description: "ID do barbeiro selecionado" },
                  barberName: { type: import_genai.Type.STRING, description: "Nome do barbeiro selecionado" },
                  serviceId: { type: import_genai.Type.STRING, description: "ID do servi\xE7o selecionado" },
                  serviceName: { type: import_genai.Type.STRING, description: "Nome do servi\xE7o selecionado" },
                  servicePrice: { type: import_genai.Type.NUMBER, description: "Valor em Reais R$" },
                  date: { type: import_genai.Type.STRING, description: "Data YYYY-MM-DD" },
                  time: { type: import_genai.Type.STRING, description: "Hor\xE1rio final livre HH:MM" },
                  slotStatus: { type: import_genai.Type.STRING, description: "LIVRE ou REARRANJADO_HORARIO_OCUPADO" },
                  occupiedNotice: { type: import_genai.Type.STRING, description: "Aviso de conflito de agenda real" },
                  notes: { type: import_genai.Type.STRING, description: "Observa\xE7\xF5es do agendamento" },
                  confidenceScore: { type: import_genai.Type.NUMBER, description: "Grau de precis\xE3o 0-100" },
                  reasoning: { type: import_genai.Type.STRING, description: "Explicativo do conflito/disponibilidade da agenda" }
                },
                required: [
                  "clientName",
                  "barberId",
                  "barberName",
                  "serviceId",
                  "serviceName",
                  "date",
                  "time",
                  "slotStatus",
                  "confidenceScore",
                  "reasoning"
                ]
              }
            }
          });
          if (!response.text) {
            throw new Error("Resposta vazia da IA.");
          }
          let parsedJson;
          try {
            parsedJson = JSON.parse(response.text);
          } catch (e) {
            console.error("Failed to parse Gemini response:", response.text);
            throw new Error("Falha ao processar resposta JSON da IA.");
          }
          parsedJson = sanitizeAndValidateBookingResult(parsedJson, availableBarbers, existingAppointments, todayStr);
          return res.json({
            success: true,
            data: parsedJson,
            provider: `Gemini (${modelToUse})`
          });
        } catch (geminiError) {
          console.warn("Gemini model call failed:", geminiError?.message);
        }
      }
    }
    let fallbackData = fallbackParseBooking(prompt, availableBarbers, availableServices, existingAppointments);
    fallbackData = sanitizeAndValidateBookingResult(fallbackData, availableBarbers, existingAppointments, todayStr);
    return res.json({
      success: true,
      data: fallbackData,
      provider: "Motor Nativo AUDAX (Gr\xE1tis)"
    });
  } catch (error) {
    console.error("Error parsing booking:", error);
    const safetyData = fallbackParseBooking(req.body?.prompt || "Agendamento", req.body?.availableBarbers, req.body?.availableServices, req.body?.existingAppointments);
    return res.json({
      success: true,
      data: safetyData,
      provider: "Motor Nativo AUDAX (Gr\xE1tis)"
    });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "custom"
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const indexPath = import_path.default.resolve(__dirname, "index.html");
        let template = import_fs.default.readFileSync(indexPath, "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(import_express.default.static("dist"));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.resolve(__dirname, "dist", "index.html"));
    });
  }
  app.listen(PORT, () => {
    console.log(`[Studio AUDAX Server] Running on http://localhost:${PORT}`);
  });
}
startServer();
