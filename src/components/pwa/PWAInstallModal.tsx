import React from 'react';
import { Smartphone, Share2, PlusSquare, CheckCircle2, X, Download, ShieldCheck, Zap } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  onNativeInstall?: () => void;
  isInstallable: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  onNativeInstall,
  isInstallable,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-2xl bg-[#1c1917] border border-[#a16a1c]/40 text-stone-100 shadow-2xl p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800/80 transition-colors"
          title="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* App Icon & Header */}
        <div className="flex items-center space-x-3.5 mb-5">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-950 p-0.5 shadow-lg border border-amber-400/40 flex items-center justify-center shrink-0">
            <img 
              src="/icon.svg" 
              alt="AUDAX" 
              className="h-full w-full rounded-2xl object-cover"
              onError={(e) => {
                // Fallback to icon
                (e.currentTarget as HTMLElement).style.display = 'none';
              }} 
            />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="text-lg font-bold text-white tracking-wide">Instalar AUDAX</h3>
              <span className="text-[10px] uppercase font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">PWA</span>
            </div>
            <p className="text-xs text-stone-300">App direto no seu celular como nativo</p>
          </div>
        </div>

        {/* Benefits Badges */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-stone-900/80 border border-stone-800 text-center">
            <Zap className="h-4 w-4 text-amber-400 mb-1" />
            <span className="text-[11px] font-bold text-stone-200">Acesso Rápido</span>
            <span className="text-[9px] text-stone-400">1 toque na tela</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-stone-900/80 border border-stone-800 text-center">
            <Smartphone className="h-4 w-4 text-amber-400 mb-1" />
            <span className="text-[11px] font-bold text-stone-200">Tela Cheia</span>
            <span className="text-[9px] text-stone-400">Sem barra do browser</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-stone-900/80 border border-stone-800 text-center">
            <ShieldCheck className="h-4 w-4 text-amber-400 mb-1" />
            <span className="text-[11px] font-bold text-stone-200">Sem Loja</span>
            <span className="text-[9px] text-stone-400">0 MB da Play/Apple</span>
          </div>
        </div>

        {/* Platform-specific instructions */}
        {isIOS ? (
          <div className="space-y-3.5 bg-stone-900/90 border border-amber-500/30 rounded-xl p-4">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center">
              <Smartphone className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
              Como instalar no iPhone ou iPad (Safari):
            </p>
            <ol className="space-y-2.5 text-xs text-stone-300">
              <li className="flex items-start space-x-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px]">1</span>
                <span>Toque no botão <strong className="text-white inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 bg-stone-800 rounded border border-stone-700"><Share2 className="h-3 w-3 text-sky-400 inline" /> Compartilhar</strong> na barra do Safari (na parte inferior).</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px]">2</span>
                <span>Role para baixo e selecione <strong className="text-white inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 bg-stone-800 rounded border border-stone-700"><PlusSquare className="h-3 w-3 text-amber-400 inline" /> Adicionar à Tela de Início</strong>.</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px]">3</span>
                <span>Toque em <strong className="text-amber-400 font-bold">Adicionar</strong> no canto superior direito para confirmar. Pronto!</span>
              </li>
            </ol>
          </div>
        ) : isInstallable ? (
          <div className="space-y-3">
            <p className="text-xs text-stone-300">
              Seu dispositivo suporta instalação direta com 1 clique. Clique no botão abaixo para adicionar o app à sua tela inicial:
            </p>
            <button
              onClick={() => {
                if (onNativeInstall) {
                  onNativeInstall();
                }
              }}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-900/30 transition-all active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              <span>Instalar Aplicativo Agora</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3.5 bg-stone-900/90 border border-stone-800 rounded-xl p-4">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center">
              <Smartphone className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
              Como instalar no Android (Chrome):
            </p>
            <ol className="space-y-2.5 text-xs text-stone-300">
              <li className="flex items-start space-x-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px]">1</span>
                <span>Toque nos <strong>três pontinhos (⋮)</strong> no canto superior direito do navegador.</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px]">2</span>
                <span>Selecione <strong className="text-white">"Instalar aplicativo"</strong> ou <strong className="text-white">"Adicionar à tela inicial"</strong>.</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px]">3</span>
                <span>Confirme a instalação. O ícone da AUDAX aparecerá na tela do seu celular!</span>
              </li>
            </ol>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-stone-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-[11px] text-stone-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Compatível com iOS, Android e Desktop</span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-bold text-stone-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-stone-800 transition-colors"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};
