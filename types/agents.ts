export type AgentSpecialty = 
  | 'frontend' 
  | 'backend' 
  | 'fullstack' 
  | 'devops' 
  | 'qa' 
  | 'ui-ux' 
  | 'product-management' 
  | 'data-science'
  | 'mobile'
  | 'general'

export type AgentPersonality = 
  | 'friendly' 
  | 'professional' 
  | 'challenging' 
  | 'supportive' 
  | 'technical' 
  | 'casual'

export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'lead'

export interface AgentVoiceSettings {
  voiceId: string
  voiceName: string
  language: string
  stability?: number
  similarityBoost?: number
  style?: number
  useSpeakerBoost?: boolean
}

export interface AgentPromptConfig {
  systemPrompt: string
  interviewStyle: string
  questionTypes: string[]
  evaluationCriteria: string[]
  specialInstructions?: string
}

export interface Agent {
  id: string
  name: string
  description: string
  specialty: AgentSpecialty
  personality: AgentPersonality
  experienceLevel: ExperienceLevel[]
  avatar?: string
  
  // ElevenLabs configuration
  elevenLabsAgentId?: string
  voiceSettings: AgentVoiceSettings
  
  // Interview configuration
  promptConfig: AgentPromptConfig
  
  // Metadata
  isActive: boolean
  createdAt: number
  updatedAt: number
  createdBy?: string
  tags?: string[]
  
  // Backend fields (for when connected to API)
  backendId?: string
  version?: number
}

export interface AgentTemplate {
  id: string
  name: string
  description: string
  specialty: AgentSpecialty
  personality: AgentPersonality
  defaultPrompt: string
  suggestedVoice: string
  isDefault: boolean
}

export interface CreateAgentRequest {
  name: string
  description: string
  specialty: AgentSpecialty
  personality: AgentPersonality
  experienceLevel: ExperienceLevel[]
  voiceSettings: AgentVoiceSettings
  promptConfig: AgentPromptConfig
  tags?: string[]
}

export interface UpdateAgentRequest extends Partial<CreateAgentRequest> {
  id: string
}

export interface AgentSearchFilters {
  specialty?: AgentSpecialty
  personality?: AgentPersonality
  experienceLevel?: ExperienceLevel
  isActive?: boolean
  tags?: string[]
  searchTerm?: string
}

export interface AgentListResponse {
  agents: Agent[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Para la configuración de entrevista específica
export interface InterviewAgentConfig {
  agentId: string
  customPromptOverride?: string
  customVoiceSettings?: Partial<AgentVoiceSettings>
  dynamicVariables?: Record<string, string>
  sessionSpecificInstructions?: string
}

// Estado del agente durante la entrevista
export interface AgentState {
  agentId: string
  conversationId?: string
  isConnected: boolean
  isActive: boolean
  currentMood: string
  messagesCount: number
  sessionStartTime: number
  lastActivity: number
  errorCount: number
}

export interface AgentPerformanceMetrics {
  agentId: string
  totalInterviews: number
  averageRating: number
  averageDuration: number
  successRate: number
  mostUsedBy: AgentSpecialty[]
  feedbackSummary: {
    strengths: string[]
    improvements: string[]
  }
} 