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

// ElevenLabs Conversational AI WebSocket Types
export interface ElevenLabsConversationConfig {
  agent?: {
    prompt?: {
      prompt: string;
    };
    first_message?: string;
    language?: string;
  };
  tts?: {
    voice_id: string;
  };
}

export interface ElevenLabsConversationInitiation {
  type: "conversation_initiation_client_data";
  conversation_config_override?: ElevenLabsConversationConfig;
  custom_llm_extra_body?: {
    temperature?: number;
    max_tokens?: number;
  };
  dynamic_variables?: Record<string, string>;
}

export interface ElevenLabsUserAudioChunk {
  user_audio_chunk: string; // base64 encoded audio
}

export interface ElevenLabsPong {
  type: "pong";
  event_id: number;
}

export interface ElevenLabsContextualUpdate {
  type: "contextual_update";
  text: string;
}

export interface ElevenLabsUserMessage {
  type: "user_message";
  text: string;
}

export interface ElevenLabsUserActivity {
  type: "user_activity";
}

// Server to Client Events
export interface ElevenLabsConversationMetadata {
  type: "conversation_initiation_metadata";
  conversation_initiation_metadata_event: {
    conversation_id: string;
    agent_output_audio_format: string;
    user_input_audio_format: string;
  };
}

export interface ElevenLabsUserTranscript {
  type: "user_transcript";
  user_transcription_event: {
    user_transcript: string;
  };
}

export interface ElevenLabsAgentResponse {
  type: "agent_response";
  agent_response_event: {
    agent_response: string;
  };
}

export interface ElevenLabsAudioEvent {
  type: "audio";
  audio_event: {
    audio_base_64: string;
    event_id: number;
  };
}

export interface ElevenLabsPingEvent {
  type: "ping";
  ping_event: {
    event_id: number;
    ping_ms?: number;
  };
}

export interface ElevenLabsVADScore {
  type: "vad_score";
  vad_score_event: {
    vad_score: number;
  };
}

export interface ElevenLabsInterruption {
  type: "interruption";
  interruption_event: {
    reason: string;
  };
}

export type ElevenLabsClientEvent = 
  | ElevenLabsConversationInitiation 
  | ElevenLabsUserAudioChunk 
  | ElevenLabsPong 
  | ElevenLabsContextualUpdate 
  | ElevenLabsUserMessage 
  | ElevenLabsUserActivity;

export type ElevenLabsServerEvent = 
  | ElevenLabsConversationMetadata 
  | ElevenLabsUserTranscript 
  | ElevenLabsAgentResponse 
  | ElevenLabsAudioEvent 
  | ElevenLabsPingEvent 
  | ElevenLabsVADScore 
  | ElevenLabsInterruption;

// Gemini Emotion Detection Types
export interface EmotionData {
  emotion: string;
  intensity: number;
  confidence: number;
  timestamp: number;
}

export interface GeminiEmotionResponse {
  emotions: EmotionData[];
  overall_mood: string;
  stress_level: number;
  engagement_level: number;
}