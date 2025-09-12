import { useState } from 'react';
import { Chatbot, Message } from './components/Chatbot';
import { ChatSidebar } from './components/ChatSidebar';
import { Profile } from './components/Profile';
import { LoginScreen } from './components/LoginScreen';

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messages: Message[];
}

const initialMessages: Message[] = [
  {
    id: '1',
    text: 'Hello! I\'m your AI assistant. How can I help you today?',
    isUser: false,
    timestamp: '2:30 PM'
  },
  {
    id: '2',
    text: 'Hi! Can you tell me about the new iOS 26 features?',
    isUser: true,
    timestamp: '2:31 PM'
  },
  {
    id: '3',
    text: 'iOS 26 introduces the revolutionary Liquid Glass design system with advanced glassmorphism effects, fluid animations, and enhanced AR integration. The interface feels more organic and responsive than ever before!',
    isUser: false,
    timestamp: '2:31 PM'
  }
];

const botResponses = [
  "That's a great question! Let me think about that...",
  "I'd be happy to help you with that. Here's what I know:",
  "Interesting! From my perspective, I think:",
  "That's a fascinating topic. In my experience:",
  "I understand what you're asking. Here's my take:",
  "Great point! I've been thinking about this too:",
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<'profile' | 'chat'>('profile');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: '1',
      title: 'iOS 26 Features Discussion',
      lastMessage: 'iOS 26 introduces the revolutionary Liquid Glass...',
      timestamp: '2:31 PM',
      messages: initialMessages
    },
    {
      id: '2',
      title: 'React Development Best Practices',
      lastMessage: 'Let me explain the most important React patterns...',
      timestamp: '1:15 PM',
      messages: [
        {
          id: '1',
          text: 'Hello! I\'m your AI assistant. How can I help you today?',
          isUser: false,
          timestamp: '1:15 PM'
        }
      ]
    },
    {
      id: '3',
      title: 'Machine Learning Fundamentals',
      lastMessage: 'Machine learning is a subset of artificial intelligence...',
      timestamp: '12:45 PM',
      messages: [
        {
          id: '1',
          text: 'Hello! I\'m your AI assistant. How can I help you today?',
          isUser: false,
          timestamp: '12:45 PM'
        }
      ]
    },
    {
      id: '4',
      title: 'TypeScript Advanced Types',
      lastMessage: 'Let me explain some advanced TypeScript concepts...',
      timestamp: '11:30 AM',
      messages: [
        {
          id: '1',
          text: 'Hello! I\'m your AI assistant. How can I help you today?',
          isUser: false,
          timestamp: '11:30 AM'
        }
      ]
    },
    {
      id: '5',
      title: 'Web Performance Optimization',
      lastMessage: 'Here are some key strategies for improving web performance...',
      timestamp: '10:20 AM',
      messages: [
        {
          id: '1',
          text: 'Hello! I\'m your AI assistant. How can I help you today?',
          isUser: false,
          timestamp: '10:20 AM'
        }
      ]
    },
    {
      id: '6',
      title: 'Database Design Principles',
      lastMessage: 'Good database design is crucial for application performance...',
      timestamp: '9:15 AM',
      messages: [
        {
          id: '1',
          text: 'Hello! I\'m your AI assistant. How can I help you today?',
          isUser: false,
          timestamp: '9:15 AM'
        }
      ]
    },
    {
      id: '7',
      title: 'CSS Grid and Flexbox Mastery',
      lastMessage: 'Let me help you understand the differences between Grid and Flexbox...',
      timestamp: 'Yesterday',
      messages: [
        {
          id: '1',
          text: 'Hello! I\'m your AI assistant. How can I help you today?',
          isUser: false,
          timestamp: 'Yesterday'
        }
      ]
    },
    {
      id: '8',
      title: 'API Design Best Practices',
      lastMessage: 'RESTful API design follows several important principles...',
      timestamp: 'Yesterday',
      messages: [
        {
          id: '1',
          text: 'Hello! I\'m your AI assistant. How can I help you today?',
          isUser: false,
          timestamp: 'Yesterday'
        }
      ]
    }
  ]);
  const [currentChatId, setCurrentChatId] = useState<string>('1');

  const currentChat = chatSessions.find(chat => chat.id === currentChatId);

  const handleSendMessage = (text: string) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp
    };

    // Update current chat with new message
    setChatSessions(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { 
            ...chat, 
            messages: [...chat.messages, userMessage],
            lastMessage: text,
            timestamp 
          }
        : chat
    ));

    // Start loading
    setIsLoading(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponses[Math.floor(Math.random() * botResponses.length)],
        isUser: false,
        timestamp
      };
      
      setChatSessions(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { 
              ...chat, 
              messages: [...chat.messages, botResponse],
              lastMessage: botResponse.text,
              timestamp 
            }
          : chat
      ));

      // Stop loading
      setIsLoading(false);
    }, 2000); // Increased delay to better see the loading state
  };

  const handleNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat: ChatSession = {
      id: newChatId,
      title: 'New Chat',
      lastMessage: 'Hello! I\'m your AI assistant. How can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [
        {
          id: '1',
          text: 'Hello! I\'m your AI assistant. How can I help you today?',
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    
    setChatSessions(prev => [newChat, ...prev]);
    setCurrentChatId(newChatId);
    setCurrentView('chat');
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setCurrentView('chat');
  };

  const handleNavigateToChat = () => {
    setCurrentView('chat');
  };

  const handleNavigateToHistoryItem = (itemId: string) => {
    // Here you would navigate to the specific chat item
    // For now, we'll just switch to chat view
    setCurrentView('chat');
  };

  const handleNavigateToProfile = () => {
    setCurrentView('profile');
  };

  const handleToggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  const handleGoogleLogin = () => {
    // Simulate Google login
    setIsLoggedIn(true);
    setCurrentView('profile');
  };

  const handleLogout = () => {
    // Reset all state
    setIsLoggedIn(false);
    setCurrentView('profile');
    setIsLoading(false);
    // Optionally reset other states like chat sessions if needed
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="relative z-10 h-full flex gap-4 p-4">
        {!isLoggedIn ? (
          <div className="flex-1 h-full">
            <LoginScreen onGoogleLogin={handleGoogleLogin} />
          </div>
        ) : (
          <>
            {currentView === 'chat' && (
              <div className="flex gap-4 w-full h-full">
                {/* Sidebar */}
                <div className="h-full flex-shrink-0">
                  <ChatSidebar
                    chatSessions={chatSessions}
                    currentChatId={currentChatId}
                    onSelectChat={handleSelectChat}
                    onNewChat={handleNewChat}
                    onNavigateToProfile={handleNavigateToProfile}
                    isExpanded={isSidebarExpanded}
                    onToggleExpanded={handleToggleSidebar}
                  />
                </div>
                
                {/* Main Chat Area */}
                <div className="flex-1 h-full min-w-0">
                  {currentChat && (
                    <Chatbot
                      messages={currentChat.messages}
                      onSendMessage={handleSendMessage}
                      isLoading={isLoading}
                    />
                  )}
                </div>
              </div>
            )}

            {currentView === 'profile' && (
              <div className="flex-1 h-full">
                <Profile
                  chatSessions={chatSessions}
                  currentChatId={currentChatId}
                  onNavigateToChat={handleNavigateToChat}
                  onNavigateToHistoryItem={handleNavigateToHistoryItem}
                  onSelectChat={handleSelectChat}
                  onLogout={handleLogout}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}