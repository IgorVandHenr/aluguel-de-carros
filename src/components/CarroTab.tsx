import React, { useState } from 'react';
import { Car, Search, Plus, Trash2, Calendar, DollarSign, CreditCard, X, Eye, EyeOff } from 'lucide-react';
import { Carro } from '../types';
import { db } from '../lib/supabase';

interface CarroTabProps {
  cars: Carro[];
  onRefresh: () => void;
  loading: boolean;
}

export default function CarroTab({ cars, onRefresh, loading }: CarroTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [placa, setPlaca] = useState('');
  const [ano, setAno] = useState(new Date().getFullYear());
  const [precoDiaria, setPrecoDiaria] = useState('');
  const [status, setStatus] = useState<Carro['status']>('disponivel');

  const filteredCars = cars.filter(car => {
    const matchesSearch = 
      car.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.placa.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || car.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!marca.trim() || !modelo.trim() || !placa.trim() || !precoDiaria) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const price = parseFloat(precoDiaria);
    if (isNaN(price) || price <= 0) {
      setErrorMsg('A diária do veículo deve ser um valor maior que zero.');
      return;
    }

    const carYear = parseInt(ano.toString());
    if (isNaN(carYear) || carYear < 1900 || carYear > new Date().getFullYear() + 2) {
      setErrorMsg('Por favor, digite um ano de fabricação válido.');
      return;
    }

    // Plate formatting (Uppercase, no spaces)
    const formattedPlate = placa.trim().toUpperCase().replace(/\s/g, '');

    setIsSubmitting(true);
    try {
      await db.addCar({
        marca: marca.trim(),
        modelo: modelo.trim(),
        placa: formattedPlate,
        ano: carYear,
        preco_diaria: price,
        status: status
      });

      // Clear Form & Close
      setMarca('');
      setModelo('');
      setPlaca('');
      setAno(new Date().getFullYear());
      setPrecoDiaria('');
      setStatus('disponivel');
      setIsModalOpen(false);

      // Trigger refresh
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao registrar carro. Verifique se a placa já cadastrada.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, placa: string, status: string) => {
    if (status === 'alugado') {
      alert('Não é possível remover um carro que está alugado no momento.');
      return;
    }

    const confirmDelete = window.confirm(`Tem certeza que deseja remover o veículo de placa ${placa}?`);
    if (!confirmDelete) return;

    try {
      await db.deleteCar(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao deletar carro. Verifique se ele está vinculado a algum histórico de aluguel.');
    }
  };

  const handleUpdateStatus = async (id: string, currentStatus: Carro['status']) => {
    if (currentStatus === 'alugado') {
      alert('Veículos alugados só podem retornar a "Disponível" finalizando a locação.');
      return;
    }

    const nextStatus: Carro['status'] = currentStatus === 'disponivel' ? 'manutencao' : 'disponivel';
    try {
      await db.updateCarStatus(id, nextStatus);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar status do carro.');
    }
  };

  return (
    <div id="carros-section" className="space-y-6">
      {/* Controls & Filters Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="flex-1 flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              id="car-search-input"
              type="text"
              placeholder="Buscar por marca, modelo ou placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white shadow-3xs"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg self-start shadow-3xs select-none">
            {['todos', 'disponivel', 'alugado', 'manutencao'].map((filter) => (
              <button
                key={filter}
                id={`filter-${filter}-btn`}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-md uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === filter 
                    ? 'bg-white text-slate-900 shadow-3xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {filter === 'todos' ? 'Todos' : filter === 'disponivel' ? 'Disponível' : filter === 'alugado' ? 'Alugado' : 'Manutenção'}
              </button>
            ))}
          </div>
        </div>

        {/* Add vehicle button */}
        <button
          id="open-add-car-modal-btn"
          onClick={() => {
            setErrorMsg('');
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-3xs transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Carro
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs font-medium font-mono">Processando frota...</p>
        </div>
      ) : filteredCars.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-white shadow-3xs">
          <Car className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-950 mb-1">Nenhum veículo encontrado</p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            {searchTerm || statusFilter !== 'todos'
              ? 'Tente ajustar os seus filtros ou termo de busca.'
              : 'Registre os primeiros veículos da sua frota comercial para iniciar.'}
          </p>
        </div>
      ) : (
        /* Cars Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCars.map((car) => (
            <div 
              key={car.id} 
              id={`car-card-${car.id}`}
              className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-3xs hover:shadow-2xs transition-all duration-300 flex flex-col group animate-in fade-in"
            >
              <div className="p-6 flex-1">
                {/* Brand & Model */}
                <div className="flex justify-between items-start gap-2 mb-4">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-widest">{car.marca}</span>
                    <h4 className="font-bold text-slate-900 group-hover:text-black text-lg transition-colors leading-snug">{car.modelo}</h4>
                  </div>
                  {/* Status chip with dot */}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wide border border-slate-100 ${
                    car.status === 'disponivel' 
                      ? 'bg-slate-50 text-slate-700'
                      : car.status === 'alugado'
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-50 text-slate-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      car.status === 'disponivel' 
                        ? 'bg-emerald-500' 
                        : car.status === 'alugado' 
                        ? 'bg-blue-400' 
                        : 'bg-amber-400'
                    }`} />
                    {car.status === 'disponivel' ? 'Disponível' : car.status === 'alugado' ? 'Alugado' : 'Manutenção'}
                  </span>
                </div>

                {/* Details list */}
                <div className="space-y-2 mt-4 text-xs text-slate-600 border-t border-slate-100 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 font-medium text-slate-400">
                      Placa
                    </span>
                    <span className="font-mono text-[10px] text-slate-900 px-2 py-0.5 rounded bg-slate-50 border border-slate-150 font-bold uppercase tracking-wider">{car.placa}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 font-medium text-slate-400">
                      Fabricação
                    </span>
                    <span className="font-semibold text-slate-900">{car.ano}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 font-medium text-slate-400">
                      Preço Diária
                    </span>
                    <span className="font-bold text-slate-900">
                      {car.preco_diaria.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  id={`update-status-car-${car.id}`}
                  disabled={car.status === 'alugado'}
                  onClick={() => handleUpdateStatus(car.id, car.status)}
                  className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg border transition-all cursor-pointer shadow-3xs ${
                    car.status === 'alugado'
                      ? 'text-slate-300 border-slate-100 bg-slate-50 cursor-not-allowed'
                      : car.status === 'disponivel'
                      ? 'text-slate-600 border-slate-200 hover:bg-slate-100 bg-white'
                      : 'text-slate-800 border-slate-200 hover:bg-slate-100 bg-white'
                  }`}
                  title={car.status === 'disponivel' ? 'Colocar em Manutenção' : 'Liberar para Locação'}
                >
                  {car.status === 'manutencao' ? 'Liberar Frota' : 'Manutenção'}
                </button>

                <button
                  id={`delete-car-${car.id}`}
                  disabled={car.status === 'alugado'}
                  onClick={() => handleDelete(car.id, car.placa, car.status)}
                  className={`flex items-center justify-center p-2 rounded-lg transition-colors border shadow-3xs cursor-pointer ${
                    car.status === 'alugado'
                      ? 'text-slate-200 border-slate-100 bg-slate-50 cursor-not-allowed'
                      : 'text-red-600 bg-white border-red-100 hover:bg-red-50 hover:text-red-700'
                  }`}
                  title="Remover veículo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cadastrar Carro Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xl max-w-md w-full animate-in scale-in duration-200 p-6">
            <div className="flex justify-between items-center mb-5 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-gray-950 text-base flex items-center gap-2">
                <Car className="w-5 h-5 text-gray-800" />
                Cadastrar Novo Carro
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-500 rounded-lg p-1 hover:bg-gray-100 transition-colors"
                id="close-add-car-modal-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 mb-4 text-xs font-semibold bg-red-50 border border-red-100 text-red-700 rounded-lg">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Marca *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Toyota, Fiat"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Corolla, Uno"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Placa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: BRA2E19"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value)}
                    maxLength={10}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Ano *
                  </label>
                  <input
                    type="number"
                    required
                    value={ano}
                    onChange={(e) => setAno(parseInt(e.target.value) || new Date().getFullYear())}
                    min={1920}
                    max={new Date().getFullYear() + 2}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Valor Diária (R$) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="120.00"
                    value={precoDiaria}
                    onChange={(e) => setPrecoDiaria(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Status Inicial
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Carro['status'])}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900"
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="manutencao">Manutenção</option>
                  </select>
                </div>
              </div>

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
                      Cadastrando...
                    </>
                  ) : (
                    'Confirmar Cadastro'
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
