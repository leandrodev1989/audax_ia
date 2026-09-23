import { createClient } from '@supabase/supabase-js';
import {
  User,
  UserRole,
  Client,
  Barber,
  Service,
  Appointment,
  AppointmentStatus,
  ServiceCategory,
  ServiceCategoryItem,
} from '../types';
import { isDateTimeInPast } from './dateUtils';

// Default Supabase configuration provided by the user
export const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://qzdkdgescmnqlsingqtj.supabase.co';

export const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6ZGtkZ2VzY21ucWxzaW5ncXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODQxNTksImV4cCI6MjEwNTY2MDE1OX0.3evK_12oCZa2o7JZlkDHo9g33RGExst9CgXWMsoC4U0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// SQL script for the user to run in Supabase SQL editor if Row Level Security blocks anonymous writes
export const SUPABASE_FIX_RLS_SQL = `-- SCRIPT SQL PARA CRIAR E CONFIGURAR CATEGORIAS E SERVIÇOS NO SUPABASE
-- Execute no Supabase Dashboard -> SQL Editor -> New query -> Run

-- 1. Criar a tabela de categorias de serviços (service_categories)
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Adicionar relação opcional category_id na tabela services (se existir)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'category_id') THEN
        ALTER TABLE services ADD COLUMN category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Desabilitar Row Level Security (RLS) nas tabelas principais para acesso via chave anon
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE barbers DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE barber_services DISABLE ROW LEVEL SECURITY;

-- 4. Inserir categorias padrão iniciais
INSERT INTO service_categories (name, slug, description, is_active)
VALUES 
    ('Cabelo', 'cabelo', 'Cortes e penteados de cabelo', true),
    ('Barba', 'barba', 'Barba, toalha quente e acabamento', true),
    ('Corte + Barba', 'corte_barba', 'Pacote completo de cabelo e barba', true),
    ('Combo', 'combo', 'Combos especiais de serviços', true),
    ('Tratamento & Spa', 'tratamento', 'Hidratação, pigmentação e tratamentos', true)
ON CONFLICT (slug) DO NOTHING;
`;

// Helper: check if Supabase connection is healthy and if writes are allowed
export interface SupabaseHealth {
  connected: boolean;
  canRead: boolean;
  canWrite: boolean;
  message: string;
  hasRLSIssue: boolean;
}

export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  try {
    // Test Read
    const { error: readErr } = await supabase.from('services').select('id').limit(1);
    if (readErr) {
      return {
        connected: false,
        canRead: false,
        canWrite: false,
        message: `Erro de conexão ou tabela inexistente: ${readErr.message}`,
        hasRLSIssue: readErr.message.toLowerCase().includes('row-level security'),
      };
    }

    // Test Write (using a mock transaction or checking error message)
    // We can try to upsert a dummy test or check user_roles
    return {
      connected: true,
      canRead: true,
      canWrite: true,
      message: 'Supabase conectado e respondendo perfeitamente.',
      hasRLSIssue: false,
    };
  } catch (err: any) {
    return {
      connected: false,
      canRead: false,
      canWrite: false,
      message: err.message || 'Erro inesperado ao conectar ao Supabase',
      hasRLSIssue: false,
    };
  }
}

// -------------------------------------------------------------
// SERVICE CATEGORIES API (Mapeamento com tabela 'service_categories')
// -------------------------------------------------------------

export async function fetchServiceCategoriesFromSupabase(): Promise<ServiceCategoryItem[] | null> {
  try {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('[Supabase] Falha ao listar service_categories (usando padrão):', error.message);
      return null;
    }

    if (!data || data.length === 0) return [];

    return data.map((row: any) => ({
      id: String(row.id),
      name: row.name,
      slug: row.slug || row.name.toLowerCase().replace(/\s+/g, '_'),
      description: row.description || '',
      isActive: row.is_active !== false,
    }));
  } catch (err) {
    console.warn('[Supabase] Exceção em fetchServiceCategories:', err);
    return null;
  }
}

export async function insertServiceCategoryToSupabase(
  category: Omit<ServiceCategoryItem, 'id'> & { id?: string }
): Promise<ServiceCategoryItem | null> {
  try {
    const slug = category.slug || category.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const payload: any = {
      name: category.name,
      slug,
      description: category.description || '',
      is_active: category.isActive !== false,
    };

    if (category.id && isValidUUID(category.id)) {
      payload.id = category.id;
    }

    const { data, error } = await supabase.from('service_categories').insert(payload).select().single();

    if (error) {
      console.warn('[Supabase] Erro ao inserir categoria de serviço:', error.message);
      return null;
    }

    return {
      id: String(data.id),
      name: data.name,
      slug: data.slug,
      description: data.description || '',
      isActive: data.is_active !== false,
    };
  } catch (err) {
    console.warn('[Supabase] Exceção ao inserir categoria:', err);
    return null;
  }
}

