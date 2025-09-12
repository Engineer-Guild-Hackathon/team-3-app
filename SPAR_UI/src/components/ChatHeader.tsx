import { motion } from 'motion/react';
import { Bot, Circle } from 'lucide-react';

export function ChatHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="
        relative p-6 rounded-3xl mb-6
        backdrop-blur-xl bg-white/10 border border-white/20
        shadow-lg shadow-black/5
        before:absolute before:inset-0 before:rounded-3xl
        before:bg-gradient-to-br before:from-white/10 before:to-transparent
        before:pointer-events-none
      "
    >
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="
            w-12 h-12 rounded-2xl
            bg-gradient-to-br from-blue-500/20 to-purple-500/20
            backdrop-blur-xl border border-white/20
            flex items-center justify-center
            shadow-lg shadow-blue-500/10
          ">
            <Bot className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-medium text-gray-800">AI Assistant</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Circle className="w-2 h-2 fill-green-500 text-green-500" />
              <span>Online</span>
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          iOS 26 • Liquid Glass
        </div>
      </div>
    </motion.div>
  );
}