// ElevenLabs Real-time Conversational WebSocket Client

import { 
  WebSocketIncomingMessage, 
  WebSocketOutgoingMessage, 
  ConversationInitiationClientData,
  ConversationState,
  AudioConfig,
  UserAudioChunk,
  PongEvent
} from './types'
import { getElevenLabsConfig } from './elevenlabs-config'

export class ElevenLabsRealtimeConversation {
  private ws: WebSocket | null = null
  private apiKey: string
  private agentId: string
  private mediaRecorder: MediaRecorder | null = null
  private audioContext: AudioContext | null = null
  private audioBuffer: AudioBuffer[] = []
  private isRecording: boolean = false
  private conversationState: ConversationState
  private onStateChange?: (state: ConversationState) => void
  private onTranscript?: (transcript: string) => void
  private onAgentResponse?: (response: string) => void
  private onAudioReceived?: (audioBase64: string) => void
  private onError?: (error: string) => void

  // Audio configuration for real-time processing
  private audioConfig: AudioConfig = {
    sampleRate: 16000, // ElevenLabs expects 16kHz
    channels: 1, // Mono
    bitsPerSample: 16
  }

  constructor(
    agentId: string, 
    apiKey?: string,
    callbacks?: {
      onStateChange?: (state: ConversationState) => void
      onTranscript?: (transcript: string) => void
      onAgentResponse?: (response: string) => void
      onAudioReceived?: (audioBase64: string) => void
      onError?: (error: string) => void
    }
  ) {
    this.agentId = agentId
    this.apiKey = apiKey || getElevenLabsConfig().apiKey
    this.onStateChange = callbacks?.onStateChange
    this.onTranscript = callbacks?.onTranscript
    this.onAgentResponse = callbacks?.onAgentResponse
    this.onAudioReceived = callbacks?.onAudioReceived
    this.onError = callbacks?.onError

    this.conversationState = {
      status: 'idle',
      agentId: this.agentId,
      isRecording: false,
      isSpeaking: false
    }
  }