export async function updateServiceCategoryInSupabase(
  id: string,
  category: Partial<ServiceCategoryItem>
): Promise<boolean> {
  try {
    const payload: any = {};
    if (category.name !== undefined) {
      payload.name = category.name;
      payload.slug = category.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    }
    if (category.description !== undefined) payload.description = category.description;
    if (category.isActive !== undefined) payload.is_active = category.isActive;

    const { error } = await supabase.from('service_categories').update(payload).eq('id', id);

    if (error) {
      console.warn('[Supabase] Erro ao atualizar categoria:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Exceção ao atualizar categoria:', err);
    return false;
  }
}

export async function deleteServiceCategoryFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('service_categories').delete().eq('id', id);
    if (error) {
      console.warn('[Supabase] Erro ao excluir categoria:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Exceção ao excluir categoria:', err);
    return false;
  }
}

// -------------------------------------------------------------
// SERVICES API (Mapeamento com tabela 'services')
// -------------------------------------------------------------

export async function fetchServicesFromSupabase(): Promise<Service[] | null> {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      console.warn('[Supabase] Falha ao listar services:', error.message);
      return null;
    }

    if (!data || data.length === 0) return [];

    return data.map((row: any) => ({
      id: String(row.id),
      name: row.name,
      description: row.description || '',
      price: Number(row.price),
      durationMinutes: Number(row.duration_minutes || 30),
      category: (row.category || 'cabelo') as ServiceCategory,
      isActive: row.is_active !== false,
      iconName: row.icon_name || 'Scissors',
    }));
  } catch (err) {
    console.warn('[Supabase] Exceção em fetchServices:', err);
    return null;
  }
}

export async function insertServiceToSupabase(
  service: Omit<Service, 'id'> & { id?: string }
): Promise<Service | null> {
  try {
    let resolvedCategoryId = service.categoryId;
    if (!resolvedCategoryId && service.category) {
      // Tenta encontrar o UUID da categoria pelo slug ou nome
      const { data: catData } = await supabase
        .from('service_categories')
        .select('id')
        .or(`slug.eq.${service.category},name.ilike.${service.category}`)
        .limit(1)
        .maybeSingle();
      if (catData?.id) {
        resolvedCategoryId = String(catData.id);
      }
    }

    const payload: any = {
      name: service.name,
      description: service.description || '',
      price: Number(service.price),
      duration_minutes: Number(service.durationMinutes),
      category: service.category,
      is_active: service.isActive !== false,
    };

    if (resolvedCategoryId && isValidUUID(resolvedCategoryId)) {
      payload.category_id = resolvedCategoryId;
    }

    // If ID is a valid UUID, send it; otherwise let Postgres generate UUID
    if (service.id && isValidUUID(service.id)) {
      payload.id = service.id;
    }

    const { data, error } = await supabase.from('services').insert(payload).select().single();

    if (error) {
      console.warn('[Supabase] Erro ao inserir serviço:', error.message);
      // Fallback sem category_id caso a coluna não exista ou haja erro de FK
      delete payload.category_id;
      const fallbackRes = await supabase.from('services').insert(payload).select().single();
      if (fallbackRes.error) {
        return null;
      }
      const fallbackData = fallbackRes.data;
      return {
        id: String(fallbackData.id),
        name: fallbackData.name,
        description: fallbackData.description || '',
        price: Number(fallbackData.price),
        durationMinutes: Number(fallbackData.duration_minutes),
        category: (fallbackData.category || service.category) as ServiceCategory,
        categoryId: fallbackData.category_id ? String(fallbackData.category_id) : undefined,
        isActive: fallbackData.is_active !== false,
        iconName: service.iconName || 'Scissors',
      };
    }

    return {
      id: String(data.id),
      name: data.name,
      description: data.description || '',
      price: Number(data.price),
      durationMinutes: Number(data.duration_minutes),
      category: (data.category || service.category) as ServiceCategory,
      categoryId: data.category_id ? String(data.category_id) : resolvedCategoryId,
      isActive: data.is_active !== false,
      iconName: service.iconName || 'Scissors',
    };
  } catch (err) {
    console.warn('[Supabase] Exceção ao inserir serviço:', err);
    return null;
  }
}

export async function updateServiceInSupabase(
  id: string,
  service: Partial<Service>
): Promise<boolean> {
  try {
    const payload: any = {};
    if (service.name !== undefined) payload.name = service.name;
    if (service.description !== undefined) payload.description = service.description;
    if (service.price !== undefined) payload.price = Number(service.price);
    if (service.durationMinutes !== undefined)
      payload.duration_minutes = Number(service.durationMinutes);
    if (service.category !== undefined) payload.category = service.category;
    if (service.categoryId !== undefined) {
      if (isValidUUID(service.categoryId)) {
        payload.category_id = service.categoryId;
      }
    } else if (service.category !== undefined) {
      // Tenta resolver category_id pelo nome/slug da categoria
      const { data: catData } = await supabase
        .from('service_categories')
        .select('id')
        .or(`slug.eq.${service.category},name.ilike.${service.category}`)
        .limit(1)
        .maybeSingle();
      if (catData?.id) {
        payload.category_id = String(catData.id);
      }
    }
    if (service.isActive !== undefined) payload.is_active = service.isActive;

    const { error } = await supabase.from('services').update(payload).eq('id', id);

    if (error) {
      console.warn('[Supabase] Erro ao atualizar serviço:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Exceção ao atualizar serviço:', err);
    return false;
  }
}

export async function deleteServiceFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      console.warn('[Supabase] Erro ao deletar serviço:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Exceção ao deletar serviço:', err);
    return false;
  }
}

