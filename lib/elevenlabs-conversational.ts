// ElevenLabs Conversational AI Integration

export interface ElevenLabsAgent {
  agent_id: string
  name: string
  description?: string
  instructions?: string
  voice_id?: string
  model_id?: string
  initial_message?: string
}

export interface ElevenLabsConversation {
  conversation_id: string
  agent_id: string
  status?: string
  created_at?: string
  updated_at?: string
}

export interface ElevenLabsMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export interface ElevenLabsConversationalResponse {
  response: string
  audio_url?: string
  conversation_id: string
  agent_id: string
  status?: string
}

export class ElevenLabsConversationalAI {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || ""
    this.baseUrl = "https://api.elevenlabs.io/v1"
  }

  // Get a specific agent by ID (from dashboard) - ENDPOINT CORRECTO
  async getAgent(agentId: string): Promise<ElevenLabsAgent | null> {
    try {
      const response = await fetch(`${this.baseUrl}/convai/agents/${agentId}`, {
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Failed to get agent: ${response.status} - ${errorText}`)
        throw new Error(`Failed to get agent: ${response.status}`)
      }

      const agent = await response.json()
      console.log("Retrieved agent:", agent)
      return agent
    } catch (error) {
      console.error("Error getting agent:", error)
      return null
    }
  }

  // Get all agents - ENDPOINT CORRECTO
  async getAgents(): Promise<ElevenLabsAgent[]> {
    try {
      const response = await fetch(`${this.baseUrl}/convai/agents`, {
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to get agents: ${response.status}`)
      }

      const data = await response.json()
      return data.agents || []
    } catch (error) {
      console.error("Error getting agents:", error)
      return []
    }
  }

  // Start a conversation simulation with an agent - ENDPOINT CORRECTO
  async createConversation(agentId: string): Promise<ElevenLabsConversation | null> {
    try {
      const response = await fetch(`${this.baseUrl}/convai/agents/${agentId}/simulate-conversation`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          simulation_specification: {
            simulated_user_config: {}
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Failed to start conversation: ${response.status} - ${errorText}`)
        throw new Error(`Failed to start conversation: ${response.status}`)
      }

      const conversation = await response.json()
      console.log("Started conversation:", conversation)
      return conversation
    } catch (error) {
      console.error("Error creating conversation:", error)
      return null
    }
  }

  // Send a message in the conversation simulation - ENDPOINT CORRECTO
  async sendMessage(
    conversationId: string, 
    message: string
  ): Promise<ElevenLabsConversationalResponse | null> {
    try {
      // For simulated conversation, we might need to use a different approach
      // This might need to be adjusted based on the actual API response structure
      const response = await fetch(`${this.baseUrl}/convai/conversations/${conversationId}/send-message`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Failed to send message: ${response.status} - ${errorText}`)
        throw new Error(`Failed to send message: ${response.status}`)
      }

      const result = await response.json()
      console.log("Message response:", result)
      return {
        response: result.message || result.response || result.text || "",
        conversation_id: conversationId,
        agent_id: result.agent_id || "",
        audio_url: result.audio_url,
        status: result.status
      }
    } catch (error) {
      console.error("Error sending message:", error)
      return null
    }
  }

  // Get conversation details - MANTIENE ENDPOINT ORIGINAL
  async getConversation(conversationId: string): Promise<ElevenLabsConversation | null> {
    try {
      const response = await fetch(`${this.baseUrl}/convai/conversations/${conversationId}`, {
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to get conversation: ${response.status}`)
      }

      const conversation = await response.json()
      return conversation
    } catch (error) {
      console.error("Error getting conversation:", error)
      return null
    }
  }

  // List all conversations - MANTIENE ENDPOINT ORIGINAL
  async getConversations(): Promise<ElevenLabsConversation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/convai/conversations`, {
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to get conversations: ${response.status}`)
      }

      const data = await response.json()
      return data.conversations || []
    } catch (error) {
      console.error("Error getting conversations:", error)
      return []
    }
  }

  // Delete a conversation - MANTIENE ENDPOINT ORIGINAL
  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/convai/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      })

      return response.ok
    } catch (error) {
      console.error("Error deleting conversation:", error)
      return false
    }
  }

  // Get conversation audio (if available) - MANTIENE ENDPOINT ORIGINAL
  async getConversationAudio(conversationId: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/convai/conversations/${conversationId}/audio`, {
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to get conversation audio: ${response.status}`)
      }

      const data = await response.json()
      return data.audio_url || null
    } catch (error) {
      console.error("Error getting conversation audio:", error)
      return null
    }
  }

  // Send feedback about a conversation - MANTIENE ENDPOINT ORIGINAL
  async sendConversationFeedback(
    conversationId: string, 
    feedback: {
      rating?: number
      comment?: string
      helpful?: boolean
    }
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/convai/conversations/${conversationId}/feedback`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedback)
      })

      return response.ok
    } catch (error) {
      console.error("Error sending feedback:", error)
      return false
    }
  }
}

export const elevenLabsConversational = new ElevenLabsConversationalAI() 