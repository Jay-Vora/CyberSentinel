import React, { useState, useEffect } from 'react';
import { IntegrationConfig } from '../types';

interface SettingsModalProps {
  onSaveKey: (key: string) => void;
  onSaveIntegrations: (config: IntegrationConfig) => void;
  onClose: () => void;
  hasKey: boolean;
  initialIntegrations: IntegrationConfig;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  onSaveKey, 
  onSaveIntegrations,
  onClose, 
  hasKey,
  initialIntegrations
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'integrations'>('general');
  const [apiKey, setApiKey] = useState('');
  
  const [integrations, setIntegrations] = useState<IntegrationConfig>({
    ankiDeckName: 'CyberSentinel',
    notionToken: '',
    notionDatabaseId: ''
  });

  useEffect(() => {
    setIntegrations(initialIntegrations);
  }, [initialIntegrations]);

  const handleSave = () => {
    if (apiKey) onSaveKey(apiKey);
    onSaveIntegrations(integrations);
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-cyber-dark border border-cyber-green p-6 rounded-lg w-full max-w-sm shadow-[0_0_20px_rgba(0,255,65,0.2)]">
        
        {/* Tabs */}
        <div className="flex border-b border-cyber-gray mb-4">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex-1 pb-2 text-xs font-mono font-bold ${activeTab === 'general' ? 'text-cyber-green border-b-2 border-cyber-green' : 'text-gray-500'}`}
          >
            CORE SYSTEM
          </button>
          <button 
            onClick={() => setActiveTab('integrations')}
            className={`flex-1 pb-2 text-xs font-mono font-bold ${activeTab === 'integrations' ? 'text-cyber-green border-b-2 border-cyber-green' : 'text-gray-500'}`}
          >
            INTEGRATIONS
          </button>
        </div>

        {activeTab === 'general' && (
          <div>
            <p className="text-gray-400 text-xs mb-4">
              Access requires a valid Gemini API Key. Stored locally.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-mono text-cyber-green mb-1">GEMINI_API_KEY</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-black border border-cyber-gray text-white p-2 text-sm rounded focus:border-cyber-green focus:outline-none font-mono"
                placeholder={hasKey ? "Key Encrypted (Enter to Update)" : "AIzaSy..."}
              />
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-mono text-cyber-green mb-1">ANKI_DECK_NAME</label>
              <input
                type="text"
                value={integrations.ankiDeckName}
                onChange={(e) => setIntegrations({...integrations, ankiDeckName: e.target.value})}
                className="w-full bg-black border border-cyber-gray text-white p-2 text-xs rounded focus:border-cyber-green focus:outline-none font-mono"
              />
              <p className="text-[9px] text-gray-500 mt-1">Requires AnkiConnect add-on running on localhost:8765</p>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-cyber-green mb-1">NOTION_TOKEN</label>
              <input
                type="password"
                value={integrations.notionToken}
                onChange={(e) => setIntegrations({...integrations, notionToken: e.target.value})}
                className="w-full bg-black border border-cyber-gray text-white p-2 text-xs rounded focus:border-cyber-green focus:outline-none font-mono"
                placeholder="secret_..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-cyber-green mb-1">NOTION_DB_ID</label>
              <input
                type="text"
                value={integrations.notionDatabaseId}
                onChange={(e) => setIntegrations({...integrations, notionDatabaseId: e.target.value})}
                className="w-full bg-black border border-cyber-gray text-white p-2 text-xs rounded focus:border-cyber-green focus:outline-none font-mono"
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end mt-6">
          {hasKey && (
            <button 
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-400 hover:text-white"
            >
              CANCEL
            </button>
          )}
          <button
            onClick={handleSave}
            className="bg-cyber-green text-black font-bold px-4 py-2 rounded text-xs hover:bg-white transition-colors"
          >
            SAVE CONFIG
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;