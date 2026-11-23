import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto flex max-w-md items-center gap-2.5 rounded-xl border-2 border-[#116D36] bg-[#111827] px-4 py-2.5 text-xs font-semibold text-white lg:bottom-4 lg:left-auto lg:right-4"
    >
      <WifiOff className="h-5 w-5 shrink-0 text-[#E8F3EC]" strokeWidth={2.2} />
      <span>Modo sin conexión · Los datos se guardan localmente.</span>
    </div>
  );
};
