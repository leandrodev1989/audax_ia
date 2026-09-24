import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBarberData } from '../../context/BarberDataContext';
import {
  Eye,
  Crown,
  Scissors,
  UserCheck,
  ArrowLeft,
  SlidersHorizontal,
  ShieldAlert,
  Sparkles,
  Database,
} from 'lucide-react';

interface FloatingSimulationBannerProps {
  onOpenVisibilityManager?: () => void;
}

export const FloatingSimulationBanner: React.FC<FloatingSimulationBannerProps> = ({
  onOpenVisibilityManager,
}) => {
  const { currentUser, activeRole, setActiveRole } = useAuth();
  const { isFeatureVisibleForRole } = useBarberData();

  // Show banner only if the user is a Dono simulating another role (or has switched to cliente/barbeiro)
  const isOwnerSimulating = currentUser?.roles.includes('dono') && activeRole !== 'dono';

  if (!isOwnerSimulating) return null;

  const roleName = activeRole === 'barbeiro' ? 'Barbeiro' : 'Cliente';
  const roleColor = activeRole === 'barbeiro' ? 'bg-blue-600' : 'bg-emerald-600';

  const aiVisible = isFeatureVisibleForRole('aiBooking', activeRole);
  const supabaseVisible = isFeatureVisibleForRole('supabaseStatus', activeRole);
  const testProfilesVisible = isFeatureVisibleForRole('testProfiles', activeRole);

  return (
    <aside
      aria-label="Barra de Simulação de Perfil Ativa"
      className="sticky top-16 z-30 border-b border-amber-400/60 bg-gradient-to-r from-stone-900 via-[#2d2215] to-stone-900 text-amber-100 px-4 py-2.5 shadow-md backdrop-blur-sm"
    >
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center space-x-2.5 flex-wrap justify-center sm:justify-start">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-black text-[11px] animate-pulse">
            <Eye className="w-3.5 h-3.5" />
            MODO SIMULAÇÃO ATIVO
          </span>
          <span className="text-stone-300 font-medium">
            Você é o <strong>Dono</strong> visualizando a interface como{' '}
            <span className={`px-2 py-0.5 rounded text-white font-black text-[11px] ${roleColor}`}>
              {roleName}
            </span>
          </span>

          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-stone-700 text-[11px] text-stone-300">
            <span>Botões liberados:</span>
            <span className={`px-1.5 py-0.2 rounded font-bold ${aiVisible ? 'text-emerald-400' : 'text-stone-500 line-through'}`}>
              IA: {aiVisible ? 'Sim' : 'Não'}
            </span>
            <span className={`px-1.5 py-0.2 rounded font-bold ${supabaseVisible ? 'text-emerald-400' : 'text-stone-500 line-through'}`}>
              Supabase: {supabaseVisible ? 'Sim' : 'Não'}
            </span>
            <span className={`px-1.5 py-0.2 rounded font-bold ${testProfilesVisible ? 'text-emerald-400' : 'text-stone-500 line-through'}`}>
              Testar Perfis: {testProfilesVisible ? 'Sim' : 'Não'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {activeRole !== 'barbeiro' && (
            <button
              onClick={() => setActiveRole('barbeiro')}
              className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
            >
              <Scissors className="w-3 h-3 text-blue-400" />
              <span>Ver como Barbeiro</span>
            </button>
          )}

          {activeRole !== 'cliente' && (
            <button
              onClick={() => setActiveRole('cliente')}
              className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
            >
              <UserCheck className="w-3 h-3 text-emerald-400" />
              <span>Ver como Cliente</span>
            </button>
          )}

          {onOpenVisibilityManager && (
            <button
              onClick={() => {
                setActiveRole('dono');
                onOpenVisibilityManager();
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-900 text-amber-200 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 transition-colors"
              title="Voltar para a visão do Dono e abrir a Governança"
            >
              <SlidersHorizontal className="w-3 h-3 text-amber-300" />
              <span>Governança (Voltar ao Dono)</span>
            </button>
          )}

          <button
            onClick={() => setActiveRole('dono')}
            id="exit-simulation-return-dono-btn"
            className="px-3 py-1 rounded-lg bg-[#b47d28] hover:bg-[#a16a1c] text-stone-950 font-black text-[11px] flex items-center gap-1.5 shadow-xs transition-all hover:scale-105"
          >
            <Crown className="w-3.5 h-3.5 text-stone-950" />
            <span>Voltar ao Painel do Dono</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
