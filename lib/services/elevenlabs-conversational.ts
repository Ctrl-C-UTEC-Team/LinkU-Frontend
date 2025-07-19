'use client'

import type { EmotionData } from '@/types/websocket'

export interface ElevenLabsConversationalConfig {
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

export interface ElevenLabsConversationalCallbacks {
  onConnectionChange: (connected: boolean) => void
  onConversationStart: () => void
  onConversationEnd: () => void
  onUserTranscript: (transcript: string) => void
  onAgentResponse: (response: string) => void
  onAudioReceived: (audioBase64: string, eventId: number) => void
  onError: (error: Error) => void
}

export class ElevenLabsConversationalService {
  private ws: WebSocket | null = null
  private config: ElevenLabsConversationalConfig
  private callbacks: ElevenLabsConversationalCallbacks
  private connected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  private audioQueue: HTMLAudioElement[] = []
  private isPlayingAudio = false
  private conversationActive = false

  constructor(config: ElevenLabsConversationalConfig, callbacks: ElevenLabsConversationalCallbacks) {
    this.config = config
    this.callbacks = callbacks
  }

  async startConversation(): Promise<void> {
    try {
      await this.connect()
      this.conversationActive = true
      this.callbacks.onConversationStart()
    } catch (error) {
      console.error('Failed to start conversation:', error)
      throw error
    }
  }

  async endConversation(): Promise<void> {
    this.conversationActive = false
    this.disconnect()
    this.callbacks.onConversationEnd()
  }

  async connect(): Promise<void> {
    if (this.connected) return

    try {
      const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${this.config.agentId}`
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onerror = this.handleError.bind(this)
      this.ws.onclose = this.handleClose.bind(this)

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'))
        }, 10000)

        this.ws!.addEventListener('open', () => {
          clearTimeout(timeout)
          resolve()
        }, { once: true })

        this.ws!.addEventListener('error', () => {
          clearTimeout(timeout)
          reject(new Error('Connection failed'))
        }, { once: true })
      })

    } catch (error) {
      console.error('Failed to connect to ElevenLabs:', error)
      throw error
    }
  }

  private handleOpen(): void {
    console.log('ElevenLabs connected')
          this.connected = true
    this.reconnectAttempts = 0
    this.callbacks.onConnectionChange(true)

    // Send initial configuration
    this.sendInitialConfiguration()
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'conversation_initiation_metadata':
          console.log('Conversation initiated:', data.conversation_initiation_metadata_event)
          break

        case 'user_transcript':
          this.callbacks.onUserTranscript(data.user_transcription_event.user_transcript)
          break

        case 'agent_response':
          this.callbacks.onAgentResponse(data.agent_response_event.agent_response)
          break

        case 'audio':
          this.handleAudioReceived(data.audio_event.audio_base_64, data.audio_event.event_id)
          this.callbacks.onAudioReceived(data.audio_event.audio_base_64, data.audio_event.event_id)
          break

        case 'ping':
          this.sendPong(data.ping_event.event_id, data.ping_event.ping_ms)
          break

        case 'vad_score':
          // Voice activity detection score
          break

        case 'interruption':
          console.log('Conversation interrupted:', data.interruption_event)
          break

        default:
          console.log('Unknown ElevenLabs message:', data.type)
      }
    } catch (error) {
      console.error('Error parsing ElevenLabs message:', error)
    }
  }

  private handleError(error: Event): void {
    console.error('ElevenLabs WebSocket error:', error)
    this.callbacks.onError(new Error('ElevenLabs connection error'))
  }

  private handleClose(): void {
    console.log('ElevenLabs connection closed')
    this.connected = false
    this.callbacks.onConnectionChange(false)

    // Attempt reconnection if conversation is still active
    if (this.conversationActive && this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++
        console.log(`Reconnecting to ElevenLabs (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        this.connect().catch(console.error)
      }, 2000 * this.reconnectAttempts)
    }
  }

  private sendInitialConfiguration(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    const initMessage = {
      type: "conversation_initiation_client_data",
      conversation_config_override: this.config.conversationConfig,
      custom_llm_extra_body: this.config.customLLMConfig
    }

    this.ws.send(JSON.stringify(initMessage))
  }

  private sendPong(eventId: number, pingMs?: number): void {
    const delay = pingMs || 0

    setTimeout(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const pongMessage = {
          type: "pong",
          event_id: eventId
        }
        this.ws.send(JSON.stringify(pongMessage))
      }
    }, delay)
  }

  sendAudioChunk(audioBase64: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('ElevenLabs not connected, cannot send audio')
      return
    }

    const audioMessage = {
      user_audio_chunk: audioBase64
    }
    this.ws.send(JSON.stringify(audioMessage))
  }

  sendUserMessage(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('ElevenLabs not connected, cannot send message')
      return
    }

    const userMessage = {
      type: "user_message",
      text: text
    }
    this.ws.send(JSON.stringify(userMessage))
  }

  sendContextualUpdate(context: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('ElevenLabs not connected, cannot send context')
      return
    }

    const contextMessage = {
      type: "contextual_update",
      text: context
    }
    this.ws.send(JSON.stringify(contextMessage))
  }

  sendUserActivity(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    const activityMessage = {
      type: "user_activity"
    }
    this.ws.send(JSON.stringify(activityMessage))
  }

  sendEmotionUpdate(emotions: EmotionData[]): void {
    if (!emotions.length) return

    const emotionSummary = emotions.map(e => 
      `${e.emotion} (${Math.round(e.intensity * 100)}%)`
    ).join(', ')

    const emotionContext = `Estado emocional actual del candidato: ${emotionSummary}. Ajusta tu estilo de entrevista para ser más empático y apropiado según estas emociones.`
    
    this.sendContextualUpdate(emotionContext)
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

      // Create and queue audio
      const audio = new Audio(audioUrl)
      audio.preload = 'auto'
      this.audioQueue.push(audio)

      // Start playing if not already playing
      if (!this.isPlayingAudio) {
        this.playNextAudio()
      }

    } catch (error) {
      console.error('Error handling audio from ElevenLabs:', error)
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
        console.error('Error playing ElevenLabs audio')
        URL.revokeObjectURL(audio.src)
        this.playNextAudio()
      }

    } catch (error) {
      console.error('Error playing audio:', error)
      URL.revokeObjectURL(audio.src)
      this.playNextAudio()
    }
  }

  pause(): void {
    // ElevenLabs doesn't have native pause, so we'll stop sending audio
    console.log('Pausing ElevenLabs conversation')
  }

  resume(): void {
    console.log('Resuming ElevenLabs conversation')
  }

  isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN
  }

  disconnect(): void {
    this.conversationActive = false

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.connected = false

    // Clear audio queue
    this.audioQueue.forEach(audio => {
      URL.revokeObjectURL(audio.src)
    })
    this.audioQueue = []
    this.isPlayingAudio = false
  }

  cleanup(): void {
    this.disconnect()
  }
}