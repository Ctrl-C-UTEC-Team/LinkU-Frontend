'use client'

import * as faceapi from 'face-api.js'
import type { EmotionData } from '@/types/websocket'

export interface EmotionDetectionConfig {
  preferGemini: boolean
  geminiConfig?: {
    apiKey?: string
    model?: string
    analysisInterval?: number
    confidenceThreshold?: number
  }
  faceApiModelPath?: string
  analysisInterval?: number
}

export interface EmotionDetectionCallbacks {
  onEmotionDetected: (emotions: EmotionData[]) => void
  onConnectionChange: (connected: boolean) => void
  onError: (error: Error) => void
}

export class EmotionDetectionService {
  private config: EmotionDetectionConfig
  private callbacks: EmotionDetectionCallbacks
  private connected = false
  private isDetecting = false
  private isPaused = false
  
  // face-api.js related
  private faceApiLoaded = false
  private videoElement: HTMLVideoElement | null = null
  private analysisTimer?: NodeJS.Timeout
  private canvas: HTMLCanvasElement | null = null
  
  // Gemini related
  private geminiAvailable = false
  private audioChunks: Blob[] = []
  
  // Current emotion state
  private currentEmotions: EmotionData[] = []
  private currentMood = 'neutral'
  private stressLevel = 0.5
  private engagementLevel = 0.5

  constructor(config: EmotionDetectionConfig, callbacks: EmotionDetectionCallbacks) {
    this.config = config
    this.callbacks = callbacks
    
    // Check if Gemini is available
    this.geminiAvailable = !!config.geminiConfig?.apiKey
    
    if (!this.geminiAvailable) {
      console.log('Gemini not available, using face-api.js for emotion detection')
    }
  }

  async startDetection(): Promise<void> {
    try {
      if (this.geminiAvailable && this.config.preferGemini) {
        await this.initializeGemini()
      } else {
        await this.initializeFaceApi()
      }
      
      this.connected = true
      this.isDetecting = true
      this.callbacks.onConnectionChange(true)
      
      this.startPeriodicAnalysis()
      
    } catch (error) {
      console.error('Failed to start emotion detection:', error)
      this.callbacks.onError(error as Error)
      throw error
    }
  }

