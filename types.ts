export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
}

export interface UserState {
  apiKey: string;
  streak: number;
  lastVisit: string; // YYYY-MM-DD
}

export interface IntegrationConfig {
  ankiDeckName: string;
  notionToken: string;
  notionDatabaseId: string;
}

export enum AppMode {
  CHAT = 'CHAT',
  SETTINGS = 'SETTINGS'
}