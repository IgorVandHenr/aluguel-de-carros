import React, { useState } from 'react';
import { User, Search, Plus, Trash2, Mail, Phone, CreditCard, X } from 'lucide-react';
import { Cliente } from '../types';
import { db } from '../lib/supabase';

interface ClienteTabProps {
  customers: Cliente[];
  onRefresh: () => void;
  loading: boolean;
}

export default function ClienteTab({ customers, onRefresh, loading }: ClienteTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');

  const filteredCustomers = customers.filter(cust => {
    return (
      cust.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.cpf.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.telefone.includes(searchTerm)
    );
  });

  const formatCPF = (value: string) => {
    // formats raw digits to xxx.xxx.xxx-xx
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const digitsOnly = rawValue.replace(/\D/g, '');
    if (digitsOnly.length <= 11) {
      setCpf(formatCPF(digitsOnly));
    }
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const digitsOnly = rawValue.replace(/\D/g, '');
    if (digitsOnly.length <= 11) {
      setTelefone(formatPhone(digitsOnly));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!nome.trim() || !cpf.trim() || !telefone.trim()) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      setErrorMsg('O CPF deve conter exatamente 11 dígitos.');
      return;
    }

    const cleanPhone = telefone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      setErrorMsg('Digite um telefone com DDD válido.');
      return;
    }

    if (email && !/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg('Digite um endereço de e-mail válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      await db.addCustomer({
        nome: nome.trim(),
        cpf: cpf.trim(), // Save formatted
        telefone: telefone.trim(), // Save formatted
        email: email.trim().toLowerCase()
      });

      // Clear state
      setNome('');
      setCpf('');
      setTelefone('');
      setEmail('');
      setIsModalOpen(false);

      onRefresh();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao registrar cliente. CPF já cadastrado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    const confirmDelete = window.confirm(`Tem certeza que deseja remover o cliente ${nome}?`);
    if (!confirmDelete) return;

    try {
      await db.deleteCustomer(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao deletar cliente. Verifique se ele possui aluguéis associados.');
    }
  };

  return (
    <div id="clientes-section" className="space-y-6">
      {/* Search and Action Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            id="customer-search-input"
            type="text"
            placeholder="Buscar por nome, CPF ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white shadow-3xs"
          />
        </div>

        <button
          id="open-add-customer-modal-btn"
          onClick={() => {
            setErrorMsg('');
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-3xs transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Cliente
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs font-medium font-mono">Processando clientes...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-white shadow-3xs">
          <User className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-950 mb-1">Nenhum cliente cadastrado</p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            {searchTerm 
              ? 'Tente alterar os termos de pesquisa.'
              : 'Registre os seus primeiros clientes para iniciar os aluguéis.'}
          </p>
        </div>
      ) : (
        /* Customers List */
        <div className="overflow-hidden bg-white border border-slate-200/80 rounded-xl shadow-3xs">
          <div className="overflow-x-auto">
            <table id="customers-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  <th className="py-4 px-6">Cliente</th>
                  <th className="py-4 px-6">CPF</th>
                  <th className="py-4 px-6">Telefone</th>
                  <th className="py-4 px-6">E-mail</th>
                  <th className="py-4 px-6 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-55/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs select-none">
                          {cust.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-semibold text-slate-900">{cust.nome}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px] text-slate-500 font-medium">{cust.cpf}</td>
                    <td className="py-4 px-6 text-slate-600 font-semibold">{cust.telefone}</td>
                    <td className="py-4 px-6 text-slate-500 font-medium">{cust.email || <span className="text-slate-300 italic">Não informado</span>}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        id={`delete-customer-${cust.id}`}
                        onClick={() => handleDelete(cust.id, cust.nome)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-red-600 hover:bg-slate-50 transition-colors cursor-pointer shadow-3xs inline-flex items-center justify-center"
                        title="Excluir cliente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cadastrar Cliente Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xl max-w-md w-full animate-in scale-in duration-200 p-6">
            <div className="flex justify-between items-center mb-5 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-gray-950 text-base flex items-center gap-2">
                <User className="w-5 h-5 text-gray-800" />
                Cadastrar Novo Cliente
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-500 rounded-lg p-1 hover:bg-gray-100 transition-colors"
                id="close-add-customer-modal"
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
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Maria Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    CPF *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={handleCpfChange}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Telefone celular *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(00) 00000-0000"
                    value={telefone}
                    onChange={handlePhoneChange}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Endereço de E-mail (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="nome@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900"
                />
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
