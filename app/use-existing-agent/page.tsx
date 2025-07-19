"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, Send, Brain, MessageCircle, Volume2, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { ElevenLabsConversationalAI } from "@/lib/elevenlabs-conversational"

const EXISTING_AGENT_ID = "agent_01k0hgmx13e0htbvt8k8bp6gwy"

export default function UseExistingAgentPage() {
  const router = useRouter()
  const [conversationalAI] = useState(() => new ElevenLabsConversationalAI())
  const [agent, setAgent] = useState<any>(null)
  const [conversation, setConversation] = useState<any>(null)
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAgent, setIsLoadingAgent] = useState(true)
  const [status, setStatus] = useState("")

  // Load the existing agent on component mount
  useEffect(() => {
    loadExistingAgent()
  }, [])

  const loadExistingAgent = async () => {
    setIsLoadingAgent(true)
    setStatus("Cargando a Andrea...")
    
    try {
      const existingAgent = await conversationalAI.getAgent(EXISTING_AGENT_ID)
      if (existingAgent) {
        setAgent(existingAgent)
        setStatus("Andrea está lista para la entrevista")
        console.log("Loaded agent:", existingAgent)
      } else {
        setStatus("No se pudo cargar el agente")
      }
    } catch (error) {
      console.error("Error loading agent:", error)
      setStatus("Error al cargar el agente")
    } finally {
      setIsLoadingAgent(false)
    }
  }

  const startConversation = async () => {
    if (!agent) {
      setStatus("Andrea no está disponible")
      return
    }

    setIsLoading(true)
    setStatus("Iniciando entrevista con Andrea...")
    
    try {
      const newConversation = await conversationalAI.createConversation(agent.agent_id)
      if (newConversation) {
        setConversation(newConversation)
        setMessages([])
        setStatus("Entrevista en curso")
        
        // Add initial message
        setMessages([{
          role: 'assistant',
          content: "¡Hola! Mi nombre es Andrea y soy la encargada de realizar las entrevistas iniciales en nuestra empresa. Es un placer conocerte. Antes de comenzar, ¿podrías contarme tu nombre y qué te motivó a aplicar a esta posición?"
        }])
      } else {
        setStatus("Error al iniciar la entrevista")
      }
    } catch (error) {
      console.error("Error starting conversation:", error)
      setStatus("Error al iniciar la entrevista")
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!conversation || !inputMessage.trim()) return

    const userMessage = inputMessage.trim()
    setInputMessage("")
    setIsLoading(true)
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    
    try {
      const response = await conversationalAI.sendMessage(conversation.conversation_id, userMessage)
      
      if (response) {
        // Add assistant response
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.response || "No pude procesar tu respuesta. ¿Podrías repetir?" 
        }])
        setStatus("Conversación activa")
      } else {
        setStatus("Error en la respuesta")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setStatus("Error al enviar mensaje")
    } finally {
      setIsLoading(false)
    }
  }

  const endInterview = () => {
    // Redirect to results page with conversation data
    const interviewData = {
      duration: Date.now() - (conversation?.created_at || Date.now()),
      messages: messages.length,
      conversation_id: conversation?.conversation_id
    }
    
    localStorage.setItem('interview_results', JSON.stringify(interviewData))
    router.push('/results')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <nav className="glass-nav p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/')}
            className="text-white hover:text-[#ff6b35]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-[#ff6b35]" />
            <span className="text-lg font-semibold">Entrevista con Andrea</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Agent Status */}
        <Card className="glass-card p-6 mb-8">
          <div className="text-center">
            <Brain className="w-16 h-16 text-[#ff6b35] mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Andrea - Entrevistadora de RRHH</h1>
            <p className="text-gray-400 mb-4">
              Entrevistadora senior con más de 10 años de experiencia
            </p>
            
            {isLoadingAgent ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Cargando a Andrea...</span>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-4">Estado: {status}</p>
                {!conversation ? (
                  <Button 
                    onClick={startConversation}
                    disabled={isLoading || !agent}
                    className="glass-button px-8 py-3"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Iniciando...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Comenzar Entrevista
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    onClick={endInterview}
                    variant="outline"
                    className="px-6 py-2"
                  >
                    Finalizar Entrevista
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Chat Interface */}
        {conversation && (
          <Card className="glass-card p-6">
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-[#ff6b35] text-white'
                        : 'bg-gray-700 text-white'
                    }`}
                  >
                    <div className="text-xs opacity-70 mb-1">
                      {message.role === 'user' ? 'Tú' : 'Andrea'}
                    </div>
                    {message.content}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 text-white max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                    <div className="text-xs opacity-70 mb-1">Andrea</div>
                    <div className="flex items-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Escribiendo...
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Escribe tu respuesta..."
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                disabled={isLoading}
                className="flex-1 bg-gray-800 border-gray-600 text-white"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="glass-button"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Instructions */}
        <Card className="glass-card p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4">Consejos para la Entrevista</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
            <div>
              <h4 className="font-medium text-white mb-2">Durante la entrevista:</h4>
              <ul className="space-y-1">
                <li>• Sé específico en tus respuestas</li>
                <li>• Incluye ejemplos concretos</li>
                <li>• Mantén un tono profesional pero natural</li>
                <li>• Haz preguntas sobre la empresa</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Andrea evaluará:</h4>
              <ul className="space-y-1">
                <li>• Tu experiencia y habilidades</li>
                <li>• Motivación para el puesto</li>
                <li>• Capacidad de comunicación</li>
                <li>• Fit cultural con la empresa</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 