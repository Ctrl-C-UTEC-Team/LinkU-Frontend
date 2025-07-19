'use client'

import { ElevenLabsConversationService, type ElevenLabsServiceConfig, type ElevenLabsConversationCallbacks } from './elevenlabs-conversation'
import { GeminiEmotionDetector, type GeminiEmotionConfig, type GeminiEmotionCallbacks } from './gemini-emotion-detector'
import type { EmotionData, ElevenLabsConversationMetadata, WebSocketConnectionStatus } from '@/types/websocket'

export interface IntegratedInterviewConfig {
  // ElevenLabs Configuration
  elevenlabs: {
    agentId: string
    apiKey?: string
    conversationConfig?: {
      agent?: {
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
    customLLMConfig?: {
      temperature?: number
      max_tokens?: number
    }
  }
  
  // Gemini Configuration
  gemini: {
    apiKey?: string
    model?: string
    analysisInterval?: number
    confidenceThreshold?: number
  }

  // Integration settings
  emotionUpdateInterval?: number // How often to send emotion updates to ElevenLabs
  enableEmotionFeedback?: boolean // Whether to send emotions to ElevenLabs
}

export interface IntegratedInterviewCallbacks {
  // ElevenLabs callbacks
  onConversationStart?: () => void
  onConversationEnd?: () => void
  onUserTranscript?: (transcript: string) => void
  onAgentResponse?: (response: string) => void
  onAudioReceived?: (audioBase64: string, eventId: number) => void
  
  // Gemini emotion callbacks
  onEmotionDetected?: (emotions: EmotionData[]) => void
  onMoodChange?: (mood: string, intensity: number) => void
  onStressLevelChange?: (level: number) => void
  
  // Integration callbacks
  onConnectionStatusChange?: (elevenLabsConnected: boolean, geminiConnected: boolean) => void
  onError?: (source: 'elevenlabs' | 'gemini', error: Error) => void
}

export class IntegratedInterviewService {
  private elevenLabsService: ElevenLabsConversationService
  private geminiEmotionDetector: GeminiEmotionDetector
  private config: IntegratedInterviewConfig
  private callbacks: IntegratedInterviewCallbacks
  
  private emotionUpdateTimer?: NodeJS.Timeout
  private isActive = false
  private connectionStatus = {
    elevenlabs: false,
    gemini: false
  }

  constructor(config: IntegratedInterviewConfig, callbacks: IntegratedInterviewCallbacks) {
    this.config = config
    this.callbacks = callbacks

    // Configure ElevenLabs service
    const elevenLabsConfig: ElevenLabsServiceConfig = {
      agentId: config.elevenlabs.agentId,
      apiKey: config.elevenlabs.apiKey,
      conversationConfig: config.elevenlabs.conversationConfig,
      customLLMConfig: config.elevenlabs.customLLMConfig
    }

    const elevenLabsCallbacks: ElevenLabsConversationCallbacks = {
      onConnectionOpen: () => {
        this.connectionStatus.elevenlabs = true
        this.checkAndNotifyConnectionStatus()
        this.callbacks.onConversationStart?.()
      },
      onConnectionClose: () => {
        this.connectionStatus.elevenlabs = false
        this.checkAndNotifyConnectionStatus()
        this.callbacks.onConversationEnd?.()
      },
      onConnectionError: (error) => {
        this.callbacks.onError?.('elevenlabs', new Error('ElevenLabs connection error'))
      },
      onUserTranscript: (transcript) => {
        this.callbacks.onUserTranscript?.(transcript)
      },
      onAgentResponse: (response) => {
        this.callbacks.onAgentResponse?.(response)
      },
      onAudioReceived: (audioBase64, eventId) => {
        this.callbacks.onAudioReceived?.(audioBase64, eventId)
      }
    }

    this.elevenLabsService = new ElevenLabsConversationService(elevenLabsConfig, elevenLabsCallbacks)

    // Configure Gemini emotion detector
    const geminiConfig: GeminiEmotionConfig = {
      apiKey: config.gemini.apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'demo-key',
      model: config.gemini.model || 'gemini-pro-vision',
      analysisInterval: config.gemini.analysisInterval || 2000,
      confidenceThreshold: config.gemini.confidenceThreshold || 0.7
    }

    const geminiCallbacks: GeminiEmotionCallbacks = {
      onEmotionDetected: (emotions) => {
        this.handleEmotionDetected(emotions)
      },
      onMoodChange: (mood, intensity) => {
        this.callbacks.onMoodChange?.(mood, intensity)
      },
      onConnectionStatusChange: (connected) => {
        this.connectionStatus.gemini = connected
        this.checkAndNotifyConnectionStatus()
      },
      onError: (error) => {
        this.callbacks.onError?.('gemini', error)
      }
    }

    this.geminiEmotionDetector = new GeminiEmotionDetector(geminiConfig, geminiCallbacks)
  }

  async startInterview(): Promise<void> {
    try {
      this.isActive = true
      
      // Start both services in parallel
      await Promise.all([
        this.elevenLabsService.connect(),
        this.geminiEmotionDetector.connect()
      ])

      // Start periodic emotion updates if enabled
      if (this.config.enableEmotionFeedback !== false) {
        this.startEmotionUpdates()
      }

      console.log('Integrated interview service started successfully')
      
    } catch (error) {
      console.error('Failed to start integrated interview service:', error)
      this.isActive = false
      throw error
    }
  }

  async stopInterview(): Promise<void> {
    this.isActive = false
    this.stopEmotionUpdates()

    // Disconnect both services
    this.elevenLabsService.disconnect()
    this.geminiEmotionDetector.disconnect()

    console.log('Integrated interview service stopped')
  }

  // Audio handling methods
  public sendAudioChunk(audioBase64: string, audioBlob?: Blob): void {
    if (!this.isActive) return

    // Send audio to ElevenLabs for conversation
    this.elevenLabsService.sendAudioChunk(audioBase64)

    // Send audio to Gemini for emotion analysis
    if (audioBlob) {
      this.geminiEmotionDetector.addAudioChunk(audioBlob)
    }
  }

  public sendUserMessage(text: string): void {
    if (!this.isActive) return
    this.elevenLabsService.sendUserMessage(text)
  }

  public sendUserActivity(): void {
    if (!this.isActive) return
    this.elevenLabsService.sendUserActivity()
  }

  // Emotion handling methods
  private handleEmotionDetected(emotions: EmotionData[]): void {
    this.callbacks.onEmotionDetected?.(emotions)

    // Send emotion update to ElevenLabs if enabled
    if (this.config.enableEmotionFeedback !== false && this.connectionStatus.elevenlabs) {
      this.elevenLabsService.sendEmotionUpdate(emotions)
    }

    // Check for stress level changes
    const stressEmotions = emotions.filter(e => 
      ['stress', 'nervousness', 'anxiety'].includes(e.emotion.toLowerCase())
    )
    
    if (stressEmotions.length > 0) {
      const avgStress = stressEmotions.reduce((sum, e) => sum + e.intensity, 0) / stressEmotions.length
      this.callbacks.onStressLevelChange?.(avgStress)
    }
  }

  private startEmotionUpdates(): void {
    const interval = this.config.emotionUpdateInterval || 5000 // Default: every 5 seconds
    
    this.emotionUpdateTimer = setInterval(() => {
      if (!this.isActive || !this.connectionStatus.elevenlabs || !this.connectionStatus.gemini) {
        return
      }

      const lastAnalysis = this.geminiEmotionDetector.getLastEmotionAnalysis()
      if (lastAnalysis && lastAnalysis.emotions.length > 0) {
        
        // Create contextual summary for ElevenLabs
        const emotionSummary = this.createEmotionSummary(lastAnalysis)
        this.elevenLabsService.sendContextualUpdate(emotionSummary)
      }
    }, interval)
  }

  private stopEmotionUpdates(): void {
    if (this.emotionUpdateTimer) {
      clearInterval(this.emotionUpdateTimer)
      this.emotionUpdateTimer = undefined
    }
  }

  private createEmotionSummary(analysis: any): string {
    const { emotions, overall_mood, stress_level, engagement_level } = analysis
    
    const emotionsList = emotions.map((e: EmotionData) => 
      `${e.emotion} (${Math.round(e.intensity * 100)}%)`
    ).join(', ')

    const stressDescription = stress_level > 0.7 ? 'alto estrés' : 
                             stress_level > 0.4 ? 'estrés moderado' : 'bajo estrés'
    
    const engagementDescription = engagement_level > 0.7 ? 'muy comprometido' :
                                 engagement_level > 0.4 ? 'moderadamente comprometido' : 'poco comprometido'

    return `Estado emocional actual del entrevistado: ${emotionsList}. Estado general: ${overall_mood}. Nivel de estrés: ${stressDescription}. Nivel de compromiso: ${engagementDescription}. Ajusta tu enfoque de entrevista según corresponda.`
  }

  private checkAndNotifyConnectionStatus(): void {
    this.callbacks.onConnectionStatusChange?.(
      this.connectionStatus.elevenlabs,
      this.connectionStatus.gemini
    )
  }

  // Public status methods
  public getConnectionStatus(): { elevenlabs: boolean, gemini: boolean } {
    return { ...this.connectionStatus }
  }

  public isInterviewActive(): boolean {
    return this.isActive && this.connectionStatus.elevenlabs && this.connectionStatus.gemini
  }

  public getCurrentMood(): string {
    return this.geminiEmotionDetector.getCurrentMood()
  }

  public getStressLevel(): number {
    return this.geminiEmotionDetector.getStressLevel()
  }

  public getEngagementLevel(): number {
    return this.geminiEmotionDetector.getEngagementLevel()
  }

  public getLastEmotionAnalysis() {
    return this.geminiEmotionDetector.getLastEmotionAnalysis()
  }

  // Manual emotion analysis trigger
  public requestEmotionAnalysis(): void {
    this.geminiEmotionDetector.requestEmotionAnalysis()
  }

  // Send custom contextual updates
  public sendCustomContext(context: string): void {
    if (this.connectionStatus.elevenlabs) {
      this.elevenLabsService.sendContextualUpdate(context)
    }
  }

  // Error recovery methods
  public async retryConnection(): Promise<void> {
    if (!this.connectionStatus.elevenlabs) {
      try {
        await this.elevenLabsService.connect()
      } catch (error) {
        console.error('Failed to reconnect ElevenLabs:', error)
      }
    }

    if (!this.connectionStatus.gemini) {
      try {
        await this.geminiEmotionDetector.connect()
      } catch (error) {
        console.error('Failed to reconnect Gemini:', error)
      }
    }
  }
}

// Factory function para crear el servicio integrado
export function createIntegratedInterviewService(
  config: IntegratedInterviewConfig,
  callbacks: IntegratedInterviewCallbacks
): IntegratedInterviewService {
  return new IntegratedInterviewService(config, callbacks)
} 