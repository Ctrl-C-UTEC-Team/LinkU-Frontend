"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  ArrowLeft,
  Target,
  CheckCircle,
  Brain,
} from "lucide-react"
import { calculateCompetencyScores } from "@/lib/mock-data"
import type { CompetencyScores } from "@/lib/mock-data"
import { AlertCircle, TrendingUp, RotateCcw, Download, Info } from "lucide-react"

// Interview results interface for ElevenLabs
interface InterviewResults {
  duration: number
  messages: number
  conversation_id?: string
  totalWords?: number
  fillerWords?: number
  questionResponses?: any[]
}

const MetricGauge = ({ value, label, color = "#ff6b35" }: { value: number; label: string; color?: string }) => {
  const circumference = 2 * Math.PI * 45
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="8" fill="none" />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">{Math.round(value)}</span>
        </div>
      </div>
      <span className="text-sm text-gray-400 mt-2 text-center">{label}</span>
    </div>
  )
}

const CompetencyGauge = ({ value, label, maxValue = 5 }: { value: number; label: string; maxValue?: number }) => {
  const safeValue = typeof value === "number" && isFinite(value) ? value : 0

  const percentage = (safeValue / maxValue) * 100
  const circumference = 2 * Math.PI * 35
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const getColor = (score: number) => {
    if (score >= 4) return "#10b981" // green
    if (score >= 3) return "#f59e0b" // yellow
    return "#ef4444" // red
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="35" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="6" fill="none" />
          <circle
            cx="40"
            cy="40"
            r="35"
            stroke={getColor(safeValue)}
            strokeWidth="6"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white">{safeValue.toFixed(1)}</span>
        </div>
      </div>
      <span className="text-xs text-gray-400 mt-2 text-center">{label}</span>
    </div>
  )
}

