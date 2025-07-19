'use client'

import type { 
  Agent, 
  AgentTemplate, 
  CreateAgentRequest, 
  UpdateAgentRequest, 
  AgentSearchFilters, 
  AgentListResponse,
  AgentSpecialty,
  AgentPersonality,
  AgentPerformanceMetrics,
  InterviewAgentConfig
} from '@/types/agents'

// Mock data - En producción esto vendrá del backend
const MOCK_AGENTS: Agent[] = [
  {
    id: 'agent-001',
    name: 'Ana García - Frontend Expert',
    description: 'Especialista en React, TypeScript y desarrollo frontend moderno. Estilo amigable pero técnico.',
    specialty: 'frontend',
    personality: 'friendly',
    experienceLevel: ['mid', 'senior'],
    avatar: '/avatars/ana-garcia.jpg',
    elevenLabsAgentId: 'agent_ana_garcia_001',
    voiceSettings: {
      voiceId: '21m00Tcm4TlvDq8ikWAM',
      voiceName: 'Ana - Voz Profesional Femenina',
      language: 'es',
      stability: 0.7,
      similarityBoost: 0.8,
      style: 0.6,
      useSpeakerBoost: true
    },
    promptConfig: {
      systemPrompt: `Eres Ana García, una entrevistadora especializada en desarrollo frontend con 8 años de experiencia. 
      Tu enfoque es amigable pero profesional, y tienes un conocimiento profundo de React, TypeScript, Next.js, y tecnologías web modernas.
      Realizas entrevistas que evalúan tanto habilidades técnicas como capacidad de trabajo en equipo.`,
      interviewStyle: 'Conversacional y técnica, con ejemplos prácticos',
      questionTypes: [
        'Fundamentos de JavaScript/TypeScript',
        'React y hooks',
        'Optimización de rendimiento',
        'Testing frontend',
        'Arquitectura de componentes',
        'Experiencia de usuario'
      ],
      evaluationCriteria: [
        'Conocimiento técnico sólido',
        'Capacidad de explicar conceptos complejos',
        'Experiencia práctica con proyectos',
        'Pensamiento crítico sobre UX/UI',
        'Capacidad de trabajo en equipo'
      ]
    },
    isActive: true,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 5,
    tags: ['react', 'typescript', 'frontend', 'español']
  },
  {
    id: 'agent-002',
    name: 'Carlos Rodríguez - Backend Architect',
    description: 'Arquitecto de sistemas backend con experiencia en microservicios y cloud. Enfoque técnico y desafiante.',
    specialty: 'backend',
    personality: 'challenging',
    experienceLevel: ['senior', 'lead'],
    avatar: '/avatars/carlos-rodriguez.jpg',
    elevenLabsAgentId: 'agent_carlos_rodriguez_002',
    voiceSettings: {
      voiceId: 'pNInz6obpgDQGcFmaJgB',
      voiceName: 'Carlos - Voz Profesional Masculina',
      language: 'es',
      stability: 0.8,
      similarityBoost: 0.7,
      style: 0.7,
      useSpeakerBoost: true
    },
    promptConfig: {
      systemPrompt: `Eres Carlos Rodríguez, un arquitecto de software senior con 12 años de experiencia en sistemas backend.
      Tu enfoque es técnico y desafiante, y tienes expertise en arquitecturas distribuidas, microservicios, bases de datos, y cloud computing.
      Realizas entrevistas profundas que evalúan el pensamiento arquitectónico y la capacidad de resolver problemas complejos.`,
      interviewStyle: 'Técnico y desafiante, con problemas de diseño de sistemas',
      questionTypes: [
        'Diseño de sistemas distribuidos',
        'Arquitectura de microservicios',
        'Bases de datos y optimización',
        'Seguridad backend',
        'Escalabilidad y performance',
        'DevOps y deployment'
      ],
      evaluationCriteria: [
        'Pensamiento arquitectónico sólido',
        'Conocimiento de patrones de diseño',
        'Experiencia con sistemas a escala',
        'Capacidad de resolución de problemas',
        'Liderazgo técnico'
      ]
    },
    isActive: true,
    createdAt: Date.now() - 86400000 * 45,
    updatedAt: Date.now() - 86400000 * 2,
    tags: ['backend', 'microservicios', 'cloud', 'arquitectura']
  },
  {
    id: 'agent-003',
    name: 'María López - Product Manager',
    description: 'Product Manager con experiencia en startups y productos digitales. Enfoque en estrategia y comunicación.',
    specialty: 'product-management',
    personality: 'supportive',
    experienceLevel: ['mid', 'senior'],
    avatar: '/avatars/maria-lopez.jpg',
    elevenLabsAgentId: 'agent_maria_lopez_003',
    voiceSettings: {
      voiceId: 'AZnzlk1XvdvUeBnXmlld',
      voiceName: 'María - Voz Cálida Femenina',
      language: 'es',
      stability: 0.6,
      similarityBoost: 0.9,
      style: 0.5,
      useSpeakerBoost: false
    },
    promptConfig: {
      systemPrompt: `Eres María López, una Product Manager con 6 años de experiencia en startups tecnológicas.
      Tu enfoque es comprensivo y orientado a la estrategia, evaluando habilidades de comunicación, pensamiento estratégico, y capacidad de colaboración.
      Te especializas en identificar el potencial de liderazgo y la visión de producto.`,
      interviewStyle: 'Estratégico y colaborativo, con casos de estudio reales',
      questionTypes: [
        'Estrategia de producto',
        'Investigación de usuarios',
        'Análisis de mercado',
        'Métricas y KPIs',
        'Liderazgo de equipos',
        'Comunicación stakeholders'
      ],
      evaluationCriteria: [
        'Pensamiento estratégico',
        'Habilidades de comunicación',
        'Orientación al usuario',
        'Capacidad analítica',
        'Liderazgo y colaboración'
      ]
    },
    isActive: true,
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 1,
    tags: ['product', 'strategy', 'leadership', 'startups']
  },
  {
    id: 'agent-004',
    name: 'David Kim - QA Specialist',
    description: 'Especialista en Quality Assurance con enfoque en automatización y testing. Meticuloso y técnico.',
    specialty: 'qa',
    personality: 'technical',
    experienceLevel: ['junior', 'mid', 'senior'],
    avatar: '/avatars/david-kim.jpg',
    elevenLabsAgentId: 'agent_david_kim_004',
    voiceSettings: {
      voiceId: 'ErXwobaYiN019PkySvjV',
      voiceName: 'David - Voz Clara Masculina',
      language: 'es',
      stability: 0.9,
      similarityBoost: 0.6,
      style: 0.8,
      useSpeakerBoost: true
    },
    promptConfig: {
      systemPrompt: `Eres David Kim, un especialista en QA con 7 años de experiencia en testing manual y automatizado.
      Tu enfoque es meticuloso y técnico, con expertise en testing frameworks, CI/CD, y metodologías de calidad.
      Evalúas atención al detalle, pensamiento analítico, y conocimiento de herramientas de testing.`,
      interviewStyle: 'Meticuloso y orientado a procesos, con casos prácticos',
      questionTypes: [
        'Metodologías de testing',
        'Automatización de pruebas',
        'Testing de performance',
        'Gestión de bugs',
        'CI/CD y testing',
        'Planificación de QA'
      ],
      evaluationCriteria: [
        'Conocimiento de testing frameworks',
        'Atención al detalle',
        'Pensamiento analítico',
        'Experiencia en automatización',
        'Capacidad de planificación'
      ]
    },
    isActive: true,
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 3,
    tags: ['qa', 'testing', 'automation', 'quality']
  }
]

