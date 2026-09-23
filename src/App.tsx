/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BarberDataProvider, useBarberData } from './context/BarberDataContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ClientDashboard } from './components/dashboards/ClientDashboard';
import { BarberDashboard } from './components/dashboards/BarberDashboard';
import { OwnerDashboard } from './components/dashboards/OwnerDashboard';
import { AppointmentList } from './components/appointments/AppointmentList';
import { NewAppointmentModal } from './components/appointments/NewAppointmentModal';
import { ClientList } from './components/clients/ClientList';
import { BarberList } from './components/barbers/BarberList';
import { ServiceList } from './components/services/ServiceList';
import { ArchitectureView } from './components/architecture/ArchitectureView';
import { AiBookingTestView } from './components/ai/AiBookingTestView';
import { AuthModal } from './components/auth/AuthModal';
import { UserProfileModal } from './components/profile/UserProfileModal';
import { LoginPage } from './components/auth/LoginPage';

function MainApp() {
  const { activeRole, currentUser } = useAuth();

  // Navigation tab: 'dashboard' | 'agendamentos' | 'servicos' | 'clientes' | 'barbeiros' | 'arquitetura'
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals state
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [bookingParams, setBookingParams] = useState<{
    serviceId?: string;
    date?: string;
    time?: string;
    barberId?: string;
  }>({});
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // O fluxo SEMPRE abre a tela de login se não houver usuário autenticado
  if (!currentUser) {
    return <LoginPage />;
  }

  const handleOpenBooking = (
    serviceId?: string,
    date?: string,
    time?: string,
    barberId?: string
  ) => {
    setBookingParams({ serviceId, date, time, barberId });
    setIsNewAppointmentOpen(true);
  };

  // Render appropriate dashboard depending on active role view
  const renderDashboard = () => {
    switch (activeRole) {
      case 'dono':
        return (
          <OwnerDashboard
            onOpenNewAppointment={() => setIsNewAppointmentOpen(true)}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        );
      case 'barbeiro':
        return (
          <BarberDashboard
            onOpenNewAppointment={() => setIsNewAppointmentOpen(true)}
            onViewAppointments={() => setActiveTab('agendamentos')}
          />
        );
      case 'cliente':
      default:
        return (
          <ClientDashboard
            onOpenNewAppointment={() => setIsNewAppointmentOpen(true)}
            onViewAppointments={() => setActiveTab('agendamentos')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f2eb] text-stone-900 flex flex-col font-sans selection:bg-amber-800 selection:text-white">
      {/* Top Navbar with Multi-role switcher, demo selector, and profile */}
      <Navbar
        onOpenNewAppointment={() => handleOpenBooking()}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenNewAppointment={() => handleOpenBooking()}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
        />

        {/* Center Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'agendamentos' && (
            <AppointmentList
              onOpenNewAppointment={(serviceId, date, time, barberId) =>
                handleOpenBooking(serviceId, date, time, barberId)
              }
            />
          )}
          {activeTab === 'servicos' && (
            <ServiceList onScheduleService={(srvId) => handleOpenBooking(srvId)} />
          )}
          {activeTab === 'clientes' && (activeRole === 'dono' || activeRole === 'barbeiro') && <ClientList />}
          {activeTab === 'barbeiros' && <BarberList />}
          {activeTab === 'arquitetura' && activeRole === 'dono' && <ArchitectureView />}
          {activeTab === 'ai-booking' && <AiBookingTestView />}
          {/* Fallback para abas não autorizadas */}
          {((activeTab === 'arquitetura' && activeRole !== 'dono') ||
            (activeTab === 'clientes' && activeRole === 'cliente')) &&
            renderDashboard()}
        </main>
      </div>

      {/* Booking Modal */}
      <NewAppointmentModal
        isOpen={isNewAppointmentOpen}
        onClose={() => {
          setIsNewAppointmentOpen(false);
          setBookingParams({});
        }}
        preSelectedServiceId={bookingParams.serviceId}
        preSelectedDate={bookingParams.date}
        preSelectedTime={bookingParams.time}
        preSelectedBarberId={bookingParams.barberId}
      />

      {/* Authentication & Persona switch Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BarberDataProvider>
        <MainApp />
      </BarberDataProvider>
    </AuthProvider>
  );
}
