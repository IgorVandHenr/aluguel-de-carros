import { createClient } from '@supabase/supabase-js';
import { Carro, Cliente, Aluguel, AluguelComDetalhes } from '../types';

// Helper to check if credentials are valid
export function getSupabaseCredentials() {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  const localUrl = localStorage.getItem('supabase_url');
  const localKey = localStorage.getItem('supabase_anon_key');

  const urlObj = localUrl || (envUrl && envUrl !== 'https://your-supabase-project.supabase.co' ? envUrl : '');
  const keyObj = localKey || (envKey && envKey !== 'your-supabase-anon-key' ? envKey : '');

  const url = typeof urlObj === 'string' ? urlObj.trim() : '';
  const key = typeof keyObj === 'string' ? keyObj.trim() : '';

  // Validate that the URL is a correct HTTP/HTTPS URL
  let isValidUrl = false;
  if (url) {
    try {
      const parsed = new URL(url);
      isValidUrl = (parsed.protocol === 'http:' || parsed.protocol === 'https:') && 
                   !url.includes('your-supabase-project.supabase.co');
    } catch (_) {
      isValidUrl = false;
    }
  }

  const isConfigured = !!(url && key && isValidUrl);

  return { url, key, isConfigured };
}

// Initialize Supabase Client if configured
const { url, key, isConfigured } = getSupabaseCredentials();
export const supabase = isConfigured ? createClient(url, key) : null;

// --- INITIAL FALLBACK DATA ---
const INITIAL_CARS: Carro[] = [
  { id: 'car-1', marca: 'Toyota', modelo: 'Corolla', placa: 'BRA2E19', ano: 2022, preco_diaria: 180.00, status: 'disponivel' },
  { id: 'car-2', marca: 'Jeep', modelo: 'Compass', placa: 'RIO4G21', ano: 2021, preco_diaria: 240.00, status: 'disponivel' },
  { id: 'car-3', marca: 'Hyundai', modelo: 'HB20', placa: 'SPG5H33', ano: 2023, preco_diaria: 130.00, status: 'alugado' },
  { id: 'car-4', marca: 'Fiat', modelo: 'Mobi', placa: 'MGK8J12', ano: 2020, preco_diaria: 90.00, status: 'disponivel' }
];

const INITIAL_CUSTOMERS: Cliente[] = [
  { id: 'cli-1', nome: 'Maria Silva Oliveira', cpf: '12345678901', telefone: '11987654321', email: 'maria.silva@email.com' },
  { id: 'cli-2', nome: 'João Santos Pereira', cpf: '98765432100', telefone: '21998765432', email: 'joao.santos@email.com' }
];

const INITIAL_RENTALS: Aluguel[] = [
  { id: 'rent-1', carro_id: 'car-3', cliente_id: 'cli-1', data_inicio: '2026-05-28', data_fim: '2026-06-03', valor_total: 780.00, status: 'ativo' }
];

// --- SEED LOCAL STORAGE IF EMPTY ---
if (!localStorage.getItem('cars_seeded')) {
  localStorage.setItem('cars', JSON.stringify(INITIAL_CARS));
  localStorage.setItem('customers', JSON.stringify(INITIAL_CUSTOMERS));
  localStorage.setItem('rentals', JSON.stringify(INITIAL_RENTALS));
  localStorage.setItem('cars_seeded', 'true');
}

