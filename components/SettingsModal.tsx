import React, { useState } from 'react';

interface SettingsModalProps {
  onSave: (key: string) => void;
  onClose: () => void;
  hasKey: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onSave, onClose, hasKey }) => {
  const [key, setKey] = useState('');

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-cyber-dark border border-cyber-green p-6 rounded-lg w-full max-w-sm shadow-[0_0_20px_rgba(0,255,65,0.2)]">
        <h2 className="text-xl font-bold text-cyber-green mb-4 font-mono tracking-widest">CONFIGURATION</h2>
        <p className="text-gray-400 text-xs mb-4">
          Access to CyberSentinel requires a valid Gemini API Key.
          <br/>The key is stored locally in your browser.
        </p>
        
        <div className="mb-4">
          <label className="block text-xs font-mono text-cyber-green mb-1">API_KEY_INPUT</label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full bg-black border border-cyber-gray text-white p-2 text-sm rounded focus:border-cyber-green focus:outline-none font-mono"
            placeholder="AIzaSy..."
          />
        </div>

        <div className="flex gap-2 justify-end">
          {hasKey && (
            <button 
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-400 hover:text-white"
            >
              CANCEL
            </button>
          )}
          <button
            onClick={() => onSave(key)}
            disabled={!key}
            className="bg-cyber-green text-black font-bold px-4 py-2 rounded text-xs hover:bg-white transition-colors disabled:opacity-50"
          >
            INITIALIZE UPLINK
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
