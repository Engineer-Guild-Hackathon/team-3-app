import { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { User } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

interface ChatbotProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onNavigateToProfile?: () => void;
  isLoading?: boolean;
}

export function Chatbot({ messages, onSendMessage, onNavigateToProfile, isLoading = false }: ChatbotProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="
        w-full h-full flex flex-col
        backdrop-blur-xl bg-white/5 border border-white/10
        rounded-3xl shadow-2xl shadow-black/10
        overflow-hidden
        before:absolute before:inset-0 before:rounded-3xl
        before:bg-gradient-to-br before:from-white/5 before:to-transparent
        before:pointer-events-none relative
      "
    >
      <div className="relative z-10 flex flex-col h-full">
        <div className="p-6 pb-0">
          <ChatHeader />
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 py-4 scroll-smooth">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.text}
              isUser={message.isUser}
              timestamp={message.timestamp}
            />
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex justify-start mb-4"
            >
              <div className="max-w-[70%] flex flex-col">
                <div className="
                  relative px-6 py-4 rounded-3xl
                  backdrop-blur-xl bg-white/10 border border-white/20
                  shadow-lg shadow-black/5
                  before:absolute before:inset-0 before:rounded-3xl
                  before:bg-gradient-to-br before:from-white/10 before:to-transparent
                  before:pointer-events-none
                ">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[...Array(3)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-gray-500 rounded-full"
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: i * 0.2,
                              ease: "easeInOut"
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-gray-600 text-sm">AIが返答を考えています...</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-6 pt-4">
          <ChatInput onSendMessage={onSendMessage} />
        </div>
      </div>
    </motion.div>
  );
}