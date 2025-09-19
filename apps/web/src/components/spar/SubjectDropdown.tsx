"use client";

// _ui_sample の SubjectDropdown と同等機能（日本語コメント）
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, BookOpen } from 'lucide-react';
import { endpoints } from '@/lib/api/endpoints';
import { apiFetchJson } from '@/lib/http';
import { useAppJwt } from '@/components/providers/AppJwtProvider';

type Props = { value: string; onChange: (v: string) => void; disabled?: boolean };

type Subject = { id: string; name: string };

export default function SubjectDropdown({ value, onChange, disabled = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<Subject[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const selected = items.find(s => s.id === value);
  const { ready: appJwtReady } = useAppJwt();

  useEffect(() => {
    if (!appJwtReady) return;
    let aborted = false;
    const run = async () => {
      try {
        const data = await apiFetchJson<{ items?: Subject[] }>(endpoints.subjects());
        if (!aborted) setItems(data.items ?? []);
      } catch {}
    };
    run();
    return () => { aborted = true; };
  }, [appJwtReady]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
    if (isOpen) { document.addEventListener('mousedown', onDoc); return () => document.removeEventListener('mousedown', onDoc); }
  }, [isOpen]);

  return (
    <div ref={ref} className="relative z-50">
      <motion.button onClick={() => !disabled && setIsOpen(v=>!v)} disabled={disabled} whileHover={!disabled ? { scale: 1.02 } : {}} whileTap={!disabled ? { scale: 0.98 } : {}} className={`w-full p-4 rounded-2xl text-left backdrop-blur-xl border border-white/10 shadow-lg shadow-black/5 transition-all duration-200 flex items-center justify-between gap-3 ${disabled ? 'bg-white/2 text-gray-400 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10 text-gray-800'}`}>
        <div className="flex items-center gap-3">
          <BookOpen className={`w-4 h-4 ${disabled ? 'text-gray-400' : 'text-gray-600'}`} />
          <span>{selected ? selected.name : '教科を選択'}</span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className={`w-4 h-4 ${disabled ? 'text-gray-400' : 'text-gray-500'}`} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.2 }} className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden min-w-full z-[100]">
            {items.map(sub => (
              <button key={sub.id} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(sub.id); setIsOpen(false); }} className="w-full p-4 text-left hover:bg-blue-50 transition-all duration-200 text-gray-800 border-b border-gray-100 last:border-b-0 bg-white cursor-pointer focus:outline-none focus:bg-blue-50">
                {sub.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
