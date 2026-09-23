import { User, Client, Barber, Service, Appointment, BarbershopSettings } from '../types';

export const INITIAL_SETTINGS: BarbershopSettings = {
  name: 'Studio AUDAX Club',
  slogan: 'Tradição, Estilo & Atendimento de Elite',
  phone: '(81) 98144-6557',
  address: 'Av. Principal, 1000 - Centro',
  openingTime: '09:00',
  closingTime: '20:00',
  appointmentIntervalMinutes: 30,
  allowClientCancelHoursLimit: 2,
};

export const INITIAL_USERS: User[] = [
  {
    id: 'user-leandro',
    name: 'Leandro José (Dono)',
    email: 'leandroljs2026@gmail.com',
    phone: '(81) 98144-6557',
    password: '123',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    roles: ['dono', 'barbeiro'],
    barberId: 'barber-leandro',
    createdAt: '2025-01-01',
  },
];

export const INITIAL_SERVICES: Service[] = [
  {
    id: 'srv-1',
    name: 'Corte Moderno Fade / Degradê',
    description: 'Corte navalhado ou disfarçado com tesoura no topo e acabamento na lâmina.',
    price: 45.0,
    durationMinutes: 30,
    category: 'cabelo',
    isActive: true,
  },
  {
    id: 'srv-2',
    name: 'Barboterapia & Toalha Quente',
    description: 'Modelagem da barba com esfoliação, toalha aromatizada quente e óleo premium.',
    price: 35.0,
    durationMinutes: 30,
    category: 'barba',
    isActive: true,
  },
  {
    id: 'srv-3',
    name: 'Combo Master (Corte + Barba)',
    description: 'Experiência completa com corte e barba com tratamento especial.',
    price: 70.0,
    durationMinutes: 60,
    category: 'combo',
    isActive: true,
  },
  {
    id: 'srv-4',
    name: 'Acabamento & Pezinho',
    description: 'Alinhamento rápido do contorno com navalha e penteado.',
    price: 20.0,
    durationMinutes: 15,
    category: 'cabelo',
    isActive: true,
  },
];

export const INITIAL_BARBERS: Barber[] = [
  {
    id: 'barber-leandro',
    userId: 'user-leandro',
    name: 'Leandro José (Dono)',
    phone: '(81) 98144-6557',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    specialties: ['Fade Navalhado', 'Barboterapia com Toalha Quente', 'Design Completo'],
    isActive: true,
    commissionPercentage: 100,
    workingHours: 'Segunda a Sábado, 09h às 20h',
    rating: 5.0,
    totalCuts: 0,
  },
];

export const INITIAL_CLIENTS: Client[] = [];

export const INITIAL_APPOINTMENTS: Appointment[] = [];
