"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  User, 
  Bot, 
  Search, 
  Filter,
  ChevronRight,
  Star,
  Clock,
  Briefcase,
  Heart,
  Zap,
  Shield,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import {
  useInterviewStore,
  useAvailableAgents,
  useSelectedAgent,
  useIsLoadingAgents,
  useAgentError
} from "@/lib/stores/interview-store"
import type { Agent, AgentSpecialty, AgentPersonality } from "@/types/agents"
import type { InterviewConfig } from "@/types"

interface AgentSelectorProps {
  interviewConfig: InterviewConfig
  onAgentSelected?: (agent: Agent) => void
  className?: string
}

export function AgentSelector({ 
  interviewConfig, 
  onAgentSelected,
  className 
}: AgentSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState<AgentSpecialty | 'all'>('all')
  const [selectedPersonality, setSelectedPersonality] = useState<AgentPersonality | 'all'>('all')

  const availableAgents = useAvailableAgents()
  const selectedAgent = useSelectedAgent()
  const isLoadingAgents = useIsLoadingAgents()
  const agentError = useAgentError()

  const { 
    loadAvailableAgents, 
    selectAgent, 
    clearAgentSelection,
    setAgentError
  } = useInterviewStore()

  // Load agents on component mount
  useEffect(() => {
    loadAvailableAgents()
  }, [loadAvailableAgents])

  // Filter agents based on search criteria
  const filteredAgents = availableAgents.filter(agent => {
    const matchesSearch = !searchTerm || 
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesSpecialty = selectedSpecialty === 'all' || agent.specialty === selectedSpecialty
    
    const matchesPersonality = selectedPersonality === 'all' || agent.personality === selectedPersonality

    const matchesLevel = agent.experienceLevel.includes(
      interviewConfig.level.toLowerCase() as any
    )

    return matchesSearch && matchesSpecialty && matchesPersonality && matchesLevel
  })

  // Get recommended agents for the interview config
  const recommendedAgents = filteredAgents.filter(agent => {
    const specialtyMatch = getSpecialtyMatch(agent.specialty, interviewConfig.position)
    const personalityMatch = getPersonalityMatch(agent.personality, interviewConfig.level)
    return specialtyMatch || personalityMatch
  }).slice(0, 3)

  const handleAgentSelect = (agent: Agent) => {
    selectAgent(agent)
    onAgentSelected?.(agent)
  }

  const handleClearSelection = () => {
    clearAgentSelection()
  }

  const getPersonalityIcon = (personality: AgentPersonality) => {
    const iconMap = {
      friendly: Heart,
      professional: Briefcase,
      challenging: Zap,
      supportive: Users,
      technical: Bot,
      casual: User
    }
    return iconMap[personality] || User
  }

  const getPersonalityColor = (personality: AgentPersonality) => {
    const colorMap = {
      friendly: 'text-pink-600 bg-pink-100',
      professional: 'text-blue-600 bg-blue-100',
      challenging: 'text-orange-600 bg-orange-100',
      supportive: 'text-green-600 bg-green-100',
      technical: 'text-purple-600 bg-purple-100',
      casual: 'text-gray-600 bg-gray-100'
    }
    return colorMap[personality] || 'text-gray-600 bg-gray-100'
  }

  const getSpecialtyIcon = (specialty: AgentSpecialty) => {
    const iconMap = {
      frontend: Bot,
      backend: Bot,
      fullstack: Bot,
      devops: Shield,
      qa: CheckCircle2,
      'ui-ux': Star,
      'product-management': Briefcase,
      'data-science': Bot,
      mobile: Bot,
      general: User
    }
    return iconMap[specialty] || Bot
  }

  const refreshAgents = () => {
    setAgentError(null)
    loadAvailableAgents({
      specialty: selectedSpecialty !== 'all' ? selectedSpecialty : undefined,
      personality: selectedPersonality !== 'all' ? selectedPersonality : undefined,
      searchTerm: searchTerm || undefined
    })
  }

  if (agentError) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-red-800">Error al cargar agentes</h3>
            <p className="text-sm text-red-600 mt-1">{agentError}</p>
          </div>
          <Button onClick={refreshAgents} variant="outline">
            Reintentar
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-blue-600" />
          <div>
            <h3 className="text-xl font-semibold">Seleccionar Entrevistador IA</h3>
            <p className="text-sm text-muted-foreground">
              Elige el agente que mejor se adapte a tu perfil y tipo de entrevista
            </p>
          </div>
        </div>
        
        {selectedAgent && (
          <Button 
            onClick={handleClearSelection} 
            variant="outline" 
            size="sm"
          >
            Cambiar Agente
          </Button>
        )}
      </div>

      {/* Selected Agent Display */}
      {selectedAgent && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div className="flex-1">
              <h4 className="font-medium text-green-800">{selectedAgent.name}</h4>
              <p className="text-sm text-green-600">{selectedAgent.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      {!selectedAgent && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar agentes por nombre, descripción o tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Especialidad</label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value as AgentSpecialty | 'all')}
                className="w-full p-2 border rounded-md text-sm"
              >
                <option value="all">Todas las especialidades</option>
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="fullstack">Full Stack</option>
                <option value="devops">DevOps</option>
                <option value="qa">QA</option>
                <option value="ui-ux">UI/UX</option>
                <option value="product-management">Product Management</option>
                <option value="data-science">Data Science</option>
                <option value="mobile">Mobile</option>
                <option value="general">General</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Personalidad</label>
              <select
                value={selectedPersonality}
                onChange={(e) => setSelectedPersonality(e.target.value as AgentPersonality | 'all')}
                className="w-full p-2 border rounded-md text-sm"
              >
                <option value="all">Todas las personalidades</option>
                <option value="friendly">Amigable</option>
                <option value="professional">Profesional</option>
                <option value="challenging">Desafiante</option>
                <option value="supportive">Comprensivo</option>
                <option value="technical">Técnico</option>
                <option value="casual">Casual</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoadingAgents && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-sm text-muted-foreground mt-2">Cargando agentes...</p>
        </div>
      )}

      {/* Recommended Agents */}
      {!selectedAgent && !isLoadingAgents && recommendedAgents.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-green-700 flex items-center gap-2">
            <Star className="h-4 w-4" />
            Recomendados para tu perfil
          </h4>
          <div className="grid gap-3">
            {recommendedAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onClick={() => handleAgentSelect(agent)}
                isRecommended={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Agents */}
      {!selectedAgent && !isLoadingAgents && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">
              Todos los agentes ({filteredAgents.length})
            </h4>
            {filteredAgents.length === 0 && (
              <Button onClick={refreshAgents} variant="ghost" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>
          
          {filteredAgents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No se encontraron agentes que coincidan con tus criterios</p>
              <p className="text-xs mt-1">Intenta modificar los filtros</p>
            </div>
          ) : (
            <div className="grid gap-3 max-h-80 overflow-y-auto">
              {filteredAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onClick={() => handleAgentSelect(agent)}
                  isRecommended={recommendedAgents.includes(agent)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// Agent Card Component
interface AgentCardProps {
  agent: Agent
  onClick: () => void
  isRecommended?: boolean
}

function AgentCard({ agent, onClick, isRecommended }: AgentCardProps) {
  const PersonalityIcon = getPersonalityIcon(agent.personality)
  const SpecialtyIcon = getSpecialtyIcon(agent.specialty)

  return (
    <Card 
      className={`p-4 cursor-pointer hover:shadow-md transition-all border-l-4 ${
        isRecommended ? 'border-l-green-500 bg-green-50' : 'border-l-blue-500'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            {agent.avatar ? (
              <img 
                src={agent.avatar} 
                alt={agent.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
            )}
            <div>
              <h5 className="font-medium text-sm">{agent.name}</h5>
              {isRecommended && (
                <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                  <Star className="h-3 w-3 mr-1" />
                  Recomendado
                </Badge>
              )}
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2">
            {agent.description}
          </p>
          
          <div className="flex flex-wrap gap-1">
            <Badge 
              variant="outline" 
              className={`text-xs ${getPersonalityColor(agent.personality)}`}
            >
              <PersonalityIcon className="h-3 w-3 mr-1" />
              {agent.personality}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <SpecialtyIcon className="h-3 w-3 mr-1" />
              {agent.specialty}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {agent.experienceLevel.join(', ')}
            </Badge>
          </div>
        </div>
        
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Card>
  )
}

// Helper functions
function getSpecialtyMatch(agentSpecialty: AgentSpecialty, position: string): boolean {
  const positionLower = position.toLowerCase()
  
  const matches: Record<string, AgentSpecialty[]> = {
    'frontend': ['frontend', 'fullstack'],
    'backend': ['backend', 'fullstack'],
    'full': ['fullstack'],
    'devops': ['devops'],
    'qa': ['qa'],
    'ui': ['ui-ux'],
    'ux': ['ui-ux'],
    'product': ['product-management'],
    'data': ['data-science'],
    'mobile': ['mobile']
  }
  
  for (const [key, specialties] of Object.entries(matches)) {
    if (positionLower.includes(key) && specialties.includes(agentSpecialty)) {
      return true
    }
  }
  
  return agentSpecialty === 'general'
}

function getPersonalityMatch(personality: AgentPersonality, level: string): boolean {
  const levelLower = level.toLowerCase()
  
  const matches: Record<string, AgentPersonality[]> = {
    'junior': ['supportive', 'friendly'],
    'mid': ['friendly', 'professional'],
    'senior': ['challenging', 'professional', 'technical']
  }
  
  return matches[levelLower]?.includes(personality) || false
}

function getPersonalityIcon(personality: AgentPersonality) {
  const iconMap = {
    friendly: Heart,
    professional: Briefcase,
    challenging: Zap,
    supportive: Users,
    technical: Bot,
    casual: User
  }
  return iconMap[personality] || User
}

function getPersonalityColor(personality: AgentPersonality) {
  const colorMap = {
    friendly: 'text-pink-600 bg-pink-100',
    professional: 'text-blue-600 bg-blue-100',
    challenging: 'text-orange-600 bg-orange-100',
    supportive: 'text-green-600 bg-green-100',
    technical: 'text-purple-600 bg-purple-100',
    casual: 'text-gray-600 bg-gray-100'
  }
  return colorMap[personality] || 'text-gray-600 bg-gray-100'
}

function getSpecialtyIcon(specialty: AgentSpecialty) {
  const iconMap = {
    frontend: Bot,
    backend: Bot,
    fullstack: Bot,
    devops: Shield,
    qa: CheckCircle2,
    'ui-ux': Star,
    'product-management': Briefcase,
    'data-science': Bot,
    mobile: Bot,
    general: User
  }
  return iconMap[specialty] || Bot
} 