const MOCK_TEMPLATES: AgentTemplate[] = [
  {
    id: 'template-001',
    name: 'Entrevistador Frontend Amigable',
    description: 'Plantilla para crear entrevistadores frontend con personalidad amigable',
    specialty: 'frontend',
    personality: 'friendly',
    defaultPrompt: 'Eres un entrevistador frontend especializado en React y tecnologías modernas...',
    suggestedVoice: '21m00Tcm4TlvDq8ikWAM',
    isDefault: true
  },
  {
    id: 'template-002',
    name: 'Arquitecto Backend Técnico',
    description: 'Plantilla para crear entrevistadores backend con enfoque técnico profundo',
    specialty: 'backend',
    personality: 'technical',
    defaultPrompt: 'Eres un arquitecto de software con experiencia en sistemas distribuidos...',
    suggestedVoice: 'pNInz6obpgDQGcFmaJgB',
    isDefault: true
  }
]

export class AgentManagementService {
  private baseUrl: string
  private apiKey: string
  private useMockData: boolean

  constructor(config: {
    baseUrl?: string
    apiKey?: string
    useMockData?: boolean
  } = {}) {
    this.baseUrl = config.baseUrl || process.env.NEXT_PUBLIC_BACKEND_URL || ''
    this.apiKey = config.apiKey || process.env.NEXT_PUBLIC_API_KEY || ''
    this.useMockData = config.useMockData ?? !this.baseUrl
  }

