import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBarberData } from '../../context/BarberDataContext';
import {
  Scissors,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Star,
  Check,
  X,
  Phone,
  Crown,
  User as UserIcon,
  ToggleLeft,
  ToggleRight,
  Sliders,
  Camera,
  Upload,
  Link,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { Barber, UserRole } from '../../types';

export const BarberList: React.FC = () => {
  const { isOwner, users, updateUserRoles, createBarberWithCredentials, updateUserCredentials } = useAuth();
  const { barbers, addBarber, updateBarber, deleteBarber, toggleBarberActive } = useBarberData();

  // Create / Edit Barber Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);

  // Profile assignment Modal (Atribuir múltiplos perfis)
  const [selectedUserForRoles, setSelectedUserForRoles] = useState<string | null>(null);
  const [userRolesDraft, setUserRolesDraft] = useState<UserRole[]>([]);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [barberEmail, setBarberEmail] = useState('');
  const [barberPassword, setBarberPassword] = useState('123456');
  const [photo, setPhoto] = useState('');
  const [specialtiesText, setSpecialtiesText] = useState('');
  const [commissionPercentage, setCommissionPercentage] = useState(50);
  const [workingHours, setWorkingHours] = useState('Terça a Sábado, 09h às 19h');

  // Photo Upload Tab and File Input Ref
  const [photoTab, setPhotoTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preset Barber Photos
  const BARBER_PHOTO_PRESETS = [
    { label: 'Barbeiro Estilo 1', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400' },
    { label: 'Barbeiro Estilo 2', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400' },
    { label: 'Barbeiro Estilo 3', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
    { label: 'Barbeiro Estilo 4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400' },
    { label: 'Barbeiro Estilo 5', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400' },
  ];

  // Helper to handle local file upload & canvas compression
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP, etc).');
      return;
    }

    setIsUploadingPhoto(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400; // Optimal avatar size
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setPhoto(dataUrl);
        }
        setIsUploadingPhoto(false);
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingBarber(null);
    setName('');
    setPhone('');
    setBarberEmail('');
    setBarberPassword('123456');
    setPhoto('https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400');
    setSpecialtiesText('Fade Navalhado, Barboterapia');
    setCommissionPercentage(50);
    setWorkingHours('Terça a Sábado, 09h às 19h');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (barber: Barber) => {
    setEditingBarber(barber);
    setName(barber.name);
    setPhone(barber.phone);
    const linkedUser = users.find(
      (u) => u.id === barber.userId || u.name.toLowerCase() === barber.name.toLowerCase()
    );
    setBarberEmail(linkedUser?.email || '');
    setBarberPassword(linkedUser?.password || '123456');
    setPhoto(barber.photo);
    setSpecialtiesText(barber.specialties.join(', '));
    setCommissionPercentage(barber.commissionPercentage || 50);
    setWorkingHours(barber.workingHours);
    setIsModalOpen(true);
  };

  const handleSaveBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const specialties = specialtiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingBarber) {
      updateBarber(editingBarber.id, {
        name,
        phone,
        photo: photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        specialties,
        commissionPercentage: Number(commissionPercentage),
        workingHours,
      });

      // Atualiza também e-mail, nome, telefone e SENHA do barbeiro no sistema de autenticação
      const linkedUser = users.find(
        (u) =>
          u.id === editingBarber.userId ||
          u.name.toLowerCase() === editingBarber.name.toLowerCase() ||
          (barberEmail && u.email.toLowerCase() === barberEmail.trim().toLowerCase())
      );
      const targetId = linkedUser?.id || editingBarber.userId || editingBarber.id;
      updateUserCredentials(targetId, {
        name,
        phone,
        email: barberEmail.trim().toLowerCase(),
        password: barberPassword.trim(),
      });

      setToastMessage(
        `Barbeiro e credenciais atualizados com sucesso! Login: "${barberEmail.trim()}", Nova Senha: "${barberPassword.trim()}".`
      );
      setTimeout(() => setToastMessage(null), 5000);
    } else {
      let linkedUserId: string | undefined = undefined;

      // O Barbeiro Dono cria o acesso do Barbeiro com login e senha
      if (barberEmail.trim()) {
        const credRes = await createBarberWithCredentials({
          name: name.trim(),
          email: barberEmail.trim(),
          phone: phone.trim(),
          password: barberPassword.trim() || '123456',
        });
        if (credRes.user) {
          linkedUserId = credRes.user.id;
        }
      }

      addBarber({
        name,
        phone,
        photo: photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        specialties,
        commissionPercentage: Number(commissionPercentage),
        workingHours,
        isActive: true,
        userId: linkedUserId,
      });

      setToastMessage(
        barberEmail.trim()
          ? `Barbeiro cadastrado com sucesso! Acesso criado com E-mail: "${barberEmail.trim()}" e Senha: "${barberPassword.trim()}".`
          : 'Barbeiro cadastrado com sucesso na equipe!'
      );
      setTimeout(() => setToastMessage(null), 6000);
    }

    setIsModalOpen(false);
  };

  // Open Multi-role RBAC manager for a user
  const handleOpenRoleManager = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser) {
      setSelectedUserForRoles(userId);
      setUserRolesDraft([...targetUser.roles]);
    }
  };

  const toggleRoleInDraft = (role: UserRole) => {
    if (userRolesDraft.includes(role)) {
      // Keep at least 1 role
      if (userRolesDraft.length > 1) {
        setUserRolesDraft(userRolesDraft.filter((r) => r !== role));
      }
    } else {
      setUserRolesDraft([...userRolesDraft, role]);
    }
  };

  const handleSaveRoles = () => {
    if (selectedUserForRoles && userRolesDraft.length > 0) {
      updateUserRoles(selectedUserForRoles, userRolesDraft);
      setSelectedUserForRoles(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2dcce] pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-100 text-[#a16a1c]">
              <Scissors className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-stone-900">Equipe de Barbeiros & RBAC</h1>
          </div>
          <p className="text-xs text-stone-700 font-semibold mt-1">
            Gestão dos mestres da navalha, especialidades, status e atribuição de múltiplos perfis
          </p>
        </div>

        {isOwner() && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs shadow-md transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Cadastrar Barbeiro</span>
          </button>
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-800 hover:text-stone-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barbers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {barbers.map((barber) => {
          // Find matching user account for RBAC role checking
          const linkedUser = users.find(
            (u) => u.id === barber.userId || u.name.toLowerCase() === barber.name.toLowerCase()
          );

          return (
            <div
              key={barber.id}
              className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                barber.isActive
                  ? 'border-[#e2dcce] bg-white hover:border-[#a16a1c] shadow-xs'
                  : 'border-[#e2dcce]/60 bg-[#f5f2eb]/60 opacity-70'
              }`}
            >
              <div>
                {/* Top: Avatar, Name & Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="relative">
                      <img
                        src={barber.photo}
                        alt={barber.name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-[#a16a1c] shadow-xs"
                      />
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          barber.isActive ? 'bg-emerald-600' : 'bg-stone-400'
                        }`}
                        title={barber.isActive ? 'Ativo' : 'Inativo'}
                      />
                    </div>

                    <div>
                      <h3 className="text-base font-black text-stone-900">{barber.name}</h3>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-xs text-[#a16a1c] font-bold flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-[#a16a1c]" />
                          {barber.rating}
                        </span>
                        <span className="text-[11px] text-stone-600 font-semibold">
                          • {barber.totalCuts} cortes
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Edit / Delete actions for Owner */}
                  {isOwner() && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(barber)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-[#a16a1c] hover:bg-stone-100 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteBarber(barber.id)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Specialties tags */}
                <div className="mt-4">
                  <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block mb-1.5">
                    Especialidades
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {barber.specialties.map((spec, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#f8f5ee] text-stone-800 border border-[#e2dcce]"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-1.5 text-xs font-semibold text-stone-800">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-600">Contato:</span>
                    <span>{barber.phone}</span>
                  </div>
                  {isOwner() && (
                    <div className="flex items-center justify-between">
                      <span className="text-stone-600">Comissão:</span>
                      <span className="text-[#a16a1c] font-black">{barber.commissionPercentage}%</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-stone-600">
                    <span>Horário:</span>
                    <span>{barber.workingHours}</span>
                  </div>
                </div>

                {/* Linked User Roles Display - Strictly for Owner */}
                {isOwner() && linkedUser && (
                  <div className="mt-3.5 p-2 rounded-xl bg-[#f8f5ee] border border-[#e2dcce]">
                    <span className="text-[10px] text-stone-600 font-bold block mb-1">
                      Perfis de Acesso no Sistema:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {linkedUser.roles.map((r) => (
                        <span
                          key={r}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            r === 'dono'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : r === 'barbeiro'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {r === 'dono' ? '👑 Barbeiro Dono' : r === 'barbeiro' ? '✂️ Barbeiro' : '👤 Cliente'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Controls */}
              {isOwner() && (
                <div className="mt-5 pt-3 border-t border-[#e2dcce] flex items-center justify-between">
                  <button
                    onClick={() => toggleBarberActive(barber.id)}
                    className="flex items-center space-x-1.5 text-xs text-stone-600 font-semibold hover:text-stone-900"
                  >
                    <span>Status:</span>
                    <span className={barber.isActive ? 'text-emerald-800 font-bold' : 'text-stone-500'}>
                      {barber.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </button>

                  {linkedUser && (
                    <button
                      onClick={() => handleOpenRoleManager(linkedUser.id)}
                      className="px-2.5 py-1 rounded-lg bg-[#f8f5ee] border border-[#e2dcce] hover:bg-[#a16a1c] hover:text-white text-xs font-bold text-stone-900 transition-colors flex items-center space-x-1"
                      title="Atribuir múltiplos perfis ao usuário (Dono, Barbeiro, Cliente)"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Gerenciar Perfis</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Criar / Editar Barbeiro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] rounded-2xl border border-[#e2dcce] bg-white shadow-2xl flex flex-col overflow-hidden text-stone-900">
            {/* Cabeçalho Fixo */}
            <div className="shrink-0 flex items-center justify-between border-b border-[#e2dcce] px-6 py-4 bg-white">
              <div className="flex items-center space-x-2">
                <Scissors className="w-5 h-5 text-[#a16a1c]" />
                <h2 className="text-base font-black text-stone-900">
                  {editingBarber ? 'Editar Dados do Barbeiro' : 'Cadastrar Novo Barbeiro'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-500 hover:text-stone-900 p-1 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário com Corpo Rolável e Rodapé Fixo */}
            <form onSubmit={handleSaveBarber} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Corpo com Scroll para telas menores/notebooks */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div>
                  <label className="text-xs font-bold text-stone-900 block mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Carlos Navalha"
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-sm font-medium text-stone-900 focus:outline-none focus:border-[#a16a1c]"
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
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 99772-2233"
                      className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-sm font-medium text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-900 block mb-1">
                      Comissão (%) *
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={commissionPercentage}
                      onChange={(e) => setCommissionPercentage(Number(e.target.value))}
                      className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-sm font-bold text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                    />
                  </div>
                </div>

                {/* Seção de Credenciais de Acesso criadas pelo Barbeiro Dono */}
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-[#a16a1c]" />
                    <span className="text-xs font-black text-amber-950">
                      {editingBarber ? 'Credenciais de Acesso do Barbeiro' : 'Criar Acesso ao Sistema (Login & Senha)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-700 font-semibold leading-relaxed">
                    O barbeiro tem seu acesso gerado exclusivamente pelo <strong>Barbeiro Dono</strong>. Informe o e-mail e a senha que ele usará para entrar no sistema com o perfil de Barbeiro.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-stone-900 block mb-1">
                        E-mail de Login *
                      </label>
                      <input
                        type="email"
                        required
                        value={barberEmail}
                        onChange={(e) => setBarberEmail(e.target.value)}
                        placeholder="barbeiro@studioaudax.com"
                        className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 font-medium focus:outline-none focus:border-[#a16a1c]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-stone-900 block mb-1">
                        Senha de Acesso *
                      </label>
                      <input
                        type="text"
                        required
                        value={barberPassword}
                        onChange={(e) => setBarberPassword(e.target.value)}
                        placeholder="Mínimo 6 dígitos"
                        className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 font-bold focus:outline-none focus:border-[#a16a1c] font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-900 block mb-1">
                    Especialidades (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={specialtiesText}
                    onChange={(e) => setSpecialtiesText(e.target.value)}
                    placeholder="Fade, Barboterapia, Pigmentação"
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-sm font-medium text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                  />
                </div>

                {/* Foto do Barbeiro - Upload de Arquivo / Presets / Link URL */}
                <div className="p-3.5 rounded-xl bg-[#f8f5ee] border border-[#e2dcce] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-[#a16a1c]" />
                      <span>Foto do Barbeiro (Avatar) *</span>
                    </label>
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md">
                      {photo ? 'Foto Definida' : 'Sem Foto'}
                    </span>
                  </div>

                  {/* Visual Preview & Quick Actions */}
                  <div className="flex items-center space-x-3.5 bg-white p-2.5 rounded-xl border border-[#e2dcce]">
                    <div className="relative shrink-0">
                      <img
                        src={photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'}
                        alt="Preview Foto Barbeiro"
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-[#a16a1c] shadow-xs"
                      />
                      {isUploadingPhoto && (
                        <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center text-white">
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="text-xs font-bold text-stone-900">Foto Atual do Perfil</p>
                      <p className="text-[11px] text-stone-600 font-medium leading-tight mt-0.5">
                        Faça upload de um arquivo do seu dispositivo, escolha uma das fotos de exemplo ou informe o link.
                      </p>
                      {photo && (
                        <button
                          type="button"
                          onClick={() => setPhoto('')}
                          className="mt-1.5 text-[11px] font-bold text-rose-700 hover:underline flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          <span>Remover Foto</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-lg border border-[#e2dcce] text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPhotoTab('upload')}
                      className={`py-1.5 rounded-md transition-all flex items-center justify-center space-x-1 ${
                        photoTab === 'upload'
                          ? 'bg-[#a16a1c] text-white shadow-2xs font-black'
                          : 'text-stone-700 hover:text-stone-950'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload de Arquivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPhotoTab('presets')}
                      className={`py-1.5 rounded-md transition-all flex items-center justify-center space-x-1 ${
                        photoTab === 'presets'
                          ? 'bg-[#a16a1c] text-white shadow-2xs font-black'
                          : 'text-stone-700 hover:text-stone-950'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Fotos Prontas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPhotoTab('url')}
                      className={`py-1.5 rounded-md transition-all flex items-center justify-center space-x-1 ${
                        photoTab === 'url'
                          ? 'bg-[#a16a1c] text-white shadow-2xs font-black'
                          : 'text-stone-700 hover:text-stone-950'
                      }`}
                    >
                      <Link className="w-3 h-3" />
                      <span>Link / URL</span>
                    </button>
                  </div>

                  {/* TAB CONTENT 1: Upload File */}
                  {photoTab === 'upload' && (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="p-4 rounded-xl border-2 border-dashed border-[#a16a1c]/40 bg-white hover:bg-amber-50/50 hover:border-[#a16a1c] transition-all cursor-pointer text-center group"
                      >
                        <div className="w-10 h-10 rounded-full bg-amber-100 text-[#a16a1c] flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                          <Upload className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <p className="text-xs font-black text-stone-900">
                          Clique aqui para escolher uma foto no Computador ou Celular
                        </p>
                        <p className="text-[11px] text-stone-600 font-semibold mt-0.5">
                          Formatos aceitos: JPG, PNG, WEBP. Redimensionado automaticamente.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAB CONTENT 2: Presets */}
                  {photoTab === 'presets' && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-stone-700 block">
                        Selecione uma foto da nossa galeria:
                      </span>
                      <div className="grid grid-cols-5 gap-2">
                        {BARBER_PHOTO_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPhoto(preset.url)}
                            className={`p-1 rounded-xl border transition-all text-center group ${
                              photo === preset.url
                                ? 'bg-amber-100 border-[#a16a1c] ring-2 ring-[#a16a1c]'
                                : 'bg-white border-[#e2dcce] hover:border-[#a16a1c]'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.label}
                              className="w-full h-12 rounded-lg object-cover"
                            />
                            <span className="text-[9px] font-bold text-stone-800 block truncate mt-1">
                              Opção {idx + 1}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB CONTENT 3: Direct URL Link */}
                  {photoTab === 'url' && (
                    <div>
                      <label className="text-[11px] font-bold text-stone-900 block mb-1">
                        URL Direta da Imagem (HTTPS)
                      </label>
                      <input
                        type="url"
                        value={photo}
                        onChange={(e) => setPhoto(e.target.value)}
                        placeholder="https://exemplo.com/minha-foto.jpg"
                        className="w-full bg-white border border-[#e2dcce] rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-900 block mb-1">
                    Horário de Trabalho
                  </label>
                  <input
                    type="text"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    placeholder="Segunda a Sábado, 10h às 20h"
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-sm font-medium text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                  />
                </div>
              </div>

              {/* Rodapé Fixo - Sempre visível em notebooks */}
              <div className="shrink-0 flex items-center justify-end space-x-3 px-6 py-4 border-t border-[#e2dcce] bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Salvar Barbeiro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gerenciador de Múltiplos Perfis (RBAC - Barbeiro Dono atribui/remove perfis) */}
      {selectedUserForRoles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md max-h-[90vh] sm:max-h-[85vh] rounded-2xl border border-[#e2dcce] bg-white shadow-2xl flex flex-col overflow-hidden text-stone-900">
            {/* Cabeçalho Fixo */}
            <div className="shrink-0 flex items-center justify-between border-b border-[#e2dcce] px-6 py-4 bg-white">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-[#a16a1c]" />
                <h3 className="text-base font-black text-stone-900">Atribuição de Múltiplos Perfis</h3>
              </div>
              <button
                onClick={() => setSelectedUserForRoles(null)}
                className="text-stone-500 hover:text-stone-900 p-1 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo Rolável */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              <p className="text-xs text-stone-700 font-semibold">
                Conforme os requisitos do sistema, um usuário pode possuir múltiplos perfis simultaneamente (ex: João pode ser Barbeiro e Dono).
              </p>

              <div className="space-y-2.5 pt-1">
                {/* Dono Option */}
                <div
                  onClick={() => toggleRoleInDraft('dono')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    userRolesDraft.includes('dono')
                      ? 'bg-amber-100 border-[#a16a1c] text-[#a16a1c]'
                      : 'bg-[#f8f5ee] border-[#e2dcce] text-stone-700'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Crown className="w-4 h-4 text-[#a16a1c]" />
                    <div>
                      <p className="text-xs font-black text-stone-900">Barbeiro Dono</p>
                      <p className="text-[10px] text-stone-600 font-semibold">Acesso total ao sistema, faturamento e equipe</p>
                    </div>
                  </div>
                  {userRolesDraft.includes('dono') && <Check className="w-4 h-4 text-[#a16a1c]" />}
                </div>

                {/* Barbeiro Option */}
                <div
                  onClick={() => toggleRoleInDraft('barbeiro')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    userRolesDraft.includes('barbeiro')
                      ? 'bg-blue-100 border-blue-400 text-blue-900'
                      : 'bg-[#f8f5ee] border-[#e2dcce] text-stone-700'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Scissors className="w-4 h-4 text-blue-800" />
                    <div>
                      <p className="text-xs font-black text-stone-900">Barbeiro</p>
                      <p className="text-[10px] text-stone-600 font-semibold">Agenda própria, comissão e atendimento</p>
                    </div>
                  </div>
                  {userRolesDraft.includes('barbeiro') && <Check className="w-4 h-4 text-blue-800" />}
                </div>

                {/* Cliente Option */}
                <div
                  onClick={() => toggleRoleInDraft('cliente')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    userRolesDraft.includes('cliente')
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                      : 'bg-[#f8f5ee] border-[#e2dcce] text-stone-700'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <UserIcon className="w-4 h-4 text-emerald-800" />
                    <div>
                      <p className="text-xs font-black text-stone-900">Cliente</p>
                      <p className="text-[10px] text-stone-600 font-semibold">Pode agendar e ver histórico pessoal</p>
                    </div>
                  </div>
                  {userRolesDraft.includes('cliente') && <Check className="w-4 h-4 text-emerald-800" />}
                </div>
              </div>
            </div>

            {/* Rodapé Fixo */}
            <div className="shrink-0 flex items-center justify-end space-x-3 px-6 py-4 border-t border-[#e2dcce] bg-white">
              <button
                type="button"
                onClick={() => setSelectedUserForRoles(null)}
                className="px-4 py-2.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveRoles}
                className="px-6 py-2.5 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs shadow-md transition-all"
              >
                Salvar Perfis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
