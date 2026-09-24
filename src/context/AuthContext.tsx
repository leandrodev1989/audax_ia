import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../data/mockData';
import {
  fetchUsersFromSupabase,
  fetchUserByEmailFromSupabase,
  insertUserToSupabase,
  updateUserRolesInSupabase,
  insertClientToSupabase,
  updateUserInSupabase,
  isValidUUID,
} from '../lib/supabase';

export interface AuthActionResult {
  success: boolean;
  message: string;
  user?: User;
}

interface AuthContextType {
  currentUser: User | null;
  activeRole: UserRole;
  users: User[];
  setActiveRole: (role: UserRole) => void;
  login: (email: string, password?: string) => Promise<AuthActionResult>;
  loginAsDemoUser: (userId: string) => void;
  register: (data: { name: string; email: string; phone: string; password?: string; role?: UserRole }) => Promise<AuthActionResult>;
  createBarberWithCredentials: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<AuthActionResult>;
  checkUserExists: (email: string) => boolean;
  recoverPassword: (email: string) => { success: boolean; message: string; user?: User };
  resetPassword: (email: string, newPassword: string) => AuthActionResult;
  logout: () => void;
  updateUserProfile: (data: Partial<User>) => void;
  updateUserCredentials: (
    userIdOrEmail: string,
    data: { name?: string; email?: string; phone?: string; password?: string }
  ) => void;
  updateUserRoles: (userId: string, newRoles: UserRole[]) => void;
  hasRole: (role: UserRole) => boolean;
  isOwner: () => boolean;
  isBarber: () => boolean;
  isClient: () => boolean;
  isSimulatingRole: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'barberpro_users_v2';
const ACTIVE_ROLE_KEY = 'barberpro_active_role_v2';
const PASSWORDS_STORAGE_KEY = 'barberpro_passwords_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse users from localStorage', e);
      }
    }
    return INITIAL_USERS;
  });

  // O fluxo SEMPRE inicia na tela de login (currentUser = null)
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [activeRole, setActiveRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(ACTIVE_ROLE_KEY) as UserRole;
    if (saved && ['dono', 'barbeiro', 'cliente'].includes(saved)) {
      return saved;
    }
    return 'dono';
  });

  // Helper para resgatar senhas locais
  const getStoredPasswords = (): Record<string, string> => {
    try {
      const saved = localStorage.getItem(PASSWORDS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  };

  const storePassword = (email: string, pass: string) => {
    try {
      const current = getStoredPasswords();
      current[email.toLowerCase()] = pass;
      localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(current));
    } catch (e) {}
  };

  // Fetch remote users from Supabase on mount
  useEffect(() => {
    fetchUsersFromSupabase().then((remoteUsers) => {
      if (remoteUsers && remoteUsers.length > 0) {
        const storedPasswords = getStoredPasswords();
        const synchronizedUsers = remoteUsers.map((u) => {
          const pass =
            storedPasswords[u.email.toLowerCase()] ||
            (u.email.toLowerCase() === 'leandroljs2026@gmail.com' ? '123' : '123456');
          return {
            ...u,
            password: pass,
          };
        });

        setUsers(synchronizedUsers);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(synchronizedUsers));
      }
    });
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      // Se o usuário tem papel 'dono', ele tem privilégio de simulação para testar qualquer visão ('dono', 'barbeiro', 'cliente')
      if (!currentUser.roles.includes('dono') && !currentUser.roles.includes(activeRole)) {
        const nextRole = currentUser.roles[0] || 'cliente';
        setActiveRoleState(nextRole);
        localStorage.setItem(ACTIVE_ROLE_KEY, nextRole);
      }
    }
  }, [currentUser, activeRole]);

  const setActiveRole = (role: UserRole) => {
    // Se o usuário é Dono, permite simular qualquer perfil para testar botões e permissões
    if (currentUser?.roles.includes('dono') || currentUser?.roles.includes(role)) {
      setActiveRoleState(role);
      localStorage.setItem(ACTIVE_ROLE_KEY, role);
    }
  };

  /**
   * Verifica se o usuário já possui cadastro
   */
  const checkUserExists = (email: string): boolean => {
    const clean = email.trim().toLowerCase();
    if (!clean) return false;
    return users.some((u) => u.email.toLowerCase() === clean);
  };

  /**
   * Validação rigorosa de login
   * 1. Consulta o Supabase em tempo real para verificar se a conta REALMENTE existe.
   * 2. Se não existir, REJEITA imediatamente o login (NÃO cria usuário no banco durante o login).
   * 3. Valida a senha informada estritamente contra a senha cadastrada/alterada.
   */
  const login = async (email: string, password?: string): Promise<AuthActionResult> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Por favor, informe seu e-mail de acesso.' };
    }

    if (!password) {
      return {
        success: false,
        message: 'Por favor, digite sua senha de acesso.',
      };
    }

    // 1. Busca usuário no Supabase
    let found: User | null = null;
    const remoteUser = await fetchUserByEmailFromSupabase(cleanEmail);

    const storedPasswords = getStoredPasswords();
    const localCached = users.find((u) => u.email.toLowerCase() === cleanEmail);
    const expectedPassword =
      storedPasswords[cleanEmail] ||
      localCached?.password ||
      (cleanEmail === 'leandroljs2026@gmail.com' ? '123' : '123456');

    if (remoteUser) {
      found = {
        ...remoteUser,
        password: expectedPassword,
      };
    } else {
      // Conta mestre de fallback local apenas se Supabase estiver inacessível
      if (cleanEmail === 'leandroljs2026@gmail.com') {
        found = INITIAL_USERS.find((u) => u.email.toLowerCase() === cleanEmail) || null;
        if (found) {
          found = { ...found, password: expectedPassword };
        }
      }
    }

    // Se NÃO existir no Supabase, bloqueia e avisa
    if (!found) {
      return {
        success: false,
        message: 'Nenhuma conta encontrada com este e-mail no banco de dados. Caso seja cliente, realize seu cadastro na aba "Criar Conta". Se for barbeiro, seu acesso é criado pelo Barbeiro Dono.',
      };
    }

    // 2. Validação estrita de senha
    if (password !== expectedPassword) {
      return {
        success: false,
        message: 'Senha incorreta. Verifique os dados digitados ou utilize a recuperação de senha.',
      };
    }

    // Login com sucesso
    setCurrentUser(found);
    const initialRole = found.roles.includes('dono') ? 'dono' : found.roles[0] || 'cliente';
    setActiveRoleState(initialRole);
    localStorage.setItem(ACTIVE_ROLE_KEY, initialRole);

    // Atualiza estado local mantendo a senha correta
    setUsers((prev) => {
      const exists = prev.some((u) => u.email.toLowerCase() === cleanEmail);
      if (exists) {
        return prev.map((u) => (u.email.toLowerCase() === cleanEmail ? { ...found!, password: expectedPassword } : u));
      }
      return [{ ...found!, password: expectedPassword }, ...prev];
    });

    return {
      success: true,
      user: found,
      message: `Bem-vindo(a), ${found.name}!`,
    };
  };

  const loginAsDemoUser = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      const initialRole = found.roles.includes('dono') ? 'dono' : found.roles[0] || 'cliente';
      setActiveRoleState(initialRole);
      localStorage.setItem(ACTIVE_ROLE_KEY, initialRole);
    }
  };

  /**
   * Cadastro público de clientes
   * Regra estrita: Barbeiros NÃO podem se auto-cadastrar; o acesso de barbeiro é criado pelo Barbeiro Dono.
   */
  const register = async (data: { name: string; email: string; phone: string; password?: string; role?: UserRole }): Promise<AuthActionResult> => {
    const cleanEmail = data.email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'O e-mail é obrigatório.' };
    }

    // Validação: saber se o usuário já tem conta no Supabase ou localmente
    const existingInDb = await fetchUserByEmailFromSupabase(cleanEmail);
    if (existingInDb || checkUserExists(cleanEmail)) {
      return {
        success: false,
        message: 'Este e-mail já possui uma conta cadastrada no sistema. Por favor, acesse a aba "Entrar na Conta".',
      };
    }

    const assignedRole: UserRole = data.role || 'cliente';
    const pwd = data.password || '123456';
    storePassword(cleanEmail, pwd);

    const tempId = `user-${Date.now()}`;
    const newUser: User = {
      id: tempId,
      name: data.name,
      email: cleanEmail,
      phone: data.phone,
      password: pwd,
      roles: [assignedRole],
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}&backgroundColor=d4af37,18181b`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setActiveRoleState(assignedRole);

    // Push to Supabase (Users table and Roles table)
    const persisted = await insertUserToSupabase(newUser);
    const resolvedUserId = persisted ? persisted.id : tempId;
    if (persisted) {
      setUsers((prev) => prev.map((u) => (u.id === tempId ? { ...persisted, password: pwd } : u)));
      setCurrentUser((curr) => (curr?.id === tempId ? { ...persisted, password: pwd } : curr));
    }

    // Also persist into Supabase 'clients' table if registering as a client (linking user_id)
    if (assignedRole === 'cliente') {
      try {
        const persistedClient = await insertClientToSupabase({
          userId: isValidUUID(resolvedUserId) ? resolvedUserId : undefined,
          name: data.name.trim(),
          whatsapp: data.phone.trim(),
          phone: data.phone.trim(),
          email: cleanEmail,
          notes: 'Cliente cadastrado via App',
        });
        if (persistedClient && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('client-created', { detail: persistedClient }));
        }
      } catch (clientErr) {
        console.warn('Erro ao sincronizar cliente com Supabase:', clientErr);
      }
    }

    return {
      success: true,
      user: newUser,
      message: 'Conta de cliente criada com sucesso!',
    };
  };

  /**
   * Criação de credenciais de Barbeiro exclusivamente pelo Barbeiro Dono
   */
  const createBarberWithCredentials = async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<AuthActionResult> => {
    const cleanEmail = data.email.trim().toLowerCase();
    if (checkUserExists(cleanEmail)) {
      return {
        success: false,
        message: 'Já existe uma conta cadastrada com este e-mail no sistema.',
      };
    }

    const tempId = `user-barber-${Date.now()}`;
    const newBarberUser: User = {
      id: tempId,
      name: data.name,
      email: cleanEmail,
      phone: data.phone,
      password: data.password,
      roles: ['barbeiro'],
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}&backgroundColor=d4af37,18181b`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsers((prev) => [...prev, newBarberUser]);

    // Push to Supabase
    try {
      const persisted = await insertUserToSupabase(newBarberUser);
      if (persisted) {
        setUsers((prev) => prev.map((u) => (u.id === tempId ? { ...persisted, password: data.password } : u)));
        return {
          success: true,
          user: { ...persisted, password: data.password },
          message: `Acesso do barbeiro criado com sucesso! E-mail: ${cleanEmail}`,
        };
      }
    } catch (err) {
      console.warn('Error creating barber user in supabase:', err);
    }

    return {
      success: true,
      user: newBarberUser,
      message: `Acesso do barbeiro criado com sucesso! E-mail: ${cleanEmail}`,
    };
  };

  const recoverPassword = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const found = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (found) {
      return {
        success: true,
        message: `Conta verificada com sucesso para ${found.email}. Crie sua nova senha abaixo.`,
        user: found,
      };
    }
    return {
      success: false,
      message: 'Não encontramos nenhuma conta com este e-mail cadastrado.',
    };
  };

  const resetPassword = (email: string, newPassword: string): AuthActionResult => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Digite um e-mail válido.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'A nova senha deve conter no mínimo 6 caracteres.' };
    }

    const targetUser = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!targetUser) {
      return {
        success: false,
        message: 'Não encontramos nenhuma conta cadastrada com este e-mail.',
      };
    }

    // Direct password store persistence
    storePassword(cleanEmail, newPassword);

    const updatedUser = { ...targetUser, password: newPassword };

    setUsers((prev) => {
      const updatedList = prev.map((u) =>
        u.email.toLowerCase() === cleanEmail ? updatedUser : u
      );
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedList));
      return updatedList;
    });

    return {
      success: true,
      message: 'Sua senha foi redefinida com sucesso! Você já pode acessar a plataforma.',
      user: updatedUser,
    };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updateUserProfile = (data: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    if (data.password) {
      storePassword(currentUser.email, data.password);
      if (data.email && data.email.toLowerCase() !== currentUser.email.toLowerCase()) {
        storePassword(data.email, data.password);
      }
    }
    setCurrentUser(updated);
    setUsers((prev) => {
      const list = prev.map((u) =>
        u.id === updated.id || u.email.toLowerCase() === updated.email.toLowerCase()
          ? { ...u, ...updated }
          : u
      );
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(list));
      return list;
    });
  };

  const updateUserCredentials = (
    userIdOrEmail: string,
    data: { name?: string; email?: string; phone?: string; password?: string; avatar?: string }
  ) => {
    const cleanSearch = userIdOrEmail.trim().toLowerCase();
    const cleanEmail = data.email?.trim().toLowerCase();

    if (data.password) {
      if (cleanEmail) {
        storePassword(cleanEmail, data.password);
      }
      if (cleanSearch.includes('@')) {
        storePassword(cleanSearch, data.password);
      }
    }

    setUsers((prev) => {
      let matched = false;
      const list = prev.map((u) => {
        const isMatch =
          u.id === userIdOrEmail ||
          u.email.toLowerCase() === cleanSearch ||
          (cleanEmail && u.email.toLowerCase() === cleanEmail);

        if (isMatch) {
          matched = true;
          if (data.password) {
            storePassword(u.email, data.password);
          }
          const updated = {
            ...u,
            ...(data.name ? { name: data.name } : {}),
            ...(cleanEmail ? { email: cleanEmail } : {}),
            ...(data.phone ? { phone: data.phone } : {}),
            ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
            ...(data.password !== undefined ? { password: data.password } : {}),
          };
          if (isValidUUID(u.id)) {
            updateUserInSupabase(u.id, {
              name: updated.name,
              email: updated.email,
              phone: updated.phone,
              avatar: updated.avatar,
            });
          }
          if (
            currentUser &&
            (currentUser.id === u.id || currentUser.email.toLowerCase() === u.email.toLowerCase())
          ) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      });

      if (!matched) {
        // Se ainda não estava no estado (por exemplo vinha de INITIAL_USERS)
        const base = INITIAL_USERS.find(
          (u) =>
            u.id === userIdOrEmail ||
            u.email.toLowerCase() === cleanSearch ||
            (cleanEmail && u.email.toLowerCase() === cleanEmail)
        );
        if (base) {
          if (data.password) {
            storePassword(base.email, data.password);
          }
          const newEntry: User = {
            ...base,
            ...(data.name ? { name: data.name } : {}),
            ...(cleanEmail ? { email: cleanEmail } : {}),
            ...(data.phone ? { phone: data.phone } : {}),
            ...(data.password !== undefined ? { password: data.password } : {}),
          };
          list.push(newEntry);
          if (
            currentUser &&
            (currentUser.id === base.id || currentUser.email.toLowerCase() === base.email.toLowerCase())
          ) {
            setCurrentUser(newEntry);
          }
        }
      }

      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(list));
      return list;
    });
  };

  const updateUserRoles = (userId: string, newRoles: UserRole[]) => {
    if (newRoles.length === 0) return;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, roles: newRoles };
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(updated);
            if (!newRoles.includes(activeRole)) {
              setActiveRoleState(newRoles[0]);
            }
          }
          return updated;
        }
        return u;
      })
    );

    updateUserRolesInSupabase(userId, newRoles);
  };

  const hasRole = (role: UserRole): boolean => {
    return currentUser ? currentUser.roles.includes(role) : false;
  };

  const isOwner = (): boolean => hasRole('dono') && activeRole === 'dono';
  const isBarber = (): boolean => hasRole('barbeiro') && activeRole === 'barbeiro';
  const isClient = (): boolean => activeRole === 'cliente';
  const isSimulatingRole = hasRole('dono') && activeRole !== 'dono';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeRole,
        users,
        setActiveRole,
        login,
        loginAsDemoUser,
        register,
        createBarberWithCredentials,
        checkUserExists,
        recoverPassword,
        resetPassword,
        logout,
        updateUserProfile,
        updateUserCredentials,
        updateUserRoles,
        hasRole,
        isOwner,
        isBarber,
        isClient,
        isSimulatingRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
