'use client'

import type { InterviewConfig } from '@/types'

interface GeminiMessage {
  type: 'text' | 'audio' | 'system'
  content: string
  timestamp: number
  role: 'user' | 'assistant'
}

interface GeminiWebSocketConfig {
  apiKey: string
  model: string
  interviewConfig: InterviewConfig
}

export class GeminiWebSocketService {
  private ws: WebSocket | null = null
  private config: GeminiWebSocketConfig
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  private reconnectDelay = 1000
  private isConnecting = false

  constructor(config: GeminiWebSocketConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return
    }

    this.isConnecting = true

    try {
      // For demo purposes, we'll use a mock WebSocket endpoint
      // In production, this would be the actual Gemini WebSocket URL
      const wsUrl = this.buildWebSocketUrl()
      
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onerror = this.handleError.bind(this)
      this.ws.onclose = this.handleClose.bind(this)

      // Wait for connection to open
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'))
        }, 10000)

        this.ws!.addEventListener('open', () => {
          clearTimeout(timeout)
          resolve(void 0)
        })

        this.ws!.addEventListener('error', () => {
          clearTimeout(timeout)
          reject(new Error('Connection failed'))
        })
      })

    } catch (error) {
      this.isConnecting = false
      throw error
    }
  }

  private buildWebSocketUrl(): string {
    // This would be the actual Gemini WebSocket endpoint
    // For now, we'll use a mock endpoint that simulates the behavior
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'ws://localhost:8080/mock-gemini-ws'
      : 'wss://your-gemini-proxy.com/ws'
    
    const params = new URLSearchParams({
      model: this.config.model,
      api_key: this.config.apiKey,
      session_type: 'interview',
      position: this.config.interviewConfig.position,
      level: this.config.interviewConfig.level,
      duration: this.config.interviewConfig.duration.toString()
    })

    return `${baseUrl}?${params.toString()}`
  }

  private handleOpen(event: Event): void {
    console.log('Gemini WebSocket connected')
    this.isConnecting = false
    this.reconnectAttempts = 0

    // Send initial configuration
    this.sendConfiguration()
    
    // Send initial interview prompt
    this.sendInitialPrompt()
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'interview_question':
          this.onInterviewQuestion?.(data.content)
          break
        
        case 'transcription':
          this.onTranscription?.(data.content)
          break
        
        case 'audio_response':
          this.onAudioResponse?.(data.audio_data, data.content)
          break
        
        case 'interview_feedback':
          this.onInterviewFeedback?.(data.feedback)
          break
        
        case 'error':
          this.onError?.(new Error(data.message))
          break
        
        default:
          console.log('Unknown message type:', data.type)
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
    }
  }

  private handleError(event: Event): void {
    console.error('WebSocket error:', event)
    this.onError?.(new Error('WebSocket connection error'))
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket closed:', event.code, event.reason)
    this.isConnecting = false
    
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++
        this.connect().catch(console.error)
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts))
    }
    
    this.onConnectionChange?.(false)
  }

  private sendConfiguration(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    const config = {
      type: 'configure_session',
      interview_config: {
        position: this.config.interviewConfig.position,
        level: this.config.interviewConfig.level,
        duration: this.config.interviewConfig.duration,
        target_company: this.config.interviewConfig.targetCompany,
        industry: this.config.interviewConfig.industry,
        language: 'es', // Spanish
        personality: 'professional_friendly'
      },
      audio_config: {
        sample_rate: 44100,
        channels: 1,
        format: 'webm'
      }
    }

    this.ws.send(JSON.stringify(config))
  }

  private sendInitialPrompt(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    const prompt = this.generateInterviewPrompt()
    
    const message = {
      type: 'start_interview',
      prompt: prompt,
      timestamp: Date.now()
    }

    this.ws.send(JSON.stringify(message))
  }

  private generateInterviewPrompt(): string {
    const { position, level, targetCompany, industry } = this.config.interviewConfig
    
    return `You are an experienced HR interviewer conducting a ${level} level interview for a ${position} position${targetCompany ? ` at ${targetCompany}` : ''}${industry ? ` in the ${industry} industry` : ''}. 

Your interview style should be:
- Professional but friendly
- Ask follow-up questions based on responses
- Evaluate communication skills, technical knowledge, and cultural fit
- Provide natural conversation flow
- Ask behavioral questions using STAR method
- Keep the interview engaging and realistic

Start with a warm welcome and ask the candidate to introduce themselves. Adapt your questions based on their responses and the specific role requirements.

Speak in Spanish and maintain a conversational tone throughout the interview.`
  }

  sendAudioChunk(audioBlob: Blob): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send audio')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64Audio = reader.result as string
      const message = {
        type: 'audio_chunk',
        audio_data: base64Audio.split(',')[1], // Remove data URL prefix
        timestamp: Date.now()
      }
      
      this.ws!.send(JSON.stringify(message))
    }
    
    reader.readAsDataURL(audioBlob)
  }

  sendTextMessage(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message')
      return
    }

    const message = {
      type: 'text_message',
      content: text,
      timestamp: Date.now()
    }

    this.ws.send(JSON.stringify(message))
  }

  sendInterviewControl(action: 'pause' | 'resume' | 'end'): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    const message = {
      type: 'interview_control',
      action: action,
      timestamp: Date.now()
    }

    this.ws.send(JSON.stringify(message))
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Normal closure')
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  // Event handlers - these should be set by the consuming component
  onConnectionChange?: (connected: boolean) => void
  onInterviewQuestion?: (question: string) => void
  onTranscription?: (text: string) => void
  onAudioResponse?: (audioData: string, text: string) => void
  onInterviewFeedback?: (feedback: any) => void
  onError?: (error: Error) => void
}

// Factory function to create a configured service
export function createGeminiWebSocketService(
  interviewConfig: InterviewConfig,
  apiKey: string = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'demo-key'
): GeminiWebSocketService {
  return new GeminiWebSocketService({
    apiKey,
    model: 'gemini-pro-audio',
    interviewConfig
  })
}

// Mock WebSocket server simulation for development
export class MockGeminiWebSocket {
  static startMockServer() {
    // This would typically be a separate Node.js process
    // For demo purposes, we'll simulate responses
    console.log('Mock Gemini WebSocket server started on ws://localhost:8080/mock-gemini-ws')
  }
  
  static generateMockResponse(userInput: string, config: InterviewConfig): string {
    const responses = [
      `Perfecto. Cuéntame sobre tu experiencia más relevante como ${config.position}.`,
      'Interesante. ¿Qué te motivó a postularte para esta posición?',
      '¿Puedes describir un desafío técnico que hayas enfrentado recientemente?',
      '¿Cómo manejas el trabajo bajo presión y los plazos ajustados?',
      '¿Qué sabes sobre nuestra empresa y por qué quieres trabajar aquí?',
      'Cuéntame sobre un proyecto del que te sientes especialmente orgulloso.',
      '¿Dónde te ves profesionalmente en los próximos 5 años?'
    ]
    
    return responses[Math.floor(Math.random() * responses.length)]
  }
}