'use client'

import type { EmotionData, GeminiEmotionResponse } from '@/types/websocket'

export interface EmotionDetectionConfig {
  preferGemini: boolean
  geminiConfig?: {
    apiKey?: string
    model?: string
    analysisInterval?: number
    confidenceThreshold?: number
  }
  faceApiModelPath?: string
  analysisInterval: number
}

export interface EmotionDetectionCallbacks {
  onEmotionDetected?: (emotions: EmotionData[]) => void
  onMoodChange?: (mood: string, intensity: number) => void
  onConnectionChange?: (connected: boolean) => void
  onError?: (error: Error) => void
}

export class EmotionDetectionService {
  private config: EmotionDetectionConfig
  private callbacks: EmotionDetectionCallbacks
  private isActive = false
  private isConnected = false
  private analysisTimer?: NodeJS.Timeout
  private audioBuffer: Blob[] = []
  private videoElement?: HTMLVideoElement
  private lastEmotionAnalysis: GeminiEmotionResponse | null = null
  
  // Gemini WebSocket connection (if using Gemini)
  private geminiWs: WebSocket | null = null
  
  // Face-API variables (fallback)
  private faceApiLoaded = false
  private stream: MediaStream | null = null

  constructor(config: EmotionDetectionConfig, callbacks: EmotionDetectionCallbacks) {
    this.config = config
    this.callbacks = callbacks
  }

  async startDetection(): Promise<void> {
    try {
      this.isActive = true
      
      if (this.config.preferGemini && this.config.geminiConfig?.apiKey) {
        await this.startGeminiDetection()
      } else {
        await this.startFaceApiDetection()
      }
      
      this.isConnected = true
      this.callbacks.onConnectionChange?.(true)
      this.startPeriodicAnalysis()
      
    } catch (error) {
      console.error('Failed to start emotion detection:', error)
      this.isConnected = false
      this.callbacks.onConnectionChange?.(false)
      this.callbacks.onError?.(error as Error)
      throw error
    }
  }

