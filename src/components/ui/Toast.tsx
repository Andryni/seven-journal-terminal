import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Config ───────────────────────────────────────────────────────────────────

const VARIANT_CONFIG: Record<ToastVariant, {
  icon: React.FC<{ className?: string }>;
  bg: string;
  border: string;
  iconColor: string;
  bar: string;
}> = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-[#0d1a12]',
    border: 'border-emerald-500/40',
    iconColor: 'text-emerald-400',
    bar: 'bg-emerald-500',
  },
  error: {
    icon: XCircle,
    bg: 'bg-[#1a0d0d]',
    border: 'border-red-500/40',
    iconColor: 'text-red-400',
    bar: 'bg-red-500',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-[#1a160d]',
    border: 'border-amber-500/40',
    iconColor: 'text-amber-400',
    bar: 'bg-amber-500',
  },
  info: {
    icon: Info,
    bg: 'bg-[#0d0f1a]',
    border: 'border-indigo-500/40',
    iconColor: 'text-indigo-400',
    bar: 'bg-indigo-500',
  },
};

// ─── Single Toast Item ─────────────────────────────────────────────────────────

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const cfg = VARIANT_CONFIG[toast.variant];
  const Icon = cfg.icon;
  const duration = toast.duration ?? 4000;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.88, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={`relative flex items-start gap-3 w-80 rounded-xl border ${cfg.bg} ${cfg.border} px-4 py-3.5 shadow-2xl backdrop-blur-xl overflow-hidden cursor-pointer`}
      onClick={() => onRemove(toast.id)}
    >
      {/* Glow background */}
      <div className={`absolute inset-0 opacity-5 ${cfg.bar}`} />

      {/* Icon */}
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.iconColor}`} />

      {/* Message */}
      <p className="flex-1 text-sm font-medium text-slate-100 leading-snug pr-1">
        {toast.message}
      </p>

      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(toast.id); }}
        className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress bar */}
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 ${cfg.bar} opacity-70`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const toast = useCallback((message: string, variant: ToastVariant = 'info', duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev.slice(-4), { id, message, variant, duration }]);
    const timer = setTimeout(() => remove(id), duration);
    timers.current.set(id, timer);
  }, [remove]);

  const value: ToastContextValue = {
    toast,
    success: (msg) => toast(msg, 'success'),
    error: (msg) => toast(msg, 'error'),
    warning: (msg) => toast(msg, 'warning'),
    info: (msg) => toast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-24 md:bottom-6 right-4 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onRemove={remove} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
