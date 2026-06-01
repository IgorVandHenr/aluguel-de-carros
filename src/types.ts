/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Carro {
  id: string; // Will handle both UUID and local numeric keys
  marca: string;
  modelo: string;
  placa: string;
  ano: number;
  preco_diaria: number;
  status: 'disponivel' | 'alugado' | 'manutencao';
  created_at?: string;
}

export interface Cliente {
  id: string; // Will handle both UUID and local numeric keys
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  created_at?: string;
}

export interface Aluguel {
  id: string; // Will handle both UUID and local numeric keys
  carro_id: string;
  cliente_id: string;
  data_inicio: string; // YYYY-MM-DD
  data_fim: string; // YYYY-MM-DD
  valor_total: number;
  status: 'ativo' | 'finalizado';
  created_at?: string;
}

export interface AluguelComDetalhes extends Aluguel {
  carro?: Carro;
  cliente?: Cliente;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}
