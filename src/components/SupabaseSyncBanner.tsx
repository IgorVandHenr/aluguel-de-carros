import React, { useState } from 'react';
import { Database, AlertTriangle, CheckCircle, Copy, FileText, Settings, X, RefreshCw, Key } from 'lucide-react';
import { getSupabaseCredentials, SQL_SCHEMA } from '../lib/supabase';

interface SupabaseSyncBannerProps {
  onRefresh: () => void;
}

export default function SupabaseSyncBanner({ onRefresh }: SupabaseSyncBannerProps) {
  const { url, key, isConfigured } = getSupabaseCredentials();
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [isOpenSql, setIsOpenSql] = useState(false);
  const [copied, setCopied] = useState(false);

  const [inputUrl, setInputUrl] = useState(url);
  const [inputKey, setInputKey] = useState(key);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim() && inputKey.trim()) {
      localStorage.setItem('supabase_url', inputUrl.trim());
      localStorage.setItem('supabase_anon_key', inputKey.trim());
    } else {
      localStorage.removeItem('supabase_url');
      localStorage.removeItem('supabase_anon_key');
    }
    setIsOpenForm(false);
    window.location.reload();
  };

  const handleClear = () => {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_anon_key');
    setInputUrl('');
    setInputKey('');
    window.location.reload();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="settings-banner" className="mb-2">
      {/* Banner status bar */}
      <div className={`p-4 rounded-xl border bg-white border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 shadow-3xs`}>
        <div className="flex items-start md:items-center gap-3">
          <div className={`p-2 rounded-lg ${isConfigured ? 'bg-slate-100 text-slate-700' : 'bg-slate-100/80 text-slate-600'}`}>
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm flex items-center gap-2 text-slate-900">
              {isConfigured ? 'Supabase Conectado' : 'Modo Simulador Offline'}
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${isConfigured ? 'bg-green-150 text-green-900' : 'bg-slate-100 text-slate-600'}`}>
                {isConfigured ? 'Nuvem' : 'Local'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
              {isConfigured 
                ? `Banco persistido em: ${url.replace('https://', '').split('.')[0]}. Seus carros e clientes serão cadastrados diretamente na nuvem.` 
                : 'Você está rodando no armazenamento offline do navegador (LocalStorage). Configure o Supabase para persistir seus dados.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
          <button
            id="toggle-sql-btn"
            onClick={() => setIsOpenSql(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-3xs cursor-pointer transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Script SQL
          </button>
          
          <button
            id="toggle-settings-btn"
            onClick={() => setIsOpenForm(!isOpenForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 transition-all cursor-pointer shadow-3xs"
          >
            <Settings className="w-3.5 h-3.5" />
            {isConfigured ? 'Editar Conexão' : 'Configurar Supabase'}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {isOpenForm && (
        <div id="settings-panel" className="mt-3 p-5 rounded-xl border border-gray-200 bg-white shadow-md animate-in fade-in slide-in-from-top-4 duration-250">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
            <h3 className="font-semibold text-gray-950 flex items-center gap-2">
              <Key className="w-4 h-4 text-gray-500" />
              Configurar Credenciais do Supabase
            </h3>
            <button 
              onClick={() => setIsOpenForm(false)} 
              className="text-gray-400 hover:text-gray-500 rounded-lg p-1 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  SUPABASE_URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://suas-credenciais.supabase.co"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  SUPABASE_ANON_KEY
                </label>
                <input
                  type="password"
                  required
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono text-xs"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              💡 As chaves acima serão armazenadas com segurança no <strong>LocalStorage</strong> do seu próprio navegador. Elas não são enviadas a nenhum servidor intermediário. Você também pode declará-las no arquivo <code>.env</code> como <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> antes do build do projeto.
            </p>

            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              {isConfigured ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3.5 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Remover chaves salvas
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpenForm(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-gray-950 text-white hover:bg-gray-800 shadow-sm transition-colors cursor-pointer"
                >
                  Salvar e Conectar
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* SQL Script View Modal */}
      {isOpenSql && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col animate-in scale-in duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-semibold text-gray-950 text-base">Schema do Banco de Dados SQL</h3>
                  <p className="text-xs text-gray-500">Copie e execute o script abaixo no SQL Editor do seu console Supabase.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpenSql(false)} 
                className="text-gray-400 hover:text-gray-500 rounded-lg p-1.5 hover:bg-gray-100 transition-colors"
                id="close-sql-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto bg-gray-950 text-gray-200 font-mono text-xs flex-1 rounded-b-none relative select-all">
              <pre className="whitespace-pre-wrap leading-relaxed">{SQL_SCHEMA}</pre>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center rounded-b-2xl">
              <span className="text-xs text-gray-500">Regras RLS (Row Level Security) liberadas para testes públicos.</span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Copiado!' : 'Copiar Script'}
                </button>
                <button
                  onClick={() => setIsOpenSql(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
