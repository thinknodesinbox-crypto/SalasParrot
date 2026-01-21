import toast from 'react-hot-toast';

/**
 * Show a sync started toast with a spinning icon
 */
export function showSyncToast(title: string, message: string) {
  return toast(
    <div className="flex items-center gap-3">
      <svg className="h-5 w-5 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm opacity-90">{message}</p>
      </div>
    </div>,
    { duration: 5000 }
  );
}

/**
 * Show a success toast
 */
export function showSuccessToast(title: string, message?: string) {
  return toast.success(
    <div>
      <p className="font-medium">{title}</p>
      {message && <p className="text-sm opacity-90">{message}</p>}
    </div>
  );
}

/**
 * Show an error toast
 */
export function showErrorToast(title: string, message?: string) {
  return toast.error(
    <div>
      <p className="font-medium">{title}</p>
      {message && <p className="text-sm opacity-90">{message}</p>}
    </div>
  );
}

/**
 * Show an info toast
 */
export function showInfoToast(title: string, message?: string) {
  return toast(
    <div>
      <p className="font-medium">{title}</p>
      {message && <p className="text-sm opacity-90">{message}</p>}
    </div>,
    { icon: 'ℹ️' }
  );
}

// Re-export toast for direct usage
export { toast };
