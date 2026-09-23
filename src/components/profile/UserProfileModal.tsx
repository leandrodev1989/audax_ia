import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBarberData } from '../../context/BarberDataContext';
import {
  X,
  User as UserIcon,
  Phone,
  Mail,
  Shield,
  LogOut,
  Camera,
  CheckCircle2,
  Building,
  Clock,
  MapPin,
  Lock,
  Sparkles,
  AlertCircle,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUserProfile, updateUserCredentials, logout, activeRole, isOwner } = useAuth();
  const { settings, updateBarber, barbers } = useBarberData();

  const [activeTab, setActiveTab] = useState<'profile' | 'barbershop' | 'security'>('profile');

  // Personal fields
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    setIsUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
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
          setAvatar(dataUrl);
        }
        setIsUploadingAvatar(false);
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  // Barbershop settings (for owners)
  const [shopName, setShopName] = useState(settings?.name || 'Studio AUDAX Club');
  const [shopSlogan, setShopSlogan] = useState(settings?.slogan || 'Estilo & Tradição');
  const [shopPhone, setShopPhone] = useState(settings?.phone || '(81) 98144-6557');
  const [shopAddress, setShopAddress] = useState(settings?.address || 'Av. Principal, 1000 - Centro');
  const [openingTime, setOpeningTime] = useState(settings?.openingTime || '09:00');
  const [closingTime, setClosingTime] = useState(settings?.closingTime || '20:00');

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setEmail(currentUser.email || '');
      setAvatar(currentUser.avatar || '');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMessage(null);
      setSavedSuccess(false);
      setMessage(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validação de senha se foi digitada
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setErrorMessage('As senhas digitadas não coincidem. Digite a mesma senha nos dois campos.');
        return;
      }
    }

    // 1. Update personal profile in AuthContext
    const profileUpdate: any = { name, phone, email, avatar };
    if (newPassword) {
      profileUpdate.password = newPassword.trim();
    }
    updateUserProfile(profileUpdate);
    updateUserCredentials(currentUser.id, profileUpdate);

    // 2. If this user is also a barber in the system, update the barber record including photo
    const associatedBarber = barbers.find(
      (b) => b.userId === currentUser.id || b.name.toLowerCase().includes(currentUser.name.toLowerCase())
    );
    if (associatedBarber) {
      updateBarber(associatedBarber.id, {
        name,
        phone,
        photo: avatar,
      });
    }

    // 3. Sync directly with Supabase users table including avatar
    try {
      if (currentUser.id) {
        await supabase
          .from('users')
          .update({
            name,
            phone,
            email,
            avatar,
          })
          .or(`id.eq.${currentUser.id},email.eq.${currentUser.email}`);
      }
    } catch (err) {
      console.warn('Profile sync to supabase error:', err);
    }

    setSavedSuccess(true);
    setMessage(
      newPassword
        ? `Perfil e nova senha ("${newPassword.trim()}") atualizados com sucesso!`
        : 'Perfil e preferências atualizados com sucesso!'
    );
    setTimeout(() => {
      setSavedSuccess(false);
      setMessage(null);
      onClose();
    }, 1500);
  };

  const handleAvatarPreset = (seed: string) => {
    setAvatar(`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=a16a1c,f8f5ee`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[90vh] sm:max-h-[85vh] rounded-2xl border border-[#e2dcce] bg-white shadow-2xl text-stone-900 flex flex-col overflow-hidden">
        {/* Header Fixo */}
        <div className="shrink-0 flex items-center justify-between border-b border-[#e2dcce] px-6 py-4 bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-[#a16a1c]">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-stone-900">Gerenciar Meu Perfil</h2>
              <p className="text-xs text-stone-600 font-semibold">
                Informações da conta, credenciais e parâmetros da barbearia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Fixa */}
        <div className="shrink-0 flex items-center space-x-2 px-6 py-2.5 border-b border-[#e2dcce] bg-[#f8f5ee]">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-[#a16a1c] text-white shadow-xs'
                : 'text-stone-700 hover:text-stone-950 hover:bg-white'
            }`}
          >
            Dados Pessoais
          </button>

          {isOwner() && (
            <button
              onClick={() => setActiveTab('barbershop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'barbershop'
                  ? 'bg-[#a16a1c] text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-950 hover:bg-white'
              }`}
            >
              Minha Barbearia
            </button>
          )}

          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'security'
                ? 'bg-[#a16a1c] text-white shadow-xs'
                : 'text-stone-700 hover:text-stone-950 hover:bg-white'
            }`}
          >
            Segurança & Senha
          </button>
        </div>

        {/* Formulário com Corpo Rolável e Rodapé Fixo */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Corpo com Scroll para notebooks */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* TAB 1: PROFILE */}
            {activeTab === 'profile' && (
            <div className="space-y-4">
              <input
                type="file"
                ref={avatarInputRef}
                accept="image/*"
                onChange={handleAvatarFileUpload}
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-[#f8f5ee] border border-[#e2dcce]">
                <div className="relative group shrink-0">
                  <img
                    src={avatar || currentUser.avatar}
                    alt={currentUser.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#a16a1c] shadow-xs"
                  />
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#a16a1c] text-white hover:bg-[#8c5a15] shadow-md border-2 border-white transition-transform hover:scale-110"
                    title="Fazer Upload de Foto"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-base font-black text-stone-900">{currentUser.name}</h3>
                    {isOwner() && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        👑 Dono
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 font-semibold mt-0.5">{currentUser.email}</p>
                  
                  {/* Roles badges */}
                  <div className="flex flex-wrap gap-1 mt-2 justify-center sm:justify-start">
                    {currentUser.roles.map((r) => (
                      <span
                        key={r}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-stone-800 border border-stone-300"
                      >
                        Perfil: {r === 'dono' ? 'Barbeiro Dono' : r === 'barbeiro' ? 'Barbeiro' : 'Cliente'}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-[#a16a1c] hover:bg-[#8c5a15] text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload de Foto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAvatarPreset(currentUser.name)}
                      className="px-2 py-1 rounded-lg bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-[10px] font-bold"
                    >
                      Iniciais
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80')
                      }
                      className="px-2 py-1 rounded-lg bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-[10px] font-bold"
                    >
                      Exemplo 1
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAvatar('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80')
                      }
                      className="px-2 py-1 rounded-lg bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-[10px] font-bold"
                    >
                      Exemplo 2
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-900 block mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-900 block mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-900 block mb-1">
                  E-mail de Login
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-900 block mb-1">
                  URL da Foto (Avatar)
                </label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                />
              </div>
            </div>
          )}

          {/* TAB 2: BARBERSHOP SETTINGS */}
          {activeTab === 'barbershop' && isOwner() && (
            <div className="space-y-3.5">
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs font-semibold text-amber-950">
                👑 Como <strong>Barbeiro Dono</strong>, você pode personalizar os dados comerciais da sua barbearia para todos os clientes e barbeiros.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-900 block mb-1">
                    Nome da Barbearia
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-900 block mb-1">
                    Slogan / Subtítulo
                  </label>
                  <input
                    type="text"
                    value={shopSlogan}
                    onChange={(e) => setShopSlogan(e.target.value)}
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-900 block mb-1">
                    WhatsApp Comercial
                  </label>
                  <input
                    type="tel"
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-900 block mb-1">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-900 block mb-1">
                    Horário Abertura
                  </label>
                  <input
                    type="time"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-900 block mb-1">
                    Horário Fechamento
                  </label>
                  <input
                    type="time"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-[#f8f5ee] rounded-xl border border-[#e2dcce] text-xs font-semibold text-stone-700">
                Atualize sua senha de acesso. As senhas devem possuir pelo menos 6 caracteres.
              </div>

              <div>
                <label className="text-xs font-bold text-stone-900 block mb-1">
                  Nova Senha
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-900 block mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                />
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>{message || 'Dados salvos com sucesso!'}</span>
            </div>
          )}
        </div>

        {/* Rodapé Fixo - Sempre visível em notebooks */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-[#e2dcce] bg-white">
          <button
            type="button"
            onClick={() => {
              logout();
              onClose();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-800 hover:bg-rose-50 flex items-center space-x-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair da Conta (Logout)</span>
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs shadow-md transition-all"
          >
            Salvar Alterações
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};