  async stopDetection(): Promise<void> {
    this.isActive = false
    this.stopPeriodicAnalysis()
    
    if (this.geminiWs) {
      this.geminiWs.close()
      this.geminiWs = null
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    
    this.isConnected = false
    this.callbacks.onConnectionChange?.(false)
  }

  private async startGeminiDetection(): Promise<void> {
    try {
      // Build WebSocket URL for Gemini emotion analysis
      const wsUrl = this.buildGeminiEmotionUrl()
      this.geminiWs = new WebSocket(wsUrl)

      this.geminiWs.onopen = () => {
        console.log('Gemini emotion detection connected')
        this.sendGeminiEmotionConfig()
      }

      this.geminiWs.onmessage = (event) => {
        this.handleGeminiMessage(event)
      }

      this.geminiWs.onerror = (error) => {
        console.error('Gemini emotion detection error:', error)
        this.callbacks.onError?.(new Error('Gemini emotion detection failed'))
      }

      this.geminiWs.onclose = () => {
        console.log('Gemini emotion detection disconnected')
        if (this.isActive) {
          // Fallback to face-api if Gemini fails
          console.log('Falling back to face-api.js for emotion detection')
          this.startFaceApiDetection().catch(console.error)
        }
      }

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Gemini emotion detection timeout'))
        }, 10000)

        if (this.geminiWs) {
          this.geminiWs.addEventListener('open', () => {
            clearTimeout(timeout)
            resolve()
          }, { once: true })

          this.geminiWs.addEventListener('error', () => {
            clearTimeout(timeout)
            reject(new Error('Gemini emotion detection failed'))
          }, { once: true })
        }
      })

    } catch (error) {
      console.warn('Gemini emotion detection failed, falling back to face-api.js')
      await this.startFaceApiDetection()
    }
  }

  private async startFaceApiDetection(): Promise<void> {
    try {
      console.log('Starting face-api.js emotion detection')
      
      // Initialize face-api.js if not already loaded
      if (!this.faceApiLoaded) {
        await this.loadFaceApi()
      }

      // Get video stream for face detection
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      })

      // Create video element for face detection
      this.videoElement = document.createElement('video')
      this.videoElement.srcObject = this.stream
      this.videoElement.play()

      console.log('Face-api.js emotion detection started')

    } catch (error) {
      console.error('Failed to start face-api.js emotion detection:', error)
      throw new Error('No emotion detection method available')
    }
  }

  private async loadFaceApi(): Promise<void> {
    try {
      // Mock face-api.js loading - In a real implementation, you would:
      // 1. Load the face-api.js library
      // 2. Load the required models (face detection, face landmarks, face expression)
      // 3. Initialize the models
      
      console.log('Loading face-api.js models...')
      
      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      this.faceApiLoaded = true
      console.log('Face-api.js models loaded successfully')
      
    } catch (error) {
      console.error('Failed to load face-api.js:', error)
      throw error
    }
  }

  private buildGeminiEmotionUrl(): string {
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'ws://localhost:8081/mock-gemini-emotion'
      : 'wss://your-gemini-emotion-endpoint.com/ws'
    
    const params = new URLSearchParams({
      model: this.config.geminiConfig?.model || 'gemini-pro-vision',
      api_key: this.config.geminiConfig?.apiKey || '',
      analysis_type: 'emotion_detection',
      confidence_threshold: (this.config.geminiConfig?.confidenceThreshold || 0.7).toString(),
      interval: this.config.analysisInterval.toString()
    })

    return `${baseUrl}?${params.toString()}`
  }

  private sendGeminiEmotionConfig(): void {
    if (!this.geminiWs || this.geminiWs.readyState !== WebSocket.OPEN) return

    const config = {
      type: 'configure_emotion_analysis',
      settings: {
        emotions_to_detect: [
          'happiness', 'sadness', 'anger', 'fear', 'surprise', 'disgust',
          'confidence', 'nervousness', 'excitement', 'boredom', 'confusion',
          'stress', 'engagement', 'satisfaction'
        ],
        analysis_interval: this.config.analysisInterval,
        confidence_threshold: this.config.geminiConfig?.confidenceThreshold || 0.7,
        include_micro_expressions: true,
        include_voice_analysis: true,
        language: 'es'
      },
      timestamp: Date.now()
    }

    this.geminiWs.send(JSON.stringify(config))
  }

  private handleGeminiMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'emotion_analysis':
          this.handleEmotionAnalysis(data.result)
          break
        
        case 'mood_change_detected':
          this.callbacks.onMoodChange?.(data.mood, data.intensity)
          break
        
        case 'analysis_ready':
          console.log('Gemini emotion analysis system ready')
          break
        
        case 'error':
          this.callbacks.onError?.(new Error(data.message))
          break
        
        default:
          console.log('Unknown Gemini emotion message type:', data.type)
      }
    } catch (error) {
      console.error('Error parsing Gemini emotion message:', error)
    }
  }

  private handleEmotionAnalysis(analysis: GeminiEmotionResponse): void {
    this.lastEmotionAnalysis = analysis
    
    // Filter emotions by confidence threshold
    const validEmotions = analysis.emotions.filter(
      emotion => emotion.confidence >= (this.config.geminiConfig?.confidenceThreshold || 0.7)
    )
    
    if (validEmotions.length > 0) {
      console.log('Emotions detected:', validEmotions)
      this.callbacks.onEmotionDetected?.(validEmotions)
    }
  }

  private startPeriodicAnalysis(): void {
    this.analysisTimer = setInterval(() => {
      if (!this.isActive) return

      if (this.geminiWs && this.geminiWs.readyState === WebSocket.OPEN) {
        this.processAudioBufferForGemini()
      } else if (this.faceApiLoaded && this.videoElement) {
        this.processFaceApiDetection()
      }
    }, this.config.analysisInterval)
  }

  private stopPeriodicAnalysis(): void {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer)
      this.analysisTimer = undefined
    }
  }

  private async processAudioBufferForGemini(): Promise<void> {
    if (!this.geminiWs || this.geminiWs.readyState !== WebSocket.OPEN || this.audioBuffer.length === 0) {
      return
    }

    try {
      // Combine audio chunks
      const combinedAudio = new Blob(this.audioBuffer, { type: 'audio/webm' })
      
      // Convert to base64
      const reader = new FileReader()
      reader.onload = () => {
        const base64Audio = reader.result as string
        
        const message = {
          type: 'analyze_emotion',
          audio_data: base64Audio.split(',')[1],
          timestamp: Date.now(),
          duration: this.config.analysisInterval
        }
        
        this.geminiWs!.send(JSON.stringify(message))
      }
      
      reader.readAsDataURL(combinedAudio)
      
      // Clear buffer
      this.audioBuffer = []
      
    } catch (error) {
      console.error('Error processing audio for Gemini emotion analysis:', error)
    }
  }

  private async processFaceApiDetection(): Promise<void> {
    if (!this.faceApiLoaded || !this.videoElement) return

    try {
      // Mock face-api.js emotion detection
      // In a real implementation, you would:
      // 1. Detect faces in the video frame
      // 2. Extract facial expressions
      // 3. Classify emotions
      
      const mockEmotions: EmotionData[] = this.generateMockFaceApiEmotions()
      
      if (mockEmotions.length > 0) {
        this.callbacks.onEmotionDetected?.(mockEmotions)
        
        // Update last analysis for consistency
        this.lastEmotionAnalysis = {
          emotions: mockEmotions,
          overall_mood: mockEmotions[0].emotion,
          stress_level: Math.random() * 0.6 + 0.2,
          engagement_level: Math.random() * 0.6 + 0.4
        }
      }
      
    } catch (error) {
      console.error('Error in face-api emotion detection:', error)
    }
  }

  private generateMockFaceApiEmotions(): EmotionData[] {
    // Mock emotions for face-api.js - replace with real face-api.js implementation
    const emotions = ['confidence', 'nervousness', 'engagement', 'neutral', 'happiness']
    const selectedEmotion = emotions[Math.floor(Math.random() * emotions.length)]
    
    return [{
      emotion: selectedEmotion,
      intensity: Math.random() * 0.8 + 0.2,
      confidence: Math.random() * 0.3 + 0.7,
      timestamp: Date.now()
    }]
  }

  // Public methods
  public analyzeAudioEmotion(audioBlob: Blob): void {
    if (!this.isActive) return

    // Add to buffer for Gemini analysis
    this.audioBuffer.push(audioBlob)
    
    // Limit buffer size
    const maxChunks = Math.floor(5000 / this.config.analysisInterval)
    if (this.audioBuffer.length > maxChunks) {
      this.audioBuffer = this.audioBuffer.slice(-maxChunks)
    }
  }

  public forceAnalysis(): void {
    if (this.audioBuffer.length > 0) {
      this.processAudioBufferForGemini()
    } else if (this.faceApiLoaded) {
      this.processFaceApiDetection()
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
    return this.isActive && this.isConnected
  }

  public getConnectionStatus(): boolean {
    return this.isConnected
  }
}