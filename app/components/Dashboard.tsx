"use client";
import { useState, useEffect } from "react";
import type { AIConfig } from "@/lib/config-types";

export function Dashboard({ initialConfig }: { initialConfig: AIConfig }) {
  const [config, setConfig] = useState<AIConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  
  const [pingStatus, setPingStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [pingResponse, setPingResponse] = useState("");
  
  const [triggerRepo, setTriggerRepo] = useState("");
  const [triggerPR, setTriggerPR] = useState("");
  const [triggerStatus, setTriggerStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [triggerMessage, setTriggerMessage] = useState("");
  
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/config", {
      method: "POST",
      body: JSON.stringify(config),
      headers: { "Content-Type": "application/json" },
    });
    setSaving(false);
    if (res.ok) {
      setMessage("Configurações salvas!");
      setTimeout(() => setMessage(""), 3000);
    } else {
      setMessage("Erro ao salvar.");
    }
  };

  const handlePing = async () => {
    setPingStatus("loading");
    setPingResponse("");
    try {
      const res = await fetch("/api/ping-model", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setPingStatus("success");
        setPingResponse(data.response);
      } else {
        setPingStatus("error");
        setPingResponse(data.error || "Erro desconhecido");
      }
    } catch (e: any) {
      setPingStatus("error");
      setPingResponse(e.message);
    }
  };

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    setTriggerStatus("loading");
    setTriggerMessage("");
    try {
      const res = await fetch("/api/trigger-review", {
        method: "POST",
        body: JSON.stringify({ repoFullName: triggerRepo, prNumber: triggerPR }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        setTriggerStatus("success");
        setTriggerMessage("Revisão solicitada com sucesso!");
        setTriggerRepo("");
        setTriggerPR("");
        setTimeout(() => setTriggerMessage(""), 5000);
        fetchLogs();
      } else {
        setTriggerStatus("error");
        setTriggerMessage(data.error || "Erro ao solicitar revisão");
      }
    } catch (e: any) {
      setTriggerStatus("error");
      setTriggerMessage(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] text-zinc-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-2">
              Painel de Controle IA
            </h1>
            <p className="text-zinc-400 text-lg">Gerencie o OpenReview, monitore logs e dispare análises manuais.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium text-emerald-400">Sistema Online</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Configs */}
          <div className="lg:col-span-5 space-y-8">
            {/* Settings Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Configurações da IA
              </h2>
              <form onSubmit={handleSave} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Provedor</label>
                  <select
                    value={config.provider}
                    onChange={(e) => setConfig({ ...config, provider: e.target.value as AIConfig["provider"] })}
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none"
                  >
                    <option value="anthropic">Anthropic (Padrão)</option>
                    <option value="openrouter">OpenRouter</option>
                    <option value="custom">Custom (OpenAI Compatible)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Model Name</label>
                  <input
                    type="text"
                    value={config.modelName}
                    onChange={(e) => setConfig({ ...config, modelName: e.target.value })}
                    placeholder="ex: claude-3-7-sonnet-20250219"
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">API Key</label>
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder="sk-..."
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
                {(config.provider === "openrouter" || config.provider === "custom") && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-sm font-medium text-zinc-300">Base URL</label>
                    <input
                      type="text"
                      value={config.baseUrl}
                      onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                      placeholder="https://openrouter.ai/api/v1"
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                )}
                <div className="pt-4 flex items-center justify-between">
                  <span className={`text-sm ${message.includes("Erro") ? "text-red-400" : "text-emerald-400"} transition-opacity ${message ? "opacity-100" : "opacity-0"}`}>
                    {message || " "}
                  </span>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/5 text-white font-medium transition-all transform active:scale-95 disabled:opacity-50"
                  >
                    {saving ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </form>
            </div>

            {/* Ping Model Card */}
            <div className="bg-gradient-to-br from-indigo-900/40 to-cyan-900/40 border border-indigo-500/30 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-[0_8px_32px_rgba(79,70,229,0.15)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Testar Conexão com IA
              </h2>
              <p className="text-sm text-indigo-200/70 mb-5">
                Envie um "Olá" para o modelo configurado para garantir que as chaves e rotas estão funcionando corretamente.
              </p>
              
              <button
                onClick={handlePing}
                disabled={pingStatus === "loading"}
                className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {pingStatus === "loading" ? (
                  <><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Pinging...</>
                ) : "Pingar Modelo"}
              </button>

              {pingResponse && (
                <div className={`mt-4 p-4 rounded-xl text-sm overflow-auto max-h-40 border ${pingStatus === "success" ? "bg-emerald-950/30 border-emerald-500/20 text-emerald-200" : "bg-red-950/30 border-red-500/20 text-red-200"}`}>
                  <div className="font-semibold mb-1">{pingStatus === "success" ? "Resposta da IA:" : "Erro:"}</div>
                  <div className="whitespace-pre-wrap font-mono text-xs">{pingResponse}</div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Triggers & Logs */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Manual Trigger Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Disparar Revisão Manual
              </h2>
              <form onSubmit={handleTrigger} className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  required
                  value={triggerRepo}
                  onChange={(e) => setTriggerRepo(e.target.value)}
                  placeholder="Dono/Repositorio (ex: facebook/react)"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-sm"
                />
                <input
                  type="number"
                  required
                  value={triggerPR}
                  onChange={(e) => setTriggerPR(e.target.value)}
                  placeholder="PR Nº"
                  className="w-24 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-sm"
                />
                <button
                  type="submit"
                  disabled={triggerStatus === "loading"}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)] disabled:opacity-50 whitespace-nowrap"
                >
                  {triggerStatus === "loading" ? "Iniciando..." : "Analisar PR"}
                </button>
              </form>
              {triggerMessage && (
                <div className={`mt-3 text-sm ${triggerStatus === "error" ? "text-red-400" : "text-emerald-400"}`}>
                  {triggerMessage}
                </div>
              )}
            </div>

            {/* Logs Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col h-[500px]">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Logs de Eventos
                </h2>
                <button onClick={fetchLogs} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Atualizar">
                  <svg className={`w-4 h-4 text-zinc-400 ${loadingLogs ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              </div>
              <div className="flex-1 overflow-auto p-2">
                {logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                    {loadingLogs ? "Carregando..." : "Nenhum evento registrado ainda."}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {logs.map((log) => (
                      <div key={log.id} className="p-3 hover:bg-white/5 rounded-xl transition-colors flex items-start gap-3 text-sm group">
                        <div className="mt-0.5">
                          {log.status === "started" && <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-pulse" />}
                          {log.status === "success" && <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />}
                          {log.status === "error" && <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="font-medium text-zinc-200">
                              {log.repo_full_name} <span className="text-zinc-500">#{log.pr_number}</span>
                            </span>
                            <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                              {new Date(log.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                            </span>
                          </div>
                          <div className={`text-xs ${log.status === "error" ? "text-red-300/80" : "text-zinc-400"} line-clamp-2`}>
                            {log.message || log.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
