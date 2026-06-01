import React, { useState, useMemo } from 'react';
import { Calendar, Search, Plus, Check, Trash2, Car, User, DollarSign, Clock, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { AluguelComDetalhes, Carro, Cliente } from '../types';
import { db } from '../lib/supabase';

interface AluguelTabProps {
  rentals: AluguelComDetalhes[];
  cars: Carro[];
  customers: Cliente[];
  onRefresh: () => void;
  loading: boolean;
}

export default function AluguelTab({ rentals, cars, customers, onRefresh, loading }: AluguelTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [selectedCarId, setSelectedCarId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    return tomorrow.toISOString().split('T')[0];
  });

  // Derived properties: stats
  const stats = useMemo(() => {
    let activeCount = 0;
    let completedCount = 0;
    let totalRevenue = 0;

    rentals.forEach(r => {
      if (r.status === 'ativo') {
        activeCount++;
      } else {
        completedCount++;
      }
      totalRevenue += Number(r.valor_total || 0);
    });

    return { activeCount, completedCount, totalRevenue };
  }, [rentals]);

  // Filters
  const filteredRentals = rentals.filter(rent => {
    const customerName = rent.cliente?.nome || '';
    const carModel = rent.carro?.modelo || '';
    const carPlate = rent.carro?.placa || '';
    
    const matchesSearch = 
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      carModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      carPlate.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'todos' || rent.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Calculate rental price and days dynamically
  const selectedCar = useMemo(() => {
    return cars.find(c => c.id === selectedCarId);
  }, [cars, selectedCarId]);

  const renewalSummary = useMemo(() => {
    if (!startDate || !endDate) return { days: 0, total: 0 };
    
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const days = diffDays > 0 ? diffDays : 0;
    const dailyRate = selectedCar ? selectedCar.preco_diaria : 0;
    
    return {
      days,
      total: days * dailyRate
    };
  }, [startDate, endDate, selectedCar]);

  // List only available cars for the rental selection dropdown
  const availableCars = useMemo(() => {
    return cars.filter(c => c.status === 'disponivel');
  }, [cars]);

  const handleOpenRental = () => {
    if (availableCars.length === 0) {
      alert('Não há carros livres de momento. Todos estão alugados ou em manutenção.');
      return;
    }
    if (customers.length === 0) {
      alert('Por favor, cadastre ao menos um cliente primeiro.');
      return;
    }
    setSelectedCarId(availableCars[0].id);
    setSelectedCustomerId(customers[0].id);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedCarId || !selectedCustomerId || !startDate || !endDate) {
      setErrorMsg('Preencha todas as datas e seleções obrigatórias.');
      return;
    }

    if (renewalSummary.days <= 0) {
      setErrorMsg('A data final deve ser posterior à data inicial de locação.');
      return;
    }

    setIsSubmitting(true);
    try {
      await db.addRental({
        carro_id: selectedCarId,
        cliente_id: selectedCustomerId,
        data_inicio: startDate,
        data_fim: endDate,
        valor_total: renewalSummary.total,
        status: 'ativo'
      });

      // Reset
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao processar contrato de aluguel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishRental = async (id: string, carroId: string) => {
    const confirmFinish = window.confirm('Deseja confirmar a devolução do veículo e finalizar este contrato?');
    if (!confirmFinish) return;

    try {
      await db.finishRental(id, carroId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao arquivar aluguel.');
    }
  };

  const handleDeleteRental = async (id: string, carroId: string, status: AluguelComDetalhes['status']) => {
    const confirmDelete = window.confirm('Excluir este registro apagará permanentemente o histórico. Deseja continuar?');
    if (!confirmDelete) return;

    try {
      await db.deleteRental(id, carroId, status === 'ativo');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao deletar registro.');
    }
  };

  const formatDateText = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div id="alugueis-section" className="space-y-6 animate-in fade-in">
      {/* Quick stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/80 p-5 rounded-xl flex items-center gap-4 shadow-3xs">
          <div className="p-2 w-10 h-10 rounded-lg bg-slate-100 text-slate-705 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-slate-800" />
          </div>
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Faturamento Médio</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {stats.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-xl flex items-center gap-4 shadow-3xs">
          <div className="p-2 w-10 h-10 rounded-lg bg-slate-100 text-slate-705 flex items-center justify-center">
            <Clock className="w-5 h-5 text-slate-800" />
          </div>
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Aluguéis Ativos</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {stats.activeCount} <span className="text-xs font-medium text-slate-400">ativos</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-xl flex items-center gap-4 shadow-3xs">
          <div className="p-2 w-10 h-10 rounded-lg bg-slate-100 text-slate-705 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-slate-800" />
          </div>
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Histórico Total</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {stats.completedCount} <span className="text-xs font-medium text-slate-400">encerrados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="flex-1 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              id="rent-search-input"
              type="text"
              placeholder="Buscar por cliente, carro ou placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white shadow-3xs"
            />
          </div>

          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg self-start shadow-3xs select-none">
            {['todos', 'ativo', 'finalizado'].map((status) => (
              <button
                key={status}
                id={`filter-rent-${status}-btn`}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-md uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  filterStatus === status 
                    ? 'bg-white text-slate-900 shadow-3xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {status === 'todos' ? 'Todos' : status === 'ativo' ? 'Ativos' : 'Finalizados'}
              </button>
            ))}
          </div>
        </div>

        <button
          id="open-add-rent-modal-btn"
          onClick={handleOpenRental}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-3xs transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Registrar Locação
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs font-medium font-mono">Processando contratos...</p>
        </div>
      ) : filteredRentals.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-white shadow-3xs">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-950 mb-1">Nenhuma locação localizada</p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            {searchTerm || filterStatus !== 'todos'
              ? 'Tente alterar os termos de pesquisa ou resetar os filtros.'
              : 'Registre contratos preenchendo as informações de veículos disponíveis e clientes selecionados.'}
          </p>
        </div>
      ) : (
        /* Rentals Board List */
        <div className="space-y-4">
          {filteredRentals.map((r) => (
            <div 
              key={r.id} 
              id={`rent-card-${r.id}`}
              className={`bg-white border rounded-xl p-6 shadow-3xs hover:shadow-2xs transition-all duration-300 border-l-4 ${
                r.status === 'ativo' ? 'border-l-slate-900 bg-white' : 'border-l-slate-300 bg-white/95'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Visual Details Columns (Responsive grouping) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                  
                  {/* Column 1: Client */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/55 flex items-center justify-center text-slate-600 font-bold shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-widest block">Locatário</span>
                      <strong className="text-xs text-slate-900 font-bold block mt-0.5">{r.cliente?.nome || 'N/A'}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">CPF: {r.cliente?.cpf || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Column 2: Car details */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/55 flex items-center justify-center text-slate-600 font-bold shrink-0">
                      <Car className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-widest block">Veículo</span>
                      <strong className="text-xs text-slate-900 font-bold block mt-0.5">{r.carro ? `${r.carro.marca} ${r.carro.modelo}` : 'Não cadastrado'}</strong>
                      <span className="text-[9px] font-mono font-bold text-slate-800 px-1.5 py-0.5 rounded bg-slate-100/80 uppercase border border-slate-200/60 mt-1 inline-block">
                        {r.carro?.placa || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Column 3: Dates and timeline */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/55 flex items-center justify-center text-slate-600 font-bold shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-widest block">Período</span>
                      <div className="text-xs text-slate-900 font-semibold block mt-0.5">
                        {formatDateText(r.data_inicio)} até {formatDateText(r.data_fim)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Duração: {Math.ceil((new Date(r.data_fim).getTime() - new Date(r.data_inicio).getTime()) / (1000 * 60 * 60 * 24))} dias
                      </span>
                    </div>
                  </div>

                </div>

                {/* Vertical Separator for Large Screens */}
                <div className="hidden md:block w-[1px] h-10 bg-slate-100" />

                {/* Pricing & Control Block */}
                <div className="flex items-center justify-between md:justify-end gap-6 self-stretch md:self-auto border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                  <div className="text-left md:text-right">
                    <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-widest block">Total Estimado</span>
                    <strong className="text-sm font-extrabold text-slate-900">
                      {Number(r.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </strong>
                    <div className="mt-1">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                        r.status === 'ativo' 
                          ? 'bg-slate-100 text-slate-800 border-slate-200/60' 
                          : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${r.status === 'ativo' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        {r.status === 'ativo' ? 'Em andamento' : 'Encerrado'}
                      </span>
                    </div>
                  </div>

                  {/* Operational and deletion controls */}
                  <div className="flex items-center gap-1.5">
                    {r.status === 'ativo' && (
                      <button
                        id={`finish-rent-${r.id}`}
                        onClick={() => handleFinishRental(r.id, r.carro_id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 transition-colors shadow-3xs cursor-pointer"
                        title="Confirmar Devolução"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Devolver
                      </button>
                    )}

                    <button
                      id={`delete-rent-${r.id}`}
                      onClick={() => handleDeleteRental(r.id, r.carro_id, r.status)}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-red-600 transition-colors shadow-3xs cursor-pointer"
                      title="Excluir Registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Registrar Locação Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xl max-w-lg w-full animate-in scale-in duration-200 p-6">
            <div className="flex justify-between items-center mb-5 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-gray-950 text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-800" />
                Registrar Novo Aluguel de Veículo
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-500 rounded-lg p-1 hover:bg-gray-100 transition-colors"
                id="close-add-rent-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 mb-4 text-xs font-semibold bg-red-50 border border-red-100 text-red-700 rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-500 block shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Selection client list dropdown */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Cliente Locatário *
                  </label>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900"
                  >
                    {customers.map((cli) => (
                      <option key={cli.id} value={cli.id}>
                        {cli.nome} (CPF: {cli.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Available cars to choose */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Veículo Livre *
                  </label>
                  <select
                    required
                    value={selectedCarId}
                    onChange={(e) => setSelectedCarId(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900"
                  >
                    {availableCars.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.marca} {car.modelo} - Diária: R$ {car.preco_diaria.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Data Prevista Retorno *
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900"
                  />
                </div>
              </div>

              {/* Dynamic Live Calculations Review Box */}
              {selectedCar && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/60 mt-2 space-y-2">
                  <div className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-200/75 pb-1">
                    Projeção do Aluguel
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Diária do veículo selecionado:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedCar.preco_diaria.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 animate-in fade-in">
                    <span>Durabilidade calculada:</span>
                    <span className="font-semibold text-gray-900">
                      {renewalSummary.days} {renewalSummary.days === 1 ? 'dia' : 'dias'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-900 border-t border-dashed border-gray-200 pt-2 font-bold select-none">
                    <span>Valor estimado do contrato:</span>
                    <span className="text-indigo-700 text-base">
                      {renewalSummary.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-100 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-gray-950 hover:bg-gray-800 text-white shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    'Confirmar Locação'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
