"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Phone, 
  PhoneOff,
  MessageCircle,
  Brain,
  Loader2,
  Wifi,
  WifiOff,
  Heart,
  TrendingUp,
  AlertTriangle
} from "lucide-react"
import { 
  useInterviewStore,
  useInterviewSession,
  useConnectionState,
  useTranscript,
  useCurrentEmotions,
  useCurrentMood,
  useStressLevel,
  useEngagementLevel,
  useSelectedAgent
} from "@/lib/stores/interview-store"
import { AgentSelector } from "@/components/agent-selector"
import type { InterviewConfig } from '@/types'

interface RealtimeConversationProps {
  interviewConfig: InterviewConfig
  className?: string
}

export function RealtimeConversation({ 
  interviewConfig,
  className 
}: RealtimeConversationProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [error, setError] = useState("")
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Store hooks
  const currentSession = useInterviewSession()
  const connectionState = useConnectionState()
  const transcript = useTranscript()
  const currentEmotions = useCurrentEmotions()
  const currentMood = useCurrentMood()
  const stressLevel = useStressLevel()
  const engagementLevel = useEngagementLevel()
  const selectedAgent = useSelectedAgent()

  const {
    initializeSession,
    startInterview,
    stopInterview,
    sendAudioChunk,
    sendUserMessage,
    sendUserActivity,
    updateMediaPermissions,
    setRecording
  } = useInterviewStore()

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [transcript])

  // Initialize session when component mounts
  useEffect(() => {
    if (!currentSession) {
      initializeSession(interviewConfig)
    }
  }, [interviewConfig, currentSession, initializeSession])

  // Get media permissions
  const requestMediaPermissions = async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        },
        video: false
      })
      
      updateMediaPermissions({ microphone: 'granted' })
      setMediaStream(stream)
      return stream
    } catch (error) {
      console.error('Failed to get media permissions:', error)
      updateMediaPermissions({ microphone: 'denied' })
      throw new Error('Please allow microphone access to continue')
    }
  }

  // Start interview
  const handleStartInterview = async () => {
    try {
      setError("")
      
      if (!currentSession) {
        throw new Error('No session configured')
      }

      // Request media permissions first
      const stream = await requestMediaPermissions()
      
      // Start the integrated interview service
      await startInterview()
      
      console.log('Interview started successfully')
      
    } catch (error: any) {
      console.error('Failed to start interview:', error)
      setError(error.message || 'Failed to start interview')
    }
  }

  // Stop interview
  const handleStopInterview = async () => {
    try {
      await stopInterview()
      stopRecording()
      
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop())
        setMediaStream(null)
      }
      
      console.log('Interview stopped')
      
    } catch (error: any) {
      console.error('Failed to stop interview:', error)
      setError(error.message || 'Failed to stop interview')
    }
  }

  // Start recording
  const startRecording = async () => {
    if (!mediaStream || !isInterviewActive()) {
      setError("Interview not active or media not available")
      return
    }

    try {
      audioChunksRef.current = []
      
      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          
          // Send audio chunk for processing
          sendAudioChunk(event.data)
        }
      }
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        setError('Recording error occurred')
      }
      
      mediaRecorder.start(1000) // Capture chunks every 1 second
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      setRecording(true)
      
      // Send user activity signal
      sendUserActivity()
      
    } catch (error: any) {
      console.error('Failed to start recording:', error)
      setError('Failed to start recording')
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
      setIsRecording(false)
      setRecording(false)
    }
  }

  // Toggle recording
  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Send text message
  const handleSendTextMessage = () => {
    if (!isInterviewActive()) {
      setError("Interview not active")
      return
    }

    const message = prompt("Enter your message:")
    if (message && message.trim()) {
      sendUserMessage(message.trim())
    }
  }

  // Helper functions
  const isInterviewActive = () => {
    return connectionState.overall === 'connected' && 
           connectionState.elevenlabs && 
           connectionState.gemini
  }

  const getOverallStatusColor = () => {
    switch (connectionState.overall) {
      case 'connected': return 'bg-green-500'
      case 'connecting': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getOverallStatusText = () => {
    switch (connectionState.overall) {
      case 'connected': return 'Interview Active'
      case 'connecting': return 'Starting Interview...'
      case 'error': return 'Connection Error'
      default: return 'Disconnected'
    }
  }

  const getEmotionColor = (emotion: string) => {
    const colorMap: Record<string, string> = {
      'confidence': 'text-green-600',
      'nervousness': 'text-orange-600',
      'stress': 'text-red-600',
      'engagement': 'text-blue-600',
      'excitement': 'text-purple-600',
      'boredom': 'text-gray-600',
      'happiness': 'text-yellow-600',
      'sadness': 'text-blue-800'
    }
    return colorMap[emotion.toLowerCase()] || 'text-gray-600'
  }

  const getStressLevelLabel = (level: number) => {
    if (level > 0.7) return 'Alto'
    if (level > 0.4) return 'Moderado'
    return 'Bajo'
  }

  const getEngagementLevelLabel = (level: number) => {
    if (level > 0.7) return 'Alto'
    if (level > 0.4) return 'Moderado'
    return 'Bajo'
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording()
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [mediaStream])

  const canRecord = isInterviewActive() && mediaStream && !isMuted
  const isConnected = connectionState.overall !== 'disconnected'

  // If no agent is selected, show agent selector
  if (!selectedAgent) {
    return (
      <div className={`w-full max-w-4xl mx-auto space-y-6 ${className}`}>
        <AgentSelector 
          interviewConfig={interviewConfig}
          onAgentSelected={() => {
            console.log('Agent selected successfully')
          }}
        />
      </div>
    )
  }

  return (
    <Card className={`w-full max-w-4xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedAgent.avatar ? (
            <img 
              src={selectedAgent.avatar} 
              alt={selectedAgent.name}
              className="w-10 h-10 rounded-full border-2 border-blue-200"
            />
          ) : (
            <Brain className="h-10 w-10 text-blue-600" />
          )}
          <div>
            <h3 className="text-lg font-semibold">Entrevista con {selectedAgent.name}</h3>
            <p className="text-sm text-muted-foreground">
              {selectedAgent.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${getOverallStatusColor()} text-white`}>
            <div className="flex items-center gap-1">
              {connectionState.overall === 'connecting' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isConnected ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              {getOverallStatusText()}
            </div>
          </Badge>
        </div>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <div className={`w-3 h-3 rounded-full ${connectionState.elevenlabs ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">ElevenLabs</span>
          <span className="text-xs text-muted-foreground">
            {connectionState.elevenlabs ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <div className={`w-3 h-3 rounded-full ${connectionState.gemini ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">Gemini (Emociones)</span>
          <span className="text-xs text-muted-foreground">
            {connectionState.gemini ? 'Analizando' : 'Desconectado'}
          </span>
        </div>
      </div>

      {/* Interview Controls */}
      <div className="flex gap-2">
        {!isConnected ? (
          <Button onClick={handleStartInterview} className="flex-1">
            <Phone className="h-4 w-4 mr-2" />
            Iniciar Entrevista
          </Button>
        ) : (
          <Button onClick={handleStopInterview} variant="destructive" className="flex-1">
            <PhoneOff className="h-4 w-4 mr-2" />
            Finalizar Entrevista
          </Button>
        )}
        
        <Button 
          onClick={() => setIsMuted(!isMuted)} 
          variant="outline"
          disabled={!isConnected}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Audio Controls */}
      {isInterviewActive() && (
        <div className="flex gap-2">
          <Button
            onClick={handleToggleRecording}
            disabled={!canRecord}
            variant={isRecording ? "destructive" : "default"}
            className="flex-1"
          >
            {isRecording ? (
              <>
                <MicOff className="h-4 w-4 mr-2" />
                Detener Grabación
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Iniciar Grabación
              </>
            )}
          </Button>
          
          <Button onClick={handleSendTextMessage} variant="outline">
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Emotion Dashboard */}
      {isInterviewActive() && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            <div>
              <div className="text-sm font-medium">Estado Emocional</div>
              <div className={`text-sm ${getEmotionColor(currentMood)}`}>
                {currentMood || 'Neutral'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <div>
              <div className="text-sm font-medium">Nivel de Estrés</div>
              <div className={`text-sm ${stressLevel > 0.6 ? 'text-red-600' : 'text-green-600'}`}>
                {getStressLevelLabel(stressLevel)} ({Math.round(stressLevel * 100)}%)
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-sm font-medium">Compromiso</div>
              <div className={`text-sm ${engagementLevel > 0.6 ? 'text-green-600' : 'text-orange-600'}`}>
                {getEngagementLevelLabel(engagementLevel)} ({Math.round(engagementLevel * 100)}%)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversation Transcript */}
      <div className="space-y-4">
        <div 
          ref={transcriptRef}
          className="min-h-[300px] max-h-[400px] overflow-y-auto p-4 bg-muted rounded-lg space-y-3"
        >
          {transcript.length > 0 ? (
            transcript.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-100 dark:bg-blue-900 ml-8'
                    : 'bg-green-100 dark:bg-green-900 mr-8'
                }`}
              >
                <div className="text-xs text-muted-foreground mb-1">
                  {message.role === 'user' ? 'Tú:' : 'Entrevistador:'}
                  <span className="ml-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm">{message.content}</div>
              </div>
            ))
          ) : isInterviewActive() ? (
            <div className="text-center text-muted-foreground py-8">
              <Mic className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Presiona "Iniciar Grabación" para comenzar a hablar</p>
              <p className="text-xs mt-2">
                El entrevistador te dará la bienvenida automáticamente
              </p>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Presiona "Iniciar Entrevista" para comenzar</p>
            </div>
          )}
          
          {isRecording && (
            <div className="bg-red-100 dark:bg-red-900 p-3 rounded-lg animate-pulse">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Grabando...</span>
                <div className="flex gap-1">
                  <div className="w-1 h-4 bg-red-500 animate-pulse"></div>
                  <div className="w-1 h-4 bg-red-500 animate-pulse delay-75"></div>
                  <div className="w-1 h-4 bg-red-500 animate-pulse delay-150"></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900 p-3 rounded border border-red-200 dark:border-red-800">
            <div className="text-red-800 dark:text-red-200 text-sm">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}
      </div>

      {/* Current Emotions Display */}
      {currentEmotions.length > 0 && (
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm font-medium mb-2">Emociones Detectadas:</div>
          <div className="flex flex-wrap gap-2">
            {currentEmotions.map((emotion, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className={`text-xs ${getEmotionColor(emotion.emotion)}`}
              >
                {emotion.emotion} ({Math.round(emotion.intensity * 100)}%)
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
        <p><strong>Instrucciones:</strong></p>
        <p>1. Presiona "Iniciar Entrevista" para conectar con ElevenLabs y Gemini</p>
        <p>2. Presiona "Iniciar Grabación" para hablar con el entrevistador de IA</p>
        <p>3. El sistema analizará tus emociones en tiempo real y las mostrará arriba</p>
        <p>4. El entrevistador ajustará su estilo basándose en tu estado emocional</p>
      </div>
    </Card>
  )
} 