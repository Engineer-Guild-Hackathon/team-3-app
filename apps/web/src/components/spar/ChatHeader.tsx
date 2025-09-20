"use client";

// 新UI: チャットヘッダ（_ui_sample と同一構造）
import { motion } from 'motion/react';
import { Bot, Circle, Timer, RefreshCw, CheckCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ASSISTANT_STATUS_META, type AssistantStatusKey } from '@/lib/chat/status';

type Props = {
  subject?: string;
  topic?: string;
  status?: AssistantStatusKey;
};

const STATUS_STYLES: Record<AssistantStatusKey, { className: string; icon: LucideIcon }> = {
  [-1]: {
    className: 'text-sky-700 bg-sky-500/15 border-sky-500/30 shadow-lg shadow-sky-500/20',
    icon: Timer,
  },
  [0]: {
    className: 'text-amber-700 bg-amber-500/15 border-amber-500/30 shadow-lg shadow-amber-500/20',
    icon: RefreshCw,
  },
  [1]: {
    className: 'text-emerald-700 bg-emerald-500/15 border-emerald-500/30 shadow-lg shadow-emerald-500/20',
    icon: CheckCircle2,
  },
};

export default function ChatHeader({ subject, topic, status }: Props) {
  const statusMeta = status != null ? ASSISTANT_STATUS_META[status] : undefined;
  const statusStyle = status != null ? STATUS_STYLES[status] : undefined;
  const StatusIcon = statusStyle?.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative p-6 rounded-3xl mb-6 backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg shadow-black/5 before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none"
    >
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-lg shadow-blue-500/10">
            <Bot className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-medium text-gray-800">Student AI</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Circle className="w-2 h-2 fill-green-500 text-green-500" />
              <span>Online</span>
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-2">
          {statusMeta && statusStyle && StatusIcon && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-xl transition-all duration-200 ${statusStyle.className}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              <span className="font-semibold tracking-wide">{statusMeta.label}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/20 border border-white/30">
            <span className="opacity-70">教科</span>
            <span className="font-medium text-gray-700">{subject || '未設定'}</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/20 border border-white/30">
            <span className="opacity-70">分野</span>
            <span className="font-medium text-gray-700">{topic || '未設定'}</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}
