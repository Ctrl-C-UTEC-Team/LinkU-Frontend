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
  WifiOff
} from "lucide-react"
import { ElevenLabsRealtimeConversation } from "@/lib/elevenlabs-realtime"
import { ConversationState } from "@/lib/types"

interface RealtimeConversationProps {
  agentId: string
  config?: {
    prompt?: string
    firstMessage?: string
    language?: string
    voiceId?: string
    temperature?: number
    maxTokens?: number
  }
  className?: string
}

export function RealtimeConversation({ 
  agentId, 
  config,
  className 
}: RealtimeConversationProps) {
  const [conversationState, setConversationState] = useState<ConversationState>({
    status: 'idle',
    agentId,
    isRecording: false,
    isSpeaking: false
  })
  
  const [transcript, setTranscript] = useState<string>("")
  const [agentResponse, setAgentResponse] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [isMuted, setIsMuted] = useState(false)
  
  const conversationRef = useRef<ElevenLabsRealtimeConversation | null>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [transcript, agentResponse])

  // Initialize conversation
  const initializeConversation = () => {
    if (conversationRef.current) {
      conversationRef.current.disconnect()
    }

    conversationRef.current = new ElevenLabsRealtimeConversation(
      agentId,
      undefined, // Use default API key
      {
        onStateChange: (state) => {
          setConversationState(state)
          if (state.error) {
            setError(state.error)
          }
        },
        onTranscript: (text) => {
          setTranscript(text)
        },
        onAgentResponse: (response) => {
          setAgentResponse(response)
        },
        onAudioReceived: (audioBase64) => {
          // Audio is automatically played by the WebSocket client
          console.log('Received audio response')
        },
        onError: (errorMsg) => {
          setError(errorMsg)
        }
      }
    )
  }

  // Connect to conversation
  const handleConnect = async () => {
    try {
      setError("")
      initializeConversation()
      await conversationRef.current?.connect(config)
    } catch (error) {
      console.error('Failed to connect:', error)
      setError('Failed to connect to conversation')
    }
  }

  // Disconnect from conversation
  const handleDisconnect = () => {
    conversationRef.current?.disconnect()
    setTranscript("")
    setAgentResponse("")
    setError("")
  }

  // Toggle recording
  const handleToggleRecording = async () => {
    if (!conversationRef.current?.isConnected()) {
      setError("Not connected to conversation")
      return
    }

    if (conversationState.isRecording) {
      conversationRef.current.stopRecording()
    } else {
      try {
        await conversationRef.current.startRecording()
      } catch (error) {
        setError("Failed to start recording. Please allow microphone access.")
      }
    }
  }

  // Send text message as fallback
  const handleSendTextMessage = () => {
    if (!conversationRef.current?.isConnected()) {
      setError("Not connected to conversation")
      return
    }

    const message = prompt("Enter your message:")
    if (message) {
      conversationRef.current.sendTextMessage(message)
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500'
      case 'connecting': return 'bg-yellow-500'
      case 'listening': return 'bg-blue-500'
      case 'speaking': return 'bg-purple-500'
      case 'processing': return 'bg-orange-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'idle': return 'Disconnected'
      case 'connecting': return 'Connecting...'
      case 'connected': return 'Connected'
      case 'listening': return 'Listening'
      case 'speaking': return 'Agent Speaking'
      case 'processing': return 'Processing...'
      case 'error': return 'Error'
      default: return status
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      conversationRef.current?.disconnect()
    }
  }, [])

  const isConnected = conversationState.status !== 'idle' && conversationState.status !== 'error'
  const canRecord = isConnected && !conversationState.isSpeaking

  return (
    <Card className={`w-full max-w-2xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold">Voice Conversation</h3>
            <p className="text-sm text-muted-foreground">Real-time AI agent chat</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${getStatusColor(conversationState.status)} text-white`}>
            <div className="flex items-center gap-1">
              {conversationState.status === 'connecting' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isConnected ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              {getStatusText(conversationState.status)}
            </div>
          </Badge>
        </div>
      </div>

      {/* Connection Controls */}
      <div className="flex gap-2">
        {!isConnected ? (
          <Button onClick={handleConnect} className="flex-1">
            <Phone className="h-4 w-4 mr-2" />
            Connect
          </Button>
        ) : (
          <Button onClick={handleDisconnect} variant="destructive" className="flex-1">
            <PhoneOff className="h-4 w-4 mr-2" />
            Disconnect
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
      {isConnected && (
        <div className="flex gap-2">
          <Button
            onClick={handleToggleRecording}
            disabled={!canRecord}
            variant={conversationState.isRecording ? "destructive" : "default"}
            className="flex-1"
          >
            {conversationState.isRecording ? (
              <>
                <MicOff className="h-4 w-4 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Start Recording
              </>
            )}
          </Button>
          
          <Button onClick={handleSendTextMessage} variant="outline">
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Conversation Display */}
      <div className="space-y-4">
        {/* Transcript */}
        <div 
          ref={transcriptRef}
          className="min-h-[200px] max-h-[300px] overflow-y-auto p-4 bg-muted rounded-lg space-y-2"
        >
          {conversationState.conversationId && (
            <div className="text-xs text-muted-foreground mb-2">
              Conversation ID: {conversationState.conversationId}
            </div>
          )}
          
          {transcript && (
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">You said:</div>
              <div className="text-sm">{transcript}</div>
            </div>
          )}
          
          {agentResponse && (
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded">
              <div className="text-xs text-muted-foreground mb-1">Agent response:</div>
              <div className="text-sm">{agentResponse}</div>
            </div>
          )}
          
          {conversationState.isSpeaking && (
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded animate-pulse">
              <div className="text-xs text-muted-foreground mb-1">Agent is speaking...</div>
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                <div className="text-sm">🎵 Audio playing...</div>
              </div>
            </div>
          )}
          
          {conversationState.isRecording && (
            <div className="bg-red-100 dark:bg-red-900 p-3 rounded animate-pulse">
              <div className="text-xs text-muted-foreground mb-1">Recording...</div>
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                <div className="text-sm">🎤 Listening to your voice...</div>
              </div>
            </div>
          )}
          
          {!transcript && !agentResponse && isConnected && (
            <div className="text-center text-muted-foreground py-8">
              <Mic className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Click "Start Recording" to begin the conversation</p>
            </div>
          )}
          
          {!isConnected && (
            <div className="text-center text-muted-foreground py-8">
              <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Click "Connect" to start a voice conversation</p>
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

      {/* Instructions */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Instructions:</strong></p>
        <p>1. Click "Connect" to establish a WebSocket connection</p>
        <p>2. Click "Start Recording" to speak to the AI agent</p>
        <p>3. The agent will respond with voice automatically</p>
        <p>4. Use the text message button as a fallback option</p>
      </div>
    </Card>
  )
} 