export interface GeminiWebSocketMessage {
  type: 'audio' | 'text' | 'control';
  data: any;
  timestamp: number;
}

export interface GeminiAudioMessage extends GeminiWebSocketMessage {
  type: 'audio';
  data: {
    audioData: ArrayBuffer;
    format: 'webm' | 'wav' | 'mp3';
    sampleRate: number;
  };
}

export interface GeminiTextMessage extends GeminiWebSocketMessage {
  type: 'text';
  data: {
    content: string;
    role: 'user' | 'assistant';
  };
}

export interface GeminiControlMessage extends GeminiWebSocketMessage {
  type: 'control';
  data: {
    action: 'start' | 'stop' | 'pause' | 'resume';
    sessionId?: string;
  };
}

export type WebSocketConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WebSocketConfig {
  url: string;
  bearerToken: string;
  reconnectAttempts: number;
  reconnectInterval: number;
}

export interface GeminiResponse {
  id: string;
  content: string;
  role: 'assistant';
  timestamp: number;
  confidence?: number;
}

export interface AudioChunk {
  data: ArrayBuffer;
  timestamp: number;
  sequence: number;
}