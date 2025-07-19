'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { 
  IntegratedInterviewService, 
  createIntegratedInterviewService,
  type IntegratedInterviewConfig,
  type IntegratedInterviewCallbacks
} from '@/lib/services/integrated-interview-service'
import type { 
  InterviewConfig, 
  InterviewSession, 
  ChatMessage, 
  InterviewStatus,
  AIStatus,
  MediaPermissions,
  InterviewResult
} from '@/types'
import type { EmotionData } from '@/types/websocket'
import type { Agent, AgentSearchFilters, InterviewAgentConfig } from '@/types/agents'
import { agentService } from '@/lib/services/agent-management'

interface InterviewStore {
  // Session state
  currentSession: InterviewSession | null
  sessionHistory: InterviewSession[]
  
  // Media state
  mediaStream: MediaStream | null
  mediaPermissions: MediaPermissions
  isRecording: boolean
  
  // AI state - updated for new architecture
  aiStatus: AIStatus
  integratedService: IntegratedInterviewService | null
  connectionState: {
    elevenlabs: boolean
    gemini: boolean
    overall: 'disconnected' | 'connecting' | 'connected' | 'error'
  }
  
  // Emotion tracking state
  currentEmotions: EmotionData[]
  currentMood: string
  stressLevel: number
  engagementLevel: number
  
  // Agent management state
  availableAgents: Agent[]
  selectedAgent: Agent | null
  agentConfig: InterviewAgentConfig | null
  isLoadingAgents: boolean
  agentError: string | null
  
  // UI state
  isSetupComplete: boolean
  currentMessage: string
  transcript: ChatMessage[]
  
  // Actions
  initializeSession: (config: InterviewConfig) => void
  startInterview: () => Promise<void>
  stopInterview: () => Promise<void>
  updateSessionStatus: (status: InterviewStatus) => void
  addMessage: (message: ChatMessage) => void
  updateAIStatus: (status: AIStatus) => void
  setMediaStream: (stream: MediaStream | null) => void
  updateMediaPermissions: (permissions: Partial<MediaPermissions>) => void
  setRecording: (recording: boolean) => void
  sendAudioChunk: (audioData: Blob) => void
  sendUserMessage: (text: string) => void
  sendUserActivity: () => void
  completeSession: (feedback: any) => InterviewResult
  reset: () => void
  
  // New emotion-related actions
  updateEmotions: (emotions: EmotionData[]) => void
  updateMood: (mood: string) => void
  updateStressLevel: (level: number) => void
  updateEngagementLevel: (level: number) => void
  requestEmotionAnalysis: () => void
  sendCustomContext: (context: string) => void
  
  // Agent management actions
  loadAvailableAgents: (filters?: AgentSearchFilters) => Promise<void>
  selectAgent: (agent: Agent) => void
  updateAgentConfig: (config: Partial<InterviewAgentConfig>) => void
  clearAgentSelection: () => void
  setAgentError: (error: string | null) => void
}

const initialState = {
  currentSession: null,
  sessionHistory: [],
  mediaStream: null,
  mediaPermissions: {
    camera: 'checking' as const,
    microphone: 'checking' as const,
  },
  isRecording: false,
  aiStatus: 'idle' as const,
  integratedService: null,
  connectionState: {
    elevenlabs: false,
    gemini: false,
    overall: 'disconnected' as const,
  },
  currentEmotions: [],
  currentMood: 'neutral',
  stressLevel: 0.5,
  engagementLevel: 0.5,
  availableAgents: [],
  selectedAgent: null,
  agentConfig: null,
  isLoadingAgents: false,
  agentError: null,
  isSetupComplete: false,
  currentMessage: '',
  transcript: [],
}

