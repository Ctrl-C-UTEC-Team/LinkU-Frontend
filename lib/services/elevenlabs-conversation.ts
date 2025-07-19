'use client'

import type {
  ElevenLabsClientEvent,
  ElevenLabsServerEvent,
  ElevenLabsConversationConfig,
  ElevenLabsConversationMetadata,
  WebSocketConnectionStatus,
  EmotionData
} from '@/types/websocket'

export interface ElevenLabsConversationCallbacks {
  onConnectionOpen?: () => void
  onConnectionClose?: () => void
  onConnectionError?: (error: Event) => void
  onConversationMetadata?: (metadata: ElevenLabsConversationMetadata) => void
  onUserTranscript?: (transcript: string) => void
  onAgentResponse?: (response: string) => void
  onAudioReceived?: (audioBase64: string, eventId: number) => void
  onVADScore?: (score: number) => void
  onInterruption?: (reason: string) => void
}

export interface ElevenLabsServiceConfig {
  agentId: string
  apiKey?: string
  conversationConfig?: ElevenLabsConversationConfig
  customLLMConfig?: {
    temperature?: number
    max_tokens?: number
  }
  dynamicVariables?: Record<string, string>
}

export class ElevenLabsConversationService {
  private ws: WebSocket | null = null
  private config: ElevenLabsServiceConfig
  private callbacks: ElevenLabsConversationCallbacks
  private connectionStatus: WebSocketConnectionStatus = 'disconnected'
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  private reconnectDelay = 1000
  private audioQueue: HTMLAudioElement[] = []
  private isPlayingAudio = false

  constructor(config: ElevenLabsServiceConfig, callbacks: ElevenLabsConversationCallbacks) {
    this.config = config
    this.callbacks = callbacks
  }

