import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastState } from '../context/ToastContext';

export default function Toast() {
  const { toasts, removeToast } = useToastState() || { toasts: [], removeToast: () => {} };

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-warmwhite border-neem/40 text-indigo',
          icon: <CheckCircle2 className="w-5 h-5 text-neem shrink-0" />,
          accent: 'bg-neem',
        };
      case 'error':
        return {
          bg: 'bg-warmwhite border-saffron/40 text-indigo',
          icon: <AlertCircle className="w-5 h-5 text-saffron shrink-0" />,
          accent: 'bg-saffron',
        };
      case 'warning':
        return {
          bg: 'bg-warmwhite border-marigold/40 text-indigo',
          icon: <AlertTriangle className="w-5 h-5 text-marigold shrink-0" />,
          accent: 'bg-marigold',
        };
      default:
        return {
          bg: 'bg-indigo text-warmwhite border-marigold/30',
          icon: <Info className="w-5 h-5 text-marigold shrink-0" />,
          accent: 'bg-marigold',
        };
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 md:px-0">
      <AnimatePresence>
        {toasts.map((t) => {
          const style = getToastStyles(t.type);
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`pointer-events-auto relative overflow-hidden flex items-start gap-3 p-4 rounded-xl border shadow-warm ${style.bg}`}
            >
              {/* Left Color Indicator Strip */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${style.accent}`} />
              
              {style.icon}
              <p className="text-sm font-medium pr-6 pt-0.5 leading-snug">{t.message}</p>
              
              <button
                onClick={() => removeToast(t.id)}
                className="absolute right-2 top-2 p-1 rounded-lg hover:bg-black/5 text-indigo/60 hover:text-indigo transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
