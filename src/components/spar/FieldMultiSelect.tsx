"use client";

// _ui_sample の FieldMultiSelect と同等機能（日本語コメント）
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus } from 'lucide-react';

type Props = {
  selectedFields: string[];
  onFieldsChange: (fields: string[]) => void;
  subject: string;
  disabled?: boolean;
};

type Field = { id: string; name: string };

const fieldsBySubject: Record<string, Field[]> = {
  math: [ { id: 'algebra', name: '代数' }, { id: 'geometry', name: '幾何' }, { id: 'calculus', name: '微積分' }, { id: 'statistics', name: '統計' } ],
  english: [ { id: 'grammar', name: '文法' }, { id: 'reading', name: '読解' }, { id: 'writing', name: 'ライティング' }, { id: 'listening', name: 'リスニング' } ],
  science: [ { id: 'physics', name: '物理' }, { id: 'chemistry', name: '化学' }, { id: 'biology', name: '生物' }, { id: 'earth', name: '地学' } ],
  japanese: [ { id: 'modern', name: '現代文' }, { id: 'classical', name: '古典' }, { id: 'writing', name: '作文' }, { id: 'kanji', name: '漢字' } ],
  social: [ { id: 'history', name: '歴史' }, { id: 'geography', name: '地理' }, { id: 'civics', name: '公民' }, { id: 'economics', name: '経済' } ],
  programming: [ { id: 'javascript', name: 'JavaScript' }, { id: 'python', name: 'Python' }, { id: 'react', name: 'React' }, { id: 'algorithms', name: 'アルゴリズム' } ],
};

export default function FieldMultiSelect({ selectedFields, onFieldsChange, subject, disabled = false }: Props) {
  const available = fieldsBySubject[subject] || [];
  const toggle = (id: string) => {
    if (disabled) return;
    onFieldsChange(selectedFields.includes(id) ? selectedFields.filter(x=>x!==id) : [...selectedFields, id]);
  };
  const selectedObjs = selectedFields.map(id => available.find(f => f.id === id)).filter(Boolean) as Field[];

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {selectedObjs.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-wrap gap-2">
            <AnimatePresence>
              {selectedObjs.map(f => (
                <motion.div key={f.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-xl border border-white/20 shadow-lg shadow-blue-500/10 transition-all duration-200 ${disabled ? 'bg-blue-500/10 text-gray-400' : 'bg-blue-500/20 text-blue-700'}`}>
                  <span className="text-sm">{f.name}</span>
                  {!disabled && (
                    <motion.button onClick={() => toggle(f.id)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-4 h-4 rounded-full bg-blue-500/20 hover:bg-blue-500/30 flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`p-4 rounded-2xl backdrop-blur-xl border border-white/10 shadow-lg shadow-black/5 transition-all duration-200 ${disabled ? 'bg-white/2' : 'bg-white/5'}`}>
        {!subject ? (
          <p className="text-gray-500 text-center py-4">教科を選択してください</p>
        ) : available.length === 0 ? (
          <p className="text-gray-500 text-center py-4">この教科の分野が見つかりません</p>
        ) : (
          <div className="space-y-2">
            <label className={`block ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>分野を選択（複数選択可）</label>
            <div className="grid grid-cols-2 gap-2">
              {available.map(field => {
                const on = selectedFields.includes(field.id);
                return (
                  <motion.button key={field.id} onClick={() => toggle(field.id)} disabled={disabled} whileHover={!disabled ? { scale: 1.02 } : {}} whileTap={!disabled ? { scale: 0.98 } : {}} className={`p-3 rounded-xl text-left backdrop-blur-xl border border-white/10 transition-all duration-200 flex items-center gap-2 ${disabled ? 'bg-white/2 text-gray-400 cursor-not-allowed' : on ? 'bg-blue-500/20 border-blue-500/30 text-blue-700' : 'bg-white/5 hover:bg-white/10 text-gray-700'}`}>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${disabled ? 'border-gray-400' : on ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`}>
                      {on && (<Plus className="w-3 h-3 text-white rotate-45" />)}
                    </div>
                    <span className="text-sm">{field.name}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

