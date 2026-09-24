import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Client,
  Barber,
  Service,
  Appointment,
  BarbershopSettings,
  AppointmentStatus,
  UserRole,
  ServiceCategoryItem,
  RoleVisibilitySettings,
  FeatureRoleVisibility,
} from '../types';
import {
  INITIAL_CLIENTS,
  INITIAL_BARBERS,
  INITIAL_SERVICES,
  INITIAL_APPOINTMENTS,
  INITIAL_SETTINGS,
} from '../data/mockData';
import { useAuth } from './AuthContext';
import {
  fetchServicesFromSupabase,
  insertServiceToSupabase,
  updateServiceInSupabase,
  deleteServiceFromSupabase,
  fetchClientsFromSupabase,
  insertClientToSupabase,
  updateClientInSupabase,
  deleteClientFromSupabase,
  fetchBarbersFromSupabase,
  insertBarberToSupabase,
  updateBarberInSupabase,
  deleteBarberFromSupabase,
  fetchAppointmentsFromSupabase,
  insertAppointmentToSupabase,
  updateAppointmentInSupabase,
  deleteAppointmentFromSupabase,
  fetchServiceCategoriesFromSupabase,
  insertServiceCategoryToSupabase,
  updateServiceCategoryInSupabase,
  deleteServiceCategoryFromSupabase,
  insertUserToSupabase,
  updateUserInSupabase,
  deleteUserFromSupabase,
  generateUUID,
  checkSupabaseHealth,
  isValidUUID,
} from '../lib/supabase';

function deduplicateClients(clientList: Client[]): Client[] {
  const map = new Map<string, Client>();
  for (const c of clientList) {
    const rawPhone = (c.whatsapp || c.phone || '').replace(/\D/g, '');
    const cleanEmail = c.email ? c.email.trim().toLowerCase() : '';
    const cleanName = c.name ? c.name.trim().toLowerCase() : '';
    const key =
      (c.userId && c.userId.length > 5 ? `uid-${c.userId}` : null) ||
      (cleanEmail && !cleanEmail.endsWith('@cliente.audax.com') ? `email-${cleanEmail}` : null) ||
      (rawPhone && rawPhone.length >= 8 ? `phone-${rawPhone}` : null) ||
      (cleanName ? `name-${cleanName}` : null) ||
      `id-${c.id}`;

    if (map.has(key)) {
      const existing = map.get(key)!;
      map.set(key, {
        ...existing,
        ...c,
        id: isValidUUID(existing.id) ? existing.id : c.id,
        userId: existing.userId || c.userId,
        email: existing.email || c.email,
        phone: existing.phone || c.phone,
        whatsapp: existing.whatsapp || c.whatsapp,
        birthDate: existing.birthDate || c.birthDate,
        notes: existing.notes || c.notes,
        totalAppointments: Math.max(existing.totalAppointments || 0, c.totalAppointments || 0),
      });
    } else {
      map.set(key, c);
    }
  }
  return Array.from(map.values());
}
import { seedSupabaseDatabase, SeedResult } from '../lib/supabaseSeed';
import { validateAppointmentDateTime } from '../lib/dateUtils';

export interface SupabaseSyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  hasRLSError: boolean;
  message: string;
}