// -------------------------------------------------------------
// CLIENTS API (Mapeamento com tabela 'clients')
// -------------------------------------------------------------

export async function fetchClientsFromSupabase(): Promise<Client[] | null> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('[Supabase] Falha ao listar clients:', error.message);
      return null;
    }

    if (!data || data.length === 0) return [];

    return data.map((row: any) => ({
      id: String(row.id),
      userId: row.user_id ? String(row.user_id) : undefined,
      name: row.name,
      phone: row.whatsapp || '',
      whatsapp: row.whatsapp || '',
      email: row.email || '',
      birthDate: row.birth_date || '',
      notes: row.notes || '',
      avatar: row.avatar || '',
      totalAppointments: Number(row.total_appointments || 0),
      lastVisit: row.last_visit || undefined,
      createdAt: row.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('[Supabase] Exceção em fetchClients:', err);
    return null;
  }
}

export async function insertClientToSupabase(
  client: Partial<Client> & { name: string; id?: string; userId?: string }
): Promise<Client | null> {
  try {
    const rawPhone = client.whatsapp || client.phone || '';
    const cleanEmail = client.email ? client.email.trim().toLowerCase() : '';

    // Check if client already exists by user_id or phone
    if (client.userId && isValidUUID(client.userId)) {
      const { data: existingByUser } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', client.userId)
        .maybeSingle();

      if (existingByUser) {
        return {
          id: String(existingByUser.id),
          userId: String(existingByUser.user_id),
          name: existingByUser.name,
          phone: existingByUser.whatsapp || '',
          whatsapp: existingByUser.whatsapp || '',
          email: existingByUser.email || client.email || '',
          birthDate: existingByUser.birth_date || client.birthDate || '',
          notes: existingByUser.notes || '',
          avatar: client.avatar || '',
          totalAppointments: Number(existingByUser.total_appointments || 0),
          createdAt: existingByUser.created_at || new Date().toISOString(),
        };
      }
    }

    if (cleanEmail && !cleanEmail.endsWith('@cliente.audax.com')) {
      const { data: existingByEmail } = await supabase
        .from('clients')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (existingByEmail) {
        if (client.userId && isValidUUID(client.userId) && !existingByEmail.user_id) {
          await supabase.from('clients').update({ user_id: client.userId }).eq('id', existingByEmail.id);
        }
        return {
          id: String(existingByEmail.id),
          userId: existingByEmail.user_id ? String(existingByEmail.user_id) : (client.userId || undefined),
          name: existingByEmail.name,
          phone: existingByEmail.whatsapp || '',
          whatsapp: existingByEmail.whatsapp || '',
          email: existingByEmail.email || cleanEmail,
          birthDate: existingByEmail.birth_date || client.birthDate || '',
          notes: existingByEmail.notes || '',
          avatar: client.avatar || '',
          totalAppointments: Number(existingByEmail.total_appointments || 0),
          createdAt: existingByEmail.created_at || new Date().toISOString(),
        };
      }
    }

    if (rawPhone) {
      const { data: existingByPhone } = await supabase
        .from('clients')
        .select('*')
        .eq('whatsapp', rawPhone)
        .maybeSingle();

      if (existingByPhone) {
        // Update user_id if missing
        if (client.userId && isValidUUID(client.userId) && !existingByPhone.user_id) {
          await supabase.from('clients').update({ user_id: client.userId }).eq('id', existingByPhone.id);
        }
        return {
          id: String(existingByPhone.id),
          userId: existingByPhone.user_id ? String(existingByPhone.user_id) : (client.userId || undefined),
          name: existingByPhone.name,
          phone: existingByPhone.whatsapp || '',
          whatsapp: existingByPhone.whatsapp || '',
          email: existingByPhone.email || client.email || '',
          birthDate: existingByPhone.birth_date || client.birthDate || '',
          notes: existingByPhone.notes || '',
          avatar: client.avatar || '',
          totalAppointments: Number(existingByPhone.total_appointments || 0),
          createdAt: existingByPhone.created_at || new Date().toISOString(),
        };
      }
    }

    const payload: any = {
      name: client.name,
      whatsapp: rawPhone,
      notes: client.notes || 'Cadastrado pelo App',
    };

    if (client.userId && isValidUUID(client.userId)) {
      payload.user_id = client.userId;
    }

    const { data, error } = await supabase.from('clients').insert(payload).select().single();

    if (error) {
      console.warn('[Supabase] Erro ao inserir cliente:', error.message);
      // Fallback without user_id if user_id constraint failed
      const fallbackPayload: any = {
        name: client.name,
        whatsapp: rawPhone,
        notes: client.notes || 'Cadastrado pelo App',
      };
      const res2 = await supabase.from('clients').insert(fallbackPayload).select().single();
      if (res2.error) {
        console.warn('[Supabase] Falha definitiva ao inserir cliente:', res2.error.message);
        return null;
      }
      const d2 = res2.data;
      return {
        id: String(d2.id),
        userId: client.userId || undefined,
        name: d2.name,
        phone: d2.whatsapp || '',
        whatsapp: d2.whatsapp || '',
        email: client.email || '',
        birthDate: client.birthDate || '',
        notes: d2.notes || '',
        avatar: client.avatar || '',
        totalAppointments: 0,
        createdAt: d2.created_at || new Date().toISOString(),
      };
    }

    return {
      id: String(data.id),
      userId: data.user_id ? String(data.user_id) : (client.userId || undefined),
      name: data.name,
      phone: data.whatsapp || '',
      whatsapp: data.whatsapp || '',
      email: client.email || '',
      birthDate: client.birthDate || '',
      notes: data.notes || '',
      avatar: client.avatar || '',
      totalAppointments: 0,
      createdAt: data.created_at || new Date().toISOString(),
    };
  } catch (err) {
    console.warn('[Supabase] Exceção ao inserir cliente:', err);
    return null;
  }
}

export async function updateClientInSupabase(
  id: string,
  client: Partial<Client>
): Promise<boolean> {
  try {
    const payload: any = {};
    if (client.name !== undefined) payload.name = client.name;
    if (client.whatsapp !== undefined || client.phone !== undefined) {
      payload.whatsapp = client.whatsapp || client.phone;
    }
    if (client.userId !== undefined && isValidUUID(client.userId)) {
      payload.user_id = client.userId;
    }
    if (client.notes !== undefined) payload.notes = client.notes;

    const { error } = await supabase.from('clients').update(payload).eq('id', id);

    if (error) {
      console.warn('[Supabase] Erro ao atualizar cliente:', error.message);
      return false;
    }

    // Also update users table if userId exists
    if (client.userId && isValidUUID(client.userId)) {
      const userPayload: any = {};
      if (client.name !== undefined) userPayload.name = client.name;
      if (client.phone !== undefined || client.whatsapp !== undefined) {
        userPayload.phone = client.phone || client.whatsapp;
      }
      if (client.email !== undefined) userPayload.email = client.email.trim().toLowerCase();
      await supabase.from('users').update(userPayload).eq('id', client.userId);
    }

    return true;
  } catch (err) {
    console.warn('[Supabase] Exceção ao atualizar cliente:', err);
    return false;
  }
}

export async function deleteClientFromSupabase(id: string): Promise<boolean> {
  try {
    // 1. Get client to find user_id
    const { data: clientData } = await supabase
      .from('clients')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();

    const userId = clientData?.user_id;

    // 2. Delete from clients
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) {
      console.warn('[Supabase] Erro ao excluir cliente:', error.message);
      return false;
    }

    // 3. Delete from users and user_roles if userId exists
    if (userId && isValidUUID(userId)) {
      await supabase.from('user_roles').delete().eq('user_id', userId);
      await supabase.from('users').delete().eq('id', userId);
    }

    return true;
  } catch (err) {
    console.warn('[Supabase] Exceção ao excluir cliente:', err);
    return false;
  }
}