// --- DATABASE SERVICE ADAPTER ---
export const db = {
  // Check if we are currently using Supabase
  isSupabaseConnected: (): boolean => {
    return !!supabase;
  },

  // 1. CARS OPERATIONS
  getCars: async (): Promise<Carro[]> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('carros')
        .select('*')
        .order('marca', { ascending: true });
      if (error) {
        console.error('Error fetching cars from Supabase, failing over to state:', error);
        throw error;
      }
      return data || [];
    } else {
      const cars = localStorage.getItem('cars');
      return cars ? JSON.parse(cars) : [];
    }
  },

  addCar: async (carro: Omit<Carro, 'id'>): Promise<Carro> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('carros')
        .insert([{ ...carro, status: carro.status || 'disponivel' }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const cars = await db.getCars();
      const newCar: Carro = {
        ...carro,
        id: 'car-' + Math.random().toString(36).substr(2, 9),
        status: carro.status || 'disponivel'
      };
      cars.push(newCar);
      localStorage.setItem('cars', JSON.stringify(cars));
      return newCar;
    }
  },

  updateCarStatus: async (id: string, status: Carro['status']): Promise<void> => {
    if (supabase) {
      const { error } = await supabase
        .from('carros')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    } else {
      const cars = await db.getCars();
      const index = cars.findIndex(c => c.id === id);
      if (index !== -1) {
        cars[index].status = status;
        localStorage.setItem('cars', JSON.stringify(cars));
      }
    }
  },

  deleteCar: async (id: string): Promise<void> => {
    if (supabase) {
      const { error } = await supabase
        .from('carros')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } else {
      const cars = await db.getCars();
      const updated = cars.filter(c => c.id !== id);
      localStorage.setItem('cars', JSON.stringify(updated));
    }
  },

  // 2. CLIENTS OPERATIONS
  getCustomers: async (): Promise<Cliente[]> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      const custs = localStorage.getItem('customers');
      return custs ? JSON.parse(custs) : [];
    }
  },

  addCustomer: async (cliente: Omit<Cliente, 'id'>): Promise<Cliente> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('clientes')
        .insert([cliente])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const customers = await db.getCustomers();
      const newCustomer: Cliente = {
        ...cliente,
        id: 'cli-' + Math.random().toString(36).substr(2, 9)
      };
      customers.push(newCustomer);
      localStorage.setItem('customers', JSON.stringify(customers));
      return newCustomer;
    }
  },

  deleteCustomer: async (id: string): Promise<void> => {
    if (supabase) {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } else {
      const customers = await db.getCustomers();
      const updated = customers.filter(c => c.id !== id);
      localStorage.setItem('customers', JSON.stringify(updated));
    }
  },

  // 3. RENTALS OPERATIONS
  getRentals: async (): Promise<AluguelComDetalhes[]> => {
    if (supabase) {
      // Fetch rentals and join cars & customers
      const { data, error } = await supabase
        .from('alugueis')
        .select(`
          *,
          carro:carros(*),
          cliente:clientes(*)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      const rentalsStore = localStorage.getItem('rentals');
      const rentals: Aluguel[] = rentalsStore ? JSON.parse(rentalsStore) : [];
      const cars = await db.getCars();
      const customers = await db.getCustomers();

      // Hydrate local data
      return rentals.map(rent => {
        const carro = cars.find(c => c.id === rent.carro_id);
        const cliente = customers.find(cli => cli.id === rent.cliente_id);
        return {
          ...rent,
          carro,
          cliente
        };
      }).sort((a, b) => {
        // Return latest first
        return (b.id > a.id) ? 1 : -1;
      });
    }
  },

  addRental: async (aluguel: Omit<Aluguel, 'id' | 'status'> & { status?: Aluguel['status'] }): Promise<Aluguel> => {
    if (supabase) {
      // 1. Insert rental record
      const { data, error } = await supabase
        .from('alugueis')
        .insert([{ ...aluguel, status: aluguel.status || 'ativo' }])
        .select()
        .single();
      if (error) throw error;

      // 2. Update car status to 'alugado'
      const { error: carError } = await supabase
        .from('carros')
        .update({ status: 'alugado' })
        .eq('id', aluguel.carro_id);
      if (carError) console.error('Error updating car status in Supabase:', carError);

      return data;
    } else {
      const rentals = localStorage.getItem('rentals');
      const list: Aluguel[] = rentals ? JSON.parse(rentals) : [];
      
      const newRental: Aluguel = {
        ...aluguel,
        id: 'rent-' + Math.random().toString(36).substr(2, 9),
        status: aluguel.status || 'ativo'
      };

      list.push(newRental);
      localStorage.setItem('rentals', JSON.stringify(list));

      // Update car status
      await db.updateCarStatus(aluguel.carro_id, 'alugado');

      return newRental;
    }
  },

  finishRental: async (id: string, carroId: string): Promise<void> => {
    if (supabase) {
      // 1. Update rental status to finalizado
      const { error } = await supabase
        .from('alugueis')
        .update({ status: 'finalizado' })
        .eq('id', id);
      if (error) throw error;

      // 2. Set car back to disponivel
      const { error: carError } = await supabase
        .from('carros')
        .update({ status: 'disponivel' })
        .eq('id', carroId);
      if (carError) console.error('Error freeing car status in Supabase:', carError);
    } else {
      const rentalsStore = localStorage.getItem('rentals');
      const list: Aluguel[] = rentalsStore ? JSON.parse(rentalsStore) : [];
      
      const index = list.findIndex(r => r.id === id);
      if (index !== -1) {
        list[index].status = 'finalizado';
        localStorage.setItem('rentals', JSON.stringify(list));
      }

      // Update car status to available
      await db.updateCarStatus(carroId, 'disponivel');
    }
  },

  deleteRental: async (id: string, carroId: string, isCurrentlyActive: boolean): Promise<void> => {
    if (supabase) {
      const { error } = await supabase
        .from('alugueis')
        .delete()
        .eq('id', id);
      if (error) throw error;

      if (isCurrentlyActive) {
        // If active rental is deleted, set car as available
        await supabase.from('carros').update({ status: 'disponivel' }).eq('id', carroId);
      }
    } else {
      const rentalsStore = localStorage.getItem('rentals');
      const list: Aluguel[] = rentalsStore ? JSON.parse(rentalsStore) : [];
      const updated = list.filter(r => r.id !== id);
      localStorage.setItem('rentals', JSON.stringify(updated));

      if (isCurrentlyActive) {
        await db.updateCarStatus(carroId, 'disponivel');
      }
    }
  }
};

export const SQL_SCHEMA = `-- COMANDOS SQL PARA CRIAR AS TABELAS NO SUPABASE CLI OU SQL EDITOR

-- 1. Criação da tabela de CARROS
create table public.carros (
  id uuid default gen_random_uuid() primary key,
  marca varchar(100) not null,
  modelo varchar(100) not null,
  placa varchar(20) not null unique,
  ano integer not null,
  preco_diaria numeric(10, 2) not null,
  status varchar(20) not null default 'disponivel' check (status in ('disponivel', 'alugado', 'manutencao')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security (RLS) se necessário, ou configurar regras livres
alter table public.carros enable row level security;
create policy "Acesso público completo para Carros" on public.carros
  for all using (true) with check (true);

-- 2. Criação da tabela de CLIENTES
create table public.clientes (
  id uuid default gen_random_uuid() primary key,
  nome varchar(200) not null,
  cpf varchar(14) not null unique,
  telefone varchar(20) not null,
  email varchar(150),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.clientes enable row level security;
create policy "Acesso público completo para Clientes" on public.clientes
  for all using (true) with check (true);

-- 3. Criação da tabela de ALUGUÉIS
create table public.alugueis (
  id uuid default gen_random_uuid() primary key,
  carro_id uuid references public.carros(id) on delete cascade not null,
  cliente_id uuid references public.clientes(id) on delete cascade not null,
  data_inicio date not null,
  data_fim date not null,
  valor_total numeric(10, 2) not null,
  status varchar(20) not null default 'ativo' check (status in ('ativo', 'finalizado')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.alugueis enable row level security;
create policy "Acesso público completo para Aluguéis" on public.alugueis
  for all using (true) with check (true);
`;
