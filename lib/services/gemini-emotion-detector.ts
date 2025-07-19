'use client'

import type { EmotionData, GeminiEmotionResponse } from '@/types/websocket'

export interface GeminiEmotionConfig {
  apiKey: string
  model: string
  analysisInterval: number // milliseconds
  confidenceThreshold: number
}

export interface GeminiEmotionCallbacks {
  onEmotionDetected?: (emotions: EmotionData[]) => void
  onMoodChange?: (mood: string, intensity: number) => void
  onConnectionStatusChange?: (connected: boolean) => void
  onError?: (error: Error) => void
}

export class GeminiEmotionDetector {
  private ws: WebSocket | null = null
  private config: GeminiEmotionConfig
  private callbacks: GeminiEmotionCallbacks
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  private reconnectDelay = 2000
  private analysisTimer?: NodeJS.Timeout
  private audioBuffer: Blob[] = []
  private lastEmotionAnalysis: GeminiEmotionResponse | null = null

  constructor(config: GeminiEmotionConfig, callbacks: GeminiEmotionCallbacks) {
    this.config = config
    this.callbacks = callbacks
  }

  async connect(): Promise<void> {
    if (this.isConnected || this.ws?.readyState === WebSocket.CONNECTING) {
      return
    }

    try {
      // En producción, esto sería el endpoint real de Gemini para análisis de emociones
      const wsUrl = this.buildEmotionAnalysisUrl()
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

        if (this.ws) {
          this.ws.addEventListener('open', () => {
            clearTimeout(timeout)
            resolve()
          }, { once: true })

          this.ws.addEventListener('error', () => {
            clearTimeout(timeout)
            reject(new Error('Connection failed'))
          }, { once: true })
        }
      })

    } catch (error) {
      console.error('Failed to connect to Gemini emotion detector:', error)
      throw error
    }
  }

  private buildEmotionAnalysisUrl(): string {
    // URL simulada para desarrollo - en producción sería el endpoint real de Gemini
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'ws://localhost:8081/mock-gemini-emotion'
      : 'wss://your-gemini-emotion-endpoint.com/ws'
    
    const params = new URLSearchParams({
      model: this.config.model,
      api_key: this.config.apiKey,
      analysis_type: 'emotion_detection',
      confidence_threshold: this.config.confidenceThreshold.toString(),
      interval: this.config.analysisInterval.toString()
    })

    return `${baseUrl}?${params.toString()}`
  }

  private handleOpen(): void {
    console.log('Gemini Emotion Detector connected')
    this.isConnected = true
    this.reconnectAttempts = 0
    this.callbacks.onConnectionStatusChange?.(true)
    
    // Enviar configuración inicial para análisis de emociones
    this.sendEmotionAnalysisConfig()
    
    // Iniciar análisis periódico
    this.startPeriodicAnalysis()
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'emotion_analysis':
          this.handleEmotionAnalysis(data.result)
          break
        
        case 'mood_change_detected':
          this.handleMoodChange(data.mood, data.intensity)
          break
        
        case 'analysis_ready':
          console.log('Emotion analysis system ready')
          break
        
        case 'error':
          this.callbacks.onError?.(new Error(data.message))
          break
        
        default:
          console.log('Unknown emotion detector message type:', data.type)
      }
    } catch (error) {
      console.error('Error parsing emotion detector message:', error)
    }
  }

  private handleError(error: Event): void {
    console.error('Gemini Emotion Detector WebSocket error:', error)
    this.callbacks.onError?.(new Error('Emotion detection connection error'))
  }

  private handleClose(): void {
    console.log('Gemini Emotion Detector disconnected')
    this.isConnected = false
    this.callbacks.onConnectionStatusChange?.(false)
    this.stopPeriodicAnalysis()
    
    // Intentar reconexión
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++
        console.log(`Attempting emotion detector reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        this.connect().catch(console.error)
      }, this.reconnectDelay * this.reconnectAttempts)
    }
  }

  private sendEmotionAnalysisConfig(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    const config = {
      type: 'configure_emotion_analysis',
      settings: {
        emotions_to_detect: [
          'happiness', 'sadness', 'anger', 'fear', 'surprise', 'disgust',
          'confidence', 'nervousness', 'excitement', 'boredom', 'confusion',
          'stress', 'engagement', 'satisfaction'
        ],
        analysis_interval: this.config.analysisInterval,
        confidence_threshold: this.config.confidenceThreshold,
        include_micro_expressions: true,
        include_voice_analysis: true,
        language: 'es'
      },
      timestamp: Date.now()
    }

    this.ws.send(JSON.stringify(config))
  }

  private startPeriodicAnalysis(): void {
    this.analysisTimer = setInterval(() => {
      if (this.audioBuffer.length > 0) {
        this.processAudioBufferForEmotion()
      }
    }, this.config.analysisInterval)
  }

  private stopPeriodicAnalysis(): void {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer)
      this.analysisTimer = undefined
    }
  }

  private async processAudioBufferForEmotion(): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || this.audioBuffer.length === 0) {
      return
    }

    try {
      // Combinar audio chunks en un blob
      const combinedAudio = new Blob(this.audioBuffer, { type: 'audio/webm' })
      
      // Convertir a base64 para enviar
      const reader = new FileReader()
      reader.onload = () => {
        const base64Audio = reader.result as string
        
        const message = {
          type: 'analyze_emotion',
          audio_data: base64Audio.split(',')[1], // Remove data URL prefix
          timestamp: Date.now(),
          duration: this.config.analysisInterval
        }
        
        this.ws!.send(JSON.stringify(message))
      }
      
      reader.readAsDataURL(combinedAudio)
      
      // Limpiar buffer después de procesar
      this.audioBuffer = []
      
    } catch (error) {
      console.error('Error processing audio for emotion analysis:', error)
    }
  }

  private handleEmotionAnalysis(analysis: GeminiEmotionResponse): void {
    this.lastEmotionAnalysis = analysis
    
    // Filtrar emociones por umbral de confianza
    const validEmotions = analysis.emotions.filter(
      emotion => emotion.confidence >= this.config.confidenceThreshold
    )
    
    if (validEmotions.length > 0) {
      console.log('Emotions detected:', validEmotions)
      this.callbacks.onEmotionDetected?.(validEmotions)
    }
  }

  private handleMoodChange(mood: string, intensity: number): void {
    console.log('Mood change detected:', mood, 'intensity:', intensity)
    this.callbacks.onMoodChange?.(mood, intensity)
  }

  // Métodos públicos
  public addAudioChunk(audioBlob: Blob): void {
    // Añadir chunk de audio al buffer para análisis
    this.audioBuffer.push(audioBlob)
    
    // Limitar el tamaño del buffer (últimos 5 segundos de audio aproximadamente)
    const maxChunks = Math.floor(5000 / this.config.analysisInterval)
    if (this.audioBuffer.length > maxChunks) {
      this.audioBuffer = this.audioBuffer.slice(-maxChunks)
    }
  }

  public requestEmotionAnalysis(): void {
    if (this.audioBuffer.length > 0) {
      this.processAudioBufferForEmotion()
    }
  }

  public getLastEmotionAnalysis(): GeminiEmotionResponse | null {
    return this.lastEmotionAnalysis
  }

  public getCurrentMood(): string {
    return this.lastEmotionAnalysis?.overall_mood || 'neutral'
  }

  public getStressLevel(): number {
    return this.lastEmotionAnalysis?.stress_level || 0.5
  }

  public getEngagementLevel(): number {
    return this.lastEmotionAnalysis?.engagement_level || 0.5
  }

  public isAnalyzing(): boolean {
    return this.isConnected && !!this.analysisTimer
  }

  public disconnect(): void {
    this.stopPeriodicAnalysis()
    
    if (this.ws) {
      this.ws.close(1000, 'Normal closure')
      this.ws = null
    }
    
    this.isConnected = false
    this.audioBuffer = []
    this.lastEmotionAnalysis = null
  }
}

// Factory function
export function createGeminiEmotionDetector(
  apiKey: string = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'demo-key',
  options: Partial<GeminiEmotionConfig> = {}
): GeminiEmotionDetector {
  const defaultConfig: GeminiEmotionConfig = {
    apiKey,
    model: 'gemini-pro-vision', // Modelo que puede analizar audio y video
    analysisInterval: 2000, // Analizar cada 2 segundos
    confidenceThreshold: 0.7, // Solo emociones con >70% confianza
    ...options
  }

  return new GeminiEmotionDetector(defaultConfig, {})
}

// Simulador de análisis de emociones para desarrollo
export class MockEmotionAnalysis {
  static generateMockEmotion(): EmotionData[] {
    const emotions = ['confidence', 'nervousness', 'engagement', 'stress', 'excitement', 'boredom']
    const selectedEmotion = emotions[Math.floor(Math.random() * emotions.length)]
    
    return [{
      emotion: selectedEmotion,
      intensity: Math.random() * 0.8 + 0.2, // 0.2 to 1.0
      confidence: Math.random() * 0.3 + 0.7, // 0.7 to 1.0
      timestamp: Date.now()
    }]
  }
  
  static generateMockAnalysis(): GeminiEmotionResponse {
    const emotions = this.generateMockEmotion()
    
    return {
      emotions,
      overall_mood: emotions[0].emotion,
      stress_level: Math.random() * 0.6 + 0.2, // 0.2 to 0.8
      engagement_level: Math.random() * 0.6 + 0.4 // 0.4 to 1.0
    }
  }
} 