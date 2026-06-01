/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Car, Users, CalendarRange, AlertCircle } from 'lucide-react';
import { db } from './lib/supabase';
import { Carro, Cliente, AluguelComDetalhes } from './types';
import AluguelTab from './components/AluguelTab';
import CarroTab from './components/CarroTab';
import ClienteTab from './components/ClienteTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<'alugueis' | 'carros' | 'clientes'>('alugueis');
  const [cars, setCars] = useState<Carro[]>([]);
  const [customers, setCustomers] = useState<Cliente[]>([]);
  const [rentals, setRentals] = useState<AluguelComDetalhes[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // Load database info
  const loadData = async () => {
    setLoading(true);
    try {
      setIsConnected(db.isSupabaseConnected());
      const rawCars = await db.getCars();
      const rawCustomers = await db.getCustomers();
      const rawRentals = await db.getRentals();
      
      setCars(rawCars);
      setCustomers(rawCustomers);
      setRentals(rawRentals);
    } catch (e) {
      console.error("Erro ao sincronizar tabelas com o banco de dados:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div id="app-root" className="min-h-screen lg:h-screen lg:overflow-hidden bg-slate-50 text-slate-900 font-sans flex flex-col lg:flex-row antialiased">
      
      {/* Sidebar for desktop/large screens */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col p-6 shrink-0 z-10 shadow-3xs">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <div className="w-3.5 h-3.5 border-2 border-white rounded-xs"></div>
          </div>
          <h1 className="font-bold text-lg tracking-tight">
            DriveRent<span className="text-slate-400 font-medium font-mono">Pro</span>
          </h1>
        </div>

        <nav className="flex-1 space-y-1">
          <button
            onClick={() => setActiveTab('alugueis')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'alugueis'
                ? 'bg-slate-100 text-slate-900 font-semibold shadow-3xs'
                : 'text-slate-500 hover:bg-slate-50/80 hover:text-slate-900'
            }`}
          >
            <CalendarRange className="w-4 h-4 opacity-70" />
            Locações
          </button>

          <button
            onClick={() => setActiveTab('carros')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'carros'
                ? 'bg-slate-100 text-slate-900 font-semibold shadow-3xs'
                : 'text-slate-500 hover:bg-slate-50/80 hover:text-slate-900'
            }`}
          >
            <Car className="w-4 h-4 opacity-70" />
            Frota de Carros
          </button>

          <button
            onClick={() => setActiveTab('clientes')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'clientes'
                ? 'bg-slate-100 text-slate-900 font-semibold shadow-3xs'
                : 'text-slate-500 hover:bg-slate-50/80 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 opacity-70" />
            Nossos Clientes
          </button>
        </nav>

        {/* Sidebar Footer branding */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-2">
          <div className="text-[10px] text-slate-400 flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100 select-none">
            <span>Sistema: <span className="text-slate-800 font-semibold">Ativo</span></span>
            <span>v1.2.0</span>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header Banner */}
      <header className="lg:hidden bg-white border-b border-slate-200 p-4 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-black rounded-md flex items-center justify-center">
            <div className="w-3 h-3 border border-white rounded-xs"></div>
          </div>
          <h1 className="font-bold text-base tracking-tight">DriveRentPro</h1>
        </div>
      </header>

      {/* Main Core View Area */}
      <main className="flex-1 lg:h-screen lg:overflow-y-auto p-4 sm:p-6 lg:p-10 flex flex-col gap-8">
        
        {/* Page greeting summary view */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              {activeTab === 'alugueis' ? 'Dashboard Operacional' : activeTab === 'carros' ? 'Catálogo da Frota' : 'Contatos Registrados'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {activeTab === 'alugueis' 
                ? 'Gerenciamento completo das locações e prazos da frota ativa' 
                : activeTab === 'carros' 
                ? 'Controle de veículos ativos, disponíveis e em manutenção' 
                : 'Cadastro de clientes qualificados para locação ativa'
              }
            </p>
          </div>
        </header>

        {/* Mobile Horizontal Navigation Tabs */}
        <div id="mobile-tabs-list" className="lg:hidden flex items-center border-b border-slate-200/90 gap-1 overflow-x-auto select-none">
          <button
            onClick={() => setActiveTab('alugueis')}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'alugueis'
                ? 'border-b-black text-black'
                : 'border-b-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Locações
          </button>
          <button
            onClick={() => setActiveTab('carros')}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'carros'
                ? 'border-b-black text-black'
                : 'border-b-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Carros
          </button>
          <button
            onClick={() => setActiveTab('clientes')}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'clientes'
                ? 'border-b-black text-black'
                : 'border-b-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Clientes
          </button>
        </div>

        {/* Main Content Area based on selection */}
        <div id="tab-view-content" className="flex-1 animate-in fade-in duration-200">
          {activeTab === 'alugueis' && (
            <AluguelTab 
              rentals={rentals} 
              cars={cars} 
              customers={customers} 
              onRefresh={loadData} 
              loading={loading} 
            />
          )}

          {activeTab === 'carros' && (
            <CarroTab 
              cars={cars} 
              onRefresh={loadData} 
              loading={loading} 
            />
          )}

          {activeTab === 'clientes' && (
            <ClienteTab 
              customers={customers} 
              onRefresh={loadData} 
              loading={loading} 
            />
          )}
        </div>

        {/* Clean Footer inside scroll */}
        <footer id="main-footer" className="border-t border-slate-150 py-4 text-center mt-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] text-slate-400 select-none">
          <p>© 2026 DriveRentPro Ltda. Todos os direitos reservados.</p>
          <p>Pronto para Deploy no GitHub & Vercel</p>
        </footer>

      </main>

    </div>
  );
}
