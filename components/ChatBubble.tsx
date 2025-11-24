import React, { useState } from 'react';
import { MessageRole, ChatMessage, IntegrationConfig } from '../types';
import { parseAnkiCards, integrationService } from '../services/integrationService';

interface ChatBubbleProps {
  message: ChatMessage;
  integrationConfig?: IntegrationConfig;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, integrationConfig }) => {
  const isUser = message.role === MessageRole.USER;
  const isSystem = message.role === MessageRole.SYSTEM;
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Detect content types
  const ankiCards = !isUser ? parseAnkiCards(message.text) : [];
  // Simple heuristic for Notion notes: looks for Markdown Header level 3 used in Prompt
  const isNotionNote = !isUser && message.text.includes("### ") && message.text.includes("**Key Concepts:**");

  const handleSyncAnki = async () => {
    if (!integrationConfig) return;
    setSyncStatus("Syncing Anki...");
    try {
      const count = await integrationService.syncToAnki(integrationConfig, ankiCards);
      setSyncStatus(`Synced ${count} cards!`);
    } catch (e: any) {
      setSyncStatus(`Error: ${e.message}`);
    }
    setTimeout(() => setSyncStatus(null), 3000);
  };

  const handleSyncNotion = async () => {
    if (!integrationConfig) return;
    setSyncStatus("Syncing Notion...");
    try {
      // Extract title from first ### header
      const titleMatch = message.text.match(/### (.*)/);
      const title = titleMatch ? titleMatch[1] : "CyberSentinel Note";
      await integrationService.syncToNotion(integrationConfig, title, message.text);
      setSyncStatus("Synced to Notion!");
    } catch (e: any) {
      setSyncStatus(`Error: ${e.message}`);
    }
    setTimeout(() => setSyncStatus(null), 3000);
  };

  const formatText = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const content = part.replace(/^```\w*\n?|```$/g, '');
        return (
          <div key={index} className="my-2 bg-black border border-cyber-gray p-2 rounded text-xs font-mono overflow-x-auto text-cyber-green">
            <pre>{content}</pre>
          </div>
        );
      }
      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={index}>
          {boldParts.map((subPart, subIndex) => {
            if (subPart.startsWith('**') && subPart.endsWith('**')) {
              return <strong key={subIndex} className="text-white">{subPart.slice(2, -2)}</strong>;
            }
            return subPart;
          })}
        </span>
      );
    });
  };

  if (isSystem) return null;

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed ${
          isUser 
            ? 'bg-cyber-gray text-white border border-cyber-gray' 
            : 'bg-cyber-dark text-gray-300 border-l-2 border-cyber-green'
        }`}
      >
        {!isUser && (
          <div className="flex items-center justify-between mb-1 text-xs font-bold text-cyber-green uppercase tracking-wider">
            <span className="mr-2">⚡ CyberSentinel</span>
            {syncStatus && <span className="text-[10px] text-white bg-cyber-gray px-1 rounded animate-pulse">{syncStatus}</span>}
          </div>
        )}
        <div className="whitespace-pre-wrap font-sans">
          {formatText(message.text)}
        </div>

        {/* Integration Buttons */}
        {!isUser && integrationConfig && (
          <div className="mt-3 flex gap-2">
            {ankiCards.length > 0 && (
              <button 
                onClick={handleSyncAnki}
                className="flex items-center gap-1 bg-black border border-cyber-gray hover:border-blue-400 text-[10px] px-2 py-1 rounded text-blue-400 transition-colors"
              >
                <span>🗃️ Sync Anki ({ankiCards.length})</span>
              </button>
            )}
            {isNotionNote && (
              <button 
                onClick={handleSyncNotion}
                className="flex items-center gap-1 bg-black border border-cyber-gray hover:border-white text-[10px] px-2 py-1 rounded text-white transition-colors"
              >
                <span>📝 Sync Notion</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;