import { motion } from 'motion/react';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: string;
}

export function ChatMessage({ message, isUser, timestamp }: ChatMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className="max-w-[70%] flex flex-col">
        <div
          className={`
            relative px-6 py-4 rounded-3xl
            ${isUser 
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25 border border-blue-600/30' 
              : 'backdrop-blur-xl bg-white/10 text-gray-800 shadow-lg shadow-black/5 border border-white/20'
            }
            ${!isUser ? 
              'before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none' : 
              ''
            }
          `}
        >
          <div className="relative z-10">
            <p className="text-sm leading-relaxed">{message}</p>
          </div>
        </div>
        <span className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {timestamp}
        </span>
      </div>
    </motion.div>
  );
}