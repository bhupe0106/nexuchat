import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot } from 'lucide-react';
import Sidebar from '../components/chat/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import AIPanel from '../components/chat/AIPanel';
import useSocket from '../hooks/useSocket';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import useChatStore from '../store/chatStore';


export default function Dashboard() {
  const { user, token } = useAuthStore();
  const { initTheme } = useThemeStore();
  const { activeConversation, setActiveConversation } = useChatStore();
  const [showAI, setShowAI] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(true);

  // Initialize theme on mount
  useEffect(() => {
    initTheme();
  }, []);

  // Wire all socket events → Zustand stores
  useSocket();

  // On mobile: when conversation is selected, hide sidebar
  const handleSelectConversation = () => {
    setMobileSidebar(false);
  };

  // Watch active conversation for mobile
  useEffect(() => {
    if (activeConversation) setMobileSidebar(false);
  }, [activeConversation]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>

      {/* Sidebar */}
      <div className={`
        flex-shrink-0 w-full md:w-72 lg:w-80 h-full
        ${mobileSidebar ? 'block' : 'hidden md:block'}
        transition-all duration-300
      `}>
        <Sidebar
          onOpenAI={() => setShowAI(true)}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {/* Main chat area */}
      <div className={`
        flex-1 flex flex-col h-full relative overflow-hidden
        ${!mobileSidebar ? 'block' : 'hidden md:flex'}
      `}>
        <div className="flex flex-1 h-full overflow-hidden">
          {/* Chat Window */}
          <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ${showAI ? 'md:flex hidden' : 'flex'}`}>
            <ChatWindow onBack={() => { setActiveConversation(null); setMobileSidebar(true); }} />
          </div>

          {/* AI Panel */}
          <AnimatePresence>
            {showAI && (
              <div className="w-full md:w-96 h-full flex-shrink-0">
                <AIPanel onClose={() => setShowAI(false)} />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating AI button */}
        {!showAI && activeConversation && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAI(true)}
            className="absolute bottom-20 right-4 w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl z-20 hidden md:flex"
            style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)', boxShadow: '0 4px 20px var(--accent-glow)' }}
            title="Open AI Assistant"
          >
            <Bot size={22} className="text-white" />
          </motion.button>
        )}
      </div>
    </div>
  );
}
