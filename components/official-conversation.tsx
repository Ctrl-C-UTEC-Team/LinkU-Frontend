'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  AlertCircle,
  Clock
} from 'lucide-react';

interface OfficialConversationProps {
  agentId: string;
  config?: {
    prompt?: string;
    firstMessage?: string;
    language?: string;
    voiceId?: string;
    temperature?: number;
    maxTokens?: number;
  };
  className?: string;
}

interface ConversationMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
}

export function OfficialConversation({ 
  agentId,
  config,
  className 
}: OfficialConversationProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionError, setPermissionError] = useState<string>('');
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Configuración del hook useConversation de ElevenLabs
  const conversation = useConversation({
    onConnect: () => {
      console.log('✅ Conectado a ElevenLabs');
      setSessionStartTime(Date.now());
      
      // Agregar mensaje de bienvenida del agente
      const welcomeMessage: ConversationMessage = {
        id: Date.now().toString(),
        role: 'agent',
        content: config?.firstMessage || "¡Hola! Soy Andrea, tu entrevistadora de IA. Es un placer conocerte. ¿Podrías comenzar presentándote brevemente?",
        timestamp: Date.now()
      };
      setMessages([welcomeMessage]);
    },
    
    onDisconnect: () => {
      console.log('❌ Desconectado de ElevenLabs');
      setSessionStartTime(null);
    },
    
    onMessage: (message) => {
      console.log('📝 Mensaje:', message);
      
      // Agregar mensaje a la conversación basado en la fuente
      if (message.source === 'user') {
        const userMessage: ConversationMessage = {
          id: Date.now().toString() + '_user',
          role: 'user',
          content: message.message,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMessage]);
      } else if (message.source === 'ai') {
        const agentMessage: ConversationMessage = {
          id: Date.now().toString() + '_agent',
          role: 'agent',
          content: message.message,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, agentMessage]);
      }
    },
    
    onError: (error) => {
      console.error('❌ Error en conversación:', error);
      setPermissionError(typeof error === 'string' ? error : 'Error en la conversación');
    },
  });

  // Timer para duración de sesión
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (sessionStartTime && conversation.status === 'connected') {
      interval = setInterval(() => {
        setSessionDuration(Date.now() - sessionStartTime);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionStartTime, conversation.status]);

  // Función para obtener URL firmada
  const getSignedUrl = async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/get-signed-url");
      if (!response.ok) {
        console.log('No se pudo obtener URL firmada, usando agentId directamente');
        return null;
      }
      const { signedUrl } = await response.json();
      return signedUrl;
    } catch (error) {
      console.log('Error obteniendo URL firmada, usando agentId directamente:', error);
      return null;
    }
  };

  // Función para iniciar conversación
  const startConversation = useCallback(async () => {
    try {
      setPermissionError('');
      
      // Solicitar permisos de micrófono
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);

      // Intentar obtener URL firmada, si no se puede usar agentId directamente
      const signedUrl = await getSignedUrl();
      
      if (signedUrl) {
        // Usar URL firmada para agentes privados
        await conversation.startSession({
          signedUrl,
        });
      } else {
        // Usar agentId directamente para agentes públicos
        await conversation.startSession({
          agentId: agentId,
        });
      }

    } catch (error: any) {
      console.error('❌ Error al iniciar conversación:', error);
      if (error.name === 'NotAllowedError') {
        setPermissionError('Permisos de micrófono denegados. Por favor, permite el acceso al micrófono.');
      } else {
        setPermissionError(error.message || 'Error al iniciar la conversación');
      }
    }
  }, [conversation, agentId]);

  // Función para detener conversación
  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    setSessionStartTime(null);
    setSessionDuration(0);
  }, [conversation]);

  // Función para alternar mute
  const toggleMute = () => {
    // El hook de ElevenLabs maneja esto internamente
    console.log('Toggle mute - implementar si está disponible en el hook');
  };

  // Formatear duración
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Estados de la conversación
  const isConnected = conversation.status === 'connected';
  const isConnecting = conversation.status === 'connecting';

  const getStatusColor = () => {
    if (permissionError) return 'bg-red-500';
    if (isConnected) return 'bg-green-500';
    if (isConnecting) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getStatusIcon = () => {
    if (permissionError) return <AlertCircle className="h-3 w-3" />;
    if (isConnected) return <Wifi className="h-3 w-3" />;
    if (isConnecting) return <Loader2 className="h-3 w-3 animate-spin" />;
    return <WifiOff className="h-3 w-3" />;
  };

  const getStatusText = () => {
    if (permissionError) return 'Error';
    if (isConnected) return 'Entrevista Activa';
    if (isConnecting) return 'Conectando...';
    return 'Desconectado';
  };

  return (
    <Card className={`w-full max-w-4xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header con status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Mic className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Entrevista con Andrea</h3>
            <p className="text-sm text-muted-foreground">
              Conversación Natural con IA • ElevenLabs Oficial
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {sessionStartTime && (
            <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-lg">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-mono">{formatDuration(sessionDuration)}</span>
            </div>
          )}
          
          <Badge variant="outline" className={`${getStatusColor()} text-white`}>
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              {getStatusText()}
            </div>
          </Badge>
        </div>
      </div>

      {/* Información del agente */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-muted rounded-lg text-xs">
        <div>
          <span className="font-medium">Agent ID:</span> {agentId.slice(-8)}
        </div>
        <div>
          <span className="font-medium">Estado:</span> {conversation.isSpeaking ? 'Hablando' : 'Escuchando'}
        </div>
        <div>
          <span className="font-medium">Mensajes:</span> {messages.length}
        </div>
      </div>

      {/* Controles principales */}
      <div className="flex gap-2">
        {!isConnected ? (
          <Button 
            onClick={startConversation} 
            className="flex-1" 
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <Phone className="h-4 w-4 mr-2" />
                Iniciar Entrevista
              </>
            )}
          </Button>
        ) : (
          <Button onClick={stopConversation} variant="destructive" className="flex-1">
            <PhoneOff className="h-4 w-4 mr-2" />
            Finalizar Entrevista
          </Button>
        )}
        
        <Button 
          onClick={toggleMute} 
          variant="outline"
          disabled={!isConnected}
          title="Alternar sonido"
        >
          <Volume2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Transcripción de la conversación */}
      <div className="space-y-4">
        <div className="min-h-[300px] max-h-[400px] overflow-y-auto p-4 bg-muted rounded-lg space-y-3">
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
                  {message.role === 'user' ? '👤 Tú:' : '🤖 Andrea:'}
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
              <p className="font-medium">¡Entrevista iniciada!</p>
              <p className="text-xs mt-2">
                Andrea te está escuchando. Comienza a hablar cuando estés listo.
              </p>
              {conversation.isSpeaking && (
                <div className="mt-4 flex justify-center">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-150"></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Presiona "Iniciar Entrevista" para comenzar</p>
              <p className="text-xs mt-2">
                Andrea está lista para entrevistarte
              </p>
            </div>
          )}
        </div>
        
        {/* Error Display */}
        {permissionError && (
          <div className="bg-red-100 dark:bg-red-900 p-3 rounded border border-red-200 dark:border-red-800">
            <div className="text-red-800 dark:text-red-200 text-sm">
              <strong>Error:</strong> {permissionError}
            </div>
          </div>
        )}
      </div>

      {/* Estado de la conversación */}
      {isConnected && (
        <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${conversation.isSpeaking ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-sm">
              {conversation.isSpeaking ? 'Andrea está hablando' : 'Andrea está escuchando'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Micrófono activo</span>
          </div>
        </div>
      )}

      {/* Información técnica */}
      <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
        <p><strong>Integración Oficial ElevenLabs:</strong></p>
        <p>✅ Conexión WebSocket nativa con @elevenlabs/react</p>
        <p>✅ Transcripción y respuesta en tiempo real</p>
        <p>✅ Manejo automático de audio y permisos</p>
        <p>✅ Optimizado para conversaciones naturales</p>
      </div>
    </Card>
  );
} 