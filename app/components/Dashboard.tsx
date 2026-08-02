"use client";
import { useState } from "react";
import type { AIConfig } from "@/lib/config";

export function Dashboard({ initialConfig }: { initialConfig: AIConfig }) {
  const [config, setConfig] = useState<AIConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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
      setMessage("Configurações salvas com sucesso!");
      setTimeout(() => setMessage(""), 3000);
    } else {
      setMessage("Erro ao salvar.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] text-zinc-100 p-6 md:p-12">
      <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-2">
            Configuração da IA
          </h1>
          <p className="text-zinc-400 text-lg">Gerencie o modelo, provedor e credenciais para o OpenReview.</p>
        </header>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div className="pt-6 flex items-center justify-between border-t border-white/10">
              <div className="h-6">
                {message && (
                  <span className={`text-sm ${message.includes("Erro") ? "text-red-400" : "text-emerald-400"} animate-in fade-in`}>
                    {message}
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold transition-all transform active:scale-95 disabled:opacity-50 shadow-[0_0_20px_rgba(79,70,229,0.4)]"
              >
                {saving ? "Salvando..." : "Salvar Configurações"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