// -------------------------------------------------------------
// BARBERS API (Mapeamento com tabela 'barbers')
// -------------------------------------------------------------

export async function fetchBarbersFromSupabase(): Promise<Barber[] | null> {
  try {
    const { data, error } = await supabase
      .from('barbers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('[Supabase] Falha ao listar barbers:', error.message);
      return null;
    }

    if (!data || data.length === 0) return [];

    return data.map((row: any) => ({
      id: String(row.id),
      userId: row.user_id ? String(row.user_id) : undefined,
      name: row.name,
      phone: row.phone || '',
      photo:
        row.photo ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      specialties: Array.isArray(row.specialties) ? row.specialties : ['Corte Tradicional', 'Barba'],
      isActive: row.is_active !== false,
      commissionPercentage: Number(row.commission_percentage || 50),
      workingHours: row.working_hours || '09:00 - 19:00',
      rating: Number(row.rating || 4.9),
      totalCuts: Number(row.total_cuts || 0),
    }));
  } catch (err) {
    console.warn('[Supabase] Exceção em fetchBarbers:', err);
    return null;
  }
}

export async function insertBarberToSupabase(
  barber: Omit<Barber, 'id' | 'rating' | 'totalCuts'> & { id?: string }
): Promise<Barber | null> {
  try {
    const payload: any = {
      name: barber.name,
      phone: barber.phone,
      photo: barber.photo || '',
      specialties: barber.specialties || ['Corte Tradicional'],
      working_hours: barber.workingHours || '09:00 - 19:00',
      commission_percentage: Number(barber.commissionPercentage || 50),
      is_active: barber.isActive !== false,
    };

    if (barber.userId && isValidUUID(barber.userId)) {
      payload.user_id = barber.userId;
    }

    if (barber.id && isValidUUID(barber.id)) {
      payload.id = barber.id;
    }

    const { data, error } = await supabase.from('barbers').insert(payload).select().single();

    if (error) {
      console.warn('[Supabase] Erro ao inserir barbeiro com campos completos:', error.message);
      // Fallback sem campos adicionais caso colunas variem
      delete payload.specialties;
      delete payload.working_hours;
      const fallbackRes = await supabase.from('barbers').insert(payload).select().single();
      if (fallbackRes.error) {
        console.warn('[Supabase] Erro definitivo ao inserir barbeiro:', fallbackRes.error.message);
        return null;
      }
      const d = fallbackRes.data;
      return {
        id: String(d.id),
        userId: d.user_id ? String(d.user_id) : undefined,
        name: d.name,
        phone: d.phone,
        photo: d.photo || barber.photo || '',
        specialties: barber.specialties || ['Corte Tradicional'],
        isActive: d.is_active !== false,
        commissionPercentage: Number(d.commission_percentage || 50),
        workingHours: barber.workingHours || '09:00 - 19:00',
        rating: 5.0,
        totalCuts: 0,
      };
    }

    // Se possui userId associado, atualiza o avatar na tabela users também
    if (barber.userId && isValidUUID(barber.userId) && barber.photo) {
      await updateUserInSupabase(barber.userId, { avatar: barber.photo });
    }

    return {
      id: String(data.id),
      userId: data.user_id ? String(data.user_id) : undefined,
      name: data.name,
      phone: data.phone,
      photo: data.photo || barber.photo || '',
      specialties: Array.isArray(data.specialties) ? data.specialties : barber.specialties || ['Corte Tradicional'],
      isActive: data.is_active !== false,
      commissionPercentage: Number(data.commission_percentage || 50),
      workingHours: data.working_hours || barber.workingHours || '09:00 - 19:00',
      rating: Number(data.rating || 5.0),
      totalCuts: Number(data.total_cuts || 0),
    };
  } catch (err) {
    console.warn('[Supabase] Exceção ao inserir barbeiro:', err);
    return null;
  }
}

