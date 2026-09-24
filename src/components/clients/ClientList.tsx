import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBarberData } from '../../context/BarberDataContext';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  FileText,
  Edit2,
  Trash2,
  History,
  X,
  Check,
  CheckCircle2,
  ExternalLink,
  Scissors,
} from 'lucide-react';
import { Client, Appointment } from '../../types';

export const ClientList: React.FC = () => {
  const { isOwner, updateUserCredentials, users, register } = useAuth();
  const { clients, addClient, updateClient, deleteClient, appointments } = useBarberData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientHistory, setSelectedClientHistory] = useState<Client | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal create/edit client
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Fecha o modal de edição se o usuário não for Dono (ex: ao alternar perfil para Barbeiro)
  useEffect(() => {
    if (!isOwner() && editingClient) {
      setIsModalOpen(false);
      setEditingClient(null);
    }
  }, [isOwner, editingClient]);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formWhatsApp, setFormWhatsApp] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const filteredClients = clients.filter((c) => {
    const term = (searchTerm || '').toLowerCase();
    const nameMatch = (c.name || '').toLowerCase().includes(term);
    const phoneMatch = (c.phone || '').includes(term) || (c.whatsapp || '').includes(term);
    const emailMatch = (c.email || '').toLowerCase().includes(term);
    return nameMatch || phoneMatch || emailMatch;
  });

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormName('');
    setFormPhone('');
    setFormWhatsApp('');
    setFormEmail('');
    setFormBirthDate('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    if (!isOwner()) {
      setToastMessage('Apenas o Dono tem permissão para editar dados de clientes.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setEditingClient(client);
    setFormName(client.name || '');
    setFormPhone(client.phone || '');
    setFormWhatsApp(client.whatsapp || (client.phone ? client.phone.replace(/\D/g, '') : ''));
    setFormEmail(client.email || '');
    setFormBirthDate(client.birthDate || '');
    setFormNotes(client.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone) return;

    const formattedWhatsApp = formWhatsApp
      ? formWhatsApp.replace(/\D/g, '')
      : formPhone.replace(/\D/g, '');

    if (editingClient) {
      if (!isOwner()) {
        setToastMessage('Permissão negada: apenas o Dono pode editar dados de clientes.');
        setTimeout(() => setToastMessage(null), 3000);
        setIsModalOpen(false);
        return;
      }

      updateClient(editingClient.id, {
        name: formName,
        phone: formPhone,
        whatsapp: formattedWhatsApp,
        email: formEmail,
        birthDate: formBirthDate,
        notes: formNotes,
      });

      // Sincroniza também na tabela/estado de users se o cliente possuir conta de login vinculada
      const linkedUser = users.find(
        (u) =>
          u.id === editingClient.userId ||
          (editingClient.email && u.email.toLowerCase() === editingClient.email.toLowerCase())
      );
      if (linkedUser) {
        updateUserCredentials(linkedUser.id, {
          name: formName,
          email: formEmail ? formEmail.trim().toLowerCase() : linkedUser.email,
          phone: formPhone,
        });
      }

      setToastMessage(`Cliente "${formName}" atualizado com sucesso e sincronizado no cadastro de usuários!`);
    } else {
      const cleanEmail = formEmail && formEmail.trim()
        ? formEmail.trim().toLowerCase()
        : `${formName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '')}@cliente.audax.com`;

      const regResult = await register({
        name: formName.trim(),
        email: cleanEmail,
        phone: formPhone.trim(),
        password: '123456',
        role: 'cliente',
      });

      if (!regResult.success) {
        setToastMessage(`Erro ao cadastrar: ${regResult.message}`);
        setTimeout(() => setToastMessage(null), 4000);
        return;
      }

      addClient({
        name: formName,
        phone: formPhone,
        whatsapp: formattedWhatsApp,
        email: cleanEmail,
        birthDate: formBirthDate,
        notes: formNotes,
      });

      setToastMessage(`Cliente "${formName}" cadastrado com sucesso (lógica de Criar Conta aplicada)!`);
    }

    setIsModalOpen(false);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getClientAppointments = (clientId: string): Appointment[] => {
    return appointments.filter((a) => a.clientId === clientId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2dcce] pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-100 text-[#a16a1c]">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-stone-950">Gestão de Clientes</h1>
          </div>
          <p className="text-xs text-stone-700 font-medium mt-1">
            Cadastro completo, canal de WhatsApp direto e histórico detalhado de visitas
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Cadastrar Cliente</span>
        </button>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome, telefone ou e-mail..."
          className="w-full bg-white border border-[#e2dcce] rounded-xl pl-9 pr-3 py-2 text-xs text-stone-950 font-bold placeholder-stone-500 focus:outline-none focus:border-[#a16a1c] shadow-2xs"
        />
      </div>

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const clientApts = getClientAppointments(client.id);
          const rawWhatsapp = (client.whatsapp || client.phone).replace(/\D/g, '');

          return (
            <div
              key={client.id}
              className="p-5 rounded-2xl border border-[#e2dcce] bg-white hover:border-amber-300 transition-all flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={client.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(client.name)}`}
                      alt={client.name}
                      className="w-11 h-11 rounded-full object-cover border border-stone-300"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-stone-950">{client.name}</h3>
                      <span className="text-[10px] text-stone-600 font-semibold">
                        {client.totalAppointments} visitas registradas
                      </span>
                    </div>
                  </div>

                  {/* Actions Drop (Apenas para o Dono) */}
                  {isOwner() && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(client)}
                        className="p-1.5 rounded-lg text-stone-600 hover:text-[#a16a1c] hover:bg-stone-100 transition-colors"
                        title="Editar Cliente"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteClient(client.id)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-rose-700 hover:bg-stone-100 transition-colors"
                        title="Excluir Cliente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Contact details */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-stone-900 font-bold">
                    <span className="flex items-center gap-1.5 text-stone-600 font-semibold">
                      <Phone className="w-3.5 h-3.5 text-stone-500" />
                      Telefone:
                    </span>
                    <span>{client.phone}</span>
                  </div>

                  {client.email && (
                    <div className="flex items-center justify-between text-stone-900 font-bold">
                      <span className="flex items-center gap-1.5 text-stone-600 font-semibold">
                        <Mail className="w-3.5 h-3.5 text-stone-500" />
                        E-mail:
                      </span>
                      <span className="truncate max-w-[170px]">{client.email}</span>
                    </div>
                  )}

                  {client.birthDate && (
                    <div className="flex items-center justify-between text-stone-900 font-bold">
                      <span className="flex items-center gap-1.5 text-stone-600 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-stone-500" />
                        Aniversário:
                      </span>
                      <span>{client.birthDate.split('-').reverse().join('/')}</span>
                    </div>
                  )}

                  {client.notes && (
                    <div className="mt-2.5 p-2 rounded-lg bg-[#f8f5ee] border border-[#e2dcce] text-[11px] text-stone-700 italic font-medium">
                      {client.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Quick Triggers */}
              <div className="mt-5 pt-3 border-t border-[#e2dcce] flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedClientHistory(client)}
                  className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-900 text-xs font-bold transition-colors flex items-center space-x-1"
                >
                  <History className="w-3.5 h-3.5 text-[#a16a1c]" />
                  <span>Histórico ({clientApts.length})</span>
                </button>

                <a
                  href={`https://wa.me/55${rawWhatsapp}?text=Ol%C3%A1%20${encodeURIComponent(client.name)}%2C%20tudo%20bem%3F%20Aqui%20%C3%A9%20da%20BarberPro!`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all flex items-center space-x-1"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#e2dcce] shadow-2xs">
          <Users className="w-10 h-10 mx-auto text-stone-400 mb-2" />
          <p className="text-base font-bold text-stone-950">Nenhum cliente encontrado</p>
          <p className="text-xs text-stone-600 font-medium mt-1">
            Cadastre novos clientes para manter histórico e avisos automáticos.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs shadow-2xs"
          >
            Cadastrar Primeiro Cliente
          </button>
        </div>
      )}

      {/* Modal Create/Edit Client */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#e2dcce] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#e2dcce] pb-3">
              <h2 className="text-base font-bold text-stone-950">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-500 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-stone-900 block mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Matheus Costa"
                  className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-sm text-stone-950 font-bold placeholder-stone-400 focus:outline-none focus:border-[#a16a1c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-900 block mb-1">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="(11) 98833-2211"
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-sm text-stone-950 font-bold placeholder-stone-400 focus:outline-none focus:border-[#a16a1c]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-900 block mb-1">
                    WhatsApp (Link direto)
                  </label>
                  <input
                    type="text"
                    value={formWhatsApp}
                    onChange={(e) => setFormWhatsApp(e.target.value)}
                    placeholder="11988332211"
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-sm text-stone-950 font-bold placeholder-stone-400 focus:outline-none focus:border-[#a16a1c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-900 block mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-sm text-stone-950 font-bold placeholder-stone-400 focus:outline-none focus:border-[#a16a1c]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-900 block mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={formBirthDate}
                    onChange={(e) => setFormBirthDate(e.target.value)}
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-sm text-stone-950 font-bold focus:outline-none focus:border-[#a16a1c]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-900 block mb-1">
                  Observações e Preferências
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Gosta de café sem açúcar, alérgico a pós barba com álcool, corte fade navalhado."
                  className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-xs text-stone-950 font-bold placeholder-stone-400 focus:outline-none focus:border-[#a16a1c] resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#e2dcce]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-950"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs transition-colors shadow-2xs"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Histórico do Cliente */}
      {selectedClientHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#e2dcce] bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e2dcce] pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-950">
                  Histórico: {selectedClientHistory.name}
                </h3>
                <p className="text-xs text-stone-600 font-semibold">{selectedClientHistory.phone}</p>
              </div>
              <button
                onClick={() => setSelectedClientHistory(null)}
                className="text-stone-500 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {getClientAppointments(selectedClientHistory.id).length > 0 ? (
                getClientAppointments(selectedClientHistory.id).map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3 rounded-xl bg-[#f8f5ee] border border-[#e2dcce] space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-950">{apt.serviceName}</span>
                      <span className="text-[#a16a1c] font-black">R$ {apt.servicePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-700 font-medium text-[11px]">
                      <span>Barbeiro: {apt.barberName}</span>
                      <span>
                        {apt.date.split('-').reverse().join('/')} às {apt.time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-stone-600 uppercase font-bold">
                        Status: {apt.status}
                      </span>
                      {apt.notes && (
                        <span className="text-[10px] text-stone-700 italic">Obs: {apt.notes}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-600 font-medium text-center py-6">
                  Nenhum agendamento registrado ainda para este cliente.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
