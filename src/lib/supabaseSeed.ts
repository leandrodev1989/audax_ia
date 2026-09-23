import { supabase, isValidUUID } from './supabase';
import {
  INITIAL_USERS,
  INITIAL_BARBERS,
  INITIAL_SERVICES,
  INITIAL_CLIENTS,
  INITIAL_APPOINTMENTS,
} from '../data/mockData';

export interface SeedResult {
  success: boolean;
  message: string;
  counts: {
    users: number;
    barbers: number;
    clients: number;
    services: number;
    appointments: number;
  };
  error?: string;
}

/**
 * Seed all initial data to Supabase.
 * Useful when the user wants to populate their newly created Supabase tables.
 */
export async function seedSupabaseDatabase(): Promise<SeedResult> {
  const counts = {
    users: 0,
    barbers: 0,
    clients: 0,
    services: 0,
    appointments: 0,
  };

  try {
    // 1. Seed Services
    for (const srv of INITIAL_SERVICES) {
      const payload: any = {
        name: srv.name,
        description: srv.description,
        price: srv.price,
        duration_minutes: srv.durationMinutes,
        category: srv.category,
        is_active: srv.isActive !== false,
      };
      if (srv.id && isValidUUID(srv.id)) payload.id = srv.id;

      const { data, error } = await supabase.from('services').insert(payload).select().single();
      if (!error && data) {
        counts.services++;
      } else if (error) {
        console.warn('Seed services error:', error.message);
      }
    }

    // 2. Seed Users & User Roles
    const userMap: Record<string, string> = {}; // oldId -> newUUID
    for (const u of INITIAL_USERS) {
      const payload: any = {
        name: u.name,
        email: u.email,
        phone: u.phone,
      };
      if (u.id && isValidUUID(u.id)) payload.id = u.id;

      const { data, error } = await supabase.from('users').insert(payload).select().single();
      if (!error && data) {
        counts.users++;
        const newId = String(data.id);
        userMap[u.id] = newId;

        // Roles
        if (u.roles && u.roles.length > 0) {
          const rolesPayload = u.roles.map((r) => ({
            user_id: newId,
            role: r,
          }));
          await supabase.from('user_roles').insert(rolesPayload);
        }
      } else if (error) {
        console.warn('Seed users error:', error.message);
      }
    }

    // 3. Seed Barbers
    const barberMap: Record<string, string> = {};
    for (const b of INITIAL_BARBERS) {
      const payload: any = {
        name: b.name,
        phone: b.phone,
        commission_percentage: b.commissionPercentage,
        is_active: b.isActive,
      };
      if (b.id && isValidUUID(b.id)) payload.id = b.id;
      if (b.userId && userMap[b.userId]) payload.user_id = userMap[b.userId];

      const { data, error } = await supabase.from('barbers').insert(payload).select().single();
      if (!error && data) {
        counts.barbers++;
        barberMap[b.id] = String(data.id);
      } else if (error) {
        console.warn('Seed barbers error:', error.message);
      }
    }

    // 4. Seed Clients
    const clientMap: Record<string, string> = {};
    for (const c of INITIAL_CLIENTS) {
      const payload: any = {
        name: c.name,
        whatsapp: c.whatsapp || c.phone,
        notes: c.notes,
      };
      if (c.id && isValidUUID(c.id)) payload.id = c.id;

      const { data, error } = await supabase.from('clients').insert(payload).select().single();
      if (!error && data) {
        counts.clients++;
        clientMap[c.id] = String(data.id);
      } else if (error) {
        console.warn('Seed clients error:', error.message);
      }
    }

    // 5. Seed Appointments if foreign keys exist
    const { data: dbBarbers } = await supabase.from('barbers').select('id').limit(10);
    const { data: dbClients } = await supabase.from('clients').select('id').limit(10);
    const { data: dbServices } = await supabase.from('services').select('id, price, duration_minutes').limit(10);

    if (dbBarbers?.length && dbClients?.length && dbServices?.length) {
      for (const [idx, a] of INITIAL_APPOINTMENTS.entries()) {
        const bId = barberMap[a.barberId] || dbBarbers[idx % dbBarbers.length].id;
        const cId = clientMap[a.clientId] || dbClients[idx % dbClients.length].id;
        const srv = dbServices[idx % dbServices.length];

        const payload: any = {
          barber_id: bId,
          client_id: cId,
          service_id: srv.id,
          appointment_date: a.date,
          appointment_time: a.time,
          duration_minutes: a.durationMinutes || srv.duration_minutes || 30,
          service_price: a.servicePrice || srv.price || 50,
          status: a.status,
          payment_status: a.paymentMethod === 'pendente' ? 'pendente' : 'pago',
          notes: a.notes || '',
        };

        const { data, error } = await supabase.from('appointments').insert(payload).select().single();
        if (!error && data) {
          counts.appointments++;
        }
      }
    }

    const totalInserted =
      counts.users + counts.barbers + counts.clients + counts.services + counts.appointments;

    if (totalInserted === 0) {
      return {
        success: false,
        message: 'Nenhum dado pôde ser inserido no Supabase. Verifique as permissões de RLS.',
        counts,
        error: 'Verifique se as políticas de RLS estão habilitadas para a role "anon" no Supabase.',
      };
    }

    return {
      success: true,
      message: `Dados semeados com sucesso no Supabase! (${totalInserted} registros criados).`,
      counts,
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Falha durante o processo de seed no Supabase.',
      counts,
      error: err.message,
    };
  }
}