  async connect(): Promise<void> {
    if (this.connectionStatus === 'connected' || this.connectionStatus === 'connecting') {
      return
    }

    this.connectionStatus = 'connecting'

    try {
      const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${this.config.agentId}`
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onerror = this.handleError.bind(this)
      this.ws.onclose = this.handleClose.bind(this)

      // Wait for connection to open
      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Connection timeout'))
        }, 10000)

        if (this.ws) {
          this.ws.addEventListener('open', () => {
            clearTimeout(timeoutId)
            resolve()
          }, { once: true })
          
          this.ws.addEventListener('error', () => {
            clearTimeout(timeoutId)
            reject(new Error('Connection failed'))
          }, { once: true })
        }
      })

    } catch (error) {
      this.connectionStatus = 'error'
      console.error('Failed to connect to ElevenLabs:', error)
      throw error
    }
  }

  private handleOpen(): void {
    console.log('ElevenLabs WebSocket connected')
    this.connectionStatus = 'connected'
    this.reconnectAttempts = 0
    
    // Send initial conversation configuration
    this.sendConversationInitiation()
    
    this.callbacks.onConnectionOpen?.()
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data: ElevenLabsServerEvent = JSON.parse(event.data)
      
      switch (data.type) {
        case 'conversation_initiation_metadata':
          console.log('Conversation metadata:', data.conversation_initiation_metadata_event)
          this.callbacks.onConversationMetadata?.(data)
          break

        case 'user_transcript':
          console.log('User transcript:', data.user_transcription_event.user_transcript)
          this.callbacks.onUserTranscript?.(data.user_transcription_event.user_transcript)
          break

        case 'agent_response':
          console.log('Agent response:', data.agent_response_event.agent_response)
          this.callbacks.onAgentResponse?.(data.agent_response_event.agent_response)
          break

        case 'audio':
          console.log('Audio received, event ID:', data.audio_event.event_id)
          this.handleAudioReceived(data.audio_event.audio_base_64, data.audio_event.event_id)
          this.callbacks.onAudioReceived?.(data.audio_event.audio_base_64, data.audio_event.event_id)
          break

        case 'ping':
          console.log('Ping received, responding with pong')
          this.sendPong(data.ping_event.event_id, data.ping_event.ping_ms)
          break

        case 'vad_score':
          console.log('VAD score:', data.vad_score_event.vad_score)
          this.callbacks.onVADScore?.(data.vad_score_event.vad_score)
          break

        case 'interruption':
          console.log('Interruption:', data.interruption_event.reason)
          this.callbacks.onInterruption?.(data.interruption_event.reason)
          break

        default:
          console.log('Unknown message type:', data)
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error)
    }
  }

  private handleError(error: Event): void {
    console.error('ElevenLabs WebSocket error:', error)
    this.connectionStatus = 'error'
    this.callbacks.onConnectionError?.(error)
  }

  private handleClose(): void {
    console.log('ElevenLabs WebSocket closed')
    this.connectionStatus = 'disconnected'
    this.callbacks.onConnectionClose?.()
    
    // Attempt to reconnect
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        this.connect()
      }, this.reconnectDelay * this.reconnectAttempts)
    }
  }

  private sendMessage(message: ElevenLabsClientEvent): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, cannot send message:', message)
    }
  }

  private sendConversationInitiation(): void {
    const initMessage: ElevenLabsClientEvent = {
      type: "conversation_initiation_client_data",
      conversation_config_override: this.config.conversationConfig,
      custom_llm_extra_body: this.config.customLLMConfig,
      dynamic_variables: this.config.dynamicVariables
    }
    
    this.sendMessage(initMessage)
  }

  private sendPong(eventId: number, pingMs?: number): void {
    const delay = pingMs || 0
    
    setTimeout(() => {
      const pongMessage: ElevenLabsClientEvent = {
        type: "pong",
        event_id: eventId
      }
      this.sendMessage(pongMessage)
    }, delay)
  }

  public sendAudioChunk(audioBase64: string): void {
    const audioMessage: ElevenLabsClientEvent = {
      user_audio_chunk: audioBase64
    }
    this.sendMessage(audioMessage)
  }

  public sendContextualUpdate(text: string): void {
    const contextMessage: ElevenLabsClientEvent = {
      type: "contextual_update",
      text: text
    }
    this.sendMessage(contextMessage)
  }

  public sendUserMessage(text: string): void {
    const userMessage: ElevenLabsClientEvent = {
      type: "user_message",
      text: text
    }
    this.sendMessage(userMessage)
  }

  public sendUserActivity(): void {
    const activityMessage: ElevenLabsClientEvent = {
      type: "user_activity"
    }
    this.sendMessage(activityMessage)
  }

  // Método para enviar información de emociones de Gemini como actualización contextual
  public sendEmotionUpdate(emotions: EmotionData[]): void {
    const emotionSummary = emotions.map(e => 
      `${e.emotion} (intensidad: ${e.intensity}, confianza: ${e.confidence})`
    ).join(', ')
    
    const emotionText = `Estado emocional del entrevistado: ${emotionSummary}`
    this.sendContextualUpdate(emotionText)
  }

  private async handleAudioReceived(audioBase64: string, eventId: number): Promise<void> {
    try {
      // Convert base64 to audio blob
      const audioData = atob(audioBase64)
      const arrayBuffer = new ArrayBuffer(audioData.length)
      const uint8Array = new Uint8Array(arrayBuffer)
      
      for (let i = 0; i < audioData.length; i++) {
        uint8Array[i] = audioData.charCodeAt(i)
      }
      
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' })
      const audioUrl = URL.createObjectURL(audioBlob)
      
      // Create audio element and queue it
      const audio = new Audio(audioUrl)
      audio.preload = 'auto'
      
      // Add to queue
      this.audioQueue.push(audio)
      
      // Start playing if not already playing
      if (!this.isPlayingAudio) {
        this.playNextAudio()
      }
      
    } catch (error) {
      console.error('Error handling audio:', error)
    }
  }

  private async playNextAudio(): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.isPlayingAudio = false
      return
    }

    this.isPlayingAudio = true
    const audio = this.audioQueue.shift()!
    
    try {
      await audio.play()
      
      audio.onended = () => {
        URL.revokeObjectURL(audio.src)
        this.playNextAudio()
      }
      
      audio.onerror = () => {
        console.error('Error playing audio')
        URL.revokeObjectURL(audio.src)
        this.playNextAudio()
      }
      
    } catch (error) {
      console.error('Error playing audio:', error)
      URL.revokeObjectURL(audio.src)
      this.playNextAudio()
    }
  }

  public getConnectionStatus(): WebSocketConnectionStatus {
    return this.connectionStatus
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.connectionStatus = 'disconnected'
    
    // Clear audio queue
    this.audioQueue.forEach(audio => {
      URL.revokeObjectURL(audio.src)
    })
    this.audioQueue = []
    this.isPlayingAudio = false
  }
} 