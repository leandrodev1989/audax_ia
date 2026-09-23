import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBarberData } from '../../context/BarberDataContext';
import {
  X,
  Scissors,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Phone,
  FileText,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Barber, Service } from '../../types';
import {
  getLocalDateString,
  getLocalTimeString,
  isDateTimeInPast,
  validateAppointmentDateTime,
  getOperatingHoursForDate,
  getTimeSlotsForDate,
} from '../../lib/dateUtils';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedBarberId?: string;
  preSelectedServiceId?: string;
  preSelectedDate?: string;
  preSelectedTime?: string;
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  preSelectedBarberId,
  preSelectedServiceId,
  preSelectedDate,
  preSelectedTime,
}) => {
  const { currentUser, isClient, isBarber, isOwner } = useAuth();
  const { barbers, services, clients, appointments, addAppointment } = useBarberData();

  // Active services & barbers only for booking
  const activeServices = services.filter((s) => s.isActive !== false);
  const activeBarbers = barbers.filter((b) => b.isActive !== false);

  // Steps: 1 = Barber, 2 = Service, 3 = Date & Time, 4 = Client Details & Confirm
  const [step, setStep] = useState<number>(1);

  // Form State
  const [selectedBarberId, setSelectedBarberId] = useState<string>(() => {
    if (preSelectedBarberId) return preSelectedBarberId;
    if (currentUser) {
      const myBarber = barbers.find(
        (b) => b.userId === currentUser.id || b.name.toLowerCase() === currentUser.name.toLowerCase()
      );
      if (myBarber) return myBarber.id;
    }
    return activeBarbers[0]?.id || '';
  });
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    preSelectedServiceId || activeServices[0]?.id || ''
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    preSelectedDate || getLocalDateString()
  );
  const [selectedTime, setSelectedTime] = useState<string>(preSelectedTime || '');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [targetType, setTargetType] = useState<'cliente' | 'barbeiro'>('cliente');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successCreated, setSuccessCreated] = useState<boolean>(false);

  // Dynamic operating hours and time slots based on selected date
  const operatingHours = getOperatingHoursForDate(selectedDate);
  const timeSlots = getTimeSlotsForDate(selectedDate);

  const todayStr = getLocalDateString();
  const isSelectedDateToday = selectedDate === todayStr;
  const currentLocalTime = getLocalTimeString();

  // Sync props when modal opens
  useEffect(() => {
    if (isOpen) {
      if (preSelectedBarberId) {
        setSelectedBarberId(preSelectedBarberId);
      } else if (isBarber() && !isOwner()) {
        const myBarber = barbers.find(
          (b) => b.userId === currentUser?.id || b.name.toLowerCase() === currentUser?.name.toLowerCase()
        );
        if (myBarber) {
          setSelectedBarberId(myBarber.id);
        }
      }
      if (preSelectedServiceId) setSelectedServiceId(preSelectedServiceId);
      if (preSelectedDate) setSelectedDate(preSelectedDate);
      if (preSelectedTime) setSelectedTime(preSelectedTime);
    }
  }, [isOpen, preSelectedBarberId, preSelectedServiceId, preSelectedDate, preSelectedTime, currentUser, barbers, isBarber, isOwner]);

  // Check if slot is occupied for chosen barber & date
  const isSlotOccupied = (slot: string) => {
    return appointments.some(
      (a) =>
        a.barberId === selectedBarberId &&
        a.date === selectedDate &&
        a.time === slot &&
        a.status !== 'cancelado'
    );
  };

  // Check if slot has already passed
  const isSlotPast = (slot: string) => {
    return isDateTimeInPast(selectedDate, slot);
  };

  // Automatically select first valid available slot when date/barber changes or modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Check if current selected time is valid (not in past, not occupied)
    const isCurrentTimeValid =
      selectedTime &&
      !isDateTimeInPast(selectedDate, selectedTime) &&
      !isSlotOccupied(selectedTime);

    if (!isCurrentTimeValid) {
      const firstValidSlot = timeSlots.find(
        (slot) => !isDateTimeInPast(selectedDate, slot) && !isSlotOccupied(slot)
      );
      setSelectedTime(firstValidSlot || '');
    }
  }, [selectedDate, selectedBarberId, isOpen]);

  // Update client details if user logs in
  useEffect(() => {
    if (currentUser) {
      setClientName((prev) => prev || currentUser.name || '');
      setClientPhone((prev) => prev || currentUser.phone || '');
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const selectedBarber = barbers.find((b) => b.id === selectedBarberId);
  const selectedService = services.find((s) => s.id === selectedServiceId);

  const handleSelectPerson = (id: string) => {
    if (!id) return;
    if (targetType === 'cliente') {
      const c = clients.find((item) => item.id === id);
      if (c) {
        setClientName(c.name);
        setClientPhone(c.phone || '');
      }
    } else {
      const b = barbers.find((item) => item.id === id);
      if (b) {
        setClientName(b.name);
        setClientPhone(b.phone || '');
      }
    }
  };

  const handleNextStep = () => {
    setErrorMessage(null);

    if (step === 1) {
      const barber = barbers.find((b) => b.id === selectedBarberId);
      if (!selectedBarberId || !barber || barber.isActive === false) {
        setErrorMessage('Este profissional está inativo ou indisponível no momento. Por favor, escolha um barbeiro ativo.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const srv = services.find((s) => s.id === selectedServiceId);
      if (!selectedServiceId || !srv || srv.isActive === false) {
        setErrorMessage('Este serviço está desativado e não pode ser agendado. Por favor, escolha um serviço ativo.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!selectedDate || !selectedTime) {
        setErrorMessage('Por favor, selecione a data e o horário do atendimento.');
        return;
      }

      // Validação estrita: horário já passou?
      const validation = validateAppointmentDateTime(selectedDate, selectedTime);
      if (!validation.valid) {
        setErrorMessage(
          validation.message ||
            'Este horário não está mais disponível. Por favor, selecione outro horário.'
        );
        return;
      }

      // Horário ocupado?
      if (isSlotOccupied(selectedTime)) {
        setErrorMessage('Este horário já está ocupado por outro cliente. Escolha outro horário.');
        return;
      }

      setStep(4);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedBarberId || !selectedServiceId || !selectedDate || !selectedTime || !clientName) {
      setErrorMessage('Preencha todos os campos obrigatórios.');
      return;
    }

    // Validação estrita antes de gravar
    const validation = validateAppointmentDateTime(selectedDate, selectedTime);
    if (!validation.valid) {
      setErrorMessage(
        validation.message ||
          'Este horário não está mais disponível. Por favor, selecione outro horário.'
      );
      setStep(3);
      return;
    }

    if (isSlotOccupied(selectedTime)) {
      setErrorMessage('Este horário já foi preenchido. Por favor, selecione outro horário.');
      setStep(3);
      return;
    }

    try {
      // Associate with existing client or create temporary ID
      const matchedClient = clients.find(
        (c) => c.name.toLowerCase() === clientName.toLowerCase() || c.phone === clientPhone
      );
      const resolvedClientId = matchedClient ? matchedClient.id : `client-${Date.now()}`;

      addAppointment({
        clientId: resolvedClientId,
        clientName,
        clientPhone: clientPhone || '(11) 99999-9999',
        barberId: selectedBarberId,
        serviceId: selectedServiceId,
        date: selectedDate,
        time: selectedTime,
        notes,
      });

      setSuccessCreated(true);
      setTimeout(() => {
        setSuccessCreated(false);
        onClose();
        // Reset form
        setStep(1);
        setErrorMessage(null);
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Este horário não está mais disponível. Por favor, selecione outro horário.');
      setStep(3);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-[#e2dcce] bg-white p-5 sm:p-6 shadow-2xl text-stone-900 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e2dcce] pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-amber-100 text-[#a16a1c]">
                <Scissors className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-stone-900">Novo Agendamento</h2>
            </div>
            <p className="text-xs text-stone-600 font-semibold mt-0.5">
              Passo {step} de 4: {step === 1 ? 'Escolher Barbeiro' : step === 2 ? 'Selecionar Serviço' : step === 3 ? 'Data & Horário' : 'Confirmação'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="grid grid-cols-4 gap-1.5 my-4">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s <= step ? 'bg-[#a16a1c]' : 'bg-stone-200'
              }`}
            />
          ))}
        </div>

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-700" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successCreated ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-stone-900">Agendamento Realizado!</h3>
            <p className="text-xs text-stone-600 font-semibold max-w-xs">
              Horário confirmado com sucesso. O barbeiro e o cliente receberão a notificação.
            </p>
          </div>
        ) : (
          <div>
            {/* Step 1: Barbeiro */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-stone-900">
                  Com qual profissional você deseja agendar?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeBarbers.map((barber) => {
                    const isSelected = selectedBarberId === barber.id;
                    return (
                      <div
                        key={barber.id}
                        onClick={() => {
                          setSelectedBarberId(barber.id);
                          setErrorMessage(null);
                        }}
                        className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-amber-50 border-[#a16a1c] shadow-xs ring-1 ring-[#a16a1c]'
                            : 'bg-white border-[#e2dcce] hover:bg-[#f8f5ee]'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={barber.photo}
                            alt={barber.name}
                            className="w-12 h-12 rounded-xl object-cover border border-[#e2dcce]"
                          />
                          <div>
                            <p className="text-sm font-black text-stone-900">{barber.name}</p>
                            <p className="text-[11px] text-[#a16a1c] font-bold">{barber.rating} ⭐</p>
                            <p className="text-[10px] text-stone-600 font-semibold line-clamp-1">
                              {barber.specialties.join(', ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Serviço */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-stone-900">
                  Qual serviço você deseja realizar?
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {activeServices.map((srv) => {
                    const isSelected = selectedServiceId === srv.id;
                    return (
                      <div
                        key={srv.id}
                        onClick={() => {
                          setSelectedServiceId(srv.id);
                          setErrorMessage(null);
                        }}
                        className={`cursor-pointer p-3 rounded-xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-50 border-[#a16a1c] ring-1 ring-[#a16a1c]'
                            : 'bg-white border-[#e2dcce] hover:bg-[#f8f5ee]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-black text-stone-900">{srv.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-800 font-bold border border-stone-200">
                              ~{srv.durationMinutes} min
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 font-semibold mt-0.5">{srv.description}</p>
                        </div>
                        <span className="text-sm font-black text-[#a16a1c] whitespace-nowrap ml-4">
                          R$ {srv.price.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Data & Horário */}
            {step === 3 && (
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-stone-900 block">
                      Escolha a Data do Atendimento
                    </label>
                    <span className="text-[11px] font-bold text-[#a16a1c] bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                      {operatingHours.dayName}: {operatingHours.operatingTimeText}
                    </span>
                  </div>
                  <input
                    type="date"
                    value={selectedDate}
                    min={todayStr}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                  />
                  {isSelectedDateToday && (
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-950 font-semibold bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-lg">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-[#a16a1c]" />
                      <span>
                        Data de hoje selecionada (horário atual: <strong>{currentLocalTime}</strong>). Horários passados ficam desabilitados.
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-stone-900">
                      Horários por Turno ({selectedBarber?.name})
                    </label>
                    <span className="text-[11px] font-bold text-stone-600">
                      {isSelectedDateToday ? 'Hoje' : selectedDate.split('-').reverse().join('/')}
                    </span>
                  </div>

                  {/* Render by Shifts */}
                  <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                    {operatingHours.shifts.map((shift) => (
                      <div key={shift.id} className="bg-[#f8f5ee]/70 p-3 rounded-xl border border-[#e2dcce]">
                        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#e2dcce]">
                          <span className="text-xs font-black text-[#a16a1c] flex items-center gap-1.5">
                            {shift.id === 'manha' ? '☀️' : '🌅'} {shift.label}
                          </span>
                          <span className="text-[10px] text-stone-700 font-bold bg-white px-2 py-0.5 rounded border border-[#e2dcce]">
                            {shift.period}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {shift.slots.map((slot) => {
                            const past = isSlotPast(slot);
                            const occupied = isSlotOccupied(slot);
                            const isSelected = selectedTime === slot && !past && !occupied;
                            const disabled = past || occupied;

                            return (
                              <button
                                key={slot}
                                type="button"
                                disabled={disabled}
                                onClick={() => {
                                  if (!disabled) {
                                    setSelectedTime(slot);
                                    setErrorMessage(null);
                                  }
                                }}
                                title={
                                  past
                                    ? `Horário ${slot} já passou`
                                    : occupied
                                    ? `Horário ${slot} já reservado`
                                    : `Selecionar ${slot}`
                                }
                                className={`relative py-2 px-1 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center ${
                                  occupied
                                    ? 'bg-stone-200/50 text-stone-400 line-through cursor-not-allowed border border-stone-200'
                                    : past
                                    ? 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200 select-none'
                                    : isSelected
                                    ? 'bg-[#a16a1c] text-white font-black shadow-md scale-105 border border-[#8c5a15]'
                                    : 'bg-white hover:bg-stone-100 text-stone-900 border border-[#e2dcce]'
                                }`}
                              >
                                <span>{slot}</span>
                                {past && (
                                  <span className="text-[9px] font-normal text-stone-400">Passou</span>
                                )}
                                {occupied && !past && (
                                  <span className="text-[9px] font-normal text-stone-400">Ocupado</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Legenda de status dos horários */}
                  <div className="flex flex-wrap items-center gap-3 pt-3 text-[11px] font-semibold text-stone-600 border-t border-[#e2dcce] mt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-white border border-[#e2dcce]" />
                      <span>Disponível</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-[#a16a1c]" />
                      <span className="text-stone-900 font-bold">Selecionado</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-stone-200/50 border border-stone-200" />
                      <span className="text-stone-400 line-through">Ocupado</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-stone-100 opacity-60 border border-stone-200" />
                      <span className="text-stone-500">Horário Passado</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Dados do Cliente & Confirmação */}
            {step === 4 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Summary Box */}
                <div className="p-3.5 rounded-xl bg-[#f8f5ee] border border-[#e2dcce] space-y-2 text-xs font-semibold text-stone-800">
                  <div className="flex justify-between">
                    <span className="text-stone-600">Profissional:</span>
                    <span className="font-bold text-stone-900">{selectedBarber?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Serviço:</span>
                    <span className="font-bold text-stone-900">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Data e Hora:</span>
                    <span className="font-bold text-[#a16a1c]">
                      {selectedDate.split('-').reverse().join('/')} às {selectedTime}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-[#e2dcce] pt-1.5">
                    <span className="text-stone-600">Total a pagar no local:</span>
                    <span className="font-black text-sm text-stone-900">
                      R$ {selectedService?.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* If user is barber or owner */}
                {!isClient() && (
                  <div className="space-y-3">
                    {isOwner() && (
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-2">
                          Tipo de Agendamento (Dono):
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setTargetType('cliente');
                              setClientName('');
                              setClientPhone('');
                            }}
                            className={`p-3 rounded-xl border text-left transition-all flex items-center space-x-2.5 ${
                              targetType === 'cliente'
                                ? 'bg-amber-100 border-[#a16a1c] text-[#a16a1c] font-bold shadow-2xs'
                                : 'bg-white border-[#e2dcce] text-stone-700 hover:text-stone-900'
                            }`}
                          >
                            <span className="text-base">👤</span>
                            <div>
                              <p className="text-xs">Cliente</p>
                              <p className="text-[10px] text-stone-600 font-normal">Agendar para cliente</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setTargetType('barbeiro');
                              setClientName('');
                              setClientPhone('');
                            }}
                            className={`p-3 rounded-xl border text-left transition-all flex items-center space-x-2.5 ${
                              targetType === 'barbeiro'
                                ? 'bg-amber-100 border-[#a16a1c] text-[#a16a1c] font-bold shadow-2xs'
                                : 'bg-white border-[#e2dcce] text-stone-700 hover:text-stone-900'
                            }`}
                          >
                            <span className="text-base">✂️</span>
                            <div>
                              <p className="text-xs">Barbeiro</p>
                              <p className="text-[10px] text-stone-600 font-normal">Agendar para colega</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        {targetType === 'cliente' ? 'Selecione um Cliente da Base:' : 'Selecione um Barbeiro da Equipe:'}
                      </label>
                      <select
                        onChange={(e) => handleSelectPerson(e.target.value)}
                        className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                      >
                        <option value="">-- Selecionar da lista ({targetType === 'cliente' ? 'Clientes' : 'Barbeiros'}) --</option>
                        {targetType === 'cliente'
                          ? clients.map((c) => (
                              <option key={c.id} value={c.id}>
                                [Cliente] {c.name} ({c.phone || 'Sem fone'})
                              </option>
                            ))
                          : barbers.map((b) => (
                              <option key={b.id} value={b.id}>
                                [Barbeiro] {b.name} ({b.phone || 'Sem fone'})
                              </option>
                            ))}
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-stone-900 block mb-1">
                    Nome Completo do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => {
                      setClientName(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Ex: João Victor"
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3.5 py-2 text-sm font-medium text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-900 block mb-1">
                    WhatsApp para Lembrete *
                  </label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => {
                      setClientPhone(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="(11) 98765-4321"
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3.5 py-2 text-sm font-medium text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-900 block mb-1">
                    Observações ou Preferências (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Fade bem baixo, barba desenhada sem navalha, etc."
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3.5 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#a16a1c] resize-none"
                  />
                </div>

                {/* Footer Submit */}
                <div className="flex items-center justify-between pt-3 border-t border-[#e2dcce]">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(3);
                      setErrorMessage(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs shadow-md transition-all"
                  >
                    Confirmar Agendamento
                  </button>
                </div>
              </form>
            )}

            {/* Stepper Navigation Buttons (for steps 1 to 3) */}
            {step < 4 && (
              <div className="flex items-center justify-between pt-4 border-t border-[#e2dcce] mt-4">
                <button
                  type="button"
                  disabled={step === 1}
                  onClick={() => {
                    setStep((s) => Math.max(1, s - 1));
                    setErrorMessage(null);
                  }}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold ${
                    step === 1 ? 'opacity-30 cursor-not-allowed text-stone-400' : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs shadow-md transition-colors"
                >
                  <span>Próximo Passo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