const FeedbackCard = ({
  icon: Icon,
  title,
  items,
  variant = "default",
}: {
  icon: any
  title: string
  items: string[]
  variant?: "default" | "success" | "warning"
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "border-green-500/30 bg-green-500/5"
      case "warning":
        return "border-yellow-500/30 bg-yellow-500/5"
      default:
        return "border-gray-600 bg-gray-800/50"
    }
  }

  return (
    <Card className={`glass-card p-4 ${getVariantStyles()}`}>
      <div className="flex items-center mb-3">
        <Icon className="w-5 h-5 mr-2 text-[#ff6b35]" />
        <h3 className="font-medium">{title}</h3>
      </div>
      <ul className="space-y-1 text-sm text-gray-300">
        {items.map((item, index) => (
          <li key={index} className="flex items-start">
            <span className="w-1.5 h-1.5 bg-[#ff6b35] rounded-full mt-2 mr-2 flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default function ResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<InterviewResults | null>(null)
  const [competencyScores, setCompetencyScores] = useState<CompetencyScores | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadResults()
  }, [])

  const loadResults = () => {
    try {
      // Load results from localStorage (set by the interview page)
      const savedResults = localStorage.getItem('interview_results')
      if (savedResults) {
        const parsedResults: InterviewResults = JSON.parse(savedResults)
        setResults(parsedResults)
        
        // Calculate mock competency scores based on available data
        const mockSessionData = {
          totalWords: parsedResults.totalWords || parsedResults.messages * 50, // Estimate words
          fillerWords: Math.floor((parsedResults.totalWords || parsedResults.messages * 50) * 0.1), // Estimate filler words
          questionResponses: parsedResults.questionResponses || []
        }
        
        const scores = calculateCompetencyScores(mockSessionData)
        setCompetencyScores(scores)
      } else {
        // Generate sample results if none exist
        const sampleResults: InterviewResults = {
          duration: 25 * 60 * 1000, // 25 minutes
          messages: 12,
          conversation_id: "sample_conversation",
          totalWords: 600,
          fillerWords: 45,
        }
        setResults(sampleResults)
        
        const mockSessionData = {
          totalWords: 600,
          fillerWords: 45,
          questionResponses: []
        }
        
        const scores = calculateCompetencyScores(mockSessionData)
        setCompetencyScores(scores)
      }
    } catch (error) {
      console.error("Error loading results:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getOverallScore = () => {
    if (!competencyScores) return 0
    const scores = Object.values(competencyScores)
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
    return (average / 5) * 100 // Convert to percentage
  }

  const getPerformanceLevel = (score: number) => {
    if (score >= 80) return { level: "Excelente", color: "text-green-400" }
    if (score >= 60) return { level: "Bueno", color: "text-yellow-400" }
    return { level: "Mejorable", color: "text-orange-400" }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#ff6b35] mx-auto mb-4"></div>
          <p>Generando tu reporte de entrevista...</p>
        </div>
      </div>
    )
  }

  if (!results || !competencyScores) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No se encontraron resultados</h2>
          <p className="text-gray-400 mb-6">No hay datos de entrevista disponibles.</p>
          <Button onClick={() => router.push('/')} className="glass-button">
            Volver al inicio
          </Button>
        </div>
      </div>
    )
  }

  const overallScore = getOverallScore()
  const performance = getPerformanceLevel(overallScore)

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
            <TrendingUp className="w-6 h-6 text-[#ff6b35]" />
            <span className="text-lg font-semibold">Resultados de Entrevista</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/use-existing-agent')}
              className="text-white hover:text-[#ff6b35]"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Nueva Entrevista
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 gradient-text">
            Resultados de tu Entrevista
          </h1>
          <p className="text-xl text-gray-300">
            Entrevista con Andrea - {formatDuration(results.duration)}
          </p>
        </div>

        {/* Overall Performance */}
        <Card className="glass-card p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold mb-2">Desempeño General</h2>
              <div className={`text-3xl font-bold ${performance.color}`}>
                {performance.level}
              </div>
              <p className="text-gray-400 mt-2">
                Basado en el análisis de tu conversación con Andrea
              </p>
            </div>
            
            <div className="flex justify-center">
              <MetricGauge 
                value={overallScore} 
                label="Puntuación General"
                color="#ff6b35"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="glass-card p-4">
                <div className="text-2xl font-bold text-[#ff6b35]">{results.messages}</div>
                <div className="text-sm text-gray-400">Intercambios</div>
              </div>
              <div className="glass-card p-4">
                <div className="text-2xl font-bold text-[#ff6b35]">{formatDuration(results.duration)}</div>
                <div className="text-sm text-gray-400">Duración</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Competency Scores */}
        <Card className="glass-card p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Target className="w-6 h-6 mr-2 text-[#ff6b35]" />
            Evaluación por Competencias
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <CompetencyGauge value={competencyScores.comunicacion} label="Comunicación" />
            <CompetencyGauge value={competencyScores.claridad} label="Claridad" />
            <CompetencyGauge value={competencyScores.escuchaActiva} label="Escucha Activa" />
            <CompetencyGauge value={competencyScores.liderazgo} label="Liderazgo" />
            <CompetencyGauge value={competencyScores.adaptabilidad} label="Adaptabilidad" />
            <CompetencyGauge value={competencyScores.resolucionProblemas} label="Resolución de Problemas" />
          </div>
        </Card>

        {/* Feedback Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <FeedbackCard
            icon={CheckCircle}
            title="Fortalezas Observadas"
            variant="success"
            items={[
              "Participación activa en la conversación",
              "Respuestas estructuradas y coherentes",
              "Manejo apropiado del tiempo de entrevista",
              "Comunicación clara y directa"
            ]}
          />
          
          <FeedbackCard
            icon={TrendingUp}
            title="Áreas de Mejora"
            variant="warning"
            items={[
              "Incluir más ejemplos específicos en las respuestas",
              "Hacer más preguntas sobre la empresa y el puesto",
              "Desarrollar respuestas con mayor detalle",
              "Mostrar más curiosidad sobre el rol"
            ]}
          />
        </div>

        {/* Interview Summary */}
        <Card className="glass-card p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Brain className="w-6 h-6 mr-2 text-[#ff6b35]" />
            Resumen de la Entrevista
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#ff6b35] mb-2">
                {results.totalWords || results.messages * 50}
              </div>
              <div className="text-sm text-gray-400">Palabras totales</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-[#ff6b35] mb-2">
                {Math.round(((results.totalWords || results.messages * 50) / (results.duration / 60000)))}
              </div>
              <div className="text-sm text-gray-400">Palabras por minuto</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-[#ff6b35] mb-2">
                {Math.round(((results.fillerWords || 0) / (results.totalWords || results.messages * 50)) * 100)}%
              </div>
              <div className="text-sm text-gray-400">Muletillas</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-[#ff6b35] mb-2">
                {results.conversation_id ? 'Sí' : 'No'}
              </div>
              <div className="text-sm text-gray-400">Datos guardados</div>
            </div>
          </div>
        </Card>

        {/* Next Steps */}
        <Card className="glass-card p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Info className="w-6 h-6 mr-2 text-[#ff6b35]" />
            Siguientes Pasos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Para mejorar tu desempeño:</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Practica responder con ejemplos del método STAR (Situación, Tarea, Acción, Resultado)</li>
                <li>• Investiga sobre la empresa antes de la entrevista real</li>
                <li>• Prepara preguntas inteligentes sobre el puesto y la cultura empresarial</li>
                <li>• Realiza más entrevistas de práctica con Andrea</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Recomendaciones:</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Tu nivel actual es adecuado para entrevistas de nivel medio</li>
                <li>• Enfócate en desarrollar historias profesionales convincentes</li>
                <li>• Considera practicar entrevistas técnicas específicas de tu área</li>
                <li>• Mantén la confianza mostrada durante esta entrevista</li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button 
              onClick={() => router.push('/use-existing-agent')}
              className="flex-1 glass-button"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Practicar de Nuevo
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                const dataStr = JSON.stringify(results, null, 2)
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
                const exportFileDefaultName = 'entrevista-resultados.json'
                const linkElement = document.createElement('a')
                linkElement.setAttribute('href', dataUri)
                linkElement.setAttribute('download', exportFileDefaultName)
                linkElement.click()
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar Reporte
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