  // ======= MÉTODOS PÚBLICOS =======

  /**
   * Obtiene la lista de agentes disponibles
   */
  async getAgents(filters?: AgentSearchFilters, page = 1, pageSize = 20): Promise<AgentListResponse> {
    if (this.useMockData) {
      return this.getMockAgents(filters, page, pageSize)
    }

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...this.filtersToQueryParams(filters)
      })

      const response = await fetch(`${this.baseUrl}/api/agents?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch agents: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching agents:', error)
      // Fallback a datos mock en caso de error
      return this.getMockAgents(filters, page, pageSize)
    }
  }

  /**
   * Obtiene un agente específico por ID
   */
  async getAgent(agentId: string): Promise<Agent | null> {
    if (this.useMockData) {
      return MOCK_AGENTS.find(agent => agent.id === agentId) || null
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/agents/${agentId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(`Failed to fetch agent: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching agent:', error)
      return MOCK_AGENTS.find(agent => agent.id === agentId) || null
    }
  }

  /**
   * Crea un nuevo agente
   */
  async createAgent(agentData: CreateAgentRequest): Promise<Agent> {
    if (this.useMockData) {
      return this.createMockAgent(agentData)
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/agents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(agentData)
      })

      if (!response.ok) {
        throw new Error(`Failed to create agent: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating agent:', error)
      throw error
    }
  }

  /**
   * Actualiza un agente existente
   */
  async updateAgent(updateData: UpdateAgentRequest): Promise<Agent> {
    if (this.useMockData) {
      return this.updateMockAgent(updateData)
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/agents/${updateData.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        throw new Error(`Failed to update agent: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating agent:', error)
      throw error
    }
  }

  /**
   * Elimina un agente
   */
  async deleteAgent(agentId: string): Promise<boolean> {
    if (this.useMockData) {
      return this.deleteMockAgent(agentId)
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      return response.ok
    } catch (error) {
      console.error('Error deleting agent:', error)
      return false
    }
  }

  /**
   * Obtiene plantillas de agentes
   */
  async getAgentTemplates(): Promise<AgentTemplate[]> {
    if (this.useMockData) {
      return MOCK_TEMPLATES
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/agent-templates`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching templates:', error)
      return MOCK_TEMPLATES
    }
  }

  /**
   * Obtiene métricas de rendimiento de un agente
   */
  async getAgentMetrics(agentId: string): Promise<AgentPerformanceMetrics | null> {
    if (this.useMockData) {
      return this.getMockAgentMetrics(agentId)
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/agents/${agentId}/metrics`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(`Failed to fetch metrics: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching agent metrics:', error)
      return null
    }
  }

  // ======= MÉTODOS AUXILIARES =======

  /**
   * Convierte un agente a configuración de entrevista
   */
  agentToInterviewConfig(agent: Agent, overrides?: Partial<InterviewAgentConfig>): InterviewAgentConfig {
    return {
      agentId: agent.id,
      customPromptOverride: overrides?.customPromptOverride,
      customVoiceSettings: overrides?.customVoiceSettings,
      dynamicVariables: overrides?.dynamicVariables,
      sessionSpecificInstructions: overrides?.sessionSpecificInstructions,
      ...overrides
    }
  }

  /**
   * Busca agentes por especialidad
   */
  async getAgentsBySpecialty(specialty: AgentSpecialty): Promise<Agent[]> {
    const response = await this.getAgents({ specialty })
    return response.agents
  }

  /**
   * Obtiene agentes recomendados para un perfil de trabajo
   */
  async getRecommendedAgents(jobProfile: {
    position: string
    level: string
    specialty?: AgentSpecialty
  }): Promise<Agent[]> {
    const filters: AgentSearchFilters = {}
    
    if (jobProfile.specialty) {
      filters.specialty = jobProfile.specialty
    }
    
    // Mapear nivel de experiencia
    if (jobProfile.level) {
      const levelMap: Record<string, AgentPersonality> = {
        'junior': 'supportive',
        'mid': 'friendly',
        'senior': 'challenging'
      }
      filters.personality = levelMap[jobProfile.level.toLowerCase()]
    }

    const response = await this.getAgents(filters)
    return response.agents.slice(0, 3) // Devolver top 3 recomendados
  }

  // ======= MÉTODOS MOCK PRIVADOS =======

  private getMockAgents(filters?: AgentSearchFilters, page = 1, pageSize = 20): AgentListResponse {
    let filteredAgents = [...MOCK_AGENTS]

    // Aplicar filtros
    if (filters) {
      if (filters.specialty) {
        filteredAgents = filteredAgents.filter(agent => agent.specialty === filters.specialty)
      }
      if (filters.personality) {
        filteredAgents = filteredAgents.filter(agent => agent.personality === filters.personality)
      }
      if (filters.isActive !== undefined) {
        filteredAgents = filteredAgents.filter(agent => agent.isActive === filters.isActive)
      }
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase()
        filteredAgents = filteredAgents.filter(agent => 
          agent.name.toLowerCase().includes(term) ||
          agent.description.toLowerCase().includes(term) ||
          agent.tags?.some(tag => tag.toLowerCase().includes(term))
        )
      }
    }

    // Paginación
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedAgents = filteredAgents.slice(startIndex, endIndex)

    return {
      agents: paginatedAgents,
      total: filteredAgents.length,
      page,
      pageSize,
      hasMore: endIndex < filteredAgents.length
    }
  }

  private createMockAgent(agentData: CreateAgentRequest): Agent {
    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      ...agentData,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      elevenLabsAgentId: `agent_${agentData.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`
    }

    MOCK_AGENTS.push(newAgent)
    return newAgent
  }

  private updateMockAgent(updateData: UpdateAgentRequest): Agent {
    const agentIndex = MOCK_AGENTS.findIndex(agent => agent.id === updateData.id)
    if (agentIndex === -1) {
      throw new Error('Agent not found')
    }

    const updatedAgent = {
      ...MOCK_AGENTS[agentIndex],
      ...updateData,
      updatedAt: Date.now()
    }

    MOCK_AGENTS[agentIndex] = updatedAgent
    return updatedAgent
  }

  private deleteMockAgent(agentId: string): boolean {
    const agentIndex = MOCK_AGENTS.findIndex(agent => agent.id === agentId)
    if (agentIndex === -1) {
      return false
    }

    MOCK_AGENTS.splice(agentIndex, 1)
    return true
  }

  private getMockAgentMetrics(agentId: string): AgentPerformanceMetrics | null {
    const agent = MOCK_AGENTS.find(a => a.id === agentId)
    if (!agent) return null

    return {
      agentId,
      totalInterviews: Math.floor(Math.random() * 50) + 10,
      averageRating: Math.random() * 2 + 3, // 3-5 rating
      averageDuration: Math.floor(Math.random() * 20) + 25, // 25-45 minutes
      successRate: Math.random() * 0.3 + 0.7, // 70-100%
      mostUsedBy: [agent.specialty],
      feedbackSummary: {
        strengths: ['Conocimiento técnico sólido', 'Buena comunicación', 'Preguntas relevantes'],
        improvements: ['Más ejemplos prácticos', 'Mejor gestión del tiempo']
      }
    }
  }

  private filtersToQueryParams(filters?: AgentSearchFilters): Record<string, string> {
    if (!filters) return {}

    const params: Record<string, string> = {}
    
    if (filters.specialty) params.specialty = filters.specialty
    if (filters.personality) params.personality = filters.personality
    if (filters.experienceLevel) params.experienceLevel = filters.experienceLevel
    if (filters.isActive !== undefined) params.isActive = filters.isActive.toString()
    if (filters.searchTerm) params.search = filters.searchTerm
    if (filters.tags?.length) params.tags = filters.tags.join(',')

    return params
  }
}

// Instancia singleton para uso global
export const agentService = new AgentManagementService()

// Hook para usar en componentes React
export function useAgentService() {
  return agentService
} 