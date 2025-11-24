import React from 'react';
import { MessageRole, ChatMessage } from '../types';

interface ChatBubbleProps {
  message: ChatMessage;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === MessageRole.USER;
  const isSystem = message.role === MessageRole.SYSTEM;

  // Simple formatter to handle code blocks and bold text for better readability
  // without a heavy markdown library, preserving the "raw" terminal feel.
  const formatText = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        // Extract content and language
        const content = part.replace(/^```\w*\n?|```$/g, '');
        return (
          <div key={index} className="my-2 bg-black border border-cyber-gray p-2 rounded text-xs font-mono overflow-x-auto text-cyber-green">
            <pre>{content}</pre>
          </div>
        );
      }
      
      // Handle bolding **text**
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
          <div className="flex items-center mb-1 text-xs font-bold text-cyber-green uppercase tracking-wider">
            <span className="mr-2">⚡ CyberSentinel</span>
          </div>
        )}
        <div className="whitespace-pre-wrap font-sans">
          {formatText(message.text)}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
