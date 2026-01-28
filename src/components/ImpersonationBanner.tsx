import { useState, useEffect } from 'react';
import { Eye, X } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';

interface ImpersonationInfo {
  userId: string;
  userEmail: string;
  expiresIn: number;
}

export function ImpersonationBanner() {
  const [impersonation, setImpersonation] = useState<ImpersonationInfo | null>(null);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const stored = sessionStorage.getItem('impersonating');
    if (stored) {
      try {
        setImpersonation(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem('impersonating');
      }
    }
  }, []);

  const handleExit = () => {
    sessionStorage.removeItem('impersonating');
    logout();
    window.location.href = '/admin/users';
  };

  if (!impersonation) {
    return null;
  }

  return (
    <div className="fixed left-0 right-0 top-0 z-50 bg-yellow-500 px-4 py-2">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-yellow-900">
          <Eye className="h-4 w-4" />
          <span>
            Viewing as <strong>{impersonation.userEmail}</strong>
          </span>
        </div>
        <button
          onClick={handleExit}
          className="flex items-center gap-1.5 rounded bg-yellow-600 px-3 py-1 text-sm font-medium text-white hover:bg-yellow-700"
        >
          <X className="h-3.5 w-3.5" />
          Exit Impersonation
        </button>
      </div>
    </div>
  );
}
