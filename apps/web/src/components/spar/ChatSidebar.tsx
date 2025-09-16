"use client";

import { motion, AnimatePresence } from 'motion/react';
import { Plus, MessageSquare, ChevronLeft, ChevronRight, User, Pencil, Trash2 } from 'lucide-react';
import type { ChatSession as CoreSession } from "@/types/chat";

type Props = {
  sessions: CoreSession[];
  activeId?: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onRenameChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onNavigateToProfile?: () => void;
};

export default function ChatSidebar({ sessions, activeId, onSelectChat, onNewChat, onRenameChat, onDeleteChat, isExpanded, onToggleExpanded, onNavigateToProfile }: Props) {
  const chatSessions = sessions.map((s) => ({
    id: s.id,
    title: s.title || '(無題)',
    lastMessage: s.messages?.[s.messages.length - 1]?.content ?? '',
    timestamp: (() => { try { return new Date(s.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return ''; } })(),
  }));

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1, width: isExpanded ? 320 : 64 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative h-full flex flex-col backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl shadow-black/10 before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none overflow-hidden"
    >
      <div className="relative z-10 flex flex-col h-full">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <AnimatePresence>
              {isExpanded && (
                <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-lg font-medium text-gray-800">Chats</motion.h2>
              )}
            </AnimatePresence>
            <motion.button onClick={onToggleExpanded} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-8 h-8 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-200 flex items-center justify-center shadow-lg shadow-black/5">
              {isExpanded ? (<ChevronLeft className="w-4 h-4 text-gray-600" />) : (<ChevronRight className="w-4 h-4 text-gray-600" />)}
            </motion.button>
          </div>
        </div>

        <div className="p-4">
          <motion.button onClick={onNewChat} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} animate={{ paddingLeft: isExpanded ? '1.5rem' : '0.75rem', paddingRight: isExpanded ? '1.5rem' : '0.75rem', paddingTop: '0.75rem', paddingBottom: '0.75rem' }} transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }} className="w-full rounded-2xl backdrop-blur-xl bg-blue-500/20 border border-white/20 hover:bg-blue-500/30 transition-colors duration-200 shadow-lg shadow-blue-500/10 flex items-center justify-center gap-3 overflow-hidden">
            <Plus className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <AnimatePresence mode="wait">{isExpanded && (<motion.span key="new-chat-text" initial={{ opacity: 0, x: -10, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1, transition: { duration: 0.25, delay: 0.1, ease: [0.4, 0, 0.2, 1] } }} exit={{ opacity: 0, x: -10, scale: 0.9, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } }} className="text-blue-600 font-medium whitespace-nowrap">New chat</motion.span>)}</AnimatePresence>
          </motion.button>
        </div>

        <div className="flex-1 px-4 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div key="history-card" initial={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(4px)' }} animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.35, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] } }} exit={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(4px)', transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } }} className="flex-1 flex flex-col min-h-0 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-lg shadow-black/5 before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none relative overflow-hidden">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.25, ease: [0.4, 0, 0.2, 1] } }} exit={{ opacity: 0, y: -10, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } }} className="relative z-10 p-4 border-b border-white/10 flex-shrink-0">
                  <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider">履歴</h3>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.3, delay: 0.3, ease: [0.4, 0, 0.2, 1] } }} exit={{ opacity: 0, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } }} className="relative z-10 flex-1 min-h-0 overflow-hidden">
                  <div className="h-full overflow-y-auto scrollbar-hide">
                    <div className="p-2 space-y-2">
                      {chatSessions.length > 0 ? (
                        chatSessions.map((session) => (
                          <motion.div key={session.id} className="relative">
                            <motion.div
                              role="button"
                              tabIndex={0}
                              onClick={() => onSelectChat(session.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  onSelectChat(session.id);
                                }
                              }}
                              whileHover={{ y: -2 }}
                              whileTap={{ y: 0 }}
                              className={`group w-full text-left p-3 rounded-xl backdrop-blur-xl border transition-all duration-200 cursor-pointer ${activeId === session.id ? 'bg-blue-500/20 border-blue-500/30 shadow-lg shadow-blue-500/10' : 'bg-white/5 border-white/10 hover:bg-white/10 shadow-lg shadow-black/5'}`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-gray-800 truncate">{session.title}</div>
                                  <div className="text-xs text-gray-500 truncate">{session.lastMessage || '...'}</div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onRenameChat(session.id); }}
                                    className="p-1 rounded-lg hover:bg-white/30 text-gray-500"
                                    aria-label="チャット名を変更"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onDeleteChat(session.id); }}
                                    className="p-1 rounded-lg hover:bg-red-100 text-red-500"
                                    aria-label="チャットを削除"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="text-[10px] text-gray-400 flex-shrink-0 group-hover:hidden">{session.timestamp}</div>
                              </div>
                            </motion.div>
                          </motion.div>
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
            ) : (
              <motion.div key="history-collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.3, delay: 0.15, ease: [0.4, 0, 0.2, 1] } }} exit={{ opacity: 0, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } }} className="flex-1 flex flex-col justify-start space-y-2 overflow-y-auto scrollbar-hide">
                {chatSessions.length > 0 && chatSessions.map((session) => (
                  <motion.button key={session.id} onClick={() => onSelectChat(session.id)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`w-8 h-8 rounded-xl flex-shrink-0 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-200 shadow-lg shadow-black/5 flex items-center justify-center ${activeId === session.id ? 'bg-blue-500/20 border-blue-500/30' : 'bg-white/5'}`}>
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {onNavigateToProfile && (
          <div className="p-4 flex-shrink-0">
            <motion.button onClick={onNavigateToProfile} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} animate={{ paddingLeft: isExpanded ? '1rem' : '0.75rem', paddingRight: isExpanded ? '1rem' : '0.75rem', paddingTop: '0.75rem', paddingBottom: '0.75rem' }} transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }} className="w-full rounded-2xl backdrop-blur-xl bg-gray-500/10 border border-white/20 hover:bg-gray-500/20 transition-colors duration-200 shadow-lg shadow-gray-500/5 flex items-center justify-center gap-3 overflow-hidden">
              <User className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <AnimatePresence mode="wait">{isExpanded && (<motion.span key="profile-text" initial={{ opacity: 0, x: -10, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1, transition: { duration: 0.25, delay: 0.1, ease: [0.4, 0, 0.2, 1] } }} exit={{ opacity: 0, x: -10, scale: 0.9, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } }} className="text-gray-600 font-medium whitespace-nowrap">プロフィール</motion.span>)}</AnimatePresence>
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