  async stopDetection(): Promise<void> {
    this.isDetecting = false
    this.isPaused = false
    
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer)
      this.analysisTimer = undefined
    }
    
    this.connected = false
    this.callbacks.onConnectionChange(false)
  }

  pauseDetection(): void {
    this.isPaused = true
  }

  resumeDetection(): void {
    this.isPaused = false
  }

  private async initializeGemini(): Promise<void> {
    // For now, we'll implement basic Gemini integration
    // This would typically involve setting up API calls to Gemini Vision
    console.log('Initializing Gemini emotion detection...')
    
    // Mock implementation - replace with actual Gemini API calls
    this.geminiAvailable = true
  }

  private async initializeFaceApi(): Promise<void> {
    if (this.faceApiLoaded) return

    try {
      console.log('Loading face-api.js models...')
      
      const modelPath = this.config.faceApiModelPath || '/models'
      
      // Load face-api.js models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
        faceapi.nets.faceRecognitionNet.loadFromUri(modelPath),
        faceapi.nets.faceExpressionNet.loadFromUri(modelPath)
      ])
      
      this.faceApiLoaded = true
      console.log('face-api.js models loaded successfully')
      
    } catch (error) {
      console.error('Failed to load face-api.js models:', error)
      throw new Error('Failed to initialize face-api.js models. Make sure models are in public/models/')
    }
  }

  setVideoElement(videoElement: HTMLVideoElement): void {
    this.videoElement = videoElement
    
    if (this.faceApiLoaded && videoElement) {
      // Create canvas for face-api.js
      this.canvas = faceapi.createCanvasFromMedia(videoElement)
      this.canvas.style.position = 'absolute'
      this.canvas.style.top = '0'
      this.canvas.style.left = '0'
      this.canvas.style.pointerEvents = 'none'
      
      // Add canvas to video container if needed
      const container = videoElement.parentElement
      if (container && container.style.position !== 'absolute') {
        container.style.position = 'relative'
      }
    }
  }

  private startPeriodicAnalysis(): void {
    const interval = this.config.analysisInterval || 2000 // Default: every 2 seconds
    
    this.analysisTimer = setInterval(() => {
      if (!this.isDetecting || this.isPaused) return
      
      this.performEmotionAnalysis()
    }, interval)
  }

  private async performEmotionAnalysis(): Promise<void> {
    try {
      let emotions: EmotionData[] = []
      
      if (this.geminiAvailable && this.config.preferGemini) {
        emotions = await this.analyzeWithGemini()
      } else if (this.faceApiLoaded && this.videoElement) {
        emotions = await this.analyzeWithFaceApi()
      }
      
      if (emotions.length > 0) {
        this.currentEmotions = emotions
        this.updateEmotionalState(emotions)
        this.callbacks.onEmotionDetected(emotions)
      }
      
    } catch (error) {
      console.error('Error during emotion analysis:', error)
    }
  }

  private async analyzeWithGemini(): Promise<EmotionData[]> {
    // This would implement actual Gemini Vision API calls
    // For now, return mock data
    
    if (!this.videoElement) return []
    
    try {
      // Capture frame from video
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return []
      
      canvas.width = this.videoElement.videoWidth
      canvas.height = this.videoElement.videoHeight
      ctx.drawImage(this.videoElement, 0, 0)
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      
      // Mock Gemini analysis - replace with actual API call
      const mockEmotions: EmotionData[] = [
        {
          emotion: 'neutral',
          intensity: 0.7,
          confidence: 0.85,
          timestamp: Date.now(),
          source: 'gemini-vision'
        },
        {
          emotion: 'happy',
          intensity: 0.3,
          confidence: 0.65,
          timestamp: Date.now(),
          source: 'gemini-vision'
        }
      ]
      
      return mockEmotions
      
    } catch (error) {
      console.error('Gemini emotion analysis failed:', error)
      return []
    }
  }

  private async analyzeWithFaceApi(): Promise<EmotionData[]> {
    if (!this.videoElement || !this.faceApiLoaded) return []
    
    try {
      // Detect faces and expressions
      const detections = await faceapi
        .detectAllFaces(this.videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
      
      if (detections.length === 0) return []
      
      // Get the primary face (largest detection)
      const primaryFace = detections.reduce((prev, current) => 
        current.detection.box.area > prev.detection.box.area ? current : prev
      )
      
      const expressions = primaryFace.expressions
      const emotions: EmotionData[] = []
      
      // Convert face-api.js expressions to our format
      Object.entries(expressions).forEach(([emotion, intensity]) => {
        if (intensity > 0.1) { // Only include emotions with significant intensity
          emotions.push({
            emotion: this.mapFaceApiEmotion(emotion),
            intensity: intensity,
            confidence: intensity, // face-api.js doesn't provide separate confidence
            timestamp: Date.now(),
            source: 'face-api'
          })
        }
      })
      
      // Clear canvas and draw new detections (optional, for debugging)
      if (this.canvas) {
        const ctx = this.canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
          
          // Optionally draw face detection boxes
          // faceapi.draw.drawDetections(this.canvas, detections)
          // faceapi.draw.drawFaceExpressions(this.canvas, detections)
        }
      }
      
      return emotions.sort((a, b) => b.intensity - a.intensity) // Sort by intensity
      
    } catch (error) {
      console.error('face-api.js emotion analysis failed:', error)
      return []
    }
  }

  private mapFaceApiEmotion(faceApiEmotion: string): string {
    // Map face-api.js emotions to our standard format
    const emotionMap: { [key: string]: string } = {
      'neutral': 'neutral',
      'happy': 'happy',
      'sad': 'sad',
      'angry': 'angry',
      'fearful': 'fearful',
      'disgusted': 'disgusted',
      'surprised': 'surprised'
    }
    
    return emotionMap[faceApiEmotion] || faceApiEmotion
  }

  private updateEmotionalState(emotions: EmotionData[]): void {
    if (emotions.length === 0) return
    
    // Update current mood (strongest emotion)
    const strongestEmotion = emotions[0]
    this.currentMood = strongestEmotion.emotion
    
    // Calculate stress level
    const stressEmotions = emotions.filter(e => 
      ['angry', 'sad', 'fearful', 'disgusted'].includes(e.emotion)
    )
    const stressScore = stressEmotions.reduce((sum, e) => sum + e.intensity, 0)
    this.stressLevel = Math.min(1, Math.max(0, stressScore))
    
    // Calculate engagement level
    const engagementEmotions = emotions.filter(e => 
      ['happy', 'surprised'].includes(e.emotion)
    )
    const engagementScore = engagementEmotions.reduce((sum, e) => sum + e.intensity, 0)
    this.engagementLevel = Math.min(1, Math.max(0.2, engagementScore + 0.3)) // Base engagement
  }

  // Audio analysis for emotion detection
  analyzeAudioEmotion(audioBlob: Blob): void {
    this.audioChunks.push(audioBlob)
    
    // Keep only recent audio chunks (last 10 seconds worth)
    if (this.audioChunks.length > 10) {
      this.audioChunks = this.audioChunks.slice(-10)
    }
    
    // For now, audio emotion analysis is limited
    // This could be enhanced with more sophisticated audio analysis
  }

  forceAnalysis(): void {
    if (this.isDetecting && !this.isPaused) {
      this.performEmotionAnalysis()
    }
  }

  // Getters for current state
  isConnected(): boolean {
    return this.connected
  }

  getCurrentEmotions(): EmotionData[] {
    return [...this.currentEmotions]
  }

  getCurrentMood(): string {
    return this.currentMood
  }

  getStressLevel(): number {
    return this.stressLevel
  }

  getEngagementLevel(): number {
    return this.engagementLevel
  }

  getLastEmotionAnalysis() {
    return {
      emotions: this.currentEmotions,
      overall_mood: this.currentMood,
      stress_level: this.stressLevel,
      engagement_level: this.engagementLevel,
      timestamp: Date.now()
    }
  }

  cleanup(): void {
    this.stopDetection()
    
    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas)
    }
    
    this.videoElement = null
    this.canvas = null
    this.audioChunks = []
  }
}