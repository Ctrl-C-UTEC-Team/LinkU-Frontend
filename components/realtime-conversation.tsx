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
  Loader2,
  Wifi,
  WifiOff,
  AlertCircle
} from "lucide-react"
import { ElevenLabsVoiceChat } from "@/lib/elevenlabs-voice-chat"

interface ConversationConfig {
  prompt: string;
  firstMessage: string;
  language: string;
  voiceId: string;
  temperature: number;
  maxTokens: number;
}

interface RealtimeConversationProps {
  agentId: string;
  config: ConversationConfig;
  className?: string;
}

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
}

export function RealtimeConversation({ 
  agentId,
  config,
  className 
}: RealtimeConversationProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [status, setStatus] = useState("Desconectado")
  const [error, setError] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  
  const voiceChatRef = useRef<ElevenLabsVoiceChat | null>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [messages])

  // Crear nueva instancia cuando cambie agentId
  useEffect(() => {
    if (voiceChatRef.current) {
      voiceChatRef.current.disconnect()
    }
    
    voiceChatRef.current = new ElevenLabsVoiceChat(agentId, {
      onConnected: () => {
        setIsConnected(true)
        setError("")
        console.log('✅ Conectado a ElevenLabs')
      },
      
      onDisconnected: () => {
        setIsConnected(false)
        console.log('❌ Desconectado de ElevenLabs')
      },
      
      onUserTranscript: (text: string) => {
        console.log('👤 Usuario:', text)
        const newMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: text,
          timestamp: Date.now()
        }
        setMessages(prev => [...prev, newMessage])
      },
      
      onAgentResponse: (text: string) => {
        console.log('🤖 Agente:', text)
        const newMessage: Message = {
          id: Date.now().toString(),
          role: 'agent',
          content: text,
          timestamp: Date.now()
        }
        setMessages(prev => [...prev, newMessage])
      },
      
      onError: (errorMsg: string) => {
        console.error('❌ Error:', errorMsg)
        setError(errorMsg)
      },
      
      onStatusChange: (statusMsg: string) => {
        console.log('📊 Status:', statusMsg)
        setStatus(statusMsg)
      }
    })
    
    // Cleanup on unmount
    return () => {
      if (voiceChatRef.current) {
        voiceChatRef.current.disconnect()
      }
    }
  }, [agentId])

  // Conectar a ElevenLabs
  const handleConnect = async () => {
    try {
      setError("")
      if (voiceChatRef.current) {
        await voiceChatRef.current.connect()
      }
    } catch (error: any) {
      console.error('Error conectando:', error)
      setError(error.message || 'Error al conectar')
    }
  }

  // Desconectar
  const handleDisconnect = () => {
    if (voiceChatRef.current) {
      voiceChatRef.current.disconnect()
    }
    setMessages([]) // Limpiar mensajes al desconectar
  }

  // Toggle mute (detener/reanudar audio del agente)
  const handleToggleMute = () => {
    setIsMuted(!isMuted)
    // En una implementación más avanzada, esto controlaría el volumen del audio
  }

  // Enviar mensaje de texto (para testing)
  const handleSendTextMessage = () => {
    const message = prompt("Escribe tu mensaje:")
    if (message && message.trim() && voiceChatRef.current) {
      // Enviar al agente a través de la API
      voiceChatRef.current.sendTestMessage(message.trim())
      
      // También agregar a la UI
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: message.trim(),
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, newMessage])
    }
  }

  const getStatusColor = () => {
    if (error) return 'bg-red-500'
    if (isConnected) return 'bg-green-500'
    if (status.includes('Conectando')) return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="h-3 w-3" />
    if (isConnected) return <Wifi className="h-3 w-3" />
    if (status.includes('Conectando')) return <Loader2 className="h-3 w-3 animate-spin" />
    return <WifiOff className="h-3 w-3" />
  }

  return (
    <Card className={`w-full max-w-4xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header con status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Mic className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Chat de Voz en Tiempo Real</h3>
            <p className="text-sm text-muted-foreground">
              Agent ID: {agentId}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${getStatusColor()} text-white`}>
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              {error || status}
            </div>
          </Badge>
        </div>
      </div>

      {/* Configuración actual */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted rounded-lg text-xs">
        <div>
          <span className="font-medium">Idioma:</span> {config.language}
        </div>
        <div>
          <span className="font-medium">Voice ID:</span> {config.voiceId.slice(0, 8)}...
        </div>
        <div>
          <span className="font-medium">Temp:</span> {config.temperature}
        </div>
        <div>
          <span className="font-medium">Tokens:</span> {config.maxTokens}
        </div>
      </div>

      {/* Controles principales */}
      <div className="flex gap-2">
        {!isConnected ? (
          <Button onClick={handleConnect} className="flex-1" disabled={!!error && !error.includes('micrófono')}>
            <Phone className="h-4 w-4 mr-2" />
            Conectar Chat de Voz
          </Button>
        ) : (
          <Button onClick={handleDisconnect} variant="destructive" className="flex-1">
            <PhoneOff className="h-4 w-4 mr-2" />
            Desconectar
          </Button>
        )}
        
        <Button 
          onClick={handleToggleMute} 
          variant="outline"
          disabled={!isConnected}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        
        <Button 
          onClick={handleSendTextMessage} 
          variant="outline"
          disabled={!isConnected}
          title="Enviar mensaje de texto (para testing)"
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
        
        <Button 
          onClick={() => voiceChatRef.current?.sendTestMessage("Hola, ¿cómo estás?")} 
          variant="outline"
          disabled={!isConnected}
          title="Activar agente manualmente"
          size="sm"
        >
          🤝 Activar
        </Button>
      </div>

      {/* Transcripción de la conversación */}
      <div className="space-y-4">
        <div 
          ref={transcriptRef}
          className="min-h-[300px] max-h-[400px] overflow-y-auto p-4 bg-muted rounded-lg space-y-3"
        >
          {messages.length > 0 ? (
            messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-100 dark:bg-blue-900 ml-8'
                    : 'bg-green-100 dark:bg-green-900 mr-8'
                }`}
              >
                <div className="text-xs text-muted-foreground mb-1">
                  {message.role === 'user' ? '👤 Tú:' : '🤖 Agente:'}
                  <span className="ml-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm">{message.content}</div>
              </div>
            ))
          ) : isConnected ? (
            <div className="text-center text-muted-foreground py-8">
              <Mic className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="font-medium">¡Conectado! Comienza a hablar</p>
              <p className="text-xs mt-2">
                El agente te escucha automáticamente. Tu voz será transcrita aquí.
              </p>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-blue-700 dark:text-blue-300">
                <p className="text-xs">
                  <strong>Primer mensaje:</strong> {config.firstMessage}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Presiona "Conectar Chat de Voz" para comenzar</p>
              <p className="text-xs mt-2">
                Se solicitarán permisos de micrófono automáticamente
              </p>
            </div>
          )}
          
          {isConnected && status.includes('Micrófono activo') && (
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Micrófono activo - Habla normalmente
                </span>
                <div className="flex gap-1">
                  <div className="w-1 h-4 bg-green-500 animate-pulse"></div>
                  <div className="w-1 h-4 bg-green-500 animate-pulse delay-75"></div>
                  <div className="w-1 h-4 bg-green-500 animate-pulse delay-150"></div>
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

      {/* Información técnica */}
      <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
        <p><strong>Cómo funciona:</strong></p>
        <p>1. ✅ WebSocket se conecta a ElevenLabs API</p>
        <p>2. ✅ Audio se captura en PCM 16-bit 16kHz mono</p>
        <p>3. ✅ Transcripción y respuesta en tiempo real</p>
        <p>4. ✅ Audio del agente se reproduce automáticamente</p>
        <p>5. ✅ Manejo de pings/pongs para mantener conexión</p>
      </div>
    </Card>
  )
} 