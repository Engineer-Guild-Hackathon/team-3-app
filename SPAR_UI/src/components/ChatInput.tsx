import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

export function ChatInput({ onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isComposing) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (isComposing) {
        // IME入力中は何もしない（文字確定を優先）
        return;
      }
      
      if (e.shiftKey) {
        // Shift+Enter: allow new line (default behavior)
        return;
      } else {
        // Enter only: send message
        e.preventDefault();
        if (message.trim()) {
          onSendMessage(message.trim());
          setMessage('');
        }
      }
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // 基準となる高さを設定
      const baseHeight = 56; // padding: 16px(top) + 16px(bottom) + line-height
      const lineHeight = 24; // 1.5 * 16px
      
      // 一時的に高さをリセットして正確なscrollHeightを取得
      textarea.style.height = `${baseHeight}px`;
      
      // 実際のコンテンツ高さを計算
      const scrollHeight = textarea.scrollHeight;
      
      // 改行の数を計算
      const lineCount = message.split('\n').length;
      
      // スクロールが必要な場合、または実際に複数行の場合のみリサイズ
      if (scrollHeight > baseHeight || lineCount > 1) {
        const maxHeight = 120; // 最大5行程度
        const newHeight = Math.min(scrollHeight, maxHeight);
        textarea.style.height = `${newHeight}px`;
      } else {
        // 単一行の場合は基準高さを維持
        textarea.style.height = `${baseHeight}px`;
      }
    }
  }, [message]);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder="Type a message... (Shift+Enter for new line)"
          className="
            w-full px-6 py-4 pr-14 rounded-3xl
            backdrop-blur-xl bg-white/10 border border-white/20
            placeholder-gray-500 text-gray-800
            focus:outline-none focus:ring-2 focus:ring-blue-500/50
            focus:border-blue-500/30 focus:bg-white/15
            transition-all duration-200
            shadow-lg shadow-black/5
            resize-none overflow-hidden
          "
          style={{
            lineHeight: '1.5',
            minHeight: '56px',
            maxHeight: '120px',
            height: '56px', // 初期高さを明示的に設定
            fontFamily: 'inherit',
          }}
        />
        <motion.button
          type="submit"
          disabled={!message.trim() || isComposing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="
            absolute right-3 bottom-3
            w-8 h-8 rounded-full
            bg-blue-500/80 hover:bg-blue-500
            disabled:bg-gray-400/50 disabled:cursor-not-allowed
            backdrop-blur-xl border border-white/20
            flex items-center justify-center
            transition-all duration-200
            shadow-lg shadow-blue-500/20
          "
        >
          <Send className="w-4 h-4 text-white" />
        </motion.button>
      </div>
    </form>
  );
}