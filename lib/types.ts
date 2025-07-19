// Core Types for Interview AI Simulator

export type InterviewState = 
  | "setup" 
  | "speaking" 
  | "recording" 
  | "paused" 
  | "completed" 
  | "feedback" 
  | "generating"

export type QuestionDifficulty = "easy" | "medium" | "hard"

export type QuestionCategory = "general-hr" | "tech" | "marketing" | "sales"

export interface Question {
  id: string
  category: QuestionCategory
  question: string
  competency: string
  difficulty: QuestionDifficulty
  timeLimit: number
  followUp?: string[]
  evaluationCriteria: string[]
  isGenerated?: boolean
  reasoning?: string
}

export interface AIFeedback {
  strengths: string[]
  improvements: string[]
  score?: number
  clarity?: number
  confidence?: number
  relevance?: number
  realTimeTips: string[]
  nextQuestionGuidance?: string
  followUpQuestion?: string
}

export interface SessionData {
  wordsPerMinute: number
  fillerWords: number
  pauseCount: number
  totalWords: number
  questionResponses: QuestionResponse[]
}

export interface QuestionResponse {
  questionId: string
  transcript: string
  duration: number
  wordsCount: number
  fillerWordsCount: number
  competency: string
  feedback: AIFeedback
}

export interface CompetencyScores {
  [key: string]: number
}

export interface InterviewResults {
  category: string
  questionsAnswered: number
  totalDuration: number
  metrics: InterviewMetrics
  competencyScores?: CompetencyScores
  transcript: string
  sessionData: SessionData
  aiGenerated?: boolean
  questionsUsed?: Question[]
}

export interface InterviewMetrics {
  fluency: number
  confidence: number
  fillerWords: number
  overallScore: number
} 

// ElevenLabs WebSocket Real-time Conversation Types
export interface WebSocketConversationConfig {
  agent: {
    prompt?: {
      prompt: string
    }
    first_message?: string
    language?: string
  }
  tts?: {
    voice_id: string
  }
}

export interface ConversationInitiationClientData {
  type: "conversation_initiation_client_data"
  conversation_config_override?: WebSocketConversationConfig
  custom_llm_extra_body?: {
    temperature?: number
    max_tokens?: number
  }
  dynamic_variables?: Record<string, string | number | boolean>
}

export interface ConversationInitiationMetadata {
  type: "conversation_initiation_metadata"
  conversation_initiation_metadata_event: {
    conversation_id: string
    agent_output_audio_format: string
    user_input_audio_format: string
  }
}

export interface UserAudioChunk {
  type?: "user_audio_chunk"
  user_audio_chunk: string // Base64 encoded audio
}

export interface VADScore {
  type: "vad_score"
  vad_score_event: {
    vad_score: number
  }
}

export interface UserTranscript {
  type: "user_transcript"
  user_transcription_event: {
    user_transcript: string
  }
}

export interface AgentResponse {
  type: "agent_response"
  agent_response_event: {
    agent_response: string
  }
}

export interface InternalTentativeAgentResponse {
  type: "internal_tentative_agent_response"
  tentative_agent_response_internal_event: {
    tentative_agent_response: string
  }
}

export interface AudioResponse {
  type: "audio"
  audio_event: {
    audio_base_64: string
    event_id: number
  }
}

export interface PingEvent {
  type: "ping"
  ping_event: {
    event_id: number
    ping_ms: number
  }
}

export interface PongEvent {
  type: "pong"
  event_id: number
}

export interface ClientToolCall {
  type: "client_tool_call"
  client_tool_call: {
    tool_name: string
    tool_call_id: string
    parameters: Record<string, any>
  }
}

export interface ClientToolResult {
  type: "client_tool_result"
  tool_call_id: string
  result: string
  is_error: boolean
}

export interface ContextualUpdate {
  type: "contextual_update"
  text: string
}

export interface UserMessage {
  type: "user_message"
  text: string
}

export interface UserActivity {
  type: "user_activity"
}

export interface Interruption {
  type: "interruption"
  interruption_event: {
    event_id: number
  }
}

export interface AgentResponseCorrection {
  type: "agent_response_correction"
  agent_response_correction_event: {
    corrected_agent_response: string
    correction_type: string
  }
}

// Union types for WebSocket messages
export type WebSocketIncomingMessage = 
  | ConversationInitiationMetadata
  | UserTranscript
  | AgentResponse
  | AudioResponse
  | PingEvent
  | ClientToolCall
  | ContextualUpdate
  | VADScore
  | InternalTentativeAgentResponse
  | Interruption
  | AgentResponseCorrection

export type WebSocketOutgoingMessage = 
  | ConversationInitiationClientData
  | UserAudioChunk
  | PongEvent
  | ClientToolResult
  | ContextualUpdate
  | UserMessage
  | UserActivity

// Audio recording configuration
export interface AudioConfig {
  sampleRate: number
  channels: number
  bitsPerSample: number
}

// Conversation state
export interface ConversationState {
  status: 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'processing' | 'error'
  conversationId?: string
  agentId?: string
  isRecording: boolean
  isSpeaking: boolean
  currentTranscript?: string
  lastAgentResponse?: string
  error?: string
} 