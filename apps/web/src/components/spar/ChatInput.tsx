"use client";

// 新UI: 送信欄（_ui_sample と同一構造、IME対応）
import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send } from 'lucide-react';

type Props = { onSendMessage: (message: string) => void; disabled?: boolean };

export default function ChatInput({ onSendMessage, disabled }: Props) {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isComposing && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (isComposing) return;
      if (e.shiftKey) return;
      e.preventDefault();
      if (message.trim() && !disabled) {
        onSendMessage(message.trim());
        setMessage('');
      }
    }
  };

  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = () => setIsComposing(false);

  // Auto-resize textarea（高さを一旦 auto にして scrollHeight を反映）
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const maxHeight = 120; // px
    const newHeight = Math.min(ta.scrollHeight, maxHeight);
    ta.style.height = `${newHeight}px`;
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
          disabled={disabled}
          className="w-full px-6 py-4 pr-14 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 placeholder-gray-500 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 focus:bg-white/15 transition-all duration-200 shadow-lg shadow-black/5 resize-none overflow-hidden disabled:opacity-50"
          style={{ lineHeight: '1.5', minHeight: '56px', maxHeight: '120px', fontFamily: 'inherit' }}
        />
        <motion.button
          type="submit"
          disabled={!message.trim() || isComposing || !!disabled}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="absolute right-3 bottom-3 w-8 h-8 rounded-full bg-blue-500/80 hover:bg-blue-500 disabled:bg-gray-400/50 disabled:cursor-not-allowed backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all duration-200 shadow-lg shadow-blue-500/20"
        >
          <Send className="w-4 h-4 text-white" />
        </motion.button>
      </div>
    </form>
  );
}
