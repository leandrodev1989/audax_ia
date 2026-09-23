import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Scissors,
  Crown,
  KeyRound,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Shield,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register' | 'recover';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
}) => {
  const { login, register, recoverPassword, resetPassword, loginAsDemoUser, users } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'recover'>(defaultMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('cliente');

  // Recover fields
  const [recoverStep, setRecoverStep] = useState<'email' | 'new_password'>('email');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Por favor, informe seu e-mail e senha.');
      return;
    }

    try {
      const result = await login(email, password);
      if (result.success) {
        setSuccessMsg('Login realizado com sucesso!');
        setTimeout(() => {
          onClose();
        }, 700);
      } else {
        setErrorMsg(result.message || 'E-mail ou senha incorretos.');
      }
    } catch (err: any) {
      setErrorMsg('Erro na autenticação. Tente novamente.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name || !email || !phone) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      const result = await register({ name, email, phone, role });
      if (result.success) {
        setSuccessMsg('Conta criada com sucesso! Seja bem-vindo ao Studio AUDAX.');
        setTimeout(() => {
          onClose();
        }, 700);
      } else {
        setErrorMsg(result.message);
      }
    } catch (err: any) {
      setErrorMsg('Erro ao cadastrar. Tente novamente.');
    }
  };

  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Informe o seu e-mail cadastrado.');
      return;
    }

    const result = recoverPassword(email.trim());
    if (result.success) {
      setRecoverStep('new_password');
      setSuccessMsg(result.message);
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }

    const result = resetPassword(email.trim(), newPassword);
    if (result.success) {
      setSuccessMsg(result.message);
      const loginRes = await login(email.trim(), newPassword);
      if (loginRes.success) {
        setTimeout(() => {
          onClose();
        }, 700);
      } else {
        setMode('login');
      }
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-[#e2dcce] bg-white p-6 shadow-2xl text-stone-900 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e2dcce] pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-[#a16a1c]">
              <Scissors className="w-4 h-4" />
            </div>
            <span className="font-display font-black text-stone-900 text-base">
              Studio <span className="text-[#a16a1c]">AUDAX</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers: Login, Cadastro, Recuperar */}
        <div className="flex border-b border-[#e2dcce] mt-4 text-xs font-bold">
          <button
            onClick={() => {
              setMode('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 text-center border-b-2 transition-all ${
              mode === 'login'
                ? 'border-[#a16a1c] text-[#a16a1c]'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => {
              setMode('register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 text-center border-b-2 transition-all ${
              mode === 'register'
                ? 'border-[#a16a1c] text-[#a16a1c]'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Criar Conta
          </button>
          <button
            onClick={() => {
              setMode('recover');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 text-center border-b-2 transition-all ${
              mode === 'recover'
                ? 'border-[#a16a1c] text-[#a16a1c]'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Recuperar Senha
          </button>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Forms */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="mt-4 space-y-3.5">
            <div>
              <label className="text-xs font-bold text-stone-900 block mb-1">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="joao.dono@barberpro.com"
                  className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl pl-9 pr-3 py-2 text-sm text-stone-900 font-medium placeholder:text-stone-500 focus:outline-none focus:border-[#a16a1c]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-900">Senha</label>
                <button
                  type="button"
                  onClick={() => setMode('recover')}
                  className="text-[11px] font-bold text-[#a16a1c] hover:underline"
                >
                  Esqueceu?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl pl-9 pr-3 py-2 text-sm text-stone-900 font-medium placeholder:text-stone-500 focus:outline-none focus:border-[#a16a1c]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs shadow-md transition-all mt-2"
            >
              Acessar Sistema
            </button>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-bold text-stone-900 block mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Pedro Henrique"
                className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-sm text-stone-900 font-medium placeholder:text-stone-500 focus:outline-none focus:border-[#a16a1c]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-900 block mb-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-sm text-stone-900 font-medium placeholder:text-stone-500 focus:outline-none focus:border-[#a16a1c]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-900 block mb-1">WhatsApp</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-sm text-stone-900 font-medium placeholder:text-stone-500 focus:outline-none focus:border-[#a16a1c]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-900 block mb-1">Perfil Inicial</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl px-3 py-2 text-xs text-stone-900 font-medium focus:outline-none focus:border-[#a16a1c]"
              >
                <option value="cliente">Cliente (Agendamentos e Histórico)</option>
                <option value="barbeiro">Barbeiro Profissional (Agenda e Comissões)</option>
                <option value="dono">Barbeiro Dono (Gestão Geral)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs shadow-md transition-all mt-3"
            >
              Criar Minha Conta
            </button>
          </form>
        )}

        {mode === 'recover' && (
          <div className="mt-4 space-y-3.5">
            {recoverStep === 'email' ? (
              <form onSubmit={handleVerifyEmail} className="space-y-3.5">
                <p className="text-xs text-stone-700 font-medium leading-relaxed">
                  Informe seu e-mail cadastrado para verificar sua conta e redefinir sua senha.
                </p>
                <div>
                  <label className="text-xs font-bold text-stone-900 block mb-1">E-mail Cadastrado</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl pl-9 pr-3 py-2 text-sm text-stone-900 font-medium placeholder:text-stone-500 focus:outline-none focus:border-[#a16a1c]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs shadow-md transition-all"
                >
                  Verificar E-mail para Redefinição
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <p className="text-xs text-emerald-800 font-bold">
                  Conta verificada: {email}. Digite a nova senha desejada:
                </p>
                <div>
                  <label className="text-xs font-bold text-stone-900 block mb-1">Nova Senha</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl pl-9 pr-3 py-2 text-sm text-stone-900 font-medium placeholder:text-stone-500 focus:outline-none focus:border-[#a16a1c]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-900 block mb-1">Confirmar Nova Senha</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl pl-9 pr-3 py-2 text-sm text-stone-900 font-medium placeholder:text-stone-500 focus:outline-none focus:border-[#a16a1c]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs shadow-md transition-all"
                >
                  Salvar Nova Senha e Entrar
                </button>
              </form>
            )}
          </div>
        )}

        {/* Quick Demo Switcher Box */}
        <div className="mt-6 pt-4 border-t border-[#e2dcce]">
          <div className="flex items-center space-x-1.5 text-[#a16a1c] mb-2.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-black text-stone-900 uppercase tracking-wider">
              Acesso Rápido de Teste (RBAC)
            </span>
          </div>
          <p className="text-[11px] text-stone-600 font-medium mb-3">
            Clique em qualquer perfil abaixo para testar instantaneamente suas permissões e telas:
          </p>

          <div className="grid grid-cols-2 gap-2">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  loginAsDemoUser(u.id);
                  onClose();
                }}
                className="p-2 rounded-xl bg-[#f8f5ee] hover:bg-[#eae3d5] border border-[#e2dcce] text-left transition-all group"
              >
                <p className="text-xs font-bold text-stone-900 group-hover:text-[#a16a1c] truncate">
                  {u.name}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {u.roles.map((r) => (
                    <span
                      key={r}
                      className="text-[9px] px-1.5 py-0.2 rounded bg-white text-stone-800 border border-stone-300 font-bold"
                    >
                      {r === 'dono' ? '👑 Dono' : r === 'barbeiro' ? '✂️ Barbeiro' : '👤 Cliente'}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
