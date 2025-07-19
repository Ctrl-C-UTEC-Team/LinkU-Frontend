"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, BarChart3, Target, Users, ArrowRight, Brain } from "lucide-react"

const features = [
  {
    icon: Mic,
    title: "Entrevista por Voz", 
    description: "Conversación natural con Andrea, nuestra entrevistadora de RRHH con IA",
  },
  {
    icon: Brain,
    title: "IA Conversacional",
    description: "Entrevista realista que se adapta a tus respuestas de manera natural",
  },
  {
    icon: BarChart3,
    title: "Análisis Detallado",
    description: "Reporte completo de tu desempeño y áreas de mejora",
  },
  {
    icon: Target,
    title: "Práctica Realista",
    description: "Simulación fiel de una entrevista inicial de recursos humanos",
  },
]

export default function HomePage() {
  const router = useRouter()

  const handleStartInterview = () => {
    router.push(`/setup`)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <nav className="glass-nav p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-8 h-8 text-[#ff6b35]" />
            <span className="text-xl font-bold">LinkU - Interview Practice</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="text-white hover:text-[#ff6b35]"
              onClick={() => router.push('/voice-chat')}
            >
              <Mic className="w-4 h-4 mr-2" />
              Voice Chat
            </Button>
            <Button 
              variant="ghost" 
              className="text-white hover:text-[#ff6b35]"
              onClick={() => router.push('/results')}
            >
              Ver Resultados
            </Button>
            <Button 
              variant="ghost" 
              className="text-white hover:text-[#ff6b35]"
              onClick={() => router.push('/use-existing-agent')}
            >
              Entrevista con Andrea
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 gradient-text">
            Practica tu Entrevista de Trabajo con LinkU
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Entrevístate con Andrea, nuestra entrevistadora de RRHH con IA. 
            Conversación natural, preguntas inteligentes y feedback personalizado para destacar en tu próxima entrevista.
          </p>
          
          {/* Main CTA */}
          <div className="max-w-md mx-auto">
            <Card className="glass-card p-8 mb-8">
              <div className="text-center">
                <Users className="w-16 h-16 text-[#ff6b35] mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Entrevista con Andrea</h3>
                <p className="text-gray-400 mb-6">
                  Entrevista inicial de RRHH completamente conversacional. 
                  Andrea es una entrevistadora senior que adapta las preguntas a tus respuestas.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Duración:</span>
                    <span>20-30 minutos</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Tipo:</span>
                    <span>Conversación natural</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Tecnología:</span>
                    <span>ElevenLabs AI</span>
                  </div>
                </div>
              </div>
            </Card>
            
            <Button 
              onClick={handleStartInterview}
              className="w-full glass-button text-lg py-6"
            >
              <Users className="w-5 h-5 mr-2" />
              Comenzar Entrevista con Andrea
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          {features.map((feature, index) => (
            <Card key={index} className="glass-card p-6 text-center">
              <feature.icon className="w-12 h-12 text-[#ff6b35] mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </Card>
          ))}
        </div>

      
        {/* Info Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold mb-8">¿Qué Puedes Esperar?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-6">
              <div className="text-[#ff6b35] text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">Conversación Natural</h3>
              <p className="text-gray-400">
                Andrea mantiene una conversación fluida, haciendo preguntas de seguimiento basadas en tus respuestas
              </p>
            </div>
            <div className="glass-card p-6">
              <div className="text-[#ff6b35] text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">Entrevista Realista</h3>
              <p className="text-gray-400">
                Experiencia idéntica a una entrevista real de RRHH con una entrevistadora experimentada
              </p>
            </div>
            <div className="glass-card p-6">
              <div className="text-[#ff6b35] text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Reporte Completo</h3>
              <p className="text-gray-400">
                Análisis detallado de tu desempeño con datos extraídos automáticamente de la conversación
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
