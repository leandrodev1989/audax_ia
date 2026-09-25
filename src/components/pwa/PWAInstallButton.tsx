import React, { useState } from 'react';
import { Download, Smartphone, Check } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'sidebar' | 'inline';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'navbar',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, isStandalone, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If already installed and running standalone as PWA, hide the button
  if (isStandalone || isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'accepted') {
        return;
      }
      if (outcome === 'manual') {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      {variant === 'navbar' && (
        <button
          onClick={handleClick}
          id="navbar-pwa-install-btn"
          title="Instalar o aplicativo AUDAX no celular ou computador"
          className={`flex items-center space-x-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 px-3 py-1.5 text-xs font-black text-white shadow-xs hover:shadow-md transition-all active:scale-95 border border-amber-400/40 ${className}`}
        >
          <Smartphone className="h-3.5 w-3.5 text-amber-200 shrink-0 animate-pulse" />
          <span className="whitespace-nowrap">Instalar App</span>
        </button>
      )}

      {variant === 'sidebar' && (
        <div className={`rounded-xl border border-amber-300/80 bg-gradient-to-br from-amber-50 via-[#fcfaf6] to-[#f4eee2] p-3 shadow-2xs ${className}`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center space-x-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-amber-600 text-white shadow-2xs">
                <Smartphone className="h-3 w-3" />
              </span>
              <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                App no Celular
              </span>
            </div>
            <span className="text-[10px] font-extrabold bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded-full border border-amber-300">
              PWA
            </span>
          </div>
          <p className="text-[11px] text-stone-700 leading-tight mb-2.5">
            Instale na tela de início sem gastar memória da Play Store ou App Store.
          </p>
          <button
            onClick={handleClick}
            id="sidebar-pwa-install-btn"
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-[#a16a1c] hover:bg-[#8c5a15] text-white text-xs font-black shadow-xs transition-all active:scale-[0.98]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Instalar no Celular</span>
          </button>
        </div>
      )}

      {variant === 'inline' && (
        <button
          onClick={handleClick}
          id="inline-pwa-install-btn"
          className={`inline-flex items-center space-x-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-lg transition-colors ${className}`}
        >
          <Download className="h-3.5 w-3.5" />
          <span>Instalar Aplicativo</span>
        </button>
      )}

      {/* Modal with instructions */}
      <PWAInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isIOS={isIOS}
        isInstallable={isInstallable}
        onNativeInstall={async () => {
          setIsModalOpen(false);
          await install();
        }}
      />
    </>
  );
};