export const useInterviewStore = create<InterviewStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    initializeSession: (config: InterviewConfig) => {
      const session: InterviewSession = {
        id: crypto.randomUUID(),
        config,
        status: 'configuring',
        startTime: Date.now(),
        messages: [],
      }
      
      set({
        currentSession: session,
        isSetupComplete: true,
        transcript: [],
      })
    },

    startInterview: async () => {
      const { currentSession, selectedAgent, agentConfig } = get()
      
      if (!currentSession) {
        throw new Error('No active session configured')
      }

      if (!selectedAgent) {
        throw new Error('No agent selected. Please select an agent before starting the interview.')
      }

      set(state => ({
        connectionState: {
          ...state.connectionState,
          overall: 'connecting'
        }
      }))

      try {
        // Generate dynamic prompt based on agent and interview config
        const agentPrompt = agentConfig?.customPromptOverride || 
          `${selectedAgent.promptConfig.systemPrompt}
          
          Para esta entrevista específica:
          - Puesto: ${currentSession.config.position}
          - Nivel: ${currentSession.config.level}
          - Duración: ${currentSession.config.duration} minutos
          - Estilo de entrevista: ${selectedAgent.promptConfig.interviewStyle}
          - Especialidad: ${selectedAgent.specialty}
          
          ${selectedAgent.promptConfig.specialInstructions || ''}
          ${agentConfig?.sessionSpecificInstructions || ''}`

        const firstMessage = `¡Hola! Soy ${selectedAgent.name}. ${selectedAgent.description} 
        Estoy muy contento de conocerte hoy. Vamos a realizar una entrevista ${selectedAgent.personality} para el puesto de ${currentSession.config.position}. 
        ¿Podrías comenzar presentándote brevemente?`

        // Create integrated service configuration with selected agent
        const integratedConfig: IntegratedInterviewConfig = {
          elevenlabs: {
            agentId: selectedAgent.elevenLabsAgentId || selectedAgent.id,
            apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
            conversationConfig: {
              agent: {
                prompt: {
                  prompt: agentPrompt
                },
                first_message: firstMessage,
                language: selectedAgent.voiceSettings.language
              },
              tts: {
                voice_id: agentConfig?.customVoiceSettings?.voiceId || selectedAgent.voiceSettings.voiceId
              }
            },
            customLLMConfig: {
              temperature: 0.7,
              max_tokens: 150
            }
            // TODO: Add dynamicVariables support when available in IntegratedInterviewConfig
          },
          gemini: {
            apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
            model: 'gemini-pro-vision',
            analysisInterval: 3000,
            confidenceThreshold: 0.6
          },
          emotionUpdateInterval: 4000,
          enableEmotionFeedback: true
        }

        // Create callbacks for the integrated service
        const callbacks: IntegratedInterviewCallbacks = {
          onConversationStart: () => {
            console.log('Interview conversation started')
            get().updateSessionStatus('in-progress')
            get().updateAIStatus('idle')
          },
          
          onConversationEnd: () => {
            console.log('Interview conversation ended')
            get().updateSessionStatus('completed')
          },
          
          onUserTranscript: (transcript: string) => {
            set({ currentMessage: transcript })
            
            // Add user message to transcript
            const userMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'user',
              content: transcript,
              timestamp: Date.now(),
            }
            get().addMessage(userMessage)
          },
          
          onAgentResponse: (response: string) => {
            // Add AI response to transcript
            const aiMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: response,
              timestamp: Date.now(),
            }
            get().addMessage(aiMessage)
            get().updateAIStatus('idle')
          },
          
          onAudioReceived: (audioBase64: string, eventId: number) => {
            console.log('Audio received from ElevenLabs, event ID:', eventId)
            // Audio is automatically played by the integrated service
          },
          
          onEmotionDetected: (emotions: EmotionData[]) => {
            get().updateEmotions(emotions)
            
            // Update mood based on strongest emotion
            if (emotions.length > 0) {
              const strongestEmotion = emotions.reduce((prev, current) => 
                current.intensity > prev.intensity ? current : prev
              )
              get().updateMood(strongestEmotion.emotion)
            }
          },
          
          onMoodChange: (mood: string, intensity: number) => {
            get().updateMood(mood)
          },
          
          onStressLevelChange: (level: number) => {
            get().updateStressLevel(level)
          },
          
          onConnectionStatusChange: (elevenLabsConnected: boolean, geminiConnected: boolean) => {
            const overall = elevenLabsConnected && geminiConnected ? 'connected' :
                           elevenLabsConnected || geminiConnected ? 'connecting' : 'disconnected'
            
            set({
              connectionState: {
                elevenlabs: elevenLabsConnected,
                gemini: geminiConnected,
                overall
              }
            })
          },
          
          onError: (source: 'elevenlabs' | 'gemini', error: Error) => {
            console.error(`Error from ${source}:`, error)
            set(state => ({
              connectionState: {
                ...state.connectionState,
                overall: 'error'
              }
            }))
          }
        }

        // Create and start the integrated service
        const service = createIntegratedInterviewService(integratedConfig, callbacks)
        
        set({ integratedService: service })
        
        await service.startInterview()
        
        console.log('Integrated interview service started successfully')
        
      } catch (error) {
        console.error('Failed to start interview:', error)
        set(state => ({
          connectionState: {
            ...state.connectionState,
            overall: 'error'
          }
        }))
        throw error
      }
    },

    stopInterview: async () => {
      const { integratedService } = get()
      if (integratedService) {
        await integratedService.stopInterview()
        set({ integratedService: null })
      }
      get().updateSessionStatus('completed')
    },

    updateSessionStatus: (status: InterviewStatus) => {
      const { currentSession } = get()
      if (!currentSession) return

      const updatedSession = {
        ...currentSession,
        status,
        ...(status === 'in-progress' && !currentSession.startTime 
          ? { startTime: Date.now() } 
          : {}),
        ...(status === 'completed' 
          ? { endTime: Date.now(), duration: Date.now() - (currentSession.startTime || Date.now()) }
          : {}),
      }

      set({ currentSession: updatedSession })
    },

    addMessage: (message: ChatMessage) => {
      const { currentSession, transcript } = get()
      if (!currentSession) return

      const updatedMessages = [...currentSession.messages, message]
      const updatedTranscript = [...transcript, message]

      set({
        currentSession: {
          ...currentSession,
          messages: updatedMessages,
        },
        transcript: updatedTranscript,
      })
    },

    updateAIStatus: (status: AIStatus) => {
      set({ aiStatus: status })
    },

    setMediaStream: (stream: MediaStream | null) => {
      set({ mediaStream: stream })
    },

    updateMediaPermissions: (permissions: Partial<MediaPermissions>) => {
      set((state) => ({
        mediaPermissions: {
          ...state.mediaPermissions,
          ...permissions,
        },
      }))
    },

    setRecording: (recording: boolean) => {
      set({ isRecording: recording })
    },

    sendAudioChunk: (audioData: Blob) => {
      const { integratedService, connectionState } = get()
      
      if (!integratedService || connectionState.overall !== 'connected') {
        console.warn('Integrated service not connected, cannot send audio')
        return
      }

      // Convert blob to base64 for ElevenLabs
      const reader = new FileReader()
      reader.onload = () => {
        const base64Audio = reader.result as string
        const base64Data = base64Audio.split(',')[1] // Remove data URL prefix
        
        // Send to both ElevenLabs (for conversation) and Gemini (for emotion analysis)
        integratedService.sendAudioChunk(base64Data, audioData)
      }
      reader.readAsDataURL(audioData)
    },

    sendUserMessage: (text: string) => {
      const { integratedService, connectionState } = get()
      
      if (!integratedService || connectionState.overall !== 'connected') {
        console.warn('Integrated service not connected, cannot send message')
        return
      }

      integratedService.sendUserMessage(text)
    },

    sendUserActivity: () => {
      const { integratedService, connectionState } = get()
      
      if (!integratedService || connectionState.overall !== 'connected') {
        return
      }

      integratedService.sendUserActivity()
    },

    // Emotion-related actions
    updateEmotions: (emotions: EmotionData[]) => {
      set({ currentEmotions: emotions })
    },

    updateMood: (mood: string) => {
      set({ currentMood: mood })
    },

    updateStressLevel: (level: number) => {
      set({ stressLevel: level })
    },

    updateEngagementLevel: (level: number) => {
      set({ engagementLevel: level })
    },

    requestEmotionAnalysis: () => {
      const { integratedService } = get()
      if (integratedService) {
        integratedService.requestEmotionAnalysis()
      }
    },

    sendCustomContext: (context: string) => {
      const { integratedService } = get()
      if (integratedService) {
        integratedService.sendCustomContext(context)
      }
    },

    // Agent management actions
    loadAvailableAgents: async (filters?: AgentSearchFilters) => {
      set({ isLoadingAgents: true, agentError: null })
      
      try {
        const response = await agentService.getAgents(filters)
        set({ 
          availableAgents: response.agents,
          isLoadingAgents: false 
        })
      } catch (error: any) {
        console.error('Failed to load agents:', error)
        set({ 
          agentError: error.message || 'Failed to load agents',
          isLoadingAgents: false 
        })
      }
    },

    selectAgent: (agent: Agent) => {
      set({ 
        selectedAgent: agent,
        agentConfig: agentService.agentToInterviewConfig(agent),
        agentError: null 
      })
    },

    updateAgentConfig: (config: Partial<InterviewAgentConfig>) => {
      set((state) => ({
        agentConfig: state.agentConfig ? { ...state.agentConfig, ...config } : null
      }))
    },

    clearAgentSelection: () => {
      set({ 
        selectedAgent: null,
        agentConfig: null,
        agentError: null 
      })
    },

    setAgentError: (error: string | null) => {
      set({ agentError: error })
    },

    completeSession: (feedback: any): InterviewResult => {
      const { currentSession, transcript } = get()
      if (!currentSession) {
        throw new Error('No active session to complete')
      }

      const result: InterviewResult = {
        sessionId: currentSession.id,
        config: currentSession.config,
        duration: currentSession.duration || 0,
        transcript,
        feedback,
        completedAt: Date.now(),
        // Include emotion data in results
        emotionSummary: {
          finalMood: get().currentMood,
          averageStressLevel: get().stressLevel,
          averageEngagementLevel: get().engagementLevel,
          emotionHistory: get().currentEmotions
        }
      }

      // Add to history
      set((state) => ({
        sessionHistory: [...state.sessionHistory, currentSession],
        currentSession: null,
      }))

      return result
    },

    reset: () => {
      const { integratedService, mediaStream } = get()
      
      // Clean up resources
      if (integratedService) {
        integratedService.stopInterview()
      }
      
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop())
      }

      set(initialState)
    },
  }))
)

// Selector hooks for optimized re-renders
export const useInterviewSession = () => useInterviewStore((state) => state.currentSession)
export const useAIStatus = () => useInterviewStore((state) => state.aiStatus)
export const useMediaPermissions = () => useInterviewStore((state) => state.mediaPermissions)
export const useConnectionState = () => useInterviewStore((state) => state.connectionState)
export const useTranscript = () => useInterviewStore((state) => state.transcript)

// New emotion-related selectors
export const useCurrentEmotions = () => useInterviewStore((state) => state.currentEmotions)
export const useCurrentMood = () => useInterviewStore((state) => state.currentMood)
export const useStressLevel = () => useInterviewStore((state) => state.stressLevel)
export const useEngagementLevel = () => useInterviewStore((state) => state.engagementLevel)

// Agent management selectors
export const useAvailableAgents = () => useInterviewStore((state) => state.availableAgents)
export const useSelectedAgent = () => useInterviewStore((state) => state.selectedAgent)
export const useAgentConfig = () => useInterviewStore((state) => state.agentConfig)
export const useIsLoadingAgents = () => useInterviewStore((state) => state.isLoadingAgents)
export const useAgentError = () => useInterviewStore((state) => state.agentError)