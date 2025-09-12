import { motion } from 'motion/react';
import { MessageSquare, Clock } from 'lucide-react';

interface HistoryItemProps {
  title: string;
  timestamp: string;
  onClick: () => void;
}

export function HistoryItem({ title, timestamp, onClick }: HistoryItemProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
      whileTap={{ scale: 0.98 }}
      className="
        w-full p-4 rounded-2xl text-left
        backdrop-blur-xl bg-white/5 border border-white/10
        hover:bg-white/10 transition-all duration-200
        shadow-lg shadow-black/5
        min-h-[4rem] flex items-start
      "
    >
      <div className="flex items-start gap-3">
        <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-gray-800 truncate mb-1">
            {title}
          </p>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-400" />
            <p className="text-xs text-gray-500">
              {timestamp}
            </p>
          </div>
        </div>
      </div>
    </motion.button>
  );
}