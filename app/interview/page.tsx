'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Pause, 
  Play, 
  StopCircle, 
  MessageSquare,
  Clock,
  Volume2,
  Settings
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  useInterviewStore, 
  useCurrentEmotions, 
  useCurrentMood, 
  useStressLevel,
  useConnectionState 
} from '@/lib/stores/interview-store'
import { formatDuration, cn } from '@/lib/utils'
import type { InterviewConfig, ChatMessage } from '@/types'
import { OfficialConversation } from '@/components/official-conversation'

export default function InterviewPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  
  const {
    currentSession,
    mediaStream,
    isRecording,
    aiStatus,
    transcript,
    currentMessage,
    initializeSession,
    startInterview,
    stopInterview,
    setMediaStream,
    setRecording,
    sendAudioChunk,
    updateAIStatus,
    addMessage,
  } = useInterviewStore()

  // New emotion state hooks
  const connectionState = useConnectionState()
  const currentEmotions = useCurrentEmotions()
  const currentMood = useCurrentMood()
  const stressLevel = useStressLevel()

  const [sessionTime, setSessionTime] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [config, setConfig] = useState<InterviewConfig | null>(null)

  // Initialize session from storage
  useEffect(() => {
    const savedConfig = sessionStorage.getItem('interviewConfig')
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig) as InterviewConfig
      setConfig(parsedConfig)
      initializeSession(parsedConfig)
    } else {
      router.push('/setup')
    }
  }, [initializeSession, router])

  // Setup media stream
  useEffect(() => {
    let stream: MediaStream | null = null

    const setupMedia = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100
          }
        })

        setMediaStream(stream)
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        // Setup audio analysis
        setupAudioAnalysis(stream)
        
        // Setup audio recording
        setupAudioRecording(stream)

      } catch (error) {
        console.error('Error setting up media:', error)
      }
    }

    setupMedia()

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [setMediaStream])

  // Start interview when session is ready
  useEffect(() => {
    if (currentSession && currentSession.status === 'configuring') {
      startInterview().catch(console.error)
    }
  }, [currentSession, startInterview])

  // Set video element for emotion detection when video is ready
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      // The integrated service will handle setting up emotion detection
      // This happens automatically through the store
    }
  }, [mediaStream])

  // Session timer
  useEffect(() => {
    if (currentSession?.status === 'in-progress' && !isPaused) {
      const interval = setInterval(() => {
        setSessionTime(prev => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [currentSession?.status, isPaused])

  const setupAudioAnalysis = (stream: MediaStream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }

    const audioContext = audioContextRef.current
    const analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(stream)
    
    source.connect(analyser)
    analyser.fftSize = 256
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    
    const updateAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      setAudioLevel(average)
      requestAnimationFrame(updateAudioLevel)
    }
    
    updateAudioLevel()
  }

  const setupAudioRecording = (stream: MediaStream) => {
    const audioTrack = stream.getAudioTracks()[0]
    if (!audioTrack) return

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    })
    
    mediaRecorderRef.current = mediaRecorder

    let audioChunks: Blob[] = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
        // Send chunk to AI for real-time processing
        sendAudioChunk(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      audioChunks = []
      
      // Create message from recorded audio
      const message: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: currentMessage || '[Audio Response]',
        timestamp: Date.now(),
        audioData: audioBlob,
        transcription: currentMessage,
      }
      
      addMessage(message)
    }
  }

  // Remove the old startInterview function as it's now handled by the store

  const toggleRecording = () => {
    if (!mediaRecorderRef.current) return

    if (isRecording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
      updateAIStatus('processing')
    } else {
      mediaRecorderRef.current.start(1000) // Send chunks every second
      setRecording(true)
      updateAIStatus('listening')
    }
  }

  const pauseInterview = () => {
    setIsPaused(!isPaused)
    if (isRecording) {
      toggleRecording()
    }
  }

  const endInterview = async () => {
    if (isRecording) {
      toggleRecording()
    }
    
    try {
      await stopInterview()
      router.push('/results')
    } catch (error) {
      console.error('Error ending interview:', error)
    }
  }

  const getAIStatusText = () => {
    switch (aiStatus) {
      case 'listening': return 'Listening...'
      case 'processing': return 'Processing your response...'
      case 'responding': return 'AI is responding...'
      default: return 'Ready'
    }
  }

  const progress = config ? (sessionTime / (config.duration * 60)) * 100 : 0

  if (!config || !currentSession) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white">Loading interview...</div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {config.position} Interview - {config.level} Level
            </h1>
            <p className="text-gray-300">
              {config.targetCompany && `${config.targetCompany} • `}
              Duration: {config.duration} minutes
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-mono">
                {formatDuration(sessionTime)}
              </div>
              <div className="text-sm text-gray-400">
                / {formatDuration(config.duration * 60)}
              </div>
            </div>
            <Button 
              variant="destructive" 
              onClick={endInterview}
              className="gap-2"
            >
              <StopCircle className="w-4 h-4" />
              End Interview
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video & Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Video Preview */}
            <Card className="p-4 bg-black/50 backdrop-blur">
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                {/* Audio Level Indicator */}
                <div className="absolute top-4 right-4">
                  <div className={cn(
                    "w-4 h-4 rounded-full transition-all duration-150",
                    audioLevel > 30 ? "bg-green-500" : "bg-gray-500"
                  )} 
                  style={{ 
                    transform: `scale(${1 + (audioLevel / 100)})`,
                    opacity: audioLevel > 10 ? 1 : 0.5
                  }} />
                </div>

                {/* Recording Indicator */}
                <AnimatePresence>
                  {isRecording && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/80 px-3 py-1 rounded-full"
                    >
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-xs font-medium">REC</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>

            {/* Controls */}
            <Card className="p-4 bg-gray-800/50 backdrop-blur">
              <div className="space-y-4">
                {/* AI Status */}
                <div className="text-center">
                  <div className={cn(
                    "inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm",
                    aiStatus === 'listening' && "bg-green-500/20 text-green-400",
                    aiStatus === 'processing' && "bg-yellow-500/20 text-yellow-400",
                    aiStatus === 'responding' && "bg-blue-500/20 text-blue-400",
                    aiStatus === 'idle' && "bg-gray-500/20 text-gray-400"
                  )}>
                    <Volume2 className="w-4 h-4" />
                    {getAIStatusText()}
                  </div>
                </div>

                {/* Connection Status */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded",
                    connectionState.elevenlabs ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  )}>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      connectionState.elevenlabs ? "bg-green-400" : "bg-red-400"
                    )} />
                    ElevenLabs
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded",
                    connectionState.gemini ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  )}>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      connectionState.gemini ? "bg-green-400" : "bg-red-400"
                    )} />
                    Emotion AI
                  </div>
                </div>

                {/* Emotion Display */}
                <div className="space-y-2">
                  <div className="text-center">
                    <div className="text-sm text-gray-400">Current Mood</div>
                    <div className={cn(
                      "text-lg font-semibold capitalize",
                      currentMood === 'happy' && "text-green-400",
                      currentMood === 'sad' && "text-blue-400",
                      currentMood === 'angry' && "text-red-400",
                      currentMood === 'surprised' && "text-yellow-400",
                      currentMood === 'fearful' && "text-purple-400",
                      currentMood === 'disgusted' && "text-orange-400",
                      currentMood === 'neutral' && "text-gray-400"
                    )}>
                      {currentMood}
                    </div>
                  </div>

                  {/* Stress Level Indicator */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Stress Level</span>
                      <span>{Math.round(stressLevel * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={cn(
                          "h-2 rounded-full transition-all duration-500",
                          stressLevel < 0.3 ? "bg-green-500" :
                          stressLevel < 0.7 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${stressLevel * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Recent Emotions */}
                  {currentEmotions.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Recent Emotions</div>
                      <div className="flex flex-wrap gap-1">
                        {currentEmotions.slice(0, 3).map((emotion, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-gray-700/50 rounded text-xs"
                          >
                            {emotion.emotion} ({Math.round(emotion.intensity * 100)}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Controls */}
                <div className="flex justify-center gap-2">
                  <Button
                    onClick={toggleRecording}
                    size="lg"
                    variant={isRecording ? "destructive" : "default"}
                    className="gap-2"
                    disabled={currentSession.status !== 'in-progress'}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-5 h-5" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5" />
                        Speak
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={pauseInterview}
                    size="lg"
                    variant="secondary"
                    className="gap-2"
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-5 h-5" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="w-5 h-5" />
                        Pause
                      </>
                    )}
                  </Button>
                </div>

                {/* Current Transcription */}
                {currentMessage && (
                  <div className="p-3 bg-gray-700/50 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Live Transcription:</div>
                    <div className="text-sm">{currentMessage}</div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Conversación Oficial ElevenLabs */}
          <div className="lg:col-span-2">
            <OfficialConversation 
              agentId={process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "agent_01k0hgmx13e0htbvt8k8bp6gwy"}
              config={{
                firstMessage: `¡Hola! Soy Andrea, tu entrevistadora de IA. Es un placer conocerte. Vamos a realizar una entrevista para el puesto de ${config?.position || 'desarrollador'}. ¿Podrías comenzar presentándote brevemente?`,
                language: "es",
                voiceId: process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"
              }}
              className="h-[600px]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}