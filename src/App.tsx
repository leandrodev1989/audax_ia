/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { FloatingSimulationBanner } from './components/visibility/FloatingSimulationBanner';
import { VisibilityControlCard } from './components/visibility/VisibilityControlCard';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { ShieldAlert } from 'lucide-react';

function MainApp() {
  const { activeRole, currentUser } = useAuth();
  const { isFeatureVisibleForRole } = useBarberData();

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

  // Proteção de rota da Governança: Se a aba for 'gerenciar-visibilidade' e o perfil não for 'dono', redireciona para 'dashboard'
  useEffect(() => {
    if (activeTab === 'gerenciar-visibilidade' && activeRole !== 'dono') {
      setActiveTab('dashboard');
    }
  }, [activeRole, activeTab]);

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

      {/* Floating Simulation Bar when Owner is testing Barber or Client views */}
      <FloatingSimulationBanner
        onOpenVisibilityManager={() => setActiveTab('gerenciar-visibilidade')}
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
          {activeTab === 'servicos' && isFeatureVisibleForRole('servicesCatalog', activeRole) && (
            <ServiceList onScheduleService={(srvId) => handleOpenBooking(srvId)} />
          )}
          {activeTab === 'clientes' && isFeatureVisibleForRole('clientList', activeRole) && <ClientList />}
          {activeTab === 'barbeiros' && <BarberList />}
          {activeTab === 'arquitetura' && isFeatureVisibleForRole('architectureDocs', activeRole) && <ArchitectureView />}
          {activeTab === 'ai-booking' && isFeatureVisibleForRole('aiBooking', activeRole) && <AiBookingTestView />}
          {activeTab === 'gerenciar-visibilidade' && activeRole === 'dono' && (
            <VisibilityControlCard
              onNavigateTab={(tab) => setActiveTab(tab)}
              isStandalone={true}
            />
          )}

          {activeTab === 'gerenciar-visibilidade' && activeRole !== 'dono' && (
            <div className="rounded-2xl border border-red-200 bg-white p-8 text-center max-w-xl mx-auto my-12 shadow-xs space-y-4">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-stone-900">
                Painel de Governança Restrito ao Dono
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                A tela de governança e controle de visibilidade de botões é de acesso exclusivo do <strong>Barbeiro Dono</strong>.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white text-xs font-bold transition-all shadow-xs"
                >
                  Voltar ao Dashboard
                </button>
              </div>
            </div>
          )}

          {/* Fallback para abas desativadas na visibilidade configurada pelo Dono */}
          {((activeTab === 'ai-booking' && !isFeatureVisibleForRole('aiBooking', activeRole)) ||
            (activeTab === 'arquitetura' && !isFeatureVisibleForRole('architectureDocs', activeRole)) ||
            (activeTab === 'clientes' && !isFeatureVisibleForRole('clientList', activeRole)) ||
            (activeTab === 'servicos' && !isFeatureVisibleForRole('servicesCatalog', activeRole))) && (
            <div className="rounded-2xl border border-[#e2dcce] bg-white p-8 text-center max-w-xl mx-auto my-12 shadow-xs space-y-4">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-[#a16a1c]">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-stone-900">
                Recurso Não Disponível Para Este Perfil
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                A visibilidade desta funcionalidade foi configurada como oculta para a visão de{' '}
                <strong className="uppercase">"{activeRole}"</strong> pelo Barbeiro Dono.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white text-xs font-bold transition-all shadow-xs"
                >
                  Voltar ao Dashboard
                </button>
                {activeRole === 'dono' && (
                  <button
                    onClick={() => setActiveTab('gerenciar-visibilidade')}
                    className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold transition-all border border-amber-300"
                  >
                    Liberar no Painel de Governança
                  </button>
                )}
              </div>
            </div>
          )}
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

      {/* PWA Offline Connectivity Banner */}
      <OfflineIndicator />
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