interface BarberDataContextType {
  clients: Client[];
  barbers: Barber[];
  services: Service[];
  appointments: Appointment[];
  settings: BarbershopSettings;
  // Visibility & Access Control Settings
  visibilitySettings: RoleVisibilitySettings;
  updateVisibility: (feature: keyof RoleVisibilitySettings, role: UserRole, isVisible: boolean) => void;
  resetVisibilitySettings: () => void;
  isFeatureVisibleForRole: (feature: keyof RoleVisibilitySettings, role: UserRole) => boolean;
  // Supabase State & Actions
  supabaseStatus: SupabaseSyncStatus;
  syncWithSupabase: () => Promise<void>;
  seedSupabase: () => Promise<SeedResult>;
  // Client actions
  addClient: (clientData: Omit<Client, 'id' | 'totalAppointments' | 'createdAt'>) => Client;
  updateClient: (id: string, clientData: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClientById: (id: string) => Client | undefined;
  // Barber actions
  addBarber: (barberData: Omit<Barber, 'id' | 'rating' | 'totalCuts'>) => Barber;
  updateBarber: (id: string, barberData: Partial<Barber>) => void;
  deleteBarber: (id: string) => void;
  toggleBarberActive: (id: string) => void;
  getBarberById: (id: string) => Barber | undefined;
  // Service actions
  addService: (serviceData: Omit<Service, 'id'>) => Service;
  updateService: (id: string, serviceData: Partial<Service>) => void;
  deleteService: (id: string) => void;
  toggleServiceActive: (id: string) => void;
  getServiceById: (id: string) => Service | undefined;
  categories: ServiceCategoryItem[];
  addCategory: (categoryData: Omit<ServiceCategoryItem, 'id'>) => ServiceCategoryItem;
  updateCategory: (id: string, categoryData: Partial<ServiceCategoryItem>) => void;
  deleteCategory: (id: string) => void;
  // Appointment actions
  addAppointment: (data: {
    clientId: string;
    clientName: string;
    clientPhone: string;
    barberId: string;
    serviceId: string;
    date: string;
    time: string;
    notes?: string;
  }) => Appointment;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  rescheduleAppointment: (id: string, date: string, time: string) => void;
  cancelAppointment: (id: string, reason?: string) => void;
  deleteAppointment: (id: string) => void;
  // Filtering & Stats
  getVisibleAppointments: () => Appointment[];
  getAppointmentsForDate: (date: string) => Appointment[];
  stats: {
    totalClients: number;
    activeBarbers: number;
    todayAppointments: number;
    todayConfirmedOrDone: number;
    realizedRevenue: number;
    projectedRevenue: number;
    pendingAppointmentsCount: number;
  };
  resetAllData: () => void;
}

const BarberDataContext = createContext<BarberDataContextType | undefined>(undefined);

const CLIENTS_STORAGE_KEY = 'barberpro_clients_v1';
const BARBERS_STORAGE_KEY = 'barberpro_barbers_v1';
const SERVICES_STORAGE_KEY = 'barberpro_services_v1';
const CATEGORIES_STORAGE_KEY = 'barberpro_categories_v1';
const APPOINTMENTS_STORAGE_KEY = 'barberpro_appointments_v1';
const SETTINGS_STORAGE_KEY = 'barberpro_settings_v1';
const VISIBILITY_STORAGE_KEY = 'audax_role_visibility_v2';

export const DEFAULT_VISIBILITY_SETTINGS: RoleVisibilitySettings = {
  aiBooking: {
    dono: true,
    barbeiro: true,
    cliente: true,
  },
  supabaseStatus: {
    dono: true,
    barbeiro: false,
    cliente: false,
  },
  testProfiles: {
    dono: true,
    barbeiro: false,
    cliente: false,
  },
  architectureDocs: {
    dono: true,
    barbeiro: false,
    cliente: false,
  },
  clientList: {
    dono: true,
    barbeiro: true,
    cliente: false,
  },
  servicesCatalog: {
    dono: true,
    barbeiro: false,
    cliente: true,
  },
};

const INITIAL_CATEGORIES: ServiceCategoryItem[] = [
  { id: 'cat-1', name: 'Cabelo', slug: 'cabelo', description: 'Cortes e penteados de cabelo', isActive: true },
  { id: 'cat-2', name: 'Barba', slug: 'barba', description: 'Barba, toalha quente e acabamento', isActive: true },
  { id: 'cat-3', name: 'Corte + Barba', slug: 'corte_barba', description: 'Pacote completo de cabelo e barba', isActive: true },
  { id: 'cat-4', name: 'Combo', slug: 'combo', description: 'Combos especiais de serviços', isActive: true },
  { id: 'cat-5', name: 'Tratamento & Spa', slug: 'tratamento', description: 'Hidratação, pigmentação e tratamentos', isActive: true },
];

export const BarberDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, activeRole } = useAuth();

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: Client[] = JSON.parse(saved);
        const filtered = parsed.filter((c) => !c.id.startsWith('client-'));
        return deduplicateClients(filtered);
      } catch (e) {
        console.error('Error loading clients', e);
      }
    }
    return INITIAL_CLIENTS;
  });

  const [barbers, setBarbers] = useState<Barber[]>(() => {
    const saved = localStorage.getItem(BARBERS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: Barber[] = JSON.parse(saved);
        const filtered = parsed.filter(
          (b) => b.id === 'barber-leandro' || !['barber-2', 'barber-3', 'barber-4'].includes(b.id)
        );
        return filtered.length > 0 ? filtered : INITIAL_BARBERS;
      } catch (e) {
        console.error('Error loading barbers', e);
      }
    }
    return INITIAL_BARBERS;
  });

  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem(SERVICES_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading services', e);
      }
    }
    return INITIAL_SERVICES;
  });

  const [categories, setCategories] = useState<ServiceCategoryItem[]>(() => {
    const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading categories', e);
      }
    }
    return INITIAL_CATEGORIES;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: Appointment[] = JSON.parse(saved);
        const filtered = parsed.filter((a) => !a.id.startsWith('apt-'));
        return filtered;
      } catch (e) {
        console.error('Error loading appointments', e);
      }
    }
    return INITIAL_APPOINTMENTS;
  });

  const [settings, setSettings] = useState<BarbershopSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading settings', e);
      }
    }
    return INITIAL_SETTINGS;
  });

  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseSyncStatus>({
    isConnected: true,
    isSyncing: false,
    lastSync: null,
    hasRLSError: false,
    message: 'Supabase conectado',
  });

  // Role Feature Visibility Settings (Controlled by Owner)
  const [visibilitySettings, setVisibilitySettings] = useState<RoleVisibilitySettings>(() => {
    try {
      const saved = localStorage.getItem(VISIBILITY_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_VISIBILITY_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error loading visibility settings', e);
    }
    return DEFAULT_VISIBILITY_SETTINGS;
  });

  const updateVisibility = useCallback(
    (feature: keyof RoleVisibilitySettings, role: UserRole, isVisible: boolean) => {
      setVisibilitySettings((prev) => {
        const updated: RoleVisibilitySettings = {
          ...prev,
          [feature]: {
            ...prev[feature],
            [role]: isVisible,
          },
        };
        localStorage.setItem(VISIBILITY_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const resetVisibilitySettings = useCallback(() => {
    setVisibilitySettings(DEFAULT_VISIBILITY_SETTINGS);
    localStorage.setItem(VISIBILITY_STORAGE_KEY, JSON.stringify(DEFAULT_VISIBILITY_SETTINGS));
  }, []);

  const isFeatureVisibleForRole = useCallback(
    (feature: keyof RoleVisibilitySettings, role: UserRole): boolean => {
      if (!visibilitySettings[feature]) return true;
      return !!visibilitySettings[feature][role];
    },
    [visibilitySettings]
  );

  // Local storage persistence
  useEffect(() => {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(BARBERS_STORAGE_KEY, JSON.stringify(barbers));
  }, [barbers]);

  useEffect(() => {
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Synchronize state with Supabase
  const syncWithSupabase = useCallback(async () => {
    setSupabaseStatus((prev) => ({ ...prev, isSyncing: true }));
    try {
      const health = await checkSupabaseHealth();
      if (!health.connected) {
        setSupabaseStatus({
          isConnected: false,
          isSyncing: false,
          lastSync: null,
          hasRLSError: health.hasRLSIssue,
          message: health.message,
        });
        return;
      }

      // Fetch all collections from Supabase
      const [remoteServices, remoteClients, remoteBarbers, remoteCategories] = await Promise.all([
        fetchServicesFromSupabase(),
        fetchClientsFromSupabase(),
        fetchBarbersFromSupabase(),
        fetchServiceCategoriesFromSupabase(),
      ]);

      let hasData = false;

      if (remoteServices && remoteServices.length > 0) {
        setServices(remoteServices);
        hasData = true;
      }
      if (remoteCategories && remoteCategories.length > 0) {
        setCategories(remoteCategories);
        hasData = true;
      }
      if (remoteClients !== null) {
        setClients(deduplicateClients(remoteClients));
        if (remoteClients.length > 0) hasData = true;
      }
      if (remoteBarbers && remoteBarbers.length > 0) {
        setBarbers(remoteBarbers);
        hasData = true;
      }

      // Fetch appointments with the available clients, barbers and services
      const effectiveClients = remoteClients !== null ? remoteClients : clients;
      const effectiveBarbers = remoteBarbers && remoteBarbers.length > 0 ? remoteBarbers : barbers;
      const effectiveServices = remoteServices && remoteServices.length > 0 ? remoteServices : services;

      const remoteAppointments = await fetchAppointmentsFromSupabase(
        effectiveClients,
        effectiveBarbers,
        effectiveServices
      );

      if (remoteAppointments !== null) {
        setAppointments(remoteAppointments);
        if (remoteAppointments.length > 0) hasData = true;
      }

      setSupabaseStatus({
        isConnected: true,
        isSyncing: false,
        lastSync: new Date(),
        hasRLSError: false,
        message: hasData
          ? 'Dados sincronizados em tempo real com o Supabase'
          : 'Conectado ao Supabase (Tabelas prontas para receber dados)',
      });
    } catch (err: any) {
      console.warn('Sync with Supabase failed:', err);
      setSupabaseStatus((prev) => ({
        ...prev,
        isSyncing: false,
        message: 'Erro na sincronização com o Supabase.',
      }));
    }
  }, []); // Stabilized: only runs on mount or explicit triggers, avoiding race conditions!

  // Initial Sync on Mount
  useEffect(() => {
    syncWithSupabase();
  }, []);

  // Listen for real-time client registrations from AuthContext
  useEffect(() => {
    const handleClientCreated = (e: any) => {
      if (e.detail) {
        const newClient: Client = e.detail;
        setClients((prev) => deduplicateClients([newClient, ...prev]));
      }
    };

    window.addEventListener('client-created', handleClientCreated);
    return () => {
      window.removeEventListener('client-created', handleClientCreated);
    };
  }, []);

  // Seed Supabase with initial data
  const seedSupabase = async (): Promise<SeedResult> => {
    setSupabaseStatus((prev) => ({ ...prev, isSyncing: true }));
    const result = await seedSupabaseDatabase();
    if (result.success) {
      await syncWithSupabase();
      setSupabaseStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date(),
        hasRLSError: false,
        message: 'Banco Supabase semeado com sucesso!',
      }));
    } else {
      setSupabaseStatus((prev) => ({
        ...prev,
        isSyncing: false,
        hasRLSError: Boolean(result.error?.includes('row-level security') || result.error?.includes('policy')),
        message: result.message,
      }));
    }
    return result;
  };

  // -------------------------------------------------------------
  // CLIENT OPERATIONS (Optimistic UI + Supabase Persistence in users & clients)
  // -------------------------------------------------------------
  const addClient = (clientData: Omit<Client, 'id' | 'totalAppointments' | 'createdAt'>): Client => {
    const cleanEmail = clientData.email ? clientData.email.trim().toLowerCase() : '';
    const cleanPhone = (clientData.phone || clientData.whatsapp || '').replace(/\D/g, '');

    // Check if client already exists locally
    const existing = clients.find(
      (c) =>
        (cleanEmail && !cleanEmail.endsWith('@cliente.audax.com') && c.email && c.email.toLowerCase() === cleanEmail) ||
        (cleanPhone && cleanPhone.length >= 8 && ((c.phone && c.phone.replace(/\D/g, '') === cleanPhone) || (c.whatsapp && c.whatsapp.replace(/\D/g, '') === cleanPhone)))
    );

    if (existing) {
      updateClient(existing.id, clientData);
      return { ...existing, ...clientData };
    }

    const validClientId = generateUUID();
    const validUserId = generateUUID();
    const clientEmail = clientData.email || `${clientData.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '')}@cliente.audax.com`;
    const clientPhone = clientData.phone || clientData.whatsapp || '';

    const newClient: Client = {
      ...clientData,
      id: validClientId,
      userId: validUserId,
      email: clientEmail,
      phone: clientPhone,
      whatsapp: clientPhone,
      totalAppointments: 0,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(clientData.name)}&backgroundColor=d4af37,27272a`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    // Optimistic state update with deduplication
    setClients((prev) => deduplicateClients([newClient, ...prev]));

    // 1. Create user in Supabase first, then client
    insertUserToSupabase({
      id: validUserId,
      name: clientData.name,
      email: clientEmail,
      phone: clientPhone,
      avatar: newClient.avatar,
      roles: ['cliente'],
      createdAt: newClient.createdAt,
    }).then((userRes) => {
      const actualUserId = userRes?.id || validUserId;
      const clientPayload = {
        ...newClient,
        id: validClientId,
        userId: actualUserId,
      };
      insertClientToSupabase(clientPayload).then((persisted) => {
        if (persisted) {
          setClients((prev) => deduplicateClients(prev.map((c) => (c.id === validClientId ? { ...persisted, userId: actualUserId } : c))));
        } else {
          setSupabaseStatus((prev) => ({
            ...prev,
            hasRLSError: true,
            message: 'Cliente salvo localmente. Habilite permissões RLS no Supabase.',
          }));
        }
      });
    });

    return newClient;
  };

  const updateClient = (id: string, clientData: Partial<Client>) => {
    setClients((prev) => prev.map((c) => {
      if (c.id === id) {
        const updated = { ...c, ...clientData };
        if (c.userId) {
          updateUserInSupabase(c.userId, {
            name: updated.name,
            phone: updated.phone || updated.whatsapp,
            email: updated.email,
          });
        }
        return updated;
      }
      return c;
    }));

    updateClientInSupabase(id, clientData).then((ok) => {
      if (!ok) {
        setSupabaseStatus((prev) => ({
          ...prev,
          hasRLSError: true,
        }));
      }
    });
  };

  const deleteClient = (id: string) => {
    const targetClient = clients.find((c) => c.id === id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    setAppointments((prev) => prev.filter((a) => a.clientId !== id));

    deleteClientFromSupabase(id);
    if (targetClient?.userId) {
      deleteUserFromSupabase(targetClient.userId);
    }
  };

  const getClientById = (id: string) => clients.find((c) => c.id === id);

  // -------------------------------------------------------------
  // BARBER OPERATIONS (Optimistic UI + Supabase Persistence)
  // -------------------------------------------------------------
  const addBarber = (barberData: Omit<Barber, 'id' | 'rating' | 'totalCuts'>): Barber => {
    const tempId = `barber-${Date.now()}`;
    const newBarber: Barber = {
      ...barberData,
      id: tempId,
      rating: 5.0,
      totalCuts: 0,
    };

    setBarbers((prev) => [...prev, newBarber]);

    insertBarberToSupabase(newBarber).then((persisted) => {
      if (persisted) {
        setBarbers((prev) => prev.map((b) => (b.id === tempId ? persisted : b)));
      } else {
        setSupabaseStatus((prev) => ({
          ...prev,
          hasRLSError: true,
          message: 'Barbeiro salvo localmente. Verifique permissões RLS no Supabase.',
        }));
      }
    });

    return newBarber;
  };

  const updateBarber = (id: string, barberData: Partial<Barber>) => {
    setBarbers((prev) => prev.map((b) => (b.id === id ? { ...b, ...barberData } : b)));
    updateBarberInSupabase(id, barberData).then((ok) => {
      if (!ok) {
        setSupabaseStatus((prev) => ({ ...prev, hasRLSError: true }));
      }
    });
  };

  const deleteBarber = (id: string) => {
    setBarbers((prev) => prev.filter((b) => b.id !== id));
    deleteBarberFromSupabase(id);
  };

  const toggleBarberActive = (id: string) => {
    const barber = barbers.find((b) => b.id === id);
    if (!barber) return;
    const newActive = !barber.isActive;
    updateBarber(id, { isActive: newActive });
  };

  const getBarberById = (id: string) => barbers.find((b) => b.id === id);

  // -------------------------------------------------------------
  // SERVICE OPERATIONS (Optimistic UI + Supabase Persistence)
  // -------------------------------------------------------------
  const addService = (serviceData: Omit<Service, 'id'>): Service => {
    const tempId = `srv-${Date.now()}`;
    
    // Tenta resolver categoryId a partir da categoria informada
    let resolvedCatId = serviceData.categoryId;
    if (!resolvedCatId && serviceData.category) {
      const foundCat = categories.find(
        (c) => c.id === serviceData.category || c.slug === serviceData.category || c.name.toLowerCase() === serviceData.category.toLowerCase()
      );
      if (foundCat) {
        resolvedCatId = foundCat.id;
      }
    }

    const newService: Service = {
      ...serviceData,
      categoryId: resolvedCatId,
      id: tempId,
      isActive: serviceData.isActive !== false,
      iconName: serviceData.iconName || 'Scissors',
    };

    setServices((prev) => [...prev, newService]);

    insertServiceToSupabase(newService).then((persisted) => {
      if (persisted) {
        setServices((prev) => prev.map((s) => (s.id === tempId ? persisted : s)));
      } else {
        setSupabaseStatus((prev) => ({
          ...prev,
          hasRLSError: true,
          message: 'Serviço salvo localmente. Verifique as políticas de RLS no Supabase.',
        }));
      }
    });

    return newService;
  };

  const updateService = (id: string, serviceData: Partial<Service>) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...serviceData } : s)));
    updateServiceInSupabase(id, serviceData).then((ok) => {
      if (!ok) {
        setSupabaseStatus((prev) => ({ ...prev, hasRLSError: true }));
      }
    });
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    deleteServiceFromSupabase(id);
  };

  const toggleServiceActive = (id: string) => {
    const target = services.find((s) => s.id === id);
    if (!target) return;
    const newStatus = !target.isActive;
    updateService(id, { isActive: newStatus });
  };

  const getServiceById = (id: string) => services.find((s) => s.id === id);

  const addCategory = (categoryData: Omit<ServiceCategoryItem, 'id'>): ServiceCategoryItem => {
    const tempId = `cat-${Date.now()}`;
    const slug = categoryData.slug || categoryData.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const newCategory: ServiceCategoryItem = {
      ...categoryData,
      id: tempId,
      slug,
      isActive: categoryData.isActive !== false,
    };

    setCategories((prev) => [...prev, newCategory]);

    insertServiceCategoryToSupabase(newCategory).then((persisted) => {
      if (persisted) {
        setCategories((prev) => prev.map((c) => (c.id === tempId ? persisted : c)));
      }
    });

    return newCategory;
  };

  const updateCategory = (id: string, categoryData: Partial<ServiceCategoryItem>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...categoryData } : c)));
    updateServiceCategoryInSupabase(id, categoryData);
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    deleteServiceCategoryFromSupabase(id);
  };

  // -------------------------------------------------------------
  // APPOINTMENT OPERATIONS (Optimistic UI + Supabase Persistence)
  // -------------------------------------------------------------
  const addAppointment = (data: {
    clientId: string;
    clientName: string;
    clientPhone: string;
    barberId: string;
    serviceId: string;
    date: string;
    time: string;
    notes?: string;
  }): Appointment => {
    // Validação rígida de data e horário contra horários passados
    const validation = validateAppointmentDateTime(data.date, data.time);
    if (!validation.valid) {
      throw new Error(validation.message || 'Este horário não está mais disponível. Por favor, selecione outro horário.');
    }

    const service = services.find((s) => s.id === data.serviceId);
    if (!service || service.isActive === false) {
      throw new Error('Não é possível realizar agendamento com um serviço desativado.');
    }
    const barber = barbers.find((b) => b.id === data.barberId);
    if (!barber || barber.isActive === false) {
      throw new Error('Este profissional está inativo ou indisponível no momento e não pode receber agendamentos.');
    }

    const tempId = `apt-${Date.now()}`;
    const newAppointment: Appointment = {
      id: tempId,
      clientId: data.clientId,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      barberId: data.barberId,
      barberName: barber?.name || 'Leandro José (Dono)',
      serviceId: data.serviceId,
      serviceName: service?.name || 'Corte Moderno Fade / Degradê',
      servicePrice: Number(service?.price || 50.0),
      durationMinutes: Number(service?.durationMinutes || 30),
      date: data.date,
      time: data.time,
      notes: data.notes || '',
      status: 'agendado',
      paymentMethod: 'pendente',
      createdAt: new Date().toISOString(),
    };

    setAppointments((prev) => [newAppointment, ...prev]);

    // Update client total appointments locally
    setClients((prev) =>
      prev.map((c) =>
        c.id === data.clientId
          ? {
              ...c,
              totalAppointments: (c.totalAppointments || 0) + 1,
              lastVisit: data.date,
            }
          : c
      )
    );

    // Asynchronously insert to Supabase
    insertAppointmentToSupabase(newAppointment).then((persisted) => {
      if (persisted) {
        setAppointments((prev) => prev.map((a) => (a.id === tempId ? persisted : a)));
        setSupabaseStatus((prev) => ({
          ...prev,
          isConnected: true,
          hasRLSError: false,
          lastSync: new Date(),
          message: 'Agendamento sincronizado com sucesso no Supabase!',
        }));
      } else {
        setSupabaseStatus((prev) => ({
          ...prev,
          hasRLSError: true,
          message: 'Agendamento salvo localmente. Verifique as permissões de RLS no Supabase.',
        }));
      }
    });

    return newAppointment;
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    updateAppointmentInSupabase(id, { status });
  };

  const rescheduleAppointment = (id: string, date: string, time: string) => {
    // Validação rígida de data e horário contra horários passados
    const validation = validateAppointmentDateTime(date, time);
    if (!validation.valid) {
      throw new Error(validation.message || 'Este horário não está mais disponível. Por favor, selecione outro horário.');
    }

    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, date, time } : a)));
    updateAppointmentInSupabase(id, { date, time });
  };

  const cancelAppointment = (id: string, reason?: string) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'cancelado',
              notes: reason ? `${a.notes || ''} [Cancelado: ${reason}]` : a.notes,
            }
          : a
      )
    );
    updateAppointmentInSupabase(id, {
      status: 'cancelado',
      notes: reason ? `[Cancelado: ${reason}]` : undefined,
    });
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    deleteAppointmentFromSupabase(id);
  };

  // -------------------------------------------------------------
  // FILTERING & STATS (Calculated dynamically)
  // -------------------------------------------------------------
  const getVisibleAppointments = (): Appointment[] => {
    if (!currentUser) return [];

    if (activeRole === 'dono') {
      return appointments;
    }

    if (activeRole === 'barbeiro') {
      const barber = barbers.find((b) => b.userId === currentUser.id || b.name === currentUser.name);
      if (barber) {
        return appointments.filter((a) => a.barberId === barber.id);
      }
      return appointments;
    }

    if (activeRole === 'cliente') {
      const client = clients.find(
        (c) =>
          (c.email && c.email.toLowerCase() === currentUser.email?.toLowerCase()) ||
          (c.whatsapp && c.whatsapp.replace(/\D/g, '') === currentUser.phone?.replace(/\D/g, ''))
      );
      const matchedClientId = client?.id;

      return appointments.filter((a) => {
        if (a.clientId === currentUser.id) return true;
        if (matchedClientId && a.clientId === matchedClientId) return true;
        if (
          currentUser.phone &&
          a.clientPhone &&
          a.clientPhone.replace(/\D/g, '') === currentUser.phone.replace(/\D/g, '')
        )
          return true;
        if (
          currentUser.name &&
          a.clientName &&
          a.clientName.toLowerCase() === currentUser.name.toLowerCase()
        )
          return true;
        return false;
      });
    }

    return appointments;
  };

  const getAppointmentsForDate = (date: string): Appointment[] => {
    return appointments.filter((a) => a.date === date);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointmentsList = appointments.filter((a) => a.date === todayStr);

  const stats = {
    totalClients: clients.length,
    activeBarbers: barbers.filter((b) => b.isActive).length,
    todayAppointments: todayAppointmentsList.length,
    todayConfirmedOrDone: todayAppointmentsList.filter(
      (a) => a.status === 'confirmado' || a.status === 'finalizado' || a.status === 'em_atendimento'
    ).length,
    realizedRevenue: appointments
      .filter((a) => a.status === 'finalizado')
      .reduce((acc, curr) => acc + (curr.servicePrice || 0), 0),
    projectedRevenue: appointments
      .filter((a) => a.status !== 'cancelado')
      .reduce((acc, curr) => acc + (curr.servicePrice || 0), 0),
    pendingAppointmentsCount: appointments.filter((a) => a.status === 'agendado').length,
  };

  const resetAllData = () => {
    setClients(INITIAL_CLIENTS);
    setBarbers(INITIAL_BARBERS);
    setServices(INITIAL_SERVICES);
    setAppointments(INITIAL_APPOINTMENTS);
    setSettings(INITIAL_SETTINGS);
    localStorage.removeItem(CLIENTS_STORAGE_KEY);
    localStorage.removeItem(BARBERS_STORAGE_KEY);
    localStorage.removeItem(SERVICES_STORAGE_KEY);
    localStorage.removeItem(APPOINTMENTS_STORAGE_KEY);
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  };

  return (
    <BarberDataContext.Provider
      value={{
        clients,
        barbers,
        services,
        categories,
        appointments,
        settings,
        supabaseStatus,
        syncWithSupabase,
        seedSupabase,
        addClient,
        updateClient,
        deleteClient,
        getClientById,
        addBarber,
        updateBarber,
        deleteBarber,
        toggleBarberActive,
        getBarberById,
        addService,
        updateService,
        deleteService,
        toggleServiceActive,
        getServiceById,
        addCategory,
        updateCategory,
        deleteCategory,
        addAppointment,
        updateAppointmentStatus,
        rescheduleAppointment,
        cancelAppointment,
        deleteAppointment,
        getVisibleAppointments,
        getAppointmentsForDate,
        stats,
        visibilitySettings,
        updateVisibility,
        resetVisibilitySettings,
        isFeatureVisibleForRole,
        resetAllData,
      }}
    >
      {children}
    </BarberDataContext.Provider>
  );
};

export const useBarberData = () => {
  const context = useContext(BarberDataContext);
  if (!context) {
    throw new Error('useBarberData must be used within a BarberDataProvider');
  }
  return context;
};
