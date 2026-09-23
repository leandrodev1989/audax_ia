export type UserRole = 'dono' | 'barbeiro' | 'cliente';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  avatar?: string;
  roles: UserRole[];
  barberId?: string;
  clientId?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  birthDate: string;
  notes: string;
  avatar?: string;
  totalAppointments: number;
  lastVisit?: string;
  createdAt: string;
}

export interface Barber {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  photo: string;
  specialties: string[];
  isActive: boolean;
  commissionPercentage: number;
  workingHours: string;
  rating: number;
  totalCuts: number;
}

export type ServiceCategory = string;

export interface ServiceCategoryItem {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  isActive: boolean;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  category: ServiceCategory;
  categoryId?: string;
  isActive?: boolean;
  iconName?: string;
}

export type AppointmentStatus =
  | 'agendado'
  | 'confirmado'
  | 'em_atendimento'
  | 'finalizado'
  | 'cancelado';

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMinutes: number;
  notes?: string;
  status: AppointmentStatus;
  paymentMethod?: 'pix' | 'cartao_credito' | 'dinheiro' | 'pendente';
  createdAt: string;
}

export interface BarbershopSettings {
  name: string;
  slogan: string;
  phone: string;
  address: string;
  openingTime: string;
  closingTime: string;
  appointmentIntervalMinutes: number;
  allowClientCancelHoursLimit: number;
}
