import React, { useState, useEffect, useRef } from 'react';
import { MessageRole, ChatMessage, IntegrationConfig } from './types';
import { geminiService } from './services/geminiService';
import { WELCOME_MESSAGE } from './constants';
import ChatBubble from './components/ChatBubble';
import InputArea from './components/InputArea';
import SettingsModal from './components/SettingsModal';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [integrationConfig, setIntegrationConfig] = useState<IntegrationConfig>({
    ankiDeckName: 'CyberSentinel',
    notionToken: '',
    notionDatabaseId: ''
  });
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize App (Load local storage)
  useEffect(() => {
    // Load API Key
    const storedKey = localStorage.getItem('cybersentinel_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      geminiService.initialize(storedKey);
    } else {
      setShowSettings(true);
    }

    // Load Integrations
    const storedIntegrations = localStorage.getItem('cybersentinel_integrations');
    if (storedIntegrations) {
      setIntegrationConfig(JSON.parse(storedIntegrations));
    }

    // Streak Logic
    const lastVisit = localStorage.getItem('cybersentinel_last_visit');
    const storedStreak = parseInt(localStorage.getItem('cybersentinel_streak') || '0', 10);
    const today = new Date().toISOString().split('T')[0];

    if (lastVisit === today) {
      setStreak(storedStreak);
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastVisit === yesterdayStr) {
        const newStreak = storedStreak + 1;
        setStreak(newStreak);
        localStorage.setItem('cybersentinel_streak', newStreak.toString());
      } else {
        // Streak broken or first visit
        setStreak(1); // Start day 1 today
        localStorage.setItem('cybersentinel_streak', '1');
      }
    }
    localStorage.setItem('cybersentinel_last_visit', today);

    // Initial Message
    setMessages([
      {
        id: 'init-1',
        role: MessageRole.MODEL,
        text: WELCOME_MESSAGE,
        timestamp: Date.now()
      }
    ]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSaveKey = (key: string) => {
    localStorage.setItem('cybersentinel_api_key', key);
    setApiKey(key);
    geminiService.initialize(key);
  };

  const handleSaveIntegrations = (config: IntegrationConfig) => {
    localStorage.setItem('cybersentinel_integrations', JSON.stringify(config));
    setIntegrationConfig(config);
  };

  const handleSendMessage = async (text: string) => {
    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const responseText = await geminiService.sendMessage(messages, text, streak);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        text: responseText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans flex items-center justify-center p-0 md:p-4">
      {/* Wrapper to simulate Chrome Extension Popup size if on desktop full screen */}
      <div className="w-full h-screen md:h-[600px] md:w-[400px] bg-cyber-black flex flex-col relative md:border md:border-cyber-gray md:rounded-xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <header className="bg-cyber-dark p-3 border-b border-cyber-gray flex justify-between items-center select-none sticky top-0 z-10">
          <div className="flex items-center gap-2">
             <div className="w-3 h-3 bg-cyber-green rounded-full shadow-[0_0_10px_#00ff41] animate-pulse"></div>
             <h1 className="font-mono font-bold text-white tracking-wider">CyberSentinel</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-500 font-mono uppercase">Streak</span>
              <span className="text-sm font-bold text-cyber-green leading-none">{streak} Days</span>
            </div>
            <button onClick={() => setShowSettings(true)} className="text-gray-500 hover:text-white transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {messages.map((msg) => (
            <ChatBubble 
              key={msg.id} 
              message={msg} 
              integrationConfig={integrationConfig}
            />
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
               <div className="bg-cyber-dark border-l-2 border-cyber-green p-3 rounded-lg flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyber-green rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-cyber-green rounded-full animate-bounce delay-100"></span>
                  <span className="w-2 h-2 bg-cyber-green rounded-full animate-bounce delay-200"></span>
               </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </main>

        {/* Input Area */}
        <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />

        {/* Settings Modal */}
        {showSettings && (
          <SettingsModal 
            onSaveKey={handleSaveKey}
            onSaveIntegrations={handleSaveIntegrations}
            onClose={() => setShowSettings(false)}
            hasKey={!!apiKey}
            initialIntegrations={integrationConfig}
          />
        )}
      </div>
    </div>
  );
};

export default App;