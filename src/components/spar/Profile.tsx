"use client";

import { useState } from 'react';
import { motion } from 'motion/react';
import { User, MessageSquarePlus, LogOut, MessageSquare } from 'lucide-react';
import SubjectDropdown from './SubjectDropdown';
import FieldMultiSelect from './FieldMultiSelect';
import type { ChatSession } from '@/types/chat';

type Props = {
  chatSessions: ChatSession[];
  currentChatId?: string | null;
  onNavigateToChat: () => void;
  onSelectChat: (id: string) => void;
  onLogout: () => void;
};

export default function Profile({ chatSessions, currentChatId = null, onNavigateToChat, onSelectChat, onLogout }: Props) {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [skipSubject, setSkipSubject] = useState(false);

  const history = chatSessions.map((s) => ({
    id: s.id,
    title: s.title || '(無題)',
    preview: s.messages?.[s.messages.length - 1]?.content ?? '...',
    time: (() => { try { return new Date(s.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return ''; } })(),
  }));

  return (
    <div className="w-full h-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl h-full flex flex-col backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl shadow-black/10 overflow-hidden p-8 before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none relative"
      >
        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between flex-shrink-0 mb-6">
            <div className="flex items-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} className="w-16 h-16 rounded-full backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/20 shadow-lg shadow-blue-500/10 flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </motion.div>
              <div>
                <h1 className="text-gray-800">ユーザー名</h1>
                <p className="text-gray-600">学習プロフィール</p>
              </div>
            </div>
            <motion.button onClick={onLogout} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="p-3 rounded-xl backdrop-blur-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-200 shadow-lg shadow-red-500/5 flex items-center gap-2 group">
              <LogOut className="w-4 h-4 text-red-600 group-hover:text-red-700" />
              <span className="text-red-600 group-hover:text-red-700 font-medium">ログアウト</span>
            </motion.button>
          </div>

          {/* Settings */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-6 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl shadow-black/5 space-y-6 flex-shrink-0 mb-6 relative z-50">
            <h2 className="text-gray-800">学習設定</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div className="space-y-4">
                <label className="block text-gray-700">教科選択</label>
                <SubjectDropdown value={selectedSubject} onChange={(v)=>{ setSelectedSubject(v); setSelectedFields([]); }} />
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <motion.button onClick={()=>{ const n = !skipSubject; setSkipSubject(n); if (n) setSelectedFields([]); }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${skipSubject ? 'border-blue-500 bg-blue-500' : 'border-gray-400 bg-transparent'}`}>{skipSubject && (<div className="w-2 h-2 bg-white rounded-full" />)}</div>
                    <span className="text-gray-700">この教科は勉強しない</span>
                  </motion.button>
                </div>
                <div className={skipSubject ? 'opacity-50 pointer-events-none' : ''}>
                  <FieldMultiSelect selectedFields={selectedFields} onFieldsChange={setSelectedFields} subject={selectedSubject} disabled={skipSubject} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Actions & History */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-center mb-6 flex-shrink-0">
              <motion.button onClick={onNavigateToChat} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-8 py-4 rounded-2xl backdrop-blur-xl bg-blue-500/20 border border-white/20 hover:bg-blue-500/30 transition-all duration-200 shadow-lg shadow-blue-500/10 flex items-center gap-3 text-blue-600">
                <MessageSquarePlus className="w-5 h-5" />
                <span>New Chat</span>
              </motion.button>
            </div>
            <div className="flex-1 min-h-0">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(4px)' }} animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.35, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] } }} className="h-full flex flex-col backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-lg shadow-black/5 before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none relative overflow-hidden">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.25, ease: [0.4, 0, 0.2, 1] } }} className="relative z-10 p-4 border-b border-white/10 flex-shrink-0">
                  <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider">チャット履歴</h3>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.3, delay: 0.3, ease: [0.4, 0, 0.2, 1] } }} className="relative z-10 flex-1 min-h-0 overflow-hidden">
                  <div className="h-full overflow-y-auto scrollbar-hide">
                    <div className="p-4 space-y-2">
                      {history.length > 0 ? (
                        history.map((item) => (
                          <motion.button key={item.id} onClick={()=>onSelectChat(item.id)} whileHover={{ y: -2 }} whileTap={{ y: 0 }} className={`w-full text-left p-3 rounded-xl backdrop-blur-xl border transition-all duration-200 ${currentChatId === item.id ? 'bg-blue-500/20 border-blue-500/30 shadow-lg shadow-blue-500/10' : 'bg-white/5 border-white/10 hover:bg-white/10 shadow-lg shadow-black/5'}`}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-800 truncate">{item.title}</div>
                                <div className="text-xs text-gray-500 truncate">{item.preview}</div>
                              </div>
                              <div className="text-[10px] text-gray-400 flex-shrink-0">{item.time}</div>
                            </div>
                          </motion.button>
                        ))
                      ) : (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } }} className="text-center py-12">
                          <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm text-gray-500">履歴はまだありません</p>
                          <p className="text-xs text-gray-400 mt-1">新しい会話を開始してください</p>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

