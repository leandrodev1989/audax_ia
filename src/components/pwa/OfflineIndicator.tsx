import React from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div 
      id="pwa-offline-indicator"
      className="fixed bottom-4 left-4 z-50 flex items-center space-x-2.5 rounded-xl bg-stone-900 border border-amber-500/40 px-3.5 py-2 text-xs font-bold text-amber-200 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom duration-300"
    >
      <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
      <WifiOff className="h-4 w-4 text-amber-400 shrink-0" />
      <span>Modo Offline — O app continua funcionando com dados locais em cache.</span>
    </div>
  );
};
