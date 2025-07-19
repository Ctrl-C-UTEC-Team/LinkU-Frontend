"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Mic, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { RealtimeConversation } from "@/components/realtime-conversation"

export default function VoiceChatPage() {
  const router = useRouter()
  const [agentId, setAgentId] = useState("agent_01k0hgmx13e0htbvt8k8bp6gwy") // Default agent ID
  const [showSettings, setShowSettings] = useState(false)
  const [config, setConfig] = useState({
    prompt: "You are a helpful customer support agent named Alexis.",
    firstMessage: "Hi, I'm Alexis from ElevenLabs support. How can I help you today?",
    language: "en",
    voiceId: "21m00Tcm4TlvDq8ikWAM",
    temperature: 0.7,
    maxTokens: 150
  })

  const handleConfigChange = (key: string, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Mic className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Real-time Voice Chat
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Have a live conversation with an AI agent
              </p>
            </div>
          </div>

          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Conversation Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Agent ID</label>
                <Input
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="Enter agent ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Voice ID</label>
                <Input
                  value={config.voiceId}
                  onChange={(e) => handleConfigChange('voiceId', e.target.value)}
                  placeholder="Enter voice ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select 
                  value={config.language} 
                  onChange={(e) => handleConfigChange('language', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Temperature</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={config.temperature}
                  onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">System Prompt</label>
                <textarea
                  value={config.prompt}
                  onChange={(e) => handleConfigChange('prompt', e.target.value)}
                  className="w-full p-2 border rounded-md resize-none"
                  rows={3}
                  placeholder="Enter system prompt for the agent"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">First Message</label>
                <Input
                  value={config.firstMessage}
                  onChange={(e) => handleConfigChange('firstMessage', e.target.value)}
                  placeholder="Agent's opening message"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Main Conversation Component */}
        <RealtimeConversation 
          agentId={agentId}
          config={config}
        />

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Features Card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✅ Real-time audio streaming</li>
              <li>✅ Voice Activity Detection (VAD)</li>
              <li>✅ Live transcription</li>
              <li>✅ Natural conversation flow</li>
              <li>✅ Interruption handling</li>
              <li>✅ Multiple languages support</li>
              <li>✅ Fallback text messaging</li>
            </ul>
          </Card>

          {/* Technical Info Card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Technical Details</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><strong>WebSocket:</strong> wss://api.elevenlabs.io/v1/convai/conversation</li>
              <li><strong>Audio Format:</strong> PCM 16kHz Mono</li>
              <li><strong>Protocol:</strong> ElevenLabs Conversational AI</li>
              <li><strong>Latency:</strong> ~200-500ms end-to-end</li>
              <li><strong>Browser Support:</strong> Modern browsers with WebRTC</li>
              <li><strong>Permissions:</strong> Microphone access required</li>
            </ul>
          </Card>
        </div>

        {/* Usage Instructions */}
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">How to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-medium mb-2">Configure Agent</h4>
              <p className="text-sm text-muted-foreground">
                Set up your agent ID and conversation parameters in the settings panel.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h4 className="font-medium mb-2">Connect</h4>
              <p className="text-sm text-muted-foreground">
                Click the "Connect" button to establish a WebSocket connection with the AI agent.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h4 className="font-medium mb-2">Start Recording</h4>
              <p className="text-sm text-muted-foreground">
                Allow microphone access and click "Start Recording" to begin speaking.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-orange-600 font-bold">4</span>
              </div>
              <h4 className="font-medium mb-2">Converse</h4>
              <p className="text-sm text-muted-foreground">
                Have a natural conversation! The AI will respond with voice automatically.
              </p>
            </div>
          </div>
        </Card>

        {/* Requirements */}
        <Card className="p-6 mt-6 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
          <h3 className="text-lg font-semibold mb-4 text-yellow-800 dark:text-yellow-200">
            Requirements
          </h3>
          <ul className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
            <li>• Valid ElevenLabs API key (set in environment variables)</li>
            <li>• Agent ID from your ElevenLabs dashboard</li>
            <li>• Modern browser with WebRTC support</li>
            <li>• Microphone permissions</li>
            <li>• Stable internet connection</li>
          </ul>
        </Card>
      </div>
    </div>
  )
} 