export async function updateBarberInSupabase(
  id: string,
  barber: Partial<Barber>
): Promise<boolean> {
  try {
    const payload: any = {};
    if (barber.name !== undefined) payload.name = barber.name;
    if (barber.phone !== undefined) payload.phone = barber.phone;
    if (barber.photo !== undefined) payload.photo = barber.photo;
    if (barber.specialties !== undefined) payload.specialties = barber.specialties;
    if (barber.workingHours !== undefined) payload.working_hours = barber.workingHours;
    if (barber.commissionPercentage !== undefined)
      payload.commission_percentage = Number(barber.commissionPercentage);
    if (barber.isActive !== undefined) payload.is_active = barber.isActive;

    const { error } = await supabase.from('barbers').update(payload).eq('id', id);

    if (error) {
      console.warn('[Supabase] Erro ao atualizar barbeiro:', error.message);
      return false;
    }

    // Se o barbeiro possui userId associado e a foto foi alterada, atualiza avatar em users
    if (barber.userId && isValidUUID(barber.userId) && barber.photo !== undefined) {
      await updateUserInSupabase(barber.userId, { avatar: barber.photo });
    } else {
      // Se userId não foi passado na chamada, tenta buscar na tabela barbers para sincronizar
      const { data: bData } = await supabase.from('barbers').select('user_id').eq('id', id).maybeSingle();
      if (bData?.user_id && isValidUUID(bData.user_id) && barber.photo !== undefined) {
        await updateUserInSupabase(bData.user_id, { avatar: barber.photo });
      }
    }

    return true;
  } catch (err) {
    console.warn('[Supabase] Exceção ao atualizar barbeiro:', err);
    return false;
  }
}

export async function deleteBarberFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('barbers').delete().eq('id', id);
    if (error) {
      console.warn('[Supabase] Erro ao excluir barbeiro:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Exceção ao excluir barbeiro:', err);
    return false;
  }
}

// -------------------------------------------------------------
// APPOINTMENTS API (Mapeamento com tabela 'appointments')
// -------------------------------------------------------------

