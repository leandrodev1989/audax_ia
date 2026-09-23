import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Scissors,
  Crown,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ArrowRight,
  Shield,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, register, recoverPassword, resetPassword } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'recover'>('login');

  // Input states — NOT pre-filled, strictly clean as requested by user
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register fields (Strictly for clients; barbers are created only by the Barbeiro Dono)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Recover fields (2-step interactive password reset)
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverStep, setRecoverStep] = useState<'email' | 'new_password'>('email');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail de acesso.');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor, digite sua senha de acesso.');
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password);
      setLoading(false);

      if (result.success) {
        setSuccessMessage(result.message);
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(result.message);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage('Erro ao autenticar. Tente novamente.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName.trim() || !regEmail.trim() || !regPhone.trim()) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword,
      });

      setLoading(false);
      if (result.success) {
        setSuccessMessage('Conta cadastrada com sucesso! Entrando no sistema...');
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(result.message);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage('Erro ao cadastrar conta. Tente novamente.');
    }
  };

  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!recoverEmail.trim()) {
      setErrorMessage('Digite seu e-mail para recuperar a senha.');
      return;
    }

    const res = recoverPassword(recoverEmail.trim());
    if (res.success) {
      setRecoverStep('new_password');
      setSuccessMessage(res.message);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    const res = resetPassword(recoverEmail.trim(), newPassword);

    if (res.success) {
      setSuccessMessage(res.message);
      const loginRes = await login(recoverEmail.trim(), newPassword);
      setLoading(false);
      if (loginRes.success) {
        if (onSuccess) onSuccess();
      } else {
        setMode('login');
        setEmail(recoverEmail.trim());
        setPassword(newPassword);
      }
    } else {
      setLoading(false);
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f2eb] text-stone-900 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Subtle Warm Background Ambiance */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#a16a1c]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-stone-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-gradient-to-br from-[#b47d28] via-[#a16a1c] to-[#875313] shadow-lg shadow-amber-900/10 mb-3">
            <Scissors className="w-8 h-8 text-white stroke-[2.5]" />
            <Crown className="w-4 h-4 text-amber-200 fill-amber-200 -ml-1 -mt-4" />
          </div>
          <h1 className="font-display text-2xl font-black tracking-wider text-stone-900">
            STUDIO <span className="text-[#a16a1c]">AUDAX</span>
          </h1>
          <p className="text-xs text-stone-700 font-medium mt-1">
            Plataforma Integrada de Gestão & Agendamentos
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border border-[#e2dcce] bg-white/95 backdrop-blur-md p-6 sm:p-7 shadow-xl space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#f4efe4] border border-[#e2dcce] text-xs font-bold">
            <button
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2.5 rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-[#a16a1c] text-white font-bold shadow-xs'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              Entrar na Conta
            </button>
            <button
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2.5 rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-[#a16a1c] text-white font-bold shadow-xs'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 font-medium animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1.5">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Digite seu e-mail cadastrado"
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl pl-9 pr-3 py-2.5 text-xs text-stone-900 font-medium placeholder:text-stone-500 focus:outline-none focus:border-[#a16a1c] transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-stone-900">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('recover');
                      setErrorMessage(null);
                    }}
                    className="text-[11px] font-bold text-[#a16a1c] hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Digite sua senha"
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl pl-9 pr-10 py-2.5 text-xs text-stone-900 font-medium placeholder:text-stone-500 focus:outline-none focus:border-[#a16a1c] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 mt-2"
              >
                <span>{loading ? 'Validando acesso...' : 'Entrar no Sistema'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* MODE: REGISTER (Clientes) */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Informative banner about Barber access rule */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 font-medium flex items-start space-x-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#a16a1c]" />
                <span className="text-[11px] leading-relaxed">
                  O auto-cadastro é para <strong>Clientes</strong>. O acesso de <strong>Barbeiro</strong> é criado e gerenciado exclusivamente pelo <strong>Barbeiro Dono</strong> no painel de gestão.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 font-medium placeholder:text-stone-500 focus:outline-none focus:border-[#a16a1c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="seu.email@exemplo.com"
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 font-medium placeholder:text-stone-500 focus:outline-none focus:border-[#a16a1c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1">
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="(81) 98888-7777"
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 font-medium placeholder:text-stone-500 focus:outline-none focus:border-[#a16a1c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1">
                  Criar Senha de Acesso
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl pl-9 pr-10 py-2 text-xs text-stone-900 font-medium placeholder:text-stone-500 focus:outline-none focus:border-[#a16a1c]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 mt-2"
              >
                <span>{loading ? 'Cadastrando...' : 'Criar Conta de Cliente'}</span>
              </button>
            </form>
          )}

          {/* MODE: RECOVER PASSWORD */}
          {mode === 'recover' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-sm font-bold text-stone-900">Recuperação e Redefinição de Senha</h3>
                <p className="text-xs text-stone-700 font-medium mt-1">
                  {recoverStep === 'email'
                    ? 'Informe seu e-mail para verificar a conta cadastrada.'
                    : 'Conta verificada! Digite sua nova senha de acesso abaixo.'}
                </p>
              </div>

              {recoverStep === 'email' ? (
                <form onSubmit={handleVerifyEmail} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-900 mb-1">
                      E-mail Cadastrado
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={recoverEmail}
                        onChange={(e) => {
                          setRecoverEmail(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="seu.email@exemplo.com"
                        className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl pl-9 pr-3 py-2.5 text-xs text-stone-900 font-medium placeholder:text-stone-500 focus:outline-none focus:border-[#a16a1c]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs transition-all flex items-center justify-center space-x-1.5 shadow-md"
                  >
                    <span>Verificar E-mail para Redefinição</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3.5">
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 font-medium">
                    <span className="truncate">E-mail: <strong>{recoverEmail}</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        setRecoverStep('email');
                        setErrorMessage(null);
                      }}
                      className="text-[11px] font-bold text-[#a16a1c] underline hover:text-[#8c5a15] shrink-0 ml-2"
                    >
                      Alterar
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-900 mb-1">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo de 6 caracteres"
                        className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl pl-9 pr-10 py-2.5 text-xs text-stone-900 font-medium placeholder:text-stone-500 focus:outline-none focus:border-[#a16a1c]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-900 mb-1">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Digite a mesma senha"
                        className="w-full bg-[#f8f5ee] border border-[#e2dcce] rounded-xl pl-9 pr-3 py-2.5 text-xs text-stone-900 font-medium placeholder:text-stone-500 focus:outline-none focus:border-[#a16a1c]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs transition-all flex items-center justify-center space-x-1.5 shadow-md"
                  >
                    <span>{loading ? 'Salvando...' : 'Salvar Nova Senha e Entrar'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setRecoverStep('email');
                  setErrorMessage(null);
                }}
                className="w-full text-center text-xs font-semibold text-stone-700 hover:text-stone-950 pt-1"
              >
                Voltar para o Login
              </button>
            </div>
          )}
        </div>

        {/* Security / RBAC badge footer */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-stone-700 font-medium flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#a16a1c]" />
            <span>Acesso Seguro com Controle de Permissões RBAC (Dono, Barbeiro, Cliente)</span>
          </p>
        </div>
      </div>
    </div>
  );
};
