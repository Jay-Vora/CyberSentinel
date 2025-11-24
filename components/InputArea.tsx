import React, { useState, KeyboardEvent } from 'react';

interface InputAreaProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 bg-cyber-black border-t border-cyber-gray">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? "Processing..." : "Enter command or paste data..."}
          disabled={isLoading}
          className="flex-1 bg-cyber-dark text-white border border-cyber-gray rounded px-3 py-2 text-sm focus:outline-none focus:border-cyber-green font-mono transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="bg-cyber-green text-black font-bold px-4 py-2 rounded text-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
        >
          Send
        </button>
      </div>
      <div className="mt-2 flex justify-start gap-2">
         <button onClick={() => setInput('Status Check')} className="text-xs text-gray-500 hover:text-cyber-green transition-colors">[Status Check]</button>
         <button onClick={() => setInput('Quiz me')} className="text-xs text-gray-500 hover:text-cyber-green transition-colors">[Drill]</button>
         <button onClick={() => setInput('I am studying: ')} className="text-xs text-gray-500 hover:text-cyber-green transition-colors">[Ingest]</button>
      </div>
    </div>
  );
};

export default InputArea;