  // Initialize audio context
  private async initAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.audioConfig.sampleRate
      })

      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }
    } catch (error) {
      console.error('Failed to initialize audio context:', error)
      throw new Error('Audio context initialization failed')
    }
  }

  // Start the WebSocket connection
  async connect(config?: {
    prompt?: string
    firstMessage?: string
    language?: string
    voiceId?: string
    temperature?: number
    maxTokens?: number
  }): Promise<void> {
    try {
      this.updateState({ status: 'connecting' })

      // Initialize audio context
      await this.initAudioContext()

      // Create WebSocket connection
      const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${this.agentId}`
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.sendInitiationData(config)
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketIncomingMessage = JSON.parse(event.data)
          this.handleIncomingMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        this.updateState({ status: 'idle' })
        this.cleanup()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.updateState({ status: 'error', error: 'WebSocket connection failed' })
        this.onError?.('WebSocket connection failed')
      }

    } catch (error) {
      console.error('Failed to connect:', error)
      this.updateState({ status: 'error', error: 'Connection failed' })
      this.onError?.('Connection failed')
    }
  }

  // Send conversation initiation data
  private sendInitiationData(config?: {
    prompt?: string
    firstMessage?: string
    language?: string
    voiceId?: string
    temperature?: number
    maxTokens?: number
  }): void {
    const elevenlabsConfig = getElevenLabsConfig()
    
    const initiationData: ConversationInitiationClientData = {
      type: "conversation_initiation_client_data",
      conversation_config_override: {
        agent: {
          ...(config?.prompt && {
            prompt: { prompt: config.prompt }
          }),
          ...(config?.firstMessage && {
            first_message: config.firstMessage
          }),
          language: config?.language || "en"
        },
        tts: {
          voice_id: config?.voiceId || elevenlabsConfig.voiceId || "21m00Tcm4TlvDq8ikWAM"
        }
      },
      custom_llm_extra_body: {
        temperature: config?.temperature || 0.7,
        max_tokens: config?.maxTokens || 150
      }
    }

    this.sendMessage(initiationData)
  }

  // Handle incoming WebSocket messages
  private handleIncomingMessage(message: WebSocketIncomingMessage): void {
    console.log('Received message:', message.type, message)

    switch (message.type) {
      case 'conversation_initiation_metadata':
        this.updateState({ 
          status: 'connected',
          conversationId: message.conversation_initiation_metadata_event.conversation_id
        })
        console.log('Conversation initialized:', message.conversation_initiation_metadata_event.conversation_id)
        break

      case 'user_transcript':
        const transcript = message.user_transcription_event.user_transcript
        this.updateState({ currentTranscript: transcript })
        this.onTranscript?.(transcript)
        break

      case 'agent_response':
        const response = message.agent_response_event.agent_response
        this.updateState({ 
          lastAgentResponse: response,
          status: 'connected'
        })
        this.onAgentResponse?.(response)
        break

      case 'audio':
        this.updateState({ isSpeaking: true })
        this.playAudioFromBase64(message.audio_event.audio_base_64)
        this.onAudioReceived?.(message.audio_event.audio_base_64)
        break

      case 'ping':
        // Respond to ping with pong
        const pong: PongEvent = {
          type: 'pong',
          event_id: message.ping_event.event_id
        }
        this.sendMessage(pong)
        break

      case 'vad_score':
        // Voice Activity Detection score - could be used for UI feedback
        console.log('VAD Score:', message.vad_score_event.vad_score)
        break

      case 'internal_tentative_agent_response':
        // Tentative response - could be used for real-time typing indicators
        console.log('Tentative response:', message.tentative_agent_response_internal_event.tentative_agent_response)
        break

      default:
        console.log('Unhandled message type:', message)
    }
  }

  // Start recording user audio
  async startRecording(): Promise<void> {
    try {
      if (this.isRecording) return

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.audioConfig.sampleRate,
          channelCount: this.audioConfig.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000
      })

      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          await this.processAudioChunk(event.data)
        }
      }

      this.mediaRecorder.start(100) // Collect data every 100ms
      this.isRecording = true
      this.updateState({ 
        isRecording: true,
        status: 'listening'
      })

      console.log('Recording started')
    } catch (error) {
      console.error('Failed to start recording:', error)
      this.onError?.('Failed to start recording')
    }
  }

  // Stop recording user audio
  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop()
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop())
      this.isRecording = false
      this.updateState({ 
        isRecording: false,
        status: 'processing'
      })
      console.log('Recording stopped')
    }
  }

  // Process audio chunk and send to WebSocket
  private async processAudioChunk(audioBlob: Blob): Promise<void> {
    try {
      // Convert blob to ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer()
      
      // Convert to base64
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      )

      // Send audio chunk via WebSocket
      const audioMessage: UserAudioChunk = {
        user_audio_chunk: base64Audio
      }

      this.sendMessage(audioMessage)
    } catch (error) {
      console.error('Failed to process audio chunk:', error)
    }
  }

  // Play audio from base64 data
  private async playAudioFromBase64(base64Audio: string): Promise<void> {
    try {
      if (!this.audioContext) return

      // Decode base64 to ArrayBuffer
      const binaryString = atob(base64Audio)
      const arrayBuffer = new ArrayBuffer(binaryString.length)
      const uint8Array = new Uint8Array(arrayBuffer)
      
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i)
      }

      // Decode audio data
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      
      // Create audio source and play
      const source = this.audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(this.audioContext.destination)
      
      source.onended = () => {
        this.updateState({ isSpeaking: false })
      }

      source.start(0)
      console.log('Playing agent audio response')
    } catch (error) {
      console.error('Failed to play audio:', error)
      this.updateState({ isSpeaking: false })
    }
  }

  // Send a text message (alternative to audio)
  sendTextMessage(text: string): void {
    const message = {
      type: "user_message" as const,
      text
    }
    this.sendMessage(message)
  }

  // Send contextual update
  sendContextualUpdate(context: string): void {
    const message = {
      type: "contextual_update" as const,
      text: context
    }
    this.sendMessage(message)
  }

  // Send user activity ping
  sendUserActivity(): void {
    const message = {
      type: "user_activity" as const
    }
    this.sendMessage(message)
  }

  // Generic message sender
  private sendMessage(message: WebSocketOutgoingMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, cannot send message')
    }
  }

  // Update conversation state
  private updateState(updates: Partial<ConversationState>): void {
    this.conversationState = { ...this.conversationState, ...updates }
    this.onStateChange?.(this.conversationState)
  }

  // Get current state
  getState(): ConversationState {
    return { ...this.conversationState }
  }

  // Disconnect and cleanup
  disconnect(): void {
    this.cleanup()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.updateState({ status: 'idle' })
  }

  // Cleanup resources
  private cleanup(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.stopRecording()
    }
    
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    this.audioBuffer = []
  }

  // Check if WebSocket is connected
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
} 