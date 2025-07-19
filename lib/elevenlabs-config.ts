// ElevenLabs Configuration and API Integration

export interface ElevenLabsConfig {
  apiKey: string
  voiceId?: string
  modelId?: string
  baseUrl: string
}

export interface ElevenLabsVoice {
  voice_id: string
  name: string
  samples?: any[]
  category: string
  fine_tuning?: any
  labels?: Record<string, string>
  description?: string
  preview_url?: string
  available_for_tiers?: string[]
  settings?: any
  sharing?: any
  high_quality_base_model_ids?: string[]
  safety_control?: any
  safety_control_status?: string
  safety_control_status_message?: string
}

export interface ElevenLabsTTSRequest {
  text: string
  model_id?: string
  voice_settings?: {
    stability?: number
    similarity_boost?: number
    style?: number
    use_speaker_boost?: boolean
  }
}

export interface ElevenLabsTTSResponse {
  audio: ArrayBuffer
  content_type: string
}

// Default configuration - uses environment variables
export const ELEVENLABS_CONFIG: ElevenLabsConfig = {
  apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || "",
  voiceId: process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM", // Default voice ID
  modelId: "eleven_multilingual_v2", // Best for Spanish
  baseUrl: "https://api.elevenlabs.io/v1"
}

// Get configuration from localStorage (client-side only)
export const getElevenLabsConfig = (): ElevenLabsConfig => {
  if (typeof window === 'undefined') {
    return ELEVENLABS_CONFIG
  }

  const savedApiKey = localStorage.getItem("elevenlabs_api_key")
  const savedVoiceId = localStorage.getItem("elevenlabs_voice_id")

  return {
    apiKey: savedApiKey || ELEVENLABS_CONFIG.apiKey,
    voiceId: savedVoiceId || ELEVENLABS_CONFIG.voiceId,
    modelId: ELEVENLABS_CONFIG.modelId,
    baseUrl: ELEVENLABS_CONFIG.baseUrl
  }
}

// Available Spanish voices in ElevenLabs (you can choose one)
export const SPANISH_VOICES = {
  // Professional female voices
  "Sarah": "21m00Tcm4TlvDq8ikWAM", // Rachel - Professional
  "Maria": "EXAVITQu4vr4xnSDxMaL", // Bella - Warm and friendly
  "Ana": "AZnzlk1XvdvUeBnXmlld", // Domi - Clear and articulate
  "Isabella": "pNInz6obpgDQGcFmaJgB", // Adam - Professional
  "Carmen": "yoZ06aMxZJJ28mfd3POQ", // Josh - Warm
}

export class ElevenLabsAPI {
  private config: ElevenLabsConfig

  constructor(config?: ElevenLabsConfig) {
    this.config = config || getElevenLabsConfig()
  }

  async getVoices(): Promise<ElevenLabsVoice[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.config.apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`)
      }

      const data = await response.json()
      return data.voices || []
    } catch (error) {
      console.error('Error fetching ElevenLabs voices:', error)
      return []
    }
  }

  async textToSpeech(text: string, voiceId?: string): Promise<ArrayBuffer | null> {
    try {
      const targetVoiceId = voiceId || this.config.voiceId
      
      if (!targetVoiceId) {
        throw new Error('No voice ID provided')
      }

      const requestBody: ElevenLabsTTSRequest = {
        text,
        model_id: this.config.modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      }

      const response = await fetch(
        `${this.config.baseUrl}/text-to-speech/${targetVoiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': this.config.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`TTS request failed: ${response.status} - ${errorText}`)
      }

      return await response.arrayBuffer()
    } catch (error) {
      console.error('Error in ElevenLabs TTS:', error)
      return null
    }
  }

  async createSarahUtterance(text: string): Promise<HTMLAudioElement | null> {
    try {
      const audioBuffer = await this.textToSpeech(text)
      
      if (!audioBuffer) {
        return null
      }

      // Convert ArrayBuffer to Blob
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
      const audioUrl = URL.createObjectURL(blob)
      
      // Create audio element
      const audio = new Audio(audioUrl)
      
      // Clean up URL when audio is loaded
      audio.onloadeddata = () => {
        URL.revokeObjectURL(audioUrl)
      }

      return audio
    } catch (error) {
      console.error('Error creating Sarah utterance:', error)
      return null
    }
  }
}

// Helper function to get the best Spanish voice
export async function getBestSpanishVoice(apiKey: string): Promise<string | null> {
  try {
    const api = new ElevenLabsAPI({ ...ELEVENLABS_CONFIG, apiKey })
    const voices = await api.getVoices()
    
    // Look for Spanish voices
    const spanishVoices = voices.filter(voice => 
      voice.labels?.language === 'spanish' ||
      voice.name.toLowerCase().includes('spanish') ||
      voice.name.toLowerCase().includes('español')
    )

    if (spanishVoices.length > 0) {
      return spanishVoices[0].voice_id
    }

    // Fallback to any available voice
    if (voices.length > 0) {
      return voices[0].voice_id
    }

    return null
  } catch (error) {
    console.error('Error getting Spanish voice:', error)
    return null
  }
}

// Export default instance
export const elevenLabsAPI = new ElevenLabsAPI() 