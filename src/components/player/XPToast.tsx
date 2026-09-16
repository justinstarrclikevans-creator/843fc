'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface XPToastProps {
  xpAmount: number;
  label: string;
  onDone: () => void;
}

export default function XPToast({ xpAmount, label, onDone }: XPToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      >
        <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 text-white px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2">
          <span>+{xpAmount} XP!</span>
          <span className="font-medium opacity-90">{label}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