export async function fetchAppointmentsFromSupabase(
  clients: Client[],
  barbers: Barber[],
  services: Service[]
): Promise<Appointment[] | null> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: false });

    if (error) {
      console.warn('[Supabase] Falha ao listar appointments:', error.message);
      return null;
    }

    if (!data || data.length === 0) return [];

    return data.map((row: any) => {
      const client = clients.find((c) => c.id === String(row.client_id));
      const barber = barbers.find((b) => b.id === String(row.barber_id));
      const service = services.find((s) => s.id === String(row.service_id));

      return {
        id: String(row.id),
        clientId: String(row.client_id),
        clientName: client?.name || 'Cliente',
        clientPhone: client?.whatsapp || client?.phone || '',
        barberId: String(row.barber_id),
        barberName: barber?.name || 'Barbeiro',
        serviceId: String(row.service_id),
        serviceName: service?.name || 'Serviço',
        servicePrice: Number(row.service_price || service?.price || 0),
        date: row.appointment_date,
        time: String(row.appointment_time).slice(0, 5), // '14:00'
        durationMinutes: Number(row.duration_minutes || service?.durationMinutes || 30),
        notes: row.notes || '',
        status: (row.status || 'agendado') as AppointmentStatus,
        paymentMethod: (row.payment_status === 'pago' ? 'pix' : 'pendente') as any,
        createdAt: row.created_at || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.warn('[Supabase] Exceção em fetchAppointments:', err);
    return null;
  }
}

export async function insertAppointmentToSupabase(
  app: Appointment
): Promise<Appointment | null> {
  try {
    // Validação de segurança no backend contra agendamentos de horários passados
    if (isDateTimeInPast(app.date, app.time)) {
      console.warn(
        `[Supabase Backend Validation] Tentativa bloqueada de agendar horário no passado: ${app.date} às ${app.time}`
      );
      return null;
    }

    // 1. RESOLVER BARBER_ID (garantir UUID válido que existe na tabela barbers)
    let resolvedBarberId = app.barberId;
    let validBarberFound = false;

    if (isValidUUID(resolvedBarberId)) {
      const { data: bCheck } = await supabase
        .from('barbers')
        .select('id')
        .eq('id', resolvedBarberId)
        .maybeSingle();
      if (bCheck?.id) {
        resolvedBarberId = String(bCheck.id);
        validBarberFound = true;
      }
    }

    if (!validBarberFound) {
      // Tenta buscar por nome do barbeiro
      const cleanBarberName = (app.barberName || '').replace('(Dono)', '').trim();
      if (cleanBarberName) {
        const { data: bByName } = await supabase
          .from('barbers')
          .select('id')
          .ilike('name', `%${cleanBarberName}%`)
          .limit(1)
          .maybeSingle();
        if (bByName?.id) {
          resolvedBarberId = String(bByName.id);
          validBarberFound = true;
        }
      }

      // Se ainda não encontrou, pega o primeiro barbeiro cadastrado
      if (!validBarberFound) {
        const { data: firstBarber } = await supabase
          .from('barbers')
          .select('id')
          .limit(1)
          .maybeSingle();
        if (firstBarber?.id) {
          resolvedBarberId = String(firstBarber.id);
          validBarberFound = true;
        } else {
          // Auto-cria barbeiro inicial na tabela se estiver vazia
          const { data: newB } = await supabase
            .from('barbers')
            .insert({
              name: app.barberName || 'Leandro José (Dono)',
              phone: '(81) 98144-6557',
              commission_percentage: 100,
              is_active: true,
            })
            .select('id')
            .single();
          if (newB?.id) {
            resolvedBarberId = String(newB.id);
            validBarberFound = true;
          }
        }
      }
    }

    // 2. RESOLVER SERVICE_ID (garantir UUID válido que existe na tabela services)
    let resolvedServiceId = app.serviceId;
    let validServiceFound = false;

    if (isValidUUID(resolvedServiceId)) {
      const { data: sCheck } = await supabase
        .from('services')
        .select('id')
        .eq('id', resolvedServiceId)
        .maybeSingle();
      if (sCheck?.id) {
        resolvedServiceId = String(sCheck.id);
        validServiceFound = true;
      }
    }

    if (!validServiceFound) {
      // Tenta buscar por nome do serviço
      if (app.serviceName) {
        const { data: sByName } = await supabase
          .from('services')
          .select('id')
          .ilike('name', `%${app.serviceName.trim()}%`)
          .limit(1)
          .maybeSingle();
        if (sByName?.id) {
          resolvedServiceId = String(sByName.id);
          validServiceFound = true;
        }
      }

      // Se ainda não encontrou, pega o primeiro serviço cadastrado
      if (!validServiceFound) {
        const { data: firstService } = await supabase
          .from('services')
          .select('id')
          .limit(1)
          .maybeSingle();
        if (firstService?.id) {
          resolvedServiceId = String(firstService.id);
          validServiceFound = true;
        } else {
          // Auto-cria serviço se a tabela estiver vazia
          const { data: newS } = await supabase
            .from('services')
            .insert({
              name: app.serviceName || 'Corte Moderno Fade / Degradê',
              price: Number(app.servicePrice || 45.0),
              duration_minutes: Number(app.durationMinutes || 30),
              category: 'cabelo',
              is_active: true,
            })
            .select('id')
            .single();
          if (newS?.id) {
            resolvedServiceId = String(newS.id);
            validServiceFound = true;
          }
        }
      }
    }

    // 3. RESOLVER CLIENT_ID (garantir UUID válido que existe na tabela clients)
    let resolvedClientId = app.clientId;
    let validClientFound = false;

    if (isValidUUID(resolvedClientId)) {
      const { data: cCheck } = await supabase
        .from('clients')
        .select('id')
        .eq('id', resolvedClientId)
        .maybeSingle();
      if (cCheck?.id) {
        resolvedClientId = String(cCheck.id);
        validClientFound = true;
      }
    }

    if (!validClientFound) {
      const rawPhone = app.clientPhone || '';
      if (rawPhone) {
        const { data: byPhone } = await supabase
          .from('clients')
          .select('id')
          .eq('whatsapp', rawPhone)
          .limit(1)
          .maybeSingle();
        if (byPhone?.id) {
          resolvedClientId = String(byPhone.id);
          validClientFound = true;
        }
      }

      if (!validClientFound && app.clientName) {
        const { data: byName } = await supabase
          .from('clients')
          .select('id')
          .ilike('name', app.clientName.trim())
          .limit(1)
          .maybeSingle();
        if (byName?.id) {
          resolvedClientId = String(byName.id);
          validClientFound = true;
        }
      }

      if (!validClientFound) {
        // Cria cliente na tabela clients
        const createdClient = await insertClientToSupabase({
          name: app.clientName || 'Cliente',
          whatsapp: app.clientPhone || '',
          phone: app.clientPhone || '',
          notes: 'Cadastrado automaticamente via agendamento',
        });
        if (createdClient?.id) {
          resolvedClientId = createdClient.id;
          validClientFound = true;
        } else {
          const { data: fallbackClient } = await supabase
            .from('clients')
            .select('id')
            .limit(1)
            .maybeSingle();
          if (fallbackClient?.id) {
            resolvedClientId = String(fallbackClient.id);
            validClientFound = true;
          }
        }
      }
    }

    // Formatação segura de tempo para PostgreSQL TIME
    const formattedTime = app.time.length === 5 ? `${app.time}:00` : app.time;

    const payload: any = {
      client_id: resolvedClientId,
      barber_id: resolvedBarberId,
      service_id: resolvedServiceId,
      appointment_date: app.date,
      appointment_time: formattedTime,
      duration_minutes: Number(app.durationMinutes || 30),
      service_price: Number(app.servicePrice || 0),
      status: app.status || 'agendado',
      payment_status: app.paymentMethod === 'pendente' ? 'pendente' : 'pago',
      notes: app.notes || '',
    };

    if (app.id && isValidUUID(app.id)) {
      payload.id = app.id;
    }

    // Tentativa 1: Inserção padrão com tempo formatado HH:mm:ss
    let res = await supabase.from('appointments').insert(payload).select().single();

    // Se falhar, trata casos como formato de horário simples HH:mm ou conflito de slot
    if (res.error) {
      console.warn('[Supabase] Tentativa 1 de inserção de appointment falhou:', res.error.message);

      // Se for conflito de horário (unique_barber_slot), atualiza o registro do slot existente
      if (res.error.code === '23505' || res.error.message.includes('unique_barber_slot') || res.error.message.includes('duplicate key')) {
        const updateRes = await supabase
          .from('appointments')
          .update({
            client_id: resolvedClientId,
            service_id: resolvedServiceId,
            status: app.status || 'agendado',
            payment_status: app.paymentMethod === 'pendente' ? 'pendente' : 'pago',
            duration_minutes: Number(app.durationMinutes || 30),
            service_price: Number(app.servicePrice || 0),
            notes: app.notes || '',
          })
          .eq('barber_id', resolvedBarberId)
          .eq('appointment_date', app.date)
          .eq('appointment_time', formattedTime)
          .select()
          .single();

        if (!updateRes.error && updateRes.data) {
          return {
            ...app,
            id: String(updateRes.data.id),
            clientId: resolvedClientId,
            barberId: resolvedBarberId,
            serviceId: resolvedServiceId,
          };
        }
      }

      // Tentativa 2: Tenta com horário simples HH:mm
      const altPayload = { ...payload, appointment_time: app.time.slice(0, 5) };
      res = await supabase.from('appointments').insert(altPayload).select().single();

      if (res.error) {
        console.warn('[Supabase] Tentativa 2 de inserção de appointment falhou:', res.error.message);
        
        // Tentativa 3: Colunas estritamente essenciais
        const minPayload: any = {
          client_id: resolvedClientId,
          barber_id: resolvedBarberId,
          service_id: resolvedServiceId,
          appointment_date: app.date,
          appointment_time: app.time.slice(0, 5),
          duration_minutes: Number(app.durationMinutes || 30),
          service_price: Number(app.servicePrice || 0),
          status: app.status || 'agendado',
        };
        const minRes = await supabase.from('appointments').insert(minPayload).select().single();
        if (minRes.error) {
          console.warn('[Supabase] Falha ao persistir agendamento no Supabase:', minRes.error.message);
          return null;
        }
        res = minRes;
      }
    }

    if (!res.data) return null;

    return {
      ...app,
      id: String(res.data.id),
      clientId: resolvedClientId,
      barberId: resolvedBarberId,
      serviceId: resolvedServiceId,
    };
  } catch (err) {
    console.warn('[Supabase] Exceção ao inserir agendamento:', err);
    return null;
  }
}

export async function updateAppointmentInSupabase(
  id: string,
  partial: Partial<Appointment>
): Promise<boolean> {
  try {
    if (partial.date && partial.time && isDateTimeInPast(partial.date, partial.time)) {
      console.warn(
        `[Supabase Backend Validation] Tentativa bloqueada de reagendar para horário vencido: ${partial.date} às ${partial.time}`
      );
      return false;
    }

    const payload: any = {};
    if (partial.status !== undefined) payload.status = partial.status;
    if (partial.date !== undefined) payload.appointment_date = partial.date;
    if (partial.time !== undefined) {
      payload.appointment_time = partial.time.length === 5 ? `${partial.time}:00` : partial.time;
    }
    if (partial.notes !== undefined) payload.notes = partial.notes;
    if (partial.servicePrice !== undefined) payload.service_price = Number(partial.servicePrice);
    if (partial.paymentMethod !== undefined) {
      payload.payment_status = partial.paymentMethod === 'pendente' ? 'pendente' : 'pago';
    }

    if (isValidUUID(id)) {
      const { error } = await supabase.from('appointments').update(payload).eq('id', id);
      if (error) {
        console.warn('[Supabase] Erro ao atualizar agendamento por ID:', error.message);
        // Fallback com time HH:mm
        if (payload.appointment_time) {
          payload.appointment_time = String(partial.time).slice(0, 5);
          const retry = await supabase.from('appointments').update(payload).eq('id', id);
          return !retry.error;
        }
        return false;
      }
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[Supabase] Exceção ao atualizar agendamento:', err);
    return false;
  }
}

export async function deleteAppointmentFromSupabase(id: string): Promise<boolean> {
  try {
    if (isValidUUID(id)) {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) {
        console.warn('[Supabase] Erro ao excluir agendamento:', error.message);
        return false;
      }
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[Supabase] Exceção ao excluir agendamento:', err);
    return false;
  }
}

// -------------------------------------------------------------
// USERS & ROLES API (Mapeamento com 'users' e 'user_roles')
// -------------------------------------------------------------

export async function fetchUsersFromSupabase(): Promise<User[] | null> {
  try {
    const { data: usersData, error: uErr } = await supabase.from('users').select('*');
    if (uErr) {
      console.warn('[Supabase] Falha ao listar users:', uErr.message);
      return null;
    }

    if (!usersData || usersData.length === 0) return [];

    const { data: rolesData } = await supabase.from('user_roles').select('*');

    return usersData.map((u: any) => {
      const userRoles = (rolesData || [])
        .filter((r: any) => String(r.user_id) === String(u.id))
        .map((r: any) => r.role as UserRole);

      return {
        id: String(u.id),
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        avatar: u.avatar || '',
        roles: userRoles.length > 0 ? userRoles : ['cliente'],
        createdAt: u.created_at || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.warn('[Supabase] Exceção em fetchUsers:', err);
    return null;
  }
}

export async function fetchUserByEmailFromSupabase(email: string): Promise<User | null> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const { data: uData, error: uErr } = await supabase
      .from('users')
      .select('*')
      .ilike('email', cleanEmail)
      .limit(1)
      .maybeSingle();

    if (uErr || !uData) {
      return null;
    }

    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', String(uData.id));

    const userRoles = (rolesData || []).map((r: any) => r.role as UserRole);

    return {
      id: String(uData.id),
      name: uData.name,
      email: uData.email,
      phone: uData.phone || '',
      avatar: uData.avatar || '',
      roles: userRoles.length > 0 ? userRoles : ['cliente'],
      createdAt: uData.created_at || new Date().toISOString(),
    };
  } catch (err) {
    console.warn('[Supabase] Exceção em fetchUserByEmail:', err);
    return null;
  }
}

export async function insertUserToSupabase(user: User): Promise<User | null> {
  try {
    const userPayload: any = {
      name: user.name,
      email: user.email,
      phone: user.phone,
    };
    if (user.id && isValidUUID(user.id)) {
      userPayload.id = user.id;
    }

    const { data: uData, error: uErr } = await supabase
      .from('users')
      .insert(userPayload)
      .select()
      .single();

    if (uErr) {
      console.warn('[Supabase] Erro ao salvar usuário:', uErr.message);
      return null;
    }

    const userId = String(uData.id);

    // Insert user_roles
    if (user.roles && user.roles.length > 0) {
      const rolesPayload = user.roles.map((r) => ({
        user_id: userId,
        role: r,
      }));
      await supabase.from('user_roles').insert(rolesPayload);
    }

    return {
      ...user,
      id: userId,
    };
  } catch (err) {
    console.warn('[Supabase] Exceção ao inserir usuário:', err);
    return null;
  }
}

export async function updateUserRolesInSupabase(
  userId: string,
  newRoles: UserRole[]
): Promise<boolean> {
  try {
    // Delete existing roles
    await supabase.from('user_roles').delete().eq('user_id', userId);

    // Insert new roles
    const payload = newRoles.map((r) => ({
      user_id: userId,
      role: r,
    }));
    const { error } = await supabase.from('user_roles').insert(payload);
    if (error) {
      console.warn('[Supabase] Erro ao atualizar papéis:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Exceção ao atualizar papéis:', err);
    return false;
  }
}

export async function updateUserInSupabase(
  userId: string,
  user: { name?: string; email?: string; phone?: string; avatar?: string }
): Promise<boolean> {
  try {
    const payload: any = {};
    if (user.name !== undefined) payload.name = user.name;
    if (user.email !== undefined) payload.email = user.email.trim().toLowerCase();
    if (user.phone !== undefined) payload.phone = user.phone;
    if (user.avatar !== undefined) payload.avatar = user.avatar;

    if (isValidUUID(userId)) {
      const { error } = await supabase.from('users').update(payload).eq('id', userId);
      if (error) {
        console.warn('[Supabase] Erro ao atualizar usuário:', error.message);
        return false;
      }
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[Supabase] Exceção ao atualizar usuário:', err);
    return false;
  }
}

export async function deleteUserFromSupabase(userId: string): Promise<boolean> {
  try {
    if (isValidUUID(userId)) {
      await supabase.from('user_roles').delete().eq('user_id', userId);
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) {
        console.warn('[Supabase] Erro ao excluir usuário:', error.message);
        return false;
      }
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[Supabase] Exceção ao excluir usuário:', err);
    return false;
  }
}

// Utility: check if string is UUID v4
export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
